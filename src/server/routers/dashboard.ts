import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { prisma } from "@/lib/prisma";

export const dashboardRouter = createTRPCRouter({
  // KPIs principais do dashboard
  kpis: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Estoque
    const inventoryStats = await prisma.inventory.aggregate({
      where: tenantFilter(ctx.companyId, false),
      _sum: { quantity: true },
      _count: true,
    });

    // Estoque abaixo do mínimo
    const lowStockCount = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM inventory i
      JOIN materials m ON i."materialId" = m.id
      WHERE i."companyId" = ${ctx.companyId}
      AND i.quantity < COALESCE(m."minQuantity", 0)
    `;

    // Cotações pendentes
    const pendingQuotes = await prisma.quote.count({
      where: {
        supplier: tenantFilter(ctx.companyId, true),
        status: { in: ["PENDING", "SENT"] },
      },
    });

    // Pedidos de compra em aberto
    const openPurchaseOrders = await prisma.purchaseOrder.count({
      where: {
        supplier: tenantFilter(ctx.companyId, true),
        status: { in: ["PENDING", "APPROVED", "SENT", "PARTIAL"] },
      },
    });

    // NFes pendentes de aprovação - usando raw query para evitar erro de enum
    const pendingInvoicesResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM received_invoices
      WHERE "companyId" = ${ctx.companyId}::uuid
      AND status IN ('PENDING', 'VALIDATED')
    `;
    const pendingInvoices = Number(pendingInvoicesResult[0]?.count || 0);

    // Contas a pagar vencidas
    const payablesOverdue = await prisma.accountsPayable.aggregate({
      where: {
        ...tenantFilter(ctx.companyId, false),
        status: "PENDING",
        dueDate: { lt: today },
      },
      _sum: { netValue: true },
      _count: true,
    });

    // Contas a pagar hoje
    const payablesToday = await prisma.accountsPayable.aggregate({
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
    });

    // Contas a pagar esta semana
    const payablesThisWeek = await prisma.accountsPayable.aggregate({
      where: {
        ...tenantFilter(ctx.companyId, false),
        status: "PENDING",
        dueDate: { gte: today, lte: endOfWeek },
      },
      _sum: { netValue: true },
      _count: true,
    });

    // Pago este mês
    const paidThisMonth = await prisma.accountsPayable.aggregate({
      where: {
        ...tenantFilter(ctx.companyId, false),
        status: "PAID",
        paidAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { paidValue: true },
      _count: true,
    });

    // Requisições pendentes
    const pendingRequisitions = await prisma.materialRequisition.count({
      where: {
        ...tenantFilter(ctx.companyId, false),
        status: { in: ["PENDING", "APPROVED", "IN_SEPARATION"] },
      },
    });

    // Tarefas - usando raw query para evitar problemas de tipo
    const taskStats = await prisma.$queryRaw<[{ pending: bigint, in_progress: bigint, overdue: bigint, my_tasks: bigint }]>`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress,
        COUNT(*) FILTER (WHERE status IN ('PENDING', 'ACCEPTED', 'IN_PROGRESS') AND deadline < NOW()) as overdue,
        COUNT(*) FILTER (WHERE owner_id = ${ctx.tenant.userId}::uuid AND status NOT IN ('COMPLETED', 'CANCELLED')) as my_tasks
      FROM tasks
      WHERE company_id = ${ctx.companyId}::uuid
    `;

    // Calcular valor total do estoque
    const inventoryValue = await prisma.$queryRaw<[{ total: number }]>`
      SELECT COALESCE(SUM(i.quantity * i."unitCost"), 0) as total
      FROM inventory i
      WHERE i."companyId" = ${ctx.companyId}
    `;

    return {
      inventory: {
        totalItems: inventoryStats._count,
        totalQuantity: inventoryStats._sum.quantity || 0,
        totalValue: Number(inventoryValue[0]?.total || 0),
        lowStockCount: Number(lowStockCount[0]?.count || 0),
      },
      purchases: {
        pendingQuotes,
        openPurchaseOrders,
        pendingInvoices,
      },
      financial: {
        overdue: {
          value: payablesOverdue._sum.netValue || 0,
          count: payablesOverdue._count,
        },
        dueToday: {
          value: payablesToday._sum.netValue || 0,
          count: payablesToday._count,
        },
        dueThisWeek: {
          value: payablesThisWeek._sum.netValue || 0,
          count: payablesThisWeek._count,
        },
        paidThisMonth: {
          value: paidThisMonth._sum.paidValue || 0,
          count: paidThisMonth._count,
        },
      },
      tasks: {
        pending: Number(taskStats[0]?.pending || 0),
        inProgress: Number(taskStats[0]?.in_progress || 0),
        overdue: Number(taskStats[0]?.overdue || 0),
        myTasks: Number(taskStats[0]?.my_tasks || 0),
      },
      requisitions: {
        pending: pendingRequisitions,
      },
    };
  }),

  // Atividades recentes
  recentActivity: tenantProcedure.query(async ({ ctx }) => {
    // Últimas NFes
    const recentInvoices = await prisma.receivedInvoice.findMany({
      where: tenantFilter(ctx.companyId, false),
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        totalInvoice: true,
        status: true,
        createdAt: true,
        supplierName: true,
      },
    });

    // Últimas requisições
    const recentRequisitions = await prisma.materialRequisition.findMany({
      where: tenantFilter(ctx.companyId, false),
      orderBy: { requestedAt: "desc" },
      take: 5,
      select: {
        id: true,
        code: true,
        type: true,
        status: true,
        requestedAt: true,
      },
    });

    // Últimas tarefas - usando raw query
    const recentTasks = await prisma.$queryRaw<Array<{
      id: string;
      code: number;
      title: string;
      status: string;
      priority: string;
      created_at: Date;
    }>>`
      SELECT id, code, title, status, priority, created_at
      FROM tasks
      WHERE company_id = ${ctx.companyId}::uuid
      ORDER BY created_at DESC
      LIMIT 5
    `;

    return {
      invoices: recentInvoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        totalValue: inv.totalInvoice,
        status: inv.status,
        createdAt: inv.createdAt,
        supplier: { tradeName: inv.supplierName, companyName: inv.supplierName },
      })),
      requisitions: recentRequisitions.map(r => ({
        ...r,
        department: null,
      })),
      tasks: recentTasks.map(t => ({
        id: t.id,
        code: t.code,
        title: t.title,
        status: t.status,
        priority: t.priority,
        createdAt: t.created_at,
        owner: null,
      })),
    };
  }),

  // Alertas do sistema
  alerts: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alerts: Array<{
      type: "error" | "warning" | "info";
      title: string;
      message: string;
      link?: string;
      count?: number;
    }> = [];

    // Verificar estoque baixo
    const lowStock = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM inventory i
      JOIN materials m ON i."materialId" = m.id
      WHERE i."companyId" = ${ctx.companyId}
      AND i.quantity < COALESCE(m."minQuantity", 0)
    `;
    
    if (Number(lowStock[0]?.count || 0) > 0) {
      alerts.push({
        type: "warning",
        title: "Estoque Baixo",
        message: `${lowStock[0].count} itens abaixo do estoque mínimo`,
        link: "/inventory?belowMinimum=true",
        count: Number(lowStock[0].count),
      });
    }

    // Verificar contas vencidas
    const overduePayables = await prisma.accountsPayable.count({
      where: {
        ...tenantFilter(ctx.companyId, false),
        status: "PENDING",
        dueDate: { lt: today },
      },
    });
    
    if (overduePayables > 0) {
      alerts.push({
        type: "error",
        title: "Contas Vencidas",
        message: `${overduePayables} títulos vencidos aguardando pagamento`,
        link: "/payables?status=OVERDUE",
        count: overduePayables,
      });
    }

    // Verificar NFes pendentes - usando raw query para evitar erro de enum
    const pendingInvoicesAlert = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM received_invoices
      WHERE "companyId" = ${ctx.companyId}::uuid
      AND status = 'PENDING'
    `;
    const pendingInvoicesCount = Number(pendingInvoicesAlert[0]?.count || 0);
    
    if (pendingInvoicesCount > 0) {
      alerts.push({
        type: "info",
        title: "NFes Pendentes",
        message: `${pendingInvoicesCount} notas fiscais aguardando validação`,
        link: "/invoices?status=PENDING",
        count: pendingInvoicesCount,
      });
    }

    // Verificar tarefas atrasadas
    const overdueTasks = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM tasks
      WHERE company_id = ${ctx.companyId}::uuid
      AND status IN ('PENDING', 'ACCEPTED', 'IN_PROGRESS')
      AND deadline < NOW()
    `;
    
    if (Number(overdueTasks[0]?.count || 0) > 0) {
      alerts.push({
        type: "warning",
        title: "Tarefas Atrasadas",
        message: `${overdueTasks[0].count} tarefas com prazo vencido`,
        link: "/tasks?overdue=true",
        count: Number(overdueTasks[0].count),
      });
    }

    return alerts;
  }),
});
