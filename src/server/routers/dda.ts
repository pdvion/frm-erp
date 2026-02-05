/**
 * Router tRPC para DDA - Débito Direto Autorizado
 * 
 * @see VIO-377 - Módulo Financeiro Completo
 */

import { z } from "zod";
import { createTRPCRouter, tenantProcedure, sensitiveProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";

export const ddaRouter = createTRPCRouter({
  /**
   * Lista boletos DDA
   */
  list: tenantProcedure
    .input(z.object({
      status: z.enum(["PENDENTE", "APROVADO", "REJEITADO", "PAGO", "VENCIDO", "CANCELADO"]).optional(),
      dataInicio: z.date().optional(),
      dataFim: z.date().optional(),
      cedenteCnpj: z.string().optional(),
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const where: Prisma.DdaBoletoWhereInput = {
        companyId: ctx.companyId,
        ...(input.status && { status: input.status }),
        ...(input.cedenteCnpj && { cedenteCnpj: { contains: input.cedenteCnpj } }),
        ...(input.dataInicio && { dataVencimento: { gte: input.dataInicio } }),
        ...(input.dataFim && { dataVencimento: { lte: input.dataFim } }),
        ...(input.search && {
          OR: [
            { cedenteNome: { contains: input.search, mode: "insensitive" as Prisma.QueryMode } },
            { nossoNumero: { contains: input.search } },
            { codigoBarras: { contains: input.search } },
          ],
        }),
      };

      const [boletos, total, stats] = await Promise.all([
        ctx.prisma.ddaBoleto.findMany({
          where,
          include: {
            supplier: { select: { id: true, companyName: true, tradeName: true } },
            accountsPayable: { select: { id: true, code: true, status: true } },
          },
          orderBy: { dataVencimento: "asc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.prisma.ddaBoleto.count({ where }),
        ctx.prisma.ddaBoleto.groupBy({
          by: ["status"],
          where: { companyId: ctx.companyId },
          _count: true,
          _sum: { valorFinal: true },
        }),
      ]);

      const statsMap = stats.reduce((acc, s) => {
        if (s.status) {
          acc[s.status] = { count: s._count, total: Number(s._sum?.valorFinal || 0) };
        }
        return acc;
      }, {} as Record<string, { count: number; total: number }>);

      return {
        boletos,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
        stats: {
          pendentes: statsMap.PENDENTE || { count: 0, total: 0 },
          aprovados: statsMap.APROVADO || { count: 0, total: 0 },
          pagos: statsMap.PAGO || { count: 0, total: 0 },
          vencidos: statsMap.VENCIDO || { count: 0, total: 0 },
        },
      };
    }),

  /**
   * Buscar boleto por ID
   */
  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const boleto = await ctx.prisma.ddaBoleto.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          supplier: true,
          accountsPayable: { include: { supplier: true } },
        },
      });

      if (!boleto) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Boleto não encontrado" });
      }

      return boleto;
    }),

  /**
   * Criar boleto manualmente
   */
  create: tenantProcedure
    .input(z.object({
      codigoBarras: z.string().optional(),
      linhaDigitavel: z.string().optional(),
      nossoNumero: z.string().optional(),
      valorOriginal: z.number(),
      valorFinal: z.number(),
      dataVencimento: z.date(),
      dataEmissao: z.date().optional(),
      cedenteCnpj: z.string().optional(),
      cedenteNome: z.string().optional(),
      cedenteBanco: z.string().optional(),
      supplierId: z.string().optional(),
      accountsPayableId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const boleto = await ctx.prisma.ddaBoleto.create({
        data: {
          companyId: ctx.companyId,
          codigoBarras: input.codigoBarras,
          linhaDigitavel: input.linhaDigitavel,
          nossoNumero: input.nossoNumero,
          valorOriginal: input.valorOriginal,
          valorFinal: input.valorFinal,
          dataVencimento: input.dataVencimento,
          dataEmissao: input.dataEmissao,
          cedenteCnpj: input.cedenteCnpj,
          cedenteNome: input.cedenteNome,
          cedenteBanco: input.cedenteBanco,
          supplierId: input.supplierId,
          accountsPayableId: input.accountsPayableId,
          origem: "MANUAL",
          createdBy: ctx.tenant.userId,
        },
      });

      return boleto;
    }),

  /**
   * Aprovar boleto
   */
  aprovar: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const boleto = await ctx.prisma.ddaBoleto.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!boleto) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Boleto não encontrado" });
      }

      if (boleto.status !== "PENDENTE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Boleto não está pendente" });
      }

      const updated = await ctx.prisma.ddaBoleto.update({
        where: { id: input.id },
        data: {
          status: "APROVADO",
          aprovadoPor: ctx.tenant.userId,
          aprovadoEm: new Date(),
        },
      });

      return updated;
    }),

  /**
   * Rejeitar boleto
   */
  rejeitar: tenantProcedure
    .input(z.object({
      id: z.string(),
      motivo: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const boleto = await ctx.prisma.ddaBoleto.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!boleto) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Boleto não encontrado" });
      }

      const updated = await ctx.prisma.ddaBoleto.update({
        where: { id: input.id },
        data: {
          status: "REJEITADO",
          motivoRejeicao: input.motivo,
          aprovadoPor: ctx.tenant.userId,
          aprovadoEm: new Date(),
        },
      });

      return updated;
    }),

  /**
   * Marcar como pago
   */
  marcarPago: tenantProcedure
    .input(z.object({
      id: z.string(),
      comprovanteUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const boleto = await ctx.prisma.ddaBoleto.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!boleto) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Boleto não encontrado" });
      }

      if (boleto.status !== "APROVADO") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Boleto precisa estar aprovado" });
      }

      const updated = await ctx.prisma.ddaBoleto.update({
        where: { id: input.id },
        data: {
          status: "PAGO",
          pagoEm: new Date(),
          comprovanteUrl: input.comprovanteUrl,
        },
      });

      // Se vinculado a conta a pagar, atualizar status
      if (boleto.accountsPayableId) {
        await ctx.prisma.accountsPayable.update({
          where: { id: boleto.accountsPayableId },
          data: {
            status: "PAID",
            paidAt: new Date(),
            paidValue: Number(boleto.valorFinal),
          },
        });
      }

      return updated;
    }),

  /**
   * Vincular boleto a fornecedor
   */
  vincularFornecedor: tenantProcedure
    .input(z.object({
      id: z.string(),
      supplierId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const boleto = await ctx.prisma.ddaBoleto.update({
        where: { id: input.id },
        data: { supplierId: input.supplierId },
        include: { supplier: true },
      });

      return boleto;
    }),

  /**
   * Vincular boleto a conta a pagar
   */
  vincularContaPagar: tenantProcedure
    .input(z.object({
      id: z.string(),
      accountsPayableId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const boleto = await ctx.prisma.ddaBoleto.update({
        where: { id: input.id },
        data: { accountsPayableId: input.accountsPayableId },
        include: { accountsPayable: true },
      });

      return boleto;
    }),

  /**
   * Criar conta a pagar a partir do boleto
   */
  criarContaPagar: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const boleto = await ctx.prisma.ddaBoleto.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: { supplier: true },
      });

      if (!boleto) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Boleto não encontrado" });
      }

      if (boleto.accountsPayableId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Boleto já vinculado a conta a pagar" });
      }

      // Buscar próximo código
      const lastPayable = await ctx.prisma.accountsPayable.findFirst({
        where: { companyId: ctx.companyId },
        orderBy: { code: "desc" },
      });
      const nextCode = (lastPayable?.code || 0) + 1;

      // Criar conta a pagar
      const payable = await ctx.prisma.accountsPayable.create({
        data: {
          code: nextCode,
          companyId: ctx.companyId,
          supplierId: boleto.supplierId || "",
          description: `Boleto DDA - ${boleto.cedenteNome || "Sem cedente"}`,
          dueDate: boleto.dataVencimento,
          issueDate: boleto.dataEmissao || new Date(),
          originalValue: Number(boleto.valorOriginal),
          netValue: Number(boleto.valorFinal),
          barcode: boleto.codigoBarras || undefined,
          documentType: "INVOICE",
          status: "PENDING",
        },
      });

      // Vincular boleto à conta a pagar
      await ctx.prisma.ddaBoleto.update({
        where: { id: input.id },
        data: { accountsPayableId: payable.id },
      });

      return payable;
    }),

  // =========================================================================
  // CONFIGURAÇÃO DDA
  // =========================================================================

  /**
   * Listar configurações DDA
   */
  listConfigs: tenantProcedure
    .query(async ({ ctx }) => {
      const configs = await ctx.prisma.ddaConfig.findMany({
        where: { companyId: ctx.companyId },
        orderBy: { bancoCodigo: "asc" },
      });

      return configs;
    }),

  /**
   * Salvar configuração DDA
   */
  saveConfig: sensitiveProcedure
    .input(z.object({
      id: z.string().optional(),
      bancoCodigo: z.string(),
      bancoNome: z.string().optional(),
      agencia: z.string().optional(),
      conta: z.string().optional(),
      convenio: z.string().optional(),
      ambiente: z.enum(["HOMOLOGACAO", "PRODUCAO"]).default("HOMOLOGACAO"),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      ativo: z.boolean().default(true),
      autoAprovarAte: z.number().default(0),
      notificarNovos: z.boolean().default(true),
      emailNotificacao: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (input.id) {
        // Atualizar
        const config = await ctx.prisma.ddaConfig.update({
          where: { id: input.id },
          data: {
            bancoNome: input.bancoNome,
            agencia: input.agencia,
            conta: input.conta,
            convenio: input.convenio,
            ambiente: input.ambiente,
            clientId: input.clientId,
            clientSecret: input.clientSecret,
            ativo: input.ativo,
            autoAprovarAte: input.autoAprovarAte,
            notificarNovos: input.notificarNovos,
            emailNotificacao: input.emailNotificacao,
          },
        });
        return config;
      }

      // Criar
      const config = await ctx.prisma.ddaConfig.create({
        data: {
          companyId: ctx.companyId,
          bancoCodigo: input.bancoCodigo,
          bancoNome: input.bancoNome,
          agencia: input.agencia,
          conta: input.conta,
          convenio: input.convenio,
          ambiente: input.ambiente,
          clientId: input.clientId,
          clientSecret: input.clientSecret,
          ativo: input.ativo,
          autoAprovarAte: input.autoAprovarAte,
          notificarNovos: input.notificarNovos,
          emailNotificacao: input.emailNotificacao,
        },
      });

      return config;
    }),

  /**
   * Excluir configuração DDA
   */
  deleteConfig: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.ddaConfig.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // =========================================================================
  // DASHBOARD / ESTATÍSTICAS
  // =========================================================================

  /**
   * Dashboard DDA
   */
  dashboard: tenantProcedure
    .query(async ({ ctx }) => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      const em7dias = new Date(hoje);
      em7dias.setDate(em7dias.getDate() + 7);

      const [
        totalPendentes,
        vencendoHoje,
        vencendoSemana,
        vencidos,
        valorPendente,
        ultimaSincronizacao,
      ] = await Promise.all([
        ctx.prisma.ddaBoleto.count({
          where: { companyId: ctx.companyId, status: "PENDENTE" },
        }),
        ctx.prisma.ddaBoleto.count({
          where: {
            companyId: ctx.companyId,
            status: "PENDENTE",
            dataVencimento: { gte: hoje, lt: amanha },
          },
        }),
        ctx.prisma.ddaBoleto.count({
          where: {
            companyId: ctx.companyId,
            status: "PENDENTE",
            dataVencimento: { gte: hoje, lte: em7dias },
          },
        }),
        ctx.prisma.ddaBoleto.count({
          where: {
            companyId: ctx.companyId,
            status: "PENDENTE",
            dataVencimento: { lt: hoje },
          },
        }),
        ctx.prisma.ddaBoleto.aggregate({
          where: { companyId: ctx.companyId, status: "PENDENTE" },
          _sum: { valorFinal: true },
        }),
        ctx.prisma.ddaConfig.findFirst({
          where: { companyId: ctx.companyId, ativo: true },
          select: { ultimaSincronizacao: true },
          orderBy: { ultimaSincronizacao: "desc" },
        }),
      ]);

      return {
        totalPendentes,
        vencendoHoje,
        vencendoSemana,
        vencidos,
        valorPendente: Number(valorPendente._sum?.valorFinal || 0),
        ultimaSincronizacao: ultimaSincronizacao?.ultimaSincronizacao,
      };
    }),
});
