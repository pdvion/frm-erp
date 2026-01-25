import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const listInputSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
}).optional();

const byIdInputSchema = z.object({ id: z.string() });

const byIdOrCodeInputSchema = z.object({ idOrCode: z.string() });

const createInputSchema = z.object({
  code: z.number(),
  internalCode: z.string().optional(),
  description: z.string().min(1),
  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  unit: z.string().default("UN"),
  purchaseUnit: z.string().optional(),
  unitConversionFactor: z.number().default(1),
  location: z.string().optional(),
  stockLocationId: z.string().optional(),
  minQuantity: z.number().default(0),
  maxQuantity: z.number().optional(),
  minQuantityCalcType: z.enum(["MANUAL", "CMM", "PEAK_12M"]).default("MANUAL"),
  maxMonthlyConsumption: z.number().default(0),
  adjustMaxConsumptionManual: z.boolean().default(false),
  avgDeliveryDays: z.number().default(0),
  ncm: z.string().optional(),
  ipiRate: z.number().default(0),
  icmsRate: z.number().default(0),
  isEpi: z.boolean().default(false),
  epiCaCode: z.string().optional(),
  isOfficeSupply: z.boolean().default(false),
  financialValidated: z.boolean().default(false),
  financialValidatedCc: z.boolean().default(false),
  requiresQualityCheck: z.boolean().default(false),
  requiresQualityInspection: z.boolean().default(false),
  requiresMaterialCertificate: z.boolean().default(false),
  requiresControlSheets: z.boolean().default(false),
  requiresReturn: z.boolean().default(false),
  requiresFiscalEntry: z.boolean().default(false),
  requiredBrand: z.string().optional(),
  requiredBrandReason: z.string().optional(),
  writeOffCode: z.string().optional(),
  costCenterFrm: z.string().optional(),
  costCenterFnd: z.string().optional(),
  financialAccount: z.string().optional(),
  weight: z.number().default(0),
  weightUnit: z.string().default("KG"),
  barcode: z.string().optional(),
  manufacturer: z.string().optional(),
  manufacturerCode: z.string().optional(),
  notes: z.string().optional(),
  isShared: z.boolean().default(false),
});

const updateInputSchema = z.object({
  id: z.string(),
  internalCode: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
  unit: z.string().optional(),
  minQuantity: z.number().optional(),
  ncm: z.string().optional(),
  isEpi: z.boolean().optional(),
});

const deleteInputSchema = z.object({ id: z.string() });

