import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const listInputSchema = z.object({
  status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED", "ALL"]).optional(),
  supplierId: z.string().optional(),
  dueDateFrom: z.date().optional(),
  dueDateTo: z.date().optional(),
  search: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
  orderBy: z.enum(["dueDate", "netValue", "code", "createdAt"]).default("dueDate"),
  orderDir: z.enum(["asc", "desc"]).default("asc"),
}).optional();

const byIdInputSchema = z.object({ id: z.string() });

const createInputSchema = z.object({
  code: z.number(),
  supplierId: z.string(),
  description: z.string().min(1),
  documentNumber: z.string().optional(),
  documentType: z.enum(["INVOICE", "BOLETO", "RECEIPT", "CONTRACT", "OTHER"]).default("INVOICE"),
  issueDate: z.date(),
  dueDate: z.date(),
  grossValue: z.number().positive(),
  discountValue: z.number().default(0),
  interestValue: z.number().default(0),
  fineValue: z.number().default(0),
  netValue: z.number().positive(),
  categoryId: z.string().optional(),
  costCenterId: z.string().optional(),
  bankAccountId: z.string().optional(),
  notes: z.string().optional(),
  barcode: z.string().optional(),
  pixKey: z.string().optional(),
});

const updateInputSchema = z.object({
  id: z.string(),
  description: z.string().optional(),
  documentNumber: z.string().optional(),
  dueDate: z.date().optional(),
  grossValue: z.number().positive().optional(),
  discountValue: z.number().optional(),
  interestValue: z.number().optional(),
  fineValue: z.number().optional(),
  netValue: z.number().positive().optional(),
  categoryId: z.string().optional(),
  costCenterId: z.string().optional(),
  bankAccountId: z.string().optional(),
  notes: z.string().optional(),
  barcode: z.string().optional(),
  pixKey: z.string().optional(),
});

const payInputSchema = z.object({
  id: z.string(),
  paymentDate: z.date(),
  paidValue: z.number().positive(),
  bankAccountId: z.string().optional(),
  paymentMethod: z.enum(["TRANSFER", "BOLETO", "PIX", "CHECK", "CASH", "OTHER"]).default("TRANSFER"),
  notes: z.string().optional(),
});

const cancelInputSchema = z.object({
  id: z.string(),
  reason: z.string().min(1),
});

const deleteInputSchema = z.object({ id: z.string() });

