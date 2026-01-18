import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const receivablesRouter = createTRPCRouter({
  // Listar títulos a receber
  list: tenantProcedure
    .input(z.object({
      status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED", "WRITTEN_OFF", "ALL"]).optional(),
      customerId: z.string().optional(),
      dueDateFrom: z.date().optional(),
      dueDateTo: z.date().optional(),
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
      orderBy: z.enum(["dueDate", "netValue", "code", "createdAt"]).default("dueDate"),
      orderDir: z.enum(["asc", "desc"]).default("asc"),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { 
        status, 
        customerId, 
        dueDateFrom, 
        dueDateTo, 
        search,
        page = 1, 
        limit = 20,
        orderBy = "dueDate",
        orderDir = "asc",
      } = input || {};

      const where: Prisma.AccountsReceivableWhereInput = {
        ...tenantFilter(ctx.companyId),
      };

      if (status && status !== "ALL") {
        if (status === "OVERDUE") {
          where.status = "PENDING";
          where.dueDate = { lt: new Date() };
        } else {
          where.status = status;
        }
      }

      if (customerId) {
        where.customerId = customerId;
      }

      if (dueDateFrom || dueDateTo) {
        where.dueDate = {};
        if (dueDateFrom) where.dueDate.gte = dueDateFrom;
        if (dueDateTo) where.dueDate.lte = dueDateTo;
      }

      if (search) {
        where.OR = [
          { description: { contains: search, mode: "insensitive" as const } },
          { documentNumber: { contains: search, mode: "insensitive" as const } },
          { customer: { companyName: { contains: search, mode: "insensitive" as const } } },
        ];
      }

      const [receivables, total] = await Promise.all([
        ctx.prisma.accountsReceivable.findMany({
          where,
          include: {
            customer: {
              select: { id: true, code: true, companyName: true, tradeName: true },
            },
            _count: { select: { payments: true } },
          },
          orderBy: { [orderBy]: orderDir },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.accountsReceivable.count({ where }),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const receivablesWithOverdue = receivables.map((r) => ({
        ...r,
        isOverdue: r.status === "PENDING" && new Date(r.dueDate) < today,
        daysOverdue: r.status === "PENDING" && new Date(r.dueDate) < today
          ? Math.floor((today.getTime() - new Date(r.dueDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      }));

      return { receivables: receivablesWithOverdue, total, pages: Math.ceil(total / limit) };
    }),

  // Buscar por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const receivable = await ctx.prisma.accountsReceivable.findUnique({
        where: { id: input.id, ...tenantFilter(ctx.companyId) },
        include: {
          customer: true,
          costCenter: true,
          bankAccount: true,
          payments: {
            orderBy: { paymentDate: "desc" },
          },
        },
      });

      if (!receivable) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Título não encontrado" });
      }

      return receivable;
    }),

  // Criar título a receber
  create: tenantProcedure
    .input(z.object({
      customerId: z.string(),
      documentType: z.enum(["INVOICE", "SERVICE", "CONTRACT", "OTHER"]).default("INVOICE"),
      documentNumber: z.string().optional(),
      description: z.string().min(1),
      dueDate: z.date(),
      issueDate: z.date().optional(),
      originalValue: z.number().positive(),
      discountValue: z.number().default(0),
      installmentNumber: z.number().default(1),
      totalInstallments: z.number().default(1),
      categoryId: z.string().optional(),
      costCenterId: z.string().optional(),
      bankAccountId: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Gerar próximo código
      const lastReceivable = await ctx.prisma.accountsReceivable.findFirst({
        where: tenantFilter(ctx.companyId),
        orderBy: { code: "desc" },
        select: { code: true },
      });

      const nextCode = (lastReceivable?.code || 0) + 1;
      const netValue = input.originalValue - input.discountValue;

      const receivable = await ctx.prisma.accountsReceivable.create({
        data: {
          code: nextCode,
          ...input,
          netValue,
          companyId: ctx.companyId,
          createdBy: ctx.tenant.userId,
        },
        include: { customer: true },
      });

      return receivable;
    }),

  // Criar múltiplas parcelas
  createInstallments: tenantProcedure
    .input(z.object({
      customerId: z.string(),
      documentType: z.enum(["INVOICE", "SERVICE", "CONTRACT", "OTHER"]).default("INVOICE"),
      documentNumber: z.string().optional(),
      description: z.string().min(1),
      firstDueDate: z.date(),
      totalValue: z.number().positive(),
      installments: z.number().min(1).max(60),
      intervalDays: z.number().default(30),
      categoryId: z.string().optional(),
      costCenterId: z.string().optional(),
      bankAccountId: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { installments, totalValue, firstDueDate, intervalDays, ...baseData } = input;
      const installmentValue = totalValue / installments;

      // Gerar próximo código
      const lastReceivable = await ctx.prisma.accountsReceivable.findFirst({
        where: tenantFilter(ctx.companyId),
        orderBy: { code: "desc" },
        select: { code: true },
      });

      let nextCode = (lastReceivable?.code || 0) + 1;
      const createdReceivables = [];

      for (let i = 0; i < installments; i++) {
        const dueDate = new Date(firstDueDate);
        dueDate.setDate(dueDate.getDate() + (i * intervalDays));

        const receivable = await ctx.prisma.accountsReceivable.create({
          data: {
            code: nextCode++,
            ...baseData,
            dueDate,
            originalValue: installmentValue,
            netValue: installmentValue,
            installmentNumber: i + 1,
            totalInstallments: installments,
            companyId: ctx.companyId,
            createdBy: ctx.tenant.userId,
          },
        });

        createdReceivables.push(receivable);
      }

      return createdReceivables;
    }),

  // Registrar recebimento
  registerPayment: tenantProcedure
    .input(z.object({
      receivableId: z.string(),
      paymentDate: z.date(),
      value: z.number().positive(),
      discountValue: z.number().default(0),
      interestValue: z.number().default(0),
      fineValue: z.number().default(0),
      paymentMethod: z.string().optional(),
      bankAccountId: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const receivable = await ctx.prisma.accountsReceivable.findUnique({
        where: { id: input.receivableId },
      });

      if (!receivable) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Título não encontrado" });
      }

      if (receivable.status === "PAID" || receivable.status === "CANCELLED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Título já está pago ou cancelado" });
      }

      const totalPaid = receivable.paidValue + input.value;
      const remaining = receivable.netValue - totalPaid;
      const newStatus = remaining <= 0 ? "PAID" : "PARTIAL";

      // Criar pagamento e atualizar título
      const [payment] = await ctx.prisma.$transaction([
        ctx.prisma.receivablePayment.create({
          data: {
            receivableId: input.receivableId,
            paymentDate: input.paymentDate,
            value: input.value,
            discountValue: input.discountValue,
            interestValue: input.interestValue,
            fineValue: input.fineValue,
            paymentMethod: input.paymentMethod,
            bankAccountId: input.bankAccountId,
            notes: input.notes,
            createdBy: ctx.tenant.userId,
          },
        }),
        ctx.prisma.accountsReceivable.update({
          where: { id: input.receivableId },
          data: {
            paidValue: totalPaid,
            discountValue: receivable.discountValue + input.discountValue,
            interestValue: receivable.interestValue + input.interestValue,
            fineValue: receivable.fineValue + input.fineValue,
            status: newStatus,
            paidAt: newStatus === "PAID" ? new Date() : null,
          },
        }),
      ]);

      // Se tiver conta bancária, criar transação
      if (input.bankAccountId) {
        const bankAccount = await ctx.prisma.bankAccount.findUnique({
          where: { id: input.bankAccountId },
        });

        if (bankAccount) {
          const netPayment = input.value + input.interestValue + input.fineValue - input.discountValue;
          const newBalance = bankAccount.currentBalance + netPayment;

          await ctx.prisma.$transaction([
            ctx.prisma.bankTransaction.create({
              data: {
                bankAccountId: input.bankAccountId,
                transactionDate: input.paymentDate,
                type: "CREDIT",
                description: `Recebimento - ${receivable.description}`,
                value: netPayment,
                balanceAfter: newBalance,
                receivableId: input.receivableId,
                createdBy: ctx.tenant.userId,
              },
            }),
            ctx.prisma.bankAccount.update({
              where: { id: input.bankAccountId },
              data: { currentBalance: newBalance },
            }),
          ]);
        }
      }

      return payment;
    }),

  // Cancelar título
  cancel: tenantProcedure
    .input(z.object({
      id: z.string(),
      reason: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const receivable = await ctx.prisma.accountsReceivable.findUnique({
        where: { id: input.id },
      });

      if (!receivable) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Título não encontrado" });
      }

      if (receivable.paidValue > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Título com pagamentos não pode ser cancelado" });
      }

      const updated = await ctx.prisma.accountsReceivable.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          notes: `${receivable.notes || ""}\n[CANCELADO] ${input.reason}`.trim(),
        },
      });

      return updated;
    }),

  // Dashboard de contas a receber
  dashboard: tenantProcedure
    .query(async ({ ctx }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const next7Days = new Date(today);
      next7Days.setDate(next7Days.getDate() + 7);

      const next30Days = new Date(today);
      next30Days.setDate(next30Days.getDate() + 30);

      const receivables = await ctx.prisma.accountsReceivable.findMany({
        where: {
          ...tenantFilter(ctx.companyId),
          status: { in: ["PENDING", "PARTIAL"] },
        },
        select: { dueDate: true, netValue: true, paidValue: true },
      });

      let overdueValue = 0;
      let overdueCount = 0;
      let dueTodayValue = 0;
      let dueNext7DaysValue = 0;
      let dueNext30DaysValue = 0;

      for (const r of receivables) {
        const remaining = r.netValue - r.paidValue;
        const dueDate = new Date(r.dueDate);

        if (dueDate < today) {
          overdueValue += remaining;
          overdueCount++;
        } else if (dueDate.toDateString() === today.toDateString()) {
          dueTodayValue += remaining;
        } else if (dueDate <= next7Days) {
          dueNext7DaysValue += remaining;
        } else if (dueDate <= next30Days) {
          dueNext30DaysValue += remaining;
        }
      }

      // Recebimentos do mês
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const monthPayments = await ctx.prisma.receivablePayment.aggregate({
        where: {
          receivable: tenantFilter(ctx.companyId),
          paymentDate: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { value: true },
        _count: true,
      });

      return {
        overdueValue,
        overdueCount,
        dueTodayValue,
        dueNext7DaysValue,
        dueNext30DaysValue,
        monthReceivedValue: monthPayments._sum.value || 0,
        monthReceivedCount: monthPayments._count,
      };
    }),

  // Aging de contas a receber
  aging: tenantProcedure
    .query(async ({ ctx }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const receivables = await ctx.prisma.accountsReceivable.findMany({
        where: {
          ...tenantFilter(ctx.companyId),
          status: { in: ["PENDING", "PARTIAL"] },
        },
        select: { dueDate: true, netValue: true, paidValue: true },
      });

      const aging = {
        current: 0,      // A vencer
        days1to30: 0,    // 1-30 dias vencido
        days31to60: 0,   // 31-60 dias vencido
        days61to90: 0,   // 61-90 dias vencido
        over90: 0,       // +90 dias vencido
      };

      for (const r of receivables) {
        const remaining = r.netValue - r.paidValue;
        const dueDate = new Date(r.dueDate);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysOverdue <= 0) {
          aging.current += remaining;
        } else if (daysOverdue <= 30) {
          aging.days1to30 += remaining;
        } else if (daysOverdue <= 60) {
          aging.days31to60 += remaining;
        } else if (daysOverdue <= 90) {
          aging.days61to90 += remaining;
        } else {
          aging.over90 += remaining;
        }
      }

      return aging;
    }),
});
