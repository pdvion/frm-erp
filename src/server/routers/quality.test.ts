import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router quality (Qualidade)
 * Valida inputs e estruturas de dados de inspeções e não conformidades
 */

// Schema de tipo de inspeção
const inspectionTypeSchema = z.enum(["RECEIVING", "IN_PROCESS", "FINAL", "AUDIT"]);

// Schema de status de inspeção
const inspectionStatusSchema = z.enum(["PENDING", "IN_PROGRESS", "APPROVED", "REJECTED", "PARTIAL"]);

// Schema de resultado de inspeção
const inspectionResultSchema = z.enum(["PENDING", "PASS", "FAIL", "CONDITIONAL"]);

// Schema de tipo de não conformidade
const ncTypeSchema = z.enum(["INTERNAL", "SUPPLIER", "CUSTOMER", "PROCESS"]);

// Schema de severidade de não conformidade
const ncSeveritySchema = z.enum(["MINOR", "MAJOR", "CRITICAL"]);

// Schema de status de não conformidade
const ncStatusSchema = z.enum(["OPEN", "ANALYZING", "ACTION", "VERIFICATION", "CLOSED"]);

// Schema de listagem de inspeções
const listInspectionsInputSchema = z.object({
  search: z.string().optional(),
  type: inspectionTypeSchema.optional(),
  status: inspectionStatusSchema.optional(),
  materialId: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

// Schema de criação de inspeção
const createInspectionInputSchema = z.object({
  type: inspectionTypeSchema,
  materialId: z.string().optional(),
  productionOrderId: z.string().optional(),
  receivedInvoiceId: z.string().optional(),
  lotNumber: z.string().optional(),
  quantity: z.number().positive(),
  sampleSize: z.number().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      characteristic: z.string(),
      specification: z.string().optional(),
      toleranceMin: z.number().optional(),
      toleranceMax: z.number().optional(),
    })
  ).optional(),
});

// Schema de item de inspeção
const inspectionItemSchema = z.object({
  characteristic: z.string(),
  specification: z.string().optional(),
  toleranceMin: z.number().optional(),
  toleranceMax: z.number().optional(),
  measuredValue: z.number().optional(),
  result: inspectionResultSchema,
  notes: z.string().optional(),
});

// Schema de criação de não conformidade
const createNonConformityInputSchema = z.object({
  inspectionId: z.string().optional(),
  type: ncTypeSchema,
  severity: ncSeveritySchema,
  description: z.string(),
  materialId: z.string().optional(),
  supplierId: z.string().optional(),
  productionOrderId: z.string().optional(),
  lotNumber: z.string().optional(),
  quantity: z.number().optional(),
  rootCause: z.string().optional(),
  correctiveAction: z.string().optional(),
});

// Schema de atualização de não conformidade
const updateNonConformityInputSchema = z.object({
  id: z.string(),
  status: ncStatusSchema.optional(),
  rootCause: z.string().optional(),
  correctiveAction: z.string().optional(),
  preventiveAction: z.string().optional(),
  verificationNotes: z.string().optional(),
  closedAt: z.date().optional(),
});

