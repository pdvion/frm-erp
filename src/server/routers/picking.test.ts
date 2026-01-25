import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const listInputSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  type: z.enum(["REQUISITION", "SALES_ORDER", "PRODUCTION_ORDER", "TRANSFER"]).optional(),
  assignedTo: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
}).optional();

const byIdInputSchema = z.object({ id: z.string().uuid() });

const createInputSchema = z.object({
  type: z.enum(["REQUISITION", "SALES_ORDER", "PRODUCTION_ORDER", "TRANSFER"]),
  sourceId: z.string().uuid().optional(),
  sourceType: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.date().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    materialId: z.string().uuid(),
    requestedQuantity: z.number().positive(),
    locationId: z.string().uuid().optional(),
    notes: z.string().optional(),
  })).min(1),
});

const updateInputSchema = z.object({
  id: z.string().uuid(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.date().optional(),
  notes: z.string().optional(),
});

const addItemInputSchema = z.object({
  pickingListId: z.string().uuid(),
  materialId: z.string().uuid(),
  requestedQuantity: z.number().positive(),
  locationId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const updateItemInputSchema = z.object({
  id: z.string().uuid(),
  requestedQuantity: z.number().positive().optional(),
  locationId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const removeItemInputSchema = z.object({ id: z.string().uuid() });

const startPickingInputSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().optional(),
});

const pickItemInputSchema = z.object({
  itemId: z.string().uuid(),
  pickedQuantity: z.number().min(0),
  locationId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const completePickingInputSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().optional(),
});

const verifyPickingInputSchema = z.object({
  id: z.string().uuid(),
  approved: z.boolean(),
  notes: z.string().optional(),
});

const cancelInputSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1),
});

const deleteInputSchema = z.object({ id: z.string().uuid() });

const getDashboardInputSchema = z.object({
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
}).optional();

