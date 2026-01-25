import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const consultarNFeDestinadasInputSchema = z.object({
  ultimoNSU: z.string().optional(),
}).optional();

const consultarPorChaveInputSchema = z.object({
  chaveAcesso: z.string().length(44, "Chave de acesso deve ter 44 dígitos"),
});

const manifestarInputSchema = z.object({
  chaveAcesso: z.string().length(44),
  tipo: z.enum(["CIENCIA", "CONFIRMACAO", "DESCONHECIMENTO", "NAO_REALIZADA"]),
  justificativa: z.string().optional(),
  pendingNfeId: z.string().uuid().optional(),
});

const downloadNFeInputSchema = z.object({
  chaveAcesso: z.string().length(44),
});

const saveConfigInputSchema = z.object({
  cnpj: z.string().min(14).max(18),
  uf: z.string().length(2),
  ambiente: z.enum(["PRODUCAO", "HOMOLOGACAO"]).default("HOMOLOGACAO"),
  certificadoBase64: z.string().optional(),
  certificadoSenha: z.string().optional(),
  ultimoNSU: z.string().optional(),
  consultaAutomatica: z.boolean().default(false),
  intervaloConsulta: z.number().min(1).max(24).default(1),
});

const listPendingNfesInputSchema = z.object({
  status: z.enum(["PENDING", "CIENCIA", "CONFIRMADA", "DESCONHECIDA", "NAO_REALIZADA", "ALL"]).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  search: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
}).optional();

const getPendingNfeInputSchema = z.object({
  id: z.string().uuid(),
});

const importPendingNfeInputSchema = z.object({
  pendingNfeId: z.string().uuid(),
  createReceiving: z.boolean().default(true),
  locationId: z.string().optional(),
  notes: z.string().optional(),
});

const deletePendingNfeInputSchema = z.object({
  id: z.string().uuid(),
});

const testConnectionInputSchema = z.object({}).optional();

