import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { parseOFX, ofxTypeToSystemType } from "@/lib/ofx-parser";

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
        ...tenantFilter(ctx.companyId, false),
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
        where: { id: input.id, ...tenantFilter(ctx.companyId, false) },
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
        where: { code: input.code, ...tenantFilter(ctx.companyId, false) },
      });

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Código já existe" });
      }

      // Se for default, remover default das outras
      if (input.isDefault) {
        await ctx.prisma.bankAccount.updateMany({
          where: { ...tenantFilter(ctx.companyId, false), isDefault: true },
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
          where: { ...tenantFilter(ctx.companyId, false), isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      const account = await ctx.prisma.bankAccount.update({
        where: { id, ...tenantFilter(ctx.companyId, false) },
        data,
      });

      return account;
    }),

  // Saldo atual
  balance: tenantProcedure
    .query(async ({ ctx }) => {
      const accounts = await ctx.prisma.bankAccount.findMany({
        where: { ...tenantFilter(ctx.companyId, false), isActive: true },
        select: { id: true, code: true, name: true, currentBalance: true, accountType: true },
      });

      const total = accounts.reduce((sum, acc) => Number(sum) + Number(acc.currentBalance), 0);

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
      const newBalance = Number(account.currentBalance) + valueChange;

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

  // Transferência entre contas
  transfer: tenantProcedure
    .input(z.object({
      fromAccountId: z.string(),
      toAccountId: z.string(),
      value: z.number().positive(),
      transferDate: z.date(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [fromAccount, toAccount] = await Promise.all([
        ctx.prisma.bankAccount.findUnique({ where: { id: input.fromAccountId } }),
        ctx.prisma.bankAccount.findUnique({ where: { id: input.toAccountId } }),
      ]);

      if (!fromAccount || !toAccount) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conta não encontrada" });
      }

      const newFromBalance = Number(fromAccount.currentBalance) - Number(input.value);
      const newToBalance = Number(toAccount.currentBalance) + Number(input.value);
      const desc = input.description || `Transferência para ${toAccount.name}`;

      const [outTransaction] = await ctx.prisma.$transaction([
        ctx.prisma.bankTransaction.create({
          data: {
            bankAccountId: input.fromAccountId,
            transactionDate: input.transferDate,
            type: "TRANSFER_OUT",
            description: desc,
            value: input.value,
            balanceAfter: newFromBalance,
            createdBy: ctx.tenant.userId,
          },
        }),
        ctx.prisma.bankTransaction.create({
          data: {
            bankAccountId: input.toAccountId,
            transactionDate: input.transferDate,
            type: "TRANSFER_IN",
            description: `Transferência de ${fromAccount.name}`,
            value: input.value,
            balanceAfter: newToBalance,
            createdBy: ctx.tenant.userId,
          },
        }),
        ctx.prisma.bankAccount.update({
          where: { id: input.fromAccountId },
          data: { currentBalance: newFromBalance },
        }),
        ctx.prisma.bankAccount.update({
          where: { id: input.toAccountId },
          data: { currentBalance: newToBalance },
        }),
      ]);

      return outTransaction;
    }),

  // Fluxo de caixa projetado
  cashFlow: tenantProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
      groupBy: z.enum(["day", "week", "month"]).default("day"),
    }))
    .query(async ({ input, ctx }) => {
      const { startDate, endDate } = input;

      // Saldo atual
      const accounts = await ctx.prisma.bankAccount.findMany({
        where: { ...tenantFilter(ctx.companyId, false), isActive: true },
        select: { currentBalance: true },
      });
      const currentBalance = accounts.reduce((sum, a) => Number(sum) + Number(a.currentBalance), 0);

      // Contas a pagar no período
      const payables = await ctx.prisma.accountsPayable.findMany({
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: { in: ["PENDING", "PARTIAL"] },
          dueDate: { gte: startDate, lte: endDate },
        },
        select: { dueDate: true, netValue: true, paidValue: true },
      });

      // Contas a receber no período
      const receivables = await ctx.prisma.accountsReceivable.findMany({
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: { in: ["PENDING", "PARTIAL"] },
          dueDate: { gte: startDate, lte: endDate },
        },
        select: { dueDate: true, netValue: true, paidValue: true },
      });

      // Agrupar por data
      const flowByDate = new Map<string, { date: string; inflow: number; outflow: number; balance: number }>();
      
      const current = new Date(startDate);
      
      while (current <= endDate) {
        const dateKey = current.toISOString().split("T")[0];
        flowByDate.set(dateKey, { date: dateKey, inflow: 0, outflow: 0, balance: currentBalance });
        current.setDate(current.getDate() + 1);
      }

      // Somar recebíveis
      for (const r of receivables) {
        const dateKey = new Date(r.dueDate).toISOString().split("T")[0];
        const entry = flowByDate.get(dateKey);
        if (entry) {
          entry.inflow += Number(r.netValue) - Number(r.paidValue);
        }
      }

      // Somar pagáveis
      for (const p of payables) {
        const dateKey = new Date(p.dueDate).toISOString().split("T")[0];
        const entry = flowByDate.get(dateKey);
        if (entry) {
          entry.outflow += Number(p.netValue) - Number(p.paidValue);
        }
      }

      // Calcular saldo acumulado
      const sortedDates = Array.from(flowByDate.keys()).sort();
      for (let i = 0; i < sortedDates.length; i++) {
        const entry = flowByDate.get(sortedDates[i])!;
        if (i === 0) {
          entry.balance = currentBalance + entry.inflow - entry.outflow;
        } else {
          const prevEntry = flowByDate.get(sortedDates[i - 1])!;
          entry.balance = prevEntry.balance + entry.inflow - entry.outflow;
        }
      }

      // Totais
      const totalInflow = Array.from(flowByDate.values()).reduce((sum, e) => sum + e.inflow, 0);
      const totalOutflow = Array.from(flowByDate.values()).reduce((sum, e) => sum + e.outflow, 0);
      const finalBalance = currentBalance + totalInflow - totalOutflow;

      return {
        currentBalance,
        totalInflow,
        totalOutflow,
        finalBalance,
        flow: Array.from(flowByDate.values()),
      };
    }),

  // Dashboard de tesouraria
  dashboard: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Saldo total
    const accounts = await ctx.prisma.bankAccount.findMany({
      where: { ...tenantFilter(ctx.companyId, false), isActive: true },
      select: { id: true, code: true, name: true, currentBalance: true, accountType: true },
    });
    const totalBalance = accounts.reduce((sum, a) => Number(sum) + Number(a.currentBalance), 0);

    // Contas a pagar próximos 7 dias
    const payablesWeek = await ctx.prisma.accountsPayable.aggregate({
      where: {
        ...tenantFilter(ctx.companyId, false),
        status: { in: ["PENDING", "PARTIAL"] },
        dueDate: { gte: today, lte: endOfWeek },
      },
      _sum: { netValue: true },
      _count: true,
    });

    // Contas a receber próximos 7 dias
    const receivablesWeek = await ctx.prisma.accountsReceivable.aggregate({
      where: {
        ...tenantFilter(ctx.companyId, false),
        status: { in: ["PENDING", "PARTIAL"] },
        dueDate: { gte: today, lte: endOfWeek },
      },
      _sum: { netValue: true },
      _count: true,
    });

    // Transações não conciliadas
    const pendingReconciliation = await ctx.prisma.bankTransaction.count({
      where: {
        bankAccount: tenantFilter(ctx.companyId, false),
        reconciled: false,
      },
    });

    // Projeção saldo fim do mês
    const payablesMonth = await ctx.prisma.accountsPayable.aggregate({
      where: {
        ...tenantFilter(ctx.companyId, false),
        status: { in: ["PENDING", "PARTIAL"] },
        dueDate: { gte: today, lte: endOfMonth },
      },
      _sum: { netValue: true },
    });

    const receivablesMonth = await ctx.prisma.accountsReceivable.aggregate({
      where: {
        ...tenantFilter(ctx.companyId, false),
        status: { in: ["PENDING", "PARTIAL"] },
        dueDate: { gte: today, lte: endOfMonth },
      },
      _sum: { netValue: true },
    });

    const projectedBalance = Number(totalBalance) 
      + (Number(receivablesMonth._sum.netValue) || 0) 
      - (Number(payablesMonth._sum.netValue) || 0);

    return {
      accounts,
      totalBalance,
      payablesWeek: {
        value: payablesWeek._sum.netValue || 0,
        count: payablesWeek._count,
      },
      receivablesWeek: {
        value: receivablesWeek._sum.netValue || 0,
        count: receivablesWeek._count,
      },
      pendingReconciliation,
      projectedBalance,
      netFlowWeek: (Number(receivablesWeek._sum.netValue) || 0) - (Number(payablesWeek._sum.netValue) || 0),
    };
  }),

  // Importar extrato OFX
  importOFX: tenantProcedure
    .input(z.object({
      bankAccountId: z.string(),
      ofxContent: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { bankAccountId, ofxContent } = input;

      // Verificar se a conta existe
      const account = await ctx.prisma.bankAccount.findUnique({
        where: { id: bankAccountId, ...tenantFilter(ctx.companyId, false) },
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conta bancária não encontrada" });
      }

      // Parsear o arquivo OFX
      const parseResult = parseOFX(ofxContent);

      if (!parseResult.success || !parseResult.statement) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: parseResult.error || "Erro ao processar arquivo OFX" 
        });
      }

      const { statement } = parseResult;

      // Buscar transações já importadas (pelo fitId)
      const existingFitIds = await ctx.prisma.bankTransaction.findMany({
        where: {
          bankAccountId,
          documentNumber: { in: statement.transactions.map(t => t.fitId) },
        },
        select: { documentNumber: true },
      });

      const existingSet = new Set(existingFitIds.map(t => t.documentNumber));

      // Filtrar transações novas
      const newTransactions = statement.transactions.filter(
        t => !existingSet.has(t.fitId)
      );

      if (newTransactions.length === 0) {
        return {
          imported: 0,
          skipped: statement.transactions.length,
          message: "Todas as transações já foram importadas anteriormente",
        };
      }

      // Calcular saldo atual
      let currentBalance = Number(account.currentBalance);

      // Criar transações em batch
      const transactionsToCreate = newTransactions.map(t => {
        const type = ofxTypeToSystemType(t.type, t.amount);
        const isCredit = ["CREDIT", "TRANSFER_IN", "INTEREST"].includes(type);
        const valueChange = isCredit ? Math.abs(t.amount) : -Math.abs(t.amount);
        currentBalance += valueChange;

        return {
          bankAccountId,
          transactionDate: t.datePosted,
          type,
          description: t.name,
          value: Math.abs(t.amount),
          balanceAfter: currentBalance,
          documentNumber: t.fitId,
          notes: t.memo || undefined,
          reconciled: false,
          createdBy: ctx.tenant.userId,
        };
      });

      // Inserir transações e atualizar saldo
      await ctx.prisma.$transaction([
        ctx.prisma.bankTransaction.createMany({
          data: transactionsToCreate,
        }),
        ctx.prisma.bankAccount.update({
          where: { id: bankAccountId },
          data: { currentBalance },
        }),
      ]);

      return {
        imported: newTransactions.length,
        skipped: statement.transactions.length - newTransactions.length,
        newBalance: currentBalance,
        period: {
          start: statement.startDate,
          end: statement.endDate,
        },
        message: `${newTransactions.length} transação(ões) importada(s) com sucesso`,
      };
    }),
});