describe("Picking Router Schemas", () => {
  describe("list input", () => {
    it("should accept empty input", () => {
      const result = listInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.page).toBe(1);
        expect(result.data?.limit).toBe(20);
      }
    });

    it("should accept all status values", () => {
      const statuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
      for (const status of statuses) {
        const result = listInputSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid status", () => {
      const result = listInputSchema.safeParse({ status: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("should accept all priority values", () => {
      const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"];
      for (const priority of priorities) {
        const result = listInputSchema.safeParse({ priority });
        expect(result.success).toBe(true);
      }
    });

    it("should accept all type values", () => {
      const types = ["REQUISITION", "SALES_ORDER", "PRODUCTION_ORDER", "TRANSFER"];
      for (const type of types) {
        const result = listInputSchema.safeParse({ type });
        expect(result.success).toBe(true);
      }
    });

    it("should accept assignedTo uuid", () => {
      const result = listInputSchema.safeParse({
        assignedTo: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid assignedTo", () => {
      const result = listInputSchema.safeParse({
        assignedTo: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("byId input", () => {
    it("should accept valid uuid", () => {
      const result = byIdInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid uuid", () => {
      const result = byIdInputSchema.safeParse({
        id: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const result = byIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("create input", () => {
    it("should accept valid input", () => {
      const result = createInputSchema.safeParse({
        type: "REQUISITION",
        items: [
          { materialId: "550e8400-e29b-41d4-a716-446655440000", requestedQuantity: 10 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should apply default priority", () => {
      const result = createInputSchema.safeParse({
        type: "REQUISITION",
        items: [{ materialId: "550e8400-e29b-41d4-a716-446655440000", requestedQuantity: 10 }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe("NORMAL");
      }
    });

    it("should accept all type values", () => {
      const types = ["REQUISITION", "SALES_ORDER", "PRODUCTION_ORDER", "TRANSFER"];
      for (const type of types) {
        const result = createInputSchema.safeParse({
          type,
          items: [{ materialId: "550e8400-e29b-41d4-a716-446655440000", requestedQuantity: 10 }],
        });
        expect(result.success).toBe(true);
      }
    });

    it("should accept full input", () => {
      const result = createInputSchema.safeParse({
        type: "SALES_ORDER",
        sourceId: "550e8400-e29b-41d4-a716-446655440001",
        sourceType: "SalesOrder",
        priority: "HIGH",
        assignedTo: "550e8400-e29b-41d4-a716-446655440002",
        dueDate: new Date("2026-02-01"),
        notes: "Separação urgente",
        items: [
          { materialId: "550e8400-e29b-41d4-a716-446655440003", requestedQuantity: 100, locationId: "550e8400-e29b-41d4-a716-446655440004", notes: "Prateleira A1" },
          { materialId: "550e8400-e29b-41d4-a716-446655440005", requestedQuantity: 50 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty items array", () => {
      const result = createInputSchema.safeParse({
        type: "REQUISITION",
        items: [],
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero requestedQuantity", () => {
      const result = createInputSchema.safeParse({
        type: "REQUISITION",
        items: [{ materialId: "550e8400-e29b-41d4-a716-446655440000", requestedQuantity: 0 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid materialId", () => {
      const result = createInputSchema.safeParse({
        type: "REQUISITION",
        items: [{ materialId: "invalid-uuid", requestedQuantity: 10 }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("update input", () => {
    it("should accept id only", () => {
      const result = updateInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        priority: "URGENT",
        assignedTo: "550e8400-e29b-41d4-a716-446655440001",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid id", () => {
      const result = updateInputSchema.safeParse({
        id: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const result = updateInputSchema.safeParse({
        priority: "HIGH",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("addItem input", () => {
    it("should accept valid input", () => {
      const result = addItemInputSchema.safeParse({
        pickingListId: "550e8400-e29b-41d4-a716-446655440000",
        materialId: "550e8400-e29b-41d4-a716-446655440001",
        requestedQuantity: 50,
      });
      expect(result.success).toBe(true);
    });

    it("should accept with location", () => {
      const result = addItemInputSchema.safeParse({
        pickingListId: "550e8400-e29b-41d4-a716-446655440000",
        materialId: "550e8400-e29b-41d4-a716-446655440001",
        requestedQuantity: 50,
        locationId: "550e8400-e29b-41d4-a716-446655440002",
        notes: "Prateleira B2",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid pickingListId", () => {
      const result = addItemInputSchema.safeParse({
        pickingListId: "invalid-uuid",
        materialId: "550e8400-e29b-41d4-a716-446655440001",
        requestedQuantity: 50,
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero quantity", () => {
      const result = addItemInputSchema.safeParse({
        pickingListId: "550e8400-e29b-41d4-a716-446655440000",
        materialId: "550e8400-e29b-41d4-a716-446655440001",
        requestedQuantity: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateItem input", () => {
    it("should accept id only", () => {
      const result = updateItemInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateItemInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        requestedQuantity: 100,
        locationId: "550e8400-e29b-41d4-a716-446655440001",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid id", () => {
      const result = updateItemInputSchema.safeParse({
        id: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero quantity on update", () => {
      const result = updateItemInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        requestedQuantity: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("removeItem input", () => {
    it("should accept valid uuid", () => {
      const result = removeItemInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid uuid", () => {
      const result = removeItemInputSchema.safeParse({
        id: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("startPicking input", () => {
    it("should accept valid input", () => {
      const result = startPickingInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept with notes", () => {
      const result = startPickingInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        notes: "Iniciando separação",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid id", () => {
      const result = startPickingInputSchema.safeParse({
        id: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("pickItem input", () => {
    it("should accept valid input", () => {
      const result = pickItemInputSchema.safeParse({
        itemId: "550e8400-e29b-41d4-a716-446655440000",
        pickedQuantity: 50,
      });
      expect(result.success).toBe(true);
    });

    it("should accept zero pickedQuantity", () => {
      const result = pickItemInputSchema.safeParse({
        itemId: "550e8400-e29b-41d4-a716-446655440000",
        pickedQuantity: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept with location", () => {
      const result = pickItemInputSchema.safeParse({
        itemId: "550e8400-e29b-41d4-a716-446655440000",
        pickedQuantity: 50,
        locationId: "550e8400-e29b-41d4-a716-446655440001",
        notes: "Retirado da prateleira C3",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid itemId", () => {
      const result = pickItemInputSchema.safeParse({
        itemId: "invalid-uuid",
        pickedQuantity: 50,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative pickedQuantity", () => {
      const result = pickItemInputSchema.safeParse({
        itemId: "550e8400-e29b-41d4-a716-446655440000",
        pickedQuantity: -10,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("completePicking input", () => {
    it("should accept valid input", () => {
      const result = completePickingInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept with notes", () => {
      const result = completePickingInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        notes: "Separação concluída",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid id", () => {
      const result = completePickingInputSchema.safeParse({
        id: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("verifyPicking input", () => {
    it("should accept approved", () => {
      const result = verifyPickingInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        approved: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept rejected", () => {
      const result = verifyPickingInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        approved: false,
        notes: "Quantidade incorreta no item 3",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing approved", () => {
      const result = verifyPickingInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid id", () => {
      const result = verifyPickingInputSchema.safeParse({
        id: "invalid-uuid",
        approved: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("cancel input", () => {
    it("should accept valid input", () => {
      const result = cancelInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        reason: "Pedido cancelado pelo cliente",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing reason", () => {
      const result = cancelInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty reason", () => {
      const result = cancelInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        reason: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid id", () => {
      const result = cancelInputSchema.safeParse({
        id: "invalid-uuid",
        reason: "Motivo",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("delete input", () => {
    it("should accept valid uuid", () => {
      const result = deleteInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid uuid", () => {
      const result = deleteInputSchema.safeParse({
        id: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("getDashboard input", () => {
    it("should accept empty input", () => {
      const result = getDashboardInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept date range", () => {
      const result = getDashboardInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });
  });
});
