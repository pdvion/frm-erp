/**
 * Router de Contabilidade
 * CRUD de Plano de Contas, Lançamentos Contábeis, Razão, Balancete e DRE.
 *
 * @see VIO-1074
 */

import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { AccountingService } from "../services/accounting";

const accountTypeEnum = z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]);
const accountNatureEnum = z.enum(["DEBIT", "CREDIT"]);
const entryItemSchema = z.object({
  accountId: z.string().uuid(),
  type: z.enum(["DEBIT", "CREDIT"]),
  amount: z.number().positive(),
  costCenterId: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const accountingRouter = createTRPCRouter({
  // ========================================================================
  // PLANO DE CONTAS
  // ========================================================================

  // Listar contas
  listAccounts: tenantProcedure
    .input(
      z.object({
        type: accountTypeEnum.optional(),
        isAnalytical: z.boolean().optional(),
        isActive: z.boolean().optional(),
        search: z.string().optional(),
        parentId: z.string().uuid().optional().nullable(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { type, isAnalytical, isActive, search, parentId } = input ?? {};

      return ctx.prisma.chartOfAccounts.findMany({
        where: {
          companyId: ctx.companyId,
          ...(type && { type }),
          ...(isAnalytical !== undefined && { isAnalytical }),
          ...(isActive !== undefined && { isActive }),
          ...(parentId !== undefined && { parentId }),
          ...(search && {
            OR: [
              { code: { contains: search } },
              { name: { contains: search, mode: "insensitive" as const } },
            ],
          }),
        },
        orderBy: { code: "asc" },
        include: {
          parent: { select: { id: true, code: true, name: true } },
          _count: { select: { children: true, entryItems: true } },
        },
      });
    }),

  // Buscar conta por ID
  getAccount: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const account = await ctx.prisma.chartOfAccounts.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          parent: { select: { id: true, code: true, name: true } },
          children: { select: { id: true, code: true, name: true, type: true, isAnalytical: true }, orderBy: { code: "asc" } },
        },
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conta não encontrada" });
      }

      return account;
    }),

  // Criar conta
  createAccount: tenantProcedure
    .input(
      z.object({
        code: z.string().min(1).max(20),
        name: z.string().min(1).max(255),
        type: accountTypeEnum,
        nature: accountNatureEnum,
        parentId: z.string().uuid().optional().nullable(),
        isAnalytical: z.boolean().default(true),
        referenceCode: z.string().max(20).optional().nullable(),
        description: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = new AccountingService(ctx.prisma);
      return service.createAccount({
        companyId: ctx.companyId,
        ...input,
      });
    }),

  // Atualizar conta
  updateAccount: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional().nullable(),
        referenceCode: z.string().max(20).optional().nullable(),
        isActive: z.boolean().optional(),
      }).refine(
        (data) => data.name !== undefined || data.description !== undefined || data.referenceCode !== undefined || data.isActive !== undefined,
        { message: "Informe ao menos um campo para atualizar" },
      )
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const account = await ctx.prisma.chartOfAccounts.findFirst({
        where: { id, companyId: ctx.companyId },
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conta não encontrada" });
      }

      return ctx.prisma.chartOfAccounts.update({
        where: { id },
        data,
      });
    }),

  // Seed plano de contas padrão
  seedDefaultAccounts: tenantProcedure
    .mutation(async ({ ctx }) => {
      // Verificar se já existem contas
      const existingCount = await ctx.prisma.chartOfAccounts.count({
        where: { companyId: ctx.companyId },
      });

      if (existingCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Já existem ${existingCount} contas cadastradas. Exclua-as antes de gerar o plano padrão.`,
        });
      }

      const service = new AccountingService(ctx.prisma);
      return service.seedDefaultChartOfAccounts(ctx.companyId);
    }),

  // ========================================================================
  // LANÇAMENTOS CONTÁBEIS
  // ========================================================================

  // Listar lançamentos
  listEntries: tenantProcedure
    .input(
      z.object({
        status: z.enum(["DRAFT", "POSTED", "REVERSED"]).optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { status, dateFrom, dateTo, search, page = 1, limit = 20 } = input ?? {};

      const where = {
        companyId: ctx.companyId,
        ...(status && { status }),
        ...(dateFrom && { date: { gte: dateFrom } }),
        ...(dateTo && { date: { ...(dateFrom ? { gte: dateFrom } : {}), lte: dateTo } }),
        ...(search && {
          OR: [
            { description: { contains: search, mode: "insensitive" as const } },
            { documentNumber: { contains: search } },
          ],
        }),
      };

      const [entries, total] = await Promise.all([
        ctx.prisma.accountingEntry.findMany({
          where,
          include: {
            items: {
              include: { account: { select: { id: true, code: true, name: true } } },
              orderBy: { sequence: "asc" },
            },
            _count: { select: { items: true } },
          },
          orderBy: [{ date: "desc" }, { code: "desc" }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.accountingEntry.count({ where }),
      ]);

      return {
        entries,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    }),

  // Buscar lançamento por ID
  getEntry: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const entry = await ctx.prisma.accountingEntry.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          items: {
            include: {
              account: { select: { id: true, code: true, name: true } },
              costCenter: { select: { id: true, code: true, name: true } },
            },
            orderBy: { sequence: "asc" },
          },
          poster: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
        },
      });

      if (!entry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lançamento não encontrado" });
      }

      return entry;
    }),

  // Criar lançamento
  createEntry: tenantProcedure
    .input(
      z.object({
        date: z.date(),
        description: z.string().min(1),
        documentType: z.string().max(50).optional().nullable(),
        documentId: z.string().uuid().optional().nullable(),
        documentNumber: z.string().max(50).optional().nullable(),
        notes: z.string().optional().nullable(),
        items: z.array(entryItemSchema).min(2, "Lançamento deve ter pelo menos 2 partidas"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = new AccountingService(ctx.prisma);
      return service.createEntry({
        companyId: ctx.companyId,
        createdBy: ctx.tenant.userId,
        ...input,
      });
    }),

  // Efetivar lançamento
  postEntry: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const service = new AccountingService(ctx.prisma);

      try {
        return await service.postEntry(input.id, ctx.tenant.userId!);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Erro ao efetivar lançamento",
        });
      }
    }),

  // Estornar lançamento
  reverseEntry: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const service = new AccountingService(ctx.prisma);

      try {
        return await service.reverseEntry(input.id, ctx.tenant.userId!);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Erro ao estornar lançamento",
        });
      }
    }),

  // ========================================================================
  // RELATÓRIOS CONTÁBEIS
  // ========================================================================

  // Razão Contábil
  getLedger: tenantProcedure
    .input(
      z.object({
        accountId: z.string().uuid(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const service = new AccountingService(ctx.prisma);

      try {
        return await service.getLedger(
          ctx.companyId,
          input.accountId,
          input.startDate,
          input.endDate,
        );
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Erro ao gerar razão",
        });
      }
    }),

  // Balancete de Verificação
  getTrialBalance: tenantProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const service = new AccountingService(ctx.prisma);
      return service.getTrialBalance(ctx.companyId, input.startDate, input.endDate);
    }),

  // DRE — Demonstração do Resultado do Exercício
  getIncomeStatement: tenantProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const service = new AccountingService(ctx.prisma);
      return service.getIncomeStatement(ctx.companyId, input.startDate, input.endDate);
    }),
});
