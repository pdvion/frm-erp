/**
 * Tests for TaxCalculationService
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  TaxCalculationService,
  calculateItemTaxBreakdown,
  calculateInvoiceTaxTotals,
  safeParseNFeXmls,
} from "./tax-calculation";

// ==========================================================================
// PURE FUNCTION TESTS
// ==========================================================================

describe("calculateItemTaxBreakdown", () => {
  it("should calculate all taxes for an item", () => {
    const result = calculateItemTaxBreakdown(1000, 18, 5, 1.65, 7.6);

    expect(result.icmsValue).toBe(180);
    expect(result.ipiValue).toBe(50);
    expect(result.pisValue).toBe(16.5);
    expect(result.cofinsValue).toBe(76);
    expect(result.totalTax).toBe(322.5);
    expect(result.effectiveTaxRate).toBe(32.25);
  });

  it("should handle zero rates", () => {
    const result = calculateItemTaxBreakdown(1000, 0, 0, 0, 0);

    expect(result.icmsValue).toBe(0);
    expect(result.ipiValue).toBe(0);
    expect(result.pisValue).toBe(0);
    expect(result.cofinsValue).toBe(0);
    expect(result.totalTax).toBe(0);
    expect(result.effectiveTaxRate).toBe(0);
  });

  it("should handle zero price", () => {
    const result = calculateItemTaxBreakdown(0, 18, 5, 1.65, 7.6);

    expect(result.totalTax).toBe(0);
    expect(result.effectiveTaxRate).toBe(0);
  });

  it("should round to 2 decimal places", () => {
    const result = calculateItemTaxBreakdown(333.33, 18, 5, 1.65, 7.6);

    // All values should have at most 2 decimal places
    expect(result.icmsValue).toBe(Math.round(333.33 * 0.18 * 100) / 100);
    expect(result.ipiValue).toBe(Math.round(333.33 * 0.05 * 100) / 100);
    expect(result.pisValue).toBe(Math.round(333.33 * 0.0165 * 100) / 100);
    expect(result.cofinsValue).toBe(Math.round(333.33 * 0.076 * 100) / 100);
  });

  it("should preserve original rates in output", () => {
    const result = calculateItemTaxBreakdown(1000, 12, 10, 0.65, 3);

    expect(result.icmsRate).toBe(12);
    expect(result.ipiRate).toBe(10);
    expect(result.pisRate).toBe(0.65);
    expect(result.cofinsRate).toBe(3);
  });
});

describe("calculateInvoiceTaxTotals", () => {
  it("should sum tax totals across items", () => {
    const items = [
      { totalPrice: 1000, icmsRate: 18, icmsValue: 180, ipiValue: 50, pisValue: 16.5, cofinsValue: 76 },
      { totalPrice: 500, icmsRate: 18, icmsValue: 90, ipiValue: 25, pisValue: 8.25, cofinsValue: 38 },
    ];

    const result = calculateInvoiceTaxTotals(items);

    expect(result.totalProducts).toBe(1500);
    expect(result.icmsBase).toBe(1500);
    expect(result.icmsValue).toBe(270);
    expect(result.ipiValue).toBe(75);
    expect(result.pisValue).toBe(24.75);
    expect(result.cofinsValue).toBe(114);
    expect(result.totalInvoice).toBe(1575); // totalProducts + IPI
  });

  it("should exclude items with zero ICMS rate from ICMS base", () => {
    const items = [
      { totalPrice: 1000, icmsRate: 18, icmsValue: 180 },
      { totalPrice: 500, icmsRate: 0, icmsValue: 0 },
    ];

    const result = calculateInvoiceTaxTotals(items);

    expect(result.icmsBase).toBe(1000); // Only the first item
    expect(result.totalProducts).toBe(1500);
  });

  it("should handle empty items", () => {
    const result = calculateInvoiceTaxTotals([]);

    expect(result.totalProducts).toBe(0);
    expect(result.icmsBase).toBe(0);
    expect(result.icmsValue).toBe(0);
    expect(result.totalInvoice).toBe(0);
  });

  it("should handle items with missing optional values", () => {
    const items = [
      { totalPrice: 1000 },
      { totalPrice: 500, icmsRate: 18, icmsValue: 90 },
    ];

    const result = calculateInvoiceTaxTotals(items);

    expect(result.totalProducts).toBe(1500);
    expect(result.icmsBase).toBe(500);
    expect(result.icmsValue).toBe(90);
    expect(result.ipiValue).toBe(0);
  });

  it("should initialize ST values to zero", () => {
    const items = [{ totalPrice: 1000, icmsRate: 18, icmsValue: 180 }];
    const result = calculateInvoiceTaxTotals(items);

    expect(result.icmsStBase).toBe(0);
    expect(result.icmsStValue).toBe(0);
  });
});

describe("safeParseNFeXmls", () => {
  it("should return empty array for empty input", () => {
    expect(safeParseNFeXmls([])).toEqual([]);
  });

  it("should filter out invalid XMLs", () => {
    const xmls = [
      "invalid xml content",
      "<not-a-valid-nfe>test</not-a-valid-nfe>",
    ];

    const result = safeParseNFeXmls(xmls);

    // parseNFeXml will throw for invalid XMLs, so all should be filtered
    expect(result.length).toBe(0);
  });

  it("should handle mixed valid and invalid XMLs", () => {
    const xmls = [
      "invalid",
      "also invalid",
    ];

    const result = safeParseNFeXmls(xmls);
    expect(result.length).toBe(0);
  });
});

// ==========================================================================
// SERVICE CLASS TESTS
// ==========================================================================

describe("TaxCalculationService", () => {
  let service: TaxCalculationService;
  let mockPrisma: Record<string, unknown>;

  beforeEach(() => {
    mockPrisma = {
      receivedInvoice: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    service = new TaxCalculationService(mockPrisma as never);
  });

  describe("fetchAndParseNFes", () => {
    it("should fetch invoices with XML content", async () => {
      const findMany = vi.fn().mockResolvedValue([]);
      mockPrisma.receivedInvoice = { findMany };

      await service.fetchAndParseNFes({ companyId: "company-1" });

      expect(findMany).toHaveBeenCalledWith({
        where: {
          companyId: "company-1",
          xmlContent: { not: null },
        },
        take: 100,
        select: { xmlContent: true },
      });
    });

    it("should filter by invoiceIds when provided", async () => {
      const findMany = vi.fn().mockResolvedValue([]);
      mockPrisma.receivedInvoice = { findMany };

      await service.fetchAndParseNFes({
        companyId: "company-1",
        invoiceIds: ["inv-1", "inv-2"],
      });

      expect(findMany).toHaveBeenCalledWith({
        where: {
          companyId: "company-1",
          id: { in: ["inv-1", "inv-2"] },
          xmlContent: { not: null },
        },
        take: 100,
        select: { xmlContent: true },
      });
    });

    it("should respect custom limit", async () => {
      const findMany = vi.fn().mockResolvedValue([]);
      mockPrisma.receivedInvoice = { findMany };

      await service.fetchAndParseNFes({
        companyId: "company-1",
        limit: 50,
      });

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });

    it("should return empty array when no invoices found", async () => {
      const result = await service.fetchAndParseNFes({ companyId: "company-1" });
      expect(result).toEqual([]);
    });

    it("should filter out null xmlContent", async () => {
      const findMany = vi.fn().mockResolvedValue([
        { xmlContent: null },
        { xmlContent: null },
      ]);
      mockPrisma.receivedInvoice = { findMany };

      const result = await service.fetchAndParseNFes({ companyId: "company-1" });
      expect(result).toEqual([]);
    });
  });

  describe("generateTaxConfig", () => {
    it("should return tax configuration with empty NFes", async () => {
      const result = await service.generateTaxConfig({ companyId: "company-1" });

      expect(result).toBeDefined();
      expect(result.statistics.totalNfes).toBe(0);
      expect(result.statistics.totalItems).toBe(0);
    });
  });

  describe("detectRegime", () => {
    it("should return regime analysis with empty NFes", async () => {
      const result = await service.detectRegime({ companyId: "company-1" });

      expect(result).toBeDefined();
      expect(result.regime).toBe("unknown");
    });
  });

  describe("analyzeFiscal", () => {
    it("should return fiscal analysis with empty NFes", async () => {
      const result = await service.analyzeFiscal({ companyId: "company-1" });

      expect(result).toBeDefined();
      expect(result.statistics.totalItems).toBe(0);
      expect(result.patterns).toEqual([]);
    });
  });

  describe("generateReport", () => {
    it("should return report and config", async () => {
      const result = await service.generateReport({ companyId: "company-1" });

      expect(result.report).toContain("RELATÓRIO DE CONFIGURAÇÃO TRIBUTÁRIA");
      expect(result.config).toBeDefined();
    });
  });

  describe("analyzeXmlBatch", () => {
    it("should return error for empty batch", () => {
      const result = service.analyzeXmlBatch([]);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Nenhum XML válido encontrado");
      expect(result.taxConfig).toBeNull();
      expect(result.fiscalPatterns).toBeNull();
      expect(result.entities).toBeNull();
    });

    it("should return error for invalid XMLs", () => {
      const result = service.analyzeXmlBatch(["invalid xml"]);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Nenhum XML válido encontrado");
    });
  });
});

// ==========================================================================
// RE-EXPORT TESTS (ensure re-exports work correctly)
// ==========================================================================

describe("Re-exports", () => {
  it("should re-export tax-config functions", async () => {
    const mod = await import("./tax-calculation");

    expect(typeof mod.detectTaxRegime).toBe("function");
    expect(typeof mod.extractStateAliquotas).toBe("function");
    expect(typeof mod.detectSTConfigs).toBe("function");
    expect(typeof mod.extractTaxPatterns).toBe("function");
    expect(typeof mod.analyzePisCofins).toBe("function");
    expect(typeof mod.analyzeIpi).toBe("function");
    expect(typeof mod.generateTaxConfiguration).toBe("function");
    expect(typeof mod.getCstDescription).toBe("function");
    expect(typeof mod.getDefaultInterstateAliquota).toBe("function");
    expect(typeof mod.generateTaxConfigReport).toBe("function");
  });

  it("should re-export fiscal-rules-engine functions", async () => {
    const mod = await import("./tax-calculation");

    expect(typeof mod.analyzeFiscalPatterns).toBe("function");
    expect(typeof mod.getCfopDescription).toBe("function");
    expect(typeof mod.getCstIcmsDescription).toBe("function");
    expect(typeof mod.suggestCfopForOperation).toBe("function");
  });
});
