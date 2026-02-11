/**
 * Tests for InvoiceService
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  InvoiceService,
  calculateWeightedAverageCost,
  calculateItemTotal,
  calculateDueDate,
  generateNextCode,
  formatInvoiceNumber,
  detectQuantityDivergence,
  detectPriceDivergence,
} from "./invoice";

// ==========================================================================
// PURE FUNCTION TESTS
// ==========================================================================

describe("calculateWeightedAverageCost", () => {
  it("should calculate weighted average for first entry", () => {
    const result = calculateWeightedAverageCost({
      currentQuantity: 0,
      currentUnitCost: 0,
      incomingQuantity: 100,
      incomingUnitCost: 10,
    });

    expect(result.newQuantity).toBe(100);
    expect(result.newUnitCost).toBe(10);
    expect(result.newTotalCost).toBe(1000);
  });

  it("should calculate weighted average for subsequent entry", () => {
    const result = calculateWeightedAverageCost({
      currentQuantity: 100,
      currentUnitCost: 10,
      incomingQuantity: 50,
      incomingUnitCost: 16,
    });

    // (100*10 + 50*16) / 150 = (1000 + 800) / 150 = 12
    expect(result.newQuantity).toBe(150);
    expect(result.newUnitCost).toBe(12);
    expect(result.newTotalCost).toBe(1800);
  });

  it("should handle zero current quantity", () => {
    const result = calculateWeightedAverageCost({
      currentQuantity: 0,
      currentUnitCost: 0,
      incomingQuantity: 50,
      incomingUnitCost: 20,
    });

    expect(result.newQuantity).toBe(50);
    expect(result.newUnitCost).toBe(20);
    expect(result.newTotalCost).toBe(1000);
  });

  it("should handle equal prices", () => {
    const result = calculateWeightedAverageCost({
      currentQuantity: 100,
      currentUnitCost: 15,
      incomingQuantity: 100,
      incomingUnitCost: 15,
    });

    expect(result.newQuantity).toBe(200);
    expect(result.newUnitCost).toBe(15);
    expect(result.newTotalCost).toBe(3000);
  });

  it("should use incoming cost when both quantities are zero", () => {
    const result = calculateWeightedAverageCost({
      currentQuantity: 0,
      currentUnitCost: 0,
      incomingQuantity: 0,
      incomingUnitCost: 25,
    });

    expect(result.newQuantity).toBe(0);
    expect(result.newUnitCost).toBe(25);
    expect(result.newTotalCost).toBe(0);
  });
});

describe("calculateItemTotal", () => {
  it("should calculate total without discount", () => {
    const result = calculateItemTotal({ quantity: 10, unitPrice: 100 });
    expect(result.totalPrice).toBe(1000);
  });

  it("should calculate total with discount", () => {
    const result = calculateItemTotal({
      quantity: 10,
      unitPrice: 100,
      discountPercent: 10,
    });
    expect(result.totalPrice).toBe(900);
  });

  it("should handle zero discount", () => {
    const result = calculateItemTotal({
      quantity: 5,
      unitPrice: 200,
      discountPercent: 0,
    });
    expect(result.totalPrice).toBe(1000);
  });

  it("should handle 100% discount", () => {
    const result = calculateItemTotal({
      quantity: 10,
      unitPrice: 100,
      discountPercent: 100,
    });
    expect(result.totalPrice).toBe(0);
  });

  it("should round to 2 decimal places", () => {
    const result = calculateItemTotal({
      quantity: 3,
      unitPrice: 33.33,
      discountPercent: 0,
    });
    expect(result.totalPrice).toBe(99.99);
  });

  it("should handle fractional quantities", () => {
    const result = calculateItemTotal({
      quantity: 2.5,
      unitPrice: 10,
      discountPercent: 0,
    });
    expect(result.totalPrice).toBe(25);
  });
});

describe("calculateDueDate", () => {
  it("should default to 30 days", () => {
    const issueDate = new Date(2026, 0, 1); // Jan 1, 2026 local
    const result = calculateDueDate({ issueDate });
    expect(result.getDate()).toBe(31);
    expect(result.getMonth()).toBe(0); // January
  });

  it("should use custom days", () => {
    const issueDate = new Date(2026, 0, 1); // Jan 1, 2026 local
    const result = calculateDueDate({ issueDate, defaultDays: 60 });
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(2); // March
    expect(result.getDate()).toBe(2);
  });

  it("should handle month rollover", () => {
    const issueDate = new Date(2026, 0, 15); // Jan 15, 2026 local
    const result = calculateDueDate({ issueDate, defaultDays: 30 });
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(14);
  });

  it("should not mutate original date", () => {
    const issueDate = new Date("2026-01-01");
    const originalTime = issueDate.getTime();
    calculateDueDate({ issueDate });
    expect(issueDate.getTime()).toBe(originalTime);
  });
});

describe("generateNextCode", () => {
  it("should increment from last code", () => {
    expect(generateNextCode(42)).toBe(43);
  });

  it("should start from 1 when null", () => {
    expect(generateNextCode(null)).toBe(1);
  });

  it("should start from 1 when undefined", () => {
    expect(generateNextCode(undefined)).toBe(1);
  });

  it("should start from 1 when 0", () => {
    expect(generateNextCode(0)).toBe(1);
  });
});

describe("formatInvoiceNumber", () => {
  it("should pad to 9 digits", () => {
    expect(formatInvoiceNumber(1)).toBe("000000001");
    expect(formatInvoiceNumber(123)).toBe("000000123");
    expect(formatInvoiceNumber(123456789)).toBe("123456789");
  });

  it("should handle large numbers", () => {
    expect(formatInvoiceNumber(1234567890)).toBe("1234567890");
  });
});

describe("detectQuantityDivergence", () => {
  it("should detect when NFe quantity exceeds pending", () => {
    const result = detectQuantityDivergence(100, 50);
    expect(result.isDivergent).toBe(true);
    expect(result.note).toContain("100");
    expect(result.note).toContain("50");
  });

  it("should not flag when NFe quantity equals pending", () => {
    const result = detectQuantityDivergence(50, 50);
    expect(result.isDivergent).toBe(false);
    expect(result.note).toBeNull();
  });

  it("should not flag when NFe quantity is less than pending", () => {
    const result = detectQuantityDivergence(30, 50);
    expect(result.isDivergent).toBe(false);
    expect(result.note).toBeNull();
  });
});

describe("detectPriceDivergence", () => {
  it("should detect price divergence above 5%", () => {
    const result = detectPriceDivergence(110, 100);
    expect(result.isDivergent).toBe(true);
    expect(result.note).toContain("110.00");
    expect(result.note).toContain("100.00");
  });

  it("should not flag price within 5% tolerance", () => {
    const result = detectPriceDivergence(104, 100);
    expect(result.isDivergent).toBe(false);
    expect(result.note).toBeNull();
  });

  it("should use custom tolerance", () => {
    const result = detectPriceDivergence(104, 100, 3);
    expect(result.isDivergent).toBe(true);
  });

  it("should handle zero PO price", () => {
    const result = detectPriceDivergence(100, 0);
    expect(result.isDivergent).toBe(false);
    expect(result.note).toBeNull();
  });

  it("should detect lower price divergence", () => {
    const result = detectPriceDivergence(90, 100);
    expect(result.isDivergent).toBe(true);
  });
});

// ==========================================================================
// SERVICE CLASS TESTS
// ==========================================================================

describe("InvoiceService", () => {
  let service: InvoiceService;
  let mockPrisma: Record<string, unknown>;

  beforeEach(() => {
    mockPrisma = {
      issuedInvoice: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    service = new InvoiceService(mockPrisma as never);
  });

  describe("processStockEntry", () => {
    it("should create inventory if not exists and process entry", async () => {
      const mockTx = {
        inventory: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({
            id: "inv-1",
            quantity: 0,
            unitCost: 10,
            totalCost: 0,
            reservedQty: 0,
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        inventoryMovement: {
          create: vi.fn().mockResolvedValue({ id: "mov-1" }),
        },
      };

      const result = await service.processStockEntry(mockTx as never, {
        materialId: "mat-1",
        companyId: "company-1",
        quantity: 100,
        unitPrice: 10,
        totalPrice: 1000,
        invoiceId: "nfe-1",
        invoiceNumber: 123,
        supplierName: "Fornecedor X",
      });

      expect(result).toBe("mov-1");
      expect(mockTx.inventory.create).toHaveBeenCalled();
      expect(mockTx.inventory.update).toHaveBeenCalled();
      expect(mockTx.inventoryMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            movementType: "ENTRY",
            documentType: "NFE",
          }),
        }),
      );
    });

    it("should update existing inventory with weighted average", async () => {
      const mockTx = {
        inventory: {
          findFirst: vi.fn().mockResolvedValue({
            id: "inv-1",
            quantity: 100,
            unitCost: 10,
            totalCost: 1000,
            reservedQty: 0,
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        inventoryMovement: {
          create: vi.fn().mockResolvedValue({ id: "mov-2" }),
        },
      };

      await service.processStockEntry(mockTx as never, {
        materialId: "mat-1",
        companyId: "company-1",
        quantity: 50,
        unitPrice: 16,
        totalPrice: 800,
        invoiceId: "nfe-1",
        invoiceNumber: 123,
        supplierName: "Fornecedor X",
      });

      expect(mockTx.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantity: 150,
            unitCost: 12, // (100*10 + 50*16) / 150
          }),
        }),
      );
    });
  });

  describe("updateSupplierPrice", () => {
    it("should update supplier material price", async () => {
      const mockTx = {
        supplierMaterial: {
          findFirst: vi.fn().mockResolvedValue({ id: "sm-1" }),
          update: vi.fn().mockResolvedValue({}),
        },
      };

      await service.updateSupplierPrice(mockTx as never, {
        supplierId: "sup-1",
        materialId: "mat-1",
        unitPrice: 15,
      });

      expect(mockTx.supplierMaterial.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "sm-1" },
          data: expect.objectContaining({ lastPrice: 15 }),
        }),
      );
    });

    it("should skip if supplier material not found", async () => {
      const mockTx = {
        supplierMaterial: {
          findFirst: vi.fn().mockResolvedValue(null),
          update: vi.fn(),
        },
      };

      await service.updateSupplierPrice(mockTx as never, {
        supplierId: "sup-1",
        materialId: "mat-1",
        unitPrice: 15,
      });

      expect(mockTx.supplierMaterial.update).not.toHaveBeenCalled();
    });
  });

  describe("updatePurchaseOrderStatus", () => {
    it("should set COMPLETED when no pending invoices", async () => {
      const mockTx = {
        receivedInvoice: {
          count: vi.fn().mockResolvedValue(0),
        },
        purchaseOrder: {
          update: vi.fn().mockResolvedValue({}),
        },
      };

      await service.updatePurchaseOrderStatus(mockTx as never, "po-1");

      expect(mockTx.purchaseOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "COMPLETED" },
        }),
      );
    });

    it("should set PARTIAL when pending invoices exist", async () => {
      const mockTx = {
        receivedInvoice: {
          count: vi.fn().mockResolvedValue(2),
        },
        purchaseOrder: {
          update: vi.fn().mockResolvedValue({}),
        },
      };

      await service.updatePurchaseOrderStatus(mockTx as never, "po-1");

      expect(mockTx.purchaseOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "PARTIAL" },
        }),
      );
    });
  });

  describe("generatePayable", () => {
    it("should create accounts payable with correct data", async () => {
      const mockTx = {
        accountsPayable: {
          findFirst: vi.fn().mockResolvedValue({ code: 99 }),
          create: vi.fn().mockResolvedValue({ id: "pay-1" }),
        },
      };

      const result = await service.generatePayable(mockTx as never, {
        companyId: "company-1",
        supplierId: "sup-1",
        invoiceId: "nfe-1",
        invoiceNumber: 123,
        supplierName: "Fornecedor X",
        issueDate: new Date("2026-01-01"),
        totalInvoice: 5000,
      });

      expect(result).toBe("pay-1");
      expect(mockTx.accountsPayable.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 100,
            status: "PENDING",
            originalValue: 5000,
            netValue: 5000,
          }),
        }),
      );
    });

    it("should start from code 1 when no previous payable", async () => {
      const mockTx = {
        accountsPayable: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: "pay-1" }),
        },
      };

      await service.generatePayable(mockTx as never, {
        companyId: "company-1",
        supplierId: "sup-1",
        invoiceId: "nfe-1",
        invoiceNumber: 1,
        supplierName: "Fornecedor",
        issueDate: new Date("2026-01-01"),
        totalInvoice: 1000,
      });

      expect(mockTx.accountsPayable.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ code: 1 }),
        }),
      );
    });
  });

  describe("getNextIssuedInvoiceCode", () => {
    it("should return next code and formatted number", async () => {
      mockPrisma.issuedInvoice = {
        findFirst: vi.fn().mockResolvedValue({ code: 42 }),
      };

      const result = await service.getNextIssuedInvoiceCode("company-1");

      expect(result.code).toBe(43);
      expect(result.invoiceNumber).toBe("000000043");
    });

    it("should start from 1 when no previous invoice", async () => {
      mockPrisma.issuedInvoice = {
        findFirst: vi.fn().mockResolvedValue(null),
      };

      const result = await service.getNextIssuedInvoiceCode("company-1");

      expect(result.code).toBe(1);
      expect(result.invoiceNumber).toBe("000000001");
    });
  });
});
