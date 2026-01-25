import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router cnab
 * Valida inputs e estruturas de dados de arquivos CNAB
 */

// Schema de código de banco
const bankCodeSchema = z.enum(["001", "033", "104", "237", "341", "756"]);

// Schema de layout CNAB
const layoutSchema = z.enum(["240", "400"]);

// Schema de configuração CNAB
const cnabConfigSchema = z.object({
  bankCode: bankCodeSchema,
  layout: layoutSchema,
  agencia: z.string().min(1).max(5),
  agenciaDigito: z.string().max(1).optional(),
  conta: z.string().min(1).max(12),
  contaDigito: z.string().length(1),
  convenio: z.string().optional(),
  carteira: z.string().optional(),
  cedente: z.string().min(1),
  cedenteDocumento: z.string().min(11).max(14),
});

// Schema de input para buscar configuração
const getConfigInputSchema = z.object({
  bankAccountId: z.string().uuid(),
});

// Schema de input para salvar configuração
const saveConfigInputSchema = z.object({
  bankAccountId: z.string().uuid(),
  config: cnabConfigSchema,
});

// Schema de input para gerar remessa
const generateRemessaInputSchema = z.object({
  bankAccountId: z.string().uuid(),
  receivableIds: z.array(z.string().uuid()).min(1),
});

// Schema de input para processar retorno
const processRetornoInputSchema = z.object({
  bankAccountId: z.string().uuid(),
  fileContent: z.string().min(1),
});

// Schema de resposta de banco
const bankResponseSchema = z.object({
  code: bankCodeSchema,
  name: z.string(),
});

// Schema de resposta de remessa
const remessaResponseSchema = z.object({
  fileName: z.string(),
  content: z.string(),
  totalTitulos: z.number(),
  valorTotal: z.number(),
});

// Schema de título processado
const tituloProcessadoSchema = z.object({
  nossoNumero: z.string(),
  seuNumero: z.string().nullable(),
  valorPago: z.number(),
  dataPagamento: z.date().nullable(),
  dataCredito: z.date().nullable(),
  status: z.string(),
});

// Schema de resposta de retorno
const retornoResponseSchema = z.object({
  totalProcessados: z.number(),
  totalPagos: z.number(),
  valorTotalPago: z.number(),
  titulos: z.array(tituloProcessadoSchema),
});

