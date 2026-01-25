import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const listInputSchema = z.object({
  search: z.string().optional(),
  inventoryType: z.enum(["RAW_MATERIAL", "SEMI_FINISHED", "FINISHED", "CRITICAL", "DEAD", "SCRAP"]).optional(),
  belowMinimum: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
}).optional();

const byMaterialIdInputSchema = z.object({ materialId: z.string() });

const adjustInputSchema = z.object({
  materialId: z.string(),
  quantity: z.number(),
  reason: z.string().min(1),
  documentNumber: z.string().optional(),
  movementType: z.enum(["ADJUSTMENT_IN", "ADJUSTMENT_OUT"]),
});

const transferInputSchema = z.object({
  materialId: z.string(),
  fromLocationId: z.string(),
  toLocationId: z.string(),
  quantity: z.number().positive(),
  reason: z.string().optional(),
});

const movementInputSchema = z.object({
  materialId: z.string(),
  quantity: z.number().positive(),
  movementType: z.enum(["ENTRY", "EXIT", "ADJUSTMENT_IN", "ADJUSTMENT_OUT", "TRANSFER", "RETURN"]),
  reason: z.string().min(1),
  documentNumber: z.string().optional(),
  documentType: z.string().optional(),
  unitCost: z.number().optional(),
  locationId: z.string().optional(),
});

const movementsListInputSchema = z.object({
  materialId: z.string().optional(),
  movementType: z.enum(["ENTRY", "EXIT", "ADJUSTMENT_IN", "ADJUSTMENT_OUT", "TRANSFER", "RETURN"]).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
}).optional();

