import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const listInputSchema = z.object({
  status: z.enum(["PLANNED", "RELEASED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ALL"]).optional(),
  search: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
}).optional();

const byIdInputSchema = z.object({ id: z.string() });

const createInputSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  dueDate: z.date(),
  priority: z.number().min(1).max(5).default(3),
  salesOrderNumber: z.string().optional(),
  customerName: z.string().optional(),
  notes: z.string().optional(),
});

const updateInputSchema = z.object({
  id: z.string(),
  quantity: z.number().positive().optional(),
  dueDate: z.date().optional(),
  priority: z.number().min(1).max(5).optional(),
  status: z.enum(["PLANNED", "RELEASED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().optional(),
});

const releaseInputSchema = z.object({
  id: z.string(),
  notes: z.string().optional(),
});

const startInputSchema = z.object({
  id: z.string(),
  notes: z.string().optional(),
});

const completeInputSchema = z.object({
  id: z.string(),
  producedQuantity: z.number().positive(),
  notes: z.string().optional(),
});

const cancelInputSchema = z.object({
  id: z.string(),
  reason: z.string().min(1),
});

const addMaterialInputSchema = z.object({
  productionOrderId: z.string(),
  materialId: z.string(),
  requiredQuantity: z.number().positive(),
  unit: z.string().default("UN"),
  notes: z.string().optional(),
});

const consumeMaterialInputSchema = z.object({
  productionMaterialId: z.string(),
  consumedQuantity: z.number().positive(),
  notes: z.string().optional(),
});

const addOperationInputSchema = z.object({
  productionOrderId: z.string(),
  sequence: z.number().min(1),
  name: z.string().min(1),
  workCenterId: z.string().optional(),
  estimatedTime: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const startOperationInputSchema = z.object({
  operationId: z.string(),
  operatorId: z.string().optional(),
  notes: z.string().optional(),
});

const completeOperationInputSchema = z.object({
  operationId: z.string(),
  actualTime: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const deleteInputSchema = z.object({ id: z.string() });

describe("Production Router Schemas", () => {
  describe("list input", () => {
    it("should accept empty input", () => {
      const result = listInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept status PLANNED", () => {
      const result = listInputSchema.safeParse({ status: "PLANNED" });
      expect(result.success).toBe(true);
    });

    it("should accept status RELEASED", () => {
      const result = listInputSchema.safeParse({ status: "RELEASED" });
      expect(result.success).toBe(true);
    });

    it("should accept status IN_PROGRESS", () => {
      const result = listInputSchema.safeParse({ status: "IN_PROGRESS" });
      expect(result.success).toBe(true);
    });

    it("should accept status COMPLETED", () => {
      const result = listInputSchema.safeParse({ status: "COMPLETED" });
      expect(result.success).toBe(true);
    });

    it("should accept status CANCELLED", () => {
      const result = listInputSchema.safeParse({ status: "CANCELLED" });
      expect(result.success).toBe(true);
    });

    it("should accept status ALL", () => {
      const result = listInputSchema.safeParse({ status: "ALL" });
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = listInputSchema.safeParse({ status: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("should accept search string", () => {
      const result = listInputSchema.safeParse({ search: "produto" });
      expect(result.success).toBe(true);
    });

    it("should accept date range", () => {
      const result = listInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
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
  });

  describe("byId input", () => {
    it("should accept valid id", () => {
      const result = byIdInputSchema.safeParse({ id: "op-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = byIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("create input", () => {
    it("should accept valid input", () => {
      const result = createInputSchema.safeParse({
        productId: "prod-123",
        quantity: 100,
        dueDate: new Date("2026-02-15"),
      });
      expect(result.success).toBe(true);
    });

    it("should apply default priority", () => {
      const result = createInputSchema.safeParse({
        productId: "prod-123",
        quantity: 100,
        dueDate: new Date(),
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe(3);
      }
    });

    it("should accept full input", () => {
      const result = createInputSchema.safeParse({
        productId: "prod-123",
        quantity: 500,
        dueDate: new Date("2026-02-15"),
        priority: 1,
        salesOrderNumber: "PV-2026-001",
        customerName: "Cliente ABC",
        notes: "Produção urgente",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing productId", () => {
      const result = createInputSchema.safeParse({
        quantity: 100,
        dueDate: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero quantity", () => {
      const result = createInputSchema.safeParse({
        productId: "prod-123",
        quantity: 0,
        dueDate: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative quantity", () => {
      const result = createInputSchema.safeParse({
        productId: "prod-123",
        quantity: -10,
        dueDate: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("should reject priority less than 1", () => {
      const result = createInputSchema.safeParse({
        productId: "prod-123",
        quantity: 100,
        dueDate: new Date(),
        priority: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject priority greater than 5", () => {
      const result = createInputSchema.safeParse({
        productId: "prod-123",
        quantity: 100,
        dueDate: new Date(),
        priority: 6,
      });
      expect(result.success).toBe(false);
    });

    it("should accept all valid priorities", () => {
      for (let priority = 1; priority <= 5; priority++) {
        const result = createInputSchema.safeParse({
          productId: "prod-123",
          quantity: 100,
          dueDate: new Date(),
          priority,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("update input", () => {
    it("should accept id only", () => {
      const result = updateInputSchema.safeParse({ id: "op-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateInputSchema.safeParse({
        id: "op-123",
        quantity: 200,
        priority: 1,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateInputSchema.safeParse({
        quantity: 200,
      });
      expect(result.success).toBe(false);
    });

    it("should accept all status values", () => {
      const statuses = ["PLANNED", "RELEASED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
      for (const status of statuses) {
        const result = updateInputSchema.safeParse({ id: "op-123", status });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("release input", () => {
    it("should accept valid release", () => {
      const result = releaseInputSchema.safeParse({ id: "op-123" });
      expect(result.success).toBe(true);
    });

    it("should accept release with notes", () => {
      const result = releaseInputSchema.safeParse({
        id: "op-123",
        notes: "Liberado para produção",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = releaseInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("start input", () => {
    it("should accept valid start", () => {
      const result = startInputSchema.safeParse({ id: "op-123" });
      expect(result.success).toBe(true);
    });

    it("should accept start with notes", () => {
      const result = startInputSchema.safeParse({
        id: "op-123",
        notes: "Iniciando produção",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = startInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("complete input", () => {
    it("should accept valid completion", () => {
      const result = completeInputSchema.safeParse({
        id: "op-123",
        producedQuantity: 100,
      });
      expect(result.success).toBe(true);
    });

    it("should accept completion with notes", () => {
      const result = completeInputSchema.safeParse({
        id: "op-123",
        producedQuantity: 95,
        notes: "5 unidades com defeito",
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero producedQuantity", () => {
      const result = completeInputSchema.safeParse({
        id: "op-123",
        producedQuantity: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative producedQuantity", () => {
      const result = completeInputSchema.safeParse({
        id: "op-123",
        producedQuantity: -10,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("cancel input", () => {
    it("should accept valid cancellation", () => {
      const result = cancelInputSchema.safeParse({
        id: "op-123",
        reason: "Pedido cancelado pelo cliente",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing reason", () => {
      const result = cancelInputSchema.safeParse({
        id: "op-123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty reason", () => {
      const result = cancelInputSchema.safeParse({
        id: "op-123",
        reason: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("addMaterial input", () => {
    it("should accept valid material", () => {
      const result = addMaterialInputSchema.safeParse({
        productionOrderId: "op-123",
        materialId: "mat-456",
        requiredQuantity: 50,
      });
      expect(result.success).toBe(true);
    });

    it("should apply default unit", () => {
      const result = addMaterialInputSchema.safeParse({
        productionOrderId: "op-123",
        materialId: "mat-456",
        requiredQuantity: 50,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unit).toBe("UN");
      }
    });

    it("should reject zero requiredQuantity", () => {
      const result = addMaterialInputSchema.safeParse({
        productionOrderId: "op-123",
        materialId: "mat-456",
        requiredQuantity: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("consumeMaterial input", () => {
    it("should accept valid consumption", () => {
      const result = consumeMaterialInputSchema.safeParse({
        productionMaterialId: "pm-123",
        consumedQuantity: 25,
      });
      expect(result.success).toBe(true);
    });

    it("should accept consumption with notes", () => {
      const result = consumeMaterialInputSchema.safeParse({
        productionMaterialId: "pm-123",
        consumedQuantity: 25,
        notes: "Consumo parcial",
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero consumedQuantity", () => {
      const result = consumeMaterialInputSchema.safeParse({
        productionMaterialId: "pm-123",
        consumedQuantity: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("addOperation input", () => {
    it("should accept valid operation", () => {
      const result = addOperationInputSchema.safeParse({
        productionOrderId: "op-123",
        sequence: 1,
        name: "Corte",
      });
      expect(result.success).toBe(true);
    });

    it("should accept full input", () => {
      const result = addOperationInputSchema.safeParse({
        productionOrderId: "op-123",
        sequence: 2,
        name: "Montagem",
        workCenterId: "wc-001",
        estimatedTime: 120,
        notes: "Operação crítica",
      });
      expect(result.success).toBe(true);
    });

    it("should reject sequence less than 1", () => {
      const result = addOperationInputSchema.safeParse({
        productionOrderId: "op-123",
        sequence: 0,
        name: "Operação",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const result = addOperationInputSchema.safeParse({
        productionOrderId: "op-123",
        sequence: 1,
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative estimatedTime", () => {
      const result = addOperationInputSchema.safeParse({
        productionOrderId: "op-123",
        sequence: 1,
        name: "Operação",
        estimatedTime: -10,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("startOperation input", () => {
    it("should accept valid start", () => {
      const result = startOperationInputSchema.safeParse({
        operationId: "oper-123",
      });
      expect(result.success).toBe(true);
    });

    it("should accept with operatorId", () => {
      const result = startOperationInputSchema.safeParse({
        operationId: "oper-123",
        operatorId: "user-456",
        notes: "Início turno manhã",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing operationId", () => {
      const result = startOperationInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("completeOperation input", () => {
    it("should accept valid completion", () => {
      const result = completeOperationInputSchema.safeParse({
        operationId: "oper-123",
      });
      expect(result.success).toBe(true);
    });

    it("should accept with actualTime", () => {
      const result = completeOperationInputSchema.safeParse({
        operationId: "oper-123",
        actualTime: 90,
        notes: "Concluído antes do previsto",
      });
      expect(result.success).toBe(true);
    });

    it("should reject negative actualTime", () => {
      const result = completeOperationInputSchema.safeParse({
        operationId: "oper-123",
        actualTime: -10,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("delete input", () => {
    it("should accept valid id", () => {
      const result = deleteInputSchema.safeParse({ id: "op-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = deleteInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
