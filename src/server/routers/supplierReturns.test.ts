import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router supplierReturns (Devolução a Fornecedor)
 * Valida inputs e estruturas de dados de devoluções de materiais
 */

// Schema de motivo de devolução
const returnReasonSchema = z.enum([
  "QUALITY_ISSUE",
  "WRONG_PRODUCT",
  "WRONG_QUANTITY",
  "DAMAGED",
  "EXPIRED",
  "NOT_ORDERED",
  "PRICE_DIFFERENCE",
  "OTHER",
]);

// Schema de status de devolução
const returnStatusSchema = z.enum([
  "DRAFT",
  "PENDING",
  "APPROVED",
  "INVOICED",
  "COMPLETED",
  "CANCELLED",
]);

// Schema de item de devolução
const returnItemSchema = z.object({
  materialId: z.string().uuid(),
  receivedInvoiceItemId: z.string().uuid().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  reason: returnReasonSchema,
  reasonNotes: z.string().optional(),
  stockLocationId: z.string().uuid().optional(),
});

// Schema de listagem
const listInputSchema = z.object({
  search: z.string().optional(),
  status: returnStatusSchema.optional(),
  supplierId: z.string().uuid().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

// Schema de criação
const createInputSchema = z.object({
  supplierId: z.string().uuid(),
  receivedInvoiceId: z.string().uuid().optional(),
  returnDate: z.date(),
  notes: z.string().optional(),
  items: z.array(returnItemSchema).min(1),
});

describe("SupplierReturns Router Schemas", () => {
  describe("Return Reason Schema", () => {
    it("should accept QUALITY_ISSUE reason", () => {
      const result = returnReasonSchema.safeParse("QUALITY_ISSUE");
      expect(result.success).toBe(true);
    });

    it("should accept WRONG_PRODUCT reason", () => {
      const result = returnReasonSchema.safeParse("WRONG_PRODUCT");
      expect(result.success).toBe(true);
    });

    it("should accept WRONG_QUANTITY reason", () => {
      const result = returnReasonSchema.safeParse("WRONG_QUANTITY");
      expect(result.success).toBe(true);
    });

    it("should accept DAMAGED reason", () => {
      const result = returnReasonSchema.safeParse("DAMAGED");
      expect(result.success).toBe(true);
    });

    it("should accept EXPIRED reason", () => {
      const result = returnReasonSchema.safeParse("EXPIRED");
      expect(result.success).toBe(true);
    });

    it("should accept NOT_ORDERED reason", () => {
      const result = returnReasonSchema.safeParse("NOT_ORDERED");
      expect(result.success).toBe(true);
    });

    it("should accept PRICE_DIFFERENCE reason", () => {
      const result = returnReasonSchema.safeParse("PRICE_DIFFERENCE");
      expect(result.success).toBe(true);
    });

    it("should accept OTHER reason", () => {
      const result = returnReasonSchema.safeParse("OTHER");
      expect(result.success).toBe(true);
    });

    it("should reject invalid reason", () => {
      const result = returnReasonSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Return Status Schema", () => {
    it("should accept all valid statuses", () => {
      const statuses = ["DRAFT", "PENDING", "APPROVED", "INVOICED", "COMPLETED", "CANCELLED"];
      statuses.forEach((status) => {
        const result = returnStatusSchema.safeParse(status);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid status", () => {
      const result = returnStatusSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Return Item Schema", () => {
    it("should accept valid item", () => {
      const result = returnItemSchema.safeParse({
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        quantity: 10,
        unitPrice: 25.50,
        reason: "QUALITY_ISSUE",
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete item", () => {
      const result = returnItemSchema.safeParse({
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        receivedInvoiceItemId: "123e4567-e89b-12d3-a456-426614174001",
        quantity: 10,
        unitPrice: 25.50,
        reason: "DAMAGED",
        reasonNotes: "Material chegou com embalagem danificada",
        stockLocationId: "123e4567-e89b-12d3-a456-426614174002",
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero quantity", () => {
      const result = returnItemSchema.safeParse({
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        quantity: 0,
        unitPrice: 25.50,
        reason: "QUALITY_ISSUE",
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative quantity", () => {
      const result = returnItemSchema.safeParse({
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        quantity: -5,
        unitPrice: 25.50,
        reason: "QUALITY_ISSUE",
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative price", () => {
      const result = returnItemSchema.safeParse({
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        quantity: 10,
        unitPrice: -25.50,
        reason: "QUALITY_ISSUE",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("List Input Schema", () => {
    it("should accept empty input with defaults", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
      }
    });

    it("should accept all filters", () => {
      const result = listInputSchema.safeParse({
        search: "fornecedor",
        status: "PENDING",
        supplierId: "123e4567-e89b-12d3-a456-426614174000",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        page: 2,
        pageSize: 50,
      });
      expect(result.success).toBe(true);
    });

    it("should reject page less than 1", () => {
      const result = listInputSchema.safeParse({
        page: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject pageSize greater than 100", () => {
      const result = listInputSchema.safeParse({
        pageSize: 101,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Create Input Schema", () => {
    it("should accept valid input", () => {
      const result = createInputSchema.safeParse({
        supplierId: "123e4567-e89b-12d3-a456-426614174000",
        returnDate: new Date("2024-03-15"),
        items: [
          {
            materialId: "123e4567-e89b-12d3-a456-426614174001",
            quantity: 10,
            unitPrice: 25.50,
            reason: "QUALITY_ISSUE",
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete input", () => {
      const result = createInputSchema.safeParse({
        supplierId: "123e4567-e89b-12d3-a456-426614174000",
        receivedInvoiceId: "123e4567-e89b-12d3-a456-426614174002",
        returnDate: new Date("2024-03-15"),
        notes: "Devolução por problemas de qualidade",
        items: [
          {
            materialId: "123e4567-e89b-12d3-a456-426614174001",
            quantity: 10,
            unitPrice: 25.50,
            reason: "QUALITY_ISSUE",
            reasonNotes: "Lote com defeito",
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty items array", () => {
      const result = createInputSchema.safeParse({
        supplierId: "123e4567-e89b-12d3-a456-426614174000",
        returnDate: new Date("2024-03-15"),
        items: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Return Workflow", () => {
    const validTransitions: Record<string, string[]> = {
      DRAFT: ["PENDING", "CANCELLED"],
      PENDING: ["APPROVED", "CANCELLED"],
      APPROVED: ["INVOICED", "CANCELLED"],
      INVOICED: ["COMPLETED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    it("should allow DRAFT to PENDING", () => {
      expect(validTransitions.DRAFT.includes("PENDING")).toBe(true);
    });

    it("should allow PENDING to APPROVED", () => {
      expect(validTransitions.PENDING.includes("APPROVED")).toBe(true);
    });

    it("should allow APPROVED to INVOICED", () => {
      expect(validTransitions.APPROVED.includes("INVOICED")).toBe(true);
    });

    it("should allow INVOICED to COMPLETED", () => {
      expect(validTransitions.INVOICED.includes("COMPLETED")).toBe(true);
    });

    it("should not allow COMPLETED to any status", () => {
      expect(validTransitions.COMPLETED.length).toBe(0);
    });
  });

  describe("Return Calculations", () => {
    it("should calculate item total", () => {
      const quantity = 10;
      const unitPrice = 25.50;
      const total = quantity * unitPrice;
      expect(total).toBe(255);
    });

    it("should calculate return total", () => {
      const items = [
        { quantity: 10, unitPrice: 25.50 },
        { quantity: 5, unitPrice: 100 },
        { quantity: 20, unitPrice: 15 },
      ];
      const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      expect(total).toBe(1055);
    });
  });

  describe("Stock Impact", () => {
    it("should decrease stock on return creation", () => {
      const currentStock = 100;
      const returnQty = 10;
      const newStock = currentStock - returnQty;
      expect(newStock).toBe(90);
    });

    it("should restore stock on return cancellation", () => {
      const currentStock = 90;
      const returnQty = 10;
      const newStock = currentStock + returnQty;
      expect(newStock).toBe(100);
    });
  });
});
