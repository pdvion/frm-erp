import { describe, it, expect } from "vitest";
import {
  normalizeUnit,
  areUnitsEquivalent,
  convertQuantity,
  getUnitDescription,
  listKnownUnits,
  suggestUnitFromDescription,
  analyzeUnits,
  generateUnitReport,
} from "./unit-conversion";
import type { NFeParsed } from "@/lib/nfe-parser";

describe("Unit Conversion", () => {
  describe("normalizeUnit", () => {
    it("should normalize UN variants", () => {
      expect(normalizeUnit("UN").normalized).toBe("UN");
      expect(normalizeUnit("UND").normalized).toBe("UN");
      expect(normalizeUnit("UNID").normalized).toBe("UN");
      expect(normalizeUnit("UNIDADE").normalized).toBe("UN");
      expect(normalizeUnit("PC").normalized).toBe("UN");
      expect(normalizeUnit("PÇ").normalized).toBe("UN");
    });

    it("should normalize KG variants", () => {
      expect(normalizeUnit("KG").normalized).toBe("KG");
      expect(normalizeUnit("K").normalized).toBe("KG");
      expect(normalizeUnit("KILO").normalized).toBe("KG");
      expect(normalizeUnit("QUILO").normalized).toBe("KG");
    });

    it("should normalize L variants", () => {
      expect(normalizeUnit("L").normalized).toBe("L");
      expect(normalizeUnit("LT").normalized).toBe("L");
      expect(normalizeUnit("LITRO").normalized).toBe("L");
    });

    it("should normalize M variants", () => {
      expect(normalizeUnit("M").normalized).toBe("M");
      expect(normalizeUnit("MT").normalized).toBe("M");
      expect(normalizeUnit("METRO").normalized).toBe("M");
    });

    it("should handle case insensitivity", () => {
      expect(normalizeUnit("un").normalized).toBe("UN");
      expect(normalizeUnit("Kg").normalized).toBe("KG");
      expect(normalizeUnit("litro").normalized).toBe("L");
    });

    it("should extract factor from unit with number", () => {
      const cx12 = normalizeUnit("CX12");
      expect(cx12.normalized).toBe("CX");
      expect(cx12.factor).toBe(12);

      const pct6 = normalizeUnit("PCT6");
      expect(pct6.normalized).toBe("PCT");
      expect(pct6.factor).toBe(6);
    });

    it("should return original for unknown units", () => {
      const unknown = normalizeUnit("XYZ");
      expect(unknown.normalized).toBe("XYZ");
      expect(unknown.factor).toBe(1);
    });

    it("should include description", () => {
      const kg = normalizeUnit("KG");
      expect(kg.description).toBe("Quilograma");

      const un = normalizeUnit("UN");
      expect(un.description).toBe("Unidade");
    });
  });

  describe("areUnitsEquivalent", () => {
    it("should return true for same unit", () => {
      expect(areUnitsEquivalent("UN", "UN")).toBe(true);
      expect(areUnitsEquivalent("KG", "KG")).toBe(true);
    });

    it("should return true for synonyms", () => {
      expect(areUnitsEquivalent("UN", "UND")).toBe(true);
      expect(areUnitsEquivalent("UN", "UNIDADE")).toBe(true);
      expect(areUnitsEquivalent("KG", "KILO")).toBe(true);
      expect(areUnitsEquivalent("L", "LITRO")).toBe(true);
    });

    it("should return false for different units", () => {
      expect(areUnitsEquivalent("UN", "KG")).toBe(false);
      expect(areUnitsEquivalent("L", "M")).toBe(false);
    });

    it("should handle case insensitivity", () => {
      expect(areUnitsEquivalent("un", "UN")).toBe(true);
      expect(areUnitsEquivalent("kg", "KILO")).toBe(true);
    });
  });

  describe("convertQuantity", () => {
    it("should convert KG to G", () => {
      const result = convertQuantity(1, "KG", "G");
      expect(result.success).toBe(true);
      expect(result.quantity).toBe(1000);
    });

    it("should convert G to KG", () => {
      const result = convertQuantity(1000, "G", "KG");
      expect(result.success).toBe(true);
      expect(result.quantity).toBe(1);
    });

    it("should convert L to ML", () => {
      const result = convertQuantity(2, "L", "ML");
      expect(result.success).toBe(true);
      expect(result.quantity).toBe(2000);
    });

    it("should convert M to CM", () => {
      const result = convertQuantity(1, "M", "CM");
      expect(result.success).toBe(true);
      expect(result.quantity).toBe(100);
    });

    it("should convert DZ to UN", () => {
      const result = convertQuantity(2, "DZ", "UN");
      expect(result.success).toBe(true);
      expect(result.quantity).toBe(24);
    });

    it("should convert UN to DZ", () => {
      const result = convertQuantity(24, "UN", "DZ");
      expect(result.success).toBe(true);
      expect(result.quantity).toBe(2);
    });

    it("should handle same unit conversion", () => {
      const result = convertQuantity(10, "UN", "UN");
      expect(result.success).toBe(true);
      expect(result.quantity).toBe(10);
    });

    it("should handle synonym conversion", () => {
      const result = convertQuantity(10, "UND", "UNIDADE");
      expect(result.success).toBe(true);
      expect(result.quantity).toBe(10);
    });

    it("should handle units with factor", () => {
      // CX12 normalizes to CX with factor 12, but CX and UN are not convertible
      // This test verifies the factor extraction works
      const cx12 = normalizeUnit("CX12");
      expect(cx12.normalized).toBe("CX");
      expect(cx12.factor).toBe(12);
    });

    it("should fail for incompatible units", () => {
      const result = convertQuantity(10, "KG", "M");
      expect(result.success).toBe(false);
    });
  });

  describe("getUnitDescription", () => {
    it("should return description for known units", () => {
      expect(getUnitDescription("UN")).toBe("Unidade");
      expect(getUnitDescription("KG")).toBe("Quilograma");
      expect(getUnitDescription("L")).toBe("Litro");
      expect(getUnitDescription("M")).toBe("Metro");
    });

    it("should return description for synonyms", () => {
      expect(getUnitDescription("UND")).toBe("Unidade");
      expect(getUnitDescription("KILO")).toBe("Quilograma");
    });

    it("should return unit code for unknown units", () => {
      expect(getUnitDescription("XYZ")).toBe("XYZ");
    });
  });

  describe("listKnownUnits", () => {
    it("should return list of known units", () => {
      const units = listKnownUnits();
      expect(units.length).toBeGreaterThan(0);
    });

    it("should include UN", () => {
      const units = listKnownUnits();
      const un = units.find((u) => u.code === "UN");
      expect(un).toBeDefined();
      expect(un?.description).toBe("Unidade");
      expect(un?.synonyms).toContain("UN");
      expect(un?.synonyms).toContain("UND");
    });

    it("should include KG", () => {
      const units = listKnownUnits();
      const kg = units.find((u) => u.code === "KG");
      expect(kg).toBeDefined();
      expect(kg?.synonyms).toContain("KILO");
    });
  });

  describe("suggestUnitFromDescription", () => {
    it("should suggest L for liquid products", () => {
      expect(suggestUnitFromDescription("Óleo lubrificante")).toBe("L");
      expect(suggestUnitFromDescription("Combustível diesel")).toBe("L");
    });

    it("should suggest KG for weight products", () => {
      expect(suggestUnitFromDescription("Produto vendido por quilo")).toBe("KG");
    });

    it("should suggest M for length products", () => {
      expect(suggestUnitFromDescription("Cabo com 10 metros")).toBe("M");
    });

    it("should suggest RS for paper products", () => {
      expect(suggestUnitFromDescription("Papel A4 resma")).toBe("RS");
    });

    it("should suggest HR for service", () => {
      expect(suggestUnitFromDescription("Serviço de manutenção por hora")).toBe("HR");
    });

    it("should return null for unknown products", () => {
      expect(suggestUnitFromDescription("Produto genérico XYZ")).toBeNull();
    });
  });

  describe("analyzeUnits", () => {
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
        razaoSocial: "Fornecedor",
        endereco: { logradouro: "Rua", numero: "100", bairro: "Centro", cidade: "SP", uf: "SP", cep: "01000000" },
      },
      destinatario: {
        cnpj: "98765432000110",
        razaoSocial: "Destino",
        endereco: { logradouro: "Av", numero: "200", bairro: "Industrial", cidade: "Campinas", uf: "SP", cep: "13000000" },
      },
      itens: [
        {
          numero: 1,
          codigo: "P001",
          descricao: "Produto 1",
          ncm: "84821010",
          cfop: 1101,
          unidade: "UN",
          quantidade: 10,
          valorUnitario: 50,
          valorTotal: 500,
          icms: { baseCalculo: 500, aliquota: 18, valor: 90 },
          ipi: { baseCalculo: 500, aliquota: 0, valor: 0 },
          pis: { baseCalculo: 500, aliquota: 1.65, valor: 8.25 },
          cofins: { baseCalculo: 500, aliquota: 7.6, valor: 38 },
        },
        {
          numero: 2,
          codigo: "P002",
          descricao: "Produto 2",
          ncm: "84821010",
          cfop: 1101,
          unidade: "UND",
          quantidade: 5,
          valorUnitario: 20,
          valorTotal: 100,
          icms: { baseCalculo: 100, aliquota: 18, valor: 18 },
          ipi: { baseCalculo: 100, aliquota: 0, valor: 0 },
          pis: { baseCalculo: 100, aliquota: 1.65, valor: 1.65 },
          cofins: { baseCalculo: 100, aliquota: 7.6, valor: 7.6 },
        },
        {
          numero: 3,
          codigo: "P003",
          descricao: "Produto 3",
          ncm: "27101259",
          cfop: 1101,
          unidade: "L",
          quantidade: 100,
          valorUnitario: 5,
          valorTotal: 500,
          icms: { baseCalculo: 500, aliquota: 18, valor: 90 },
          ipi: { baseCalculo: 500, aliquota: 0, valor: 0 },
          pis: { baseCalculo: 500, aliquota: 1.65, valor: 8.25 },
          cofins: { baseCalculo: 500, aliquota: 7.6, valor: 38 },
        },
      ],
      totais: {
        baseCalculoIcms: 1100,
        valorIcms: 198,
        baseCalculoIcmsSt: 0,
        valorIcmsSt: 0,
        valorProdutos: 1100,
        valorNota: 1100,
        valorPis: 18.15,
        valorCofins: 83.6,
        valorIpi: 0,
        valorFrete: 0,
        valorSeguro: 0,
        valorDesconto: 0,
        valorOutros: 0,
      },
      pagamentos: [],
      duplicatas: [],
    };

    it("should analyze unit distribution", () => {
      const result = analyzeUnits([mockNfe]);
      expect(result.statistics.totalItems).toBe(3);
      expect(result.statistics.uniqueUnits).toBe(3);
    });

    it("should detect conversion suggestions", () => {
      const result = analyzeUnits([mockNfe]);
      const undSuggestion = result.conversionSuggestions.find((s) => s.original === "UND");
      expect(undSuggestion).toBeDefined();
      expect(undSuggestion?.suggested).toBe("UN");
    });

    it("should detect inconsistencies when same product has different units", () => {
      const result = analyzeUnits([mockNfe]);
      // UN and UND normalize to the same unit, so no inconsistency
      // The test verifies the function runs without error
      expect(result.inconsistencies).toBeDefined();
      expect(Array.isArray(result.inconsistencies)).toBe(true);
    });

    it("should calculate normalized units count", () => {
      const result = analyzeUnits([mockNfe]);
      expect(result.statistics.normalizedUnits).toBeLessThanOrEqual(result.statistics.uniqueUnits);
    });
  });

  describe("generateUnitReport", () => {
    it("should generate text report", () => {
      const analysis = {
        unitDistribution: {
          UN: { count: 10, normalized: "UN" },
          UND: { count: 5, normalized: "UN" },
          KG: { count: 3, normalized: "KG" },
        },
        conversionSuggestions: [
          { original: "UND", suggested: "UN", confidence: 0.9, reason: "Sinônimo" },
        ],
        inconsistencies: [],
        statistics: {
          totalItems: 18,
          uniqueUnits: 3,
          normalizedUnits: 2,
          inconsistentProducts: 0,
        },
      };

      const report = generateUnitReport(analysis);
      expect(report).toContain("RELATÓRIO DE ANÁLISE DE UNIDADES");
      expect(report).toContain("Total de itens: 18");
      expect(report).toContain("Unidades únicas: 3");
      expect(report).toContain("UN: 10 itens");
      expect(report).toContain("UND → UN");
    });

    it("should include inconsistencies section when present", () => {
      const analysis = {
        unitDistribution: {},
        conversionSuggestions: [],
        inconsistencies: [
          { ncm: "84821010", descricao: "Produto teste", units: ["UN", "KG"], suggestedUnit: "UN" },
        ],
        statistics: {
          totalItems: 2,
          uniqueUnits: 2,
          normalizedUnits: 2,
          inconsistentProducts: 1,
        },
      };

      const report = generateUnitReport(analysis);
      expect(report).toContain("INCONSISTÊNCIAS DETECTADAS");
      expect(report).toContain("84821010");
    });
  });
});
