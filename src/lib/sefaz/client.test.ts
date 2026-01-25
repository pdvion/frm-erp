import { describe, it, expect, vi, beforeEach } from "vitest";
import { SefazClient, createSefazClient } from "./client";
import type { SefazConfig } from "./types";

// Mock xml-signer
vi.mock("./xml-signer", () => ({
  signXml: vi.fn().mockReturnValue({
    success: true,
    signedXml: "<signed>xml</signed>",
  }),
}));

describe("SefazClient", () => {
  const mockConfig: SefazConfig = {
    environment: "homologacao",
    uf: "SP",
    cnpj: "12345678000199",
    certificate: {
      password: "test123",
    },
  };

  let client: SefazClient;

  beforeEach(() => {
    client = new SefazClient(mockConfig);
  });

  describe("constructor", () => {
    it("should create client with config", () => {
      expect(client).toBeInstanceOf(SefazClient);
    });

    it("should use homologacao URLs for homologacao environment", () => {
      const homologClient = new SefazClient({ ...mockConfig, environment: "homologacao" });
      expect(homologClient).toBeInstanceOf(SefazClient);
    });

    it("should use producao URLs for producao environment", () => {
      const prodClient = new SefazClient({ ...mockConfig, environment: "producao" });
      expect(prodClient).toBeInstanceOf(SefazClient);
    });
  });

  describe("setCertificate", () => {
    it("should set certificate and private key", () => {
      client.setCertificate("privateKey", "certificate");
      expect(client.hasCertificate()).toBe(true);
    });
  });

  describe("hasCertificate", () => {
    it("should return false when no certificate is set", () => {
      expect(client.hasCertificate()).toBe(false);
    });

    it("should return true when certificate is set", () => {
      client.setCertificate("privateKey", "certificate");
      expect(client.hasCertificate()).toBe(true);
    });
  });

  describe("consultarNFeDestinadas", () => {
    it("should return success result", async () => {
      const result = await client.consultarNFeDestinadas();

      expect(result.success).toBe(true);
      expect(result.nfes).toEqual([]);
      expect(result.totalRegistros).toBe(0);
    });

    it("should use provided NSU", async () => {
      const result = await client.consultarNFeDestinadas("000000000000001");

      expect(result.success).toBe(true);
      expect(result.ultimaNSU).toBe("000000000000001");
    });

    it("should use default NSU when not provided", async () => {
      const result = await client.consultarNFeDestinadas();

      expect(result.ultimaNSU).toBe("000000000000000");
    });
  });

  describe("consultarPorChave", () => {
    it("should return error for invalid chave length", async () => {
      const result = await client.consultarPorChave("123");

      expect(result.success).toBe(false);
      expect(result.message).toContain("44 dígitos");
    });

    it("should return success for valid chave", async () => {
      const chave = "35260112345678000199550010000001231123456789";
      const result = await client.consultarPorChave(chave);

      expect(result.success).toBe(true);
    });
  });

  describe("manifestar", () => {
    const validChave = "35260112345678000199550010000001231123456789";

    it("should return error for invalid chave length", async () => {
      const result = await client.manifestar("123", "CIENCIA");

      expect(result.success).toBe(false);
      expect(result.message).toContain("44 dígitos");
    });

    it("should return success for CIENCIA manifestation", async () => {
      const result = await client.manifestar(validChave, "CIENCIA");

      expect(result.success).toBe(true);
      expect(result.message).toContain("CIENCIA");
    });

    it("should return success for CONFIRMACAO manifestation", async () => {
      const result = await client.manifestar(validChave, "CONFIRMACAO");

      expect(result.success).toBe(true);
      expect(result.message).toContain("CONFIRMACAO");
    });

    it("should return success for DESCONHECIMENTO manifestation", async () => {
      const result = await client.manifestar(validChave, "DESCONHECIMENTO");

      expect(result.success).toBe(true);
      expect(result.message).toContain("DESCONHECIMENTO");
    });

    it("should require justificativa for NAO_REALIZADA", async () => {
      const result = await client.manifestar(validChave, "NAO_REALIZADA");

      expect(result.success).toBe(false);
      expect(result.message).toContain("Justificativa obrigatória");
    });

    it("should require minimum 15 chars justificativa for NAO_REALIZADA", async () => {
      const result = await client.manifestar(validChave, "NAO_REALIZADA", "curta");

      expect(result.success).toBe(false);
      expect(result.message).toContain("mínimo 15 caracteres");
    });

    it("should accept valid justificativa for NAO_REALIZADA", async () => {
      const result = await client.manifestar(
        validChave, 
        "NAO_REALIZADA", 
        "Operação não realizada por motivo de teste"
      );

      expect(result.success).toBe(true);
      expect(result.protocolo).toBeDefined();
      expect(result.dataRecebimento).toBeInstanceOf(Date);
    });
  });
});

describe("createSefazClient", () => {
  it("should create a SefazClient instance", () => {
    const config: SefazConfig = {
      environment: "homologacao",
      uf: "SP",
      cnpj: "12345678000199",
      certificate: {
        password: "test123",
      },
    };

    const client = createSefazClient(config);

    expect(client).toBeInstanceOf(SefazClient);
  });
});
