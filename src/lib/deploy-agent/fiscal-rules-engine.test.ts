/**
 * Tests for Fiscal Rules Engine
 * VIO-876
 */

import { describe, it, expect } from "vitest";
import {
  extractFiscalPattern,
  analyzeFiscalPatterns,
  getCfopDescription,
  getCstIcmsDescription,
  suggestCfopForOperation,
} from "./fiscal-rules-engine";
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
  dataEmissao: new Date(),
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

describe("Fiscal Rules Engine", () => {
  describe("extractFiscalPattern", () => {
    it("should extract fiscal pattern from NFe item", () => {
      const nfe = createMockNFe();
      const item = nfe.itens[0];
      const pattern = extractFiscalPattern(item, nfe);

      expect(pattern.cfop).toBe(5102);
      expect(pattern.cstIcms).toBe("00");
      expect(pattern.cstPis).toBe("01");
      expect(pattern.cstCofins).toBe("01");
      expect(pattern.aliquotaIcms).toBe(18);
      expect(pattern.aliquotaPis).toBe(1.65);
      expect(pattern.aliquotaCofins).toBe(7.6);
      expect(pattern.ncm).toBe("84829900");
      expect(pattern.ufOrigem).toBe("SP");
      expect(pattern.ufDestino).toBe("RJ");
      expect(pattern.tipoOperacao).toBe("saida");
    });

    it("should identify entrada operation", () => {
      const nfe = createMockNFe({ tipoOperacao: 0 });
      const item = nfe.itens[0];
      const pattern = extractFiscalPattern(item, nfe);

      expect(pattern.tipoOperacao).toBe("entrada");
    });
  });

  describe("analyzeFiscalPatterns", () => {
    it("should analyze multiple NFes", () => {
      const nfes = [
        createMockNFe(),
        createMockNFe({
          itens: [createMockItem({ cfop: 6102, ncm: "84829900" })],
        }),
        createMockNFe({
          itens: [createMockItem({ cfop: 5102, ncm: "73181500" })],
        }),
      ];

      const result = analyzeFiscalPatterns(nfes);

      expect(result.statistics.totalItems).toBe(3);
      expect(result.statistics.uniqueCfops).toBe(2);
      expect(result.statistics.uniqueNcms).toBe(2);
      expect(result.patterns.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it("should calculate CFOP distribution", () => {
      const nfes = [
        createMockNFe({ itens: [createMockItem({ cfop: 5102 })] }),
        createMockNFe({ itens: [createMockItem({ cfop: 5102 })] }),
        createMockNFe({ itens: [createMockItem({ cfop: 6102 })] }),
      ];

      const result = analyzeFiscalPatterns(nfes);

      expect(result.cfopDistribution[5102].count).toBe(2);
      expect(result.cfopDistribution[6102].count).toBe(1);
    });

    it("should generate suggestions by NCM", () => {
      const nfes = [
        createMockNFe({ itens: [createMockItem({ ncm: "84829900" })] }),
        createMockNFe({ itens: [createMockItem({ ncm: "84829100" })] }),
        createMockNFe({ itens: [createMockItem({ ncm: "73181500" })] }),
      ];

      const result = analyzeFiscalPatterns(nfes);

      const ncm8482Suggestion = result.suggestions.find((s) =>
        s.ncmPattern?.startsWith("8482")
      );
      expect(ncm8482Suggestion).toBeDefined();
      expect(ncm8482Suggestion?.occurrences).toBe(2);
    });

    it("should handle empty NFe list", () => {
      const result = analyzeFiscalPatterns([]);

      expect(result.statistics.totalItems).toBe(0);
      expect(result.patterns.length).toBe(0);
      expect(result.suggestions.length).toBe(0);
    });
  });

  describe("getCfopDescription", () => {
    it("should return description for known CFOP", () => {
      expect(getCfopDescription(5102)).toBe("Venda de mercadoria adquirida");
      expect(getCfopDescription(1102)).toBe("Compra para comercialização");
    });

    it("should return default for unknown CFOP", () => {
      expect(getCfopDescription(9999)).toBe("Não especificado");
    });
  });

  describe("getCstIcmsDescription", () => {
    it("should return description for known CST", () => {
      expect(getCstIcmsDescription("00")).toBe("Tributada integralmente");
      expect(getCstIcmsDescription("60")).toBe("ICMS cobrado anteriormente por ST");
    });

    it("should return default for unknown CST", () => {
      expect(getCstIcmsDescription("99")).toBe("Não especificado");
    });
  });

  describe("suggestCfopForOperation", () => {
    it("should suggest CFOP for entrada dentro do estado", () => {
      expect(suggestCfopForOperation("entrada", "comercializacao", true)).toBe(1102);
      expect(suggestCfopForOperation("entrada", "industrializacao", true)).toBe(1101);
    });

    it("should suggest CFOP for entrada fora do estado", () => {
      expect(suggestCfopForOperation("entrada", "comercializacao", false)).toBe(2102);
      expect(suggestCfopForOperation("entrada", "industrializacao", false)).toBe(2101);
    });

    it("should suggest CFOP for saida dentro do estado", () => {
      expect(suggestCfopForOperation("saida", "comercializacao", true)).toBe(5102);
      expect(suggestCfopForOperation("saida", "industrializacao", true)).toBe(5101);
    });

    it("should suggest CFOP for saida fora do estado", () => {
      expect(suggestCfopForOperation("saida", "comercializacao", false)).toBe(6102);
      expect(suggestCfopForOperation("saida", "industrializacao", false)).toBe(6101);
    });

    it("should suggest CFOP for ativo imobilizado", () => {
      expect(suggestCfopForOperation("entrada", "ativo", true)).toBe(1551);
      expect(suggestCfopForOperation("saida", "ativo", false)).toBe(6551);
    });

    it("should suggest CFOP for consumo", () => {
      expect(suggestCfopForOperation("entrada", "consumo", true)).toBe(1556);
      expect(suggestCfopForOperation("saida", "consumo", false)).toBe(6910);
    });
  });
});
