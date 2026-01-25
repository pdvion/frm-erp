import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const listInputSchema = z.object({
  supplierId: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING", "SENT", "RECEIVED", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  search: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
}).optional();

const byIdInputSchema = z.object({ id: z.string() });

const quoteItemSchema = z.object({
  materialId: z.string(),
  quantity: z.number().positive(),
  unit: z.string().default("UN"),
  notes: z.string().optional(),
});

const createInputSchema = z.object({
  supplierId: z.string(),
  requestDate: z.date(),
  validUntil: z.date().optional(),
  notes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1),
});

const updateInputSchema = z.object({
  id: z.string(),
  validUntil: z.date().optional(),
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING", "SENT", "RECEIVED", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
});

const addItemInputSchema = z.object({
  quoteId: z.string(),
  materialId: z.string(),
  quantity: z.number().positive(),
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

const sendInputSchema = z.object({ id: z.string() });

const receiveInputSchema = z.object({
  id: z.string(),
  items: z.array(z.object({
    itemId: z.string(),
    unitPrice: z.number().min(0),
    deliveryDays: z.number().min(0).optional(),
    notes: z.string().optional(),
  })),
});

const approveInputSchema = z.object({
  id: z.string(),
  notes: z.string().optional(),
});

const rejectInputSchema = z.object({
  id: z.string(),
  reason: z.string().min(1),
});

const deleteInputSchema = z.object({ id: z.string() });

describe("Quotes Router Schemas", () => {
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

    it("should accept status SENT", () => {
      const result = listInputSchema.safeParse({ status: "SENT" });
      expect(result.success).toBe(true);
    });

    it("should accept status RECEIVED", () => {
      const result = listInputSchema.safeParse({ status: "RECEIVED" });
      expect(result.success).toBe(true);
    });

    it("should accept status APPROVED", () => {
      const result = listInputSchema.safeParse({ status: "APPROVED" });
      expect(result.success).toBe(true);
    });

    it("should accept status REJECTED", () => {
      const result = listInputSchema.safeParse({ status: "REJECTED" });
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
      const result = byIdInputSchema.safeParse({ id: "quote-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = byIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("create input", () => {
    it("should accept valid input with items", () => {
      const result = createInputSchema.safeParse({
        supplierId: "sup-123",
        requestDate: new Date(),
        items: [
          { materialId: "mat-001", quantity: 100 },
          { materialId: "mat-002", quantity: 50 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults to items", () => {
      const result = createInputSchema.safeParse({
        supplierId: "sup-123",
        requestDate: new Date(),
        items: [{ materialId: "mat-001", quantity: 100 }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items[0].unit).toBe("UN");
      }
    });

    it("should accept optional fields", () => {
      const result = createInputSchema.safeParse({
        supplierId: "sup-123",
        requestDate: new Date(),
        validUntil: new Date("2026-02-15"),
        notes: "Cotação urgente",
        items: [{ materialId: "mat-001", quantity: 100, unit: "KG", notes: "Entrega rápida" }],
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing supplierId", () => {
      const result = createInputSchema.safeParse({
        requestDate: new Date(),
        items: [{ materialId: "mat-001", quantity: 100 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing requestDate", () => {
      const result = createInputSchema.safeParse({
        supplierId: "sup-123",
        items: [{ materialId: "mat-001", quantity: 100 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty items array", () => {
      const result = createInputSchema.safeParse({
        supplierId: "sup-123",
        requestDate: new Date(),
        items: [],
      });
      expect(result.success).toBe(false);
    });

    it("should reject item with zero quantity", () => {
      const result = createInputSchema.safeParse({
        supplierId: "sup-123",
        requestDate: new Date(),
        items: [{ materialId: "mat-001", quantity: 0 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject item with negative quantity", () => {
      const result = createInputSchema.safeParse({
        supplierId: "sup-123",
        requestDate: new Date(),
        items: [{ materialId: "mat-001", quantity: -10 }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("update input", () => {
    it("should accept id only", () => {
      const result = updateInputSchema.safeParse({ id: "quote-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateInputSchema.safeParse({
        id: "quote-123",
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
      const statuses = ["DRAFT", "PENDING", "SENT", "RECEIVED", "APPROVED", "REJECTED", "CANCELLED"];
      for (const status of statuses) {
        const result = updateInputSchema.safeParse({ id: "quote-123", status });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("addItem input", () => {
    it("should accept valid item", () => {
      const result = addItemInputSchema.safeParse({
        quoteId: "quote-123",
        materialId: "mat-001",
        quantity: 50,
      });
      expect(result.success).toBe(true);
    });

    it("should apply default unit", () => {
      const result = addItemInputSchema.safeParse({
        quoteId: "quote-123",
        materialId: "mat-001",
        quantity: 50,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unit).toBe("UN");
      }
    });

    it("should reject zero quantity", () => {
      const result = addItemInputSchema.safeParse({
        quoteId: "quote-123",
        materialId: "mat-001",
        quantity: 0,
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
        unitPrice: 15.50,
      });
      expect(result.success).toBe(true);
    });

    it("should accept zero unitPrice", () => {
      const result = updateItemInputSchema.safeParse({
        id: "item-123",
        unitPrice: 0,
      });
      expect(result.success).toBe(true);
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

  describe("send input", () => {
    it("should accept valid id", () => {
      const result = sendInputSchema.safeParse({ id: "quote-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = sendInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("receive input", () => {
    it("should accept valid receive data", () => {
      const result = receiveInputSchema.safeParse({
        id: "quote-123",
        items: [
          { itemId: "item-001", unitPrice: 15.50 },
          { itemId: "item-002", unitPrice: 25.00, deliveryDays: 10 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should accept zero unitPrice", () => {
      const result = receiveInputSchema.safeParse({
        id: "quote-123",
        items: [{ itemId: "item-001", unitPrice: 0 }],
      });
      expect(result.success).toBe(true);
    });

    it("should reject negative unitPrice", () => {
      const result = receiveInputSchema.safeParse({
        id: "quote-123",
        items: [{ itemId: "item-001", unitPrice: -10 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative deliveryDays", () => {
      const result = receiveInputSchema.safeParse({
        id: "quote-123",
        items: [{ itemId: "item-001", unitPrice: 10, deliveryDays: -5 }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("approve input", () => {
    it("should accept valid approval", () => {
      const result = approveInputSchema.safeParse({ id: "quote-123" });
      expect(result.success).toBe(true);
    });

    it("should accept approval with notes", () => {
      const result = approveInputSchema.safeParse({
        id: "quote-123",
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
        id: "quote-123",
        reason: "Preço acima do mercado",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing reason", () => {
      const result = rejectInputSchema.safeParse({
        id: "quote-123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty reason", () => {
      const result = rejectInputSchema.safeParse({
        id: "quote-123",
        reason: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("delete input", () => {
    it("should accept valid id", () => {
      const result = deleteInputSchema.safeParse({ id: "quote-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = deleteInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
