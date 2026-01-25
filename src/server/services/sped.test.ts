import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    company: {
      findUnique: vi.fn(),
    },
    supplier: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    customer: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    receivedInvoice: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    issuedInvoice: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    receivedInvoiceItem: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    issuedInvoiceItem: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    inventory: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

// Mock SPED lib
vi.mock("@/lib/sped/efd-icms-ipi", () => ({
  gerarSpedFiscal: vi.fn().mockReturnValue("SPED_CONTENT"),
  validarSped: vi.fn().mockReturnValue({ valido: true, erros: [] }),
}));

import { gerarArquivoSped, listarPeriodosDisponiveis } from "./sped";
import { prisma } from "@/lib/prisma";

describe("SPED Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("gerarArquivoSped", () => {
    it("should return error when company not found", async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

      const result = await gerarArquivoSped({
        companyId: "company-1",
        dataInicial: new Date("2026-01-01"),
        dataFinal: new Date("2026-01-31"),
      });

      expect(result.sucesso).toBe(false);
      expect(result.erro).toContain("Empresa não encontrada");
    });

    it("should return error when company has incomplete fiscal data", async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue({
        id: "company-1",
        name: "Test Company",
        cnpj: null,
        ie: null,
        state: null,
      } as never);

      const result = await gerarArquivoSped({
        companyId: "company-1",
        dataInicial: new Date("2026-01-01"),
        dataFinal: new Date("2026-01-31"),
      });

      expect(result.sucesso).toBe(false);
      expect(result.erro).toContain("dados fiscais incompletos");
    });

    it("should generate SPED file successfully", async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue({
        id: "company-1",
        name: "Test Company",
        cnpj: "12.345.678/0001-90",
        ie: "123456789",
        state: "SP",
      } as never);

      const result = await gerarArquivoSped({
        companyId: "company-1",
        dataInicial: new Date("2026-01-01"),
        dataFinal: new Date("2026-01-31"),
      });

      expect(result.sucesso).toBe(true);
      expect(result.conteudo).toBe("SPED_CONTENT");
      expect(result.nomeArquivo).toContain("SPED_");
      expect(result.nomeArquivo).toMatch(/SPED_\d+_\d{6}\.txt/);
    });

    it("should include inventory when requested", async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue({
        id: "company-1",
        name: "Test Company",
        cnpj: "12.345.678/0001-90",
        ie: "123456789",
        state: "SP",
      } as never);

      vi.mocked(prisma.inventory.findMany).mockResolvedValue([
        {
          id: "inv-1",
          quantity: 100,
          material: { code: 1, unit: "UN", lastPurchasePrice: 10 },
        },
      ] as never);

      const result = await gerarArquivoSped({
        companyId: "company-1",
        dataInicial: new Date("2026-01-01"),
        dataFinal: new Date("2026-01-31"),
        incluirInventario: true,
        dataInventario: new Date("2026-01-31"),
      });

      expect(result.sucesso).toBe(true);
      expect(prisma.inventory.findMany).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      vi.mocked(prisma.company.findUnique).mockRejectedValue(
        new Error("Database error")
      );

      const result = await gerarArquivoSped({
        companyId: "company-1",
        dataInicial: new Date("2026-01-01"),
        dataFinal: new Date("2026-01-31"),
      });

      expect(result.sucesso).toBe(false);
      expect(result.erro).toBe("Database error");
    });
  });

  describe("listarPeriodosDisponiveis", () => {
    it("should return empty array when no invoices", async () => {
      vi.mocked(prisma.receivedInvoice.findMany).mockResolvedValue([]);
      vi.mocked(prisma.issuedInvoice.findMany).mockResolvedValue([]);

      const result = await listarPeriodosDisponiveis("company-1");

      expect(result).toEqual([]);
    });

    it("should return unique periods from received invoices", async () => {
      vi.mocked(prisma.receivedInvoice.findMany).mockResolvedValue([
        { issueDate: new Date("2026-01-15") },
        { issueDate: new Date("2026-01-20") },
        { issueDate: new Date("2026-02-10") },
      ] as never);
      vi.mocked(prisma.issuedInvoice.findMany).mockResolvedValue([]);

      const result = await listarPeriodosDisponiveis("company-1");

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ mes: 2, ano: 2026, temDados: true });
      expect(result).toContainEqual({ mes: 1, ano: 2026, temDados: true });
    });

    it("should return unique periods from issued invoices", async () => {
      vi.mocked(prisma.receivedInvoice.findMany).mockResolvedValue([]);
      vi.mocked(prisma.issuedInvoice.findMany).mockResolvedValue([
        { issueDate: new Date("2026-03-15") },
        { issueDate: new Date("2026-04-10") },
      ] as never);

      const result = await listarPeriodosDisponiveis("company-1");

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ mes: 4, ano: 2026, temDados: true });
      expect(result).toContainEqual({ mes: 3, ano: 2026, temDados: true });
    });

    it("should merge periods from both invoice types", async () => {
      vi.mocked(prisma.receivedInvoice.findMany).mockResolvedValue([
        { issueDate: new Date("2026-01-15") },
      ] as never);
      vi.mocked(prisma.issuedInvoice.findMany).mockResolvedValue([
        { issueDate: new Date("2026-01-20") },
        { issueDate: new Date("2026-02-10") },
      ] as never);

      const result = await listarPeriodosDisponiveis("company-1");

      expect(result).toHaveLength(2);
    });

    it("should sort periods by year and month descending", async () => {
      vi.mocked(prisma.receivedInvoice.findMany).mockResolvedValue([
        { issueDate: new Date("2025-12-15") },
        { issueDate: new Date("2026-01-15") },
        { issueDate: new Date("2026-03-15") },
      ] as never);
      vi.mocked(prisma.issuedInvoice.findMany).mockResolvedValue([]);

      const result = await listarPeriodosDisponiveis("company-1");

      expect(result[0]).toEqual({ mes: 3, ano: 2026, temDados: true });
      expect(result[1]).toEqual({ mes: 1, ano: 2026, temDados: true });
      expect(result[2]).toEqual({ mes: 12, ano: 2025, temDados: true });
    });
  });
});
