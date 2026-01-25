import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const listInputSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED", "PARTIAL", "CANCELLED", "ALL"]).optional(),
  supplierId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
}).optional();

const getByIdInputSchema = z.object({ id: z.string() });

const createFromNfeInputSchema = z.object({
  supplierId: z.string(),
  purchaseOrderId: z.string().optional(),
  nfeNumber: z.string(),
  nfeSeries: z.string().optional(),
  nfeKey: z.string().optional(),
  nfeXml: z.string().optional(),
  nfeIssueDate: z.date().optional(),
  totalValue: z.number(),
  freightValue: z.number().default(0),
  locationId: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    materialId: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
    totalPrice: z.number().min(0),
    purchaseOrderItemId: z.string().optional(),
  })).min(1),
});

const createManualInputSchema = z.object({
  supplierId: z.string(),
  purchaseOrderId: z.string().optional(),
  documentNumber: z.string().optional(),
  documentType: z.enum(["NFE", "INVOICE", "RECEIPT", "OTHER"]).default("OTHER"),
  totalValue: z.number(),
  locationId: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    materialId: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
  })).min(1),
});

const updateInputSchema = z.object({
  id: z.string(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED", "PARTIAL", "CANCELLED"]).optional(),
  notes: z.string().optional(),
  locationId: z.string().optional(),
});

const completeInputSchema = z.object({
  id: z.string(),
  notes: z.string().optional(),
});

const rejectInputSchema = z.object({
  id: z.string(),
  reason: z.string().min(1),
});

const cancelInputSchema = z.object({
  id: z.string(),
  reason: z.string().min(1),
});

const addDivergenceInputSchema = z.object({
  receivingItemId: z.string(),
  type: z.enum(["QUANTITY", "QUALITY", "DAMAGE", "WRONG_ITEM", "OTHER"]),
  description: z.string().min(1),
  expectedValue: z.string().optional(),
  actualValue: z.string().optional(),
});

const resolveDivergenceInputSchema = z.object({
  divergenceId: z.string(),
  resolution: z.string().min(1),
  action: z.enum(["ACCEPT", "REJECT", "PARTIAL"]),
});

describe("Receiving Router Schemas", () => {
  describe("list input", () => {
    it("should accept empty input", () => {
      const result = listInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept status PENDING", () => {
      const result = listInputSchema.safeParse({ status: "PENDING" });
      expect(result.success).toBe(true);
    });

    it("should accept status IN_PROGRESS", () => {
      const result = listInputSchema.safeParse({ status: "IN_PROGRESS" });
      expect(result.success).toBe(true);
    });

    it("should accept status COMPLETED", () => {
      const result = listInputSchema.safeParse({ status: "COMPLETED" });
      expect(result.success).toBe(true);
    });

    it("should accept status REJECTED", () => {
      const result = listInputSchema.safeParse({ status: "REJECTED" });
      expect(result.success).toBe(true);
    });

    it("should accept status PARTIAL", () => {
      const result = listInputSchema.safeParse({ status: "PARTIAL" });
      expect(result.success).toBe(true);
    });

    it("should accept status CANCELLED", () => {
      const result = listInputSchema.safeParse({ status: "CANCELLED" });
      expect(result.success).toBe(true);
    });

    it("should accept status ALL", () => {
      const result = listInputSchema.safeParse({ status: "ALL" });
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = listInputSchema.safeParse({ status: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("should accept supplierId", () => {
      const result = listInputSchema.safeParse({ supplierId: "sup-123" });
      expect(result.success).toBe(true);
    });

    it("should accept date range", () => {
      const result = listInputSchema.safeParse({
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
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
  });

  describe("getById input", () => {
    it("should accept valid id", () => {
      const result = getByIdInputSchema.safeParse({ id: "rec-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = getByIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("createFromNfe input", () => {
    it("should accept valid input", () => {
      const result = createFromNfeInputSchema.safeParse({
        supplierId: "sup-123",
        nfeNumber: "12345",
        totalValue: 1000,
        items: [
          { materialId: "mat-001", quantity: 10, unitPrice: 50, totalPrice: 500 },
          { materialId: "mat-002", quantity: 5, unitPrice: 100, totalPrice: 500 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = createFromNfeInputSchema.safeParse({
        supplierId: "sup-123",
        nfeNumber: "12345",
        totalValue: 1000,
        items: [{ materialId: "mat-001", quantity: 10, unitPrice: 100, totalPrice: 1000 }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.freightValue).toBe(0);
      }
    });

    it("should accept full input", () => {
      const result = createFromNfeInputSchema.safeParse({
        supplierId: "sup-123",
        purchaseOrderId: "po-456",
        nfeNumber: "12345",
        nfeSeries: "1",
        nfeKey: "35260112345678000190550010000123451234567890",
        nfeXml: "<nfeProc>...</nfeProc>",
        nfeIssueDate: new Date(),
        totalValue: 1000,
        freightValue: 50,
        locationId: "loc-001",
        notes: "Recebimento urgente",
        items: [
          { materialId: "mat-001", quantity: 10, unitPrice: 95, totalPrice: 950, purchaseOrderItemId: "poi-001" },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing supplierId", () => {
      const result = createFromNfeInputSchema.safeParse({
        nfeNumber: "12345",
        totalValue: 1000,
        items: [{ materialId: "mat-001", quantity: 10, unitPrice: 100, totalPrice: 1000 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing nfeNumber", () => {
      const result = createFromNfeInputSchema.safeParse({
        supplierId: "sup-123",
        totalValue: 1000,
        items: [{ materialId: "mat-001", quantity: 10, unitPrice: 100, totalPrice: 1000 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty items array", () => {
      const result = createFromNfeInputSchema.safeParse({
        supplierId: "sup-123",
        nfeNumber: "12345",
        totalValue: 1000,
        items: [],
      });
      expect(result.success).toBe(false);
    });

    it("should reject item with zero quantity", () => {
      const result = createFromNfeInputSchema.safeParse({
        supplierId: "sup-123",
        nfeNumber: "12345",
        totalValue: 1000,
        items: [{ materialId: "mat-001", quantity: 0, unitPrice: 100, totalPrice: 0 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject item with negative unitPrice", () => {
      const result = createFromNfeInputSchema.safeParse({
        supplierId: "sup-123",
        nfeNumber: "12345",
        totalValue: 1000,
        items: [{ materialId: "mat-001", quantity: 10, unitPrice: -10, totalPrice: -100 }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createManual input", () => {
    it("should accept valid input", () => {
      const result = createManualInputSchema.safeParse({
        supplierId: "sup-123",
        totalValue: 500,
        items: [{ materialId: "mat-001", quantity: 10, unitPrice: 50 }],
      });
      expect(result.success).toBe(true);
    });

    it("should apply default documentType", () => {
      const result = createManualInputSchema.safeParse({
        supplierId: "sup-123",
        totalValue: 500,
        items: [{ materialId: "mat-001", quantity: 10, unitPrice: 50 }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.documentType).toBe("OTHER");
      }
    });

    it("should accept all document types", () => {
      const types = ["NFE", "INVOICE", "RECEIPT", "OTHER"];
      for (const type of types) {
        const result = createManualInputSchema.safeParse({
          supplierId: "sup-123",
          documentType: type,
          totalValue: 500,
          items: [{ materialId: "mat-001", quantity: 10, unitPrice: 50 }],
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject empty items", () => {
      const result = createManualInputSchema.safeParse({
        supplierId: "sup-123",
        totalValue: 500,
        items: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("update input", () => {
    it("should accept id only", () => {
      const result = updateInputSchema.safeParse({ id: "rec-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateInputSchema.safeParse({
        id: "rec-123",
        status: "IN_PROGRESS",
        notes: "Em conferência",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateInputSchema.safeParse({
        status: "COMPLETED",
      });
      expect(result.success).toBe(false);
    });

    it("should accept all status values", () => {
      const statuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED", "PARTIAL", "CANCELLED"];
      for (const status of statuses) {
        const result = updateInputSchema.safeParse({ id: "rec-123", status });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("complete input", () => {
    it("should accept valid completion", () => {
      const result = completeInputSchema.safeParse({ id: "rec-123" });
      expect(result.success).toBe(true);
    });

    it("should accept completion with notes", () => {
      const result = completeInputSchema.safeParse({
        id: "rec-123",
        notes: "Recebimento concluído sem divergências",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = completeInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("reject input", () => {
    it("should accept valid rejection", () => {
      const result = rejectInputSchema.safeParse({
        id: "rec-123",
        reason: "Material fora das especificações",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing reason", () => {
      const result = rejectInputSchema.safeParse({
        id: "rec-123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty reason", () => {
      const result = rejectInputSchema.safeParse({
        id: "rec-123",
        reason: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("cancel input", () => {
    it("should accept valid cancellation", () => {
      const result = cancelInputSchema.safeParse({
        id: "rec-123",
        reason: "Pedido cancelado pelo fornecedor",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing reason", () => {
      const result = cancelInputSchema.safeParse({
        id: "rec-123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty reason", () => {
      const result = cancelInputSchema.safeParse({
        id: "rec-123",
        reason: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("addDivergence input", () => {
    it("should accept valid divergence", () => {
      const result = addDivergenceInputSchema.safeParse({
        receivingItemId: "item-123",
        type: "QUANTITY",
        description: "Quantidade recebida menor que a pedida",
      });
      expect(result.success).toBe(true);
    });

    it("should accept all divergence types", () => {
      const types = ["QUANTITY", "QUALITY", "DAMAGE", "WRONG_ITEM", "OTHER"];
      for (const type of types) {
        const result = addDivergenceInputSchema.safeParse({
          receivingItemId: "item-123",
          type,
          description: `Divergência de ${type}`,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should accept with expected and actual values", () => {
      const result = addDivergenceInputSchema.safeParse({
        receivingItemId: "item-123",
        type: "QUANTITY",
        description: "Quantidade divergente",
        expectedValue: "100",
        actualValue: "90",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing description", () => {
      const result = addDivergenceInputSchema.safeParse({
        receivingItemId: "item-123",
        type: "QUANTITY",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty description", () => {
      const result = addDivergenceInputSchema.safeParse({
        receivingItemId: "item-123",
        type: "QUANTITY",
        description: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("resolveDivergence input", () => {
    it("should accept valid resolution", () => {
      const result = resolveDivergenceInputSchema.safeParse({
        divergenceId: "div-123",
        resolution: "Aceito com desconto de 10%",
        action: "ACCEPT",
      });
      expect(result.success).toBe(true);
    });

    it("should accept all action types", () => {
      const actions = ["ACCEPT", "REJECT", "PARTIAL"];
      for (const action of actions) {
        const result = resolveDivergenceInputSchema.safeParse({
          divergenceId: "div-123",
          resolution: `Ação: ${action}`,
          action,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject missing resolution", () => {
      const result = resolveDivergenceInputSchema.safeParse({
        divergenceId: "div-123",
        action: "ACCEPT",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty resolution", () => {
      const result = resolveDivergenceInputSchema.safeParse({
        divergenceId: "div-123",
        resolution: "",
        action: "ACCEPT",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid action", () => {
      const result = resolveDivergenceInputSchema.safeParse({
        divergenceId: "div-123",
        resolution: "Resolução",
        action: "INVALID",
      });
      expect(result.success).toBe(false);
    });
  });
});
