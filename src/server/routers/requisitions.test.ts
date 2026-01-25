import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const listInputSchema = z.object({
  status: z.enum(["DRAFT", "PENDING", "APPROVED", "IN_SEPARATION", "PARTIAL", "COMPLETED", "CANCELLED", "ALL"]).optional(),
  type: z.enum(["PRODUCTION", "MAINTENANCE", "ADMINISTRATIVE", "PROJECT", "OTHER", "ALL"]).optional(),
  search: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
}).optional();

const byIdInputSchema = z.object({ id: z.string() });

const createInputSchema = z.object({
  type: z.enum(["PRODUCTION", "MAINTENANCE", "ADMINISTRATIVE", "PROJECT", "OTHER"]).default("OTHER"),
  costCenter: z.string().optional(),
  department: z.string().optional(),
  productionOrderId: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  requiredDate: z.date().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    materialId: z.string(),
    requestedQuantity: z.number().positive(),
    notes: z.string().optional(),
  })).min(1),
});

const updateInputSchema = z.object({
  id: z.string(),
  costCenter: z.string().optional(),
  department: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  requiredDate: z.date().optional(),
  notes: z.string().optional(),
});

const addItemInputSchema = z.object({
  requisitionId: z.string(),
  materialId: z.string(),
  requestedQuantity: z.number().positive(),
  notes: z.string().optional(),
});

const updateItemInputSchema = z.object({
  id: z.string(),
  requestedQuantity: z.number().positive().optional(),
  notes: z.string().optional(),
});

const removeItemInputSchema = z.object({ id: z.string() });

const submitForApprovalInputSchema = z.object({
  id: z.string(),
  notes: z.string().optional(),
});

const approveInputSchema = z.object({
  id: z.string(),
  notes: z.string().optional(),
});

const rejectInputSchema = z.object({
  id: z.string(),
  reason: z.string().min(1),
});

const startSeparationInputSchema = z.object({
  id: z.string(),
  notes: z.string().optional(),
});

const separateItemInputSchema = z.object({
  itemId: z.string(),
  separatedQuantity: z.number().positive(),
  locationId: z.string().optional(),
  notes: z.string().optional(),
});

const completeSeparationInputSchema = z.object({
  id: z.string(),
  notes: z.string().optional(),
});

const cancelInputSchema = z.object({
  id: z.string(),
  reason: z.string().min(1),
});

const deleteInputSchema = z.object({ id: z.string() });

const getConsumptionReportInputSchema = z.object({
  dateFrom: z.date(),
  dateTo: z.date(),
  costCenter: z.string().optional(),
  department: z.string().optional(),
  materialId: z.string().optional(),
  groupBy: z.enum(["MATERIAL", "COST_CENTER", "DEPARTMENT", "DAY", "WEEK", "MONTH"]).default("MATERIAL"),
});