describe("Payables Router Schemas", () => {
  describe("list input", () => {
    it("should accept empty input", () => {
      const result = listInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept status PENDING", () => {
      const result = listInputSchema.safeParse({ status: "PENDING" });
      expect(result.success).toBe(true);
    });

    it("should accept status PARTIAL", () => {
      const result = listInputSchema.safeParse({ status: "PARTIAL" });
      expect(result.success).toBe(true);
    });

    it("should accept status PAID", () => {
      const result = listInputSchema.safeParse({ status: "PAID" });
      expect(result.success).toBe(true);
    });

    it("should accept status OVERDUE", () => {
      const result = listInputSchema.safeParse({ status: "OVERDUE" });
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
        dueDateFrom: new Date("2026-01-01"),
        dueDateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should accept search string", () => {
      const result = listInputSchema.safeParse({ search: "fatura" });
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

    it("should accept orderBy dueDate", () => {
      const result = listInputSchema.safeParse({ orderBy: "dueDate" });
      expect(result.success).toBe(true);
    });

    it("should accept orderBy netValue", () => {
      const result = listInputSchema.safeParse({ orderBy: "netValue" });
      expect(result.success).toBe(true);
    });

    it("should accept orderDir asc", () => {
      const result = listInputSchema.safeParse({ orderDir: "asc" });
      expect(result.success).toBe(true);
    });

    it("should accept orderDir desc", () => {
      const result = listInputSchema.safeParse({ orderDir: "desc" });
      expect(result.success).toBe(true);
    });

    it("should reject invalid orderBy", () => {
      const result = listInputSchema.safeParse({ orderBy: "invalid" });
      expect(result.success).toBe(false);
    });
  });

  describe("byId input", () => {
    it("should accept valid id", () => {
      const result = byIdInputSchema.safeParse({ id: "pay-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = byIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("create input", () => {
    it("should accept minimal valid input", () => {
      const result = createInputSchema.safeParse({
        code: 1001,
        supplierId: "sup-123",
        description: "Fatura de compra",
        issueDate: new Date("2026-01-01"),
        dueDate: new Date("2026-01-31"),
        grossValue: 1000,
        netValue: 1000,
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = createInputSchema.safeParse({
        code: 1002,
        supplierId: "sup-456",
        description: "Boleto",
        issueDate: new Date(),
        dueDate: new Date(),
        grossValue: 500,
        netValue: 500,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.documentType).toBe("INVOICE");
        expect(result.data.discountValue).toBe(0);
        expect(result.data.interestValue).toBe(0);
        expect(result.data.fineValue).toBe(0);
      }
    });

    it("should accept all document types", () => {
      const types = ["INVOICE", "BOLETO", "RECEIPT", "CONTRACT", "OTHER"];
      for (const type of types) {
        const result = createInputSchema.safeParse({
          code: 1003,
          supplierId: "sup-789",
          description: `Documento ${type}`,
          documentType: type,
          issueDate: new Date(),
          dueDate: new Date(),
          grossValue: 100,
          netValue: 100,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject missing supplierId", () => {
      const result = createInputSchema.safeParse({
        code: 1004,
        description: "Sem fornecedor",
        issueDate: new Date(),
        dueDate: new Date(),
        grossValue: 100,
        netValue: 100,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing description", () => {
      const result = createInputSchema.safeParse({
        code: 1005,
        supplierId: "sup-123",
        issueDate: new Date(),
        dueDate: new Date(),
        grossValue: 100,
        netValue: 100,
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty description", () => {
      const result = createInputSchema.safeParse({
        code: 1006,
        supplierId: "sup-123",
        description: "",
        issueDate: new Date(),
        dueDate: new Date(),
        grossValue: 100,
        netValue: 100,
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero grossValue", () => {
      const result = createInputSchema.safeParse({
        code: 1007,
        supplierId: "sup-123",
        description: "Valor zero",
        issueDate: new Date(),
        dueDate: new Date(),
        grossValue: 0,
        netValue: 100,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative netValue", () => {
      const result = createInputSchema.safeParse({
        code: 1008,
        supplierId: "sup-123",
        description: "Valor negativo",
        issueDate: new Date(),
        dueDate: new Date(),
        grossValue: 100,
        netValue: -50,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("update input", () => {
    it("should accept id only", () => {
      const result = updateInputSchema.safeParse({ id: "pay-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateInputSchema.safeParse({
        id: "pay-123",
        description: "Nova descrição",
        dueDate: new Date("2026-02-15"),
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateInputSchema.safeParse({
        description: "Sem ID",
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero grossValue on update", () => {
      const result = updateInputSchema.safeParse({
        id: "pay-123",
        grossValue: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("pay input", () => {
    it("should accept valid payment", () => {
      const result = payInputSchema.safeParse({
        id: "pay-123",
        paymentDate: new Date(),
        paidValue: 1000,
      });
      expect(result.success).toBe(true);
    });

    it("should apply default payment method", () => {
      const result = payInputSchema.safeParse({
        id: "pay-123",
        paymentDate: new Date(),
        paidValue: 500,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.paymentMethod).toBe("TRANSFER");
      }
    });

    it("should accept all payment methods", () => {
      const methods = ["TRANSFER", "BOLETO", "PIX", "CHECK", "CASH", "OTHER"];
      for (const method of methods) {
        const result = payInputSchema.safeParse({
          id: "pay-123",
          paymentDate: new Date(),
          paidValue: 100,
          paymentMethod: method,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject missing paymentDate", () => {
      const result = payInputSchema.safeParse({
        id: "pay-123",
        paidValue: 100,
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero paidValue", () => {
      const result = payInputSchema.safeParse({
        id: "pay-123",
        paymentDate: new Date(),
        paidValue: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative paidValue", () => {
      const result = payInputSchema.safeParse({
        id: "pay-123",
        paymentDate: new Date(),
        paidValue: -100,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("cancel input", () => {
    it("should accept valid cancellation", () => {
      const result = cancelInputSchema.safeParse({
        id: "pay-123",
        reason: "Pagamento duplicado",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing reason", () => {
      const result = cancelInputSchema.safeParse({
        id: "pay-123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty reason", () => {
      const result = cancelInputSchema.safeParse({
        id: "pay-123",
        reason: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("delete input", () => {
    it("should accept valid id", () => {
      const result = deleteInputSchema.safeParse({ id: "pay-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = deleteInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
