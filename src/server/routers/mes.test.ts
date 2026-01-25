import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const createProductionLogInputSchema = z.object({
  workCenterId: z.string().uuid(),
  productionOrderId: z.string().uuid().optional(),
  operatorId: z.string().uuid().optional(),
  shiftDate: z.date(),
  shiftNumber: z.number().min(1).max(3).default(1),
  plannedQuantity: z.number().default(0),
  producedQuantity: z.number().default(0),
  goodQuantity: z.number().default(0),
  scrapQuantity: z.number().default(0),
  reworkQuantity: z.number().default(0),
  plannedTimeMinutes: z.number().default(0),
  actualTimeMinutes: z.number().default(0),
  setupTimeMinutes: z.number().default(0),
  runTimeMinutes: z.number().default(0),
  stopTimeMinutes: z.number().default(0),
  cycleTimeSeconds: z.number().optional(),
  idealCycleTimeSeconds: z.number().optional(),
  notes: z.string().optional(),
});

const updateProductionLogInputSchema = z.object({
  id: z.string().uuid(),
  producedQuantity: z.number().optional(),
  goodQuantity: z.number().optional(),
  scrapQuantity: z.number().optional(),
  reworkQuantity: z.number().optional(),
  actualTimeMinutes: z.number().optional(),
  setupTimeMinutes: z.number().optional(),
  runTimeMinutes: z.number().optional(),
  stopTimeMinutes: z.number().optional(),
  notes: z.string().optional(),
});

const listProductionLogsInputSchema = z.object({
  workCenterId: z.string().uuid().optional(),
  productionOrderId: z.string().uuid().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
}).optional();

const registerStopInputSchema = z.object({
  productionLogId: z.string().uuid(),
  stopReasonId: z.string().uuid(),
  startTime: z.date(),
  endTime: z.date().optional(),
  durationMinutes: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const endStopInputSchema = z.object({
  stopId: z.string().uuid(),
  endTime: z.date(),
  notes: z.string().optional(),
});

const listStopsInputSchema = z.object({
  productionLogId: z.string().uuid().optional(),
  workCenterId: z.string().uuid().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  page: z.number().default(1),
  limit: z.number().default(50),
}).optional();

const listStopReasonsInputSchema = z.object({
  includeInactive: z.boolean().default(false),
}).optional();

const createStopReasonInputSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(["PLANNED", "UNPLANNED", "QUALITY", "MAINTENANCE", "SETUP", "OTHER"]).default("OTHER"),
  affectsOee: z.boolean().default(true),
  notes: z.string().optional(),
});

const updateStopReasonInputSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  category: z.enum(["PLANNED", "UNPLANNED", "QUALITY", "MAINTENANCE", "SETUP", "OTHER"]).optional(),
  affectsOee: z.boolean().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

const deleteStopReasonInputSchema = z.object({ id: z.string().uuid() });

