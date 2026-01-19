import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { emitEvent } from "../services/events";

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
        ...tenantFilter(ctx.companyId, false), // AccountsPayable não tem isShared
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
          ...tenantFilter(ctx.companyId, false),
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
          ...tenantFilter(ctx.companyId, false),
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

      const updatedPayable = await prisma.accountsPayable.update({
        where: { id: input.payableId },
        data: {
          paidValue: newPaidValue,
          discountValue: payable.discountValue + input.discountValue,
          interestValue: payable.interestValue + input.interestValue,
          fineValue: payable.fineValue + input.fineValue,
          status: isPaid ? "PAID" : "PARTIAL",
          paidAt: isPaid ? input.paymentDate : null,
        },
        include: { supplier: true },
      });

      // Emitir evento se título foi pago completamente
      if (isPaid) {
        emitEvent("payable.paid", {
          userId: ctx.tenant.userId ?? undefined,
          companyId: ctx.companyId ?? undefined,
        }, {
          payableId: updatedPayable.id,
          supplierName: updatedPayable.supplier?.companyName || "Fornecedor",
          value: updatedPayable.netValue,
        });
      }

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
          ...tenantFilter(ctx.companyId, false),
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
          ...tenantFilter(ctx.companyId, false),
          status: "PENDING",
        },
        _sum: { netValue: true },
        _count: true,
      }),
      // Total vencido
      prisma.accountsPayable.aggregate({
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: "PENDING",
          dueDate: { lt: today },
        },
        _sum: { netValue: true },
        _count: true,
      }),
      // Vence hoje
      prisma.accountsPayable.aggregate({
        where: {
          ...tenantFilter(ctx.companyId, false),
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
          ...tenantFilter(ctx.companyId, false),
          status: "PENDING",
          dueDate: { gte: today, lte: endOfWeek },
        },
        _sum: { netValue: true },
        _count: true,
      }),
      // Vence este mês
      prisma.accountsPayable.aggregate({
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: "PENDING",
          dueDate: { gte: today, lte: endOfMonth },
        },
        _sum: { netValue: true },
        _count: true,
      }),
      // Pago este mês
      prisma.accountsPayable.aggregate({
        where: {
          ...tenantFilter(ctx.companyId, false),
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
        where: tenantFilter(ctx.companyId, false),
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
        ...tenantFilter(ctx.companyId, false),
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
          ...tenantFilter(ctx.companyId, false),
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

      const payable = await prisma.accountsPayable.create({
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
        include: { supplier: true },
      });

      // Emitir evento de título criado
      emitEvent("payable.created", {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId ?? undefined,
      }, {
        payableId: payable.id,
        supplierName: payable.supplier?.companyName || "Fornecedor",
        value: payable.netValue,
        dueDate: payable.dueDate.toISOString(),
      });

      return payable;
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
          ...tenantFilter(ctx.companyId, false),
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
        where: tenantFilter(ctx.companyId, false),
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

  // Listar centros de custo
  listCostCenters: tenantProcedure.query(async ({ ctx }) => {
    return prisma.costCenter.findMany({
      where: {
        ...tenantFilter(ctx.companyId, false),
        isActive: true,
      },
      orderBy: { name: "asc" },
    });
  }),

  // Adicionar rateio por centro de custo
  addCostAllocation: tenantProcedure
    .input(z.object({
      payableId: z.string(),
      allocations: z.array(z.object({
        costCenterId: z.string(),
        percentage: z.number().min(0).max(100),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const payable = await prisma.accountsPayable.findFirst({
        where: {
          id: input.payableId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!payable) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Título não encontrado",
        });
      }

      // Validar que soma = 100%
      const totalPercentage = input.allocations.reduce((sum, a) => sum + a.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Soma dos percentuais deve ser 100% (atual: ${totalPercentage}%)`,
        });
      }

      // Remover alocações anteriores
      await prisma.payableCostAllocation.deleteMany({
        where: { payableId: input.payableId },
      });

      // Criar novas alocações
      const allocations = await Promise.all(
        input.allocations.map((a) =>
          prisma.payableCostAllocation.create({
            data: {
              payableId: input.payableId,
              costCenterId: a.costCenterId,
              percentage: a.percentage,
              value: (payable.netValue * a.percentage) / 100,
            },
          })
        )
      );

      return allocations;
    }),

  // Buscar alocações de um título
  getCostAllocations: tenantProcedure
    .input(z.object({ payableId: z.string() }))
    .query(async ({ input, ctx }) => {
      const payable = await prisma.accountsPayable.findFirst({
        where: {
          id: input.payableId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!payable) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Título não encontrado",
        });
      }

      return prisma.payableCostAllocation.findMany({
        where: { payableId: input.payableId },
        include: { costCenter: true },
      });
    }),

  // Solicitar aprovação
  requestApproval: tenantProcedure
    .input(z.object({
      payableId: z.string(),
      approverId: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const payable = await prisma.accountsPayable.findFirst({
        where: {
          id: input.payableId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!payable) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Título não encontrado",
        });
      }

      // Criar solicitação de aprovação
      const approval = await prisma.payableApproval.create({
        data: {
          payableId: input.payableId,
          approverId: input.approverId,
          status: "PENDING",
          comments: input.notes,
        },
      });

      return approval;
    }),

  // Aprovar/Rejeitar título
  processApproval: tenantProcedure
    .input(z.object({
      approvalId: z.string(),
      status: z.enum(["APPROVED", "REJECTED"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.tenant.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      const approval = await prisma.payableApproval.findFirst({
        where: {
          id: input.approvalId,
          approverId: ctx.tenant.userId,
        },
        include: { payable: true },
      });

      if (!approval) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aprovação não encontrada ou você não é o aprovador",
        });
      }

      if (approval.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta aprovação já foi processada",
        });
      }

      return prisma.payableApproval.update({
        where: { id: input.approvalId },
        data: {
          status: input.status,
          approvedAt: new Date(),
          comments: input.notes,
        },
      });
    }),

  // Listar aprovações pendentes do usuário
  pendingApprovals: tenantProcedure.query(async ({ ctx }) => {
    if (!ctx.tenant.userId) {
      return [];
    }

    return prisma.payableApproval.findMany({
      where: {
        approverId: ctx.tenant.userId,
        status: "PENDING",
      },
      include: {
        payable: {
          include: { supplier: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }),

  // Estornar pagamento
  reversePayment: tenantProcedure
    .input(z.object({
      paymentId: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const payment = await prisma.payablePayment.findFirst({
        where: { id: input.paymentId },
        include: { payable: true },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pagamento não encontrado",
        });
      }

      // Verificar permissão
      const payable = await prisma.accountsPayable.findFirst({
        where: {
          id: payment.payableId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!payable) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para estornar este pagamento",
        });
      }

      // Atualizar título
      const newPaidValue = payable.paidValue - payment.value;
      const newStatus = newPaidValue <= 0 ? "PENDING" : "PARTIAL";

      await prisma.accountsPayable.update({
        where: { id: payment.payableId },
        data: {
          paidValue: Math.max(0, newPaidValue),
          discountValue: payable.discountValue - payment.discountValue,
          interestValue: payable.interestValue - payment.interestValue,
          fineValue: payable.fineValue - payment.fineValue,
          status: newStatus,
          paidAt: null,
          notes: `${payable.notes || ""}\n[ESTORNO] ${input.reason} - Valor: R$ ${payment.value.toFixed(2)}`.trim(),
        },
      });

      // Marcar pagamento como estornado
      return prisma.payablePayment.update({
        where: { id: input.paymentId },
        data: {
          notes: `${payment.notes || ""}\n[ESTORNADO] ${input.reason}`.trim(),
        },
      });
    }),

  // Reprogramar vencimento
  reschedule: tenantProcedure
    .input(z.object({
      payableId: z.string(),
      newDueDate: z.date(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const payable = await prisma.accountsPayable.findFirst({
        where: {
          id: input.payableId,
          ...tenantFilter(ctx.companyId, false),
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
          message: "Não é possível reprogramar um título pago ou cancelado",
        });
      }

      const oldDueDate = payable.dueDate.toLocaleDateString("pt-BR");
      const newDueDateStr = input.newDueDate.toLocaleDateString("pt-BR");

      return prisma.accountsPayable.update({
        where: { id: input.payableId },
        data: {
          dueDate: input.newDueDate,
          notes: `${payable.notes || ""}\n[REPROGRAMADO] De ${oldDueDate} para ${newDueDateStr} - ${input.reason}`.trim(),
        },
      });
    }),

  // Fluxo de Caixa Projetado
  cashflow: tenantProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      groupBy: z.enum(["day", "week", "month"]).default("day"),
    }).optional())
    .query(async ({ input, ctx }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startDate = input?.startDate || today;
      const endDate = input?.endDate || new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 dias

      // Buscar contas a pagar pendentes
      const payables = await prisma.accountsPayable.findMany({
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: { in: ["PENDING", "PARTIAL"] },
          dueDate: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          dueDate: true,
          netValue: true,
          paidValue: true,
          description: true,
          supplier: { select: { companyName: true } },
        },
        orderBy: { dueDate: "asc" },
      });

      // Buscar contas a receber pendentes
      const receivables = await prisma.accountsReceivable.findMany({
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: { in: ["PENDING", "PARTIAL"] },
          dueDate: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          dueDate: true,
          netValue: true,
          paidValue: true,
          description: true,
          customer: { select: { companyName: true } },
        },
        orderBy: { dueDate: "asc" },
      });

      // Buscar saldo atual das contas bancárias
      const bankAccounts = await prisma.bankAccount.findMany({
        where: {
          ...tenantFilter(ctx.companyId, false),
          isActive: true,
        },
        select: { id: true, name: true, currentBalance: true },
      });

      const initialBalance = bankAccounts.reduce((sum, acc) => sum + (Number(acc.currentBalance) || 0), 0);

      // Agrupar por período
      const cashflowMap = new Map<string, { 
        date: string; 
        inflows: number; 
        outflows: number; 
        balance: number;
        details: { type: "in" | "out"; description: string; value: number; entity: string }[];
      }>();

      // Função para obter chave do período
      const getDateKey = (date: Date): string => {
        const d = new Date(date);
        if (input?.groupBy === "week") {
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());
          return weekStart.toISOString().split("T")[0];
        } else if (input?.groupBy === "month") {
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
        }
        return d.toISOString().split("T")[0];
      };

      // Processar recebíveis (entradas)
      for (const r of receivables) {
        const key = getDateKey(r.dueDate);
        const remaining = (Number(r.netValue) || 0) - (Number(r.paidValue) || 0);
        
        if (!cashflowMap.has(key)) {
          cashflowMap.set(key, { date: key, inflows: 0, outflows: 0, balance: 0, details: [] });
        }
        const entry = cashflowMap.get(key)!;
        entry.inflows += remaining;
        entry.details.push({
          type: "in",
          description: r.description || "Recebível",
          value: remaining,
          entity: r.customer?.companyName || "Cliente",
        });
      }

      // Processar pagáveis (saídas)
      for (const p of payables) {
        const key = getDateKey(p.dueDate);
        const remaining = (Number(p.netValue) || 0) - (Number(p.paidValue) || 0);
        
        if (!cashflowMap.has(key)) {
          cashflowMap.set(key, { date: key, inflows: 0, outflows: 0, balance: 0, details: [] });
        }
        const entry = cashflowMap.get(key)!;
        entry.outflows += remaining;
        entry.details.push({
          type: "out",
          description: p.description || "Pagável",
          value: remaining,
          entity: p.supplier?.companyName || "Fornecedor",
        });
      }

      // Ordenar e calcular saldo acumulado
      const sortedEntries = Array.from(cashflowMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      
      let runningBalance = initialBalance;
      for (const entry of sortedEntries) {
        runningBalance += entry.inflows - entry.outflows;
        entry.balance = runningBalance;
      }

      // Calcular totais
      const totalInflows = sortedEntries.reduce((sum, e) => sum + e.inflows, 0);
      const totalOutflows = sortedEntries.reduce((sum, e) => sum + e.outflows, 0);
      const projectedBalance = initialBalance + totalInflows - totalOutflows;

      // Identificar dias com saldo negativo
      const negativeDays = sortedEntries.filter(e => e.balance < 0);

      return {
        initialBalance,
        projectedBalance,
        totalInflows,
        totalOutflows,
        netCashflow: totalInflows - totalOutflows,
        entries: sortedEntries,
        negativeDays: negativeDays.length,
        lowestBalance: Math.min(...sortedEntries.map(e => e.balance), initialBalance),
        bankAccounts,
      };
    }),

  // Listar boletos
  listBoletos: tenantProcedure
    .input(z.object({
      status: z.enum(["PENDING", "REGISTERED", "PAID", "CANCELLED", "OVERDUE"]).optional(),
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(15),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { status, search, page = 1, limit = 15 } = input || {};

      // Simular dados de boletos (em produção, viria de tabela específica)
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Buscar títulos a pagar que podem ter boletos
      const where: Prisma.AccountsPayableWhereInput = {
        ...tenantFilter(ctx.companyId, false),
        paymentMethod: "BOLETO",
      };

      if (status === "OVERDUE") {
        where.status = "PENDING";
        where.dueDate = { lt: today };
      } else if (status && status !== "OVERDUE") {
        where.status = status === "REGISTERED" ? "PENDING" : status;
      }

      if (search) {
        where.OR = [
          { description: { contains: search, mode: "insensitive" as const } },
          { documentNumber: { contains: search, mode: "insensitive" as const } },
          { supplier: { companyName: { contains: search, mode: "insensitive" as const } } },
        ];
      }

      const [payables, total, pendingCount, registeredCount, paidCount, overdueCount] = await Promise.all([
        prisma.accountsPayable.findMany({
          where,
          include: {
            supplier: { select: { id: true, companyName: true, cnpj: true } },
          },
          orderBy: { dueDate: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.accountsPayable.count({ where }),
        prisma.accountsPayable.count({
          where: { ...tenantFilter(ctx.companyId, false), paymentMethod: "BOLETO", status: "PENDING", dueDate: { gte: today } },
        }),
        prisma.accountsPayable.count({
          where: { ...tenantFilter(ctx.companyId, false), paymentMethod: "BOLETO", status: "PENDING" },
        }),
        prisma.accountsPayable.count({
          where: { ...tenantFilter(ctx.companyId, false), paymentMethod: "BOLETO", status: "PAID", paidAt: { gte: startOfMonth } },
        }),
        prisma.accountsPayable.count({
          where: { ...tenantFilter(ctx.companyId, false), paymentMethod: "BOLETO", status: "PENDING", dueDate: { lt: today } },
        }),
      ]);

      // Calcular valores
      const pendingValue = await prisma.accountsPayable.aggregate({
        where: { ...tenantFilter(ctx.companyId, false), paymentMethod: "BOLETO", status: "PENDING", dueDate: { gte: today } },
        _sum: { netValue: true },
      });

      const registeredValue = await prisma.accountsPayable.aggregate({
        where: { ...tenantFilter(ctx.companyId, false), paymentMethod: "BOLETO", status: "PENDING" },
        _sum: { netValue: true },
      });

      const paidValueMonth = await prisma.accountsPayable.aggregate({
        where: { ...tenantFilter(ctx.companyId, false), paymentMethod: "BOLETO", status: "PAID", paidAt: { gte: startOfMonth } },
        _sum: { netValue: true },
      });

      const overdueValue = await prisma.accountsPayable.aggregate({
        where: { ...tenantFilter(ctx.companyId, false), paymentMethod: "BOLETO", status: "PENDING", dueDate: { lt: today } },
        _sum: { netValue: true },
      });

      const totalValue = await prisma.accountsPayable.aggregate({
        where: { ...tenantFilter(ctx.companyId, false), paymentMethod: "BOLETO" },
        _sum: { netValue: true },
      });

      const boletos = payables.map((p) => {
        const isOverdue = p.status === "PENDING" && new Date(p.dueDate) < today;
        const daysOverdue = isOverdue
          ? Math.floor((today.getTime() - new Date(p.dueDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        return {
          id: p.id,
          ourNumber: p.documentNumber || `${p.code}`.padStart(10, "0"),
          documentNumber: p.documentNumber || String(p.code),
          payerName: p.supplier?.companyName || "N/A",
          payerDocument: p.supplier?.cnpj || "",
          dueDate: p.dueDate,
          value: Number(p.netValue),
          status: isOverdue ? "OVERDUE" : p.status,
          isOverdue,
          daysOverdue,
          barcode: `23793.38128 60000.000003 ${p.code.toString().padStart(5, "0")}0 1 ${Math.floor(Number(p.netValue) * 100).toString().padStart(10, "0")}`,
        };
      });

      return {
        boletos,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          pending: pendingCount,
          pendingValue: Number(pendingValue._sum.netValue) || 0,
          registered: registeredCount,
          registeredValue: Number(registeredValue._sum.netValue) || 0,
          paidMonth: paidCount,
          paidValueMonth: Number(paidValueMonth._sum.netValue) || 0,
          overdue: overdueCount,
          overdueValue: Number(overdueValue._sum.netValue) || 0,
          total: total,
          totalValue: Number(totalValue._sum.netValue) || 0,
        },
      };
    }),

  // Listar transações PIX
  listPixTransactions: tenantProcedure
    .input(z.object({
      status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
      type: z.enum(["PAYMENT", "TRANSFER"]).optional(),
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(15),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { status, type, search, page = 1, limit = 15 } = input || {};

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Buscar pagamentos via PIX
      const where: Prisma.AccountsPayableWhereInput = {
        ...tenantFilter(ctx.companyId, false),
        paymentMethod: "PIX",
      };

      if (status) {
        if (status === "COMPLETED") {
          where.status = "PAID";
        } else if (status === "PENDING" || status === "PROCESSING") {
          where.status = "PENDING";
        }
      }

      if (search) {
        where.OR = [
          { description: { contains: search, mode: "insensitive" as const } },
          { supplier: { companyName: { contains: search, mode: "insensitive" as const } } },
        ];
      }

      const [payables, total] = await Promise.all([
        prisma.accountsPayable.findMany({
          where,
          include: {
            supplier: { select: { id: true, companyName: true, cnpj: true, pixKey: true, pixKeyType: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.accountsPayable.count({ where }),
      ]);

      // Estatísticas
      const [pendingStats, processingStats, completedTodayStats, totalMonthStats] = await Promise.all([
        prisma.accountsPayable.aggregate({
          where: { ...tenantFilter(ctx.companyId, false), paymentMethod: "PIX", status: "PENDING" },
          _count: true,
          _sum: { netValue: true },
        }),
        prisma.accountsPayable.aggregate({
          where: { ...tenantFilter(ctx.companyId, false), paymentMethod: "PIX", status: "PENDING" },
          _count: true,
          _sum: { netValue: true },
        }),
        prisma.accountsPayable.aggregate({
          where: { ...tenantFilter(ctx.companyId, false), paymentMethod: "PIX", status: "PAID", paidAt: { gte: today } },
          _count: true,
          _sum: { netValue: true },
        }),
        prisma.accountsPayable.aggregate({
          where: { ...tenantFilter(ctx.companyId, false), paymentMethod: "PIX", paidAt: { gte: startOfMonth } },
          _count: true,
          _sum: { netValue: true },
        }),
      ]);

      const transactions = payables.map((p) => ({
        id: p.id,
        createdAt: p.createdAt,
        type: "PAYMENT" as const,
        recipientName: p.supplier?.companyName || "N/A",
        recipientDocument: p.supplier?.cnpj || "",
        pixKey: p.supplier?.pixKey || "",
        pixKeyType: p.supplier?.pixKeyType || "CNPJ",
        value: Number(p.netValue),
        status: p.status === "PAID" ? "COMPLETED" : "PENDING",
        e2eId: `E${Date.now()}${p.id.slice(0, 8)}`,
      }));

      return {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          pending: pendingStats._count || 0,
          pendingValue: Number(pendingStats._sum.netValue) || 0,
          processing: 0,
          processingValue: 0,
          completedToday: completedTodayStats._count || 0,
          completedValueToday: Number(completedTodayStats._sum.netValue) || 0,
          totalMonth: totalMonthStats._count || 0,
          totalValueMonth: Number(totalMonthStats._sum.netValue) || 0,
        },
      };
    }),
});
