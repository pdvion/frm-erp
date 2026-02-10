import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import type { InventoryType, Prisma } from "@prisma/client";

/**
 * Router de relatórios gerenciais
 * Fornece endpoints para geração de relatórios de estoque, financeiro, compras e RH
 */
export const reportsRouter = createTRPCRouter({
  /**
   * Relatório de Posição de Estoque
   * Retorna visão geral do estoque atual com quantidades e valores
   * @param inventoryType - Filtrar por tipo de estoque (RAW_MATERIAL, FINISHED_PRODUCT, etc)
   * @param categoryId - Filtrar por categoria de material
   * @param belowMinimum - Mostrar apenas itens abaixo do estoque mínimo
   * @returns Lista de itens com quantidades, valores e totalizadores
   */
  inventoryPosition: tenantProcedure
    .input(
      z.object({
        inventoryType: z.enum(["RAW_MATERIAL", "FINISHED_PRODUCT", "PACKAGING", "CONSUMABLE", "SPARE_PART"]).optional(),
        categoryId: z.string().optional(),
        belowMinimum: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { inventoryType, categoryId, belowMinimum } = input || {};

      const inventory = await ctx.prisma.inventory.findMany({
        where: {
          companyId: ctx.companyId,
          ...(inventoryType && { inventoryType: inventoryType as InventoryType }),
          ...(categoryId && { material: { categoryId } }),
        },
        include: {
          material: {
            include: {
              category: true,
            },
          },
        },
        orderBy: { material: { description: "asc" } },
      });

      const filtered = belowMinimum
        ? inventory.filter((item) => item.availableQty < (item.material.minQuantity || 0))
        : inventory;

      const totals = filtered.reduce(
        (acc, item) => ({
          totalItems: acc.totalItems + 1,
          totalQuantity: acc.totalQuantity + Number(item.quantity),
          totalValue: Number(acc.totalValue) + Number(item.totalCost),
          belowMinimum: acc.belowMinimum + (item.availableQty < (item.material.minQuantity || 0) ? 1 : 0),
        }),
        { totalItems: 0, totalQuantity: 0, totalValue: 0, belowMinimum: 0 }
      );

      return {
        items: filtered.map((item) => ({
          id: item.id,
          materialCode: item.material.code,
          materialDescription: item.material.description,
          category: item.material.category?.name || "Sem categoria",
          unit: item.material.unit,
          quantity: item.quantity,
          reservedQty: item.reservedQty,
          availableQty: item.availableQty,
          unitCost: item.unitCost,
          totalCost: item.totalCost,
          minQuantity: item.material.minQuantity,
          maxQuantity: item.material.maxQuantity,
          inventoryType: item.inventoryType,
          isBelowMinimum: item.availableQty < (item.material.minQuantity || 0),
        })),
        totals,
      };
    }),

  /**
   * Relatório de Aging de Contas a Pagar
   * Analisa títulos pendentes por faixa de vencimento (a vencer, 1-30, 31-60, 61-90, +90 dias)
   * @param asOfDate - Data base para cálculo (padrão: hoje)
   * @returns Aging por faixa, total e detalhamento por título
   */
  payablesAging: tenantProcedure
    .input(
      z.object({
        asOfDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const asOfDate = input?.asOfDate ? new Date(input.asOfDate) : new Date();

      const payables = await ctx.prisma.accountsPayable.findMany({
        where: {
          companyId: ctx.companyId,
          status: { in: ["PENDING", "OVERDUE"] },
        },
        include: {
          supplier: true,
        },
        orderBy: { dueDate: "asc" },
      });

      const aging = {
        current: { count: 0, value: 0 },
        days1to30: { count: 0, value: 0 },
        days31to60: { count: 0, value: 0 },
        days61to90: { count: 0, value: 0 },
        over90: { count: 0, value: 0 },
      };

      payables.forEach((p) => {
        const dueDate = new Date(p.dueDate);
        const diffDays = Math.floor((asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const amount = Number(p.netValue) - Number(p.paidValue || 0);

        if (diffDays <= 0) {
          aging.current.count += 1;
          aging.current.value += amount;
        } else if (diffDays <= 30) {
          aging.days1to30.count += 1;
          aging.days1to30.value += amount;
        } else if (diffDays <= 60) {
          aging.days31to60.count += 1;
          aging.days31to60.value += amount;
        } else if (diffDays <= 90) {
          aging.days61to90.count += 1;
          aging.days61to90.value += amount;
        } else {
          aging.over90.count += 1;
          aging.over90.value += amount;
        }
      });

      const total = Object.values(aging).reduce((acc, bucket) => acc + bucket.value, 0);

      return {
        aging,
        total,
        details: payables.map((p) => ({
          id: p.id,
          supplier: p.supplier?.companyName || "N/A",
          description: p.description || "",
          dueDate: p.dueDate,
          amount: Number(p.netValue) - Number(p.paidValue || 0),
          daysOverdue: Math.max(0, Math.floor((asOfDate.getTime() - new Date(p.dueDate).getTime()) / (1000 * 60 * 60 * 24))),
        })),
      };
    }),

  /**
   * Relatório de Aging de Contas a Receber
   * Analisa títulos pendentes por faixa de vencimento (a vencer, 1-30, 31-60, 61-90, +90 dias)
   * @param asOfDate - Data base para cálculo (padrão: hoje)
   * @returns Aging por faixa, total e detalhamento por título
   */
  receivablesAging: tenantProcedure
    .input(
      z.object({
        asOfDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const asOfDate = input?.asOfDate ? new Date(input.asOfDate) : new Date();

      const receivables = await ctx.prisma.accountsReceivable.findMany({
        where: {
          companyId: ctx.companyId,
          status: { in: ["PENDING", "OVERDUE"] },
        },
        include: {
          customer: true,
        },
        orderBy: { dueDate: "asc" },
      });

      const aging = {
        current: { count: 0, value: 0 },
        days1to30: { count: 0, value: 0 },
        days31to60: { count: 0, value: 0 },
        days61to90: { count: 0, value: 0 },
        over90: { count: 0, value: 0 },
      };

      receivables.forEach((r) => {
        const dueDate = new Date(r.dueDate);
        const diffDays = Math.floor((asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const amount = Number(r.netValue) - Number(r.paidValue || 0);

        if (diffDays <= 0) {
          aging.current.count += 1;
          aging.current.value += amount;
        } else if (diffDays <= 30) {
          aging.days1to30.count += 1;
          aging.days1to30.value += amount;
        } else if (diffDays <= 60) {
          aging.days31to60.count += 1;
          aging.days31to60.value += amount;
        } else if (diffDays <= 90) {
          aging.days61to90.count += 1;
          aging.days61to90.value += amount;
        } else {
          aging.over90.count += 1;
          aging.over90.value += amount;
        }
      });

      const total = Object.values(aging).reduce((acc, bucket) => acc + bucket.value, 0);

      return {
        aging,
        total,
        details: receivables.map((r) => ({
          id: r.id,
          customer: r.customer?.tradeName || "N/A",
          description: r.description || "",
          dueDate: r.dueDate,
          amount: Number(r.netValue) - Number(r.paidValue || 0),
          daysOverdue: Math.max(0, Math.floor((asOfDate.getTime() - new Date(r.dueDate).getTime()) / (1000 * 60 * 60 * 24))),
        })),
      };
    }),

  /**
   * Relatório de Fluxo de Caixa
   * Mostra entradas e saídas realizadas no período com saldo acumulado
   * @param startDate - Data inicial do período (obrigatório)
   * @param endDate - Data final do período (obrigatório)
   * @returns Fluxo diário com entradas, saídas, saldo líquido e acumulado
   */
  cashFlow: tenantProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;

      const paidPayables = await ctx.prisma.accountsPayable.findMany({
        where: {
          companyId: ctx.companyId,
          status: "PAID",
          paidAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      });

      const paidReceivables = await ctx.prisma.accountsReceivable.findMany({
        where: {
          companyId: ctx.companyId,
          status: "PAID",
          paidAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      });

      const dailyFlow: Record<string, { inflow: number; outflow: number }> = {};

      paidReceivables.forEach((r) => {
        const date = r.paidAt?.toISOString().split("T")[0] || "";
        if (!dailyFlow[date]) dailyFlow[date] = { inflow: 0, outflow: 0 };
        dailyFlow[date].inflow += Number(r.paidValue || r.netValue);
      });

      paidPayables.forEach((p) => {
        const date = p.paidAt?.toISOString().split("T")[0] || "";
        if (!dailyFlow[date]) dailyFlow[date] = { inflow: 0, outflow: 0 };
        dailyFlow[date].outflow += Number(p.paidValue || p.netValue);
      });

      const sortedDates = Object.keys(dailyFlow).sort();
      let runningBalance = 0;
      const flowData = sortedDates.map((date) => {
        const { inflow, outflow } = dailyFlow[date];
        runningBalance += inflow - outflow;
        return { date, inflow, outflow, net: inflow - outflow, balance: runningBalance };
      });

      const totals = {
        totalInflow: paidReceivables.reduce((acc, r) => acc + Number(r.paidValue || r.netValue), 0),
        totalOutflow: paidPayables.reduce((acc, p) => acc + Number(p.paidValue || p.netValue), 0),
        netFlow: 0,
      };
      totals.netFlow = totals.totalInflow - totals.totalOutflow;

      return { flowData, totals };
    }),

  /**
   * Lista de relatórios disponíveis
   * Retorna catálogo de relatórios com metadados para exibição no menu
   * @returns Array com id, nome, descrição, categoria e ícone de cada relatório
   */
  available: tenantProcedure.query(() => {
    return [
      { id: "inventory-position", name: "Posição de Estoque", description: "Visão geral do estoque atual valorizado", category: "Estoque", icon: "Package" },
      { id: "inventory-abc", name: "Curva ABC", description: "Classificação de itens por valor", category: "Estoque", icon: "Package" },
      { id: "payables-aging", name: "Aging Contas a Pagar", description: "Análise de vencimentos por faixa", category: "Financeiro", icon: "TrendingDown" },
      { id: "receivables-aging", name: "Aging Contas a Receber", description: "Análise de vencimentos por faixa", category: "Financeiro", icon: "TrendingUp" },
      { id: "cash-flow", name: "Fluxo de Caixa", description: "Entradas e saídas por período", category: "Financeiro", icon: "Wallet" },
      { id: "purchases-by-supplier", name: "Compras por Fornecedor", description: "Volume e valor por fornecedor", category: "Compras", icon: "ArrowLeftRight" },
      { id: "dre", name: "DRE Simplificado", description: "Demonstrativo de resultado por período", category: "Financeiro", icon: "FileText" },
      { id: "financial-by-category", name: "Análise por Categoria", description: "Receitas e despesas agrupadas por categoria", category: "Financeiro", icon: "PieChart" },
      { id: "headcount", name: "Headcount", description: "Funcionários por departamento", category: "RH", icon: "Users" },
    ];
  }),

  /**
   * Relatório de Curva ABC de Estoque
   * Classifica itens por valor (A=80%, B=15%, C=5%) para gestão de prioridades
   * @returns Itens classificados com percentual acumulado e resumo por classe
   */
  inventoryAbc: tenantProcedure.query(async ({ ctx }) => {
    const inventory = await ctx.prisma.inventory.findMany({
      where: { companyId: ctx.companyId },
      include: { material: { include: { category: true } } },
      orderBy: { totalCost: "desc" },
    });

    const totalValue = inventory.reduce((acc, item) => acc + Number(item.totalCost), 0);
    let cumulativeValue = 0;

    const items = inventory.map((item) => {
      cumulativeValue += Number(item.totalCost);
      const cumulativePercent = (cumulativeValue / totalValue) * 100;
      let classification: "A" | "B" | "C";
      if (cumulativePercent <= 80) classification = "A";
      else if (cumulativePercent <= 95) classification = "B";
      else classification = "C";

      return {
        id: item.id,
        materialCode: item.material.code,
        materialDescription: item.material.description,
        category: item.material.category?.name || "Sem categoria",
        quantity: item.quantity,
        totalCost: item.totalCost,
        percentOfTotal: (Number(item.totalCost) / totalValue) * 100,
        cumulativePercent,
        classification,
      };
    });

    const summary = {
      classA: { count: items.filter((i) => i.classification === "A").length, value: items.filter((i) => i.classification === "A").reduce((acc, i) => acc + Number(i.totalCost), 0) },
      classB: { count: items.filter((i) => i.classification === "B").length, value: items.filter((i) => i.classification === "B").reduce((acc, i) => acc + Number(i.totalCost), 0) },
      classC: { count: items.filter((i) => i.classification === "C").length, value: items.filter((i) => i.classification === "C").reduce((acc, i) => acc + Number(i.totalCost), 0) },
      totalItems: items.length,
      totalValue,
    };

    return { items, summary };
  }),

  /**
   * Relatório de Compras por Fornecedor
   * Agrupa pedidos de compra por fornecedor com totais
   * @param startDate - Data inicial do período (opcional)
   * @param endDate - Data final do período (opcional)
   * @returns Fornecedores ordenados por valor total de compras
   */
  purchasesBySupplier: tenantProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: Prisma.PurchaseOrderWhereInput = {
        companyId: ctx.companyId,
        ...(input?.startDate || input?.endDate ? {
          createdAt: {
            ...(input?.startDate && { gte: new Date(input.startDate) }),
            ...(input?.endDate && { lte: new Date(input.endDate) }),
          },
        } : {}),
      };

      const orders = await ctx.prisma.purchaseOrder.findMany({
        where,
        include: { supplier: true },
      });

      const bySupplier: Record<string, { supplier: string; cnpj: string; orderCount: number; totalValue: number }> = {};

      orders.forEach((order) => {
        const key = order.supplierId;
        if (!bySupplier[key]) {
          bySupplier[key] = {
            supplier: order.supplier.tradeName || order.supplier.companyName,
            cnpj: order.supplier.cnpj || "",
            orderCount: 0,
            totalValue: 0,
          };
        }
        bySupplier[key].orderCount++;
        bySupplier[key].totalValue += Number(order.totalValue);
      });

      const items = Object.values(bySupplier).sort((a, b) => b.totalValue - a.totalValue);
      const totals = { totalOrders: orders.length, totalValue: items.reduce((acc, i) => acc + i.totalValue, 0) };

      return { items, totals };
    }),

  /**
   * DRE Simplificado (Demonstrativo de Resultado do Exercício)
   * Calcula receitas, deduções, custos e despesas no período
   * @param startDate - Data inicial (obrigatório)
   * @param endDate - Data final (obrigatório)
   * @returns Estrutura DRE com receita bruta, deduções, custos, despesas e resultado
   */
  dre: tenantProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);

      // Receitas: contas a receber pagas no período
      const receivables = await ctx.prisma.accountsReceivable.findMany({
        where: {
          companyId: ctx.companyId,
          status: "PAID",
          paidAt: { gte: start, lte: end },
        },
        select: { netValue: true, paidValue: true, costCenter: { select: { name: true } }, description: true },
      });

      // Despesas: contas a pagar pagas no período
      const payables = await ctx.prisma.accountsPayable.findMany({
        where: {
          companyId: ctx.companyId,
          status: "PAID",
          paidAt: { gte: start, lte: end },
        },
        select: { netValue: true, paidValue: true, costCenter: { select: { name: true } }, description: true },
      });

      // Classificar despesas por tipo (based on cost center name or description)
      const costCategories = ["MATERIA_PRIMA", "INSUMOS", "EMBALAGEM", "FRETE_COMPRA", "CMV", "PRODUCAO", "PRODUÇÃO"];
      const taxCategories = ["IMPOSTO", "TAXA", "ICMS", "PIS", "COFINS", "ISS", "IPI", "TRIBUT"];

      let grossRevenue = 0;
      let taxDeductions = 0;
      let costOfGoods = 0;
      let operatingExpenses = 0;
      let financialExpenses = 0;

      // Receita bruta
      for (const r of receivables) {
        grossRevenue += Number(r.paidValue || r.netValue);
      }

      // Classificar despesas
      for (const p of payables) {
        const value = Number(p.paidValue || p.netValue);
        const cat = (p.costCenter?.name || p.description || "").toUpperCase();

        if (taxCategories.some(t => cat.includes(t))) {
          taxDeductions += value;
        } else if (costCategories.some(c => cat.includes(c))) {
          costOfGoods += value;
        } else if (cat.includes("FINANC") || cat.includes("JUROS") || cat.includes("MULTA")) {
          financialExpenses += value;
        } else {
          operatingExpenses += value;
        }
      }

      const netRevenue = grossRevenue - taxDeductions;
      const grossProfit = netRevenue - costOfGoods;
      const operatingResult = grossProfit - operatingExpenses;
      const netResult = operatingResult - financialExpenses;

      const grossMargin = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
      const operatingMargin = grossRevenue > 0 ? (operatingResult / grossRevenue) * 100 : 0;
      const netMargin = grossRevenue > 0 ? (netResult / grossRevenue) * 100 : 0;

      return {
        period: { startDate: input.startDate, endDate: input.endDate },
        lines: [
          { label: "Receita Bruta", value: grossRevenue, level: 0, isTotal: false },
          { label: "(-) Deduções e Impostos", value: -taxDeductions, level: 1, isTotal: false },
          { label: "= Receita Líquida", value: netRevenue, level: 0, isTotal: true },
          { label: "(-) Custo dos Produtos/Serviços", value: -costOfGoods, level: 1, isTotal: false },
          { label: "= Lucro Bruto", value: grossProfit, level: 0, isTotal: true },
          { label: "(-) Despesas Operacionais", value: -operatingExpenses, level: 1, isTotal: false },
          { label: "= Resultado Operacional", value: operatingResult, level: 0, isTotal: true },
          { label: "(-) Despesas Financeiras", value: -financialExpenses, level: 1, isTotal: false },
          { label: "= Resultado Líquido", value: netResult, level: 0, isTotal: true },
        ],
        margins: { grossMargin, operatingMargin, netMargin },
        totals: {
          grossRevenue,
          taxDeductions,
          costOfGoods,
          operatingExpenses,
          financialExpenses,
          netResult,
        },
      };
    }),

  /**
   * Relatório de Análise Financeira por Categoria
   * Agrupa receitas e despesas por categoria no período
   * @param startDate - Data inicial (obrigatório)
   * @param endDate - Data final (obrigatório)
   * @returns Categorias com totais de receita e despesa
   */
  financialByCategory: tenantProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);

      const receivables = await ctx.prisma.accountsReceivable.findMany({
        where: {
          companyId: ctx.companyId,
          status: "PAID",
          paidAt: { gte: start, lte: end },
        },
        select: { paidValue: true, netValue: true, costCenter: { select: { name: true } } },
      });

      const payables = await ctx.prisma.accountsPayable.findMany({
        where: {
          companyId: ctx.companyId,
          status: "PAID",
          paidAt: { gte: start, lte: end },
        },
        select: { paidValue: true, netValue: true, costCenter: { select: { name: true } } },
      });

      const categories = new Map<string, { category: string; revenue: number; expense: number }>();

      for (const r of receivables) {
        const cat = r.costCenter?.name || "Sem Categoria";
        const entry = categories.get(cat) || { category: cat, revenue: 0, expense: 0 };
        entry.revenue += Number(r.paidValue || r.netValue);
        categories.set(cat, entry);
      }

      for (const p of payables) {
        const cat = p.costCenter?.name || "Sem Categoria";
        const entry = categories.get(cat) || { category: cat, revenue: 0, expense: 0 };
        entry.expense += Number(p.paidValue || p.netValue);
        categories.set(cat, entry);
      }

      const items = Array.from(categories.values())
        .map(c => ({ ...c, net: c.revenue - c.expense }))
        .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

      const totalRevenue = items.reduce((sum, i) => sum + i.revenue, 0);
      const totalExpense = items.reduce((sum, i) => sum + i.expense, 0);

      return {
        items,
        totals: {
          totalRevenue,
          totalExpense,
          netResult: totalRevenue - totalExpense,
        },
      };
    }),

  /**
   * Relatório de Headcount por Departamento
   * Conta funcionários ativos agrupados por departamento e cargo
   * @returns Departamentos com contagem e distribuição por cargo
   */
  headcount: tenantProcedure.query(async ({ ctx }) => {
    const employees = await ctx.prisma.employee.findMany({
      where: { companyId: ctx.companyId, status: "ACTIVE" },
      include: { department: true, position: true },
    });

    const byDepartment: Record<string, { department: string; count: number; positions: Record<string, number> }> = {};

    employees.forEach((emp) => {
      const deptName = emp.department?.name || "Sem departamento";
      const posName = emp.position?.name || "Sem cargo";

      if (!byDepartment[deptName]) {
        byDepartment[deptName] = { department: deptName, count: 0, positions: {} };
      }
      byDepartment[deptName].count++;
      byDepartment[deptName].positions[posName] = (byDepartment[deptName].positions[posName] || 0) + 1;
    });

    const items = Object.values(byDepartment).sort((a, b) => b.count - a.count);
    const totals = { totalEmployees: employees.length, totalDepartments: items.length };

    return { items, totals };
  }),
});
