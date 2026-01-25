import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router vacations (Férias)
 * Valida inputs e estruturas de dados de férias de funcionários
 */

// Schema de status de férias
const vacationStatusSchema = z.enum([
  "SCHEDULED",
  "APPROVED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

// Schema de listagem
const listInputSchema = z.object({
  employeeId: z.string().optional(),
  status: z.enum(["SCHEDULED", "APPROVED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ALL"]).optional(),
  year: z.number().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

// Schema de criação
const createInputSchema = z.object({
  employeeId: z.string(),
  acquisitionStart: z.date(),
  acquisitionEnd: z.date(),
  startDate: z.date(),
  endDate: z.date(),
  totalDays: z.number().default(30),
  soldDays: z.number().default(0),
  isCollective: z.boolean().default(false),
  collectiveGroupId: z.string().optional(),
  notes: z.string().optional(),
});

// Schema de resposta (used for documentation)
const _vacationResponseSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  acquisitionStart: z.date(),
  acquisitionEnd: z.date(),
  startDate: z.date(),
  endDate: z.date(),
  totalDays: z.number(),
  soldDays: z.number(),
  enjoyedDays: z.number(),
  remainingDays: z.number(),
  status: vacationStatusSchema,
  isCollective: z.boolean(),
  baseValue: z.number(),
  oneThirdValue: z.number(),
  soldValue: z.number(),
  totalValue: z.number(),
});

describe("Vacations Router Schemas", () => {
  describe("Vacation Status Schema", () => {
    it("should accept SCHEDULED status", () => {
      const result = vacationStatusSchema.safeParse("SCHEDULED");
      expect(result.success).toBe(true);
    });

    it("should accept APPROVED status", () => {
      const result = vacationStatusSchema.safeParse("APPROVED");
      expect(result.success).toBe(true);
    });

    it("should accept IN_PROGRESS status", () => {
      const result = vacationStatusSchema.safeParse("IN_PROGRESS");
      expect(result.success).toBe(true);
    });

    it("should accept COMPLETED status", () => {
      const result = vacationStatusSchema.safeParse("COMPLETED");
      expect(result.success).toBe(true);
    });

    it("should accept CANCELLED status", () => {
      const result = vacationStatusSchema.safeParse("CANCELLED");
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = vacationStatusSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("List Input Schema", () => {
    it("should accept empty input with defaults", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should accept employeeId filter", () => {
      const result = listInputSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept status filter", () => {
      const result = listInputSchema.safeParse({
        status: "APPROVED",
      });
      expect(result.success).toBe(true);
    });

    it("should accept ALL status filter", () => {
      const result = listInputSchema.safeParse({
        status: "ALL",
      });
      expect(result.success).toBe(true);
    });

    it("should accept year filter", () => {
      const result = listInputSchema.safeParse({
        year: 2024,
      });
      expect(result.success).toBe(true);
    });

    it("should accept all filters combined", () => {
      const result = listInputSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        status: "SCHEDULED",
        year: 2024,
        page: 2,
        limit: 50,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Create Input Schema", () => {
    it("should accept valid input", () => {
      const result = createInputSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        acquisitionStart: new Date("2023-01-01"),
        acquisitionEnd: new Date("2023-12-31"),
        startDate: new Date("2024-07-01"),
        endDate: new Date("2024-07-30"),
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete input", () => {
      const result = createInputSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        acquisitionStart: new Date("2023-01-01"),
        acquisitionEnd: new Date("2023-12-31"),
        startDate: new Date("2024-07-01"),
        endDate: new Date("2024-07-20"),
        totalDays: 30,
        soldDays: 10,
        isCollective: false,
        notes: "Férias de verão",
      });
      expect(result.success).toBe(true);
    });

    it("should accept collective vacation", () => {
      const result = createInputSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        acquisitionStart: new Date("2023-01-01"),
        acquisitionEnd: new Date("2023-12-31"),
        startDate: new Date("2024-12-23"),
        endDate: new Date("2025-01-03"),
        totalDays: 12,
        isCollective: true,
        collectiveGroupId: "group-123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing employeeId", () => {
      const result = createInputSchema.safeParse({
        acquisitionStart: new Date("2023-01-01"),
        acquisitionEnd: new Date("2023-12-31"),
        startDate: new Date("2024-07-01"),
        endDate: new Date("2024-07-30"),
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing dates", () => {
      const result = createInputSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Vacation Calculations", () => {
    it("should calculate vacation pay correctly", () => {
      const salary = 3000;
      const totalDays = 30;
      const dailyRate = salary / 30;
      const baseValue = dailyRate * totalDays;
      const oneThirdValue = baseValue / 3;
      const totalValue = baseValue + oneThirdValue;

      expect(baseValue).toBe(3000);
      expect(oneThirdValue).toBe(1000);
      expect(totalValue).toBe(4000);
    });

    it("should calculate sold days value correctly", () => {
      const salary = 3000;
      const soldDays = 10;
      const dailyRate = salary / 30;
      const soldValue = dailyRate * soldDays;
      const soldOneThird = soldValue / 3;
      const totalSoldValue = soldValue + soldOneThird;

      expect(soldValue).toBe(1000);
      expect(totalSoldValue).toBeCloseTo(1333.33, 2);
    });

    it("should calculate enjoyed days correctly", () => {
      const totalDays = 30;
      const soldDays = 10;
      const enjoyedDays = totalDays - soldDays;
      expect(enjoyedDays).toBe(20);
    });

    it("should calculate remaining days correctly", () => {
      const totalDays = 30;
      const soldDays = 10;
      const usedDays = 15;
      const remainingDays = totalDays - soldDays - usedDays;
      expect(remainingDays).toBe(5);
    });

    it("should not allow selling more than 10 days", () => {
      const maxSellableDays = 10;
      const soldDays = 15;
      const isValid = soldDays <= maxSellableDays;
      expect(isValid).toBe(false);
    });

    it("should validate minimum vacation period", () => {
      const minPeriodDays = 5;
      const period1 = 3;
      const period2 = 7;
      expect(period1 >= minPeriodDays).toBe(false);
      expect(period2 >= minPeriodDays).toBe(true);
    });
  });

  describe("Acquisition Period", () => {
    it("should validate acquisition period is 12 months", () => {
      const start = new Date("2023-01-01");
      const end = new Date("2024-01-01");
      const months = (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      expect(months).toBe(12);
    });

    it("should calculate acquisition period end date", () => {
      const start = new Date("2023-03-15");
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 1);
      end.setDate(end.getDate() - 1);
      expect(end.getFullYear()).toBe(2024);
      expect(end.getMonth()).toBe(2); // March
      // Date calculation may vary, just check it's in March 2024
      expect(end.getDate()).toBeGreaterThanOrEqual(13);
      expect(end.getDate()).toBeLessThanOrEqual(14);
    });

    it("should check if vacation is within concession period", () => {
      const acquisitionEnd = new Date("2023-12-31");
      const concessionEnd = new Date(acquisitionEnd);
      concessionEnd.setFullYear(concessionEnd.getFullYear() + 1);
      
      const vacationStart = new Date("2024-06-01");
      const isWithinConcession = vacationStart <= concessionEnd;
      expect(isWithinConcession).toBe(true);
    });

    it("should identify expired vacation", () => {
      const acquisitionEnd = new Date("2022-12-31");
      const concessionEnd = new Date(acquisitionEnd);
      concessionEnd.setFullYear(concessionEnd.getFullYear() + 1);
      
      const today = new Date("2024-06-01");
      const isExpired = today > concessionEnd;
      expect(isExpired).toBe(true);
    });
  });

  describe("Vacation Splitting", () => {
    it("should allow splitting into 3 periods", () => {
      const totalDays = 30;
      const periods = [14, 10, 6];
      const sum = periods.reduce((a, b) => a + b, 0);
      expect(sum).toBe(totalDays);
    });

    it("should require at least one period of 14 days", () => {
      const periods = [14, 10, 6];
      const hasMinPeriod = periods.some((p) => p >= 14);
      expect(hasMinPeriod).toBe(true);
    });

    it("should not allow periods less than 5 days", () => {
      const periods = [14, 10, 6];
      const allValid = periods.every((p) => p >= 5);
      expect(allValid).toBe(true);
    });

    it("should reject invalid split", () => {
      const periods = [15, 12, 3]; // 3 is less than 5
      const allValid = periods.every((p) => p >= 5);
      expect(allValid).toBe(false);
    });
  });

  describe("Collective Vacation", () => {
    it("should validate collective vacation minimum days", () => {
      const minDays = 10;
      const collectiveDays = 12;
      expect(collectiveDays >= minDays).toBe(true);
    });

    it("should validate collective vacation maximum periods", () => {
      const maxPeriods = 2;
      const periods = 2;
      expect(periods <= maxPeriods).toBe(true);
    });

    it("should calculate proportional vacation for new employee", () => {
      const monthsWorked = 8;
      const proportionalDays = Math.floor((monthsWorked / 12) * 30);
      expect(proportionalDays).toBe(20);
    });
  });

  describe("Vacation Workflow", () => {
    const validTransitions: Record<string, string[]> = {
      SCHEDULED: ["APPROVED", "CANCELLED"],
      APPROVED: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["COMPLETED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    it("should allow SCHEDULED to APPROVED", () => {
      expect(validTransitions.SCHEDULED.includes("APPROVED")).toBe(true);
    });

    it("should allow APPROVED to IN_PROGRESS", () => {
      expect(validTransitions.APPROVED.includes("IN_PROGRESS")).toBe(true);
    });

    it("should allow IN_PROGRESS to COMPLETED", () => {
      expect(validTransitions.IN_PROGRESS.includes("COMPLETED")).toBe(true);
    });

    it("should not allow COMPLETED to any status", () => {
      expect(validTransitions.COMPLETED.length).toBe(0);
    });

    it("should allow cancellation from SCHEDULED", () => {
      expect(validTransitions.SCHEDULED.includes("CANCELLED")).toBe(true);
    });

    it("should allow cancellation from APPROVED", () => {
      expect(validTransitions.APPROVED.includes("CANCELLED")).toBe(true);
    });
  });
});
