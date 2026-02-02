import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import {
  toDecimal,
  round,
  toMoney,
  toQuantity,
  toPercent,
  sum,
  subtract,
  multiply,
  divide,
  percentOf,
  isPositive,
  isNegative,
  isZero,
  compare,
  max,
  min,
  abs,
  validateStock,
  calculateMarkup,
  calculateMargin,
  calculateICMS,
  calculateIPI,
  calculatePIS,
  calculateCOFINS,
  calculateTotalTaxes,
} from "./precision";

describe("Precision Utilities", () => {
  describe("toDecimal", () => {
    it("should convert number to Decimal", () => {
      expect(toDecimal(10.5).toNumber()).toBe(10.5);
    });

    it("should convert string to Decimal", () => {
      expect(toDecimal("10.5").toNumber()).toBe(10.5);
    });

    it("should handle null and undefined", () => {
      expect(toDecimal(null).toNumber()).toBe(0);
      expect(toDecimal(undefined).toNumber()).toBe(0);
    });

    it("should handle Decimal input", () => {
      const d = new Decimal(10.5);
      expect(toDecimal(d).toNumber()).toBe(10.5);
    });
  });

  describe("round", () => {
    it("should round to 2 decimals by default", () => {
      expect(round(10.555).toNumber()).toBe(10.56);
      expect(round(10.554).toNumber()).toBe(10.55);
    });

    it("should round to specified decimals", () => {
      expect(round(10.5555, 3).toNumber()).toBe(10.556);
      expect(round(10.5554, 3).toNumber()).toBe(10.555);
    });
  });

  describe("toMoney", () => {
    it("should format as money (2 decimals)", () => {
      expect(toMoney(10.555)).toBe(10.56);
      expect(toMoney(10.554)).toBe(10.55);
    });
  });

  describe("toQuantity", () => {
    it("should format as quantity (4 decimals)", () => {
      expect(toQuantity(10.55555)).toBe(10.5556);
      expect(toQuantity(10.55554)).toBe(10.5555);
    });
  });

  describe("toPercent", () => {
    it("should format as percent (2 decimals)", () => {
      expect(toPercent(10.555)).toBe(10.56);
    });
  });

  describe("sum", () => {
    it("should sum values with precision", () => {
      expect(sum(0.1, 0.2).toNumber()).toBe(0.3);
      expect(sum(10.5, 20.3, 30.2).toNumber()).toBe(61);
    });

    it("should handle null values", () => {
      expect(sum(10, null, 20, undefined).toNumber()).toBe(30);
    });
  });

  describe("subtract", () => {
    it("should subtract with precision", () => {
      expect(subtract(0.3, 0.1).toNumber()).toBe(0.2);
      expect(subtract(100, 30.5).toNumber()).toBe(69.5);
    });
  });

  describe("multiply", () => {
    it("should multiply with precision", () => {
      expect(multiply(0.1, 0.2).toNumber()).toBe(0.02);
      expect(multiply(10.5, 3).toNumber()).toBe(31.5);
    });
  });

  describe("divide", () => {
    it("should divide with precision", () => {
      expect(divide(10, 3).toDecimalPlaces(4).toNumber()).toBe(3.3333);
      expect(divide(100, 4).toNumber()).toBe(25);
    });

    it("should return 0 for division by zero", () => {
      expect(divide(10, 0).toNumber()).toBe(0);
    });
  });

  describe("percentOf", () => {
    it("should calculate percentage", () => {
      expect(percentOf(100, 10).toNumber()).toBe(10);
      expect(percentOf(200, 15).toNumber()).toBe(30);
    });
  });

  describe("isPositive", () => {
    it("should return true for positive values", () => {
      expect(isPositive(10)).toBe(true);
      expect(isPositive(0.001)).toBe(true);
    });

    it("should return false for zero and negative", () => {
      expect(isPositive(0)).toBe(false);
      expect(isPositive(-10)).toBe(false);
    });
  });

  describe("isNegative", () => {
    it("should return true for negative values", () => {
      expect(isNegative(-10)).toBe(true);
      expect(isNegative(-0.001)).toBe(true);
    });

    it("should return false for zero and positive", () => {
      expect(isNegative(0)).toBe(false);
      expect(isNegative(10)).toBe(false);
    });
  });

  describe("isZero", () => {
    it("should return true for zero", () => {
      expect(isZero(0)).toBe(true);
      expect(isZero("0")).toBe(true);
    });

    it("should return false for non-zero", () => {
      expect(isZero(10)).toBe(false);
      expect(isZero(-10)).toBe(false);
    });
  });

  describe("compare", () => {
    it("should compare values correctly", () => {
      expect(compare(10, 5)).toBe(1);
      expect(compare(5, 10)).toBe(-1);
      expect(compare(10, 10)).toBe(0);
    });
  });

  describe("max", () => {
    it("should return maximum value", () => {
      expect(max(10, 20, 5).toNumber()).toBe(20);
      expect(max(-10, -5, -20).toNumber()).toBe(-5);
    });
  });

  describe("min", () => {
    it("should return minimum value", () => {
      expect(min(10, 20, 5).toNumber()).toBe(5);
      expect(min(-10, -5, -20).toNumber()).toBe(-20);
    });
  });

  describe("abs", () => {
    it("should return absolute value", () => {
      expect(abs(-10).toNumber()).toBe(10);
      expect(abs(10).toNumber()).toBe(10);
    });
  });

  describe("validateStock", () => {
    it("should validate sufficient stock", () => {
      const result = validateStock(100, 50);
      expect(result.valid).toBe(true);
      expect(result.newStock.toNumber()).toBe(50);
    });

    it("should reject insufficient stock", () => {
      const result = validateStock(50, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Estoque insuficiente");
    });

    it("should allow negative stock when flag is set", () => {
      const result = validateStock(50, 100, true);
      expect(result.valid).toBe(true);
      expect(result.newStock.toNumber()).toBe(-50);
    });
  });

  describe("calculateMarkup", () => {
    it("should calculate markup correctly", () => {
      expect(calculateMarkup(100, 30).toNumber()).toBe(130);
      expect(calculateMarkup(100, 50).toNumber()).toBe(150);
    });
  });

  describe("calculateMargin", () => {
    it("should calculate margin correctly", () => {
      expect(calculateMargin(70, 30).toDecimalPlaces(2).toNumber()).toBe(100);
      expect(calculateMargin(50, 50).toDecimalPlaces(2).toNumber()).toBe(100);
    });

    it("should handle edge cases", () => {
      expect(calculateMargin(100, 100).toNumber()).toBe(100);
      expect(calculateMargin(100, 0).toNumber()).toBe(100);
    });
  });

  describe("Tax Calculations", () => {
    it("should calculate ICMS", () => {
      expect(calculateICMS(1000, 18).toNumber()).toBe(180);
      expect(calculateICMS(1000, 12).toNumber()).toBe(120);
    });

    it("should calculate IPI", () => {
      expect(calculateIPI(1000, 10).toNumber()).toBe(100);
      expect(calculateIPI(1000, 5).toNumber()).toBe(50);
    });

    it("should calculate PIS with default rate", () => {
      expect(calculatePIS(1000).toNumber()).toBe(16.5);
    });

    it("should calculate COFINS with default rate", () => {
      expect(calculateCOFINS(1000).toNumber()).toBe(76);
    });

    it("should calculate total taxes", () => {
      const taxes = calculateTotalTaxes(1000, 18, 10, 1.65, 7.6);
      expect(taxes.icms.toNumber()).toBe(180);
      expect(taxes.ipi.toNumber()).toBe(100);
      expect(taxes.pis.toNumber()).toBe(16.5);
      expect(taxes.cofins.toNumber()).toBe(76);
      expect(taxes.total.toNumber()).toBe(372.5);
    });
  });

  describe("Floating Point Precision", () => {
    it("should avoid floating point errors", () => {
      // Classic floating point issue: 0.1 + 0.2 !== 0.3 in JavaScript
      expect(0.1 + 0.2).not.toBe(0.3);
      expect(sum(0.1, 0.2).toNumber()).toBe(0.3);
    });

    it("should handle currency calculations precisely", () => {
      const price = 19.99;
      const quantity = 3;
      const total = multiply(price, quantity);
      expect(total.toNumber()).toBe(59.97);
    });

    it("should handle tax calculations precisely", () => {
      const baseCalculo = 1234.56;
      const icms = calculateICMS(baseCalculo, 18);
      expect(icms.toNumber()).toBe(222.22);
    });
  });
});
