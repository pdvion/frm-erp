import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { emitEvent } from "../services/events";
import {
  gerarBoleto,
  calcularFatorVencimento,
  gerarCampoLivreBB,
  gerarCampoLivreBradesco,
  gerarCampoLivreItau,
  gerarCampoLivreSantander,
  gerarCampoLivreCaixa,
  gerarCampoLivreSicoob,
  validarCodigoBarras,
  extrairInfoCodigoBarras,
} from "@/lib/boleto";

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
        ctx.prisma.accountsPayable.findMany({
          where,
          include: {
            supplier: {
              select: { id: true, code: true, companyName: true, tradeName: true },
            },
            invoice: {
              select: { id: true, invoiceNumber: true, accessKey: true },
            },
            company: {
              select: { id: true, name: true },
            },
            _count: { select: { payments: true } },
          },
          orderBy: { [orderBy]: orderDir },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.accountsPayable.count({ where }),
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
      const payable = await ctx.prisma.accountsPayable.findFirst({
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
      const payable = await ctx.prisma.accountsPayable.findFirst({
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
      const remainingValue = Number(payable.netValue) - Number(payable.paidValue);
      const totalPayment = input.value + input.interestValue + input.fineValue - input.discountValue;

      if (totalPayment > remainingValue + 0.01) { // tolerância de 1 centavo
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Valor do pagamento (${totalPayment.toFixed(2)}) excede o saldo devedor (${remainingValue.toFixed(2)})`,
        });
      }

      // Criar pagamento
      const payment = await ctx.prisma.payablePayment.create({
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
      const newPaidValue = Number(payable.paidValue) + Number(input.value);
      const isPaid = Math.abs(newPaidValue - Number(payable.netValue)) < 0.01;

      const updatedPayable = await ctx.prisma.accountsPayable.update({
        where: { id: input.payableId },
        data: {
          paidValue: newPaidValue,
          discountValue: Number(payable.discountValue) + Number(input.discountValue),
          interestValue: Number(payable.interestValue) + input.interestValue,
          fineValue: Number(payable.fineValue) + input.fineValue,
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
      const payable = await ctx.prisma.accountsPayable.findFirst({
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

      if (Number(payable.paidValue) > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível cancelar um título com pagamentos parciais",
        });
      }

      return ctx.prisma.accountsPayable.update({
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
      ctx.prisma.accountsPayable.aggregate({
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: "PENDING",
        },
        _sum: { netValue: true },
        _count: true,
      }),
      // Total vencido
      ctx.prisma.accountsPayable.aggregate({
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: "PENDING",
          dueDate: { lt: today },
        },
        _sum: { netValue: true },
        _count: true,
      }),
      // Vence hoje
      ctx.prisma.accountsPayable.aggregate({
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
      ctx.prisma.accountsPayable.aggregate({
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: "PENDING",
          dueDate: { gte: today, lte: endOfWeek },
        },
        _sum: { netValue: true },
        _count: true,
      }),
      // Vence este mês
      ctx.prisma.accountsPayable.aggregate({
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: "PENDING",
          dueDate: { gte: today, lte: endOfMonth },
        },
        _sum: { netValue: true },
        _count: true,
      }),
      // Pago este mês
      ctx.prisma.accountsPayable.aggregate({
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
      ctx.prisma.accountsPayable.groupBy({
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

    const payables = await ctx.prisma.accountsPayable.findMany({
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
        value: filtered.reduce((sum, p) => sum + (Number(p.netValue) - Number(p.paidValue)), 0),
      };
    });

    return aging;
  }),

  // Top fornecedores por valor a pagar
  topSuppliers: tenantProcedure
    .input(z.object({ limit: z.number().default(10) }).optional())
    .query(async ({ input, ctx }) => {
      const limit = input?.limit || 10;

      const result = await ctx.prisma.accountsPayable.groupBy({
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
      const suppliers = await ctx.prisma.supplier.findMany({
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
          remainingValue: (Number(r._sum.netValue) || 0) - (Number(r._sum.paidValue) || 0),
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
      // Retenções de impostos
      hasWithholding: z.boolean().default(false),
      withholdingIr: z.number().default(0),
      withholdingIss: z.number().default(0),
      withholdingInss: z.number().default(0),
      withholdingPis: z.number().default(0),
      withholdingCofins: z.number().default(0),
      withholdingCsll: z.number().default(0),
      // Centro de custo
      costCenterGroup: z.number().optional(),
      costCenterCode: z.string().optional(),
      // Contrato
      contractType: z.enum(["PURCHASE", "FINANCIAL", "PRESUMED"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Obter próximo código
      const lastPayable = await ctx.prisma.accountsPayable.findFirst({
        where: { companyId: ctx.companyId },
        orderBy: { code: "desc" },
        select: { code: true },
      });
      const nextCode = (lastPayable?.code || 0) + 1;

      const payable = await ctx.prisma.accountsPayable.create({
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
          // Retenções
          hasWithholding: input.hasWithholding,
          withholdingIr: input.withholdingIr,
          withholdingIss: input.withholdingIss,
          withholdingInss: input.withholdingInss,
          withholdingPis: input.withholdingPis,
          withholdingCofins: input.withholdingCofins,
          withholdingCsll: input.withholdingCsll,
          // Centro de custo
          costCenterGroup: input.costCenterGroup,
          costCenterCode: input.costCenterCode,
          // Contrato
          contractType: input.contractType,
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
      const payable = await ctx.prisma.accountsPayable.findFirst({
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

      return ctx.prisma.accountsPayable.update({
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
      const lastPayable = await ctx.prisma.accountsPayable.findFirst({
        where: tenantFilter(ctx.companyId, false),
        orderBy: { code: "desc" },
      });
      const nextCode = (lastPayable?.code || 0) + 1;

      // Criar um título para cada duplicata
      const payables = await Promise.all(
        duplicatas.map(async (dup, index) => {
          const payable = await ctx.prisma.accountsPayable.create({
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
    return ctx.prisma.costCenter.findMany({
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
      const payable = await ctx.prisma.accountsPayable.findFirst({
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
      await ctx.prisma.payableCostAllocation.deleteMany({
        where: { payableId: input.payableId },
      });

      // Criar novas alocações
      const allocations = await Promise.all(
        input.allocations.map((a) =>
          ctx.prisma.payableCostAllocation.create({
            data: {
              payableId: input.payableId,
              costCenterId: a.costCenterId,
              percentage: a.percentage,
              value: (Number(payable.netValue) * a.percentage) / 100,
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
      const payable = await ctx.prisma.accountsPayable.findFirst({
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

      return ctx.prisma.payableCostAllocation.findMany({
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
      const payable = await ctx.prisma.accountsPayable.findFirst({
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
      const approval = await ctx.prisma.payableApproval.create({
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

      const approval = await ctx.prisma.payableApproval.findFirst({
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

      return ctx.prisma.payableApproval.update({
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

    return ctx.prisma.payableApproval.findMany({
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
      const payment = await ctx.prisma.payablePayment.findFirst({
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
      const payable = await ctx.prisma.accountsPayable.findFirst({
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
      const newPaidValue = Number(payable.paidValue) - Number(payment.value);
      const newStatus = newPaidValue <= 0 ? "PENDING" : "PARTIAL";

      await ctx.prisma.accountsPayable.update({
        where: { id: payment.payableId },
        data: {
          paidValue: Math.max(0, newPaidValue),
          discountValue: Number(payable.discountValue) - Number(payment.discountValue),
          interestValue: Number(payable.interestValue) - Number(payment.interestValue),
          fineValue: Number(payable.fineValue) - Number(payment.fineValue),
          status: newStatus,
          paidAt: null,
          notes: `${payable.notes || ""}\n[ESTORNO] ${input.reason} - Valor: R$ ${payment.value.toFixed(2)}`.trim(),
        },
      });

      // Marcar pagamento como estornado
      return ctx.prisma.payablePayment.update({
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
      const payable = await ctx.prisma.accountsPayable.findFirst({
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

      return ctx.prisma.accountsPayable.update({
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
      const payables = await ctx.prisma.accountsPayable.findMany({
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
      const receivables = await ctx.prisma.accountsReceivable.findMany({
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
      const bankAccounts = await ctx.prisma.bankAccount.findMany({
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

  // Listar boletos (títulos com código de barras)
  listBoletos: tenantProcedure
    .input(z.object({
      status: z.enum(["PENDING", "PAID", "CANCELLED"]).optional(),
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(15),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { status, search, page = 1, limit = 15 } = input || {};

      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Buscar títulos a pagar que têm código de barras (boletos)
      const where: Prisma.AccountsPayableWhereInput = {
        ...tenantFilter(ctx.companyId, false),
        barcode: { not: null },
      };

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { description: { contains: search, mode: "insensitive" as const } },
          { documentNumber: { contains: search, mode: "insensitive" as const } },
          { supplier: { companyName: { contains: search, mode: "insensitive" as const } } },
        ];
      }

      const baseWhere = { ...tenantFilter(ctx.companyId, false), barcode: { not: null } };

      const [payables, total, pendingCount, paidCount, overdueCount] = await Promise.all([
        ctx.prisma.accountsPayable.findMany({
          where,
          include: {
            supplier: { select: { id: true, companyName: true, cnpj: true } },
          },
          orderBy: { dueDate: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.accountsPayable.count({ where }),
        ctx.prisma.accountsPayable.count({
          where: { ...baseWhere, status: "PENDING", dueDate: { gte: today } },
        }),
        ctx.prisma.accountsPayable.count({
          where: { ...baseWhere, status: "PAID", paidAt: { gte: startOfMonth } },
        }),
        ctx.prisma.accountsPayable.count({
          where: { ...baseWhere, status: "PENDING", dueDate: { lt: today } },
        }),
      ]);

      // Calcular valores
      const [pendingValue, paidValueMonth, overdueValue, totalValue] = await Promise.all([
        ctx.prisma.accountsPayable.aggregate({
          where: { ...baseWhere, status: "PENDING", dueDate: { gte: today } },
          _sum: { netValue: true },
        }),
        ctx.prisma.accountsPayable.aggregate({
          where: { ...baseWhere, status: "PAID", paidAt: { gte: startOfMonth } },
          _sum: { netValue: true },
        }),
        ctx.prisma.accountsPayable.aggregate({
          where: { ...baseWhere, status: "PENDING", dueDate: { lt: today } },
          _sum: { netValue: true },
        }),
        ctx.prisma.accountsPayable.aggregate({
          where: baseWhere,
          _sum: { netValue: true },
        }),
      ]);

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
          barcode: p.barcode || "",
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
          pendingValue: Number(pendingValue._sum?.netValue) || 0,
          registered: pendingCount,
          registeredValue: Number(pendingValue._sum?.netValue) || 0,
          paidMonth: paidCount,
          paidValueMonth: Number(paidValueMonth._sum?.netValue) || 0,
          overdue: overdueCount,
          overdueValue: Number(overdueValue._sum?.netValue) || 0,
          total: total,
          totalValue: Number(totalValue._sum?.netValue) || 0,
        },
      };
    }),

  // Listar transações PIX (pagamentos realizados)
  listPixTransactions: tenantProcedure
    .input(z.object({
      status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED", "SCHEDULED"]).optional(),
      type: z.enum(["PAYMENT", "TRANSFER", "REFUND"]).optional(),
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(15),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { status, type, search, page = 1, limit = 15 } = input || {};

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Buscar transações PIX
      const where: Prisma.PixTransactionWhereInput = {
        companyId: ctx.companyId,
      };

      if (status) {
        where.status = status;
      }

      if (type) {
        where.type = type;
      }

      if (search) {
        where.OR = [
          { recipientName: { contains: search, mode: "insensitive" as const } },
          { pixKey: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ];
      }

      const baseWhere = { companyId: ctx.companyId };

      const [pixTransactions, total] = await Promise.all([
        ctx.prisma.pixTransaction.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.pixTransaction.count({ where }),
      ]);

      // Estatísticas
      const [pendingStats, processingStats, completedTodayStats, totalMonthStats] = await Promise.all([
        ctx.prisma.pixTransaction.aggregate({
          where: { ...baseWhere, status: "PENDING" },
          _count: true,
          _sum: { value: true },
        }),
        ctx.prisma.pixTransaction.aggregate({
          where: { ...baseWhere, status: "PROCESSING" },
          _count: true,
          _sum: { value: true },
        }),
        ctx.prisma.pixTransaction.aggregate({
          where: { ...baseWhere, status: "COMPLETED", completedAt: { gte: today } },
          _count: true,
          _sum: { value: true },
        }),
        ctx.prisma.pixTransaction.aggregate({
          where: { ...baseWhere, completedAt: { gte: startOfMonth } },
          _count: true,
          _sum: { value: true },
        }),
      ]);

      const transactions = pixTransactions.map((p) => ({
        id: p.id,
        transactionId: p.transactionId,
        createdAt: p.createdAt,
        type: p.type,
        recipientName: p.recipientName,
        recipientDocument: p.recipientDocument || "",
        pixKey: p.pixKey,
        pixKeyType: p.pixKeyType,
        value: Number(p.value),
        status: p.status,
        e2eId: p.e2eId || "",
        description: p.description || "",
        scheduledAt: p.scheduledAt,
        completedAt: p.completedAt,
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
          pendingValue: Number(pendingStats._sum?.value) || 0,
          processing: processingStats._count || 0,
          processingValue: Number(processingStats._sum?.value) || 0,
          completedToday: completedTodayStats._count || 0,
          completedValueToday: Number(completedTodayStats._sum?.value) || 0,
          totalMonth: totalMonthStats._count || 0,
          totalValueMonth: Number(totalMonthStats._sum?.value) || 0,
        },
      };
    }),

  // Gerar código de barras para boleto
  generateBarcode: tenantProcedure
    .input(z.object({
      bankCode: z.enum(["001", "033", "104", "237", "341", "756"]),
      valor: z.number().positive(),
      dataVencimento: z.date(),
      nossoNumero: z.string(),
      agencia: z.string(),
      conta: z.string(),
      convenio: z.string().optional(),
      carteira: z.string().optional(),
      codigoCedente: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const { bankCode, valor, dataVencimento, nossoNumero, agencia, conta, convenio, carteira, codigoCedente } = input;

      const fatorVencimento = calcularFatorVencimento(dataVencimento);

      let campoLivre: string;

      switch (bankCode) {
        case "001": // Banco do Brasil
          campoLivre = gerarCampoLivreBB({
            convenio: convenio || "000000",
            nossoNumero,
            agencia,
            conta,
            carteira: carteira || "17",
          });
          break;
        case "237": // Bradesco
          campoLivre = gerarCampoLivreBradesco({
            agencia,
            carteira: carteira || "09",
            nossoNumero,
            conta,
          });
          break;
        case "341": // Itaú
          campoLivre = gerarCampoLivreItau({
            carteira: carteira || "109",
            nossoNumero,
            agencia,
            conta,
          });
          break;
        case "033": // Santander
          campoLivre = gerarCampoLivreSantander({
            codigoCedente: codigoCedente || convenio || "0000000",
            nossoNumero,
          });
          break;
        case "104": // Caixa
          campoLivre = gerarCampoLivreCaixa({
            codigoCedente: codigoCedente || convenio || "000000",
            nossoNumero,
          });
          break;
        case "756": // Sicoob
          campoLivre = gerarCampoLivreSicoob({
            carteira: carteira || "01",
            codigoCedente: codigoCedente || convenio || "00000",
            nossoNumero,
            agencia,
            conta,
          });
          break;
        default:
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Banco ${bankCode} não suportado`,
          });
      }

      const boleto = gerarBoleto({
        bankCode,
        fatorVencimento,
        valor,
        campoLivre,
      });

      return {
        success: true,
        codigoBarras: boleto.codigoBarras,
        linhaDigitavel: boleto.linhaDigitavel,
        fatorVencimento,
        dataVencimento,
        valor,
      };
    }),

  // Validar código de barras
  validateBarcode: tenantProcedure
    .input(z.object({
      codigoBarras: z.string(),
    }))
    .mutation(({ input }) => {
      const validation = validarCodigoBarras(input.codigoBarras);

      if (!validation.valid) {
        return {
          valid: false,
          errors: validation.errors,
        };
      }

      const info = extrairInfoCodigoBarras(input.codigoBarras);

      return {
        valid: true,
        banco: info.banco,
        valor: info.valor,
        dataVencimento: info.dataVencimento,
        fatorVencimento: info.fatorVencimento,
      };
    }),

  // Validar chave PIX e buscar dados do destinatário
  validatePixKey: tenantProcedure
    .input(z.object({
      keyType: z.enum(["CPF", "CNPJ", "EMAIL", "PHONE", "EVP"]),
      pixKey: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Validação básica do formato da chave
      const { keyType, pixKey } = input;
      
      // Validar formato conforme tipo
      if (keyType === "CPF" && !/^\d{11}$/.test(pixKey.replace(/\D/g, ""))) {
        return { valid: false, error: "CPF inválido" };
      }
      if (keyType === "CNPJ" && !/^\d{14}$/.test(pixKey.replace(/\D/g, ""))) {
        return { valid: false, error: "CNPJ inválido" };
      }
      if (keyType === "EMAIL" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey)) {
        return { valid: false, error: "E-mail inválido" };
      }
      if (keyType === "PHONE" && !/^\d{10,11}$/.test(pixKey.replace(/\D/g, ""))) {
        return { valid: false, error: "Telefone inválido" };
      }
      if (keyType === "EVP" && !/^[a-f0-9-]{36}$/i.test(pixKey)) {
        return { valid: false, error: "Chave aleatória inválida" };
      }

      // TODO: Integrar com API bancária real para validar chave
      // Por enquanto, simular resposta de sucesso
      const mockRecipients: Record<string, { name: string; document: string; bank: string }> = {
        "CPF": { name: "João da Silva", document: "***.***.***-00", bank: "Banco do Brasil" },
        "CNPJ": { name: "Empresa Exemplo LTDA", document: "**.***.***/0001-**", bank: "Itaú" },
        "EMAIL": { name: "Maria Santos", document: "***.***.***-00", bank: "Nubank" },
        "PHONE": { name: "Pedro Oliveira", document: "***.***.***-00", bank: "Bradesco" },
        "EVP": { name: "Fornecedor ABC", document: "**.***.***/0001-**", bank: "Santander" },
      };

      const recipient = mockRecipients[keyType];

      return {
        valid: true,
        recipientName: recipient.name,
        recipientDocument: recipient.document,
        bankName: recipient.bank,
      };
    }),

  // Enviar PIX
  sendPix: tenantProcedure
    .input(z.object({
      keyType: z.enum(["CPF", "CNPJ", "EMAIL", "PHONE", "EVP"]),
      pixKey: z.string(),
      value: z.number().positive(),
      description: z.string().optional(),
      recipientName: z.string().optional(),
      recipientDocument: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { keyType, pixKey, value, description, recipientName, recipientDocument } = input;

      // Gerar ID único para a transação
      const transactionId = `E${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Criar registro da transação PIX
      const pixTransaction = await ctx.prisma.pixTransaction.create({
        data: {
          transactionId,
          type: "PAYMENT",
          status: "PROCESSING",
          pixKeyType: keyType,
          pixKey,
          value,
          description,
          recipientName: recipientName || "Destinatário",
          recipientDocument: recipientDocument || "",
          companyId: ctx.companyId,
          createdBy: ctx.tenant.userId,
        },
      });

      // TODO: Integrar com API bancária real para processar o PIX
      // Por enquanto, simular processamento assíncrono
      // Em produção, isso seria feito via webhook do banco

      // Simular conclusão após 2 segundos (em produção seria via webhook)
      setTimeout(async () => {
        await ctx.prisma.pixTransaction.update({
          where: { id: pixTransaction.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            e2eId: `E${Date.now()}`,
          },
        });
      }, 2000);

      return {
        success: true,
        transactionId: pixTransaction.transactionId,
        status: "PROCESSING",
      };
    }),

  // Cancelar agendamento PIX
  cancelPixSchedule: tenantProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const transaction = await ctx.prisma.pixTransaction.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!transaction) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agendamento não encontrado",
        });
      }

      if (transaction.status !== "SCHEDULED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Apenas agendamentos pendentes podem ser cancelados",
        });
      }

      // Verificar se falta menos de 1 hora para execução
      if (transaction.scheduledAt) {
        const now = new Date();
        const scheduledTime = new Date(transaction.scheduledAt);
        const diffMs = scheduledTime.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não é possível cancelar agendamentos com menos de 1 hora para execução",
          });
        }
      }

      await ctx.prisma.pixTransaction.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      });

      return { success: true, message: "Agendamento cancelado com sucesso" };
    }),

  // Listar títulos para pagamento em lote
  listForPayment: tenantProcedure
    .input(z.object({
      dueDateFrom: z.date().optional(),
      dueDateTo: z.date().optional(),
      supplierId: z.string().optional(),
      minValue: z.number().optional(),
      maxValue: z.number().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { dueDateFrom, dueDateTo, supplierId, minValue, maxValue } = input || {};

      const where: Prisma.AccountsPayableWhereInput = {
        ...tenantFilter(ctx.companyId, false),
        status: { in: ["PENDING", "PARTIAL"] },
      };

      if (supplierId) {
        where.supplierId = supplierId;
      }

      if (dueDateFrom || dueDateTo) {
        where.dueDate = {};
        if (dueDateFrom) where.dueDate.gte = dueDateFrom;
        if (dueDateTo) where.dueDate.lte = dueDateTo;
      }

      if (minValue !== undefined || maxValue !== undefined) {
        where.netValue = {};
        if (minValue !== undefined) where.netValue.gte = minValue;
        if (maxValue !== undefined) where.netValue.lte = maxValue;
      }

      const payables = await ctx.prisma.accountsPayable.findMany({
        where,
        include: {
          supplier: {
            select: { id: true, code: true, companyName: true, tradeName: true },
          },
        },
        orderBy: { dueDate: "asc" },
      });

      // Calcular saldo devedor de cada título
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return payables.map((p) => ({
        ...p,
        remainingValue: Number(p.netValue) - Number(p.paidValue),
        isOverdue: new Date(p.dueDate) < today,
        daysOverdue: new Date(p.dueDate) < today
          ? Math.floor((today.getTime() - new Date(p.dueDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      }));
    }),

  // Pagamento em lote
  batchPay: tenantProcedure
    .input(z.object({
      payableIds: z.array(z.string()).min(1),
      paymentDate: z.date(),
      bankAccountId: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const payables = await ctx.prisma.accountsPayable.findMany({
        where: {
          id: { in: input.payableIds },
          ...tenantFilter(ctx.companyId, false),
          status: { in: ["PENDING", "PARTIAL"] },
        },
        include: { supplier: true },
      });

      if (payables.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nenhum título válido encontrado para pagamento",
        });
      }

      if (payables.length !== input.payableIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Alguns títulos não estão disponíveis para pagamento. Encontrados: ${payables.length} de ${input.payableIds.length}`,
        });
      }

      const results: { payableId: string; success: boolean; error?: string }[] = [];
      let totalPaid = 0;

      for (const payable of payables) {
        try {
          const remainingValue = Number(payable.netValue) - Number(payable.paidValue);

          // Criar pagamento
          await ctx.prisma.payablePayment.create({
            data: {
              payableId: payable.id,
              paymentDate: input.paymentDate,
              value: remainingValue,
              paymentMethod: input.bankAccountId ? "TRANSFER" : "OTHER",
              notes: input.notes,
              createdBy: ctx.tenant.userId,
            },
          });

          // Atualizar título
          await ctx.prisma.accountsPayable.update({
            where: { id: payable.id },
            data: {
              paidValue: payable.netValue,
              status: "PAID",
              paidAt: input.paymentDate,
            },
          });

          totalPaid += remainingValue;
          results.push({ payableId: payable.id, success: true });

          // Emitir evento
          emitEvent("payable.paid", {
            userId: ctx.tenant.userId ?? undefined,
            companyId: ctx.companyId ?? undefined,
          }, {
            payableId: payable.id,
            supplierName: payable.supplier?.companyName || "Fornecedor",
            value: remainingValue,
          });
        } catch (error) {
          results.push({
            payableId: payable.id,
            success: false,
            error: error instanceof Error ? error.message : "Erro desconhecido",
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;

      return {
        success: successCount > 0,
        totalPaid,
        successCount,
        failCount: results.length - successCount,
        results,
      };
    }),

  // Estatísticas para pagamento em lote
  batchPayStats: tenantProcedure
    .query(async ({ ctx }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(today);
      endOfWeek.setDate(endOfWeek.getDate() + 7);

      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const [overdueCount, overdueValue, weekCount, weekValue, monthCount, monthValue] = await Promise.all([
        ctx.prisma.accountsPayable.count({
          where: {
            ...tenantFilter(ctx.companyId, false),
            status: { in: ["PENDING", "PARTIAL"] },
            dueDate: { lt: today },
          },
        }),
        ctx.prisma.accountsPayable.aggregate({
          where: {
            ...tenantFilter(ctx.companyId, false),
            status: { in: ["PENDING", "PARTIAL"] },
            dueDate: { lt: today },
          },
          _sum: { netValue: true },
        }),
        ctx.prisma.accountsPayable.count({
          where: {
            ...tenantFilter(ctx.companyId, false),
            status: { in: ["PENDING", "PARTIAL"] },
            dueDate: { gte: today, lte: endOfWeek },
          },
        }),
        ctx.prisma.accountsPayable.aggregate({
          where: {
            ...tenantFilter(ctx.companyId, false),
            status: { in: ["PENDING", "PARTIAL"] },
            dueDate: { gte: today, lte: endOfWeek },
          },
          _sum: { netValue: true },
        }),
        ctx.prisma.accountsPayable.count({
          where: {
            ...tenantFilter(ctx.companyId, false),
            status: { in: ["PENDING", "PARTIAL"] },
            dueDate: { gte: today, lte: endOfMonth },
          },
        }),
        ctx.prisma.accountsPayable.aggregate({
          where: {
            ...tenantFilter(ctx.companyId, false),
            status: { in: ["PENDING", "PARTIAL"] },
            dueDate: { gte: today, lte: endOfMonth },
          },
          _sum: { netValue: true },
        }),
      ]);

      return {
        overdue: { count: overdueCount, value: overdueValue._sum.netValue || 0 },
        thisWeek: { count: weekCount, value: weekValue._sum.netValue || 0 },
        thisMonth: { count: monthCount, value: monthValue._sum.netValue || 0 },
      };
    }),
});
