/**
 * Testes para Delphi Data Importer
 * VIO-776: Base de dados para validar
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseDelphiCSV,
  importDelphiCustomers,
  importDelphiInvoices,
  type DelphiCliente,
  type DelphiNFeEmitida,
} from "./index";

// Mock do Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    customer: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    issuedInvoice: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("Delphi Importer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parseDelphiCSV", () => {
    it("deve fazer parse de CSV com separador ;", () => {
      const csv = `codCliente;cliente;codCNPJ
1;Cliente Teste;12345678000190
2;Outro Cliente;98765432000121`;

      const result = parseDelphiCSV<DelphiCliente>(csv);

      expect(result).toHaveLength(2);
      expect(result[0].codCliente).toBe("1");
      expect(result[0].cliente).toBe("Cliente Teste");
      expect(result[0].codCNPJ).toBe("12345678000190");
      expect(result[1].codCliente).toBe("2");
    });

    it("deve retornar array vazio para CSV sem dados", () => {
      const csv = `codCliente;cliente`;
      const result = parseDelphiCSV<DelphiCliente>(csv);
      expect(result).toHaveLength(0);
    });

    it("deve lidar com campos vazios", () => {
      const csv = `codCliente;cliente;bairro
1;Cliente;;`;

      const result = parseDelphiCSV<DelphiCliente>(csv);

      expect(result).toHaveLength(1);
      expect(result[0].bairro).toBe("");
    });

    it("deve ignorar linhas vazias", () => {
      const csv = `codCliente;cliente

1;Cliente

2;Outro`;

      const result = parseDelphiCSV<DelphiCliente>(csv);
      expect(result).toHaveLength(2);
    });
  });

  describe("importDelphiCustomers", () => {
    const mockCompanyId = "company-123";

    it("deve criar cliente novo", async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.customer.create).mockResolvedValue({
        id: "new-customer-id",
        code: "1",
        companyName: "Cliente Teste",
      } as never);

      const customers: DelphiCliente[] = [
        {
          codCliente: "1",
          cliente: "Cliente Teste",
          codCNPJ: "12345678000190",
          cidade: "São Paulo",
          stateUf: "SP",
        },
      ];

      const result = await importDelphiCustomers(customers, mockCompanyId);

      expect(result.created).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
      expect(prisma.customer.create).toHaveBeenCalledTimes(1);
    });

    it("deve pular cliente existente sem updateIfExists", async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({
        id: "existing-id",
        code: "1",
      } as never);

      const customers: DelphiCliente[] = [
        {
          codCliente: "1",
          cliente: "Cliente Existente",
          codCNPJ: "12345678000190",
        },
      ];

      const result = await importDelphiCustomers(customers, mockCompanyId);

      expect(result.skipped).toBe(1);
      expect(result.created).toBe(0);
      expect(prisma.customer.create).not.toHaveBeenCalled();
    });

    it("deve atualizar cliente existente com updateIfExists", async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({
        id: "existing-id",
        code: "1",
        addressStreet: "Rua Antiga",
      } as never);
      vi.mocked(prisma.customer.update).mockResolvedValue({
        id: "existing-id",
      } as never);

      const customers: DelphiCliente[] = [
        {
          codCliente: "1",
          cliente: "Cliente Existente",
          codCNPJ: "12345678000190",
          logradouro: "Rua Nova",
        },
      ];

      const result = await importDelphiCustomers(customers, mockCompanyId, {
        updateIfExists: true,
      });

      expect(result.updated).toBe(1);
      expect(prisma.customer.update).toHaveBeenCalledTimes(1);
    });

    it("deve pular cliente sem CNPJ/CPF válido", async () => {
      const customers: DelphiCliente[] = [
        {
          codCliente: "1",
          cliente: "Cliente Sem Doc",
          codCNPJ: "123", // inválido
        },
      ];

      const result = await importDelphiCustomers(customers, mockCompanyId);

      expect(result.skipped).toBe(1);
      expect(result.results[0].reason).toContain("inválido");
    });

    it("deve simular importação com dryRun", async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      const customers: DelphiCliente[] = [
        {
          codCliente: "1",
          cliente: "Cliente Teste",
          codCNPJ: "12345678000190",
        },
      ];

      const result = await importDelphiCustomers(customers, mockCompanyId, {
        dryRun: true,
      });

      expect(result.created).toBe(1);
      expect(result.results[0].reason).toContain("Simulação");
      expect(prisma.customer.create).not.toHaveBeenCalled();
    });

    it("deve aceitar CPF válido", async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.customer.create).mockResolvedValue({
        id: "new-id",
      } as never);

      const customers: DelphiCliente[] = [
        {
          codCliente: "1",
          cliente: "Pessoa Física",
          codCNPJ: "12345678901", // CPF
        },
      ];

      const result = await importDelphiCustomers(customers, mockCompanyId);

      expect(result.created).toBe(1);
      expect(prisma.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cpf: "123.456.789-01",
          }),
        })
      );
    });
  });

  describe("importDelphiInvoices", () => {
    const mockCompanyId = "company-123";

    it("deve criar NFe nova", async () => {
      vi.mocked(prisma.issuedInvoice.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({
        id: "customer-id",
      } as never);
      vi.mocked(prisma.issuedInvoice.create).mockResolvedValue({
        id: "new-invoice-id",
      } as never);

      const invoices: DelphiNFeEmitida[] = [
        {
          codEmissaoNF: "1",
          numNF: "12345",
          chaveNFe: "35260112345678000190550010000123451234567890",
          dtEmissao: "2026-01-15",
          codCliente: "1",
          vlrTotalProd: "1000,00",
          vlrNfe: "1100,00",
        },
      ];

      const result = await importDelphiInvoices(invoices, mockCompanyId);

      expect(result.created).toBe(1);
      expect(prisma.issuedInvoice.create).toHaveBeenCalledTimes(1);
    });

    it("deve pular NFe sem número", async () => {
      const invoices: DelphiNFeEmitida[] = [
        {
          codEmissaoNF: "1",
          numNF: "",
        },
      ];

      const result = await importDelphiInvoices(invoices, mockCompanyId);

      expect(result.skipped).toBe(1);
      expect(result.results[0].reason).toContain("não informado");
    });

    it("deve pular NFe existente", async () => {
      vi.mocked(prisma.issuedInvoice.findFirst).mockResolvedValue({
        id: "existing-id",
      } as never);

      const invoices: DelphiNFeEmitida[] = [
        {
          codEmissaoNF: "1",
          numNF: "12345",
          chaveNFe: "35260112345678000190550010000123451234567890",
        },
      ];

      const result = await importDelphiInvoices(invoices, mockCompanyId);

      expect(result.skipped).toBe(1);
    });

    it("deve simular importação com dryRun", async () => {
      vi.mocked(prisma.issuedInvoice.findFirst).mockResolvedValue(null);

      const invoices: DelphiNFeEmitida[] = [
        {
          codEmissaoNF: "1",
          numNF: "12345",
        },
      ];

      const result = await importDelphiInvoices(invoices, mockCompanyId, {
        dryRun: true,
      });

      expect(result.created).toBe(1);
      expect(result.results[0].reason).toContain("Simulação");
      expect(prisma.issuedInvoice.create).not.toHaveBeenCalled();
    });

    it("deve converter valores com vírgula", async () => {
      vi.mocked(prisma.issuedInvoice.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({
        id: "customer-id",
      } as never);
      vi.mocked(prisma.issuedInvoice.create).mockResolvedValue({
        id: "new-id",
      } as never);

      const invoices: DelphiNFeEmitida[] = [
        {
          codEmissaoNF: "1",
          numNF: "12345",
          codCliente: "1",
          vlrTotalProd: "1.234,56",
          vlrNfe: "1500,00",
        },
      ];

      await importDelphiInvoices(invoices, mockCompanyId);

      expect(prisma.issuedInvoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalValue: 1500,
          }),
        })
      );
    });

    it("deve pular NFe sem cliente encontrado", async () => {
      vi.mocked(prisma.issuedInvoice.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      const invoices: DelphiNFeEmitida[] = [
        {
          codEmissaoNF: "1",
          numNF: "12345",
          codCliente: "999",
        },
      ];

      const result = await importDelphiInvoices(invoices, mockCompanyId);

      expect(result.skipped).toBe(1);
      expect(result.results[0].reason).toContain("Cliente não encontrado");
    });
  });
});