describe("Requisitions Router Schemas", () => {
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
      const statuses = ["DRAFT", "PENDING", "APPROVED", "IN_SEPARATION", "PARTIAL", "COMPLETED", "CANCELLED", "ALL"];
      for (const status of statuses) {
        const result = listInputSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid status", () => {
      const result = listInputSchema.safeParse({ status: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("should accept all type values", () => {
      const types = ["PRODUCTION", "MAINTENANCE", "ADMINISTRATIVE", "PROJECT", "OTHER", "ALL"];
      for (const type of types) {
        const result = listInputSchema.safeParse({ type });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid type", () => {
      const result = listInputSchema.safeParse({ type: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("should accept date range", () => {
      const result = listInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should accept search string", () => {
      const result = listInputSchema.safeParse({ search: "REQ001" });
      expect(result.success).toBe(true);
    });
  });

  describe("byId input", () => {
    it("should accept valid id", () => {
      const result = byIdInputSchema.safeParse({ id: "req-123" });
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
        items: [
          { materialId: "mat-001", requestedQuantity: 10 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = createInputSchema.safeParse({
        items: [{ materialId: "mat-001", requestedQuantity: 10 }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("OTHER");
        expect(result.data.priority).toBe("NORMAL");
      }
    });

    it("should accept full input", () => {
      const result = createInputSchema.safeParse({
        type: "PRODUCTION",
        costCenter: "CC001",
        department: "Produção",
        productionOrderId: "po-123",
        priority: "HIGH",
        requiredDate: new Date("2026-02-01"),
        notes: "Urgente para produção",
        items: [
          { materialId: "mat-001", requestedQuantity: 100, notes: "Item 1" },
          { materialId: "mat-002", requestedQuantity: 50 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should accept all type values", () => {
      const types = ["PRODUCTION", "MAINTENANCE", "ADMINISTRATIVE", "PROJECT", "OTHER"];
      for (const type of types) {
        const result = createInputSchema.safeParse({
          type,
          items: [{ materialId: "mat-001", requestedQuantity: 10 }],
        });
        expect(result.success).toBe(true);
      }
    });

    it("should accept all priority values", () => {
      const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"];
      for (const priority of priorities) {
        const result = createInputSchema.safeParse({
          priority,
          items: [{ materialId: "mat-001", requestedQuantity: 10 }],
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject empty items array", () => {
      const result = createInputSchema.safeParse({
        items: [],
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero requestedQuantity", () => {
      const result = createInputSchema.safeParse({
        items: [{ materialId: "mat-001", requestedQuantity: 0 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative requestedQuantity", () => {
      const result = createInputSchema.safeParse({
        items: [{ materialId: "mat-001", requestedQuantity: -10 }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("update input", () => {
    it("should accept id only", () => {
      const result = updateInputSchema.safeParse({ id: "req-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateInputSchema.safeParse({
        id: "req-123",
        priority: "URGENT",
        notes: "Atualizado",
      });
      expect(result.success).toBe(true);
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
        requisitionId: "req-123",
        materialId: "mat-001",
        requestedQuantity: 50,
      });
      expect(result.success).toBe(true);
    });

    it("should accept with notes", () => {
      const result = addItemInputSchema.safeParse({
        requisitionId: "req-123",
        materialId: "mat-001",
        requestedQuantity: 50,
        notes: "Item adicional",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing requisitionId", () => {
      const result = addItemInputSchema.safeParse({
        materialId: "mat-001",
        requestedQuantity: 50,
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero quantity", () => {
      const result = addItemInputSchema.safeParse({
        requisitionId: "req-123",
        materialId: "mat-001",
        requestedQuantity: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateItem input", () => {
    it("should accept id only", () => {
      const result = updateItemInputSchema.safeParse({ id: "item-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateItemInputSchema.safeParse({
        id: "item-123",
        requestedQuantity: 100,
        notes: "Quantidade ajustada",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateItemInputSchema.safeParse({
        requestedQuantity: 100,
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero quantity on update", () => {
      const result = updateItemInputSchema.safeParse({
        id: "item-123",
        requestedQuantity: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("removeItem input", () => {
    it("should accept valid id", () => {
      const result = removeItemInputSchema.safeParse({ id: "item-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = removeItemInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("submitForApproval input", () => {
    it("should accept valid input", () => {
      const result = submitForApprovalInputSchema.safeParse({ id: "req-123" });
      expect(result.success).toBe(true);
    });

    it("should accept with notes", () => {
      const result = submitForApprovalInputSchema.safeParse({
        id: "req-123",
        notes: "Aguardando aprovação",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = submitForApprovalInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("approve input", () => {
    it("should accept valid input", () => {
      const result = approveInputSchema.safeParse({ id: "req-123" });
      expect(result.success).toBe(true);
    });

    it("should accept with notes", () => {
      const result = approveInputSchema.safeParse({
        id: "req-123",
        notes: "Aprovado pelo gerente",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = approveInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("reject input", () => {
    it("should accept valid input", () => {
      const result = rejectInputSchema.safeParse({
        id: "req-123",
        reason: "Quantidade excessiva",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing reason", () => {
      const result = rejectInputSchema.safeParse({
        id: "req-123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty reason", () => {
      const result = rejectInputSchema.safeParse({
        id: "req-123",
        reason: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("startSeparation input", () => {
    it("should accept valid input", () => {
      const result = startSeparationInputSchema.safeParse({ id: "req-123" });
      expect(result.success).toBe(true);
    });

    it("should accept with notes", () => {
      const result = startSeparationInputSchema.safeParse({
        id: "req-123",
        notes: "Iniciando separação",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = startSeparationInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("separateItem input", () => {
    it("should accept valid input", () => {
      const result = separateItemInputSchema.safeParse({
        itemId: "item-123",
        separatedQuantity: 50,
      });
      expect(result.success).toBe(true);
    });

    it("should accept full input", () => {
      const result = separateItemInputSchema.safeParse({
        itemId: "item-123",
        separatedQuantity: 50,
        locationId: "loc-001",
        notes: "Separado do estoque A",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing itemId", () => {
      const result = separateItemInputSchema.safeParse({
        separatedQuantity: 50,
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero separatedQuantity", () => {
      const result = separateItemInputSchema.safeParse({
        itemId: "item-123",
        separatedQuantity: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative separatedQuantity", () => {
      const result = separateItemInputSchema.safeParse({
        itemId: "item-123",
        separatedQuantity: -10,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("completeSeparation input", () => {
    it("should accept valid input", () => {
      const result = completeSeparationInputSchema.safeParse({ id: "req-123" });
      expect(result.success).toBe(true);
    });

    it("should accept with notes", () => {
      const result = completeSeparationInputSchema.safeParse({
        id: "req-123",
        notes: "Separação concluída",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = completeSeparationInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("cancel input", () => {
    it("should accept valid input", () => {
      const result = cancelInputSchema.safeParse({
        id: "req-123",
        reason: "Não é mais necessário",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing reason", () => {
      const result = cancelInputSchema.safeParse({
        id: "req-123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty reason", () => {
      const result = cancelInputSchema.safeParse({
        id: "req-123",
        reason: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("delete input", () => {
    it("should accept valid id", () => {
      const result = deleteInputSchema.safeParse({ id: "req-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = deleteInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("getConsumptionReport input", () => {
    it("should accept valid input", () => {
      const result = getConsumptionReportInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should apply default groupBy", () => {
      const result = getConsumptionReportInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.groupBy).toBe("MATERIAL");
      }
    });

    it("should accept all groupBy values", () => {
      const groupByValues = ["MATERIAL", "COST_CENTER", "DEPARTMENT", "DAY", "WEEK", "MONTH"];
      for (const groupBy of groupByValues) {
        const result = getConsumptionReportInputSchema.safeParse({
          dateFrom: new Date("2026-01-01"),
          dateTo: new Date("2026-01-31"),
          groupBy,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid groupBy", () => {
      const result = getConsumptionReportInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
        groupBy: "INVALID",
      });
      expect(result.success).toBe(false);
    });

    it("should accept optional filters", () => {
      const result = getConsumptionReportInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
        costCenter: "CC001",
        department: "Produção",
        materialId: "mat-001",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing dateFrom", () => {
      const result = getConsumptionReportInputSchema.safeParse({
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing dateTo", () => {
      const result = getConsumptionReportInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
      });
      expect(result.success).toBe(false);
    });
  });
});
