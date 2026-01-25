import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router bi (Business Intelligence)
 * Valida inputs e estruturas de dados de dashboards, widgets e KPIs
 */

// Schema de tipo de widget
const widgetTypeSchema = z.enum([
  "KPI_CARD",
  "LINE_CHART",
  "BAR_CHART",
  "PIE_CHART",
  "TABLE",
  "GAUGE",
]);

// Schema de criação de dashboard
const createDashboardSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

// Schema de atualização de dashboard
const updateDashboardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  layout: z.any().optional(),
  filters: z.any().optional(),
});

// Schema de busca por ID
const getByIdSchema = z.object({
  id: z.string().uuid(),
});

// Schema de criação de widget
const addWidgetSchema = z.object({
  dashboardId: z.string().uuid(),
  type: widgetTypeSchema,
  title: z.string().min(1),
  config: z.any().optional(),
  kpiId: z.string().uuid().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }).optional(),
});

// Schema de atualização de widget
const updateWidgetSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  config: z.any().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }).optional(),
});

// Schema de criação de KPI
const createKpiSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  query: z.string().min(1),
  valueType: z.enum(["NUMBER", "CURRENCY", "PERCENTAGE", "TEXT"]),
  aggregation: z.enum(["SUM", "AVG", "COUNT", "MIN", "MAX", "LAST"]).optional(),
  format: z.string().optional(),
  thresholds: z.any().optional(),
});

// Schema de resposta de dashboard
const dashboardResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isDefault: z.boolean(),
  isPublic: z.boolean(),
  layout: z.any().nullable(),
  filters: z.any().nullable(),
  companyId: z.string().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Schema de resposta de widget
