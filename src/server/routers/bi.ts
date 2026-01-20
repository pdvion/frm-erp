import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";

export const biRouter = createTRPCRouter({
  // ============================================================================
  // DASHBOARDS
  // ============================================================================

  listDashboards: tenantProcedure.query(async ({ ctx }) => {
    return ctx.prisma.dashboard.findMany({
      where: {
        OR: [
          { companyId: ctx.companyId },
          { isPublic: true },
        ],
      },
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { widgets: true } },
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
  }),

  getDashboard: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.dashboard.findFirst({
        where: {
          id: input.id,
          OR: [
            { companyId: ctx.companyId },
            { isPublic: true },
          ],
        },
        include: {
          creator: { select: { id: true, name: true } },
          widgets: {
            include: {
              kpi: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }),

  createDashboard: tenantProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        isDefault: z.boolean().optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.isDefault) {
        await ctx.prisma.dashboard.updateMany({
          where: { companyId: ctx.companyId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return ctx.prisma.dashboard.create({
        data: {
          ...input,
          companyId: ctx.companyId,
          createdBy: ctx.tenant.userId,
        },
      });
    }),

  updateDashboard: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        isDefault: z.boolean().optional(),
        isPublic: z.boolean().optional(),
        layout: z.any().optional(),
        filters: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      if (data.isDefault) {
        await ctx.prisma.dashboard.updateMany({
          where: { companyId: ctx.companyId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return ctx.prisma.dashboard.update({
        where: { id },
        data,
      });
    }),

  deleteDashboard: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.dashboard.delete({
        where: { id: input.id },
      });
    }),

  // ============================================================================
  // WIDGETS
  // ============================================================================

  addWidget: tenantProcedure
    .input(
      z.object({
        dashboardId: z.string().uuid(),
        type: z.enum(["KPI_CARD", "LINE_CHART", "BAR_CHART", "PIE_CHART", "TABLE", "GAUGE"]),
        title: z.string().min(1),
        config: z.any().optional(),
        position: z.any().optional(),
        kpiId: z.string().uuid().optional(),
        dataSource: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.dashboardWidget.create({
        data: input,
      });
    }),

  updateWidget: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        config: z.any().optional(),
        position: z.any().optional(),
        kpiId: z.string().uuid().nullable().optional(),
        dataSource: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.dashboardWidget.update({
        where: { id },
        data,
      });
    }),

  deleteWidget: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.dashboardWidget.delete({
        where: { id: input.id },
      });
    }),

  // ============================================================================
  // KPIs
  // ============================================================================

  listKpis: tenantProcedure
    .input(
      z.object({
        category: z.enum(["FINANCIAL", "PURCHASING", "INVENTORY", "PRODUCTION", "SALES", "HR"]).optional(),
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.kpi.findMany({
        where: {
          ...tenantFilter(ctx.companyId, false),
          ...(input?.category && { category: input.category }),
          ...(input?.isActive !== undefined && { isActive: input.isActive }),
        },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
    }),

  getKpi: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.kpi.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId, false),
        },
        include: {
          values: {
            orderBy: { period: "desc" },
            take: 30,
          },
        },
      });
    }),

  createKpi: tenantProcedure
    .input(
      z.object({
        code: z.string().min(1).max(50),
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(["FINANCIAL", "PURCHASING", "INVENTORY", "PRODUCTION", "SALES", "HR"]),
        unit: z.string().max(20).optional(),
        formula: z.string().optional(),
        targetMin: z.number().optional(),
        targetExpected: z.number().optional(),
        targetMax: z.number().optional(),
        polarity: z.enum(["HIGHER", "LOWER"]).optional(),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.kpi.create({
        data: {
          ...input,
          companyId: ctx.companyId,
        },
      });
    }),

  updateKpi: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        unit: z.string().max(20).optional(),
        formula: z.string().optional(),
        targetMin: z.number().nullable().optional(),
        targetExpected: z.number().nullable().optional(),
        targetMax: z.number().nullable().optional(),
        polarity: z.enum(["HIGHER", "LOWER"]).optional(),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.kpi.update({
        where: { id },
        data,
      });
    }),

  deleteKpi: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.kpi.delete({
        where: { id: input.id },
      });
    }),

  // ============================================================================
  // KPI VALUES
  // ============================================================================

  getKpiValues: tenantProcedure
    .input(
      z.object({
        kpiId: z.string().uuid(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().min(1).max(365).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.kpiValue.findMany({
        where: {
          kpiId: input.kpiId,
          companyId: ctx.companyId,
          ...(input.startDate && { period: { gte: new Date(input.startDate) } }),
          ...(input.endDate && { period: { lte: new Date(input.endDate) } }),
        },
        orderBy: { period: "desc" },
        take: input.limit || 30,
      });
    }),

  recordKpiValue: tenantProcedure
    .input(
      z.object({
        kpiId: z.string().uuid(),
        period: z.string(),
        value: z.number(),
        target: z.number().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const kpi = await ctx.prisma.kpi.findFirst({
        where: { id: input.kpiId, companyId: ctx.companyId },
      });

      if (!kpi) throw new Error("KPI não encontrado");

      const target = input.target || kpi.targetExpected;
      let status: "BELOW" | "ON_TARGET" | "ABOVE" = "ON_TARGET";

      if (target) {
        if (kpi.polarity === "HIGHER") {
          if (input.value < (kpi.targetMin || target * 0.9)) status = "BELOW";
          else if (input.value >= (kpi.targetMax || target * 1.1)) status = "ABOVE";
        } else {
          if (input.value > (kpi.targetMax || target * 1.1)) status = "BELOW";
          else if (input.value <= (kpi.targetMin || target * 0.9)) status = "ABOVE";
        }
      }

      return ctx.prisma.kpiValue.upsert({
        where: {
          kpiId_period: {
            kpiId: input.kpiId,
            period: new Date(input.period),
          },
        },
        update: {
          value: input.value,
          target,
          status,
          metadata: input.metadata || {},
        },
        create: {
          kpiId: input.kpiId,
          companyId: ctx.companyId,
          period: new Date(input.period),
          value: input.value,
          target,
          status,
          metadata: input.metadata || {},
        },
      });
    }),

  // ============================================================================
  // ANALYTICS - Dados agregados para dashboards
  // ============================================================================

  getFinancialKpis: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const [payablesThisMonth, payablesLastMonth, receivablesThisMonth, receivablesLastMonth, overduePayables, overdueReceivables] = await Promise.all([
      ctx.prisma.accountsPayable.aggregate({
        where: { companyId: ctx.companyId, dueDate: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { netValue: true },
      }),
      ctx.prisma.accountsPayable.aggregate({
        where: { companyId: ctx.companyId, dueDate: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { netValue: true },
      }),
      ctx.prisma.accountsReceivable.aggregate({
        where: { companyId: ctx.companyId, dueDate: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { netValue: true },
      }),
      ctx.prisma.accountsReceivable.aggregate({
        where: { companyId: ctx.companyId, dueDate: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { netValue: true },
      }),
      ctx.prisma.accountsPayable.aggregate({
        where: { companyId: ctx.companyId, status: "PENDING", dueDate: { lt: today } },
        _sum: { netValue: true },
        _count: true,
      }),
      ctx.prisma.accountsReceivable.aggregate({
        where: { companyId: ctx.companyId, status: "PENDING", dueDate: { lt: today } },
        _sum: { netValue: true },
        _count: true,
      }),
    ]);

    return {
      payables: {
        thisMonth: payablesThisMonth._sum.netValue || 0,
        lastMonth: payablesLastMonth._sum.netValue || 0,
        overdue: overduePayables._sum.netValue || 0,
        overdueCount: overduePayables._count,
      },
      receivables: {
        thisMonth: receivablesThisMonth._sum.netValue || 0,
        lastMonth: receivablesLastMonth._sum.netValue || 0,
        overdue: overdueReceivables._sum.netValue || 0,
        overdueCount: overdueReceivables._count,
      },
      cashFlow: {
        thisMonth: (receivablesThisMonth._sum.netValue || 0) - (payablesThisMonth._sum.netValue || 0),
        lastMonth: (receivablesLastMonth._sum.netValue || 0) - (payablesLastMonth._sum.netValue || 0),
      },
    };
  }),

  getInventoryKpis: tenantProcedure.query(async ({ ctx }) => {
    const [totalItems, lowStock, movements30d] = await Promise.all([
      ctx.prisma.inventory.aggregate({
        where: { companyId: ctx.companyId },
        _sum: { quantity: true, totalValue: true },
        _count: true,
      }),
      ctx.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM inventory i
        JOIN materials m ON i."materialId" = m.id
        WHERE i."companyId" = ${ctx.companyId}::uuid
        AND i.quantity < COALESCE(m."minQuantity", 0)
      `,
      ctx.prisma.inventoryMovement.count({
        where: {
          inventory: { companyId: ctx.companyId },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      totalItems: totalItems._count,
      totalQuantity: totalItems._sum.quantity || 0,
      totalValue: totalItems._sum.totalValue || 0,
      lowStockCount: Number(lowStock[0]?.count || 0),
      movements30d,
    };
  }),

  getPurchasingKpis: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [pendingQuotes, pendingOrders, ordersThisMonth, avgLeadTime] = await Promise.all([
      ctx.prisma.quote.count({
        where: { supplier: { companyId: ctx.companyId }, status: { in: ["PENDING", "SENT"] } },
      }),
      ctx.prisma.purchaseOrder.count({
        where: { supplier: { companyId: ctx.companyId }, status: { in: ["PENDING", "APPROVED", "SENT"] } },
      }),
      ctx.prisma.purchaseOrder.aggregate({
        where: { supplier: { companyId: ctx.companyId }, createdAt: { gte: startOfMonth } },
        _sum: { totalValue: true },
        _count: true,
      }),
      ctx.prisma.$queryRaw<[{ avg_days: number }]>`
        SELECT AVG(EXTRACT(DAY FROM ("deliveryDate" - "createdAt"))) as avg_days
        FROM purchase_orders po
        JOIN suppliers s ON po."supplierId" = s.id
        WHERE s."companyId" = ${ctx.companyId}::uuid
        AND po.status = 'COMPLETED'
        AND po."deliveryDate" IS NOT NULL
        AND po."createdAt" > NOW() - INTERVAL '90 days'
      `,
    ]);

    return {
      pendingQuotes,
      pendingOrders,
      ordersThisMonth: ordersThisMonth._count,
      valueThisMonth: ordersThisMonth._sum.totalValue || 0,
      avgLeadTimeDays: Math.round(avgLeadTime[0]?.avg_days || 0),
    };
  }),

  getProductionKpis: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [activeOrders, completedThisMonth, oeeAvg] = await Promise.all([
      ctx.prisma.productionOrder.count({
        where: { companyId: ctx.companyId, status: { in: ["PLANNED", "IN_PROGRESS"] } },
      }),
      ctx.prisma.productionOrder.count({
        where: { companyId: ctx.companyId, status: "COMPLETED", completedAt: { gte: startOfMonth } },
      }),
      ctx.prisma.$queryRaw<[{ avg_oee: number }]>`
        SELECT AVG(oee) as avg_oee FROM oee_records
        WHERE "companyId" = ${ctx.companyId}::uuid
        AND date > NOW() - INTERVAL '30 days'
      `,
    ]);

    return {
      activeOrders,
      completedThisMonth,
      avgOee: Math.round((oeeAvg[0]?.avg_oee || 0) * 100) / 100,
    };
  }),

  getSalesKpis: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const [leadsThisMonth, ordersThisMonth, ordersLastMonth, conversionRate] = await Promise.all([
      ctx.prisma.lead.count({
        where: { companyId: ctx.companyId, createdAt: { gte: startOfMonth } },
      }),
      ctx.prisma.salesOrder.aggregate({
        where: { companyId: ctx.companyId, createdAt: { gte: startOfMonth } },
        _sum: { totalValue: true },
        _count: true,
      }),
      ctx.prisma.salesOrder.aggregate({
        where: { companyId: ctx.companyId, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { totalValue: true },
        _count: true,
      }),
      ctx.prisma.$queryRaw<[{ rate: number }]>`
        SELECT 
          CASE WHEN COUNT(*) FILTER (WHERE status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST')) > 0
          THEN COUNT(*) FILTER (WHERE status = 'WON')::float / COUNT(*) FILTER (WHERE status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'))
          ELSE 0 END as rate
        FROM leads
        WHERE "companyId" = ${ctx.companyId}::uuid
        AND "createdAt" > NOW() - INTERVAL '90 days'
      `,
    ]);

    return {
      leadsThisMonth,
      ordersThisMonth: ordersThisMonth._count,
      revenueThisMonth: ordersThisMonth._sum.totalValue || 0,
      revenueLastMonth: ordersLastMonth._sum.totalValue || 0,
      conversionRate: Math.round((conversionRate[0]?.rate || 0) * 100),
    };
  }),

  // Dashboard consolidado com todos os KPIs
  getConsolidatedDashboard: tenantProcedure.query(async ({ ctx }) => {
    return {
      lastUpdated: new Date().toISOString(),
      companyId: ctx.companyId,
    };
  }),
});