describe("Inventory Router Schemas", () => {
  describe("list input", () => {
    it("should accept empty input", () => {
      const result = listInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept search string", () => {
      const result = listInputSchema.safeParse({ search: "parafuso" });
      expect(result.success).toBe(true);
    });

    it("should accept inventoryType RAW_MATERIAL", () => {
      const result = listInputSchema.safeParse({ inventoryType: "RAW_MATERIAL" });
      expect(result.success).toBe(true);
    });

    it("should accept inventoryType SEMI_FINISHED", () => {
      const result = listInputSchema.safeParse({ inventoryType: "SEMI_FINISHED" });
      expect(result.success).toBe(true);
    });

    it("should accept inventoryType FINISHED", () => {
      const result = listInputSchema.safeParse({ inventoryType: "FINISHED" });
      expect(result.success).toBe(true);
    });

    it("should accept inventoryType CRITICAL", () => {
      const result = listInputSchema.safeParse({ inventoryType: "CRITICAL" });
      expect(result.success).toBe(true);
    });

    it("should accept inventoryType DEAD", () => {
      const result = listInputSchema.safeParse({ inventoryType: "DEAD" });
      expect(result.success).toBe(true);
    });

    it("should accept inventoryType SCRAP", () => {
      const result = listInputSchema.safeParse({ inventoryType: "SCRAP" });
      expect(result.success).toBe(true);
    });

    it("should reject invalid inventoryType", () => {
      const result = listInputSchema.safeParse({ inventoryType: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("should accept belowMinimum true", () => {
      const result = listInputSchema.safeParse({ belowMinimum: true });
      expect(result.success).toBe(true);
    });

    it("should accept belowMinimum false", () => {
      const result = listInputSchema.safeParse({ belowMinimum: false });
      expect(result.success).toBe(true);
    });

    it("should default page to 1", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.page).toBe(1);
      }
    });

    it("should default limit to 20", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.limit).toBe(20);
      }
    });

    it("should reject page less than 1", () => {
      const result = listInputSchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it("should reject limit greater than 100", () => {
      const result = listInputSchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });
  });

  describe("byMaterialId input", () => {
    it("should accept valid materialId", () => {
      const result = byMaterialIdInputSchema.safeParse({ materialId: "mat-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing materialId", () => {
      const result = byMaterialIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("adjust input", () => {
    it("should accept valid adjustment in", () => {
      const result = adjustInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 10,
        reason: "Contagem física",
        movementType: "ADJUSTMENT_IN",
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid adjustment out", () => {
      const result = adjustInputSchema.safeParse({
        materialId: "mat-123",
        quantity: -5,
        reason: "Perda por avaria",
        movementType: "ADJUSTMENT_OUT",
      });
      expect(result.success).toBe(true);
    });

    it("should accept with documentNumber", () => {
      const result = adjustInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 10,
        reason: "Inventário",
        movementType: "ADJUSTMENT_IN",
        documentNumber: "INV-2026-001",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing materialId", () => {
      const result = adjustInputSchema.safeParse({
        quantity: 10,
        reason: "Ajuste",
        movementType: "ADJUSTMENT_IN",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing reason", () => {
      const result = adjustInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 10,
        movementType: "ADJUSTMENT_IN",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty reason", () => {
      const result = adjustInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 10,
        reason: "",
        movementType: "ADJUSTMENT_IN",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid movementType", () => {
      const result = adjustInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 10,
        reason: "Ajuste",
        movementType: "ENTRY",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("transfer input", () => {
    it("should accept valid transfer", () => {
      const result = transferInputSchema.safeParse({
        materialId: "mat-123",
        fromLocationId: "loc-001",
        toLocationId: "loc-002",
        quantity: 50,
      });
      expect(result.success).toBe(true);
    });

    it("should accept transfer with reason", () => {
      const result = transferInputSchema.safeParse({
        materialId: "mat-123",
        fromLocationId: "loc-001",
        toLocationId: "loc-002",
        quantity: 25,
        reason: "Reorganização de estoque",
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero quantity", () => {
      const result = transferInputSchema.safeParse({
        materialId: "mat-123",
        fromLocationId: "loc-001",
        toLocationId: "loc-002",
        quantity: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative quantity", () => {
      const result = transferInputSchema.safeParse({
        materialId: "mat-123",
        fromLocationId: "loc-001",
        toLocationId: "loc-002",
        quantity: -10,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing fromLocationId", () => {
      const result = transferInputSchema.safeParse({
        materialId: "mat-123",
        toLocationId: "loc-002",
        quantity: 50,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing toLocationId", () => {
      const result = transferInputSchema.safeParse({
        materialId: "mat-123",
        fromLocationId: "loc-001",
        quantity: 50,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("movement input", () => {
    it("should accept valid entry movement", () => {
      const result = movementInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 100,
        movementType: "ENTRY",
        reason: "Recebimento de compra",
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid exit movement", () => {
      const result = movementInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 50,
        movementType: "EXIT",
        reason: "Requisição de produção",
      });
      expect(result.success).toBe(true);
    });

    it("should accept all movement types", () => {
      const types = ["ENTRY", "EXIT", "ADJUSTMENT_IN", "ADJUSTMENT_OUT", "TRANSFER", "RETURN"];
      for (const type of types) {
        const result = movementInputSchema.safeParse({
          materialId: "mat-123",
          quantity: 10,
          movementType: type,
          reason: `Movimento ${type}`,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should accept with optional fields", () => {
      const result = movementInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 100,
        movementType: "ENTRY",
        reason: "Recebimento NF",
        documentNumber: "NF-12345",
        documentType: "INVOICE",
        unitCost: 15.50,
        locationId: "loc-001",
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero quantity", () => {
      const result = movementInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 0,
        movementType: "ENTRY",
        reason: "Teste",
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative quantity", () => {
      const result = movementInputSchema.safeParse({
        materialId: "mat-123",
        quantity: -10,
        movementType: "ENTRY",
        reason: "Teste",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty reason", () => {
      const result = movementInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 10,
        movementType: "ENTRY",
        reason: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid movementType", () => {
      const result = movementInputSchema.safeParse({
        materialId: "mat-123",
        quantity: 10,
        movementType: "INVALID",
        reason: "Teste",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("movements list input", () => {
    it("should accept empty input", () => {
      const result = movementsListInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept materialId filter", () => {
      const result = movementsListInputSchema.safeParse({ materialId: "mat-123" });
      expect(result.success).toBe(true);
    });

    it("should accept movementType filter", () => {
      const result = movementsListInputSchema.safeParse({ movementType: "ENTRY" });
      expect(result.success).toBe(true);
    });

    it("should accept date range", () => {
      const result = movementsListInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should default page to 1", () => {
      const result = movementsListInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.page).toBe(1);
      }
    });

    it("should default limit to 20", () => {
      const result = movementsListInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.limit).toBe(20);
      }
    });

    it("should reject page less than 1", () => {
      const result = movementsListInputSchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it("should reject limit greater than 100", () => {
      const result = movementsListInputSchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });
  });
});
