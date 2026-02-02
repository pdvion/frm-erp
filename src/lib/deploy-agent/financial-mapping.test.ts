/**
 * Tests for Financial Flow Mapping
 * VIO-880
 */

import { describe, it, expect } from "vitest";
import {
  extractPaymentPatterns,
  extractNatureMappings,
  extractPaymentConditions,
  calculatePaymentMethodDistribution,
  generateFinancialConfiguration,
  getPaymentMethodDescription,
  getNaturezaSugerida,
  generateFinancialReport,
} from "./financial-mapping";
import type { NFeParsed, NFeItem } from "@/lib/nfe-parser";

const createMockItem = (overrides: Partial<NFeItem> = {}): NFeItem => ({
  numero: 1,
  codigo: "PROD001",
  descricao: "Produto Teste",
  cfop: 5102,
  unidade: "UN",
  quantidade: 10,
  valorUnitario: 100,
  valorTotal: 1000,
  ncm: "84829900",
  icms: { cst: "00", baseCalculo: 1000, aliquota: 18, valor: 180 },
  ipi: { cst: "50", baseCalculo: 0, aliquota: 0, valor: 0 },
  pis: { cst: "01", baseCalculo: 1000, aliquota: 1.65, valor: 16.5 },
  cofins: { cst: "01", baseCalculo: 1000, aliquota: 7.6, valor: 76 },
  ...overrides,
});

const createMockNFe = (overrides: Partial<NFeParsed> = {}): NFeParsed => ({
  chaveAcesso: "12345678901234567890123456789012345678901234",
  numero: 1,
  serie: 1,
  dataEmissao: new Date("2026-01-15"),
  naturezaOperacao: "Venda",
  tipoOperacao: 1,
  finalidade: 1,
  consumidorFinal: false,
  presencaComprador: 1,
  emitente: {
    cnpj: "12345678000199",
    razaoSocial: "Empresa Emitente",
    endereco: { uf: "SP" },
  },
  destinatario: {
    cnpj: "98765432000188",
    razaoSocial: "Empresa Destinatária",
    endereco: { uf: "RJ" },
  },
  itens: [createMockItem()],
  totais: {
    baseCalculoIcms: 1000,
    valorIcms: 180,
    baseCalculoIcmsSt: 0,
    valorIcmsSt: 0,
    valorIpi: 0,
    valorPis: 16.5,
    valorCofins: 76,
    valorFrete: 0,
    valorSeguro: 0,
    valorDesconto: 0,
    valorOutros: 0,
    valorProdutos: 1000,
    valorNota: 1000,
  },
  duplicatas: [],
  pagamentos: [],
  ...overrides,
});

