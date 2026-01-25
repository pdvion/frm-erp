import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router dda (Débito Direto Autorizado)
 * Valida inputs e estruturas de dados de boletos DDA
 */

// Schema de status do boleto DDA
const ddaStatusSchema = z.enum([
  "PENDENTE",
  "APROVADO",
  "REJEITADO",
  "PAGO",
  "VENCIDO",
  "CANCELADO",
]);

// Schema de listagem de boletos
const listInputSchema = z.object({
  status: ddaStatusSchema.optional(),
  dataInicio: z.date().optional(),
  dataFim: z.date().optional(),
  cedenteCnpj: z.string().optional(),
  search: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

// Schema de busca por ID
const getByIdInputSchema = z.object({
  id: z.string(),
});

// Schema de criação de boleto
const createInputSchema = z.object({
  codigoBarras: z.string().optional(),
  linhaDigitavel: z.string().optional(),
  nossoNumero: z.string().optional(),
  valorOriginal: z.number(),
  valorFinal: z.number(),
  dataVencimento: z.date(),
  dataEmissao: z.date().optional(),
  cedenteCnpj: z.string().optional(),
  cedenteNome: z.string().optional(),
  cedenteBanco: z.string().optional(),
  supplierId: z.string().optional(),
});

// Schema de atualização de status
const updateStatusInputSchema = z.object({
  id: z.string(),
  status: ddaStatusSchema,
  observacao: z.string().optional(),
});

// Schema de vinculação com conta a pagar
const linkToPayableInputSchema = z.object({
  boletoId: z.string(),
  accountsPayableId: z.string(),
});

// Schema de resposta de boleto
const boletoResponseSchema = z.object({
  id: z.string(),
  codigoBarras: z.string().nullable(),
  linhaDigitavel: z.string().nullable(),
  nossoNumero: z.string().nullable(),
  valorOriginal: z.number(),
  valorFinal: z.number(),
  dataVencimento: z.date(),
  dataEmissao: z.date().nullable(),
  status: ddaStatusSchema,
  cedenteCnpj: z.string().nullable(),
  cedenteNome: z.string().nullable(),
  cedenteBanco: z.string().nullable(),
  companyId: z.string(),
  supplierId: z.string().nullable(),
  accountsPayableId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Schema de estatísticas
const statsSchema = z.object({
  pendentes: z.object({ count: z.number(), total: z.number() }),
  aprovados: z.object({ count: z.number(), total: z.number() }),
  pagos: z.object({ count: z.number(), total: z.number() }),
  vencidos: z.object({ count: z.number(), total: z.number() }),
});

describe("DDA Router Schemas", () => {
  describe("Status Schema", () => {
    it("should accept PENDENTE status", () => {
      const result = ddaStatusSchema.safeParse("PENDENTE");
      expect(result.success).toBe(true);
    });

    it("should accept APROVADO status", () => {
      const result = ddaStatusSchema.safeParse("APROVADO");
      expect(result.success).toBe(true);
    });

    it("should accept REJEITADO status", () => {
      const result = ddaStatusSchema.safeParse("REJEITADO");
      expect(result.success).toBe(true);
    });

    it("should accept PAGO status", () => {
      const result = ddaStatusSchema.safeParse("PAGO");
      expect(result.success).toBe(true);
    });

    it("should accept VENCIDO status", () => {
      const result = ddaStatusSchema.safeParse("VENCIDO");
      expect(result.success).toBe(true);
    });

    it("should accept CANCELADO status", () => {
      const result = ddaStatusSchema.safeParse("CANCELADO");
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = ddaStatusSchema.safeParse("INVALID");
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

    it("should accept status filter", () => {
      const result = listInputSchema.safeParse({ status: "PENDENTE" });
      expect(result.success).toBe(true);
    });

    it("should accept date range filter", () => {
      const result = listInputSchema.safeParse({
        dataInicio: new Date("2024-01-01"),
        dataFim: new Date("2024-12-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should accept cedente CNPJ filter", () => {
      const result = listInputSchema.safeParse({
        cedenteCnpj: "12345678000190",
      });
      expect(result.success).toBe(true);
    });

    it("should accept search filter", () => {
      const result = listInputSchema.safeParse({
        search: "fornecedor",
      });
      expect(result.success).toBe(true);
    });

    it("should accept pagination parameters", () => {
      const result = listInputSchema.safeParse({
        page: 2,
        limit: 50,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });

    it("should accept all filters combined", () => {
      const result = listInputSchema.safeParse({
        status: "APROVADO",
        dataInicio: new Date("2024-01-01"),
        dataFim: new Date("2024-12-31"),
        cedenteCnpj: "12345678000190",
        search: "teste",
        page: 1,
        limit: 10,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Get By ID Input Schema", () => {
    it("should accept valid ID", () => {
      const result = getByIdInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing ID", () => {
      const result = getByIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("Create Input Schema", () => {
    it("should accept minimal valid input", () => {
      const result = createInputSchema.safeParse({
        valorOriginal: 1000.0,
        valorFinal: 1000.0,
        dataVencimento: new Date("2024-12-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete input", () => {
      const result = createInputSchema.safeParse({
        codigoBarras: "23793.38128 60000.000003 00000.000400 1 84340000010000",
        linhaDigitavel: "23793381286000000000300000004001843400000100",
        nossoNumero: "00000004",
        valorOriginal: 100.0,
        valorFinal: 100.0,
        dataVencimento: new Date("2024-12-31"),
        dataEmissao: new Date("2024-01-01"),
        cedenteCnpj: "12345678000190",
        cedenteNome: "Fornecedor Teste",
        cedenteBanco: "001",
        supplierId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing required fields", () => {
      const result = createInputSchema.safeParse({
        valorOriginal: 1000.0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid valor", () => {
      const result = createInputSchema.safeParse({
        valorOriginal: "invalid",
        valorFinal: 1000.0,
        dataVencimento: new Date(),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Update Status Input Schema", () => {
    it("should accept valid status update", () => {
      const result = updateStatusInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        status: "APROVADO",
      });
      expect(result.success).toBe(true);
    });

    it("should accept status update with observacao", () => {
      const result = updateStatusInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        status: "REJEITADO",
        observacao: "Boleto duplicado",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = updateStatusInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        status: "INVALID",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const result = updateStatusInputSchema.safeParse({
        status: "APROVADO",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Link To Payable Input Schema", () => {
    it("should accept valid link input", () => {
      const result = linkToPayableInputSchema.safeParse({
        boletoId: "123e4567-e89b-12d3-a456-426614174000",
        accountsPayableId: "123e4567-e89b-12d3-a456-426614174001",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing boletoId", () => {
      const result = linkToPayableInputSchema.safeParse({
        accountsPayableId: "123e4567-e89b-12d3-a456-426614174001",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing accountsPayableId", () => {
      const result = linkToPayableInputSchema.safeParse({
        boletoId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Stats Schema", () => {
    it("should validate stats structure", () => {
      const result = statsSchema.safeParse({
        pendentes: { count: 10, total: 5000.0 },
        aprovados: { count: 5, total: 2500.0 },
        pagos: { count: 20, total: 10000.0 },
        vencidos: { count: 2, total: 1000.0 },
      });
      expect(result.success).toBe(true);
    });

    it("should validate empty stats", () => {
      const result = statsSchema.safeParse({
        pendentes: { count: 0, total: 0 },
        aprovados: { count: 0, total: 0 },
        pagos: { count: 0, total: 0 },
        vencidos: { count: 0, total: 0 },
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing stats fields", () => {
      const result = statsSchema.safeParse({
        pendentes: { count: 10, total: 5000.0 },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Boleto Response Schema", () => {
    it("should validate complete boleto response", () => {
      const result = boletoResponseSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        codigoBarras: "23793.38128",
        linhaDigitavel: "23793381286",
        nossoNumero: "00000004",
        valorOriginal: 100.0,
        valorFinal: 100.0,
        dataVencimento: new Date("2024-12-31"),
        dataEmissao: new Date("2024-01-01"),
        status: "PENDENTE",
        cedenteCnpj: "12345678000190",
        cedenteNome: "Fornecedor Teste",
        cedenteBanco: "001",
        companyId: "company-id",
        supplierId: "supplier-id",
        accountsPayableId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("should validate boleto with nullable fields", () => {
      const result = boletoResponseSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        codigoBarras: null,
        linhaDigitavel: null,
        nossoNumero: null,
        valorOriginal: 100.0,
        valorFinal: 100.0,
        dataVencimento: new Date("2024-12-31"),
        dataEmissao: null,
        status: "PENDENTE",
        cedenteCnpj: null,
        cedenteNome: null,
        cedenteBanco: null,
        companyId: "company-id",
        supplierId: null,
        accountsPayableId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Business Rules", () => {
    it("should validate boleto with different values (original vs final)", () => {
      const result = createInputSchema.safeParse({
        valorOriginal: 1000.0,
        valorFinal: 1050.0, // Com juros/multa
        dataVencimento: new Date("2024-12-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should accept boleto with discount (final < original)", () => {
      const result = createInputSchema.safeParse({
        valorOriginal: 1000.0,
        valorFinal: 950.0, // Com desconto
        dataVencimento: new Date("2024-12-31"),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("CNPJ Validation", () => {
    it("should accept valid CNPJ format", () => {
      const result = createInputSchema.safeParse({
        valorOriginal: 100.0,
        valorFinal: 100.0,
        dataVencimento: new Date(),
        cedenteCnpj: "12345678000190",
      });
      expect(result.success).toBe(true);
    });

    it("should accept CNPJ with formatting", () => {
      const result = createInputSchema.safeParse({
        valorOriginal: 100.0,
        valorFinal: 100.0,
        dataVencimento: new Date(),
        cedenteCnpj: "12.345.678/0001-90",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Pagination", () => {
    it("should calculate totalPages correctly", () => {
      const total = 100;
      const limit = 20;
      const totalPages = Math.ceil(total / limit);
      expect(totalPages).toBe(5);
    });

    it("should handle single page", () => {
      const total = 15;
      const limit = 20;
      const totalPages = Math.ceil(total / limit);
      expect(totalPages).toBe(1);
    });

    it("should handle empty results", () => {
      const total = 0;
      const limit = 20;
      const totalPages = Math.ceil(total / limit);
      expect(totalPages).toBe(0);
    });
  });
});
