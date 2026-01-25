import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router reports (Relatórios)
 * Valida inputs e estruturas de dados de relatórios gerenciais
 */

// Schema de tipo de estoque
const inventoryTypeSchema = z.enum([
  "RAW_MATERIAL",
  "FINISHED_PRODUCT",
  "PACKAGING",
  "CONSUMABLE",
  "SPARE_PART",
]);

// Schema de input do relatório de posição de estoque
const inventoryPositionInputSchema = z.object({
  inventoryType: inventoryTypeSchema.optional(),
  categoryId: z.string().optional(),
  belowMinimum: z.boolean().optional(),
}).optional();

// Schema de input do relatório de aging de contas a pagar
const payablesAgingInputSchema = z.object({
  asOfDate: z.string().optional(),
}).optional();

// Schema de input do relatório de aging de contas a receber
const receivablesAgingInputSchema = z.object({
  asOfDate: z.string().optional(),
}).optional();

// Schema de input do relatório de compras por período
const purchasesByPeriodInputSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  groupBy: z.enum(["supplier", "material", "category"]).optional(),
});

// Schema de input do relatório de funcionários
const employeesReportInputSchema = z.object({
  departmentId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]).optional(),
  includeTerminated: z.boolean().optional(),
}).optional();

// Schema de resposta de item de estoque
const inventoryItemResponseSchema = z.object({
  id: z.string(),
  materialCode: z.string(),
  materialDescription: z.string(),
  category: z.string(),
  unit: z.string(),
  quantity: z.number(),
  reservedQty: z.number(),
  availableQty: z.number(),
  unitCost: z.number(),
  totalCost: z.number(),
  minQuantity: z.number().nullable(),
  maxQuantity: z.number().nullable(),
  inventoryType: inventoryTypeSchema,
  isBelowMinimum: z.boolean(),
});

// Schema de totais de estoque
const inventoryTotalsSchema = z.object({
  totalItems: z.number(),
  totalQuantity: z.number(),
  totalValue: z.number(),
  belowMinimum: z.number(),
});

// Schema de faixa de aging
const agingBucketSchema = z.object({
  count: z.number(),
  value: z.number(),
});

// Schema de aging
const agingSchema = z.object({
  current: agingBucketSchema,
  days1to30: agingBucketSchema,
  days31to60: agingBucketSchema,
  days61to90: agingBucketSchema,
  over90: agingBucketSchema,
});