describe("SEFAZ Router Schemas", () => {
  describe("consultarNFeDestinadas input", () => {
    it("should accept empty input", () => {
      const result = consultarNFeDestinadasInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept ultimoNSU", () => {
      const result = consultarNFeDestinadasInputSchema.safeParse({
        ultimoNSU: "000000000000001",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("consultarPorChave input", () => {
    it("should accept valid 44-char chaveAcesso", () => {
      const result = consultarPorChaveInputSchema.safeParse({
        chaveAcesso: "35260112345678000190550010000123451234567890",
      });
      expect(result.success).toBe(true);
    });

    it("should reject chaveAcesso too short", () => {
      const result = consultarPorChaveInputSchema.safeParse({
        chaveAcesso: "123456789",
      });
      expect(result.success).toBe(false);
    });

    it("should reject chaveAcesso too long", () => {
      const result = consultarPorChaveInputSchema.safeParse({
        chaveAcesso: "352601123456780001905500100001234512345678901234567890",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing chaveAcesso", () => {
      const result = consultarPorChaveInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("manifestar input", () => {
    it("should accept valid CIENCIA", () => {
      const result = manifestarInputSchema.safeParse({
        chaveAcesso: "35260112345678000190550010000123451234567890",
        tipo: "CIENCIA",
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid CONFIRMACAO", () => {
      const result = manifestarInputSchema.safeParse({
        chaveAcesso: "35260112345678000190550010000123451234567890",
        tipo: "CONFIRMACAO",
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid DESCONHECIMENTO", () => {
      const result = manifestarInputSchema.safeParse({
        chaveAcesso: "35260112345678000190550010000123451234567890",
        tipo: "DESCONHECIMENTO",
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid NAO_REALIZADA", () => {
      const result = manifestarInputSchema.safeParse({
        chaveAcesso: "35260112345678000190550010000123451234567890",
        tipo: "NAO_REALIZADA",
      });
      expect(result.success).toBe(true);
    });

    it("should accept with justificativa", () => {
      const result = manifestarInputSchema.safeParse({
        chaveAcesso: "35260112345678000190550010000123451234567890",
        tipo: "DESCONHECIMENTO",
        justificativa: "Operação não realizada por esta empresa",
      });
      expect(result.success).toBe(true);
    });

    it("should accept with pendingNfeId", () => {
      const result = manifestarInputSchema.safeParse({
        chaveAcesso: "35260112345678000190550010000123451234567890",
        tipo: "CIENCIA",
        pendingNfeId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid tipo", () => {
      const result = manifestarInputSchema.safeParse({
        chaveAcesso: "35260112345678000190550010000123451234567890",
        tipo: "INVALID",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid chaveAcesso length", () => {
      const result = manifestarInputSchema.safeParse({
        chaveAcesso: "123",
        tipo: "CIENCIA",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid pendingNfeId", () => {
      const result = manifestarInputSchema.safeParse({
        chaveAcesso: "35260112345678000190550010000123451234567890",
        tipo: "CIENCIA",
        pendingNfeId: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("downloadNFe input", () => {
    it("should accept valid chaveAcesso", () => {
      const result = downloadNFeInputSchema.safeParse({
        chaveAcesso: "35260112345678000190550010000123451234567890",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid chaveAcesso", () => {
      const result = downloadNFeInputSchema.safeParse({
        chaveAcesso: "123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("saveConfig input", () => {
    it("should accept valid input", () => {
      const result = saveConfigInputSchema.safeParse({
        cnpj: "12345678000190",
        uf: "SP",
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = saveConfigInputSchema.safeParse({
        cnpj: "12345678000190",
        uf: "SP",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ambiente).toBe("HOMOLOGACAO");
        expect(result.data.consultaAutomatica).toBe(false);
        expect(result.data.intervaloConsulta).toBe(1);
      }
    });

    it("should accept full input", () => {
      const result = saveConfigInputSchema.safeParse({
        cnpj: "12345678000190",
        uf: "SP",
        ambiente: "PRODUCAO",
        certificadoBase64: "base64encodedcert...",
        certificadoSenha: "senha123",
        ultimoNSU: "000000000000001",
        consultaAutomatica: true,
        intervaloConsulta: 6,
      });
      expect(result.success).toBe(true);
    });

    it("should accept both ambiente values", () => {
      const ambientes = ["PRODUCAO", "HOMOLOGACAO"];
      for (const ambiente of ambientes) {
        const result = saveConfigInputSchema.safeParse({
          cnpj: "12345678000190",
          uf: "SP",
          ambiente,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject cnpj too short", () => {
      const result = saveConfigInputSchema.safeParse({
        cnpj: "123",
        uf: "SP",
      });
      expect(result.success).toBe(false);
    });

    it("should reject uf wrong length", () => {
      const result = saveConfigInputSchema.safeParse({
        cnpj: "12345678000190",
        uf: "SAO",
      });
      expect(result.success).toBe(false);
    });

    it("should reject intervaloConsulta less than 1", () => {
      const result = saveConfigInputSchema.safeParse({
        cnpj: "12345678000190",
        uf: "SP",
        intervaloConsulta: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject intervaloConsulta greater than 24", () => {
      const result = saveConfigInputSchema.safeParse({
        cnpj: "12345678000190",
        uf: "SP",
        intervaloConsulta: 25,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("listPendingNfes input", () => {
    it("should accept empty input", () => {
      const result = listPendingNfesInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = listPendingNfesInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.page).toBe(1);
        expect(result.data?.limit).toBe(20);
      }
    });

    it("should accept all status values", () => {
      const statuses = ["PENDING", "CIENCIA", "CONFIRMADA", "DESCONHECIDA", "NAO_REALIZADA", "ALL"];
      for (const status of statuses) {
        const result = listPendingNfesInputSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid status", () => {
      const result = listPendingNfesInputSchema.safeParse({ status: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("should accept date range", () => {
      const result = listPendingNfesInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should accept search string", () => {
      const result = listPendingNfesInputSchema.safeParse({ search: "12345" });
      expect(result.success).toBe(true);
    });
  });

  describe("getPendingNfe input", () => {
    it("should accept valid uuid", () => {
      const result = getPendingNfeInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid uuid", () => {
      const result = getPendingNfeInputSchema.safeParse({
        id: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const result = getPendingNfeInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("importPendingNfe input", () => {
    it("should accept valid input", () => {
      const result = importPendingNfeInputSchema.safeParse({
        pendingNfeId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should apply default createReceiving", () => {
      const result = importPendingNfeInputSchema.safeParse({
        pendingNfeId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.createReceiving).toBe(true);
      }
    });

    it("should accept full input", () => {
      const result = importPendingNfeInputSchema.safeParse({
        pendingNfeId: "550e8400-e29b-41d4-a716-446655440000",
        createReceiving: false,
        locationId: "loc-001",
        notes: "Importação manual",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid pendingNfeId", () => {
      const result = importPendingNfeInputSchema.safeParse({
        pendingNfeId: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing pendingNfeId", () => {
      const result = importPendingNfeInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("deletePendingNfe input", () => {
    it("should accept valid uuid", () => {
      const result = deletePendingNfeInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid uuid", () => {
      const result = deletePendingNfeInputSchema.safeParse({
        id: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const result = deletePendingNfeInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("testConnection input", () => {
    it("should accept empty input", () => {
      const result = testConnectionInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept empty object", () => {
      const result = testConnectionInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
