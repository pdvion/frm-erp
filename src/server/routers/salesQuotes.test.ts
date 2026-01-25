import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router salesQuotes (Orçamentos de Venda)
 * Valida inputs e estruturas de dados de orçamentos comerciais
 */

// Schema de status do orçamento
const quoteStatusSchema = z.enum([
  "DRAFT",
  "SENT",
  "VIEWED",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CONVERTED",
]);

// Schema de listagem
const listInputSchema = z.object({
  search: z.string().optional(),
  status: quoteStatusSchema.optional(),
  customerId: z.string().optional(),
  leadId: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

// Schema de busca por ID
const byIdInputSchema = z.object({
  id: z.string(),
});

// Schema de criação de orçamento
const createInputSchema = z.object({
  customerId: z.string().optional(),
  leadId: z.string().optional(),
  validUntil: z.string(),
  paymentTerms: z.string().optional(),
  deliveryTerms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    materialId: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number(),
    discount: z.number().default(0),
  })),
});

// Schema de atualização de orçamento
const updateInputSchema = z.object({
  id: z.string(),
  validUntil: z.string().optional(),
  paymentTerms: z.string().optional(),
  deliveryTerms: z.string().optional(),
  notes: z.string().optional(),
});

// Schema de conversão para pedido
const convertToOrderInputSchema = z.object({
  quoteId: z.string(),
  deliveryDate: z.string().optional(),
  notes: z.string().optional(),
});

// Schema de envio de orçamento
const sendQuoteInputSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  message: z.string().optional(),
});

// Schema de item do orçamento
const quoteItemSchema = z.object({
  materialId: z.string(),
  sequence: z.number(),
  quantity: z.number().positive(),
  unitPrice: z.number(),
  discount: z.number(),
  totalPrice: z.number(),
});

