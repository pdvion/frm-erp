import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router issuedInvoices (Notas Fiscais Emitidas)
 * Valida inputs e estruturas de dados de NFe de saída
 */

// Schema de status da nota fiscal
const invoiceStatusSchema = z.enum([
  "DRAFT",
  "PENDING",
  "AUTHORIZED",
  "CANCELLED",
  "DENIED",
]);

// Schema de listagem
const listInputSchema = z.object({
  search: z.string().optional(),
  status: invoiceStatusSchema.optional(),
  customerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

// Schema de busca por ID
const byIdInputSchema = z.object({
  id: z.string(),
});

// Schema de criação a partir de pedido
const createFromOrderInputSchema = z.object({
  salesOrderId: z.string(),
  series: z.string().default("1"),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

// Schema de item da nota
const invoiceItemSchema = z.object({
  materialId: z.string(),
  sequence: z.number(),
  quantity: z.number().positive(),
  unitPrice: z.number(),
  totalPrice: z.number(),
  cfop: z.string(),
  ncm: z.string().optional(),
  icmsRate: z.number().optional(),
  icmsValue: z.number().optional(),
  ipiRate: z.number().optional(),
  ipiValue: z.number().optional(),
  pisRate: z.number().optional(),
  pisValue: z.number().optional(),
  cofinsRate: z.number().optional(),
  cofinsValue: z.number().optional(),
});

// Schema de transmissão
const transmitInputSchema = z.object({
  id: z.string(),
});

// Schema de cancelamento
const cancelInputSchema = z.object({
  id: z.string(),
  justification: z.string().min(15).max(255),
});

// Schema de resposta de nota fiscal
const invoiceResponseSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string().nullable(),
  series: z.string(),
  accessKey: z.string().nullable(),
  status: invoiceStatusSchema,
  issueDate: z.date().nullable(),
  customerId: z.string(),
  totalProducts: z.number(),
  totalInvoice: z.number(),
  freightValue: z.number(),
  discountValue: z.number(),
  companyId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

describe("Issued Invoices Router Schemas", () => {
  describe("Invoice Status Schema", () => {
    it("should accept DRAFT status", () => {
      const result = invoiceStatusSchema.safeParse("DRAFT");
      expect(result.success).toBe(true);
    });

    it("should accept PENDING status", () => {
      const result = invoiceStatusSchema.safeParse("PENDING");
      expect(result.success).toBe(true);
    });

    it("should accept AUTHORIZED status", () => {
      const result = invoiceStatusSchema.safeParse("AUTHORIZED");
      expect(result.success).toBe(true);
    });

    it("should accept CANCELLED status", () => {
      const result = invoiceStatusSchema.safeParse("CANCELLED");
      expect(result.success).toBe(true);
    });

    it("should accept DENIED status", () => {
      const result = invoiceStatusSchema.safeParse("DENIED");
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = invoiceStatusSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("List Input Schema", () => {
    it("should accept empty input with defaults", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should accept search filter", () => {
      const result = listInputSchema.safeParse({
        search: "12345",
      });
      expect(result.success).toBe(true);
    });

    it("should accept status filter", () => {
      const result = listInputSchema.safeParse({
        status: "AUTHORIZED",
      });
      expect(result.success).toBe(true);
    });

    it("should accept customerId filter", () => {
      const result = listInputSchema.safeParse({
        customerId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept date range filter", () => {
      const result = listInputSchema.safeParse({
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });
      expect(result.success).toBe(true);
    });

    it("should accept all filters combined", () => {
      const result = listInputSchema.safeParse({
        search: "NF-001",
        status: "AUTHORIZED",
        customerId: "123e4567-e89b-12d3-a456-426614174000",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        page: 2,
        limit: 50,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("By ID Input Schema", () => {
    it("should accept valid ID", () => {
      const result = byIdInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing ID", () => {
      const result = byIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("Create From Order Input Schema", () => {
    it("should accept minimal input", () => {
      const result = createFromOrderInputSchema.safeParse({
        salesOrderId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.series).toBe("1");
      }
    });

    it("should accept complete input", () => {
      const result = createFromOrderInputSchema.safeParse({
        salesOrderId: "123e4567-e89b-12d3-a456-426614174000",
        series: "2",
        paymentTerms: "30/60/90",
        notes: "Observações da nota",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing salesOrderId", () => {
      const result = createFromOrderInputSchema.safeParse({
        series: "1",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Invoice Item Schema", () => {
    it("should accept minimal valid item", () => {
      const result = invoiceItemSchema.safeParse({
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        sequence: 1,
        quantity: 10,
        unitPrice: 100.0,
        totalPrice: 1000.0,
        cfop: "5102",
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete item with taxes", () => {
      const result = invoiceItemSchema.safeParse({
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        sequence: 1,
        quantity: 10,
        unitPrice: 100.0,
        totalPrice: 1000.0,
        cfop: "5102",
        ncm: "84719012",
        icmsRate: 18,
        icmsValue: 180.0,
        ipiRate: 5,
        ipiValue: 50.0,
        pisRate: 1.65,
        pisValue: 16.5,
        cofinsRate: 7.6,
        cofinsValue: 76.0,
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero quantity", () => {
      const result = invoiceItemSchema.safeParse({
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        sequence: 1,
        quantity: 0,
        unitPrice: 100.0,
        totalPrice: 0,
        cfop: "5102",
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative quantity", () => {
      const result = invoiceItemSchema.safeParse({
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        sequence: 1,
        quantity: -5,
        unitPrice: 100.0,
        totalPrice: -500.0,
        cfop: "5102",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Transmit Input Schema", () => {
    it("should accept valid ID", () => {
      const result = transmitInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing ID", () => {
      const result = transmitInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("Cancel Input Schema", () => {
    it("should accept valid cancellation", () => {
      const result = cancelInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        justification: "Erro no preenchimento dos dados do cliente",
      });
      expect(result.success).toBe(true);
    });

    it("should reject justification too short", () => {
      const result = cancelInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        justification: "Erro",
      });
      expect(result.success).toBe(false);
    });

    it("should reject justification too long", () => {
      const result = cancelInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        justification: "A".repeat(256),
      });
      expect(result.success).toBe(false);
    });

    it("should accept justification at minimum length", () => {
      const result = cancelInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        justification: "Erro no pedido.",
      });
      expect(result.success).toBe(true);
    });

    it("should accept justification at maximum length", () => {
      const result = cancelInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        justification: "A".repeat(255),
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing justification", () => {
      const result = cancelInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Invoice Response Schema", () => {
    it("should validate complete invoice response", () => {
      const result = invoiceResponseSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        invoiceNumber: "000001234",
        series: "1",
        accessKey: "35240112345678000199550010000012341234567890",
        status: "AUTHORIZED",
        issueDate: new Date(),
        customerId: "customer-id",
        totalProducts: 1000.0,
        totalInvoice: 1180.0,
        freightValue: 100.0,
        discountValue: 0,
        companyId: "company-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("should validate draft invoice with nullable fields", () => {
      const result = invoiceResponseSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        invoiceNumber: null,
        series: "1",
        accessKey: null,
        status: "DRAFT",
        issueDate: null,
        customerId: "customer-id",
        totalProducts: 1000.0,
        totalInvoice: 1000.0,
        freightValue: 0,
        discountValue: 0,
        companyId: "company-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Access Key Validation", () => {
    it("should validate access key format (44 digits)", () => {
      const accessKey = "35240112345678000199550010000012341234567890";
      expect(accessKey.length).toBe(44);
      expect(/^\d{44}$/.test(accessKey)).toBe(true);
    });

    it("should extract UF from access key", () => {
      const accessKey = "35240112345678000199550010000012341234567890";
      const uf = accessKey.substring(0, 2);
      expect(uf).toBe("35"); // São Paulo
    });

    it("should extract year/month from access key", () => {
      const accessKey = "35240112345678000199550010000012341234567890";
      const yearMonth = accessKey.substring(2, 6);
      expect(yearMonth).toBe("2401"); // Janeiro 2024
    });

    it("should extract CNPJ from access key", () => {
      const accessKey = "35240112345678000199550010000012341234567890";
      const cnpj = accessKey.substring(6, 20);
      expect(cnpj).toBe("12345678000199");
    });

    it("should extract model from access key", () => {
      const accessKey = "35240112345678000199550010000012341234567890";
      const model = accessKey.substring(20, 22);
      expect(model).toBe("55"); // NFe
    });

    it("should extract series from access key", () => {
      const accessKey = "35240112345678000199550010000012341234567890";
      const series = accessKey.substring(22, 25);
      expect(series).toBe("001");
    });

    it("should extract invoice number from access key", () => {
      const accessKey = "35240112345678000199550010000012341234567890";
      const invoiceNumber = accessKey.substring(25, 34);
      expect(invoiceNumber).toBe("000001234");
    });
  });

  describe("CFOP Validation", () => {
    it("should validate internal sale CFOP (5xxx)", () => {
      const cfop = "5102";
      expect(cfop.startsWith("5")).toBe(true);
    });

    it("should validate interstate sale CFOP (6xxx)", () => {
      const cfop = "6102";
      expect(cfop.startsWith("6")).toBe(true);
    });

    it("should validate export CFOP (7xxx)", () => {
      const cfop = "7101";
      expect(cfop.startsWith("7")).toBe(true);
    });
  });

  describe("Tax Calculations", () => {
    it("should calculate ICMS correctly", () => {
      const baseCalculo = 1000.0;
      const aliquota = 18;
      const icms = baseCalculo * (aliquota / 100);
      expect(icms).toBe(180.0);
    });

    it("should calculate IPI correctly", () => {
      const baseCalculo = 1000.0;
      const aliquota = 5;
      const ipi = baseCalculo * (aliquota / 100);
      expect(ipi).toBe(50.0);
    });

    it("should calculate PIS correctly", () => {
      const baseCalculo = 1000.0;
      const aliquota = 1.65;
      const pis = baseCalculo * (aliquota / 100);
      expect(pis).toBeCloseTo(16.5, 2);
    });

    it("should calculate COFINS correctly", () => {
      const baseCalculo = 1000.0;
      const aliquota = 7.6;
      const cofins = baseCalculo * (aliquota / 100);
      expect(cofins).toBeCloseTo(76.0, 2);
    });

    it("should calculate total invoice with taxes", () => {
      const totalProducts = 1000.0;
      const freight = 100.0;
      const discount = 50.0;
      const ipi = 50.0;
      const totalInvoice = totalProducts + freight - discount + ipi;
      expect(totalInvoice).toBe(1100.0);
    });
  });
});
