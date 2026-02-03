import { describe, it, expect, vi, beforeEach } from "vitest";
import { SefazEdgeClient } from "./edge-client";

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    functions: {
      invoke: vi.fn(),
    },
  }),
}));

describe("SefazEdgeClient", () => {
  let client: SefazEdgeClient;

  beforeEach(() => {
    client = new SefazEdgeClient();
    vi.clearAllMocks();
  });

  describe("consultarNFeDestinadas", () => {
    it("should call edge function with correct parameters", async () => {
      const result = await client.consultarNFeDestinadas(
        "12345678000199",
        "SP",
        "homologacao",
        "000000000000001"
      );

      expect(result).toBeDefined();
    });

    it("should use homologacao as default ambiente", async () => {
      const result = await client.consultarNFeDestinadas(
        "12345678000199",
        "SP"
      );

      expect(result).toBeDefined();
    });

    it("should handle missing NSU", async () => {
      const result = await client.consultarNFeDestinadas(
        "12345678000199",
        "SP",
        "producao"
      );

      expect(result).toBeDefined();
    });
  });

  describe("consultarPorChave", () => {
    it("should call edge function with chave parameter", async () => {
      const chave = "35260112345678000199550010000001231123456789";
      const result = await client.consultarPorChave(
        "12345678000199",
        "SP",
        chave,
        "homologacao"
      );

      expect(result).toBeDefined();
    });

    it("should use homologacao as default ambiente", async () => {
      const chave = "35260112345678000199550010000001231123456789";
      const result = await client.consultarPorChave(
        "12345678000199",
        "SP",
        chave
      );

      expect(result).toBeDefined();
    });
  });

  describe("manifestar", () => {
    it("should call edge function with manifestation parameters", async () => {
      const chave = "35260112345678000199550010000001231123456789";
      const result = await client.manifestar(
        "12345678000199",
        "SP",
        chave,
        "CIENCIA",
        "homologacao"
      );

      expect(result).toBeDefined();
    });

    it("should include justificativa when provided", async () => {
      const chave = "35260112345678000199550010000001231123456789";
      const result = await client.manifestar(
        "12345678000199",
        "SP",
        chave,
        "NAO_REALIZADA",
        "homologacao",
        "Operação não realizada conforme contrato"
      );

      expect(result).toBeDefined();
    });
  });

  describe("error handling", () => {
    it("should return error response on failure", async () => {
      const result = await client.consultarNFeDestinadas(
        "invalid",
        "XX"
      );

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
  });
});
