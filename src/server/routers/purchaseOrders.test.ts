import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const listInputSchema = z.object({
  supplierId: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING", "APPROVED", "SENT", "PARTIAL", "COMPLETED", "CANCELLED"]).optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
}).optional();

const byIdInputSchema = z.object({ id: z.string() });

const createFromQuoteInputSchema = z.object({
  quoteId: z.string(),
  expectedDeliveryDate: z.date().optional(),
  notes: z.string().optional(),
});

const createManualInputSchema = z.object({
  supplierId: z.string(),
  orderDate: z.date(),
  expectedDeliveryDate: z.date().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    materialId: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
    unit: z.string().default("UN"),
    notes: z.string().optional(),
  })).min(1),
});

const updateInputSchema = z.object({
  id: z.string(),
  expectedDeliveryDate: z.date().optional(),
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING", "APPROVED", "SENT", "PARTIAL", "COMPLETED", "CANCELLED"]).optional(),
});

const addItemInputSchema = z.object({
  purchaseOrderId: z.string(),
  materialId: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  unit: z.string().default("UN"),
  notes: z.string().optional(),
});

const updateItemInputSchema = z.object({
  id: z.string(),
  quantity: z.number().positive().optional(),
  unitPrice: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const removeItemInputSchema = z.object({ id: z.string() });

const submitForApprovalInputSchema = z.object({
  id: z.string(),
  notes: z.string().optional(),
});

const approveInputSchema = z.object({
  id: z.string(),
  notes: z.string().optional(),
});

const rejectInputSchema = z.object({
  id: z.string(),
  reason: z.string().min(1),
});

const sendInputSchema = z.object({
  id: z.string(),
  sentDate: z.date().optional(),
  notes: z.string().optional(),
});

const cancelInputSchema = z.object({
  id: z.string(),
  reason: z.string().min(1),
});

const deleteInputSchema = z.object({ id: z.string() });

describe("PurchaseOrders Router Schemas", () => {
  describe("list input", () => {
    it("should accept empty input", () => {
      const result = listInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept supplierId", () => {
      const result = listInputSchema.safeParse({ supplierId: "sup-123" });
      expect(result.success).toBe(true);
    });

    it("should accept status DRAFT", () => {
      const result = listInputSchema.safeParse({ status: "DRAFT" });
      expect(result.success).toBe(true);
    });

    it("should accept status PENDING", () => {
      const result = listInputSchema.safeParse({ status: "PENDING" });
      expect(result.success).toBe(true);
    });

    it("should accept status APPROVED", () => {
      const result = listInputSchema.safeParse({ status: "APPROVED" });
      expect(result.success).toBe(true);
    });

    it("should accept status SENT", () => {
      const result = listInputSchema.safeParse({ status: "SENT" });
      expect(result.success).toBe(true);
    });

    it("should accept status PARTIAL", () => {
      const result = listInputSchema.safeParse({ status: "PARTIAL" });
      expect(result.success).toBe(true);
    });

    it("should accept status COMPLETED", () => {
      const result = listInputSchema.safeParse({ status: "COMPLETED" });
      expect(result.success).toBe(true);
    });

    it("should accept status CANCELLED", () => {
      const result = listInputSchema.safeParse({ status: "CANCELLED" });
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = listInputSchema.safeParse({ status: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("should accept search string", () => {
      const result = listInputSchema.safeParse({ search: "fornecedor" });
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
      const result = byIdInputSchema.safeParse({ id: "po-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = byIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("createFromQuote input", () => {
    it("should accept valid input", () => {
      const result = createFromQuoteInputSchema.safeParse({
        quoteId: "quote-123",
      });
      expect(result.success).toBe(true);
    });

    it("should accept with optional fields", () => {
      const result = createFromQuoteInputSchema.safeParse({
        quoteId: "quote-123",
        expectedDeliveryDate: new Date("2026-02-15"),
        notes: "Pedido urgente",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing quoteId", () => {
      const result = createFromQuoteInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("createManual input", () => {
    it("should accept valid input", () => {
      const result = createManualInputSchema.safeParse({
        supplierId: "sup-123",
        orderDate: new Date(),
        items: [
          { materialId: "mat-001", quantity: 100, unitPrice: 15.50 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults to items", () => {
      const result = createManualInputSchema.safeParse({
        supplierId: "sup-123",
        orderDate: new Date(),
        items: [{ materialId: "mat-001", quantity: 100, unitPrice: 15.50 }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items[0].unit).toBe("UN");
      }
    });

    it("should accept full input", () => {
      const result = createManualInputSchema.safeParse({
        supplierId: "sup-123",
        orderDate: new Date(),
        expectedDeliveryDate: new Date("2026-02-15"),
        notes: "Pedido manual",
        items: [
          { materialId: "mat-001", quantity: 100, unitPrice: 15.50, unit: "KG", notes: "Entrega parcial OK" },
          { materialId: "mat-002", quantity: 50, unitPrice: 25.00, unit: "UN" },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing supplierId", () => {
      const result = createManualInputSchema.safeParse({
        orderDate: new Date(),
        items: [{ materialId: "mat-001", quantity: 100, unitPrice: 15.50 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing orderDate", () => {
      const result = createManualInputSchema.safeParse({
        supplierId: "sup-123",
        items: [{ materialId: "mat-001", quantity: 100, unitPrice: 15.50 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty items array", () => {
      const result = createManualInputSchema.safeParse({
        supplierId: "sup-123",
        orderDate: new Date(),
        items: [],
      });
      expect(result.success).toBe(false);
    });

    it("should reject item with zero quantity", () => {
      const result = createManualInputSchema.safeParse({
        supplierId: "sup-123",
        orderDate: new Date(),
        items: [{ materialId: "mat-001", quantity: 0, unitPrice: 15.50 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject item with negative unitPrice", () => {
      const result = createManualInputSchema.safeParse({
        supplierId: "sup-123",
        orderDate: new Date(),
        items: [{ materialId: "mat-001", quantity: 100, unitPrice: -10 }],
      });
      expect(result.success).toBe(false);
    });

    it("should accept item with zero unitPrice", () => {
      const result = createManualInputSchema.safeParse({
        supplierId: "sup-123",
        orderDate: new Date(),
        items: [{ materialId: "mat-001", quantity: 100, unitPrice: 0 }],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("update input", () => {
    it("should accept id only", () => {
      const result = updateInputSchema.safeParse({ id: "po-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateInputSchema.safeParse({
        id: "po-123",
        notes: "Atualização de notas",
        status: "SENT",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateInputSchema.safeParse({
        notes: "Sem ID",
      });
      expect(result.success).toBe(false);
    });

    it("should accept all status values", () => {
      const statuses = ["DRAFT", "PENDING", "APPROVED", "SENT", "PARTIAL", "COMPLETED", "CANCELLED"];
      for (const status of statuses) {
        const result = updateInputSchema.safeParse({ id: "po-123", status });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("addItem input", () => {
    it("should accept valid item", () => {
      const result = addItemInputSchema.safeParse({
        purchaseOrderId: "po-123",
        materialId: "mat-001",
        quantity: 50,
        unitPrice: 20.00,
      });
      expect(result.success).toBe(true);
    });

    it("should apply default unit", () => {
      const result = addItemInputSchema.safeParse({
        purchaseOrderId: "po-123",
        materialId: "mat-001",
        quantity: 50,
        unitPrice: 20.00,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unit).toBe("UN");
      }
    });

    it("should reject zero quantity", () => {
      const result = addItemInputSchema.safeParse({
        purchaseOrderId: "po-123",
        materialId: "mat-001",
        quantity: 0,
        unitPrice: 20.00,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative unitPrice", () => {
      const result = addItemInputSchema.safeParse({
        purchaseOrderId: "po-123",
        materialId: "mat-001",
        quantity: 50,
        unitPrice: -10,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateItem input", () => {
    it("should accept id only", () => {
      const result = updateItemInputSchema.safeParse({ id: "item-123" });
      expect(result.success).toBe(true);
    });

    it("should accept quantity update", () => {
      const result = updateItemInputSchema.safeParse({
        id: "item-123",
        quantity: 200,
      });
      expect(result.success).toBe(true);
    });

    it("should accept unitPrice update", () => {
      const result = updateItemInputSchema.safeParse({
        id: "item-123",
        unitPrice: 25.00,
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero quantity", () => {
      const result = updateItemInputSchema.safeParse({
        id: "item-123",
        quantity: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative unitPrice", () => {
      const result = updateItemInputSchema.safeParse({
        id: "item-123",
        unitPrice: -10,
      });
      expect(result.success).toBe(false);
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

  describe("submitForApproval input", () => {
    it("should accept valid submission", () => {
      const result = submitForApprovalInputSchema.safeParse({ id: "po-123" });
      expect(result.success).toBe(true);
    });

    it("should accept submission with notes", () => {
      const result = submitForApprovalInputSchema.safeParse({
        id: "po-123",
        notes: "Solicito aprovação urgente",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = submitForApprovalInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("approve input", () => {
    it("should accept valid approval", () => {
      const result = approveInputSchema.safeParse({ id: "po-123" });
      expect(result.success).toBe(true);
    });

    it("should accept approval with notes", () => {
      const result = approveInputSchema.safeParse({
        id: "po-123",
        notes: "Aprovado conforme orçamento",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = approveInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("reject input", () => {
    it("should accept valid rejection", () => {
      const result = rejectInputSchema.safeParse({
        id: "po-123",
        reason: "Valor acima do orçamento",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing reason", () => {
      const result = rejectInputSchema.safeParse({
        id: "po-123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty reason", () => {
      const result = rejectInputSchema.safeParse({
        id: "po-123",
        reason: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("send input", () => {
    it("should accept valid send", () => {
      const result = sendInputSchema.safeParse({ id: "po-123" });
      expect(result.success).toBe(true);
    });

    it("should accept send with date and notes", () => {
      const result = sendInputSchema.safeParse({
        id: "po-123",
        sentDate: new Date(),
        notes: "Enviado por email",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = sendInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("cancel input", () => {
    it("should accept valid cancellation", () => {
      const result = cancelInputSchema.safeParse({
        id: "po-123",
        reason: "Fornecedor não atende mais",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing reason", () => {
      const result = cancelInputSchema.safeParse({
        id: "po-123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty reason", () => {
      const result = cancelInputSchema.safeParse({
        id: "po-123",
        reason: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("delete input", () => {
    it("should accept valid id", () => {
      const result = deleteInputSchema.safeParse({ id: "po-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = deleteInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
