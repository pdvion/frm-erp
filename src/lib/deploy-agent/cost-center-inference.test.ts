import { describe, it, expect } from "vitest";
import {
  inferFromNcm,
  inferFromCfop,
  inferFromKeywords,
  inferFromHistory,
  inferCostCenterForItem,
  analyzeCostCenters,
  generateCostCenterReport,
  type HistoricalPurchase,
  type CostCenterInferenceConfig,
} from "./cost-center-inference";
import type { NFeParsed, NFeItem } from "@/lib/nfe-parser";

describe("Cost Center Inference", () => {
  describe("inferFromNcm", () => {
    it("should infer Produção for machinery NCM (84xx)", () => {
      const result = inferFromNcm("84818099");
      expect(result).not.toBeNull();
      expect(result?.costCenterName).toBe("Produção");
      expect(result?.matchType).toBe("ncm");
    });

    it("should infer Administrativo for paper NCM (48xx)", () => {
      const result = inferFromNcm("48025610");
      expect(result).not.toBeNull();
      expect(result?.costCenterName).toBe("Administrativo");
    });

    it("should infer Energia for fuel NCM (27xx)", () => {
      const result = inferFromNcm("27101259");
      expect(result).not.toBeNull();
      expect(result?.costCenterName).toBe("Energia");
    });

    it("should infer Logística for vehicles NCM (87xx)", () => {
      const result = inferFromNcm("87089990");
      expect(result).not.toBeNull();
      expect(result?.costCenterName).toBe("Logística");
    });

    it("should return null for unknown NCM", () => {
      const result = inferFromNcm("99999999");
      expect(result).toBeNull();
    });

    it("should return null for empty NCM", () => {
      const result = inferFromNcm("");
      expect(result).toBeNull();
    });
  });

  describe("inferFromCfop", () => {
    it("should infer Ativo Imobilizado for CFOP 1551", () => {
      const result = inferFromCfop(1551);
      expect(result).not.toBeNull();
      expect(result?.costCenterName).toBe("Ativo Imobilizado");
    });

    it("should infer Material de Consumo for CFOP 1556", () => {
      const result = inferFromCfop(1556);
      expect(result).not.toBeNull();
      expect(result?.costCenterName).toBe("Material de Consumo");
    });

    it("should infer Produção for CFOP 1101", () => {
      const result = inferFromCfop(1101);
      expect(result).not.toBeNull();
      expect(result?.costCenterName).toBe("Produção");
    });

    it("should infer Comercial for CFOP 1102", () => {
      const result = inferFromCfop(1102);
      expect(result).not.toBeNull();
      expect(result?.costCenterName).toBe("Comercial");
    });

    it("should return null for unknown CFOP", () => {
      const result = inferFromCfop(9999);
      expect(result).toBeNull();
    });
  });

  describe("inferFromKeywords", () => {
    it("should infer Administrativo for office supplies", () => {
      const result = inferFromKeywords("Papel A4 para escritorio");
      expect(result).not.toBeNull();
      expect(result?.costCenterName).toBe("Administrativo");
    });

    it("should infer TI for computer equipment", () => {
      const result = inferFromKeywords("Notebook Dell Latitude");
      expect(result).not.toBeNull();
      expect(result?.costCenterName).toBe("TI");
    });

    it("should infer Segurança do Trabalho for EPI", () => {
      const result = inferFromKeywords("Luva de proteção nitrílica");
      expect(result).not.toBeNull();
      expect(result?.costCenterName).toBe("Segurança do Trabalho");
    });

    it("should infer Manutenção for maintenance items", () => {
      const result = inferFromKeywords("Óleo lubrificante para máquinas");
      expect(result).not.toBeNull();
      expect(result?.costCenterName).toBe("Manutenção");
    });

    it("should infer Copa/Cozinha for food items", () => {
      const result = inferFromKeywords("Café torrado e moído");
      expect(result).not.toBeNull();
      expect(result?.costCenterName).toBe("Copa/Cozinha");
    });

    it("should return null for unknown description", () => {
      const result = inferFromKeywords("Produto genérico XYZ");
      expect(result).toBeNull();
    });

    it("should return null for empty description", () => {
      const result = inferFromKeywords("");
      expect(result).toBeNull();
    });
  });

  describe("inferFromHistory", () => {
    const history: HistoricalPurchase[] = [
      {
        ncm: "84818099",
        supplierCnpj: "12345678000190",
        cfop: 1101,
        costCenterId: "cc-producao",
        costCenterName: "Produção",
        count: 10,
      },
      {
        ncm: "48025610",
        supplierCnpj: "98765432000110",
        cfop: 1556,
        costCenterId: "cc-administrativo",
        costCenterName: "Administrativo",
        count: 5,
      },
    ];

    it("should match by NCM", () => {
      const result = inferFromHistory(
        { ncm: "84818099", supplierCnpj: "00000000000000", cfop: 9999 },
        history
      );
      expect(result).not.toBeNull();
      expect(result?.costCenterName).toBe("Produção");
      expect(result?.matchType).toBe("history");
    });

    it("should match by supplier CNPJ", () => {
      const result = inferFromHistory(
        { ncm: "00000000", supplierCnpj: "12345678000190", cfop: 9999 },
        history
      );
      expect(result).not.toBeNull();
      expect(result?.costCenterName).toBe("Produção");
    });

    it("should prefer higher count matches", () => {
      const result = inferFromHistory(
        { ncm: "84818099", supplierCnpj: "12345678000190", cfop: 1101 },
        history
      );
      expect(result).not.toBeNull();
      expect(result?.costCenterName).toBe("Produção");
      expect(result?.confidence).toBeGreaterThan(0.5);
    });

    it("should return null for empty history", () => {
      const result = inferFromHistory(
        { ncm: "84818099", supplierCnpj: "12345678000190", cfop: 1101 },
        []
      );
      expect(result).toBeNull();
    });

    it("should return null when no match found", () => {
      const result = inferFromHistory(
        { ncm: "99999999", supplierCnpj: "00000000000000", cfop: 9999 },
        history
      );
      expect(result).toBeNull();
    });
  });

  describe("inferCostCenterForItem", () => {
    const mockItem: NFeItem = {
      numero: 1,
      codigo: "PROD001",
      descricao: "Rolamento de esferas para máquina",
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
    };

    it("should return suggestions for item", () => {
      const result = inferCostCenterForItem(mockItem, "12345678000190");
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.topSuggestion).not.toBeNull();
    });

    it("should prioritize by confidence", () => {
      const result = inferCostCenterForItem(mockItem, "12345678000190");
      const confidences = result.suggestions.map((s) => s.confidence);
      expect(confidences).toEqual([...confidences].sort((a, b) => b - a));
    });

    it("should use custom rules when provided", () => {
      const config: CostCenterInferenceConfig = {
        rules: [
          {
            id: "cc-custom",
            name: "Centro Customizado",
            ncmPatterns: ["8482"],
            priority: 10,
          },
        ],
      };

      const result = inferCostCenterForItem(mockItem, "12345678000190", [], config);
      const customSuggestion = result.suggestions.find(
        (s) => s.costCenterName === "Centro Customizado"
      );
      expect(customSuggestion).toBeDefined();
    });

    it("should use default cost center when no match", () => {
      const config: CostCenterInferenceConfig = {
        rules: [],
        defaultCostCenter: { id: "cc-default", name: "Padrão" },
      };

      const itemWithNoMatch: NFeItem = {
        ...mockItem,
        ncm: "99999999",
        cfop: 9999,
        descricao: "Item genérico",
      };

      const result = inferCostCenterForItem(itemWithNoMatch, "00000000000000", [], config);
      expect(result.topSuggestion?.costCenterName).toBe("Padrão");
      expect(result.topSuggestion?.matchType).toBe("default");
    });
  });

  describe("analyzeCostCenters", () => {
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
        razaoSocial: "Fornecedor Teste",
        nomeFantasia: "Fornecedor",
        endereco: {
          logradouro: "Rua Teste",
          numero: "100",
          bairro: "Centro",
          cidade: "São Paulo",
          uf: "SP",
          cep: "01000000",
        },
        ie: "123456789",
      },
      destinatario: {
        cnpj: "98765432000110",
        razaoSocial: "Empresa Destino",
        endereco: {
          logradouro: "Av Principal",
          numero: "200",
          bairro: "Industrial",
          cidade: "Campinas",
          uf: "SP",
          cep: "13000000",
          codigoMunicipio: "3509502",
        },
        ie: "987654321",
      },
      itens: [
        {
          numero: 1,
          codigo: "PROD001",
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
          codigo: "PROD002",
          descricao: "Papel A4 para escritório",
          ncm: "48025610",
          cfop: 1556,
          unidade: "RS",
          quantidade: 5,
          valorUnitario: 20,
          valorTotal: 100,
          icms: { cst: "00", baseCalculo: 100, aliquota: 18, valor: 18 },
          ipi: { cst: "50", baseCalculo: 100, aliquota: 0, valor: 0 },
          pis: { cst: "01", baseCalculo: 100, aliquota: 1.65, valor: 1.65 },
          cofins: { cst: "01", baseCalculo: 100, aliquota: 7.6, valor: 7.6 },
        },
      ],
      totais: {
        baseCalculoIcms: 600,
        valorIcms: 108,
        baseCalculoIcmsSt: 0,
        valorIcmsSt: 0,
        valorProdutos: 600,
        valorNota: 600,
        valorPis: 9.9,
        valorCofins: 45.6,
        valorIpi: 0,
        valorFrete: 0,
        valorSeguro: 0,
        valorDesconto: 0,
        valorOutros: 0,
      },
      pagamentos: [],
      duplicatas: [],
    };

    it("should analyze all items in NFes", () => {
      const result = analyzeCostCenters([mockNfe]);
      expect(result.itemSuggestions.length).toBe(2);
      expect(result.statistics.totalItems).toBe(2);
    });

    it("should calculate cost center distribution", () => {
      const result = analyzeCostCenters([mockNfe]);
      expect(Object.keys(result.costCenterDistribution).length).toBeGreaterThan(0);
    });

    it("should track match type distribution", () => {
      const result = analyzeCostCenters([mockNfe]);
      expect(result.statistics.matchTypeDistribution).toBeDefined();
    });

    it("should calculate average confidence", () => {
      const result = analyzeCostCenters([mockNfe]);
      expect(result.statistics.avgConfidence).toBeGreaterThan(0);
      expect(result.statistics.avgConfidence).toBeLessThanOrEqual(1);
    });
  });

  describe("generateCostCenterReport", () => {
    it("should generate text report", () => {
      const analysis = {
        itemSuggestions: [],
        costCenterDistribution: {
          Produção: { count: 10, percentage: 50 },
          Administrativo: { count: 10, percentage: 50 },
        },
        statistics: {
          totalItems: 20,
          itemsWithSuggestion: 20,
          avgConfidence: 0.75,
          matchTypeDistribution: { ncm: 15, cfop: 5 },
        },
      };

      const report = generateCostCenterReport(analysis);
      expect(report).toContain("RELATÓRIO DE SUGESTÃO DE CENTRO DE CUSTO");
      expect(report).toContain("Total de itens analisados: 20");
      expect(report).toContain("Confiança média: 75.0%");
      expect(report).toContain("Produção: 10 itens (50%)");
    });
  });
});
