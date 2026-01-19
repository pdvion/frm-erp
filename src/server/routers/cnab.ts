import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { 
  generateRemessaCobranca, 
  parseRetornoCnab240, 
  extractTitulosPagos,
  validateCnab240,
  CnabConfig,
  BoletoData,
  BankCode,
  BANK_NAMES,
} from "@/lib/cnab";
import { Prisma } from "@prisma/client";

const cnabConfigSchema = z.object({
  bankCode: z.enum(["001", "033", "104", "237", "341", "756"]),
  layout: z.enum(["240", "400"]),
  agencia: z.string().min(1).max(5),
  agenciaDigito: z.string().max(1).optional(),
  conta: z.string().min(1).max(12),
  contaDigito: z.string().length(1),
  convenio: z.string().optional(),
  carteira: z.string().optional(),
  cedente: z.string().min(1),
  cedenteDocumento: z.string().min(11).max(14),
});

export const cnabRouter = createTRPCRouter({
  // Listar bancos disponíveis
  listBanks: tenantProcedure.query(() => {
    return Object.entries(BANK_NAMES).map(([code, name]) => ({
      code: code as BankCode,
      name,
    }));
  }),

  // Obter configuração CNAB da conta bancária
  getConfig: tenantProcedure
    .input(z.object({
      bankAccountId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      const account = await ctx.prisma.bankAccount.findFirst({
        where: {
          id: input.bankAccountId,
          companyId: ctx.companyId,
        },
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conta bancária não encontrada",
        });
      }

      // Buscar configuração CNAB salva
      const setting = await ctx.prisma.systemSetting.findFirst({
        where: {
          companyId: ctx.companyId,
          key: `cnab_config_${input.bankAccountId}`,
        },
      });

      return setting?.value as CnabConfig | null;
    }),

  // Salvar configuração CNAB
  saveConfig: tenantProcedure
    .input(z.object({
      bankAccountId: z.string().uuid(),
      config: cnabConfigSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar se conta existe
      const account = await ctx.prisma.bankAccount.findFirst({
        where: {
          id: input.bankAccountId,
          companyId: ctx.companyId,
        },
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conta bancária não encontrada",
        });
      }

      // Salvar configuração
      await ctx.prisma.systemSetting.upsert({
        where: {
          key_companyId: {
            key: `cnab_config_${input.bankAccountId}`,
            companyId: ctx.companyId!,
          },
        },
        create: {
          key: `cnab_config_${input.bankAccountId}`,
          category: "banking",
          companyId: ctx.companyId,
          value: input.config as unknown as Prisma.InputJsonValue,
          description: `Configuração CNAB - ${account.name}`,
          updatedBy: ctx.tenant.userId,
        },
        update: {
          value: input.config as unknown as Prisma.InputJsonValue,
          updatedBy: ctx.tenant.userId,
        },
      });

      return { success: true };
    }),

  // Gerar arquivo de remessa de cobrança
  generateRemessa: tenantProcedure
    .input(z.object({
      bankAccountId: z.string().uuid(),
      receivableIds: z.array(z.string().uuid()).min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      // Buscar configuração CNAB
      const setting = await ctx.prisma.systemSetting.findFirst({
        where: {
          companyId: ctx.companyId,
          key: `cnab_config_${input.bankAccountId}`,
        },
      });

      if (!setting?.value) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Configuração CNAB não encontrada para esta conta",
        });
      }

      const config = setting.value as unknown as CnabConfig;

      // Buscar contas a receber
      const receivables = await ctx.prisma.accountsReceivable.findMany({
        where: {
          id: { in: input.receivableIds },
          companyId: ctx.companyId,
        },
        include: {
          customer: true,
        },
      });

      if (receivables.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nenhum título encontrado",
        });
      }

      // Converter títulos para formato de boleto
      const boletos: BoletoData[] = receivables.map((rec) => ({
        id: rec.id,
        nossoNumero: String(rec.code).padStart(10, "0"),
        numeroDocumento: String(rec.code),
        dataEmissao: rec.issueDate,
        dataVencimento: rec.dueDate,
        valor: Number(rec.netValue),
        sacado: {
          nome: rec.customer?.companyName || "Cliente",
          documento: rec.customer?.cnpj || rec.customer?.cpf || "",
          endereco: rec.customer?.addressStreet || "",
          cidade: rec.customer?.addressCity || "",
          uf: rec.customer?.addressState || "SP",
          cep: rec.customer?.addressZipCode || "",
        },
      }));

      // Gerar sequencial
      const lastRemessa = await ctx.prisma.systemSetting.findFirst({
        where: {
          companyId: ctx.companyId,
          key: `cnab_seq_${input.bankAccountId}`,
        },
      });

      const sequencial = ((lastRemessa?.value as number) || 0) + 1;

      // Gerar arquivo
      const result = generateRemessaCobranca(config, boletos, sequencial);

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.errors?.join(", ") || "Erro ao gerar remessa",
        });
      }

      // Atualizar sequencial
      await ctx.prisma.systemSetting.upsert({
        where: {
          key_companyId: {
            key: `cnab_seq_${input.bankAccountId}`,
            companyId: ctx.companyId!,
          },
        },
        create: {
          key: `cnab_seq_${input.bankAccountId}`,
          category: "banking",
          companyId: ctx.companyId,
          value: sequencial,
          updatedBy: ctx.tenant.userId,
        },
        update: {
          value: sequencial,
          updatedBy: ctx.tenant.userId,
        },
      });

      // Registrar remessa no histórico
      // TODO: Criar tabela de histórico de remessas

      return {
        success: true,
        filename: result.filename,
        content: result.content,
        totalRegistros: result.totalRegistros,
        valorTotal: result.valorTotal,
      };
    }),

  // Processar arquivo de retorno
  processRetorno: tenantProcedure
    .input(z.object({
      bankAccountId: z.string().uuid(),
      content: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validar arquivo
      const validation = validateCnab240(input.content);
      if (!validation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Arquivo inválido: ${validation.errors.join(", ")}`,
        });
      }

      // Processar retorno
      const retorno = parseRetornoCnab240(input.content);

      if (!retorno.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: retorno.errors?.join(", ") || "Erro ao processar retorno",
        });
      }

      // Extrair títulos pagos
      const titulosPagos = extractTitulosPagos(retorno);

      // Baixar títulos pagos
      let baixados = 0;
      const erros: string[] = [];

      for (const titulo of titulosPagos) {
        try {
          // Buscar título pelo nosso número (code)
          const receivable = await ctx.prisma.accountsReceivable.findFirst({
            where: {
              companyId: ctx.companyId,
              code: parseInt(titulo.nossoNumero, 10),
            },
          });

          if (receivable && receivable.status !== "PAID") {
            await ctx.prisma.accountsReceivable.update({
              where: { id: receivable.id },
              data: {
                status: "PAID",
                paidValue: titulo.valorPago,
                paidAt: titulo.dataPagamento || new Date(),
              },
            });
            baixados++;
          }
        } catch (_error) {
          erros.push(`Erro ao baixar título ${titulo.nossoNumero}`);
        }
      }

      return {
        success: true,
        banco: retorno.banco,
        dataGeracao: retorno.dataGeracao,
        totalPagos: retorno.totalPagos,
        totalRejeitados: retorno.totalRejeitados,
        valorTotal: retorno.valorTotal,
        baixados,
        erros: erros.length > 0 ? erros : undefined,
      };
    }),

  // Validar arquivo CNAB
  validateFile: tenantProcedure
    .input(z.object({
      content: z.string().min(1),
    }))
    .mutation(({ input }) => {
      const validation = validateCnab240(input.content);
      return validation;
    }),
});
