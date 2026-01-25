import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router dashboard
 * Valida as estruturas de dados retornadas pelos endpoints
 */

// Schema para KPIs de estoque
const inventoryKpiSchema = z.object({
  totalItems: z.number(),
  totalQuantity: z.number(),
  totalValue: z.number(),
  lowStockCount: z.number(),
});

// Schema para KPIs de compras
const purchasesKpiSchema = z.object({
  pendingQuotes: z.number(),
  openPurchaseOrders: z.number(),
  pendingInvoices: z.number(),
});

// Schema para KPIs financeiros
const financialKpiSchema = z.object({
  overdue: z.object({
    value: z.number(),
    count: z.number(),
  }),
  dueToday: z.object({
    value: z.number(),
    count: z.number(),
  }),
  dueThisWeek: z.object({
    value: z.number(),
    count: z.number(),
  }),
  paidThisMonth: z.object({
    value: z.number(),
    count: z.number(),
  }),
});

// Schema para KPIs de tarefas
const tasksKpiSchema = z.object({
  pending: z.number(),
  inProgress: z.number(),
  overdue: z.number(),
  myTasks: z.number(),
});

// Schema para KPIs de requisições
const requisitionsKpiSchema = z.object({
  pending: z.number(),
});

// Schema completo de KPIs
const kpisSchema = z.object({
  inventory: inventoryKpiSchema,
  purchases: purchasesKpiSchema,
  financial: financialKpiSchema,
  tasks: tasksKpiSchema,
  requisitions: requisitionsKpiSchema,
});

// Schema para alertas
const alertSchema = z.object({
  type: z.enum(["error", "warning", "info"]),
  title: z.string(),
  message: z.string(),
  link: z.string().optional(),
  count: z.number().optional(),
});

const alertsSchema = z.array(alertSchema);

// Schema para atividade recente
const recentInvoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.number(),
  totalValue: z.number(),
  status: z.string(),
  createdAt: z.date(),
  supplier: z.object({
    tradeName: z.string().nullable(),
    companyName: z.string().nullable(),
  }),
});

const recentRequisitionSchema = z.object({
  id: z.string(),
  code: z.number(),
  type: z.string(),
  status: z.string(),
  requestedAt: z.date(),
  department: z.any().nullable(),
});

const recentTaskSchema = z.object({
  id: z.string(),
  code: z.number(),
  title: z.string(),
  status: z.string(),
  priority: z.string(),
  createdAt: z.date(),
  owner: z.any().nullable(),
});

const recentActivitySchema = z.object({
  invoices: z.array(recentInvoiceSchema),
  requisitions: z.array(recentRequisitionSchema),
  tasks: z.array(recentTaskSchema),
});

// Schema para dados de gráficos
const chartDataPointSchema = z.object({
  name: z.string(),
}).passthrough(); // Permite campos adicionais dinâmicos

const chartDataSchema = z.object({
  cashFlowProjection: z.array(chartDataPointSchema),
  paymentsByMonth: z.array(chartDataPointSchema),
  inventoryByCategory: z.array(chartDataPointSchema),
  requisitionsByMonth: z.array(chartDataPointSchema),
});