describe("Financial Flow Mapping", () => {
  describe("getPaymentMethodDescription", () => {
    it("should return description for known codes", () => {
      expect(getPaymentMethodDescription("01")).toBe("Dinheiro");
      expect(getPaymentMethodDescription("03")).toBe("Cartão de Crédito");
      expect(getPaymentMethodDescription("17")).toBe("PIX");
      expect(getPaymentMethodDescription("15")).toBe("Boleto Bancário");
    });

    it("should return default for unknown codes", () => {
      expect(getPaymentMethodDescription("XX")).toBe("Forma XX");
    });
  });

  describe("getNaturezaSugerida", () => {
    it("should return natureza for known CFOPs", () => {
      const result = getNaturezaSugerida(5102);
      expect(result).not.toBeNull();
      expect(result?.natureza).toBe("Venda de Mercadoria Adquirida");
      expect(result?.tipo).toBe("receita");
    });

    it("should return natureza for entrada CFOPs", () => {
      const result = getNaturezaSugerida(1102);
      expect(result).not.toBeNull();
      expect(result?.natureza).toBe("Compra para Comercialização");
      expect(result?.tipo).toBe("despesa");
    });

    it("should return null for unknown CFOPs", () => {
      expect(getNaturezaSugerida(9999)).toBeNull();
    });
  });

  describe("extractPaymentPatterns", () => {
    it("should extract payment patterns from NFes", () => {
      const nfes = [
        createMockNFe({
          pagamentos: [
            { forma: "17", valor: 500 },
            { forma: "17", valor: 500 },
          ],
        }),
        createMockNFe({
          pagamentos: [{ forma: "15", valor: 1000 }],
        }),
      ];

      const result = extractPaymentPatterns(nfes);

      expect(result.length).toBeGreaterThan(0);
      const pixPattern = result.find((p) => p.formaPagamento === "17");
      expect(pixPattern).toBeDefined();
      expect(pixPattern?.frequency).toBe(2);
    });

    it("should calculate average value", () => {
      const nfes = [
        createMockNFe({
          pagamentos: [
            { forma: "01", valor: 100 },
            { forma: "01", valor: 200 },
          ],
        }),
      ];

      const result = extractPaymentPatterns(nfes);
      const dinheiroPattern = result.find((p) => p.formaPagamento === "01");

      expect(dinheiroPattern?.valorMedio).toBe(150);
    });
  });

  describe("extractNatureMappings", () => {
    it("should extract nature mappings from CFOPs", () => {
      const nfes = [
        createMockNFe({
          itens: [
            createMockItem({ cfop: 5102 }),
            createMockItem({ cfop: 5102 }),
            createMockItem({ cfop: 6102 }),
          ],
        }),
      ];

      const result = extractNatureMappings(nfes);

      expect(result.length).toBe(2);
      const cfop5102 = result.find((m) => m.cfop === 5102);
      expect(cfop5102?.occurrences).toBe(2);
      expect(cfop5102?.tipo).toBe("receita");
    });

    it("should identify despesa for entrada CFOPs", () => {
      const nfes = [
        createMockNFe({
          tipoOperacao: 0,
          itens: [createMockItem({ cfop: 1102 })],
        }),
      ];

      const result = extractNatureMappings(nfes);

      expect(result[0].tipo).toBe("despesa");
    });
  });

  describe("extractPaymentConditions", () => {
    it("should extract payment conditions from duplicatas", () => {
      const nfes = [
        createMockNFe({
          dataEmissao: new Date("2026-01-01"),
          duplicatas: [
            { numero: "1", vencimento: new Date("2026-01-31"), valor: 500 },
            { numero: "2", vencimento: new Date("2026-02-28"), valor: 500 },
          ],
        }),
      ];

      const result = extractPaymentConditions(nfes);

      expect(result.length).toBe(1);
      expect(result[0].numeroParcelas).toBe(2);
      expect(result[0].diasPrimeiraParcela).toBe(30);
    });

    it("should handle single payment", () => {
      const nfes = [
        createMockNFe({
          dataEmissao: new Date("2026-01-01"),
          duplicatas: [{ numero: "1", vencimento: new Date("2026-01-31"), valor: 1000 }],
        }),
      ];

      const result = extractPaymentConditions(nfes);

      expect(result[0].numeroParcelas).toBe(1);
      expect(result[0].descricao).toContain("30 dias");
    });
  });

  describe("calculatePaymentMethodDistribution", () => {
    it("should calculate distribution percentages", () => {
      const nfes = [
        createMockNFe({
          pagamentos: [
            { forma: "17", valor: 500 },
            { forma: "17", valor: 500 },
            { forma: "15", valor: 1000 },
            { forma: "01", valor: 500 },
          ],
        }),
      ];

      const result = calculatePaymentMethodDistribution(nfes);

      expect(result["17"].count).toBe(2);
      expect(result["17"].percentage).toBe(50);
      expect(result["15"].count).toBe(1);
      expect(result["15"].percentage).toBe(25);
    });
  });

  describe("generateFinancialConfiguration", () => {
    it("should generate complete configuration", () => {
      const nfes = [
        createMockNFe({
          tipoOperacao: 1,
          totais: { valorNota: 1000 } as NFeParsed["totais"],
          pagamentos: [{ forma: "17", valor: 1000 }],
          duplicatas: [{ numero: "1", vencimento: new Date("2026-02-15"), valor: 1000 }],
        }),
        createMockNFe({
          tipoOperacao: 0,
          totais: { valorNota: 500 } as NFeParsed["totais"],
          pagamentos: [{ forma: "15", valor: 500 }],
        }),
      ];

      const result = generateFinancialConfiguration(nfes);

      expect(result.statistics.totalNfes).toBe(2);
      expect(result.statistics.valorTotalVendas).toBe(1000);
      expect(result.statistics.valorTotalCompras).toBe(500);
      expect(result.paymentPatterns.length).toBeGreaterThan(0);
      expect(result.natureMappings.length).toBeGreaterThan(0);
    });
  });

  describe("generateFinancialReport", () => {
    it("should generate text report", () => {
      const config = generateFinancialConfiguration([
        createMockNFe({
          pagamentos: [{ forma: "17", valor: 1000 }],
        }),
      ]);
      const report = generateFinancialReport(config);

      expect(report).toContain("RELATÓRIO DE CONFIGURAÇÃO FINANCEIRA");
      expect(report).toContain("Estatísticas");
      expect(report).toContain("Formas de Pagamento");
    });
  });
});