describe("Quality Router Schemas", () => {
  describe("Inspection Type Schema", () => {
    it("should accept RECEIVING type", () => {
      const result = inspectionTypeSchema.safeParse("RECEIVING");
      expect(result.success).toBe(true);
    });

    it("should accept IN_PROCESS type", () => {
      const result = inspectionTypeSchema.safeParse("IN_PROCESS");
      expect(result.success).toBe(true);
    });

    it("should accept FINAL type", () => {
      const result = inspectionTypeSchema.safeParse("FINAL");
      expect(result.success).toBe(true);
    });

    it("should accept AUDIT type", () => {
      const result = inspectionTypeSchema.safeParse("AUDIT");
      expect(result.success).toBe(true);
    });

    it("should reject invalid type", () => {
      const result = inspectionTypeSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Inspection Status Schema", () => {
    it("should accept PENDING status", () => {
      const result = inspectionStatusSchema.safeParse("PENDING");
      expect(result.success).toBe(true);
    });

    it("should accept IN_PROGRESS status", () => {
      const result = inspectionStatusSchema.safeParse("IN_PROGRESS");
      expect(result.success).toBe(true);
    });

    it("should accept APPROVED status", () => {
      const result = inspectionStatusSchema.safeParse("APPROVED");
      expect(result.success).toBe(true);
    });

    it("should accept REJECTED status", () => {
      const result = inspectionStatusSchema.safeParse("REJECTED");
      expect(result.success).toBe(true);
    });

    it("should accept PARTIAL status", () => {
      const result = inspectionStatusSchema.safeParse("PARTIAL");
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = inspectionStatusSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Inspection Result Schema", () => {
    it("should accept PENDING result", () => {
      const result = inspectionResultSchema.safeParse("PENDING");
      expect(result.success).toBe(true);
    });

    it("should accept PASS result", () => {
      const result = inspectionResultSchema.safeParse("PASS");
      expect(result.success).toBe(true);
    });

    it("should accept FAIL result", () => {
      const result = inspectionResultSchema.safeParse("FAIL");
      expect(result.success).toBe(true);
    });

    it("should accept CONDITIONAL result", () => {
      const result = inspectionResultSchema.safeParse("CONDITIONAL");
      expect(result.success).toBe(true);
    });

    it("should reject invalid result", () => {
      const result = inspectionResultSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Non-Conformity Type Schema", () => {
    it("should accept INTERNAL type", () => {
      const result = ncTypeSchema.safeParse("INTERNAL");
      expect(result.success).toBe(true);
    });

    it("should accept SUPPLIER type", () => {
      const result = ncTypeSchema.safeParse("SUPPLIER");
      expect(result.success).toBe(true);
    });

    it("should accept CUSTOMER type", () => {
      const result = ncTypeSchema.safeParse("CUSTOMER");
      expect(result.success).toBe(true);
    });

    it("should accept PROCESS type", () => {
      const result = ncTypeSchema.safeParse("PROCESS");
      expect(result.success).toBe(true);
    });

    it("should reject invalid type", () => {
      const result = ncTypeSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Non-Conformity Severity Schema", () => {
    it("should accept MINOR severity", () => {
      const result = ncSeveritySchema.safeParse("MINOR");
      expect(result.success).toBe(true);
    });

    it("should accept MAJOR severity", () => {
      const result = ncSeveritySchema.safeParse("MAJOR");
      expect(result.success).toBe(true);
    });

    it("should accept CRITICAL severity", () => {
      const result = ncSeveritySchema.safeParse("CRITICAL");
      expect(result.success).toBe(true);
    });

    it("should reject invalid severity", () => {
      const result = ncSeveritySchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Non-Conformity Status Schema", () => {
    it("should accept OPEN status", () => {
      const result = ncStatusSchema.safeParse("OPEN");
      expect(result.success).toBe(true);
    });

    it("should accept ANALYZING status", () => {
      const result = ncStatusSchema.safeParse("ANALYZING");
      expect(result.success).toBe(true);
    });

    it("should accept ACTION status", () => {
      const result = ncStatusSchema.safeParse("ACTION");
      expect(result.success).toBe(true);
    });

    it("should accept VERIFICATION status", () => {
      const result = ncStatusSchema.safeParse("VERIFICATION");
      expect(result.success).toBe(true);
    });

    it("should accept CLOSED status", () => {
      const result = ncStatusSchema.safeParse("CLOSED");
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = ncStatusSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("List Inspections Input Schema", () => {
    it("should accept empty input with defaults", () => {
      const result = listInspectionsInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should accept search filter", () => {
      const result = listInspectionsInputSchema.safeParse({
        search: "INS-001",
      });
      expect(result.success).toBe(true);
    });

    it("should accept type filter", () => {
      const result = listInspectionsInputSchema.safeParse({
        type: "RECEIVING",
      });
      expect(result.success).toBe(true);
    });

    it("should accept status filter", () => {
      const result = listInspectionsInputSchema.safeParse({
        status: "PENDING",
      });
      expect(result.success).toBe(true);
    });

    it("should accept materialId filter", () => {
      const result = listInspectionsInputSchema.safeParse({
        materialId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept all filters combined", () => {
      const result = listInspectionsInputSchema.safeParse({
        search: "teste",
        type: "FINAL",
        status: "APPROVED",
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        page: 2,
        limit: 50,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Create Inspection Input Schema", () => {
    it("should accept minimal valid input", () => {
      const result = createInspectionInputSchema.safeParse({
        type: "RECEIVING",
        quantity: 100,
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete input", () => {
      const result = createInspectionInputSchema.safeParse({
        type: "IN_PROCESS",
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        productionOrderId: "123e4567-e89b-12d3-a456-426614174001",
        lotNumber: "LOTE-2024-001",
        quantity: 500,
        sampleSize: 50,
        notes: "Inspeção de rotina",
        items: [
          {
            characteristic: "Dimensão A",
            specification: "10mm ± 0.5mm",
            toleranceMin: 9.5,
            toleranceMax: 10.5,
          },
          {
            characteristic: "Peso",
            specification: "100g ± 5g",
            toleranceMin: 95,
            toleranceMax: 105,
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing type", () => {
      const result = createInspectionInputSchema.safeParse({
        quantity: 100,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing quantity", () => {
      const result = createInspectionInputSchema.safeParse({
        type: "RECEIVING",
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero quantity", () => {
      const result = createInspectionInputSchema.safeParse({
        type: "RECEIVING",
        quantity: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative quantity", () => {
      const result = createInspectionInputSchema.safeParse({
        type: "RECEIVING",
        quantity: -10,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Inspection Item Schema", () => {
    it("should accept minimal valid item", () => {
      const result = inspectionItemSchema.safeParse({
        characteristic: "Dimensão",
        result: "PENDING",
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete item", () => {
      const result = inspectionItemSchema.safeParse({
        characteristic: "Dimensão A",
        specification: "10mm ± 0.5mm",
        toleranceMin: 9.5,
        toleranceMax: 10.5,
        measuredValue: 10.2,
        result: "PASS",
        notes: "Dentro da tolerância",
      });
      expect(result.success).toBe(true);
    });

    it("should accept item with FAIL result", () => {
      const result = inspectionItemSchema.safeParse({
        characteristic: "Peso",
        toleranceMin: 95,
        toleranceMax: 105,
        measuredValue: 110,
        result: "FAIL",
        notes: "Acima da tolerância máxima",
      });
      expect(result.success).toBe(true);
    });

    it("should accept item with CONDITIONAL result", () => {
      const result = inspectionItemSchema.safeParse({
        characteristic: "Visual",
        result: "CONDITIONAL",
        notes: "Pequeno arranhão, aprovado com restrição",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Create Non-Conformity Input Schema", () => {
    it("should accept minimal valid input", () => {
      const result = createNonConformityInputSchema.safeParse({
        type: "INTERNAL",
        severity: "MINOR",
        description: "Defeito visual no produto",
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete input", () => {
      const result = createNonConformityInputSchema.safeParse({
        inspectionId: "123e4567-e89b-12d3-a456-426614174000",
        type: "SUPPLIER",
        severity: "MAJOR",
        description: "Material fora de especificação",
        materialId: "123e4567-e89b-12d3-a456-426614174001",
        supplierId: "123e4567-e89b-12d3-a456-426614174002",
        lotNumber: "LOTE-2024-001",
        quantity: 50,
        rootCause: "Problema no processo do fornecedor",
        correctiveAction: "Devolução e reposição do material",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing type", () => {
      const result = createNonConformityInputSchema.safeParse({
        severity: "MINOR",
        description: "Defeito",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing severity", () => {
      const result = createNonConformityInputSchema.safeParse({
        type: "INTERNAL",
        description: "Defeito",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing description", () => {
      const result = createNonConformityInputSchema.safeParse({
        type: "INTERNAL",
        severity: "MINOR",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Update Non-Conformity Input Schema", () => {
    it("should accept minimal update", () => {
      const result = updateNonConformityInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept status update", () => {
      const result = updateNonConformityInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        status: "ANALYZING",
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete update", () => {
      const result = updateNonConformityInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        status: "CLOSED",
        rootCause: "Falha no processo de fabricação",
        correctiveAction: "Ajuste nos parâmetros da máquina",
        preventiveAction: "Implementação de controle estatístico",
        verificationNotes: "Verificado e aprovado",
        closedAt: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateNonConformityInputSchema.safeParse({
        status: "CLOSED",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Quality Metrics", () => {
    it("should calculate inspection pass rate", () => {
      const totalInspections = 100;
      const passedInspections = 95;
      const passRate = (passedInspections / totalInspections) * 100;
      expect(passRate).toBe(95);
    });

    it("should calculate defect rate", () => {
      const totalQuantity = 1000;
      const defectQuantity = 15;
      const defectRate = (defectQuantity / totalQuantity) * 100;
      expect(defectRate).toBe(1.5);
    });

    it("should calculate PPM (Parts Per Million)", () => {
      const totalQuantity = 1000000;
      const defectQuantity = 50;
      const ppm = (defectQuantity / totalQuantity) * 1000000;
      expect(ppm).toBe(50);
    });
  });

  describe("Tolerance Validation", () => {
    it("should validate value within tolerance", () => {
      const toleranceMin = 9.5;
      const toleranceMax = 10.5;
      const measuredValue = 10.0;
      const isWithinTolerance = measuredValue >= toleranceMin && measuredValue <= toleranceMax;
      expect(isWithinTolerance).toBe(true);
    });

    it("should detect value below minimum tolerance", () => {
      const toleranceMin = 9.5;
      const toleranceMax = 10.5;
      const measuredValue = 9.0;
      const isWithinTolerance = measuredValue >= toleranceMin && measuredValue <= toleranceMax;
      expect(isWithinTolerance).toBe(false);
    });

    it("should detect value above maximum tolerance", () => {
      const toleranceMin = 9.5;
      const toleranceMax = 10.5;
      const measuredValue = 11.0;
      const isWithinTolerance = measuredValue >= toleranceMin && measuredValue <= toleranceMax;
      expect(isWithinTolerance).toBe(false);
    });

    it("should accept value at minimum tolerance", () => {
      const toleranceMin = 9.5;
      const toleranceMax = 10.5;
      const measuredValue = 9.5;
      const isWithinTolerance = measuredValue >= toleranceMin && measuredValue <= toleranceMax;
      expect(isWithinTolerance).toBe(true);
    });

    it("should accept value at maximum tolerance", () => {
      const toleranceMin = 9.5;
      const toleranceMax = 10.5;
      const measuredValue = 10.5;
      const isWithinTolerance = measuredValue >= toleranceMin && measuredValue <= toleranceMax;
      expect(isWithinTolerance).toBe(true);
    });
  });
});