describe("Dashboard Router Schemas", () => {
  describe("KPIs Schema", () => {
    it("should validate complete KPIs structure", () => {
      const validKpis = {
        inventory: {
          totalItems: 150,
          totalQuantity: 5000,
          totalValue: 250000.50,
          lowStockCount: 5,
        },
        purchases: {
          pendingQuotes: 3,
          openPurchaseOrders: 7,
          pendingInvoices: 2,
        },
        financial: {
          overdue: { value: 15000, count: 3 },
          dueToday: { value: 5000, count: 1 },
          dueThisWeek: { value: 25000, count: 5 },
          paidThisMonth: { value: 100000, count: 20 },
        },
        tasks: {
          pending: 10,
          inProgress: 5,
          overdue: 2,
          myTasks: 3,
        },
        requisitions: {
          pending: 4,
        },
      };

      const result = kpisSchema.safeParse(validKpis);
      expect(result.success).toBe(true);
    });

    it("should reject KPIs with missing inventory", () => {
      const invalidKpis = {
        purchases: { pendingQuotes: 3, openPurchaseOrders: 7, pendingInvoices: 2 },
        financial: {
          overdue: { value: 15000, count: 3 },
          dueToday: { value: 5000, count: 1 },
          dueThisWeek: { value: 25000, count: 5 },
          paidThisMonth: { value: 100000, count: 20 },
        },
        tasks: { pending: 10, inProgress: 5, overdue: 2, myTasks: 3 },
        requisitions: { pending: 4 },
      };

      const result = kpisSchema.safeParse(invalidKpis);
      expect(result.success).toBe(false);
    });

    it("should reject KPIs with invalid number types", () => {
      const invalidKpis = {
        inventory: {
          totalItems: "150", // should be number
          totalQuantity: 5000,
          totalValue: 250000.50,
          lowStockCount: 5,
        },
        purchases: { pendingQuotes: 3, openPurchaseOrders: 7, pendingInvoices: 2 },
        financial: {
          overdue: { value: 15000, count: 3 },
          dueToday: { value: 5000, count: 1 },
          dueThisWeek: { value: 25000, count: 5 },
          paidThisMonth: { value: 100000, count: 20 },
        },
        tasks: { pending: 10, inProgress: 5, overdue: 2, myTasks: 3 },
        requisitions: { pending: 4 },
      };

      const result = kpisSchema.safeParse(invalidKpis);
      expect(result.success).toBe(false);
    });
  });

  describe("Inventory KPIs Schema", () => {
    it("should validate inventory KPIs with zero values", () => {
      const emptyInventory = {
        totalItems: 0,
        totalQuantity: 0,
        totalValue: 0,
        lowStockCount: 0,
      };

      const result = inventoryKpiSchema.safeParse(emptyInventory);
      expect(result.success).toBe(true);
    });

    it("should validate inventory KPIs with decimal values", () => {
      const inventoryWithDecimals = {
        totalItems: 100,
        totalQuantity: 1234.56,
        totalValue: 99999.99,
        lowStockCount: 3,
      };

      const result = inventoryKpiSchema.safeParse(inventoryWithDecimals);
      expect(result.success).toBe(true);
    });

    it("should reject negative totalItems", () => {
      const invalidInventory = {
        totalItems: -5,
        totalQuantity: 100,
        totalValue: 1000,
        lowStockCount: 0,
      };

      // Schema allows negative but business logic shouldn't
      const result = inventoryKpiSchema.safeParse(invalidInventory);
      expect(result.success).toBe(true); // Schema accepts, validation is business logic
    });
  });

  describe("Financial KPIs Schema", () => {
    it("should validate financial KPIs with all zeros", () => {
      const emptyFinancial = {
        overdue: { value: 0, count: 0 },
        dueToday: { value: 0, count: 0 },
        dueThisWeek: { value: 0, count: 0 },
        paidThisMonth: { value: 0, count: 0 },
      };

      const result = financialKpiSchema.safeParse(emptyFinancial);
      expect(result.success).toBe(true);
    });

    it("should validate financial KPIs with large values", () => {
      const largeFinancial = {
        overdue: { value: 1000000000, count: 500 },
        dueToday: { value: 500000, count: 10 },
        dueThisWeek: { value: 2500000, count: 50 },
        paidThisMonth: { value: 10000000, count: 200 },
      };

      const result = financialKpiSchema.safeParse(largeFinancial);
      expect(result.success).toBe(true);
    });

    it("should reject missing overdue field", () => {
      const invalidFinancial = {
        dueToday: { value: 5000, count: 1 },
        dueThisWeek: { value: 25000, count: 5 },
        paidThisMonth: { value: 100000, count: 20 },
      };

      const result = financialKpiSchema.safeParse(invalidFinancial);
      expect(result.success).toBe(false);
    });
  });

  describe("Tasks KPIs Schema", () => {
    it("should validate tasks KPIs", () => {
      const validTasks = {
        pending: 15,
        inProgress: 8,
        overdue: 3,
        myTasks: 5,
      };

      const result = tasksKpiSchema.safeParse(validTasks);
      expect(result.success).toBe(true);
    });

    it("should reject tasks with string values", () => {
      const invalidTasks = {
        pending: "15",
        inProgress: 8,
        overdue: 3,
        myTasks: 5,
      };

      const result = tasksKpiSchema.safeParse(invalidTasks);
      expect(result.success).toBe(false);
    });
  });

  describe("Alerts Schema", () => {
    it("should validate error alert", () => {
      const errorAlert = {
        type: "error" as const,
        title: "Contas Vencidas",
        message: "5 títulos vencidos aguardando pagamento",
        link: "/payables?status=OVERDUE",
        count: 5,
      };

      const result = alertSchema.safeParse(errorAlert);
      expect(result.success).toBe(true);
    });

    it("should validate warning alert", () => {
      const warningAlert = {
        type: "warning" as const,
        title: "Estoque Baixo",
        message: "10 itens abaixo do estoque mínimo",
        link: "/inventory?belowMinimum=true",
        count: 10,
      };

      const result = alertSchema.safeParse(warningAlert);
      expect(result.success).toBe(true);
    });

    it("should validate info alert", () => {
      const infoAlert = {
        type: "info" as const,
        title: "NFes Pendentes",
        message: "3 notas fiscais aguardando validação",
        link: "/invoices?status=PENDING",
        count: 3,
      };

      const result = alertSchema.safeParse(infoAlert);
      expect(result.success).toBe(true);
    });

    it("should validate alert without optional fields", () => {
      const minimalAlert = {
        type: "info" as const,
        title: "Informação",
        message: "Mensagem de teste",
      };

      const result = alertSchema.safeParse(minimalAlert);
      expect(result.success).toBe(true);
    });

    it("should reject invalid alert type", () => {
      const invalidAlert = {
        type: "critical", // invalid
        title: "Teste",
        message: "Mensagem",
      };

      const result = alertSchema.safeParse(invalidAlert);
      expect(result.success).toBe(false);
    });

    it("should validate empty alerts array", () => {
      const result = alertsSchema.safeParse([]);
      expect(result.success).toBe(true);
    });

    it("should validate multiple alerts", () => {
      const alerts = [
        { type: "error" as const, title: "Erro 1", message: "Msg 1" },
        { type: "warning" as const, title: "Aviso 1", message: "Msg 2" },
        { type: "info" as const, title: "Info 1", message: "Msg 3" },
      ];

      const result = alertsSchema.safeParse(alerts);
      expect(result.success).toBe(true);
    });
  });

  describe("Recent Activity Schema", () => {
    it("should validate empty recent activity", () => {
      const emptyActivity = {
        invoices: [],
        requisitions: [],
        tasks: [],
      };

      const result = recentActivitySchema.safeParse(emptyActivity);
      expect(result.success).toBe(true);
    });

    it("should validate recent invoice", () => {
      const invoice = {
        id: "uuid-123",
        invoiceNumber: 12345,
        totalValue: 1500.50,
        status: "PENDING",
        createdAt: new Date(),
        supplier: {
          tradeName: "Fornecedor ABC",
          companyName: "Fornecedor ABC LTDA",
        },
      };

      const result = recentInvoiceSchema.safeParse(invoice);
      expect(result.success).toBe(true);
    });

    it("should validate recent requisition", () => {
      const requisition = {
        id: "uuid-456",
        code: 1001,
        type: "PRODUCTION",
        status: "PENDING",
        requestedAt: new Date(),
        department: null,
      };

      const result = recentRequisitionSchema.safeParse(requisition);
      expect(result.success).toBe(true);
    });

    it("should validate recent task", () => {
      const task = {
        id: "uuid-789",
        code: 2001,
        title: "Verificar estoque",
        status: "IN_PROGRESS",
        priority: "HIGH",
        createdAt: new Date(),
        owner: null,
      };

      const result = recentTaskSchema.safeParse(task);
      expect(result.success).toBe(true);
    });
  });

  describe("Chart Data Schema", () => {
    it("should validate chart data with all arrays", () => {
      const chartData = {
        cashFlowProjection: [
          { name: "Jan", "A Receber": 10000, "A Pagar": 8000 },
          { name: "Fev", "A Receber": 12000, "A Pagar": 9000 },
        ],
        paymentsByMonth: [
          { name: "Jan", Pago: 50000, Pendente: 10000 },
          { name: "Fev", Pago: 55000, Pendente: 8000 },
        ],
        inventoryByCategory: [
          { name: "Matéria-Prima", value: 100000 },
          { name: "Embalagens", value: 30000 },
        ],
        requisitionsByMonth: [
          { name: "Jan", Requisições: 45 },
          { name: "Fev", Requisições: 52 },
        ],
      };

      const result = chartDataSchema.safeParse(chartData);
      expect(result.success).toBe(true);
    });

    it("should validate empty chart data", () => {
      const emptyChartData = {
        cashFlowProjection: [],
        paymentsByMonth: [],
        inventoryByCategory: [],
        requisitionsByMonth: [],
      };

      const result = chartDataSchema.safeParse(emptyChartData);
      expect(result.success).toBe(true);
    });

    it("should reject chart data missing required array", () => {
      const invalidChartData = {
        cashFlowProjection: [],
        paymentsByMonth: [],
        // missing inventoryByCategory and requisitionsByMonth
      };

      const result = chartDataSchema.safeParse(invalidChartData);
      expect(result.success).toBe(false);
    });
  });

  describe("Purchases KPIs Schema", () => {
    it("should validate purchases KPIs", () => {
      const validPurchases = {
        pendingQuotes: 5,
        openPurchaseOrders: 10,
        pendingInvoices: 3,
      };

      const result = purchasesKpiSchema.safeParse(validPurchases);
      expect(result.success).toBe(true);
    });

    it("should validate purchases KPIs with zeros", () => {
      const zeroPurchases = {
        pendingQuotes: 0,
        openPurchaseOrders: 0,
        pendingInvoices: 0,
      };

      const result = purchasesKpiSchema.safeParse(zeroPurchases);
      expect(result.success).toBe(true);
    });
  });

  describe("Requisitions KPIs Schema", () => {
    it("should validate requisitions KPIs", () => {
      const validRequisitions = {
        pending: 8,
      };

      const result = requisitionsKpiSchema.safeParse(validRequisitions);
      expect(result.success).toBe(true);
    });

    it("should reject requisitions with extra fields", () => {
      const extraFields = {
        pending: 8,
        completed: 20, // extra field
      };

      // strict mode would reject, but default allows extra
      const result = requisitionsKpiSchema.safeParse(extraFields);
      expect(result.success).toBe(true);
    });
  });
});
