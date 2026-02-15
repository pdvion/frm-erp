/**
 * Tests for CustomerPortalService
 * VIO-1124 — Portal do Cliente
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calculateTokenExpiry,
  isTokenExpired,
  isTokenRevoked,
  formatCurrency,
  CustomerPortalService,
} from "./customer-portal";

// ─── Pure Function Tests ──────────────────────────────────────────────────────

describe("calculateTokenExpiry", () => {
  it("should default to 30 days", () => {
    const result = calculateTokenExpiry();
    const diff = result.getTime() - Date.now();
    const days = diff / (1000 * 60 * 60 * 24);
    expect(days).toBeGreaterThan(29);
    expect(days).toBeLessThan(31);
  });

  it("should respect custom days", () => {
    const result = calculateTokenExpiry(7);
    const diff = result.getTime() - Date.now();
    const days = diff / (1000 * 60 * 60 * 24);
    expect(days).toBeGreaterThan(6);
    expect(days).toBeLessThan(8);
  });

  it("should cap at 365 days", () => {
    const result = calculateTokenExpiry(999);
    const diff = result.getTime() - Date.now();
    const days = diff / (1000 * 60 * 60 * 24);
    expect(days).toBeLessThanOrEqual(366);
  });

  it("should enforce minimum of 1 day", () => {
    const result = calculateTokenExpiry(0);
    const diff = result.getTime() - Date.now();
    const days = diff / (1000 * 60 * 60 * 24);
    expect(days).toBeGreaterThan(0);
  });
});

describe("isTokenExpired", () => {
  it("should return true for null", () => {
    expect(isTokenExpired(null)).toBe(true);
  });

  it("should return true for undefined", () => {
    expect(isTokenExpired(undefined)).toBe(true);
  });

  it("should return true for past date", () => {
    const past = new Date("2020-01-01");
    expect(isTokenExpired(past)).toBe(true);
  });

  it("should return false for future date", () => {
    const future = new Date("2099-01-01");
    expect(isTokenExpired(future)).toBe(false);
  });
});

describe("isTokenRevoked", () => {
  it("should return false for null", () => {
    expect(isTokenRevoked(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isTokenRevoked(undefined)).toBe(false);
  });

  it("should return true for a date", () => {
    expect(isTokenRevoked(new Date())).toBe(true);
  });
});

describe("formatCurrency", () => {
  it("should format number as BRL", () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain("1.234,56");
  });

  it("should handle null/undefined as 0", () => {
    const result = formatCurrency(null);
    expect(result).toContain("0,00");
  });
});

// ─── Service Tests ────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
describe("CustomerPortalService", () => {
  const mockPrisma: any = {
    customerPortalToken: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    salesOrder: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    accountsReceivable: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  };

  let svc: CustomerPortalService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new CustomerPortalService(mockPrisma);
  });

  describe("generateToken", () => {
    it("should create a token with default expiry", async () => {
      const mockToken = {
        id: "tok-1",
        token: "uuid-token",
        expiresAt: new Date("2099-01-01"),
        companyId: "comp-1",
        customerId: "cust-1",
      };
      mockPrisma.customerPortalToken.create.mockResolvedValue(mockToken);

      const result = await svc.generateToken("comp-1", "cust-1", "user-1");

      expect(result.token).toBe("uuid-token");
      expect(result.expiresAt).toEqual(new Date("2099-01-01"));
      expect(mockPrisma.customerPortalToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId: "comp-1",
          customerId: "cust-1",
          createdBy: "user-1",
        }),
      });
    });
  });

  describe("revokeToken", () => {
    it("should return null if token not found", async () => {
      mockPrisma.customerPortalToken.findFirst.mockResolvedValue(null);

      const result = await svc.revokeToken("tok-1", "comp-1");
      expect(result).toBeNull();
    });

    it("should update revokedAt", async () => {
      mockPrisma.customerPortalToken.findFirst.mockResolvedValue({ id: "tok-1" });
      mockPrisma.customerPortalToken.update.mockResolvedValue({ id: "tok-1", revokedAt: new Date() });

      await svc.revokeToken("tok-1", "comp-1");

      expect(mockPrisma.customerPortalToken.update).toHaveBeenCalledWith({
        where: { id: "tok-1" },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe("validateToken", () => {
    it("should return null for non-existent token", async () => {
      mockPrisma.customerPortalToken.findUnique.mockResolvedValue(null);

      const result = await svc.validateToken("bad-token");
      expect(result).toBeNull();
    });

    it("should return expired for expired token", async () => {
      mockPrisma.customerPortalToken.findUnique.mockResolvedValue({
        id: "tok-1",
        expiresAt: new Date("2020-01-01"),
        revokedAt: null,
        customer: {},
        company: {},
      });

      const result = await svc.validateToken("expired-token");
      expect(result).toEqual({ expired: true });
    });

    it("should return revoked for revoked token", async () => {
      mockPrisma.customerPortalToken.findUnique.mockResolvedValue({
        id: "tok-1",
        expiresAt: new Date("2099-01-01"),
        revokedAt: new Date("2024-01-01"),
        customer: {},
        company: {},
      });

      const result = await svc.validateToken("revoked-token");
      expect(result).toEqual({ revoked: true });
    });

    it("should return token data for valid token", async () => {
      const mockData = {
        id: "tok-1",
        companyId: "comp-1",
        customerId: "cust-1",
        expiresAt: new Date("2099-01-01"),
        revokedAt: null,
        customer: { id: "cust-1", companyName: "Test" },
        company: { id: "comp-1", name: "FRM" },
      };
      mockPrisma.customerPortalToken.findUnique.mockResolvedValue(mockData);
      mockPrisma.customerPortalToken.update.mockResolvedValue({});

      const result = await svc.validateToken("valid-token");
      expect(result).toMatchObject({ companyId: "comp-1", customerId: "cust-1" });
    });
  });

  describe("getFinancialSummary", () => {
    it("should calculate summary correctly", async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 86400000);
      const past = new Date(now.getTime() - 86400000);

      mockPrisma.accountsReceivable.findMany.mockResolvedValue([
        { status: "PAID", netValue: 100, originalValue: 100, paidValue: 100, dueDate: past },
        { status: "PENDING", netValue: 200, originalValue: 200, paidValue: 0, dueDate: future },
        { status: "PENDING", netValue: 300, originalValue: 300, paidValue: 0, dueDate: past },
      ]);

      const result = await svc.getFinancialSummary("comp-1", "cust-1");

      expect(result.totalPaid).toBe(100);
      expect(result.totalPending).toBe(200);
      expect(result.totalOverdue).toBe(300);
      expect(result.countPaid).toBe(1);
      expect(result.countPending).toBe(1);
      expect(result.countOverdue).toBe(1);
    });
  });

  describe("getOrders", () => {
    it("should return paginated orders", async () => {
      mockPrisma.salesOrder.findMany.mockResolvedValue([
        { id: "o1", code: 1, totalValue: 100, status: "PENDING" },
      ]);
      mockPrisma.salesOrder.count.mockResolvedValue(1);

      const result = await svc.getOrders("comp-1", "cust-1", { limit: 10, offset: 0 });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });
  });
});