describe("MES Router Schemas", () => {
  describe("createProductionLog input", () => {
    it("should accept valid input", () => {
      const result = createProductionLogInputSchema.safeParse({
        workCenterId: "550e8400-e29b-41d4-a716-446655440000",
        shiftDate: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = createProductionLogInputSchema.safeParse({
        workCenterId: "550e8400-e29b-41d4-a716-446655440000",
        shiftDate: new Date(),
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.shiftNumber).toBe(1);
        expect(result.data.plannedQuantity).toBe(0);
        expect(result.data.producedQuantity).toBe(0);
        expect(result.data.goodQuantity).toBe(0);
        expect(result.data.scrapQuantity).toBe(0);
        expect(result.data.reworkQuantity).toBe(0);
      }
    });

    it("should accept full input", () => {
      const result = createProductionLogInputSchema.safeParse({
        workCenterId: "550e8400-e29b-41d4-a716-446655440000",
        productionOrderId: "550e8400-e29b-41d4-a716-446655440001",
        operatorId: "550e8400-e29b-41d4-a716-446655440002",
        shiftDate: new Date(),
        shiftNumber: 2,
        plannedQuantity: 1000,
        producedQuantity: 950,
        goodQuantity: 940,
        scrapQuantity: 5,
        reworkQuantity: 5,
        plannedTimeMinutes: 480,
        actualTimeMinutes: 450,
        setupTimeMinutes: 30,
        runTimeMinutes: 400,
        stopTimeMinutes: 20,
        cycleTimeSeconds: 30,
        idealCycleTimeSeconds: 28,
        notes: "Turno produtivo",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid workCenterId", () => {
      const result = createProductionLogInputSchema.safeParse({
        workCenterId: "invalid-uuid",
        shiftDate: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("should reject shiftNumber less than 1", () => {
      const result = createProductionLogInputSchema.safeParse({
        workCenterId: "550e8400-e29b-41d4-a716-446655440000",
        shiftDate: new Date(),
        shiftNumber: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject shiftNumber greater than 3", () => {
      const result = createProductionLogInputSchema.safeParse({
        workCenterId: "550e8400-e29b-41d4-a716-446655440000",
        shiftDate: new Date(),
        shiftNumber: 4,
      });
      expect(result.success).toBe(false);
    });

    it("should accept all valid shift numbers", () => {
      for (let shift = 1; shift <= 3; shift++) {
        const result = createProductionLogInputSchema.safeParse({
          workCenterId: "550e8400-e29b-41d4-a716-446655440000",
          shiftDate: new Date(),
          shiftNumber: shift,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("updateProductionLog input", () => {
    it("should accept id only", () => {
      const result = updateProductionLogInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateProductionLogInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        producedQuantity: 1000,
        goodQuantity: 990,
        scrapQuantity: 10,
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid id", () => {
      const result = updateProductionLogInputSchema.safeParse({
        id: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const result = updateProductionLogInputSchema.safeParse({
        producedQuantity: 1000,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("listProductionLogs input", () => {
    it("should accept empty input", () => {
      const result = listProductionLogsInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = listProductionLogsInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.page).toBe(1);
        expect(result.data?.limit).toBe(20);
      }
    });

    it("should accept filters", () => {
      const result = listProductionLogsInputSchema.safeParse({
        workCenterId: "550e8400-e29b-41d4-a716-446655440000",
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid workCenterId", () => {
      const result = listProductionLogsInputSchema.safeParse({
        workCenterId: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("registerStop input", () => {
    it("should accept valid input", () => {
      const result = registerStopInputSchema.safeParse({
        productionLogId: "550e8400-e29b-41d4-a716-446655440000",
        stopReasonId: "550e8400-e29b-41d4-a716-446655440001",
        startTime: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("should accept full input", () => {
      const result = registerStopInputSchema.safeParse({
        productionLogId: "550e8400-e29b-41d4-a716-446655440000",
        stopReasonId: "550e8400-e29b-41d4-a716-446655440001",
        startTime: new Date("2026-01-25T10:00:00"),
        endTime: new Date("2026-01-25T10:30:00"),
        durationMinutes: 30,
        notes: "Parada para manutenção preventiva",
      });
      expect(result.success).toBe(true);
    });

    it("should reject negative durationMinutes", () => {
      const result = registerStopInputSchema.safeParse({
        productionLogId: "550e8400-e29b-41d4-a716-446655440000",
        stopReasonId: "550e8400-e29b-41d4-a716-446655440001",
        startTime: new Date(),
        durationMinutes: -10,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing productionLogId", () => {
      const result = registerStopInputSchema.safeParse({
        stopReasonId: "550e8400-e29b-41d4-a716-446655440001",
        startTime: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing stopReasonId", () => {
      const result = registerStopInputSchema.safeParse({
        productionLogId: "550e8400-e29b-41d4-a716-446655440000",
        startTime: new Date(),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("endStop input", () => {
    it("should accept valid input", () => {
      const result = endStopInputSchema.safeParse({
        stopId: "550e8400-e29b-41d4-a716-446655440000",
        endTime: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("should accept with notes", () => {
      const result = endStopInputSchema.safeParse({
        stopId: "550e8400-e29b-41d4-a716-446655440000",
        endTime: new Date(),
        notes: "Parada finalizada",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing stopId", () => {
      const result = endStopInputSchema.safeParse({
        endTime: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing endTime", () => {
      const result = endStopInputSchema.safeParse({
        stopId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("listStops input", () => {
    it("should accept empty input", () => {
      const result = listStopsInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = listStopsInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.page).toBe(1);
        expect(result.data?.limit).toBe(50);
      }
    });

    it("should accept filters", () => {
      const result = listStopsInputSchema.safeParse({
        workCenterId: "550e8400-e29b-41d4-a716-446655440000",
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("listStopReasons input", () => {
    it("should accept empty input", () => {
      const result = listStopReasonsInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should default includeInactive to false", () => {
      const result = listStopReasonsInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.includeInactive).toBe(false);
      }
    });

    it("should accept includeInactive true", () => {
      const result = listStopReasonsInputSchema.safeParse({ includeInactive: true });
      expect(result.success).toBe(true);
    });
  });

  describe("createStopReason input", () => {
    it("should accept valid input", () => {
      const result = createStopReasonInputSchema.safeParse({
        code: "MANUT01",
        name: "Manutenção Preventiva",
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = createStopReasonInputSchema.safeParse({
        code: "MANUT01",
        name: "Manutenção Preventiva",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe("OTHER");
        expect(result.data.affectsOee).toBe(true);
      }
    });

    it("should accept all categories", () => {
      const categories = ["PLANNED", "UNPLANNED", "QUALITY", "MAINTENANCE", "SETUP", "OTHER"];
      for (const category of categories) {
        const result = createStopReasonInputSchema.safeParse({
          code: `CAT-${category}`,
          name: `Parada ${category}`,
          category,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject missing code", () => {
      const result = createStopReasonInputSchema.safeParse({
        name: "Manutenção",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty code", () => {
      const result = createStopReasonInputSchema.safeParse({
        code: "",
        name: "Manutenção",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing name", () => {
      const result = createStopReasonInputSchema.safeParse({
        code: "MANUT01",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const result = createStopReasonInputSchema.safeParse({
        code: "MANUT01",
        name: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateStopReason input", () => {
    it("should accept id only", () => {
      const result = updateStopReasonInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateStopReasonInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Novo Nome",
        affectsOee: false,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateStopReasonInputSchema.safeParse({
        name: "Sem ID",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty code on update", () => {
      const result = updateStopReasonInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        code: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty name on update", () => {
      const result = updateStopReasonInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("deleteStopReason input", () => {
    it("should accept valid id", () => {
      const result = deleteStopReasonInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid id", () => {
      const result = deleteStopReasonInputSchema.safeParse({
        id: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const result = deleteStopReasonInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
