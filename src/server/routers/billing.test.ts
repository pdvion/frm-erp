import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const listInputSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["DRAFT", "AUTHORIZED", "CANCELLED", "DENIED", "ALL"]).optional(),
  customerId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
}).optional();

const byIdInputSchema = z.object({ id: z.string() });

const createFromOrderInputSchema = z.object({
  salesOrderId: z.string(),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().positive(),
  })).optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

const createManualInputSchema = z.object({
  customerId: z.string(),
  issueDate: z.date().default(() => new Date()),
  operationType: z.enum(["SALE", "RETURN", "TRANSFER", "COMPLEMENT", "ADJUSTMENT"]).default("SALE"),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    materialId: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).max(100).default(0),
    cfop: z.string().optional(),
    ncm: z.string().optional(),
  })).min(1),
});

const updateInputSchema = z.object({
  id: z.string(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

const addItemInputSchema = z.object({
  invoiceId: z.string(),
  materialId: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).max(100).default(0),
  cfop: z.string().optional(),
  ncm: z.string().optional(),
});

const updateItemInputSchema = z.object({
  id: z.string(),
  quantity: z.number().positive().optional(),
  unitPrice: z.number().min(0).optional(),
  discount: z.number().min(0).max(100).optional(),
  cfop: z.string().optional(),
  ncm: z.string().optional(),
});

const removeItemInputSchema = z.object({ id: z.string() });

const authorizeInputSchema = z.object({
  id: z.string(),
  notes: z.string().optional(),
});

const cancelInputSchema = z.object({
  id: z.string(),
  reason: z.string().min(1),
});

const sendCorrectionLetterInputSchema = z.object({
  id: z.string(),
  correction: z.string().min(15).max(1000),
});

const deleteInputSchema = z.object({ id: z.string() });

const getDashboardInputSchema = z.object({
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
}).optional();

describe("Billing Router Schemas", () => {
  describe("list input", () => {
    it("should accept empty input", () => {
      const result = listInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.page).toBe(1);
        expect(result.data?.limit).toBe(20);
      }
    });

    it("should accept all status values", () => {
      const statuses = ["DRAFT", "AUTHORIZED", "CANCELLED", "DENIED", "ALL"];
      for (const status of statuses) {
        const result = listInputSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid status", () => {
      const result = listInputSchema.safeParse({ status: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("should accept date range", () => {
      const result = listInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should accept search and customerId", () => {
      const result = listInputSchema.safeParse({
        search: "cliente",
        customerId: "cust-123",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("byId input", () => {
    it("should accept valid id", () => {
      const result = byIdInputSchema.safeParse({ id: "inv-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = byIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("createFromOrder input", () => {
    it("should accept valid input", () => {
      const result = createFromOrderInputSchema.safeParse({
        salesOrderId: "order-123",
      });
      expect(result.success).toBe(true);
    });

    it("should accept with items", () => {
      const result = createFromOrderInputSchema.safeParse({
        salesOrderId: "order-123",
        items: [
          { itemId: "item-001", quantity: 10 },
          { itemId: "item-002", quantity: 5 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should accept full input", () => {
      const result = createFromOrderInputSchema.safeParse({
        salesOrderId: "order-123",
        items: [{ itemId: "item-001", quantity: 10 }],
        paymentTerms: "30 dias",
        notes: "Faturamento parcial",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing salesOrderId", () => {
      const result = createFromOrderInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject zero quantity in items", () => {
      const result = createFromOrderInputSchema.safeParse({
        salesOrderId: "order-123",
        items: [{ itemId: "item-001", quantity: 0 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative quantity in items", () => {
      const result = createFromOrderInputSchema.safeParse({
        salesOrderId: "order-123",
        items: [{ itemId: "item-001", quantity: -5 }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createManual input", () => {
    it("should accept valid input", () => {
      const result = createManualInputSchema.safeParse({
        customerId: "cust-123",
        items: [
          { materialId: "mat-001", quantity: 10, unitPrice: 100 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = createManualInputSchema.safeParse({
        customerId: "cust-123",
        items: [{ materialId: "mat-001", quantity: 10, unitPrice: 100 }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.operationType).toBe("SALE");
        expect(result.data.items[0].discount).toBe(0);
      }
    });

    it("should accept all operationType values", () => {
      const types = ["SALE", "RETURN", "TRANSFER", "COMPLEMENT", "ADJUSTMENT"];
      for (const operationType of types) {
        const result = createManualInputSchema.safeParse({
          customerId: "cust-123",
          operationType,
          items: [{ materialId: "mat-001", quantity: 10, unitPrice: 100 }],
        });
        expect(result.success).toBe(true);
      }
    });

    it("should accept full input", () => {
      const result = createManualInputSchema.safeParse({
        customerId: "cust-123",
        issueDate: new Date(),
        operationType: "SALE",
        paymentTerms: "30/60/90",
        notes: "Venda direta",
        items: [
          { materialId: "mat-001", quantity: 10, unitPrice: 100, discount: 5, cfop: "5102", ncm: "84719012" },
          { materialId: "mat-002", quantity: 5, unitPrice: 200, discount: 10 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty items array", () => {
      const result = createManualInputSchema.safeParse({
        customerId: "cust-123",
        items: [],
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing customerId", () => {
      const result = createManualInputSchema.safeParse({
        items: [{ materialId: "mat-001", quantity: 10, unitPrice: 100 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative unitPrice", () => {
      const result = createManualInputSchema.safeParse({
        customerId: "cust-123",
        items: [{ materialId: "mat-001", quantity: 10, unitPrice: -100 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject discount greater than 100", () => {
      const result = createManualInputSchema.safeParse({
        customerId: "cust-123",
        items: [{ materialId: "mat-001", quantity: 10, unitPrice: 100, discount: 101 }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("update input", () => {
    it("should accept id only", () => {
      const result = updateInputSchema.safeParse({ id: "inv-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateInputSchema.safeParse({
        id: "inv-123",
        paymentTerms: "45 dias",
        notes: "Atualizado",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateInputSchema.safeParse({
        paymentTerms: "30 dias",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("addItem input", () => {
    it("should accept valid input", () => {
      const result = addItemInputSchema.safeParse({
        invoiceId: "inv-123",
        materialId: "mat-001",
        quantity: 10,
        unitPrice: 100,
      });
      expect(result.success).toBe(true);
    });

    it("should apply default discount", () => {
      const result = addItemInputSchema.safeParse({
        invoiceId: "inv-123",
        materialId: "mat-001",
        quantity: 10,
        unitPrice: 100,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.discount).toBe(0);
      }
    });

    it("should accept with fiscal data", () => {
      const result = addItemInputSchema.safeParse({
        invoiceId: "inv-123",
        materialId: "mat-001",
        quantity: 10,
        unitPrice: 100,
        discount: 5,
        cfop: "5102",
        ncm: "84719012",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing invoiceId", () => {
      const result = addItemInputSchema.safeParse({
        materialId: "mat-001",
        quantity: 10,
        unitPrice: 100,
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero quantity", () => {
      const result = addItemInputSchema.safeParse({
        invoiceId: "inv-123",
        materialId: "mat-001",
        quantity: 0,
        unitPrice: 100,
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
        quantity: 20,
        discount: 15,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateItemInputSchema.safeParse({
        quantity: 20,
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

  describe("authorize input", () => {
    it("should accept valid input", () => {
      const result = authorizeInputSchema.safeParse({ id: "inv-123" });
      expect(result.success).toBe(true);
    });

    it("should accept with notes", () => {
      const result = authorizeInputSchema.safeParse({
        id: "inv-123",
        notes: "Autorização manual",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = authorizeInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("cancel input", () => {
    it("should accept valid input", () => {
      const result = cancelInputSchema.safeParse({
        id: "inv-123",
        reason: "Erro de digitação",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing reason", () => {
      const result = cancelInputSchema.safeParse({
        id: "inv-123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty reason", () => {
      const result = cancelInputSchema.safeParse({
        id: "inv-123",
        reason: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("sendCorrectionLetter input", () => {
    it("should accept valid input", () => {
      const result = sendCorrectionLetterInputSchema.safeParse({
        id: "inv-123",
        correction: "Correção do endereço de entrega conforme solicitado pelo cliente",
      });
      expect(result.success).toBe(true);
    });

    it("should reject correction too short", () => {
      const result = sendCorrectionLetterInputSchema.safeParse({
        id: "inv-123",
        correction: "Curto",
      });
      expect(result.success).toBe(false);
    });

    it("should reject correction too long", () => {
      const result = sendCorrectionLetterInputSchema.safeParse({
        id: "inv-123",
        correction: "A".repeat(1001),
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing correction", () => {
      const result = sendCorrectionLetterInputSchema.safeParse({
        id: "inv-123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("delete input", () => {
    it("should accept valid id", () => {
      const result = deleteInputSchema.safeParse({ id: "inv-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = deleteInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("getDashboard input", () => {
    it("should accept empty input", () => {
      const result = getDashboardInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept date range", () => {
      const result = getDashboardInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });
  });
});