const widgetResponseSchema = z.object({
  id: z.string(),
  dashboardId: z.string(),
  type: widgetTypeSchema,
  title: z.string(),
  config: z.any().nullable(),
  kpiId: z.string().nullable(),
  position: z.any().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

describe("BI Router Schemas", () => {
  describe("Widget Type Schema", () => {
    it("should accept KPI_CARD type", () => {
      const result = widgetTypeSchema.safeParse("KPI_CARD");
      expect(result.success).toBe(true);
    });

    it("should accept LINE_CHART type", () => {
      const result = widgetTypeSchema.safeParse("LINE_CHART");
      expect(result.success).toBe(true);
    });

    it("should accept BAR_CHART type", () => {
      const result = widgetTypeSchema.safeParse("BAR_CHART");
      expect(result.success).toBe(true);
    });

    it("should accept PIE_CHART type", () => {
      const result = widgetTypeSchema.safeParse("PIE_CHART");
      expect(result.success).toBe(true);
    });

    it("should accept TABLE type", () => {
      const result = widgetTypeSchema.safeParse("TABLE");
      expect(result.success).toBe(true);
    });

    it("should accept GAUGE type", () => {
      const result = widgetTypeSchema.safeParse("GAUGE");
      expect(result.success).toBe(true);
    });

    it("should reject invalid widget type", () => {
      const result = widgetTypeSchema.safeParse("INVALID_TYPE");
      expect(result.success).toBe(false);
    });

    it("should reject lowercase widget type", () => {
      const result = widgetTypeSchema.safeParse("kpi_card");
      expect(result.success).toBe(false);
    });
  });

  describe("Create Dashboard Schema", () => {
    it("should accept minimal dashboard", () => {
      const input = { name: "Meu Dashboard" };
      const result = createDashboardSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept complete dashboard", () => {
      const input = {
        name: "Dashboard Completo",
        description: "Dashboard com todas as métricas",
        isDefault: true,
        isPublic: false,
      };
      const result = createDashboardSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const input = { name: "" };
      const result = createDashboardSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing name", () => {
      const input = { description: "Sem nome" };
      const result = createDashboardSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should accept public dashboard", () => {
      const input = {
        name: "Dashboard Público",
        isPublic: true,
      };
      const result = createDashboardSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept default dashboard", () => {
      const input = {
        name: "Dashboard Padrão",
        isDefault: true,
      };
      const result = createDashboardSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("Update Dashboard Schema", () => {
    it("should accept update with only id", () => {
      const input = { id: "550e8400-e29b-41d4-a716-446655440000" };
      const result = updateDashboardSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Novo Nome",
      };
      const result = updateDashboardSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept complete update", () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Dashboard Atualizado",
        description: "Nova descrição",
        isDefault: false,
        isPublic: true,
        layout: { columns: 12, rows: 8 },
        filters: { dateRange: "last30days" },
      };
      const result = updateDashboardSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const input = { id: "not-a-uuid" };
      const result = updateDashboardSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const input = { name: "Sem ID" };
      const result = updateDashboardSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should accept layout update", () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        layout: {
          columns: 12,
          rows: 10,
          widgets: [
            { id: "w1", x: 0, y: 0, w: 4, h: 2 },
            { id: "w2", x: 4, y: 0, w: 8, h: 4 },
          ],
        },
      };
      const result = updateDashboardSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("GetById Schema", () => {
    it("should accept valid UUID", () => {
      const input = { id: "550e8400-e29b-41d4-a716-446655440000" };
      const result = getByIdSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const input = { id: "invalid-uuid" };
      const result = getByIdSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const result = getByIdSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("Add Widget Schema", () => {
    it("should accept minimal widget", () => {
      const input = {
        dashboardId: "550e8400-e29b-41d4-a716-446655440000",
        type: "KPI_CARD" as const,
        title: "Total de Vendas",
      };
      const result = addWidgetSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept widget with position", () => {
      const input = {
        dashboardId: "550e8400-e29b-41d4-a716-446655440000",
        type: "LINE_CHART" as const,
        title: "Vendas por Mês",
        position: { x: 0, y: 0, w: 6, h: 4 },
      };
      const result = addWidgetSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept widget with KPI reference", () => {
      const input = {
        dashboardId: "550e8400-e29b-41d4-a716-446655440000",
        type: "GAUGE" as const,
        title: "Meta de Vendas",
        kpiId: "660e8400-e29b-41d4-a716-446655440001",
      };
      const result = addWidgetSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept widget with config", () => {
      const input = {
        dashboardId: "550e8400-e29b-41d4-a716-446655440000",
        type: "BAR_CHART" as const,
        title: "Top 10 Produtos",
        config: {
          dataSource: "sales",
          groupBy: "product",
          limit: 10,
          colors: ["#3b82f6", "#10b981"],
        },
      };
      const result = addWidgetSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const input = {
        dashboardId: "550e8400-e29b-41d4-a716-446655440000",
        type: "TABLE" as const,
        title: "",
      };
      const result = addWidgetSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid dashboardId", () => {
      const input = {
        dashboardId: "not-a-uuid",
        type: "PIE_CHART" as const,
        title: "Distribuição",
      };
      const result = addWidgetSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Update Widget Schema", () => {
    it("should accept update with only id", () => {
      const input = { id: "550e8400-e29b-41d4-a716-446655440000" };
      const result = updateWidgetSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept title update", () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Novo Título",
      };
      const result = updateWidgetSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept position update", () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        position: { x: 4, y: 2, w: 8, h: 6 },
      };
      const result = updateWidgetSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept config update", () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        config: { refreshInterval: 60, showLegend: true },
      };
      const result = updateWidgetSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const input = { id: "invalid" };
      const result = updateWidgetSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Create KPI Schema", () => {
    it("should accept minimal KPI", () => {
      const input = {
        name: "Total Vendas",
        query: "SELECT SUM(total) FROM sales",
        valueType: "CURRENCY" as const,
      };
      const result = createKpiSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept complete KPI", () => {
      const input = {
        name: "Taxa de Conversão",
        description: "Percentual de leads convertidos em clientes",
        query: "SELECT (converted::float / total::float) * 100 FROM leads_stats",
        valueType: "PERCENTAGE" as const,
        aggregation: "LAST" as const,
        format: "0.00%",
        thresholds: {
          danger: 10,
          warning: 20,
          success: 30,
        },
      };
      const result = createKpiSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept NUMBER value type", () => {
      const input = {
        name: "Quantidade Itens",
        query: "SELECT COUNT(*) FROM items",
        valueType: "NUMBER" as const,
      };
      const result = createKpiSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept TEXT value type", () => {
      const input = {
        name: "Status Sistema",
        query: "SELECT status FROM system_health",
        valueType: "TEXT" as const,
      };
      const result = createKpiSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept all aggregation types", () => {
      const aggregations = ["SUM", "AVG", "COUNT", "MIN", "MAX", "LAST"] as const;
      
      aggregations.forEach(aggregation => {
        const input = {
          name: `KPI ${aggregation}`,
          query: "SELECT value FROM metrics",
          valueType: "NUMBER" as const,
          aggregation,
        };
        const result = createKpiSchema.safeParse(input);
        expect(result.success).toBe(true);
      });
    });

    it("should reject empty name", () => {
      const input = {
        name: "",
        query: "SELECT 1",
        valueType: "NUMBER" as const,
      };
      const result = createKpiSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty query", () => {
      const input = {
        name: "KPI",
        query: "",
        valueType: "NUMBER" as const,
      };
      const result = createKpiSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid value type", () => {
      const input = {
        name: "KPI",
        query: "SELECT 1",
        valueType: "INVALID",
      };
      const result = createKpiSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Dashboard Response Schema", () => {
    it("should validate complete dashboard response", () => {
      const dashboard = {
        id: "uuid-123",
        name: "Dashboard Principal",
        description: "Dashboard com métricas principais",
        isDefault: true,
        isPublic: false,
        layout: { columns: 12 },
        filters: { period: "month" },
        companyId: "company-123",
        createdBy: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = dashboardResponseSchema.safeParse(dashboard);
      expect(result.success).toBe(true);
    });

    it("should validate dashboard with null optional fields", () => {
      const dashboard = {
        id: "uuid-123",
        name: "Dashboard Mínimo",
        description: null,
        isDefault: false,
        isPublic: false,
        layout: null,
        filters: null,
        companyId: null,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = dashboardResponseSchema.safeParse(dashboard);
      expect(result.success).toBe(true);
    });
  });

  describe("Widget Response Schema", () => {
    it("should validate complete widget response", () => {
      const widget = {
        id: "widget-123",
        dashboardId: "dashboard-123",
        type: "LINE_CHART" as const,
        title: "Vendas por Mês",
        config: { showLegend: true },
        kpiId: "kpi-123",
        position: { x: 0, y: 0, w: 6, h: 4 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = widgetResponseSchema.safeParse(widget);
      expect(result.success).toBe(true);
    });

    it("should validate widget with null optional fields", () => {
      const widget = {
        id: "widget-123",
        dashboardId: "dashboard-123",
        type: "KPI_CARD" as const,
        title: "Total",
        config: null,
        kpiId: null,
        position: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = widgetResponseSchema.safeParse(widget);
      expect(result.success).toBe(true);
    });
  });

  describe("Position Object", () => {
    it("should validate valid position", () => {
      const positionSchema = z.object({
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.number(),
      });

      const position = { x: 0, y: 0, w: 4, h: 2 };
      const result = positionSchema.safeParse(position);
      expect(result.success).toBe(true);
    });

    it("should accept zero values", () => {
      const positionSchema = z.object({
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.number(),
      });

      const position = { x: 0, y: 0, w: 0, h: 0 };
      const result = positionSchema.safeParse(position);
      expect(result.success).toBe(true);
    });

    it("should accept large values", () => {
      const positionSchema = z.object({
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.number(),
      });

      const position = { x: 100, y: 50, w: 12, h: 8 };
      const result = positionSchema.safeParse(position);
      expect(result.success).toBe(true);
    });
  });
});