describe("Reports Router Schemas", () => {
  describe("Inventory Type Schema", () => {
    it("should accept RAW_MATERIAL type", () => {
      const result = inventoryTypeSchema.safeParse("RAW_MATERIAL");
      expect(result.success).toBe(true);
    });

    it("should accept FINISHED_PRODUCT type", () => {
      const result = inventoryTypeSchema.safeParse("FINISHED_PRODUCT");
      expect(result.success).toBe(true);
    });

    it("should accept PACKAGING type", () => {
      const result = inventoryTypeSchema.safeParse("PACKAGING");
      expect(result.success).toBe(true);
    });

    it("should accept CONSUMABLE type", () => {
      const result = inventoryTypeSchema.safeParse("CONSUMABLE");
      expect(result.success).toBe(true);
    });

    it("should accept SPARE_PART type", () => {
      const result = inventoryTypeSchema.safeParse("SPARE_PART");
      expect(result.success).toBe(true);
    });

    it("should reject invalid type", () => {
      const result = inventoryTypeSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Inventory Position Input Schema", () => {
    it("should accept undefined input", () => {
      const result = inventoryPositionInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept empty object", () => {
      const result = inventoryPositionInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should accept inventoryType filter", () => {
      const result = inventoryPositionInputSchema.safeParse({
        inventoryType: "RAW_MATERIAL",
      });
      expect(result.success).toBe(true);
    });

    it("should accept categoryId filter", () => {
      const result = inventoryPositionInputSchema.safeParse({
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept belowMinimum filter", () => {
      const result = inventoryPositionInputSchema.safeParse({
        belowMinimum: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept all filters combined", () => {
      const result = inventoryPositionInputSchema.safeParse({
        inventoryType: "FINISHED_PRODUCT",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        belowMinimum: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Payables Aging Input Schema", () => {
    it("should accept undefined input", () => {
      const result = payablesAgingInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept empty object", () => {
      const result = payablesAgingInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should accept asOfDate", () => {
      const result = payablesAgingInputSchema.safeParse({
        asOfDate: "2024-12-31",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Receivables Aging Input Schema", () => {
    it("should accept undefined input", () => {
      const result = receivablesAgingInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept asOfDate", () => {
      const result = receivablesAgingInputSchema.safeParse({
        asOfDate: "2024-12-31",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Purchases By Period Input Schema", () => {
    it("should accept valid date range", () => {
      const result = purchasesByPeriodInputSchema.safeParse({
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });
      expect(result.success).toBe(true);
    });

    it("should accept groupBy supplier", () => {
      const result = purchasesByPeriodInputSchema.safeParse({
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        groupBy: "supplier",
      });
      expect(result.success).toBe(true);
    });

    it("should accept groupBy material", () => {
      const result = purchasesByPeriodInputSchema.safeParse({
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        groupBy: "material",
      });
      expect(result.success).toBe(true);
    });

    it("should accept groupBy category", () => {
      const result = purchasesByPeriodInputSchema.safeParse({
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        groupBy: "category",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing startDate", () => {
      const result = purchasesByPeriodInputSchema.safeParse({
        endDate: "2024-12-31",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing endDate", () => {
      const result = purchasesByPeriodInputSchema.safeParse({
        startDate: "2024-01-01",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid groupBy", () => {
      const result = purchasesByPeriodInputSchema.safeParse({
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        groupBy: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Employees Report Input Schema", () => {
    it("should accept undefined input", () => {
      const result = employeesReportInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept departmentId filter", () => {
      const result = employeesReportInputSchema.safeParse({
        departmentId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept status ACTIVE", () => {
      const result = employeesReportInputSchema.safeParse({
        status: "ACTIVE",
      });
      expect(result.success).toBe(true);
    });

    it("should accept status INACTIVE", () => {
      const result = employeesReportInputSchema.safeParse({
        status: "INACTIVE",
      });
      expect(result.success).toBe(true);
    });

    it("should accept status ON_LEAVE", () => {
      const result = employeesReportInputSchema.safeParse({
        status: "ON_LEAVE",
      });
      expect(result.success).toBe(true);
    });

    it("should accept includeTerminated flag", () => {
      const result = employeesReportInputSchema.safeParse({
        includeTerminated: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept all filters combined", () => {
      const result = employeesReportInputSchema.safeParse({
        departmentId: "123e4567-e89b-12d3-a456-426614174000",
        status: "ACTIVE",
        includeTerminated: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Inventory Item Response Schema", () => {
    it("should validate complete inventory item", () => {
      const result = inventoryItemResponseSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        materialCode: "MAT-001",
        materialDescription: "Material de Teste",
        category: "Matéria Prima",
        unit: "KG",
        quantity: 100,
        reservedQty: 20,
        availableQty: 80,
        unitCost: 10.5,
        totalCost: 1050,
        minQuantity: 50,
        maxQuantity: 200,
        inventoryType: "RAW_MATERIAL",
        isBelowMinimum: false,
      });
      expect(result.success).toBe(true);
    });

    it("should validate item with null min/max quantities", () => {
      const result = inventoryItemResponseSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        materialCode: "MAT-001",
        materialDescription: "Material de Teste",
        category: "Sem categoria",
        unit: "UN",
        quantity: 50,
        reservedQty: 0,
        availableQty: 50,
        unitCost: 25.0,
        totalCost: 1250,
        minQuantity: null,
        maxQuantity: null,
        inventoryType: "CONSUMABLE",
        isBelowMinimum: false,
      });
      expect(result.success).toBe(true);
    });

    it("should validate item below minimum", () => {
      const result = inventoryItemResponseSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        materialCode: "MAT-002",
        materialDescription: "Material Crítico",
        category: "Peças",
        unit: "UN",
        quantity: 10,
        reservedQty: 5,
        availableQty: 5,
        unitCost: 100.0,
        totalCost: 1000,
        minQuantity: 20,
        maxQuantity: 100,
        inventoryType: "SPARE_PART",
        isBelowMinimum: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Inventory Totals Schema", () => {
    it("should validate totals", () => {
      const result = inventoryTotalsSchema.safeParse({
        totalItems: 150,
        totalQuantity: 5000,
        totalValue: 250000,
        belowMinimum: 12,
      });
      expect(result.success).toBe(true);
    });

    it("should validate empty totals", () => {
      const result = inventoryTotalsSchema.safeParse({
        totalItems: 0,
        totalQuantity: 0,
        totalValue: 0,
        belowMinimum: 0,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Aging Schema", () => {
    it("should validate complete aging structure", () => {
      const result = agingSchema.safeParse({
        current: { count: 10, value: 50000 },
        days1to30: { count: 5, value: 25000 },
        days31to60: { count: 3, value: 15000 },
        days61to90: { count: 2, value: 10000 },
        over90: { count: 1, value: 5000 },
      });
      expect(result.success).toBe(true);
    });

    it("should validate empty aging", () => {
      const result = agingSchema.safeParse({
        current: { count: 0, value: 0 },
        days1to30: { count: 0, value: 0 },
        days31to60: { count: 0, value: 0 },
        days61to90: { count: 0, value: 0 },
        over90: { count: 0, value: 0 },
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing bucket", () => {
      const result = agingSchema.safeParse({
        current: { count: 10, value: 50000 },
        days1to30: { count: 5, value: 25000 },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Aging Calculations", () => {
    it("should calculate days overdue correctly", () => {
      const dueDate = new Date("2024-01-15");
      const asOfDate = new Date("2024-02-15");
      const diffDays = Math.floor(
        (asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBe(31);
    });

    it("should identify current (not overdue) items", () => {
      const dueDate = new Date("2024-02-20");
      const asOfDate = new Date("2024-02-15");
      const diffDays = Math.floor(
        (asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBeLessThanOrEqual(0);
    });

    it("should classify 1-30 days overdue", () => {
      const diffDays = 15;
      const bucket =
        diffDays <= 0
          ? "current"
          : diffDays <= 30
            ? "days1to30"
            : diffDays <= 60
              ? "days31to60"
              : diffDays <= 90
                ? "days61to90"
                : "over90";
      expect(bucket).toBe("days1to30");
    });

    it("should classify 31-60 days overdue", () => {
      const diffDays = 45;
      const bucket =
        diffDays <= 0
          ? "current"
          : diffDays <= 30
            ? "days1to30"
            : diffDays <= 60
              ? "days31to60"
              : diffDays <= 90
                ? "days61to90"
                : "over90";
      expect(bucket).toBe("days31to60");
    });

    it("should classify 61-90 days overdue", () => {
      const diffDays = 75;
      const bucket =
        diffDays <= 0
          ? "current"
          : diffDays <= 30
            ? "days1to30"
            : diffDays <= 60
              ? "days31to60"
              : diffDays <= 90
                ? "days61to90"
                : "over90";
      expect(bucket).toBe("days61to90");
    });

    it("should classify over 90 days overdue", () => {
      const diffDays = 120;
      const bucket =
        diffDays <= 0
          ? "current"
          : diffDays <= 30
            ? "days1to30"
            : diffDays <= 60
              ? "days31to60"
              : diffDays <= 90
                ? "days61to90"
                : "over90";
      expect(bucket).toBe("over90");
    });
  });

  describe("Report Totals Calculation", () => {
    it("should calculate inventory totals correctly", () => {
      const items = [
        { quantity: 100, totalCost: 1000, availableQty: 80, minQuantity: 50 },
        { quantity: 50, totalCost: 500, availableQty: 30, minQuantity: 40 },
        { quantity: 200, totalCost: 2000, availableQty: 150, minQuantity: 100 },
      ];

      const totals = items.reduce(
        (acc, item) => ({
          totalItems: acc.totalItems + 1,
          totalQuantity: acc.totalQuantity + item.quantity,
          totalValue: acc.totalValue + item.totalCost,
          belowMinimum:
            acc.belowMinimum + (item.availableQty < item.minQuantity ? 1 : 0),
        }),
        { totalItems: 0, totalQuantity: 0, totalValue: 0, belowMinimum: 0 }
      );

      expect(totals.totalItems).toBe(3);
      expect(totals.totalQuantity).toBe(350);
      expect(totals.totalValue).toBe(3500);
      expect(totals.belowMinimum).toBe(1); // Only second item is below minimum
    });

    it("should calculate aging totals correctly", () => {
      const aging = {
        current: { count: 10, value: 50000 },
        days1to30: { count: 5, value: 25000 },
        days31to60: { count: 3, value: 15000 },
        days61to90: { count: 2, value: 10000 },
        over90: { count: 1, value: 5000 },
      };

      const totalCount =
        aging.current.count +
        aging.days1to30.count +
        aging.days31to60.count +
        aging.days61to90.count +
        aging.over90.count;

      const totalValue =
        aging.current.value +
        aging.days1to30.value +
        aging.days31to60.value +
        aging.days61to90.value +
        aging.over90.value;

      expect(totalCount).toBe(21);
      expect(totalValue).toBe(105000);
    });
  });
});
