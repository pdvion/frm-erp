import { describe, it, expect } from "vitest";
import {
  getNcmInfo,
  suggestCategory,
  suggestUnit,
  normalizeUnit,
  validateNcm,
  findSimilarProducts,
  analyzeNcmPatterns,
  generateNcmReport,
} from "./ncm-intelligence";
import type { NFeParsed } from "@/lib/nfe-parser";

describe("NCM Intelligence", () => {
  describe("getNcmInfo", () => {
    it("should return info for valid NCM", () => {
      const info = getNcmInfo("84818099");
      expect(info).not.toBeNull();
      expect(info?.categoria).toBe("Válvulas");
      expect(info?.unidadePadrao).toBe("UN");
    });

    it("should return info for NCM prefix", () => {
      const info = getNcmInfo("8481");
      expect(info).not.toBeNull();
      expect(info?.categoria).toBe("Válvulas");
    });

    it("should return info for chapter only", () => {
      const info = getNcmInfo("84");
      expect(info).not.toBeNull();
      expect(info?.categoria).toBe("Máquinas");
    });

    it("should return null for unknown NCM", () => {
      const info = getNcmInfo("99999999");
      expect(info).toBeNull();
    });

    it("should return null for empty NCM", () => {
      const info = getNcmInfo("");
      expect(info).toBeNull();
    });

    it("should parse NCM structure correctly", () => {
      const info = getNcmInfo("84821010");
      expect(info?.capitulo).toBe("84");
      expect(info?.posicao).toBe("8482");
      expect(info?.subposicao).toBe("848210");
    });
  });

  describe("suggestCategory", () => {
    it("should suggest category for machinery NCM", () => {
      const suggestion = suggestCategory("84818099");
      expect(suggestion).not.toBeNull();
      expect(suggestion?.value).toBe("Válvulas");
      expect(suggestion?.field).toBe("categoria");
    });

    it("should suggest category for electrical NCM", () => {
      const suggestion = suggestCategory("85444900");
      expect(suggestion).not.toBeNull();
      expect(suggestion?.value).toBe("Cabos");
    });

    it("should have higher confidence for full NCM", () => {
      const fullNcm = suggestCategory("84818099");
      const partialNcm = suggestCategory("8481");
      expect(fullNcm?.confidence).toBeGreaterThan(partialNcm?.confidence || 0);
    });

    it("should return null for unknown NCM", () => {
      const suggestion = suggestCategory("99999999");
      expect(suggestion).toBeNull();
    });
  });

  describe("suggestUnit", () => {
    it("should suggest UN for machinery", () => {
      const suggestion = suggestUnit("84818099");
      expect(suggestion?.value).toBe("UN");
    });

    it("should suggest M for cables", () => {
      const suggestion = suggestUnit("85444900");
      expect(suggestion?.value).toBe("M");
    });

    it("should suggest KG for metals", () => {
      const suggestion = suggestUnit("72142000");
      expect(suggestion?.value).toBe("KG");
    });

    it("should suggest L for fuels", () => {
      const suggestion = suggestUnit("27101259");
      expect(suggestion?.value).toBe("L");
    });

    it("should suggest RS for paper", () => {
      const suggestion = suggestUnit("48025610");
      expect(suggestion?.value).toBe("RS");
    });
  });

  describe("normalizeUnit", () => {
    it("should normalize UN variants", () => {
      expect(normalizeUnit("UN")).toBe("UN");
      expect(normalizeUnit("UND")).toBe("UN");
      expect(normalizeUnit("UNID")).toBe("UN");
      expect(normalizeUnit("UNIDADE")).toBe("UN");
      expect(normalizeUnit("PC")).toBe("UN");
      expect(normalizeUnit("PÇ")).toBe("UN");
    });

    it("should normalize KG variants", () => {
      expect(normalizeUnit("KG")).toBe("KG");
      expect(normalizeUnit("K")).toBe("KG");
      expect(normalizeUnit("KILO")).toBe("KG");
      expect(normalizeUnit("QUILO")).toBe("KG");
    });

    it("should normalize L variants", () => {
      expect(normalizeUnit("L")).toBe("L");
      expect(normalizeUnit("LT")).toBe("L");
      expect(normalizeUnit("LITRO")).toBe("L");
    });

    it("should normalize M variants", () => {
      expect(normalizeUnit("M")).toBe("M");
      expect(normalizeUnit("MT")).toBe("M");
      expect(normalizeUnit("METRO")).toBe("M");
    });

    it("should handle case insensitivity", () => {
      expect(normalizeUnit("un")).toBe("UN");
      expect(normalizeUnit("Kg")).toBe("KG");
    });

    it("should return original for unknown units", () => {
      expect(normalizeUnit("XYZ")).toBe("XYZ");
    });
  });

  describe("validateNcm", () => {
    it("should validate matching NCM and description", () => {
      const result = validateNcm("84821010", "Rolamento de esferas para máquina");
      expect(result.valid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should invalidate mismatched NCM and description", () => {
      const result = validateNcm("84821010", "Papel A4 para escritório");
      expect(result.valid).toBe(false);
    });

    it("should return invalid for unknown NCM", () => {
      const result = validateNcm("99999999", "Produto qualquer");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("não encontrado");
    });
  });

  describe("findSimilarProducts", () => {
    const products = [
      { codigo: "P001", descricao: "Rolamento 6205", ncm: "84821010" },
      { codigo: "P002", descricao: "Rolamento 6206", ncm: "84821010" },
      { codigo: "P003", descricao: "Válvula esfera", ncm: "84818099" },
      { codigo: "P004", descricao: "Parafuso M10", ncm: "73181500" },
    ];

    it("should find exact NCM matches", () => {
      const similar = findSimilarProducts("84821010", products);
      expect(similar.length).toBe(2);
      expect(similar[0].similarity).toBe(1.0);
    });

    it("should find similar NCMs by prefix", () => {
      const similar = findSimilarProducts("84810000", products);
      expect(similar.length).toBeGreaterThan(0);
    });

    it("should sort by similarity", () => {
      const similar = findSimilarProducts("84821010", products);
      const similarities = similar.map((s) => s.similarity);
      expect(similarities).toEqual([...similarities].sort((a, b) => b - a));
    });

    it("should return empty for short NCM", () => {
      const similar = findSimilarProducts("84", products);
      expect(similar.length).toBe(0);
    });

    it("should limit results to 10", () => {
      const manyProducts = Array.from({ length: 20 }, (_, i) => ({
        codigo: `P${i}`,
        descricao: `Produto ${i}`,
        ncm: "84821010",
      }));
      const similar = findSimilarProducts("84821010", manyProducts);
      expect(similar.length).toBeLessThanOrEqual(10);
    });
  });

  describe("analyzeNcmPatterns", () => {
    const mockNfe: NFeParsed = {
      chaveAcesso: "35210112345678000190550010000000011000000011",
      numero: 1,
      serie: 1,
      dataEmissao: new Date(),
      naturezaOperacao: "VENDA",
      tipoOperacao: 1,
      finalidade: 1,
      consumidorFinal: false,
      presencaComprador: 1,
      emitente: {
        cnpj: "12345678000190",
        razaoSocial: "Fornecedor Ltda",
        endereco: {
          logradouro: "Rua",
          numero: "100",
          bairro: "Centro",
          cidade: "São Paulo",
          uf: "SP",
          cep: "01000000",
        },
      },
      destinatario: {
        cnpj: "98765432000110",
        razaoSocial: "Destino Ltda",
        endereco: {
          logradouro: "Av",
          numero: "200",
          bairro: "Industrial",
          cidade: "Campinas",
          uf: "SP",
          cep: "13000000",
          codigoMunicipio: "3509502",
        },
      },
      itens: [
        {
          numero: 1,
          codigo: "P001",
          descricao: "Rolamento de esferas",
          ncm: "84821010",
          cfop: 1101,
          unidade: "UN",
          quantidade: 10,
          valorUnitario: 50,
          valorTotal: 500,
          icms: { cst: "00", baseCalculo: 500, aliquota: 18, valor: 90 },
          ipi: { cst: "50", baseCalculo: 500, aliquota: 0, valor: 0 },
          pis: { cst: "01", baseCalculo: 500, aliquota: 1.65, valor: 8.25 },
          cofins: { cst: "01", baseCalculo: 500, aliquota: 7.6, valor: 38 },
        },
        {
          numero: 2,
          codigo: "P002",
          descricao: "Cabo elétrico flexível",
          ncm: "85444900",
          cfop: 1101,
          unidade: "M",
          quantidade: 100,
          valorUnitario: 5,
          valorTotal: 500,
          icms: { cst: "00", baseCalculo: 500, aliquota: 18, valor: 90 },
          ipi: { cst: "50", baseCalculo: 500, aliquota: 0, valor: 0 },
          pis: { cst: "01", baseCalculo: 500, aliquota: 1.65, valor: 8.25 },
          cofins: { cst: "01", baseCalculo: 500, aliquota: 7.6, valor: 38 },
        },
      ],
      totais: {
        baseCalculoIcms: 1000,
        valorIcms: 180,
        baseCalculoIcmsSt: 0,
        valorIcmsSt: 0,
        valorProdutos: 1000,
        valorNota: 1000,
        valorPis: 16.5,
        valorCofins: 76,
        valorIpi: 0,
        valorFrete: 0,
        valorSeguro: 0,
        valorDesconto: 0,
        valorOutros: 0,
      },
      pagamentos: [],
      duplicatas: [],
    };

    it("should analyze NCM distribution", () => {
      const result = analyzeNcmPatterns([mockNfe]);
      expect(Object.keys(result.ncmDistribution).length).toBe(2);
      expect(result.ncmDistribution["84821010"]).toBeDefined();
      expect(result.ncmDistribution["85444900"]).toBeDefined();
    });

    it("should calculate category distribution", () => {
      const result = analyzeNcmPatterns([mockNfe]);
      expect(result.categoryDistribution["Rolamentos"]).toBe(1);
      expect(result.categoryDistribution["Cabos"]).toBe(1);
    });

    it("should suggest units for NCMs", () => {
      const result = analyzeNcmPatterns([mockNfe]);
      expect(result.unitSuggestions["84821010"]).toBe("UN");
      expect(result.unitSuggestions["85444900"]).toBe("M");
    });

    it("should calculate statistics", () => {
      const result = analyzeNcmPatterns([mockNfe]);
      expect(result.statistics.totalItems).toBe(2);
      expect(result.statistics.uniqueNcms).toBe(2);
    });
  });

  describe("generateNcmReport", () => {
    it("should generate text report", () => {
      const analysis = {
        ncmDistribution: {
          "84821010": { count: 10, categoria: "Rolamentos", descricao: "Rolamentos" },
        },
        categoryDistribution: { Rolamentos: 10 },
        unitSuggestions: { "84821010": "UN" },
        invalidNcms: [],
        statistics: {
          totalItems: 10,
          uniqueNcms: 1,
          validNcms: 10,
          invalidNcms: 0,
        },
      };

      const report = generateNcmReport(analysis);
      expect(report).toContain("RELATÓRIO DE ANÁLISE NCM");
      expect(report).toContain("Total de itens: 10");
      expect(report).toContain("NCMs únicos: 1");
      expect(report).toContain("Rolamentos: 10 itens");
    });

    it("should include invalid NCMs section when present", () => {
      const analysis = {
        ncmDistribution: {},
        categoryDistribution: {},
        unitSuggestions: {},
        invalidNcms: [
          { ncm: "99999999", descricao: "Produto inválido", reason: "NCM não encontrado" },
        ],
        statistics: {
          totalItems: 1,
          uniqueNcms: 1,
          validNcms: 0,
          invalidNcms: 1,
        },
      };

      const report = generateNcmReport(analysis);
      expect(report).toContain("NCMs COM PROBLEMAS");
      expect(report).toContain("99999999");
    });
  });
});
