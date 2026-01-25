import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const listWorkCentersInputSchema = z.object({
  search: z.string().optional(),
  includeInactive: z.boolean().default(false),
}).optional();

const createWorkCenterInputSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  capacityPerHour: z.number().default(1),
  hoursPerDay: z.number().default(8),
  daysPerWeek: z.number().default(5),
  efficiencyTarget: z.number().default(85),
  setupTimeMinutes: z.number().default(0),
  costPerHour: z.number().default(0),
});

const updateWorkCenterInputSchema = z.object({
  id: z.string(),
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  capacityPerHour: z.number().optional(),
  hoursPerDay: z.number().optional(),
  daysPerWeek: z.number().optional(),
  efficiencyTarget: z.number().optional(),
  setupTimeMinutes: z.number().optional(),
  costPerHour: z.number().optional(),
  isActive: z.boolean().optional(),
});

const logProductionInputSchema = z.object({
  workCenterId: z.string(),
  productionOrderId: z.string().optional(),
  shiftDate: z.date(),
  shiftNumber: z.number().default(1),
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
  notes: z.string().optional(),
});

const getOeeInputSchema = z.object({
  workCenterId: z.string(),
  dateFrom: z.date(),
  dateTo: z.date(),
});

const getOeeTrendInputSchema = z.object({
  workCenterId: z.string().optional(),
  dateFrom: z.date(),
  dateTo: z.date(),
  groupBy: z.enum(["DAY", "WEEK", "MONTH"]).default("DAY"),
});

const getWorkCenterOeeInputSchema = z.object({
  workCenterId: z.string(),
  date: z.date().optional(),
});

const getDashboardInputSchema = z.object({
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
}).optional();

const getProductionSummaryInputSchema = z.object({
  workCenterId: z.string().optional(),
  dateFrom: z.date(),
  dateTo: z.date(),
});

const deleteWorkCenterInputSchema = z.object({ id: z.string() });

