/**
 * Tests for SupplierPortalService
 * VIO-1125 — Portal do Fornecedor
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calculateTokenExpiry,
  isTokenExpired,
  isTokenRevoked,
  SupplierPortalService,
} from "./supplier-portal";

// ─── Pure Function Tests ──────────────────────────────────────────────────────

describe("calculateTokenExpiry (supplier)", () => {
  it("should default to 30 days", () => {
    const result = calculateTokenExpiry();
    const days = (result.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(days).toBeGreaterThan(29);
    expect(days).toBeLessThan(31);
  });

  it("should respect custom days", () => {
    const result = calculateTokenExpiry(7);
    const days = (result.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(days).toBeGreaterThan(6);
    expect(days).toBeLessThan(8);
  });

  it("should cap at 365 days", () => {
    const result = calculateTokenExpiry(999);
    const days = (result.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(days).toBeLessThanOrEqual(366);
  });

  it("should enforce minimum of 1 day", () => {
    const result = calculateTokenExpiry(0);
    const days = (result.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(days).toBeGreaterThan(0);
  });
});

describe("isTokenExpired (supplier)", () => {
  it("should return true for null", () => { expect(isTokenExpired(null)).toBe(true); });
  it("should return true for undefined", () => { expect(isTokenExpired(undefined)).toBe(true); });
  it("should return true for past date", () => { expect(isTokenExpired(new Date("2020-01-01"))).toBe(true); });
  it("should return false for future date", () => { expect(isTokenExpired(new Date("2099-01-01"))).toBe(false); });
});

describe("isTokenRevoked (supplier)", () => {
  it("should return false for null", () => { expect(isTokenRevoked(null)).toBe(false); });
  it("should return false for undefined", () => { expect(isTokenRevoked(undefined)).toBe(false); });
  it("should return true for a date", () => { expect(isTokenRevoked(new Date())).toBe(true); });
});

// ─── Service Tests ────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
describe("SupplierPortalService", () => {
  const mockPrisma: any = {
    supplierPortalToken: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    quote: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    quoteItem: {
      update: vi.fn(),
      findMany: vi.fn(),
    },
    purchaseOrder: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    accountsPayable: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((fn: any) => fn(mockPrisma)),
  };

  let svc: SupplierPortalService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new SupplierPortalService(mockPrisma);
  });

  describe("generateToken", () => {
    it("should create a token", async () => {
      mockPrisma.supplierPortalToken.create.mockResolvedValue({
        id: "tok-1", token: "uuid-token", expiresAt: new Date("2099-01-01"),
      });

      const result = await svc.generateToken("comp-1", "sup-1", "user-1");
      expect(result.token).toBe("uuid-token");
      expect(mockPrisma.supplierPortalToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ companyId: "comp-1", supplierId: "sup-1", createdBy: "user-1" }),
      });
    });
  });

  describe("revokeToken", () => {
    it("should throw if token not found", async () => {
      mockPrisma.supplierPortalToken.findFirst.mockResolvedValue(null);
      await expect(svc.revokeToken("tok-1", "comp-1")).rejects.toThrow("Token não encontrado");
    });

    it("should update revokedAt", async () => {
      mockPrisma.supplierPortalToken.findFirst.mockResolvedValue({ id: "tok-1" });
      mockPrisma.supplierPortalToken.update.mockResolvedValue({ id: "tok-1", revokedAt: new Date() });

      await svc.revokeToken("tok-1", "comp-1");
      expect(mockPrisma.supplierPortalToken.update).toHaveBeenCalledWith({
        where: { id: "tok-1" },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe("validateToken", () => {
    it("should return null for non-existent token", async () => {
      mockPrisma.supplierPortalToken.findUnique.mockResolvedValue(null);
      expect(await svc.validateToken("bad")).toBeNull();
    });

    it("should return expired for expired token", async () => {
      mockPrisma.supplierPortalToken.findUnique.mockResolvedValue({
        id: "tok-1", expiresAt: new Date("2020-01-01"), revokedAt: null, supplier: {}, company: {},
      });
      expect(await svc.validateToken("expired")).toEqual({ expired: true });
    });

    it("should return revoked for revoked token", async () => {
      mockPrisma.supplierPortalToken.findUnique.mockResolvedValue({
        id: "tok-1", expiresAt: new Date("2099-01-01"), revokedAt: new Date(), supplier: {}, company: {},
      });
      expect(await svc.validateToken("revoked")).toEqual({ revoked: true });
    });

    it("should return token data for valid token", async () => {
      mockPrisma.supplierPortalToken.findUnique.mockResolvedValue({
        id: "tok-1", companyId: "comp-1", supplierId: "sup-1",
        expiresAt: new Date("2099-01-01"), revokedAt: null,
        supplier: { id: "sup-1" }, company: { id: "comp-1" },
      });
      mockPrisma.supplierPortalToken.update.mockResolvedValue({});

      const result = await svc.validateToken("valid");
      expect(result).toMatchObject({ companyId: "comp-1", supplierId: "sup-1" });
    });
  });

  describe("getQuotes", () => {
    it("should return paginated quotes", async () => {
      mockPrisma.quote.findMany.mockResolvedValue([
        { id: "q1", code: 1, totalValue: 500, status: "SENT" },
      ]);
      mockPrisma.quote.count.mockResolvedValue(1);

      const result = await svc.getQuotes("sup-1", { limit: 10, offset: 0 });
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });
  });

  describe("respondToQuote", () => {
    it("should throw if quote not found", async () => {
      mockPrisma.quote.findFirst.mockResolvedValue(null);
      await expect(svc.respondToQuote("sup-1", "q-1", { items: [{ id: "i-1", unitPrice: 10 }] }))
        .rejects.toThrow("Cotação não encontrada ou já respondida");
    });

    it("should update items and set status to RECEIVED", async () => {
      mockPrisma.quote.findFirst.mockResolvedValue({
        id: "q-1", supplierId: "sup-1", status: "SENT",
        items: [{ id: "i-1", quantity: 10, deliveryDays: null, notes: null }],
        paymentTerms: null, deliveryTerms: null, validUntil: null,
      });
      mockPrisma.quoteItem.update.mockResolvedValue({});
      mockPrisma.quoteItem.findMany.mockResolvedValue([{ totalPrice: 100 }]);
      mockPrisma.quote.update.mockResolvedValue({});

      const result = await svc.respondToQuote("sup-1", "q-1", {
        items: [{ id: "i-1", unitPrice: 10 }],
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.quoteItem.update).toHaveBeenCalledWith({
        where: { id: "i-1" },
        data: expect.objectContaining({ unitPrice: 10, totalPrice: 100 }),
      });
      expect(mockPrisma.quote.update).toHaveBeenCalledWith({
        where: { id: "q-1" },
        data: expect.objectContaining({ status: "RECEIVED" }),
      });
    });
  });

  describe("getPurchaseOrders", () => {
    it("should return paginated POs", async () => {
      mockPrisma.purchaseOrder.findMany.mockResolvedValue([
        { id: "po1", code: 1, totalValue: 1000, status: "CONFIRMED" },
      ]);
      mockPrisma.purchaseOrder.count.mockResolvedValue(1);

      const result = await svc.getPurchaseOrders("comp-1", "sup-1", { limit: 10, offset: 0 });
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });
  });

  describe("getPaymentSummary", () => {
    it("should calculate summary correctly", async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 86400000);
      const past = new Date(now.getTime() - 86400000);

      mockPrisma.accountsPayable.findMany.mockResolvedValue([
        { status: "PAID", netValue: 100, paidValue: 100, dueDate: past },
        { status: "PENDING", netValue: 200, paidValue: 0, dueDate: future },
        { status: "PENDING", netValue: 300, paidValue: 0, dueDate: past },
      ]);

      const result = await svc.getPaymentSummary("comp-1", "sup-1");
      expect(result.totalPaid).toBe(100);
      expect(result.totalPending).toBe(200);
      expect(result.totalOverdue).toBe(300);
      expect(result.countPaid).toBe(1);
      expect(result.countPending).toBe(1);
      expect(result.countOverdue).toBe(1);
    });
  });
});
