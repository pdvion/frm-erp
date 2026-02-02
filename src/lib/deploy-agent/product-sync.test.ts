import { describe, it, expect } from "vitest";
import {
  detectResaleItems,
  calculateSalePrice,
  suggestCategoryFromNcm,
  createProductFromMaterial,
  analyzeMaterialsForSync,
  generateSyncReport,
} from "./product-sync";
import type { NFeParsed } from "@/lib/nfe-parser";

describe("Product Sync", () => {
  describe("detectResaleItems", () => {
    const createMockNfe = (items: Array<{ codigo: string; ncm: string; cfop: number; quantidade: number; valorTotal: number }>, date: Date): NFeParsed => ({
      chaveAcesso: "35210112345678000190550010000000011000000011",
      numero: 1,
      serie: 1,
      dataEmissao: date,
      naturezaOperacao: "VENDA",
      tipoOperacao: 1,
      finalidade: 1,
      consumidorFinal: false,
      presencaComprador: 1,
      emitente: {
        cnpj: "12345678000190",
        razaoSocial: "Fornecedor",
      },
      destinatario: {
        cnpj: "98765432000110",
        razaoSocial: "Destino",
      },
      itens: items.map((item, i) => ({
        numero: i + 1,
        codigo: item.codigo,
        descricao: `Produto ${item.codigo}`,
        ncm: item.ncm,
        cfop: item.cfop,
        unidade: "UN",
        quantidade: item.quantidade,
        valorUnitario: item.valorTotal / item.quantidade,
        valorTotal: item.valorTotal,
        icms: { baseCalculo: item.valorTotal, aliquota: 18, valor: item.valorTotal * 0.18 },
        ipi: { baseCalculo: item.valorTotal, aliquota: 0, valor: 0 },
        pis: { baseCalculo: item.valorTotal, aliquota: 1.65, valor: item.valorTotal * 0.0165 },
        cofins: { baseCalculo: item.valorTotal, aliquota: 7.6, valor: item.valorTotal * 0.076 },
      })),
      totais: {
        baseCalculoIcms: 0,
        valorIcms: 0,
        baseCalculoIcmsSt: 0,
        valorIcmsSt: 0,
        valorProdutos: 0,
        valorNota: 0,
        valorPis: 0,
        valorCofins: 0,
        valorIpi: 0,
        valorFrete: 0,
        valorSeguro: 0,
        valorDesconto: 0,
        valorOutros: 0,
      },
      pagamentos: [],
      duplicatas: [],
    });

    it("should detect items with both purchases and sales", () => {
      const nfes = [
        createMockNfe([{ codigo: "P001", ncm: "84821010", cfop: 1101, quantidade: 10, valorTotal: 500 }], new Date("2026-01-01")),
        createMockNfe([{ codigo: "P001", ncm: "84821010", cfop: 5101, quantidade: 5, valorTotal: 350 }], new Date("2026-01-15")),
      ];

      const candidates = detectResaleItems(nfes);
      expect(candidates.length).toBe(1);
      expect(candidates[0].materialCode).toBe("P001");
      expect(candidates[0].purchaseCount).toBe(1);
      expect(candidates[0].saleCount).toBe(1);
    });

    it("should not detect items with only purchases", () => {
      const nfes = [
        createMockNfe([{ codigo: "P001", ncm: "84821010", cfop: 1101, quantidade: 10, valorTotal: 500 }], new Date("2026-01-01")),
        createMockNfe([{ codigo: "P001", ncm: "84821010", cfop: 1102, quantidade: 5, valorTotal: 250 }], new Date("2026-01-15")),
      ];

      const candidates = detectResaleItems(nfes);
      expect(candidates.length).toBe(0);
    });

    it("should calculate suggested markup", () => {
      const nfes = [
        createMockNfe([{ codigo: "P001", ncm: "84821010", cfop: 1101, quantidade: 10, valorTotal: 500 }], new Date("2026-01-01")),
        createMockNfe([{ codigo: "P001", ncm: "84821010", cfop: 5101, quantidade: 10, valorTotal: 650 }], new Date("2026-01-15")),
      ];

      const candidates = detectResaleItems(nfes);
      expect(candidates[0].suggestedMarkup).toBe(30);
    });

    it("should sort by confidence", () => {
      const nfes = [
        createMockNfe([{ codigo: "P001", ncm: "84821010", cfop: 1101, quantidade: 10, valorTotal: 500 }], new Date("2026-01-01")),
        createMockNfe([{ codigo: "P001", ncm: "84821010", cfop: 5101, quantidade: 5, valorTotal: 350 }], new Date("2026-01-15")),
        createMockNfe([{ codigo: "P002", ncm: "85444900", cfop: 1101, quantidade: 10, valorTotal: 100 }], new Date("2026-01-01")),
        createMockNfe([{ codigo: "P002", ncm: "85444900", cfop: 1101, quantidade: 10, valorTotal: 100 }], new Date("2026-01-05")),
        createMockNfe([{ codigo: "P002", ncm: "85444900", cfop: 5101, quantidade: 5, valorTotal: 75 }], new Date("2026-01-15")),
        createMockNfe([{ codigo: "P002", ncm: "85444900", cfop: 5101, quantidade: 5, valorTotal: 75 }], new Date("2026-01-20")),
      ];

      const candidates = detectResaleItems(nfes);
      expect(candidates.length).toBe(2);
      expect(candidates[0].materialCode).toBe("P002");
      expect(candidates[0].confidence).toBeGreaterThan(candidates[1].confidence);
    });
  });

  describe("calculateSalePrice", () => {
    it("should calculate price with markup", () => {
      expect(calculateSalePrice(100, 30)).toBe(130);
      expect(calculateSalePrice(50, 50)).toBe(75);
      expect(calculateSalePrice(200, 25)).toBe(250);
    });

    it("should handle zero markup", () => {
      expect(calculateSalePrice(100, 0)).toBe(100);
    });

    it("should handle decimal markup", () => {
      expect(calculateSalePrice(100, 33.33)).toBeCloseTo(133.33, 2);
    });
  });

  describe("suggestCategoryFromNcm", () => {
    it("should suggest category for known NCM chapters", () => {
      expect(suggestCategoryFromNcm("84821010")).toBe("Máquinas e Equipamentos");
      expect(suggestCategoryFromNcm("85444900")).toBe("Equipamentos Elétricos");
      expect(suggestCategoryFromNcm("39269090")).toBe("Plásticos");
      expect(suggestCategoryFromNcm("72142000")).toBe("Ferro e Aço");
    });

    it("should return 'Outros' for unknown chapters", () => {
      expect(suggestCategoryFromNcm("99999999")).toBe("Outros");
    });

    it("should return 'Geral' for empty NCM", () => {
      expect(suggestCategoryFromNcm("")).toBe("Geral");
      expect(suggestCategoryFromNcm("1")).toBe("Geral");
    });
  });

  describe("createProductFromMaterial", () => {
    const config = {
      defaultMarkup: 30,
      priceSource: "lastPurchase" as const,
      autoSync: false,
      syncCategories: true,
      syncImages: false,
      minPurchaseCount: 1,
    };

    it("should create product data from material", () => {
      const material = {
        id: "mat-001",
        code: 123,
        description: "Rolamento de Esferas 6205",
        ncm: "84821010",
        unit: "UN",
      };

      const product = createProductFromMaterial(material, 50, config);

      expect(product.name).toBe("Rolamento de Esferas 6205");
      expect(product.code).toBe("P123");
      expect(product.costPrice).toBe(50);
      expect(product.listPrice).toBe(65);
      expect(product.suggestedCategory).toBe("Máquinas e Equipamentos");
      expect(product.materialId).toBe("mat-001");
      expect(product.markup).toBe(30);
    });

    it("should round prices to 2 decimal places", () => {
      const material = {
        id: "mat-002",
        code: 456,
        description: "Produto Teste",
        ncm: "84821010",
        unit: "UN",
      };

      const product = createProductFromMaterial(material, 33.333, config);

      expect(product.costPrice).toBe(33.33);
      expect(product.listPrice).toBe(43.33);
    });
  });

  describe("analyzeMaterialsForSync", () => {
    const config = {
      defaultMarkup: 30,
      priceSource: "lastPurchase" as const,
      autoSync: false,
      syncCategories: true,
      syncImages: false,
      minPurchaseCount: 1,
    };

    it("should identify materials to create", () => {
      const materials = [
        { id: "mat-001", code: 1, description: "Material 1", ncm: "84821010", unit: "UN", lastPurchasePrice: 50 },
        { id: "mat-002", code: 2, description: "Material 2", ncm: "85444900", unit: "M", lastPurchasePrice: 10 },
      ];

      const existingProducts: Array<{ materialId?: string | null }> = [];

      const result = analyzeMaterialsForSync(materials, existingProducts, config);

      expect(result.toCreate.length).toBe(2);
      expect(result.toUpdate.length).toBe(0);
      expect(result.statistics.toCreate).toBe(2);
    });

    it("should identify materials to update", () => {
      const materials = [
        { id: "mat-001", code: 1, description: "Material 1", ncm: "84821010", unit: "UN", lastPurchasePrice: 50 },
        { id: "mat-002", code: 2, description: "Material 2", ncm: "85444900", unit: "M", lastPurchasePrice: 10 },
      ];

      const existingProducts = [{ materialId: "mat-001" }];

      const result = analyzeMaterialsForSync(materials, existingProducts, config);

      expect(result.toCreate.length).toBe(1);
      expect(result.toUpdate.length).toBe(1);
      expect(result.statistics.alreadySynced).toBe(1);
    });

    it("should skip materials without price", () => {
      const materials = [
        { id: "mat-001", code: 1, description: "Material 1", ncm: "84821010", unit: "UN", lastPurchasePrice: 0 },
        { id: "mat-002", code: 2, description: "Material 2", ncm: "85444900", unit: "M", lastPurchasePrice: 10 },
      ];

      const existingProducts: Array<{ materialId?: string | null }> = [];

      const result = analyzeMaterialsForSync(materials, existingProducts, config);

      expect(result.toCreate.length).toBe(1);
      expect(result.statistics.eligibleForSync).toBe(1);
    });
  });

  describe("generateSyncReport", () => {
    const config = {
      defaultMarkup: 30,
      priceSource: "lastPurchase" as const,
      autoSync: false,
      syncCategories: true,
      syncImages: false,
      minPurchaseCount: 1,
    };

    it("should generate text report", () => {
      const candidates = [
        {
          materialCode: "P001",
          materialDescription: "Rolamento de Esferas",
          ncm: "84821010",
          unit: "UN",
          purchaseCount: 5,
          saleCount: 3,
          lastPurchasePrice: 50,
          lastSalePrice: 65,
          averagePurchasePrice: 48,
          suggestedMarkup: 30,
          confidence: 0.9,
        },
      ];

      const report = generateSyncReport(candidates, config);

      expect(report).toContain("RELATÓRIO DE SINCRONIZAÇÃO");
      expect(report).toContain("Margem padrão: 30%");
      expect(report).toContain("Total identificados: 1");
      expect(report).toContain("P001");
      expect(report).toContain("Rolamento de Esferas");
    });

    it("should handle empty candidates", () => {
      const report = generateSyncReport([], config);

      expect(report).toContain("Total identificados: 0");
    });
  });
});
