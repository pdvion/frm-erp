import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const payablesRouter = createTRPCRouter({
  // Listar títulos a pagar com filtros
  list: tenantProcedure
    .input(z.object({
      status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED", "ALL"]).optional(),
      supplierId: z.string().optional(),
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
        supplierId, 
        dueDateFrom, 
        dueDateTo, 
        search,
        page = 1, 
        limit = 20,
        orderBy = "dueDate",
        orderDir = "asc",
      } = input || {};

      const where: Prisma.AccountsPayableWhereInput = {
        ...tenantFilter(ctx.companyId),
      };

      // Filtro por status
      if (status && status !== "ALL") {
        if (status === "OVERDUE") {
          // Vencidos = pendentes com data < hoje
          where.status = "PENDING";
          where.dueDate = { lt: new Date() };
        } else {
          where.status = status;
        }
      }

      // Filtro por fornecedor
      if (supplierId) {
        where.supplierId = supplierId;
      }

      // Filtro por período de vencimento
      if (dueDateFrom || dueDateTo) {
        where.dueDate = {};
        if (dueDateFrom) where.dueDate.gte = dueDateFrom;
        if (dueDateTo) where.dueDate.lte = dueDateTo;
      }

      // Busca por texto
      if (search) {
        where.OR = [
          { description: { contains: search, mode: "insensitive" as const } },
          { documentNumber: { contains: search, mode: "insensitive" as const } },
          { supplier: { companyName: { contains: search, mode: "insensitive" as const } } },
        ];
      }

      const [payables, total] = await Promise.all([
        prisma.accountsPayable.findMany({
          where,
          include: {
            supplier: {
              select: { id: true, code: true, companyName: true, tradeName: true },
            },
            invoice: {
              select: { id: true, invoiceNumber: true, accessKey: true },
            },
            _count: { select: { payments: true } },
          },
          orderBy: { [orderBy]: orderDir },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.accountsPayable.count({ where }),
      ]);

      // Marcar títulos vencidos
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const payablesWithOverdue = payables.map((p) => ({
        ...p,
        isOverdue: p.status === "PENDING" && new Date(p.dueDate) < today,
        daysOverdue: p.status === "PENDING" && new Date(p.dueDate) < today
          ? Math.floor((today.getTime() - new Date(p.dueDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      }));

      return {
        payables: payablesWithOverdue,
        total,
        pages: Math.ceil(total / limit),
        page,
      };
    }),

  // Buscar título por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const payable = await prisma.accountsPayable.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId),
        },
        include: {
          supplier: true,
          invoice: {
            include: {
              items: true,
            },
          },
          payments: {
            orderBy: { paymentDate: "desc" },
          },
        },
      });

      if (!payable) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Título não encontrado",
        });
      }

      return payable;
    }),

  // Registrar pagamento
  registerPayment: tenantProcedure
    .input(z.object({
      payableId: z.string(),
      paymentDate: z.date(),
      value: z.number().positive(),
      discountValue: z.number().default(0),
      interestValue: z.number().default(0),
      fineValue: z.number().default(0),
      paymentMethod: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const payable = await prisma.accountsPayable.findFirst({
        where: {
          id: input.payableId,
          ...tenantFilter(ctx.companyId),
        },
      });

      if (!payable) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Título não encontrado",
        });
      }

      if (payable.status === "PAID" || payable.status === "CANCELLED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Título já está pago ou cancelado",
        });
      }

      // Calcular valor restante
      const remainingValue = payable.netValue - payable.paidValue;
      const totalPayment = input.value + input.interestValue + input.fineValue - input.discountValue;

      if (totalPayment > remainingValue + 0.01) { // tolerância de 1 centavo
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Valor do pagamento (${totalPayment.toFixed(2)}) excede o saldo devedor (${remainingValue.toFixed(2)})`,
        });
      }

      // Criar pagamento
      const payment = await prisma.payablePayment.create({
        data: {
          payableId: input.payableId,
          paymentDate: input.paymentDate,
          value: input.value,
          discountValue: input.discountValue,
          interestValue: input.interestValue,
          fineValue: input.fineValue,
          paymentMethod: input.paymentMethod,
          notes: input.notes,
          createdBy: ctx.tenant.userId,
        },
      });

      // Atualizar título
      const newPaidValue = payable.paidValue + input.value;
      const isPaid = Math.abs(newPaidValue - payable.netValue) < 0.01;

      await prisma.accountsPayable.update({
        where: { id: input.payableId },
        data: {
          paidValue: newPaidValue,
          discountValue: payable.discountValue + input.discountValue,
          interestValue: payable.interestValue + input.interestValue,
          fineValue: payable.fineValue + input.fineValue,
          status: isPaid ? "PAID" : "PARTIAL",
          paidAt: isPaid ? input.paymentDate : null,
        },
      });

      return payment;
    }),

  // Cancelar título
  cancel: tenantProcedure
    .input(z.object({
      id: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const payable = await prisma.accountsPayable.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId),
        },
      });

      if (!payable) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Título não encontrado",
        });
      }

      if (payable.status === "PAID") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível cancelar um título já pago",
        });
      }

      if (payable.paidValue > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível cancelar um título com pagamentos parciais",
        });
      }

      return prisma.accountsPayable.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          notes: `${payable.notes || ""}\n[CANCELADO] ${input.reason}`.trim(),
        },
      });
    }),

  // Estatísticas do dashboard
  stats: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [
      totalPending,
      totalOverdue,
      dueToday,
      dueThisWeek,
      dueThisMonth,
      paidThisMonth,
      byStatus,
    ] = await Promise.all([
      // Total pendente
      prisma.accountsPayable.aggregate({
        where: {
          ...tenantFilter(ctx.companyId),
          status: "PENDING",
        },
        _sum: { netValue: true },
        _count: true,
      }),
      // Total vencido
      prisma.accountsPayable.aggregate({
        where: {
          ...tenantFilter(ctx.companyId),
          status: "PENDING",
          dueDate: { lt: today },
        },
        _sum: { netValue: true },
        _count: true,
      }),
      // Vence hoje
      prisma.accountsPayable.aggregate({
        where: {
          ...tenantFilter(ctx.companyId),
          status: "PENDING",
          dueDate: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        _sum: { netValue: true },
        _count: true,
      }),
      // Vence esta semana
      prisma.accountsPayable.aggregate({
        where: {
          ...tenantFilter(ctx.companyId),
          status: "PENDING",
          dueDate: { gte: today, lte: endOfWeek },
        },
        _sum: { netValue: true },
        _count: true,
      }),
      // Vence este mês
      prisma.accountsPayable.aggregate({
        where: {
          ...tenantFilter(ctx.companyId),
          status: "PENDING",
          dueDate: { gte: today, lte: endOfMonth },
        },
        _sum: { netValue: true },
        _count: true,
      }),
      // Pago este mês
      prisma.accountsPayable.aggregate({
        where: {
          ...tenantFilter(ctx.companyId),
          status: "PAID",
          paidAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), 1),
            lte: endOfMonth,
          },
        },
        _sum: { paidValue: true },
        _count: true,
      }),
      // Por status
      prisma.accountsPayable.groupBy({
        by: ["status"],
        where: tenantFilter(ctx.companyId),
        _sum: { netValue: true },
        _count: true,
      }),
    ]);

    return {
      totalPending: {
        value: totalPending._sum.netValue || 0,
        count: totalPending._count,
      },
      totalOverdue: {
        value: totalOverdue._sum.netValue || 0,
        count: totalOverdue._count,
      },
      dueToday: {
        value: dueToday._sum.netValue || 0,
        count: dueToday._count,
      },
      dueThisWeek: {
        value: dueThisWeek._sum.netValue || 0,
        count: dueThisWeek._count,
      },
      dueThisMonth: {
        value: dueThisMonth._sum.netValue || 0,
        count: dueThisMonth._count,
      },
      paidThisMonth: {
        value: paidThisMonth._sum.paidValue || 0,
        count: paidThisMonth._count,
      },
      byStatus: byStatus.map((s) => ({
        status: s.status,
        value: s._sum.netValue || 0,
        count: s._count,
      })),
    };
  }),

  // Aging - Vencimentos por período
  aging: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ranges = [
      { label: "Vencido > 90 dias", min: -Infinity, max: -90 },
      { label: "Vencido 61-90 dias", min: -90, max: -60 },
      { label: "Vencido 31-60 dias", min: -60, max: -30 },
      { label: "Vencido 1-30 dias", min: -30, max: 0 },
      { label: "A vencer 1-30 dias", min: 0, max: 30 },
      { label: "A vencer 31-60 dias", min: 30, max: 60 },
      { label: "A vencer 61-90 dias", min: 60, max: 90 },
      { label: "A vencer > 90 dias", min: 90, max: Infinity },
    ];

    const payables = await prisma.accountsPayable.findMany({
      where: {
        ...tenantFilter(ctx.companyId),
        status: { in: ["PENDING", "PARTIAL"] },
      },
      select: {
        dueDate: true,
        netValue: true,
        paidValue: true,
      },
    });

    const aging = ranges.map((range) => {
      const filtered = payables.filter((p) => {
        const daysUntilDue = Math.floor(
          (new Date(p.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilDue > range.min && daysUntilDue <= range.max;
      });

      return {
        label: range.label,
        count: filtered.length,
        value: filtered.reduce((sum, p) => sum + (p.netValue - p.paidValue), 0),
      };
    });

    return aging;
  }),

  // Top fornecedores por valor a pagar
  topSuppliers: tenantProcedure
    .input(z.object({ limit: z.number().default(10) }).optional())
    .query(async ({ input, ctx }) => {
      const limit = input?.limit || 10;

      const result = await prisma.accountsPayable.groupBy({
        by: ["supplierId"],
        where: {
          ...tenantFilter(ctx.companyId),
          status: { in: ["PENDING", "PARTIAL"] },
        },
        _sum: { netValue: true, paidValue: true },
        _count: true,
        orderBy: { _sum: { netValue: "desc" } },
        take: limit,
      });

      // Buscar nomes dos fornecedores
      const supplierIds = result.map((r) => r.supplierId);
      const suppliers = await prisma.supplier.findMany({
        where: { id: { in: supplierIds } },
        select: { id: true, companyName: true, tradeName: true },
      });

      const supplierMap = new Map(suppliers.map((s) => [s.id, s]));

      return result.map((r) => {
        const supplier = supplierMap.get(r.supplierId);
        return {
          supplierId: r.supplierId,
          supplierName: supplier?.tradeName || supplier?.companyName || "Desconhecido",
          totalValue: r._sum.netValue || 0,
          paidValue: r._sum.paidValue || 0,
          remainingValue: (r._sum.netValue || 0) - (r._sum.paidValue || 0),
          count: r._count,
        };
      });
    }),

  // Criar título manualmente
  create: tenantProcedure
    .input(z.object({
      supplierId: z.string(),
      description: z.string(),
      dueDate: z.date(),
      originalValue: z.number().positive(),
      documentType: z.enum(["INVOICE", "SERVICE", "TAX", "OTHER"]).default("OTHER"),
      documentNumber: z.string().optional(),
      installmentNumber: z.number().default(1),
      totalInstallments: z.number().default(1),
      notes: z.string().optional(),
      barcode: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Obter próximo código
      const lastPayable = await prisma.accountsPayable.findFirst({
        where: { companyId: ctx.companyId },
        orderBy: { code: "desc" },
        select: { code: true },
      });
      const nextCode = (lastPayable?.code || 0) + 1;

      return prisma.accountsPayable.create({
        data: {
          code: nextCode,
          companyId: ctx.companyId,
          supplierId: input.supplierId,
          documentType: input.documentType,
          documentNumber: input.documentNumber,
          description: input.description,
          dueDate: input.dueDate,
          issueDate: new Date(),
          originalValue: input.originalValue,
          netValue: input.originalValue,
          installmentNumber: input.installmentNumber,
          totalInstallments: input.totalInstallments,
          notes: input.notes,
          barcode: input.barcode,
          createdBy: ctx.tenant.userId,
        },
      });
    }),

  // Atualizar título
  update: tenantProcedure
    .input(z.object({
      id: z.string(),
      description: z.string().optional(),
      dueDate: z.date().optional(),
      notes: z.string().optional(),
      barcode: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const payable = await prisma.accountsPayable.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId),
        },
      });

      if (!payable) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Título não encontrado",
        });
      }

      if (payable.status === "PAID" || payable.status === "CANCELLED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível editar um título pago ou cancelado",
        });
      }

      return prisma.accountsPayable.update({
        where: { id: input.id },
        data: {
          description: input.description,
          dueDate: input.dueDate,
          notes: input.notes,
          barcode: input.barcode,
        },
      });
    }),

  // Criar contas a pagar a partir das duplicatas da NFe
  createFromNfe: tenantProcedure
    .input(z.object({
      invoiceId: z.string(),
      supplierId: z.string(),
      duplicatas: z.array(z.object({
        numero: z.string(),
        vencimento: z.date(),
        valor: z.number(),
      })),
      nfeNumber: z.string(),
      nfeSeries: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { invoiceId, supplierId, duplicatas, nfeNumber, nfeSeries } = input;

      // Buscar próximo código
      const lastPayable = await prisma.accountsPayable.findFirst({
        where: tenantFilter(ctx.companyId),
        orderBy: { code: "desc" },
      });
      const nextCode = (lastPayable?.code || 0) + 1;

      // Criar um título para cada duplicata
      const payables = await Promise.all(
        duplicatas.map(async (dup, index) => {
          const payable = await prisma.accountsPayable.create({
            data: {
              code: nextCode + index,
              companyId: ctx.companyId,
              supplierId,
              invoiceId,
              documentType: "INVOICE",
              documentNumber: `${nfeNumber}${nfeSeries ? `-${nfeSeries}` : ""}-${dup.numero}`,
              description: `NFe ${nfeNumber} - Parcela ${dup.numero}`,
              dueDate: dup.vencimento,
              issueDate: new Date(),
              originalValue: dup.valor,
              netValue: dup.valor,
              installmentNumber: index + 1,
              totalInstallments: duplicatas.length,
              createdBy: ctx.tenant.userId,
            },
          });
          return payable;
        })
      );

      return {
        created: payables.length,
        payables,
        totalValue: duplicatas.reduce((sum, d) => sum + d.valor, 0),
      };
    }),
});