describe("OEE Router Schemas", () => {
  describe("listWorkCenters input", () => {
    it("should accept empty input", () => {
      const result = listWorkCentersInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should default includeInactive to false", () => {
      const result = listWorkCentersInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.includeInactive).toBe(false);
      }
    });

    it("should accept search string", () => {
      const result = listWorkCentersInputSchema.safeParse({ search: "CNC" });
      expect(result.success).toBe(true);
    });

    it("should accept includeInactive true", () => {
      const result = listWorkCentersInputSchema.safeParse({ includeInactive: true });
      expect(result.success).toBe(true);
    });
  });

  describe("createWorkCenter input", () => {
    it("should accept valid input", () => {
      const result = createWorkCenterInputSchema.safeParse({
        code: "WC001",
        name: "Centro de Usinagem CNC",
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = createWorkCenterInputSchema.safeParse({
        code: "WC001",
        name: "Centro de Usinagem CNC",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capacityPerHour).toBe(1);
        expect(result.data.hoursPerDay).toBe(8);
        expect(result.data.daysPerWeek).toBe(5);
        expect(result.data.efficiencyTarget).toBe(85);
        expect(result.data.setupTimeMinutes).toBe(0);
        expect(result.data.costPerHour).toBe(0);
      }
    });

    it("should accept full input", () => {
      const result = createWorkCenterInputSchema.safeParse({
        code: "WC002",
        name: "Linha de Montagem",
        description: "Linha de montagem principal",
        capacityPerHour: 50,
        hoursPerDay: 16,
        daysPerWeek: 6,
        efficiencyTarget: 90,
        setupTimeMinutes: 30,
        costPerHour: 150,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing code", () => {
      const result = createWorkCenterInputSchema.safeParse({
        name: "Centro",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty code", () => {
      const result = createWorkCenterInputSchema.safeParse({
        code: "",
        name: "Centro",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing name", () => {
      const result = createWorkCenterInputSchema.safeParse({
        code: "WC001",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const result = createWorkCenterInputSchema.safeParse({
        code: "WC001",
        name: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateWorkCenter input", () => {
    it("should accept id only", () => {
      const result = updateWorkCenterInputSchema.safeParse({ id: "wc-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateWorkCenterInputSchema.safeParse({
        id: "wc-123",
        name: "Novo Nome",
        efficiencyTarget: 95,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateWorkCenterInputSchema.safeParse({
        name: "Sem ID",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty code on update", () => {
      const result = updateWorkCenterInputSchema.safeParse({
        id: "wc-123",
        code: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty name on update", () => {
      const result = updateWorkCenterInputSchema.safeParse({
        id: "wc-123",
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("should accept isActive change", () => {
      const result = updateWorkCenterInputSchema.safeParse({
        id: "wc-123",
        isActive: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("logProduction input", () => {
    it("should accept valid input", () => {
      const result = logProductionInputSchema.safeParse({
        workCenterId: "wc-123",
        shiftDate: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = logProductionInputSchema.safeParse({
        workCenterId: "wc-123",
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
      const result = logProductionInputSchema.safeParse({
        workCenterId: "wc-123",
        productionOrderId: "po-456",
        shiftDate: new Date(),
        shiftNumber: 2,
        plannedQuantity: 1000,
        producedQuantity: 980,
        goodQuantity: 970,
        scrapQuantity: 5,
        reworkQuantity: 5,
        plannedTimeMinutes: 480,
        actualTimeMinutes: 460,
        setupTimeMinutes: 20,
        runTimeMinutes: 420,
        stopTimeMinutes: 20,
        notes: "Turno produtivo",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing workCenterId", () => {
      const result = logProductionInputSchema.safeParse({
        shiftDate: new Date(),
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing shiftDate", () => {
      const result = logProductionInputSchema.safeParse({
        workCenterId: "wc-123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("getOee input", () => {
    it("should accept valid input", () => {
      const result = getOeeInputSchema.safeParse({
        workCenterId: "wc-123",
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing workCenterId", () => {
      const result = getOeeInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing dateFrom", () => {
      const result = getOeeInputSchema.safeParse({
        workCenterId: "wc-123",
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing dateTo", () => {
      const result = getOeeInputSchema.safeParse({
        workCenterId: "wc-123",
        dateFrom: new Date("2026-01-01"),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("getOeeTrend input", () => {
    it("should accept valid input", () => {
      const result = getOeeTrendInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should apply default groupBy", () => {
      const result = getOeeTrendInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.groupBy).toBe("DAY");
      }
    });

    it("should accept all groupBy values", () => {
      const groupByValues = ["DAY", "WEEK", "MONTH"];
      for (const groupBy of groupByValues) {
        const result = getOeeTrendInputSchema.safeParse({
          dateFrom: new Date("2026-01-01"),
          dateTo: new Date("2026-01-31"),
          groupBy,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid groupBy", () => {
      const result = getOeeTrendInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
        groupBy: "INVALID",
      });
      expect(result.success).toBe(false);
    });

    it("should accept optional workCenterId", () => {
      const result = getOeeTrendInputSchema.safeParse({
        workCenterId: "wc-123",
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("getWorkCenterOee input", () => {
    it("should accept valid input", () => {
      const result = getWorkCenterOeeInputSchema.safeParse({
        workCenterId: "wc-123",
      });
      expect(result.success).toBe(true);
    });

    it("should accept with date", () => {
      const result = getWorkCenterOeeInputSchema.safeParse({
        workCenterId: "wc-123",
        date: new Date("2026-01-25"),
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing workCenterId", () => {
      const result = getWorkCenterOeeInputSchema.safeParse({});
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

    it("should accept partial dates", () => {
      const result = getDashboardInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("getProductionSummary input", () => {
    it("should accept valid input", () => {
      const result = getProductionSummaryInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should accept with workCenterId", () => {
      const result = getProductionSummaryInputSchema.safeParse({
        workCenterId: "wc-123",
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing dateFrom", () => {
      const result = getProductionSummaryInputSchema.safeParse({
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing dateTo", () => {
      const result = getProductionSummaryInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("deleteWorkCenter input", () => {
    it("should accept valid id", () => {
      const result = deleteWorkCenterInputSchema.safeParse({ id: "wc-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = deleteWorkCenterInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
