import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const bankAccountsRouter = createTRPCRouter({
  // Listar contas bancárias
  list: tenantProcedure
    .input(z.object({
      search: z.string().optional(),
      includeInactive: z.boolean().default(false),
      accountType: z.enum(["CHECKING", "SAVINGS", "INVESTMENT", "CASH"]).optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { search, includeInactive, accountType } = input || {};

      const where: Prisma.BankAccountWhereInput = {
        ...tenantFilter(ctx.companyId),
        ...(search && {
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
            { bankName: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(!includeInactive && { isActive: true }),
        ...(accountType && { accountType }),
      };

      const accounts = await ctx.prisma.bankAccount.findMany({
        where,
        orderBy: [{ isDefault: "desc" }, { code: "asc" }],
      });

      return accounts;
    }),

  // Buscar por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const account = await ctx.prisma.bankAccount.findUnique({
        where: { id: input.id, ...tenantFilter(ctx.companyId) },
        include: {
          _count: { select: { transactions: true } },
        },
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conta bancária não encontrada" });
      }

      return account;
    }),

  // Criar conta bancária
  create: tenantProcedure
    .input(z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      bankCode: z.string().optional(),
      bankName: z.string().optional(),
      agency: z.string().optional(),
      agencyDigit: z.string().optional(),
      accountNumber: z.string().optional(),
      accountDigit: z.string().optional(),
      accountType: z.enum(["CHECKING", "SAVINGS", "INVESTMENT", "CASH"]).default("CHECKING"),
      initialBalance: z.number().default(0),
      creditLimit: z.number().optional(),
      isDefault: z.boolean().default(false),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar código único
      const existing = await ctx.prisma.bankAccount.findFirst({
        where: { code: input.code, ...tenantFilter(ctx.companyId) },
      });

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Código já existe" });
      }

      // Se for default, remover default das outras
      if (input.isDefault) {
        await ctx.prisma.bankAccount.updateMany({
          where: { ...tenantFilter(ctx.companyId), isDefault: true },
          data: { isDefault: false },
        });
      }

      const account = await ctx.prisma.bankAccount.create({
        data: {
          ...input,
          currentBalance: input.initialBalance,
          companyId: ctx.companyId,
        },
      });

      return account;
    }),

  // Atualizar conta bancária
  update: tenantProcedure
    .input(z.object({
      id: z.string(),
      code: z.string().min(1).optional(),
      name: z.string().min(1).optional(),
      bankCode: z.string().optional(),
      bankName: z.string().optional(),
      agency: z.string().optional(),
      agencyDigit: z.string().optional(),
      accountNumber: z.string().optional(),
      accountDigit: z.string().optional(),
      accountType: z.enum(["CHECKING", "SAVINGS", "INVESTMENT", "CASH"]).optional(),
      creditLimit: z.number().optional(),
      isDefault: z.boolean().optional(),
      isActive: z.boolean().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      // Se for default, remover default das outras
      if (data.isDefault) {
        await ctx.prisma.bankAccount.updateMany({
          where: { ...tenantFilter(ctx.companyId), isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      const account = await ctx.prisma.bankAccount.update({
        where: { id, ...tenantFilter(ctx.companyId) },
        data,
      });

      return account;
    }),

  // Saldo atual
  balance: tenantProcedure
    .query(async ({ ctx }) => {
      const accounts = await ctx.prisma.bankAccount.findMany({
        where: { ...tenantFilter(ctx.companyId), isActive: true },
        select: { id: true, code: true, name: true, currentBalance: true, accountType: true },
      });

      const total = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

      return { accounts, total };
    }),

  // Extrato de transações
  transactions: tenantProcedure
    .input(z.object({
      accountId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      page: z.number().default(1),
      limit: z.number().default(50),
    }))
    .query(async ({ input, ctx }) => {
      const { accountId, startDate, endDate, page, limit } = input;

      const where: Prisma.BankTransactionWhereInput = {
        bankAccountId: accountId,
        ...(startDate && { transactionDate: { gte: startDate } }),
        ...(endDate && { transactionDate: { lte: endDate } }),
      };

      const [transactions, total] = await Promise.all([
        ctx.prisma.bankTransaction.findMany({
          where,
          include: {
            payable: { select: { id: true, code: true, description: true } },
            receivable: { select: { id: true, code: true, description: true } },
          },
          orderBy: { transactionDate: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.bankTransaction.count({ where }),
      ]);

      return { transactions, total, pages: Math.ceil(total / limit) };
    }),

  // Registrar transação manual
  createTransaction: tenantProcedure
    .input(z.object({
      bankAccountId: z.string(),
      transactionDate: z.date(),
      type: z.enum(["CREDIT", "DEBIT", "TRANSFER_IN", "TRANSFER_OUT", "FEE", "INTEREST", "ADJUSTMENT"]),
      description: z.string().min(1),
      value: z.number(),
      documentNumber: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const account = await ctx.prisma.bankAccount.findUnique({
        where: { id: input.bankAccountId },
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conta não encontrada" });
      }

      // Calcular novo saldo
      const isCredit = ["CREDIT", "TRANSFER_IN", "INTEREST"].includes(input.type);
      const valueChange = isCredit ? input.value : -input.value;
      const newBalance = account.currentBalance + valueChange;

      // Criar transação e atualizar saldo
      const [transaction] = await ctx.prisma.$transaction([
        ctx.prisma.bankTransaction.create({
          data: {
            ...input,
            value: Math.abs(input.value),
            balanceAfter: newBalance,
            createdBy: ctx.tenant.userId,
          },
        }),
        ctx.prisma.bankAccount.update({
          where: { id: input.bankAccountId },
          data: { currentBalance: newBalance },
        }),
      ]);

      return transaction;
    }),

  // Conciliar transação
  reconcile: tenantProcedure
    .input(z.object({
      transactionId: z.string(),
      reconciled: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const transaction = await ctx.prisma.bankTransaction.update({
        where: { id: input.transactionId },
        data: {
          reconciled: input.reconciled,
          reconciledAt: input.reconciled ? new Date() : null,
          reconciledBy: input.reconciled ? ctx.tenant.userId : null,
        },
      });

      return transaction;
    }),
});
