import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate } from "./export";

describe("export utilities", () => {
  describe("formatCurrency", () => {
    it("should format positive numbers", () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain("1.234");
      expect(result).toContain("56");
    });

    it("should format zero", () => {
      const result = formatCurrency(0);
      expect(result).toContain("0,00");
    });

    it("should format negative numbers", () => {
      const result = formatCurrency(-1234.56);
      expect(result).toContain("1.234");
      expect(result).toContain("-");
    });

    it("should handle null", () => {
      const result = formatCurrency(null);
      expect(result).toContain("0,00");
    });

    it("should handle undefined", () => {
      const result = formatCurrency(undefined);
      expect(result).toContain("0,00");
    });

    it("should format large numbers", () => {
      const result = formatCurrency(1234567.89);
      expect(result).toContain("1.234.567");
    });

    it("should format small decimals", () => {
      const result = formatCurrency(0.01);
      expect(result).toContain("0,01");
    });

    it("should round to 2 decimal places", () => {
      const result = formatCurrency(1.999);
      expect(result).toContain("2,00");
    });
  });

  describe("formatDate", () => {
    it("should format Date object", () => {
      const date = new Date(2026, 0, 25); // January 25, 2026
      expect(formatDate(date)).toBe("25/01/2026");
    });

    it("should format ISO string with timezone consideration", () => {
      // Use a date that won't shift due to timezone
      const result = formatDate("2026-01-15T12:00:00Z");
      expect(result).toMatch(/\d{2}\/01\/2026/);
    });

    it("should handle null", () => {
      expect(formatDate(null)).toBe("-");
    });

    it("should handle undefined", () => {
      expect(formatDate(undefined)).toBe("-");
    });

    it("should handle empty string", () => {
      expect(formatDate("")).toBe("-");
    });
  });
});

describe("export functions", () => {
  it("exportToExcel should be a function", async () => {
    const { exportToExcel } = await import("./export");
    expect(typeof exportToExcel).toBe("function");
  });

  it("exportToPdf should be a function", async () => {
    const { exportToPdf } = await import("./export");
    expect(typeof exportToPdf).toBe("function");
  });
});