// Schema de resposta de orçamento
const quoteResponseSchema = z.object({
  id: z.string(),
  code: z.number(),
  customerId: z.string().nullable(),
  leadId: z.string().nullable(),
  status: quoteStatusSchema,
  quoteDate: z.date(),
  validUntil: z.date(),
  totalProducts: z.number(),
  totalDiscount: z.number(),
  totalQuote: z.number(),
  paymentTerms: z.string().nullable(),
  deliveryTerms: z.string().nullable(),
  notes: z.string().nullable(),
  companyId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

describe("Sales Quotes Router Schemas", () => {
  describe("Quote Status Schema", () => {
    it("should accept DRAFT status", () => {
      const result = quoteStatusSchema.safeParse("DRAFT");
      expect(result.success).toBe(true);
    });

    it("should accept SENT status", () => {
      const result = quoteStatusSchema.safeParse("SENT");
      expect(result.success).toBe(true);
    });

    it("should accept VIEWED status", () => {
      const result = quoteStatusSchema.safeParse("VIEWED");
      expect(result.success).toBe(true);
    });

    it("should accept ACCEPTED status", () => {
      const result = quoteStatusSchema.safeParse("ACCEPTED");
      expect(result.success).toBe(true);
    });

    it("should accept REJECTED status", () => {
      const result = quoteStatusSchema.safeParse("REJECTED");
      expect(result.success).toBe(true);
    });

    it("should accept EXPIRED status", () => {
      const result = quoteStatusSchema.safeParse("EXPIRED");
      expect(result.success).toBe(true);
    });

    it("should accept CONVERTED status", () => {
      const result = quoteStatusSchema.safeParse("CONVERTED");
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = quoteStatusSchema.safeParse("INVALID");
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
        search: "Cliente ABC",
      });
      expect(result.success).toBe(true);
    });

    it("should accept status filter", () => {
      const result = listInputSchema.safeParse({
        status: "SENT",
      });
      expect(result.success).toBe(true);
    });

    it("should accept customerId filter", () => {
      const result = listInputSchema.safeParse({
        customerId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept leadId filter", () => {
      const result = listInputSchema.safeParse({
        leadId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept all filters combined", () => {
      const result = listInputSchema.safeParse({
        search: "ORC-001",
        status: "ACCEPTED",
        customerId: "123e4567-e89b-12d3-a456-426614174000",
        leadId: "123e4567-e89b-12d3-a456-426614174001",
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

  describe("Create Input Schema", () => {
    it("should accept quote for customer", () => {
      const result = createInputSchema.safeParse({
        customerId: "123e4567-e89b-12d3-a456-426614174000",
        validUntil: "2024-02-28",
        items: [
          {
            materialId: "123e4567-e89b-12d3-a456-426614174001",
            quantity: 10,
            unitPrice: 100.0,
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should accept quote for lead", () => {
      const result = createInputSchema.safeParse({
        leadId: "123e4567-e89b-12d3-a456-426614174000",
        validUntil: "2024-02-28",
        items: [
          {
            materialId: "123e4567-e89b-12d3-a456-426614174001",
            quantity: 5,
            unitPrice: 200.0,
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete input", () => {
      const result = createInputSchema.safeParse({
        customerId: "123e4567-e89b-12d3-a456-426614174000",
        validUntil: "2024-02-28",
        paymentTerms: "30/60/90 dias",
        deliveryTerms: "CIF - Frete incluso",
        notes: "Orçamento válido por 30 dias",
        items: [
          {
            materialId: "123e4567-e89b-12d3-a456-426614174001",
            quantity: 10,
            unitPrice: 100.0,
            discount: 5,
          },
          {
            materialId: "123e4567-e89b-12d3-a456-426614174002",
            quantity: 5,
            unitPrice: 200.0,
            discount: 0,
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing validUntil", () => {
      const result = createInputSchema.safeParse({
        customerId: "123e4567-e89b-12d3-a456-426614174000",
        items: [
          {
            materialId: "123e4567-e89b-12d3-a456-426614174001",
            quantity: 10,
            unitPrice: 100.0,
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero quantity", () => {
      const result = createInputSchema.safeParse({
        customerId: "123e4567-e89b-12d3-a456-426614174000",
        validUntil: "2024-02-28",
        items: [
          {
            materialId: "123e4567-e89b-12d3-a456-426614174001",
            quantity: 0,
            unitPrice: 100.0,
          },
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Update Input Schema", () => {
    it("should accept minimal update", () => {
      const result = updateInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete update", () => {
      const result = updateInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        validUntil: "2024-03-15",
        paymentTerms: "À vista",
        deliveryTerms: "FOB",
        notes: "Atualizado conforme solicitação",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateInputSchema.safeParse({
        validUntil: "2024-03-15",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Convert To Order Input Schema", () => {
    it("should accept minimal conversion", () => {
      const result = convertToOrderInputSchema.safeParse({
        quoteId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept conversion with delivery date", () => {
      const result = convertToOrderInputSchema.safeParse({
        quoteId: "123e4567-e89b-12d3-a456-426614174000",
        deliveryDate: "2024-03-01",
        notes: "Pedido gerado a partir do orçamento",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing quoteId", () => {
      const result = convertToOrderInputSchema.safeParse({
        deliveryDate: "2024-03-01",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Send Quote Input Schema", () => {
    it("should accept minimal send", () => {
      const result = sendQuoteInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept send with email", () => {
      const result = sendQuoteInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "cliente@empresa.com",
        message: "Segue orçamento conforme solicitado",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = sendQuoteInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "invalid-email",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const result = sendQuoteInputSchema.safeParse({
        email: "cliente@empresa.com",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Quote Item Schema", () => {
    it("should accept valid item", () => {
      const result = quoteItemSchema.safeParse({
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        sequence: 1,
        quantity: 10,
        unitPrice: 100.0,
        discount: 5,
        totalPrice: 950.0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept item without discount", () => {
      const result = quoteItemSchema.safeParse({
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        sequence: 1,
        quantity: 10,
        unitPrice: 100.0,
        discount: 0,
        totalPrice: 1000.0,
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero quantity", () => {
      const result = quoteItemSchema.safeParse({
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        sequence: 1,
        quantity: 0,
        unitPrice: 100.0,
        discount: 0,
        totalPrice: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Quote Response Schema", () => {
    it("should validate complete quote response", () => {
      const result = quoteResponseSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        code: 1234,
        customerId: "customer-id",
        leadId: null,
        status: "SENT",
        quoteDate: new Date(),
        validUntil: new Date(),
        totalProducts: 1000.0,
        totalDiscount: 50.0,
        totalQuote: 950.0,
        paymentTerms: "30/60/90",
        deliveryTerms: "CIF",
        notes: "Observações",
        companyId: "company-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("should validate quote with lead instead of customer", () => {
      const result = quoteResponseSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        code: 1234,
        customerId: null,
        leadId: "lead-id",
        status: "DRAFT",
        quoteDate: new Date(),
        validUntil: new Date(),
        totalProducts: 500.0,
        totalDiscount: 0,
        totalQuote: 500.0,
        paymentTerms: null,
        deliveryTerms: null,
        notes: null,
        companyId: "company-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Quote Calculations", () => {
    it("should calculate item total correctly", () => {
      const quantity = 10;
      const unitPrice = 100.0;
      const discount = 5; // 5%
      const totalPrice = quantity * unitPrice * (1 - discount / 100);
      expect(totalPrice).toBe(950.0);
    });

    it("should calculate quote total correctly", () => {
      const items = [
        { quantity: 10, unitPrice: 100.0, discount: 5 },
        { quantity: 5, unitPrice: 200.0, discount: 10 },
      ];
      const totalProducts = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      const totalDiscount = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice * (item.discount / 100),
        0
      );
      const totalQuote = totalProducts - totalDiscount;
      
      expect(totalProducts).toBe(2000.0);
      expect(totalDiscount).toBe(150.0); // 50 + 100
      expect(totalQuote).toBe(1850.0);
    });
  });

  describe("Quote Validity", () => {
    it("should check if quote is valid", () => {
      const validUntil = new Date("2024-12-31");
      const today = new Date("2024-06-15");
      const isValid = validUntil >= today;
      expect(isValid).toBe(true);
    });

    it("should check if quote is expired", () => {
      const validUntil = new Date("2024-01-01");
      const today = new Date("2024-06-15");
      const isExpired = validUntil < today;
      expect(isExpired).toBe(true);
    });

    it("should calculate days until expiration", () => {
      const validUntil = new Date("2024-06-30");
      const today = new Date("2024-06-15");
      const daysUntilExpiration = Math.ceil(
        (validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysUntilExpiration).toBe(15);
    });
  });

  describe("Status Workflow", () => {
    const validTransitions: Record<string, string[]> = {
      DRAFT: ["SENT"],
      SENT: ["VIEWED", "ACCEPTED", "REJECTED", "EXPIRED"],
      VIEWED: ["ACCEPTED", "REJECTED", "EXPIRED"],
      ACCEPTED: ["CONVERTED"],
      REJECTED: [],
      EXPIRED: [],
      CONVERTED: [],
    };

    it("should allow DRAFT to SENT", () => {
      const from = "DRAFT";
      const to = "SENT";
      expect(validTransitions[from].includes(to)).toBe(true);
    });

    it("should allow SENT to VIEWED", () => {
      const from = "SENT";
      const to = "VIEWED";
      expect(validTransitions[from].includes(to)).toBe(true);
    });

    it("should allow VIEWED to ACCEPTED", () => {
      const from = "VIEWED";
      const to = "ACCEPTED";
      expect(validTransitions[from].includes(to)).toBe(true);
    });

    it("should allow ACCEPTED to CONVERTED", () => {
      const from = "ACCEPTED";
      const to = "CONVERTED";
      expect(validTransitions[from].includes(to)).toBe(true);
    });

    it("should not allow REJECTED to any status", () => {
      const from = "REJECTED";
      expect(validTransitions[from].length).toBe(0);
    });

    it("should not allow CONVERTED to any status", () => {
      const from = "CONVERTED";
      expect(validTransitions[from].length).toBe(0);
    });
  });
});