describe("Materials Router Schemas", () => {
  describe("list input", () => {
    it("should accept empty input", () => {
      const result = listInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept search string", () => {
      const result = listInputSchema.safeParse({ search: "parafuso" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.search).toBe("parafuso");
      }
    });

    it("should accept categoryId", () => {
      const result = listInputSchema.safeParse({ categoryId: "cat-123" });
      expect(result.success).toBe(true);
    });

    it("should accept status ACTIVE", () => {
      const result = listInputSchema.safeParse({ status: "ACTIVE" });
      expect(result.success).toBe(true);
    });

    it("should accept status INACTIVE", () => {
      const result = listInputSchema.safeParse({ status: "INACTIVE" });
      expect(result.success).toBe(true);
    });

    it("should accept status BLOCKED", () => {
      const result = listInputSchema.safeParse({ status: "BLOCKED" });
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = listInputSchema.safeParse({ status: "DELETED" });
      expect(result.success).toBe(false);
    });

    it("should default page to 1", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.page).toBe(1);
      }
    });

    it("should default limit to 20", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.limit).toBe(20);
      }
    });

    it("should reject page less than 1", () => {
      const result = listInputSchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it("should reject limit greater than 100", () => {
      const result = listInputSchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });
  });

  describe("byId input", () => {
    it("should accept valid id", () => {
      const result = byIdInputSchema.safeParse({ id: "mat-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = byIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("byIdOrCode input", () => {
    it("should accept UUID", () => {
      const result = byIdOrCodeInputSchema.safeParse({ 
        idOrCode: "550e8400-e29b-41d4-a716-446655440000" 
      });
      expect(result.success).toBe(true);
    });

    it("should accept numeric code", () => {
      const result = byIdOrCodeInputSchema.safeParse({ idOrCode: "12345" });
      expect(result.success).toBe(true);
    });

    it("should accept alphanumeric code", () => {
      const result = byIdOrCodeInputSchema.safeParse({ idOrCode: "MAT001" });
      expect(result.success).toBe(true);
    });
  });

  describe("create input", () => {
    it("should accept minimal valid input", () => {
      const result = createInputSchema.safeParse({
        code: 1001,
        description: "Parafuso M8x30",
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = createInputSchema.safeParse({
        code: 1002,
        description: "Material Teste",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unit).toBe("UN");
        expect(result.data.unitConversionFactor).toBe(1);
        expect(result.data.minQuantity).toBe(0);
        expect(result.data.minQuantityCalcType).toBe("MANUAL");
        expect(result.data.isEpi).toBe(false);
        expect(result.data.weight).toBe(0);
        expect(result.data.weightUnit).toBe("KG");
        expect(result.data.isShared).toBe(false);
      }
    });

    it("should accept full input", () => {
      const result = createInputSchema.safeParse({
        code: 1003,
        internalCode: "INT-001",
        description: "Material Completo",
        categoryId: "cat-123",
        subCategoryId: "subcat-456",
        unit: "PC",
        purchaseUnit: "CX",
        unitConversionFactor: 10,
        location: "A1-B2",
        stockLocationId: "loc-789",
        minQuantity: 100,
        maxQuantity: 1000,
        minQuantityCalcType: "CMM",
        maxMonthlyConsumption: 500,
        adjustMaxConsumptionManual: true,
        avgDeliveryDays: 15,
        ncm: "73181500",
        ipiRate: 5,
        icmsRate: 18,
        isEpi: true,
        epiCaCode: "12345",
        isOfficeSupply: false,
        financialValidated: true,
        financialValidatedCc: true,
        requiresQualityCheck: true,
        requiresQualityInspection: true,
        requiresMaterialCertificate: true,
        requiresControlSheets: false,
        requiresReturn: false,
        requiresFiscalEntry: true,
        requiredBrand: "Marca X",
        requiredBrandReason: "Qualidade superior",
        writeOffCode: "WO-001",
        costCenterFrm: "CC-FRM",
        costCenterFnd: "CC-FND",
        financialAccount: "FA-001",
        weight: 0.5,
        weightUnit: "G",
        barcode: "7891234567890",
        manufacturer: "Fabricante ABC",
        manufacturerCode: "FAB-001",
        notes: "Observações do material",
        isShared: true,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing code", () => {
      const result = createInputSchema.safeParse({
        description: "Material sem código",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing description", () => {
      const result = createInputSchema.safeParse({
        code: 1004,
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty description", () => {
      const result = createInputSchema.safeParse({
        code: 1005,
        description: "",
      });
      expect(result.success).toBe(false);
    });

    it("should accept minQuantityCalcType CMM", () => {
      const result = createInputSchema.safeParse({
        code: 1006,
        description: "Material CMM",
        minQuantityCalcType: "CMM",
      });
      expect(result.success).toBe(true);
    });

    it("should accept minQuantityCalcType PEAK_12M", () => {
      const result = createInputSchema.safeParse({
        code: 1007,
        description: "Material PEAK",
        minQuantityCalcType: "PEAK_12M",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid minQuantityCalcType", () => {
      const result = createInputSchema.safeParse({
        code: 1008,
        description: "Material Invalid",
        minQuantityCalcType: "INVALID",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("update input", () => {
    it("should accept id only", () => {
      const result = updateInputSchema.safeParse({ id: "mat-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateInputSchema.safeParse({
        id: "mat-123",
        description: "Nova Descrição",
        status: "INACTIVE",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateInputSchema.safeParse({
        description: "Sem ID",
      });
      expect(result.success).toBe(false);
    });

    it("should accept status change to BLOCKED", () => {
      const result = updateInputSchema.safeParse({
        id: "mat-123",
        status: "BLOCKED",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("delete input", () => {
    it("should accept valid id", () => {
      const result = deleteInputSchema.safeParse({ id: "mat-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = deleteInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
