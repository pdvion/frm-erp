import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatInteger,
  formatPercent,
  formatDate,
  formatDateTime,
  formatShortDate,
  formatMonthYear,
  formatCNPJ,
  formatCPF,
  formatPhone,
  formatCEP,
  formatNFeKey,
  formatHours,
  formatBytes,
} from "./formatters";

describe("formatCurrency", () => {
  it("should format positive numbers", () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain("R$");
    expect(result).toContain("1.234,56");
  });

  it("should format zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("R$");
    expect(result).toContain("0,00");
  });

  it("should format negative numbers", () => {
    const result = formatCurrency(-1234.56);
    expect(result).toContain("1.234,56");
    expect(result).toContain("-");
  });

  it("should handle null", () => {
    const result = formatCurrency(null);
    expect(result).toContain("R$");
    expect(result).toContain("0,00");
  });

  it("should handle undefined", () => {
    const result = formatCurrency(undefined);
    expect(result).toContain("R$");
    expect(result).toContain("0,00");
  });
});

describe("formatNumber", () => {
  it("should format with 2 decimal places", () => {
    expect(formatNumber(1234.5)).toBe("1.234,50");
  });

  it("should handle null", () => {
    expect(formatNumber(null)).toBe("0,00");
  });

  it("should handle undefined", () => {
    expect(formatNumber(undefined)).toBe("0,00");
  });
});

describe("formatInteger", () => {
  it("should format without decimal places", () => {
    expect(formatInteger(1234)).toBe("1.234");
  });

  it("should round decimal numbers", () => {
    expect(formatInteger(1234.7)).toBe("1.235");
  });

  it("should handle null", () => {
    expect(formatInteger(null)).toBe("0");
  });
});

describe("formatPercent", () => {
  it("should format decimal as percent", () => {
    expect(formatPercent(0.15)).toBe("15,0%");
  });

  it("should handle 100%", () => {
    expect(formatPercent(1)).toBe("100,0%");
  });

  it("should handle null", () => {
    expect(formatPercent(null)).toBe("0,0%");
  });
});

describe("formatDate", () => {
  it("should format Date object", () => {
    const date = new Date(2026, 0, 19); // Jan 19, 2026
    expect(formatDate(date)).toBe("19/01/2026");
  });

  it("should format ISO string", () => {
    // Usar data local para evitar problemas de timezone
    const result = formatDate("2026-01-19T12:00:00.000Z");
    expect(result).toMatch(/\d{2}\/\d{2}\/2026/);
  });

  it("should handle null", () => {
    expect(formatDate(null)).toBe("-");
  });

  it("should handle invalid date", () => {
    expect(formatDate("invalid")).toBe("-");
  });
});

describe("formatDateTime", () => {
  it("should format date and time", () => {
    const date = new Date(2026, 0, 19, 14, 30);
    expect(formatDateTime(date)).toMatch(/19\/01\/2026/);
    expect(formatDateTime(date)).toMatch(/14:30/);
  });

  it("should handle null", () => {
    expect(formatDateTime(null)).toBe("-");
  });
});

describe("formatShortDate", () => {
  it("should format short date", () => {
    const date = new Date(2026, 0, 19);
    const result = formatShortDate(date);
    expect(result).toMatch(/19/);
    expect(result).toMatch(/jan/i);
  });

  it("should handle null", () => {
    expect(formatShortDate(null)).toBe("-");
  });
});

describe("formatMonthYear", () => {
  it("should format month and year", () => {
    const date = new Date(2026, 0, 19);
    const result = formatMonthYear(date);
    expect(result).toMatch(/janeiro/i);
    expect(result).toMatch(/2026/);
  });

  it("should handle null", () => {
    expect(formatMonthYear(null)).toBe("-");
  });
});

describe("formatCNPJ", () => {
  it("should format valid CNPJ", () => {
    expect(formatCNPJ("12345678000190")).toBe("12.345.678/0001-90");
  });

  it("should return original if invalid length", () => {
    expect(formatCNPJ("123456")).toBe("123456");
  });

  it("should handle null", () => {
    expect(formatCNPJ(null)).toBe("-");
  });

  it("should clean non-numeric characters", () => {
    expect(formatCNPJ("12.345.678/0001-90")).toBe("12.345.678/0001-90");
  });
});

describe("formatCPF", () => {
  it("should format valid CPF", () => {
    expect(formatCPF("12345678900")).toBe("123.456.789-00");
  });

  it("should return original if invalid length", () => {
    expect(formatCPF("123456")).toBe("123456");
  });

  it("should handle null", () => {
    expect(formatCPF(null)).toBe("-");
  });
});

describe("formatPhone", () => {
  it("should format mobile phone (11 digits)", () => {
    expect(formatPhone("11999999999")).toBe("(11) 99999-9999");
  });

  it("should format landline (10 digits)", () => {
    expect(formatPhone("1133333333")).toBe("(11) 3333-3333");
  });

  it("should return original if invalid length", () => {
    expect(formatPhone("123456")).toBe("123456");
  });

  it("should handle null", () => {
    expect(formatPhone(null)).toBe("-");
  });
});

describe("formatCEP", () => {
  it("should format valid CEP", () => {
    expect(formatCEP("01234567")).toBe("01234-567");
  });

  it("should return original if invalid length", () => {
    expect(formatCEP("12345")).toBe("12345");
  });

  it("should handle null", () => {
    expect(formatCEP(null)).toBe("-");
  });
});

describe("formatNFeKey", () => {
  it("should format valid NFe key", () => {
    const key = "35260112345678000190550010000000011123456789";
    const formatted = formatNFeKey(key);
    expect(formatted).toContain(" ");
    expect(formatted.replace(/ /g, "")).toBe(key);
  });

  it("should return original if invalid length", () => {
    expect(formatNFeKey("123456")).toBe("123456");
  });

  it("should handle null", () => {
    expect(formatNFeKey(null)).toBe("-");
  });
});

describe("formatHours", () => {
  it("should format decimal hours", () => {
    expect(formatHours(8.5)).toBe("08:30");
  });

  it("should format whole hours", () => {
    expect(formatHours(8)).toBe("08:00");
  });

  it("should handle zero", () => {
    expect(formatHours(0)).toBe("00:00");
  });

  it("should handle null", () => {
    expect(formatHours(null)).toBe("00:00");
  });
});

describe("formatBytes", () => {
  it("should format bytes", () => {
    expect(formatBytes(500)).toBe("500.0 B");
  });

  it("should format kilobytes", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
  });

  it("should format megabytes", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
  });

  it("should format gigabytes", () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1.0 GB");
  });

  it("should handle zero", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("should handle null", () => {
    expect(formatBytes(null)).toBe("0 B");
  });
});
