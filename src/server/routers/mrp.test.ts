import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const getBomInputSchema = z.object({ materialId: z.string() });

const addBomItemInputSchema = z.object({
  parentMaterialId: z.string(),
  childMaterialId: z.string(),
  quantity: z.number().positive(),
  unit: z.string().default("UN"),
  scrapPercentage: z.number().default(0),
  leadTimeDays: z.number().default(0),
  sequence: z.number().default(0),
  notes: z.string().optional(),
});

const updateBomItemInputSchema = z.object({
  id: z.string(),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  scrapPercentage: z.number().optional(),
  leadTimeDays: z.number().optional(),
  sequence: z.number().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

const removeBomItemInputSchema = z.object({ id: z.string() });

const getParametersInputSchema = z.object({ materialId: z.string() });

const saveParametersInputSchema = z.object({
  materialId: z.string(),
  minLotSize: z.number().positive().default(1),
  lotMultiple: z.number().positive().default(1),
  safetyStock: z.number().default(0),
  productionLeadTimeDays: z.number().default(1),
  purchaseLeadTimeDays: z.number().default(7),
  orderPolicy: z.enum(["LOT_FOR_LOT", "FIXED_ORDER", "ECONOMIC_ORDER", "PERIOD_ORDER"]).default("LOT_FOR_LOT"),
});

const runMrpInputSchema = z.object({
  materialIds: z.array(z.string()).optional(),
  horizonDays: z.number().min(1).max(365).default(30),
  includeSubassemblies: z.boolean().default(true),
  considerSafetyStock: z.boolean().default(true),
});

const getMrpResultsInputSchema = z.object({
  materialId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  status: z.enum(["PLANNED", "FIRMED", "RELEASED", "ALL"]).optional(),
});

const firmPlannedOrderInputSchema = z.object({
  plannedOrderId: z.string(),
  notes: z.string().optional(),
});

const releasePlannedOrderInputSchema = z.object({
  plannedOrderId: z.string(),
  createPurchaseOrder: z.boolean().default(false),
  createProductionOrder: z.boolean().default(false),
  notes: z.string().optional(),
});

const deletePlannedOrderInputSchema = z.object({ id: z.string() });

const explodeBomInputSchema = z.object({
  materialId: z.string(),
  quantity: z.number().positive(),
  levels: z.number().min(1).max(10).default(10),
});

const whereUsedInputSchema = z.object({
  materialId: z.string(),
  levels: z.number().min(1).max(10).default(10),
});

describe("MRP Router Schemas", () => {
  describe("getBom input", () => {
    it("should accept valid materialId", () => {
      const result = getBomInputSchema.safeParse({ materialId: "mat-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing materialId", () => {
      const result = getBomInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("addBomItem input", () => {
    it("should accept valid input", () => {
      const result = addBomItemInputSchema.safeParse({
        parentMaterialId: "mat-001",
        childMaterialId: "mat-002",
        quantity: 5,
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = addBomItemInputSchema.safeParse({
        parentMaterialId: "mat-001",
        childMaterialId: "mat-002",
        quantity: 5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unit).toBe("UN");
        expect(result.data.scrapPercentage).toBe(0);
        expect(result.data.leadTimeDays).toBe(0);
        expect(result.data.sequence).toBe(0);
      }
    });

    it("should accept full input", () => {
      const result = addBomItemInputSchema.safeParse({
        parentMaterialId: "mat-001",
        childMaterialId: "mat-002",
        quantity: 10,
        unit: "KG",
        scrapPercentage: 5,
        leadTimeDays: 2,
        sequence: 1,
        notes: "Componente principal",
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero quantity", () => {
      const result = addBomItemInputSchema.safeParse({
        parentMaterialId: "mat-001",
        childMaterialId: "mat-002",
        quantity: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative quantity", () => {
      const result = addBomItemInputSchema.safeParse({
        parentMaterialId: "mat-001",
        childMaterialId: "mat-002",
        quantity: -5,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing parentMaterialId", () => {
      const result = addBomItemInputSchema.safeParse({
        childMaterialId: "mat-002",
        quantity: 5,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing childMaterialId", () => {
      const result = addBomItemInputSchema.safeParse({
        parentMaterialId: "mat-001",
        quantity: 5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateBomItem input", () => {
    it("should accept id only", () => {
      const result = updateBomItemInputSchema.safeParse({ id: "bom-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateBomItemInputSchema.safeParse({
        id: "bom-123",
        quantity: 10,
        scrapPercentage: 3,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateBomItemInputSchema.safeParse({
        quantity: 10,
      });
      expect(result.success).toBe(false);
    });

    it("should accept isActive change", () => {
      const result = updateBomItemInputSchema.safeParse({
        id: "bom-123",
        isActive: false,
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero quantity on update", () => {
      const result = updateBomItemInputSchema.safeParse({
        id: "bom-123",
        quantity: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("removeBomItem input", () => {
    it("should accept valid id", () => {
      const result = removeBomItemInputSchema.safeParse({ id: "bom-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = removeBomItemInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("getParameters input", () => {
    it("should accept valid materialId", () => {
      const result = getParametersInputSchema.safeParse({ materialId: "mat-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing materialId", () => {
      const result = getParametersInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("saveParameters input", () => {
    it("should accept valid input", () => {
      const result = saveParametersInputSchema.safeParse({
        materialId: "mat-123",
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = saveParametersInputSchema.safeParse({
        materialId: "mat-123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minLotSize).toBe(1);
        expect(result.data.lotMultiple).toBe(1);
        expect(result.data.safetyStock).toBe(0);
        expect(result.data.productionLeadTimeDays).toBe(1);
        expect(result.data.purchaseLeadTimeDays).toBe(7);
        expect(result.data.orderPolicy).toBe("LOT_FOR_LOT");
      }
    });

    it("should accept full input", () => {
      const result = saveParametersInputSchema.safeParse({
        materialId: "mat-123",
        minLotSize: 100,
        lotMultiple: 50,
        safetyStock: 200,
        productionLeadTimeDays: 5,
        purchaseLeadTimeDays: 14,
        orderPolicy: "ECONOMIC_ORDER",
      });
      expect(result.success).toBe(true);
    });

    it("should accept all order policies", () => {
      const policies = ["LOT_FOR_LOT", "FIXED_ORDER", "ECONOMIC_ORDER", "PERIOD_ORDER"];
      for (const orderPolicy of policies) {
        const result = saveParametersInputSchema.safeParse({
          materialId: "mat-123",
          orderPolicy,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject zero minLotSize", () => {
      const result = saveParametersInputSchema.safeParse({
        materialId: "mat-123",
        minLotSize: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero lotMultiple", () => {
      const result = saveParametersInputSchema.safeParse({
        materialId: "mat-123",
        lotMultiple: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("runMrp input", () => {
    it("should accept empty input", () => {
      const result = runMrpInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = runMrpInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.horizonDays).toBe(30);
        expect(result.data.includeSubassemblies).toBe(true);
        expect(result.data.considerSafetyStock).toBe(true);
      }
    });

    it("should accept materialIds array", () => {
      const result = runMrpInputSchema.safeParse({
        materialIds: ["mat-001", "mat-002", "mat-003"],
      });
      expect(result.success).toBe(true);
    });

    it("should accept full input", () => {
      const result = runMrpInputSchema.safeParse({
        materialIds: ["mat-001"],
        horizonDays: 90,
        includeSubassemblies: false,
        considerSafetyStock: false,
      });
      expect(result.success).toBe(true);
    });

    it("should reject horizonDays less than 1", () => {
      const result = runMrpInputSchema.safeParse({
        horizonDays: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject horizonDays greater than 365", () => {
      const result = runMrpInputSchema.safeParse({
        horizonDays: 366,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("getMrpResults input", () => {
    it("should accept empty input", () => {
      const result = getMrpResultsInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should accept materialId", () => {
      const result = getMrpResultsInputSchema.safeParse({ materialId: "mat-123" });
      expect(result.success).toBe(true);
    });

    it("should accept date range", () => {
      const result = getMrpResultsInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-03-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should accept all status values", () => {
      const statuses = ["PLANNED", "FIRMED", "RELEASED", "ALL"];
      for (const status of statuses) {
        const result = getMrpResultsInputSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid status", () => {
      const result = getMrpResultsInputSchema.safeParse({ status: "INVALID" });
      expect(result.success).toBe(false);
    });
  });

  describe("firmPlannedOrder input", () => {
    it("should accept valid input", () => {
      const result = firmPlannedOrderInputSchema.safeParse({
        plannedOrderId: "po-123",
      });
      expect(result.success).toBe(true);
    });

    it("should accept with notes", () => {
      const result = firmPlannedOrderInputSchema.safeParse({
        plannedOrderId: "po-123",
        notes: "Firmado para produção urgente",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing plannedOrderId", () => {
      const result = firmPlannedOrderInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("releasePlannedOrder input", () => {
    it("should accept valid input", () => {
      const result = releasePlannedOrderInputSchema.safeParse({
        plannedOrderId: "po-123",
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = releasePlannedOrderInputSchema.safeParse({
        plannedOrderId: "po-123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.createPurchaseOrder).toBe(false);
        expect(result.data.createProductionOrder).toBe(false);
      }
    });

    it("should accept full input", () => {
      const result = releasePlannedOrderInputSchema.safeParse({
        plannedOrderId: "po-123",
        createPurchaseOrder: true,
        createProductionOrder: false,
        notes: "Liberado para compra",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing plannedOrderId", () => {
      const result = releasePlannedOrderInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("deletePlannedOrder input", () => {
    it("should accept valid id", () => {
      const result = deletePlannedOrderInputSchema.safeParse({ id: "po-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = deletePlannedOrderInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("explodeBom input", () => {
    it("should accept valid input", () => {
      const result = explodeBomInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 100,
      });
      expect(result.success).toBe(true);
    });

    it("should apply default levels", () => {
      const result = explodeBomInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 100,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.levels).toBe(10);
      }
    });

    it("should accept custom levels", () => {
      const result = explodeBomInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 100,
        levels: 3,
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero quantity", () => {
      const result = explodeBomInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject levels less than 1", () => {
      const result = explodeBomInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 100,
        levels: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject levels greater than 10", () => {
      const result = explodeBomInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 100,
        levels: 11,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("whereUsed input", () => {
    it("should accept valid input", () => {
      const result = whereUsedInputSchema.safeParse({
        materialId: "mat-123",
      });
      expect(result.success).toBe(true);
    });

    it("should apply default levels", () => {
      const result = whereUsedInputSchema.safeParse({
        materialId: "mat-123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.levels).toBe(10);
      }
    });

    it("should accept custom levels", () => {
      const result = whereUsedInputSchema.safeParse({
        materialId: "mat-123",
        levels: 5,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing materialId", () => {
      const result = whereUsedInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject levels less than 1", () => {
      const result = whereUsedInputSchema.safeParse({
        materialId: "mat-123",
        levels: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject levels greater than 10", () => {
      const result = whereUsedInputSchema.safeParse({
        materialId: "mat-123",
        levels: 11,
      });
      expect(result.success).toBe(false);
    });
  });
});
