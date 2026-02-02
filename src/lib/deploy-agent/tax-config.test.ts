/**
 * Tests for Tax Auto-Config
 * VIO-877
 */

import { describe, it, expect } from "vitest";
import {
  detectTaxRegime,
  extractStateAliquotas,
  detectSTConfigs,
  extractTaxPatterns,
  analyzePisCofins,
  analyzeIpi,
  generateTaxConfiguration,
  getCstDescription,
  getDefaultInterstateAliquota,
  generateTaxConfigReport,
} from "./tax-config";
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

describe("Tax Auto-Config", () => {
  describe("detectTaxRegime", () => {
    it("should detect Lucro Real with non-cumulative PIS/COFINS", () => {
      const nfes = [
        createMockNFe({
          itens: [
            createMockItem({
              icms: { cst: "00", baseCalculo: 1000, aliquota: 18, valor: 180 },
              pis: { cst: "01", baseCalculo: 1000, aliquota: 1.65, valor: 16.5 },
              cofins: { cst: "01", baseCalculo: 1000, aliquota: 7.6, valor: 76 },
            }),
          ],
        }),
      ];

      const result = detectTaxRegime(nfes);

      expect(result.regime).toBe("lucro_real");
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should detect Simples Nacional with CSOSN", () => {
      const nfes = [
        createMockNFe({
          itens: [
            createMockItem({
              icms: { cst: "102", baseCalculo: 1000, aliquota: 0, valor: 0 },
            }),
            createMockItem({
              icms: { cst: "101", baseCalculo: 1000, aliquota: 0, valor: 0 },
            }),
          ],
        }),
      ];

      const result = detectTaxRegime(nfes);

      expect(result.regime).toBe("simples_nacional");
      expect(result.indicators.simplesNacional).toBe(1);
    });

    it("should track CST distribution", () => {
      const nfes = [
        createMockNFe({
          itens: [
            createMockItem({ icms: { cst: "00", baseCalculo: 1000, aliquota: 18, valor: 180 } }),
            createMockItem({ icms: { cst: "00", baseCalculo: 1000, aliquota: 18, valor: 180 } }),
            createMockItem({ icms: { cst: "60", baseCalculo: 0, aliquota: 0, valor: 0 } }),
          ],
        }),
      ];

      const result = detectTaxRegime(nfes);

      expect(result.cstDistribution["00"]).toBe(2);
      expect(result.cstDistribution["60"]).toBe(1);
    });
  });

  describe("extractStateAliquotas", () => {
    it("should extract aliquotas by state", () => {
      const nfes = [
        createMockNFe({
          emitente: { cnpj: "123", razaoSocial: "A", endereco: { uf: "SP" } },
          destinatario: { cnpj: "456", razaoSocial: "B", endereco: { uf: "RJ" } },
          itens: [createMockItem({ icms: { cst: "00", baseCalculo: 1000, aliquota: 12, valor: 120 } })],
        }),
        createMockNFe({
          emitente: { cnpj: "123", razaoSocial: "A", endereco: { uf: "SP" } },
          destinatario: { cnpj: "789", razaoSocial: "C", endereco: { uf: "SP" } },
          itens: [createMockItem({ icms: { cst: "00", baseCalculo: 1000, aliquota: 18, valor: 180 } })],
        }),
      ];

      const result = extractStateAliquotas(nfes);

      expect(result.length).toBe(2);
      const spRj = result.find((a) => a.ufOrigem === "SP" && a.ufDestino === "RJ");
      const spSp = result.find((a) => a.ufOrigem === "SP" && a.ufDestino === "SP");
      expect(spRj?.aliquotaInterestadual).toBe(12);
      expect(spSp?.aliquotaInterna).toBe(18);
    });
  });

  describe("detectSTConfigs", () => {
    it("should detect ST configurations", () => {
      const nfes = [
        createMockNFe({
          itens: [
            createMockItem({
              ncm: "22021000",
              icms: { cst: "60", baseCalculo: 1000, aliquota: 18, valor: 180 },
            }),
            createMockItem({
              ncm: "22021000",
              icms: { cst: "60", baseCalculo: 1000, aliquota: 18, valor: 180 },
            }),
          ],
        }),
      ];

      const result = detectSTConfigs(nfes);

      expect(result.length).toBe(1);
      expect(result[0].ncm).toBe("22021000");
      expect(result[0].occurrences).toBe(2);
    });

    it("should filter out single occurrences", () => {
      const nfes = [
        createMockNFe({
          itens: [
            createMockItem({
              ncm: "22021000",
              icms: { cst: "60", baseCalculo: 1000, aliquota: 18, valor: 180 },
            }),
          ],
        }),
      ];

      const result = detectSTConfigs(nfes);

      expect(result.length).toBe(0);
    });
  });

  describe("extractTaxPatterns", () => {
    it("should extract unique tax patterns", () => {
      const nfes = [
        createMockNFe({
          itens: [
            createMockItem({
              icms: { cst: "00", baseCalculo: 1000, aliquota: 18, valor: 180 },
              pis: { cst: "01", baseCalculo: 1000, aliquota: 1.65, valor: 16.5 },
              cofins: { cst: "01", baseCalculo: 1000, aliquota: 7.6, valor: 76 },
            }),
            createMockItem({
              icms: { cst: "00", baseCalculo: 1000, aliquota: 18, valor: 180 },
              pis: { cst: "01", baseCalculo: 1000, aliquota: 1.65, valor: 16.5 },
              cofins: { cst: "01", baseCalculo: 1000, aliquota: 7.6, valor: 76 },
            }),
            createMockItem({
              icms: { cst: "60", baseCalculo: 0, aliquota: 0, valor: 0 },
              pis: { cst: "01", baseCalculo: 1000, aliquota: 1.65, valor: 16.5 },
              cofins: { cst: "01", baseCalculo: 1000, aliquota: 7.6, valor: 76 },
            }),
          ],
        }),
      ];

      const result = extractTaxPatterns(nfes);

      expect(result.length).toBe(2);
      expect(result[0].occurrences).toBe(2); // Most common first
    });
  });

  describe("analyzePisCofins", () => {
    it("should detect non-cumulative regime", () => {
      const nfes = [
        createMockNFe({
          itens: [
            createMockItem({
              pis: { cst: "01", baseCalculo: 1000, aliquota: 1.65, valor: 16.5 },
              cofins: { cst: "01", baseCalculo: 1000, aliquota: 7.6, valor: 76 },
            }),
          ],
        }),
      ];

      const result = analyzePisCofins(nfes);

      expect(result.regimeCumulativo).toBe(false);
      expect(result.aliquotaPisMedia).toBe(1.65);
      expect(result.aliquotaCofinsMedia).toBe(7.6);
    });

    it("should detect cumulative regime", () => {
      const nfes = [
        createMockNFe({
          itens: [
            createMockItem({
              pis: { cst: "01", baseCalculo: 1000, aliquota: 0.65, valor: 6.5 },
              cofins: { cst: "01", baseCalculo: 1000, aliquota: 3, valor: 30 },
            }),
          ],
        }),
      ];

      const result = analyzePisCofins(nfes);

      expect(result.regimeCumulativo).toBe(true);
    });
  });

  describe("analyzeIpi", () => {
    it("should detect IPI presence", () => {
      const nfes = [
        createMockNFe({
          itens: [
            createMockItem({
              ncm: "84829900",
              ipi: { cst: "50", baseCalculo: 1000, aliquota: 5, valor: 50 },
            }),
            createMockItem({
              ncm: "73181500",
              ipi: { cst: "50", baseCalculo: 1000, aliquota: 10, valor: 100 },
            }),
          ],
        }),
      ];

      const result = analyzeIpi(nfes);

      expect(result.hasIpi).toBe(true);
      expect(result.aliquotaMedia).toBe(7.5);
      expect(result.ncmsWithIpi).toContain("84829900");
      expect(result.ncmsWithIpi).toContain("73181500");
    });

    it("should handle no IPI", () => {
      const nfes = [createMockNFe()];

      const result = analyzeIpi(nfes);

      expect(result.hasIpi).toBe(false);
      expect(result.aliquotaMedia).toBe(0);
    });
  });

  describe("generateTaxConfiguration", () => {
    it("should generate complete configuration", () => {
      const nfes = [
        createMockNFe(),
        createMockNFe({
          itens: [createMockItem({ ncm: "73181500" })],
        }),
      ];

      const result = generateTaxConfiguration(nfes);

      expect(result.statistics.totalNfes).toBe(2);
      expect(result.statistics.totalItems).toBe(2);
      expect(result.regime).toBeDefined();
      expect(result.stateAliquotas).toBeDefined();
      expect(result.taxPatterns).toBeDefined();
    });
  });

  describe("getCstDescription", () => {
    it("should return CST description", () => {
      expect(getCstDescription("00")).toBe("Tributada integralmente");
      expect(getCstDescription("60")).toBe("ICMS cobrado anteriormente por ST");
    });

    it("should return CSOSN description", () => {
      expect(getCstDescription("101")).toBe("Tributada com permissão de crédito");
      expect(getCstDescription("500")).toBe("ICMS cobrado anteriormente por ST ou antecipação");
    });

    it("should handle unknown codes", () => {
      expect(getCstDescription("99")).toBe("CST não especificado");
      expect(getCstDescription("999")).toBe("CSOSN não especificado");
    });
  });

  describe("getDefaultInterstateAliquota", () => {
    it("should return 0 for same state", () => {
      expect(getDefaultInterstateAliquota("SP", "SP")).toBe(0);
    });

    it("should return 7% for SP to Northeast", () => {
      expect(getDefaultInterstateAliquota("SP", "BA")).toBe(7);
      expect(getDefaultInterstateAliquota("SP", "CE")).toBe(7);
    });

    it("should return 12% for SP to Southeast", () => {
      expect(getDefaultInterstateAliquota("SP", "MG")).toBe(12);
      expect(getDefaultInterstateAliquota("SP", "RJ")).toBe(12);
    });

    it("should return 12% as default interstate", () => {
      expect(getDefaultInterstateAliquota("BA", "CE")).toBe(12);
    });
  });

  describe("generateTaxConfigReport", () => {
    it("should generate text report", () => {
      const config = generateTaxConfiguration([createMockNFe()]);
      const report = generateTaxConfigReport(config);

      expect(report).toContain("RELATÓRIO DE CONFIGURAÇÃO TRIBUTÁRIA");
      expect(report).toContain("Regime detectado");
      expect(report).toContain("PIS/COFINS");
    });
  });
});
