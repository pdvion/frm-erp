import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { prisma } from "@/lib/prisma";
import { createModuleLogger } from "@/lib/logger";

const dashboardLogger = createModuleLogger("dashboard");

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

  // Dados para gráficos do dashboard
  // NOTA: As queries abaixo usam Prisma tagged template literals ($queryRaw`...`)
  // que são SEGURAS contra SQL injection pois usam prepared statements.
  // Os parâmetros ${...} são automaticamente escapados pelo Prisma.
  chartData: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    // Helper para executar queries com fallback para array vazio
    async function safeQuery<T>(queryFn: () => Promise<T[]>): Promise<T[]> {
      try {
        return await queryFn();
      } catch (error) {
        dashboardLogger.error("Chart query falhou", {
          companyId: ctx.companyId,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        return [];
      }
    }

    // Pagamentos por mês (últimos 6 meses) - SQL seguro via prepared statements
    const paymentsByMonth = await safeQuery(() => 
      prisma.$queryRaw<Array<{ month: string; paid: number; pending: number }>>`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "dueDate"), 'Mon') as month,
          COALESCE(SUM(CASE WHEN status = 'PAID' THEN "netValue" ELSE 0 END), 0)::float as paid,
          COALESCE(SUM(CASE WHEN status = 'PENDING' THEN "netValue" ELSE 0 END), 0)::float as pending
        FROM accounts_payable
        WHERE "companyId" = ${ctx.companyId}::uuid
          AND "dueDate" >= ${sixMonthsAgo}
        GROUP BY DATE_TRUNC('month', "dueDate")
        ORDER BY DATE_TRUNC('month', "dueDate")
      `
    );

    // Compras por categoria (top 5)
    const purchasesByCategory = await safeQuery(() =>
      prisma.$queryRaw<Array<{ name: string; value: number }>>`
        SELECT 
          COALESCE(c.name, 'Sem Categoria') as name,
          COALESCE(SUM(ri."totalValue"), 0)::float as value
        FROM received_invoices ri
        LEFT JOIN materials m ON m.id = (
          SELECT "materialId" FROM received_invoice_items WHERE "invoiceId" = ri.id LIMIT 1
        )
        LEFT JOIN categories c ON c.id = m."categoryId"
        WHERE ri."companyId" = ${ctx.companyId}::uuid
          AND ri."issueDate" >= ${sixMonthsAgo}
        GROUP BY c.name
        ORDER BY value DESC
        LIMIT 5
      `
    );

    // Estoque por categoria
    const inventoryByCategory = await safeQuery(() =>
      prisma.$queryRaw<Array<{ name: string; value: number }>>`
        SELECT 
          COALESCE(c.name, 'Sem Categoria') as name,
          COALESCE(SUM(i.quantity * m."averageCost"), 0)::float as value
        FROM inventory i
        JOIN materials m ON m.id = i."materialId"
        LEFT JOIN categories c ON c.id = m."categoryId"
        WHERE i."companyId" = ${ctx.companyId}::uuid
        GROUP BY c.name
        ORDER BY value DESC
        LIMIT 6
      `
    );

    // Requisições por mês
    const requisitionsByMonth = await safeQuery(() =>
      prisma.$queryRaw<Array<{ month: string; count: number }>>`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
          COUNT(*)::int as count
        FROM material_requisitions
        WHERE "companyId" = ${ctx.companyId}::uuid
          AND "createdAt" >= ${sixMonthsAgo}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt")
      `
    );

    // Fluxo de caixa projetado (próximos 30 dias)
    const cashFlowProjection = await safeQuery(() =>
      prisma.$queryRaw<Array<{ date: string; payables: number; receivables: number }>>`
        WITH dates AS (
          SELECT generate_series(
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '30 days',
            INTERVAL '7 days'
          )::date as date
        )
        SELECT 
          TO_CHAR(d.date, 'DD/MM') as date,
          COALESCE((
            SELECT SUM("netValue")::float FROM accounts_payable 
            WHERE "companyId" = ${ctx.companyId}::uuid 
            AND status = 'PENDING'
            AND "dueDate" BETWEEN d.date AND d.date + INTERVAL '6 days'
          ), 0) as payables,
          COALESCE((
            SELECT SUM("netValue")::float FROM accounts_receivable 
            WHERE "companyId" = ${ctx.companyId}::uuid 
            AND status = 'PENDING'
            AND "dueDate" BETWEEN d.date AND d.date + INTERVAL '6 days'
          ), 0) as receivables
        FROM dates d
        ORDER BY d.date
      `
    );

    return {
      paymentsByMonth: paymentsByMonth.map(p => ({
        name: p.month,
        Pago: Number(p.paid) || 0,
        Pendente: Number(p.pending) || 0,
      })),
      purchasesByCategory: purchasesByCategory.map(p => ({
        name: p.name,
        value: Number(p.value) || 0,
      })),
      inventoryByCategory: inventoryByCategory.map(i => ({
        name: i.name,
        value: Number(i.value) || 0,
      })),
      requisitionsByMonth: requisitionsByMonth.map(r => ({
        name: r.month,
        Requisições: Number(r.count) || 0,
      })),
      cashFlowProjection: cashFlowProjection.map(c => ({
        name: c.date,
        "A Pagar": Number(c.payables) || 0,
        "A Receber": Number(c.receivables) || 0,
      })),
    };
  }),

  // Dashboard específico do módulo Compras
  purchasesKpis: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Cotações
    const quotesStats = await prisma.quote.groupBy({
      by: ["status"],
      where: { supplier: tenantFilter(ctx.companyId, true) },
      _count: true,
      _sum: { totalValue: true },
    });

    // Pedidos de compra
    const ordersStats = await prisma.purchaseOrder.groupBy({
      by: ["status"],
      where: { supplier: tenantFilter(ctx.companyId, true) },
      _count: true,
      _sum: { totalValue: true },
    });

    // NFes recebidas no mês
    const nfesThisMonth = await prisma.$queryRaw<[{ count: bigint; total: number }]>`
      SELECT COUNT(*) as count, COALESCE(SUM("totalInvoice"), 0)::float as total
      FROM received_invoices
      WHERE "companyId" = ${ctx.companyId}::uuid
      AND "issueDate" >= ${startOfMonth}
    `;

    // Top 5 fornecedores por valor
    const topSuppliers = await prisma.$queryRaw<Array<{ name: string; total: number; count: bigint }>>`
      SELECT 
        s."tradeName" as name,
        COALESCE(SUM(ri."totalInvoice"), 0)::float as total,
        COUNT(*) as count
      FROM received_invoices ri
      JOIN suppliers s ON s.id = ri."supplierId"
      WHERE ri."companyId" = ${ctx.companyId}::uuid
      AND ri."issueDate" >= ${thirtyDaysAgo}
      GROUP BY s.id, s."tradeName"
      ORDER BY total DESC
      LIMIT 5
    `;

    // Compras por categoria (últimos 30 dias)
    const purchasesByCategory = await prisma.$queryRaw<Array<{ name: string; value: number }>>`
      SELECT 
        COALESCE(c.name, 'Sem Categoria') as name,
        COALESCE(SUM(rii."totalValue"), 0)::float as value
      FROM received_invoice_items rii
      JOIN received_invoices ri ON ri.id = rii."invoiceId"
      JOIN materials m ON m.id = rii."materialId"
      LEFT JOIN categories c ON c.id = m."categoryId"
      WHERE ri."companyId" = ${ctx.companyId}::uuid
      AND ri."issueDate" >= ${thirtyDaysAgo}
      GROUP BY c.name
      ORDER BY value DESC
      LIMIT 6
    `;

    // Evolução de compras (últimos 6 meses)
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const purchasesEvolution = await prisma.$queryRaw<Array<{ month: string; total: number; count: bigint }>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "issueDate"), 'Mon') as month,
        COALESCE(SUM("totalInvoice"), 0)::float as total,
        COUNT(*) as count
      FROM received_invoices
      WHERE "companyId" = ${ctx.companyId}::uuid
      AND "issueDate" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "issueDate")
      ORDER BY DATE_TRUNC('month', "issueDate")
    `;

    return {
      quotes: {
        pending: quotesStats.find(q => q.status === "PENDING")?._count || 0,
        sent: quotesStats.find(q => q.status === "SENT")?._count || 0,
        approved: quotesStats.find(q => q.status === "APPROVED")?._count || 0,
        total: quotesStats.reduce((acc, q) => acc + q._count, 0),
        totalValue: quotesStats.reduce((acc, q) => acc + (Number(q._sum.totalValue) || 0), 0),
      },
      orders: {
        pending: ordersStats.find(o => o.status === "PENDING")?._count || 0,
        approved: ordersStats.find(o => o.status === "APPROVED")?._count || 0,
        sent: ordersStats.find(o => o.status === "SENT")?._count || 0,
        partial: ordersStats.find(o => o.status === "PARTIAL")?._count || 0,
        completed: ordersStats.find(o => o.status === "COMPLETED")?._count || 0,
        total: ordersStats.reduce((acc, o) => acc + o._count, 0),
        totalValue: ordersStats.reduce((acc, o) => acc + (Number(o._sum.totalValue) || 0), 0),
      },
      nfes: {
        thisMonth: Number(nfesThisMonth[0]?.count || 0),
        totalValue: Number(nfesThisMonth[0]?.total || 0),
      },
      topSuppliers: topSuppliers.map(s => ({
        name: s.name,
        total: Number(s.total),
        count: Number(s.count),
      })),
      purchasesByCategory: purchasesByCategory.map(p => ({
        name: p.name,
        value: Number(p.value),
      })),
      purchasesEvolution: purchasesEvolution.map(p => ({
        name: p.month,
        Valor: Number(p.total),
        Quantidade: Number(p.count),
      })),
    };
  }),

  // Dashboard específico do módulo Estoque
  inventoryKpis: tenantProcedure.query(async ({ ctx }) => {
    // Resumo geral do estoque
    const inventorySummary = await prisma.$queryRaw<[{ 
      total_items: bigint; 
      total_value: number;
      low_stock: bigint;
      zero_stock: bigint;
    }]>`
      SELECT 
        COUNT(DISTINCT i."materialId") as total_items,
        COALESCE(SUM(i.quantity * i."unitCost"), 0)::float as total_value,
        COUNT(*) FILTER (WHERE i.quantity < COALESCE(m."minQuantity", 0) AND i.quantity > 0) as low_stock,
        COUNT(*) FILTER (WHERE i.quantity = 0) as zero_stock
      FROM inventory i
      JOIN materials m ON m.id = i."materialId"
      WHERE i."companyId" = ${ctx.companyId}::uuid
    `;

    // Movimentações recentes (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const movementsSummary = await prisma.$queryRaw<[{
      entries: bigint;
      exits: bigint;
      entries_value: number;
      exits_value: number;
    }]>`
      SELECT 
        COUNT(*) FILTER (WHERE type = 'ENTRY') as entries,
        COUNT(*) FILTER (WHERE type = 'EXIT') as exits,
        COALESCE(SUM(CASE WHEN type = 'ENTRY' THEN quantity * "unitCost" ELSE 0 END), 0)::float as entries_value,
        COALESCE(SUM(CASE WHEN type = 'EXIT' THEN quantity * "unitCost" ELSE 0 END), 0)::float as exits_value
      FROM inventory_movements
      WHERE "companyId" = ${ctx.companyId}::uuid
      AND "createdAt" >= ${thirtyDaysAgo}
    `;

    // Estoque por localização
    const stockByLocation = await prisma.$queryRaw<Array<{ name: string; value: number; count: bigint }>>`
      SELECT 
        COALESCE(sl.name, 'Sem Local') as name,
        COALESCE(SUM(i.quantity * i."unitCost"), 0)::float as value,
        COUNT(*) as count
      FROM inventory i
      LEFT JOIN stock_locations sl ON sl.id = i."locationId"
      WHERE i."companyId" = ${ctx.companyId}::uuid
      GROUP BY sl.name
      ORDER BY value DESC
      LIMIT 6
    `;

    // Estoque por categoria
    const stockByCategory = await prisma.$queryRaw<Array<{ name: string; value: number }>>`
      SELECT 
        COALESCE(c.name, 'Sem Categoria') as name,
        COALESCE(SUM(i.quantity * i."unitCost"), 0)::float as value
      FROM inventory i
      JOIN materials m ON m.id = i."materialId"
      LEFT JOIN categories c ON c.id = m."categoryId"
      WHERE i."companyId" = ${ctx.companyId}::uuid
      GROUP BY c.name
      ORDER BY value DESC
      LIMIT 6
    `;

    // Evolução do estoque (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const stockEvolution = await prisma.$queryRaw<Array<{ month: string; entries: number; exits: number }>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
        COALESCE(SUM(CASE WHEN type = 'ENTRY' THEN quantity * "unitCost" ELSE 0 END), 0)::float as entries,
        COALESCE(SUM(CASE WHEN type = 'EXIT' THEN quantity * "unitCost" ELSE 0 END), 0)::float as exits
      FROM inventory_movements
      WHERE "companyId" = ${ctx.companyId}::uuid
      AND "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt")
    `;

    return {
      summary: {
        totalItems: Number(inventorySummary[0]?.total_items || 0),
        totalValue: Number(inventorySummary[0]?.total_value || 0),
        lowStock: Number(inventorySummary[0]?.low_stock || 0),
        zeroStock: Number(inventorySummary[0]?.zero_stock || 0),
      },
      movements: {
        entries: Number(movementsSummary[0]?.entries || 0),
        exits: Number(movementsSummary[0]?.exits || 0),
        entriesValue: Number(movementsSummary[0]?.entries_value || 0),
        exitsValue: Number(movementsSummary[0]?.exits_value || 0),
      },
      stockByLocation: stockByLocation.map(s => ({
        name: s.name,
        value: Number(s.value),
        count: Number(s.count),
      })),
      stockByCategory: stockByCategory.map(s => ({
        name: s.name,
        value: Number(s.value),
      })),
      stockEvolution: stockEvolution.map(s => ({
        name: s.month,
        Entradas: Number(s.entries),
        Saídas: Number(s.exits),
      })),
    };
  }),

  // Dashboard específico do módulo Financeiro
  financialKpis: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Contas a pagar
    const payablesSummary = await prisma.$queryRaw<[{
      overdue_count: bigint;
      overdue_value: number;
      today_count: bigint;
      today_value: number;
      week_count: bigint;
      week_value: number;
      month_count: bigint;
      month_value: number;
      paid_month_count: bigint;
      paid_month_value: number;
    }]>`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'PENDING' AND "dueDate" < CURRENT_DATE) as overdue_count,
        COALESCE(SUM("netValue") FILTER (WHERE status = 'PENDING' AND "dueDate" < CURRENT_DATE), 0)::float as overdue_value,
        COUNT(*) FILTER (WHERE status = 'PENDING' AND "dueDate" = CURRENT_DATE) as today_count,
        COALESCE(SUM("netValue") FILTER (WHERE status = 'PENDING' AND "dueDate" = CURRENT_DATE), 0)::float as today_value,
        COUNT(*) FILTER (WHERE status = 'PENDING' AND "dueDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days') as week_count,
        COALESCE(SUM("netValue") FILTER (WHERE status = 'PENDING' AND "dueDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'), 0)::float as week_value,
        COUNT(*) FILTER (WHERE status = 'PENDING' AND "dueDate" BETWEEN ${startOfMonth} AND ${endOfMonth}) as month_count,
        COALESCE(SUM("netValue") FILTER (WHERE status = 'PENDING' AND "dueDate" BETWEEN ${startOfMonth} AND ${endOfMonth}), 0)::float as month_value,
        COUNT(*) FILTER (WHERE status = 'PAID' AND "paidAt" >= ${startOfMonth}) as paid_month_count,
        COALESCE(SUM("paidValue") FILTER (WHERE status = 'PAID' AND "paidAt" >= ${startOfMonth}), 0)::float as paid_month_value
      FROM accounts_payable
      WHERE "companyId" = ${ctx.companyId}::uuid
    `;

    // Contas a receber
    const receivablesSummary = await prisma.$queryRaw<[{
      overdue_count: bigint;
      overdue_value: number;
      today_count: bigint;
      today_value: number;
      week_count: bigint;
      week_value: number;
      received_month_count: bigint;
      received_month_value: number;
    }]>`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'PENDING' AND "dueDate" < CURRENT_DATE) as overdue_count,
        COALESCE(SUM("netValue") FILTER (WHERE status = 'PENDING' AND "dueDate" < CURRENT_DATE), 0)::float as overdue_value,
        COUNT(*) FILTER (WHERE status = 'PENDING' AND "dueDate" = CURRENT_DATE) as today_count,
        COALESCE(SUM("netValue") FILTER (WHERE status = 'PENDING' AND "dueDate" = CURRENT_DATE), 0)::float as today_value,
        COUNT(*) FILTER (WHERE status = 'PENDING' AND "dueDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days') as week_count,
        COALESCE(SUM("netValue") FILTER (WHERE status = 'PENDING' AND "dueDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'), 0)::float as week_value,
        COUNT(*) FILTER (WHERE status = 'PAID' AND "paidAt" >= ${startOfMonth}) as received_month_count,
        COALESCE(SUM("paidValue") FILTER (WHERE status = 'PAID' AND "paidAt" >= ${startOfMonth}), 0)::float as received_month_value
      FROM accounts_receivable
      WHERE "companyId" = ${ctx.companyId}::uuid
    `;

    // Fluxo de caixa projetado (próximos 30 dias)
    const cashFlow = await prisma.$queryRaw<Array<{ date: string; payables: number; receivables: number }>>`
      WITH dates AS (
        SELECT generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', INTERVAL '7 days')::date as date
      )
      SELECT 
        TO_CHAR(d.date, 'DD/MM') as date,
        COALESCE((SELECT SUM("netValue")::float FROM accounts_payable WHERE "companyId" = ${ctx.companyId}::uuid AND status = 'PENDING' AND "dueDate" BETWEEN d.date AND d.date + INTERVAL '6 days'), 0) as payables,
        COALESCE((SELECT SUM("netValue")::float FROM accounts_receivable WHERE "companyId" = ${ctx.companyId}::uuid AND status = 'PENDING' AND "dueDate" BETWEEN d.date AND d.date + INTERVAL '6 days'), 0) as receivables
      FROM dates d
      ORDER BY d.date
    `;

    // Pagamentos por forma de pagamento
    const paymentsByMethod = await prisma.$queryRaw<Array<{ method: string; value: number; count: bigint }>>`
      SELECT 
        COALESCE("paymentMethod", 'Outros') as method,
        COALESCE(SUM("paidValue"), 0)::float as value,
        COUNT(*) as count
      FROM accounts_payable
      WHERE "companyId" = ${ctx.companyId}::uuid
      AND status = 'PAID'
      AND "paidAt" >= ${thirtyDaysAgo}
      GROUP BY "paymentMethod"
      ORDER BY value DESC
    `;

    return {
      payables: {
        overdue: { count: Number(payablesSummary[0]?.overdue_count || 0), value: Number(payablesSummary[0]?.overdue_value || 0) },
        today: { count: Number(payablesSummary[0]?.today_count || 0), value: Number(payablesSummary[0]?.today_value || 0) },
        week: { count: Number(payablesSummary[0]?.week_count || 0), value: Number(payablesSummary[0]?.week_value || 0) },
        month: { count: Number(payablesSummary[0]?.month_count || 0), value: Number(payablesSummary[0]?.month_value || 0) },
        paidMonth: { count: Number(payablesSummary[0]?.paid_month_count || 0), value: Number(payablesSummary[0]?.paid_month_value || 0) },
      },
      receivables: {
        overdue: { count: Number(receivablesSummary[0]?.overdue_count || 0), value: Number(receivablesSummary[0]?.overdue_value || 0) },
        today: { count: Number(receivablesSummary[0]?.today_count || 0), value: Number(receivablesSummary[0]?.today_value || 0) },
        week: { count: Number(receivablesSummary[0]?.week_count || 0), value: Number(receivablesSummary[0]?.week_value || 0) },
        receivedMonth: { count: Number(receivablesSummary[0]?.received_month_count || 0), value: Number(receivablesSummary[0]?.received_month_value || 0) },
      },
      cashFlow: cashFlow.map(c => ({
        name: c.date,
        "A Pagar": Number(c.payables),
        "A Receber": Number(c.receivables),
      })),
      paymentsByMethod: paymentsByMethod.map(p => ({
        name: p.method,
        value: Number(p.value),
        count: Number(p.count),
      })),
    };
  }),

  // Dashboard específico do módulo Vendas
  salesKpis: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    // Pedidos de venda
    const salesOrdersStats = await prisma.$queryRaw<[{
      total: bigint;
      pending: bigint;
      approved: bigint;
      invoiced: bigint;
      total_value: number;
      month_value: number;
    }]>`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
        COUNT(*) FILTER (WHERE status = 'INVOICED') as invoiced,
        COALESCE(SUM("totalValue"), 0)::float as total_value,
        COALESCE(SUM("totalValue") FILTER (WHERE "createdAt" >= ${startOfMonth}), 0)::float as month_value
      FROM sales_orders
      WHERE "companyId" = ${ctx.companyId}::uuid
    `;

    // NFes emitidas no mês
    const issuedInvoicesMonth = await prisma.$queryRaw<[{ count: bigint; total: number }]>`
      SELECT COUNT(*) as count, COALESCE(SUM("totalValue"), 0)::float as total
      FROM issued_invoices
      WHERE "companyId" = ${ctx.companyId}::uuid
      AND "issueDate" >= ${startOfMonth}
    `;

    // Top 5 clientes por valor
    const topCustomers = await prisma.$queryRaw<Array<{ name: string; total: number; count: bigint }>>`
      SELECT 
        c."tradeName" as name,
        COALESCE(SUM(so."totalValue"), 0)::float as total,
        COUNT(*) as count
      FROM sales_orders so
      JOIN customers c ON c.id = so."customerId"
      WHERE so."companyId" = ${ctx.companyId}::uuid
      AND so."createdAt" >= ${thirtyDaysAgo}
      GROUP BY c.id, c."tradeName"
      ORDER BY total DESC
      LIMIT 5
    `;

    // Vendas por categoria (últimos 30 dias)
    const salesByCategory = await prisma.$queryRaw<Array<{ name: string; value: number }>>`
      SELECT 
        COALESCE(c.name, 'Sem Categoria') as name,
        COALESCE(SUM(soi."totalValue"), 0)::float as value
      FROM sales_order_items soi
      JOIN sales_orders so ON so.id = soi."salesOrderId"
      JOIN materials m ON m.id = soi."materialId"
      LEFT JOIN categories c ON c.id = m."categoryId"
      WHERE so."companyId" = ${ctx.companyId}::uuid
      AND so."createdAt" >= ${thirtyDaysAgo}
      GROUP BY c.name
      ORDER BY value DESC
      LIMIT 6
    `;

    // Evolução de vendas (últimos 6 meses)
    const salesEvolution = await prisma.$queryRaw<Array<{ month: string; total: number; count: bigint }>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
        COALESCE(SUM("totalValue"), 0)::float as total,
        COUNT(*) as count
      FROM sales_orders
      WHERE "companyId" = ${ctx.companyId}::uuid
      AND "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt")
    `;

    // Contas a receber do mês
    const receivablesMonth = await prisma.$queryRaw<[{ pending: number; received: number }]>`
      SELECT 
        COALESCE(SUM("netValue") FILTER (WHERE status = 'PENDING'), 0)::float as pending,
        COALESCE(SUM("paidValue") FILTER (WHERE status = 'PAID' AND "paidAt" >= ${startOfMonth}), 0)::float as received
      FROM accounts_receivable
      WHERE "companyId" = ${ctx.companyId}::uuid
      AND "dueDate" >= ${startOfMonth}
    `;

    return {
      orders: {
        total: Number(salesOrdersStats[0]?.total || 0),
        pending: Number(salesOrdersStats[0]?.pending || 0),
        approved: Number(salesOrdersStats[0]?.approved || 0),
        invoiced: Number(salesOrdersStats[0]?.invoiced || 0),
        totalValue: Number(salesOrdersStats[0]?.total_value || 0),
        monthValue: Number(salesOrdersStats[0]?.month_value || 0),
      },
      invoices: {
        thisMonth: Number(issuedInvoicesMonth[0]?.count || 0),
        totalValue: Number(issuedInvoicesMonth[0]?.total || 0),
      },
      receivables: {
        pending: Number(receivablesMonth[0]?.pending || 0),
        received: Number(receivablesMonth[0]?.received || 0),
      },
      topCustomers: topCustomers.map(c => ({
        name: c.name,
        total: Number(c.total),
        count: Number(c.count),
      })),
      salesByCategory: salesByCategory.map(s => ({
        name: s.name,
        value: Number(s.value),
      })),
      salesEvolution: salesEvolution.map(s => ({
        name: s.month,
        Valor: Number(s.total),
        Quantidade: Number(s.count),
      })),
    };
  }),

  // Dashboard específico do módulo Produção
  productionKpis: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    // Ordens de produção
    const productionOrdersStats = await prisma.$queryRaw<[{
      total: bigint;
      pending: bigint;
      in_progress: bigint;
      completed: bigint;
      delayed: bigint;
    }]>`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
        COUNT(*) FILTER (WHERE status IN ('PENDING', 'IN_PROGRESS') AND "plannedEndDate" < CURRENT_DATE) as delayed
      FROM production_orders
      WHERE "companyId" = ${ctx.companyId}::uuid
    `;

    // Produção do mês
    const monthProduction = await prisma.$queryRaw<[{ count: bigint; quantity: number }]>`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM("producedQuantity"), 0)::float as quantity
      FROM production_orders
      WHERE "companyId" = ${ctx.companyId}::uuid
      AND status = 'COMPLETED'
      AND "actualEndDate" >= ${startOfMonth}
    `;

    // OEE médio (últimos 30 dias)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const oeeStats = await prisma.$queryRaw<[{ avg_oee: number; avg_availability: number; avg_performance: number; avg_quality: number }]>`
      SELECT 
        COALESCE(AVG(oee), 0)::float as avg_oee,
        COALESCE(AVG(availability), 0)::float as avg_availability,
        COALESCE(AVG(performance), 0)::float as avg_performance,
        COALESCE(AVG(quality), 0)::float as avg_quality
      FROM oee_records
      WHERE "companyId" = ${ctx.companyId}::uuid
      AND date >= ${thirtyDaysAgo}
    `;

    // Produção por produto (top 5)
    const productionByProduct = await prisma.$queryRaw<Array<{ name: string; quantity: number }>>`
      SELECT 
        m.name,
        COALESCE(SUM(po."producedQuantity"), 0)::float as quantity
      FROM production_orders po
      JOIN materials m ON m.id = po."materialId"
      WHERE po."companyId" = ${ctx.companyId}::uuid
      AND po.status = 'COMPLETED'
      AND po."actualEndDate" >= ${startOfMonth}
      GROUP BY m.id, m.name
      ORDER BY quantity DESC
      LIMIT 5
    `;

    // Evolução da produção (últimos 6 meses)
    const productionEvolution = await prisma.$queryRaw<Array<{ month: string; quantity: number; orders: bigint }>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "actualEndDate"), 'Mon') as month,
        COALESCE(SUM("producedQuantity"), 0)::float as quantity,
        COUNT(*) as orders
      FROM production_orders
      WHERE "companyId" = ${ctx.companyId}::uuid
      AND status = 'COMPLETED'
      AND "actualEndDate" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "actualEndDate")
      ORDER BY DATE_TRUNC('month', "actualEndDate")
    `;

    return {
      orders: {
        total: Number(productionOrdersStats[0]?.total || 0),
        pending: Number(productionOrdersStats[0]?.pending || 0),
        inProgress: Number(productionOrdersStats[0]?.in_progress || 0),
        completed: Number(productionOrdersStats[0]?.completed || 0),
        delayed: Number(productionOrdersStats[0]?.delayed || 0),
      },
      monthProduction: {
        count: Number(monthProduction[0]?.count || 0),
        quantity: Number(monthProduction[0]?.quantity || 0),
      },
      oee: {
        average: Number(oeeStats[0]?.avg_oee || 0),
        availability: Number(oeeStats[0]?.avg_availability || 0),
        performance: Number(oeeStats[0]?.avg_performance || 0),
        quality: Number(oeeStats[0]?.avg_quality || 0),
      },
      productionByProduct: productionByProduct.map(p => ({
        name: p.name,
        quantity: Number(p.quantity),
      })),
      productionEvolution: productionEvolution.map(p => ({
        name: p.month,
        Quantidade: Number(p.quantity),
        Ordens: Number(p.orders),
      })),
    };
  }),

  // Dashboard específico do módulo RH
  hrKpis: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Funcionários ativos
    const employeesStats = await prisma.$queryRaw<[{
      total: bigint;
      active: bigint;
      on_vacation: bigint;
      on_leave: bigint;
    }]>`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
        COUNT(*) FILTER (WHERE status = 'ON_VACATION') as on_vacation,
        COUNT(*) FILTER (WHERE status = 'ON_LEAVE') as on_leave
      FROM employees
      WHERE "companyId" = ${ctx.companyId}::uuid
    `;

    // Férias programadas no mês
    const vacationsMonth = await prisma.$queryRaw<[{ count: bigint; pending: bigint }]>`
      SELECT 
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending
      FROM vacations
      WHERE "companyId" = ${ctx.companyId}::uuid
      AND "startDate" <= ${endOfMonth}
      AND "endDate" >= ${startOfMonth}
    `;

    // Aniversariantes do mês
    const birthdaysMonth = await prisma.$queryRaw<Array<{ name: string; birth_date: Date }>>`
      SELECT name, "birthDate" as birth_date
      FROM employees
      WHERE "companyId" = ${ctx.companyId}::uuid
      AND status = 'ACTIVE'
      AND EXTRACT(MONTH FROM "birthDate") = EXTRACT(MONTH FROM CURRENT_DATE)
      ORDER BY EXTRACT(DAY FROM "birthDate")
      LIMIT 10
    `;

    // Folha de pagamento do mês
    const payrollMonth = await prisma.$queryRaw<[{ total_gross: number; total_net: number; count: bigint }]>`
      SELECT 
        COALESCE(SUM("grossSalary"), 0)::float as total_gross,
        COALESCE(SUM("netSalary"), 0)::float as total_net,
        COUNT(*) as count
      FROM payroll_entries
      WHERE "companyId" = ${ctx.companyId}::uuid
      AND "referenceMonth" = ${startOfMonth}
    `;

    // Funcionários por departamento
    const employeesByDepartment = await prisma.$queryRaw<Array<{ name: string; count: bigint }>>`
      SELECT 
        COALESCE(d.name, 'Sem Departamento') as name,
        COUNT(*) as count
      FROM employees e
      LEFT JOIN departments d ON d.id = e."departmentId"
      WHERE e."companyId" = ${ctx.companyId}::uuid
      AND e.status = 'ACTIVE'
      GROUP BY d.name
      ORDER BY count DESC
      LIMIT 6
    `;

    // Admissões e demissões (últimos 6 meses)
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const hiringTrend = await prisma.$queryRaw<Array<{ month: string; admissions: bigint; terminations: bigint }>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "admissionDate"), 'Mon') as month,
        COUNT(*) as admissions,
        0::bigint as terminations
      FROM employees
      WHERE "companyId" = ${ctx.companyId}::uuid
      AND "admissionDate" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "admissionDate")
      ORDER BY DATE_TRUNC('month', "admissionDate")
    `;

    // Ponto do dia (se houver timeclock)
    const timeclockToday = await prisma.$queryRaw<[{ present: bigint; absent: bigint; late: bigint }]>`
      SELECT 
        COUNT(DISTINCT t."employeeId") FILTER (WHERE t."clockIn" IS NOT NULL) as present,
        0::bigint as absent,
        COUNT(DISTINCT t."employeeId") FILTER (WHERE t."clockIn" > t."expectedClockIn") as late
      FROM timeclock_entries t
      WHERE t."companyId" = ${ctx.companyId}::uuid
      AND DATE(t."clockIn") = CURRENT_DATE
    `;

    return {
      employees: {
        total: Number(employeesStats[0]?.total || 0),
        active: Number(employeesStats[0]?.active || 0),
        onVacation: Number(employeesStats[0]?.on_vacation || 0),
        onLeave: Number(employeesStats[0]?.on_leave || 0),
      },
      vacations: {
        thisMonth: Number(vacationsMonth[0]?.count || 0),
        pending: Number(vacationsMonth[0]?.pending || 0),
      },
      birthdays: birthdaysMonth.map(b => ({
        name: b.name,
        date: b.birth_date,
      })),
      payroll: {
        grossTotal: Number(payrollMonth[0]?.total_gross || 0),
        netTotal: Number(payrollMonth[0]?.total_net || 0),
        count: Number(payrollMonth[0]?.count || 0),
      },
      employeesByDepartment: employeesByDepartment.map(d => ({
        name: d.name,
        count: Number(d.count),
      })),
      hiringTrend: hiringTrend.map(h => ({
        name: h.month,
        Admissões: Number(h.admissions),
        Demissões: Number(h.terminations),
      })),
      timeclock: {
        present: Number(timeclockToday[0]?.present || 0),
        absent: Number(timeclockToday[0]?.absent || 0),
        late: Number(timeclockToday[0]?.late || 0),
      },
    };
  }),
});