describe("CNAB Router Schemas", () => {
  describe("Bank Code Schema", () => {
    it("should accept Banco do Brasil (001)", () => {
      const result = bankCodeSchema.safeParse("001");
      expect(result.success).toBe(true);
    });

    it("should accept Santander (033)", () => {
      const result = bankCodeSchema.safeParse("033");
      expect(result.success).toBe(true);
    });

    it("should accept Caixa (104)", () => {
      const result = bankCodeSchema.safeParse("104");
      expect(result.success).toBe(true);
    });

    it("should accept Bradesco (237)", () => {
      const result = bankCodeSchema.safeParse("237");
      expect(result.success).toBe(true);
    });

    it("should accept Itaú (341)", () => {
      const result = bankCodeSchema.safeParse("341");
      expect(result.success).toBe(true);
    });

    it("should accept Sicoob (756)", () => {
      const result = bankCodeSchema.safeParse("756");
      expect(result.success).toBe(true);
    });

    it("should reject invalid bank code", () => {
      const result = bankCodeSchema.safeParse("999");
      expect(result.success).toBe(false);
    });

    it("should reject numeric bank code", () => {
      const result = bankCodeSchema.safeParse(1);
      expect(result.success).toBe(false);
    });
  });

  describe("Layout Schema", () => {
    it("should accept layout 240", () => {
      const result = layoutSchema.safeParse("240");
      expect(result.success).toBe(true);
    });

    it("should accept layout 400", () => {
      const result = layoutSchema.safeParse("400");
      expect(result.success).toBe(true);
    });

    it("should reject invalid layout", () => {
      const result = layoutSchema.safeParse("500");
      expect(result.success).toBe(false);
    });
  });

  describe("CNAB Config Schema", () => {
    it("should accept minimal config", () => {
      const config = {
        bankCode: "341" as const,
        layout: "240" as const,
        agencia: "1234",
        conta: "12345",
        contaDigito: "6",
        cedente: "Empresa LTDA",
        cedenteDocumento: "12345678000190",
      };
      const result = cnabConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("should accept complete config", () => {
      const config = {
        bankCode: "237" as const,
        layout: "240" as const,
        agencia: "1234",
        agenciaDigito: "5",
        conta: "123456",
        contaDigito: "7",
        convenio: "1234567",
        carteira: "09",
        cedente: "Empresa Completa LTDA",
        cedenteDocumento: "12345678000190",
      };
      const result = cnabConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("should reject empty agencia", () => {
      const config = {
        bankCode: "341" as const,
        layout: "240" as const,
        agencia: "",
        conta: "12345",
        contaDigito: "6",
        cedente: "Empresa",
        cedenteDocumento: "12345678000190",
      };
      const result = cnabConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("should reject agencia longer than 5 characters", () => {
      const config = {
        bankCode: "341" as const,
        layout: "240" as const,
        agencia: "123456",
        conta: "12345",
        contaDigito: "6",
        cedente: "Empresa",
        cedenteDocumento: "12345678000190",
      };
      const result = cnabConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("should reject conta longer than 12 characters", () => {
      const config = {
        bankCode: "341" as const,
        layout: "240" as const,
        agencia: "1234",
        conta: "1234567890123",
        contaDigito: "6",
        cedente: "Empresa",
        cedenteDocumento: "12345678000190",
      };
      const result = cnabConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("should reject contaDigito with more than 1 character", () => {
      const config = {
        bankCode: "341" as const,
        layout: "240" as const,
        agencia: "1234",
        conta: "12345",
        contaDigito: "67",
        cedente: "Empresa",
        cedenteDocumento: "12345678000190",
      };
      const result = cnabConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("should reject cedenteDocumento shorter than 11 characters (CPF)", () => {
      const config = {
        bankCode: "341" as const,
        layout: "240" as const,
        agencia: "1234",
        conta: "12345",
        contaDigito: "6",
        cedente: "Empresa",
        cedenteDocumento: "1234567890",
      };
      const result = cnabConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("should reject cedenteDocumento longer than 14 characters (CNPJ)", () => {
      const config = {
        bankCode: "341" as const,
        layout: "240" as const,
        agencia: "1234",
        conta: "12345",
        contaDigito: "6",
        cedente: "Empresa",
        cedenteDocumento: "123456789012345",
      };
      const result = cnabConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("should accept CPF as cedenteDocumento (11 characters)", () => {
      const config = {
        bankCode: "341" as const,
        layout: "240" as const,
        agencia: "1234",
        conta: "12345",
        contaDigito: "6",
        cedente: "Pessoa Física",
        cedenteDocumento: "12345678901",
      };
      const result = cnabConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });

  describe("Get Config Input Schema", () => {
    it("should accept valid UUID", () => {
      const input = { bankAccountId: "550e8400-e29b-41d4-a716-446655440000" };
      const result = getConfigInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const input = { bankAccountId: "invalid-uuid" };
      const result = getConfigInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing bankAccountId", () => {
      const result = getConfigInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("Save Config Input Schema", () => {
    it("should accept valid input", () => {
      const input = {
        bankAccountId: "550e8400-e29b-41d4-a716-446655440000",
        config: {
          bankCode: "341" as const,
          layout: "240" as const,
          agencia: "1234",
          conta: "12345",
          contaDigito: "6",
          cedente: "Empresa",
          cedenteDocumento: "12345678000190",
        },
      };
      const result = saveConfigInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid bankAccountId", () => {
      const input = {
        bankAccountId: "invalid",
        config: {
          bankCode: "341" as const,
          layout: "240" as const,
          agencia: "1234",
          conta: "12345",
          contaDigito: "6",
          cedente: "Empresa",
          cedenteDocumento: "12345678000190",
        },
      };
      const result = saveConfigInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid config", () => {
      const input = {
        bankAccountId: "550e8400-e29b-41d4-a716-446655440000",
        config: {
          bankCode: "999", // invalid
          layout: "240",
        },
      };
      const result = saveConfigInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Generate Remessa Input Schema", () => {
    it("should accept valid input with single receivable", () => {
      const input = {
        bankAccountId: "550e8400-e29b-41d4-a716-446655440000",
        receivableIds: ["660e8400-e29b-41d4-a716-446655440001"],
      };
      const result = generateRemessaInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept valid input with multiple receivables", () => {
      const input = {
        bankAccountId: "550e8400-e29b-41d4-a716-446655440000",
        receivableIds: [
          "660e8400-e29b-41d4-a716-446655440001",
          "660e8400-e29b-41d4-a716-446655440002",
          "660e8400-e29b-41d4-a716-446655440003",
        ],
      };
      const result = generateRemessaInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty receivableIds array", () => {
      const input = {
        bankAccountId: "550e8400-e29b-41d4-a716-446655440000",
        receivableIds: [],
      };
      const result = generateRemessaInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid UUID in receivableIds", () => {
      const input = {
        bankAccountId: "550e8400-e29b-41d4-a716-446655440000",
        receivableIds: ["invalid-uuid"],
      };
      const result = generateRemessaInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Process Retorno Input Schema", () => {
    it("should accept valid input", () => {
      const input = {
        bankAccountId: "550e8400-e29b-41d4-a716-446655440000",
        fileContent: "CNAB240 FILE CONTENT...",
      };
      const result = processRetornoInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty fileContent", () => {
      const input = {
        bankAccountId: "550e8400-e29b-41d4-a716-446655440000",
        fileContent: "",
      };
      const result = processRetornoInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing fileContent", () => {
      const input = {
        bankAccountId: "550e8400-e29b-41d4-a716-446655440000",
      };
      const result = processRetornoInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Bank Response Schema", () => {
    it("should validate bank response", () => {
      const response = {
        code: "341" as const,
        name: "Itaú Unibanco",
      };
      const result = bankResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("should validate all supported banks", () => {
      const banks = [
        { code: "001" as const, name: "Banco do Brasil" },
        { code: "033" as const, name: "Santander" },
        { code: "104" as const, name: "Caixa Econômica Federal" },
        { code: "237" as const, name: "Bradesco" },
        { code: "341" as const, name: "Itaú Unibanco" },
        { code: "756" as const, name: "Sicoob" },
      ];

      banks.forEach(bank => {
        const result = bankResponseSchema.safeParse(bank);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Remessa Response Schema", () => {
    it("should validate remessa response", () => {
      const response = {
        fileName: "REMESSA_20260125_001.REM",
        content: "CNAB240 CONTENT...",
        totalTitulos: 10,
        valorTotal: 15000.50,
      };
      const result = remessaResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("should validate remessa with zero values", () => {
      const response = {
        fileName: "REMESSA_20260125_001.REM",
        content: "HEADER ONLY",
        totalTitulos: 0,
        valorTotal: 0,
      };
      const result = remessaResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("Titulo Processado Schema", () => {
    it("should validate titulo pago", () => {
      const titulo = {
        nossoNumero: "12345678901234567890",
        seuNumero: "FAT-001",
        valorPago: 1500.00,
        dataPagamento: new Date("2026-01-25"),
        dataCredito: new Date("2026-01-26"),
        status: "PAGO",
      };
      const result = tituloProcessadoSchema.safeParse(titulo);
      expect(result.success).toBe(true);
    });

    it("should validate titulo com campos null", () => {
      const titulo = {
        nossoNumero: "12345678901234567890",
        seuNumero: null,
        valorPago: 0,
        dataPagamento: null,
        dataCredito: null,
        status: "REJEITADO",
      };
      const result = tituloProcessadoSchema.safeParse(titulo);
      expect(result.success).toBe(true);
    });
  });

  describe("Retorno Response Schema", () => {
    it("should validate retorno response", () => {
      const response = {
        totalProcessados: 10,
        totalPagos: 8,
        valorTotalPago: 12000.00,
        titulos: [
          {
            nossoNumero: "123",
            seuNumero: "FAT-001",
            valorPago: 1500.00,
            dataPagamento: new Date(),
            dataCredito: new Date(),
            status: "PAGO",
          },
        ],
      };
      const result = retornoResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("should validate empty retorno", () => {
      const response = {
        totalProcessados: 0,
        totalPagos: 0,
        valorTotalPago: 0,
        titulos: [],
      };
      const result = retornoResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("CNAB File Naming", () => {
    it("should accept standard remessa filename", () => {
      const fileName = "REMESSA_20260125_001.REM";
      expect(fileName).toMatch(/^REMESSA_\d{8}_\d{3}\.REM$/);
    });

    it("should accept standard retorno filename", () => {
      const fileName = "RETORNO_20260125_001.RET";
      expect(fileName).toMatch(/^RETORNO_\d{8}_\d{3}\.RET$/);
    });
  });

  describe("Bank Specific Validations", () => {
    it("should validate Itaú config with carteira", () => {
      const config = {
        bankCode: "341" as const,
        layout: "240" as const,
        agencia: "1234",
        conta: "12345",
        contaDigito: "6",
        carteira: "109",
        cedente: "Empresa",
        cedenteDocumento: "12345678000190",
      };
      const result = cnabConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("should validate Bradesco config with convenio", () => {
      const config = {
        bankCode: "237" as const,
        layout: "240" as const,
        agencia: "1234",
        agenciaDigito: "5",
        conta: "123456",
        contaDigito: "7",
        convenio: "1234567",
        cedente: "Empresa",
        cedenteDocumento: "12345678000190",
      };
      const result = cnabConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("should validate Banco do Brasil config", () => {
      const config = {
        bankCode: "001" as const,
        layout: "240" as const,
        agencia: "1234",
        agenciaDigito: "X",
        conta: "12345678",
        contaDigito: "9",
        convenio: "1234567",
        carteira: "17",
        cedente: "Empresa BB",
        cedenteDocumento: "12345678000190",
      };
      const result = cnabConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });
});
