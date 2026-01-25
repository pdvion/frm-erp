import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    company: {
      findUnique: vi.fn(),
    },
    issuedInvoice: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock NFeEmitter
vi.mock("@/lib/sefaz/nfe-emitter", () => ({
  NFeEmitter: vi.fn().mockImplementation(() => ({
    emitir: vi.fn().mockResolvedValue({
      sucesso: true,
      chaveAcesso: "12345678901234567890123456789012345678901234",
      protocolo: "123456789012345",
      xml: "<nfe>...</nfe>",
    }),
    cancelar: vi.fn().mockResolvedValue({
      sucesso: true,
      protocolo: "123456789012345",
    }),
    cartaCorrecao: vi.fn().mockResolvedValue({
      sucesso: true,
      protocolo: "123456789012345",
    }),
  })),
  gerarChaveAcesso: vi.fn().mockReturnValue("12345678901234567890123456789012345678901234"),
  gerarXmlNFe: vi.fn().mockReturnValue("<nfe>...</nfe>"),
}));

import {
  getSefazConfig,
  getDadosEmitente,
  emitirNFe,
  cancelarNFe,
  emitirCartaCorrecao,
} from "./sefaz";
import { prisma } from "@/lib/prisma";

describe("SEFAZ Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSefazConfig", () => {
    it("should return null when company not found", async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

      const result = await getSefazConfig("company-1");

      expect(result).toBeNull();
    });

    it("should return null when company has no state", async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue({
        id: "company-1",
        cnpj: "12345678000190",
        ie: "123456789",
        state: null,
      } as never);

      const result = await getSefazConfig("company-1");

      expect(result).toBeNull();
    });

    it("should return config when company is valid", async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue({
        id: "company-1",
        cnpj: "12345678000190",
        ie: "123456789",
        state: "SP",
        address: "Rua Teste",
        city: "São Paulo",
        zipCode: "01234567",
      } as never);

      const result = await getSefazConfig("company-1");

      expect(result).not.toBeNull();
      expect(result?.uf).toBe("SP");
      expect(result?.ambiente).toBeDefined();
    });
  });

  describe("getDadosEmitente", () => {
    it("should return null when company not found", async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

      const result = await getDadosEmitente("company-1");

      expect(result).toBeNull();
    });

    it("should return emitente data when company exists", async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue({
        id: "company-1",
        name: "Empresa Teste",
        tradeName: "Teste",
        cnpj: "12345678000190",
        ie: "123456789",
        address: "Rua Teste, 123",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234567",
      } as never);

      const result = await getDadosEmitente("company-1");

      expect(result).not.toBeNull();
      expect(result?.cnpj).toBe("12345678000190");
      expect(result?.razaoSocial).toBe("Empresa Teste");
      expect(result?.endereco.uf).toBe("SP");
    });
  });

  describe("emitirNFe", () => {
    it("should return error when invoice not found", async () => {
      vi.mocked(prisma.issuedInvoice.findFirst).mockResolvedValue(null);

      const result = await emitirNFe("invoice-1", "company-1");

      expect(result.sucesso).toBe(false);
      expect(result.erro).toContain("não encontrada");
    });

    it("should return error when company not configured", async () => {
      vi.mocked(prisma.issuedInvoice.findFirst).mockResolvedValue({
        id: "invoice-1",
        code: "NF001",
        items: [],
      } as never);
      vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

      const result = await emitirNFe("invoice-1", "company-1");

      expect(result.sucesso).toBe(false);
      expect(result.erro).toContain("não configurada");
    });

it("should return error when emitente not found", async () => {
      vi.mocked(prisma.issuedInvoice.findFirst).mockResolvedValue({
        id: "invoice-1",
        code: "NF001",
        items: [],
      } as never);

      // First call for getSefazConfig, second for getDadosEmitente
      vi.mocked(prisma.company.findUnique)
        .mockResolvedValueOnce({ id: "company-1", state: "SP" } as never)
        .mockResolvedValueOnce(null);

      const result = await emitirNFe("invoice-1", "company-1");

      expect(result.sucesso).toBe(false);
      expect(result.erro).toContain("emitente");
    });
  });

  describe("cancelarNFe", () => {
    it("should return error when invoice not found", async () => {
      vi.mocked(prisma.issuedInvoice.findFirst).mockResolvedValue(null);

      const result = await cancelarNFe("invoice-1", "company-1", "Cancelamento por erro");

      expect(result.sucesso).toBe(false);
      expect(result.erro).toContain("não encontrada");
    });

    it("should return error when invoice has no accessKey", async () => {
      vi.mocked(prisma.issuedInvoice.findFirst).mockResolvedValue({
        id: "invoice-1",
        accessKey: null,
      } as never);

      const result = await cancelarNFe("invoice-1", "company-1", "Cancelamento por erro");

      expect(result.sucesso).toBe(false);
      expect(result.erro).toContain("não autorizada");
    });

    it("should return error when company not configured for cancel", async () => {
      vi.mocked(prisma.issuedInvoice.findFirst).mockResolvedValue({
        id: "invoice-1",
        accessKey: "12345678901234567890123456789012345678901234",
      } as never);

      vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

      const result = await cancelarNFe("invoice-1", "company-1", "Cancelamento por erro de digitação");

      expect(result.sucesso).toBe(false);
      expect(result.erro).toContain("não configurada");
    });
  });

  describe("emitirCartaCorrecao", () => {
    it("should return error when invoice not found", async () => {
      vi.mocked(prisma.issuedInvoice.findFirst).mockResolvedValue(null);

      const result = await emitirCartaCorrecao("invoice-1", "company-1", "Correção de dados", 1);

      expect(result.sucesso).toBe(false);
      expect(result.erro).toContain("não encontrada");
    });

    it("should return error when invoice has no accessKey", async () => {
      vi.mocked(prisma.issuedInvoice.findFirst).mockResolvedValue({
        id: "invoice-1",
        accessKey: null,
      } as never);

      const result = await emitirCartaCorrecao("invoice-1", "company-1", "Correção de dados", 1);

      expect(result.sucesso).toBe(false);
      expect(result.erro).toContain("não autorizada");
    });

    it("should return error when company not configured for carta correcao", async () => {
      vi.mocked(prisma.issuedInvoice.findFirst).mockResolvedValue({
        id: "invoice-1",
        accessKey: "12345678901234567890123456789012345678901234",
      } as never);

      vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

      const result = await emitirCartaCorrecao(
        "invoice-1",
        "company-1",
        "Correção do endereço de entrega",
        1
      );

      expect(result.sucesso).toBe(false);
      expect(result.erro).toContain("não configurada");
    });
  });
});
