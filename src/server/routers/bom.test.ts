import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const getByProductInputSchema = z.object({ materialId: z.string() });

const listProductsInputSchema = z.object({
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
}).optional();

const addItemInputSchema = z.object({
  parentMaterialId: z.string(),
  childMaterialId: z.string(),
  quantity: z.number().positive(),
  unit: z.string().optional(),
  notes: z.string().optional(),
  sequence: z.number().optional(),
});

const updateItemInputSchema = z.object({
  id: z.string(),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
  sequence: z.number().optional(),
  isActive: z.boolean().optional(),
});

const removeItemInputSchema = z.object({ id: z.string() });

const copyBomInputSchema = z.object({
  sourceMaterialId: z.string(),
  targetMaterialId: z.string(),
  includeInactive: z.boolean().default(false),
});

const explodeBomInputSchema = z.object({
  materialId: z.string(),
  quantity: z.number().positive().default(1),
  maxLevels: z.number().min(1).max(10).default(5),
});

const whereUsedInputSchema = z.object({
  materialId: z.string(),
  includeInactive: z.boolean().default(false),
});

const calculateCostInputSchema = z.object({
  materialId: z.string(),
  quantity: z.number().positive().default(1),
});

describe("BOM Router Schemas", () => {
  describe("getByProduct input", () => {
    it("should accept valid materialId", () => {
      const result = getByProductInputSchema.safeParse({
        materialId: "mat-123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing materialId", () => {
      const result = getByProductInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("listProducts input", () => {
    it("should accept empty input", () => {
      const result = listProductsInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = listProductsInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.page).toBe(1);
        expect(result.data?.limit).toBe(20);
      }
    });

    it("should accept search string", () => {
      const result = listProductsInputSchema.safeParse({ search: "produto" });
      expect(result.success).toBe(true);
    });

    it("should accept custom pagination", () => {
      const result = listProductsInputSchema.safeParse({ page: 5, limit: 50 });
      expect(result.success).toBe(true);
    });

    it("should reject page less than 1", () => {
      const result = listProductsInputSchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it("should reject limit greater than 100", () => {
      const result = listProductsInputSchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it("should reject limit less than 1", () => {
      const result = listProductsInputSchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
    });
  });

  describe("addItem input", () => {
    it("should accept valid input", () => {
      const result = addItemInputSchema.safeParse({
        parentMaterialId: "parent-123",
        childMaterialId: "child-456",
        quantity: 2.5,
      });
      expect(result.success).toBe(true);
    });

    it("should accept full input", () => {
      const result = addItemInputSchema.safeParse({
        parentMaterialId: "parent-123",
        childMaterialId: "child-456",
        quantity: 2.5,
        unit: "UN",
        notes: "Componente principal",
        sequence: 10,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing parentMaterialId", () => {
      const result = addItemInputSchema.safeParse({
        childMaterialId: "child-456",
        quantity: 2.5,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing childMaterialId", () => {
      const result = addItemInputSchema.safeParse({
        parentMaterialId: "parent-123",
        quantity: 2.5,
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero quantity", () => {
      const result = addItemInputSchema.safeParse({
        parentMaterialId: "parent-123",
        childMaterialId: "child-456",
        quantity: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative quantity", () => {
      const result = addItemInputSchema.safeParse({
        parentMaterialId: "parent-123",
        childMaterialId: "child-456",
        quantity: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateItem input", () => {
    it("should accept id only", () => {
      const result = updateItemInputSchema.safeParse({ id: "item-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateItemInputSchema.safeParse({
        id: "item-123",
        quantity: 5,
        notes: "Atualizado",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateItemInputSchema.safeParse({
        quantity: 5,
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero quantity on update", () => {
      const result = updateItemInputSchema.safeParse({
        id: "item-123",
        quantity: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should accept isActive change", () => {
      const result = updateItemInputSchema.safeParse({
        id: "item-123",
        isActive: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("removeItem input", () => {
    it("should accept valid id", () => {
      const result = removeItemInputSchema.safeParse({ id: "item-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = removeItemInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("copyBom input", () => {
    it("should accept valid input", () => {
      const result = copyBomInputSchema.safeParse({
        sourceMaterialId: "source-123",
        targetMaterialId: "target-456",
      });
      expect(result.success).toBe(true);
    });

    it("should apply default includeInactive", () => {
      const result = copyBomInputSchema.safeParse({
        sourceMaterialId: "source-123",
        targetMaterialId: "target-456",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeInactive).toBe(false);
      }
    });

    it("should accept includeInactive true", () => {
      const result = copyBomInputSchema.safeParse({
        sourceMaterialId: "source-123",
        targetMaterialId: "target-456",
        includeInactive: true,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing sourceMaterialId", () => {
      const result = copyBomInputSchema.safeParse({
        targetMaterialId: "target-456",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing targetMaterialId", () => {
      const result = copyBomInputSchema.safeParse({
        sourceMaterialId: "source-123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("explodeBom input", () => {
    it("should accept valid input", () => {
      const result = explodeBomInputSchema.safeParse({
        materialId: "mat-123",
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = explodeBomInputSchema.safeParse({
        materialId: "mat-123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(1);
        expect(result.data.maxLevels).toBe(5);
      }
    });

    it("should accept custom quantity and maxLevels", () => {
      const result = explodeBomInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 100,
        maxLevels: 3,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing materialId", () => {
      const result = explodeBomInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject zero quantity", () => {
      const result = explodeBomInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject maxLevels less than 1", () => {
      const result = explodeBomInputSchema.safeParse({
        materialId: "mat-123",
        maxLevels: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject maxLevels greater than 10", () => {
      const result = explodeBomInputSchema.safeParse({
        materialId: "mat-123",
        maxLevels: 11,
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

    it("should apply default includeInactive", () => {
      const result = whereUsedInputSchema.safeParse({
        materialId: "mat-123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeInactive).toBe(false);
      }
    });

    it("should accept includeInactive true", () => {
      const result = whereUsedInputSchema.safeParse({
        materialId: "mat-123",
        includeInactive: true,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing materialId", () => {
      const result = whereUsedInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("calculateCost input", () => {
    it("should accept valid input", () => {
      const result = calculateCostInputSchema.safeParse({
        materialId: "mat-123",
      });
      expect(result.success).toBe(true);
    });

    it("should apply default quantity", () => {
      const result = calculateCostInputSchema.safeParse({
        materialId: "mat-123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(1);
      }
    });

    it("should accept custom quantity", () => {
      const result = calculateCostInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 50,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing materialId", () => {
      const result = calculateCostInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject zero quantity", () => {
      const result = calculateCostInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative quantity", () => {
      const result = calculateCostInputSchema.safeParse({
        materialId: "mat-123",
        quantity: -10,
      });
      expect(result.success).toBe(false);
    });
  });
});
