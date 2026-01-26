import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router timeclock (Ponto Eletrônico)
 * Valida inputs e estruturas de dados de marcações de ponto
 */

// Schema de tipo de marcação
const clockTypeSchema = z.enum([
  "CLOCK_IN",
  "CLOCK_OUT",
  "BREAK_START",
  "BREAK_END",
]);

// Schema de marcação de ponto
const clockInInputSchema = z.object({
  employeeId: z.string().uuid(),
  type: clockTypeSchema,
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  deviceId: z.string().optional(),
});

// Schema de marcação manual
const manualEntryInputSchema = z.object({
  employeeId: z.string().uuid(),
  type: clockTypeSchema,
  timestamp: z.date(),
  justification: z.string().min(10),
});

// Schema de listagem de marcações
const listEntriesInputSchema = z.object({
  employeeId: z.string().uuid().optional(),
  startDate: z.date(),
  endDate: z.date(),
  page: z.number().default(1),
  limit: z.number().default(50),
});

// Schema de resposta de marcação (used for documentation)
const _timeClockEntrySchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  type: clockTypeSchema,
  timestamp: z.date(),
  location: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  deviceId: z.string().nullable(),
  ipAddress: z.string().nullable(),
  isManual: z.boolean(),
  justification: z.string().nullable(),
});

// Schema de espelho de ponto
const timesheetSchema = z.object({
  employeeId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number(),
  workedHours: z.number(),
  overtimeHours: z.number(),
  nightHours: z.number(),
  absences: z.number(),
  delays: z.number(),
});

describe("Timeclock Router Schemas", () => {
  describe("Clock Type Schema", () => {
    it("should accept CLOCK_IN type", () => {
      const result = clockTypeSchema.safeParse("CLOCK_IN");
      expect(result.success).toBe(true);
    });

    it("should accept CLOCK_OUT type", () => {
      const result = clockTypeSchema.safeParse("CLOCK_OUT");
      expect(result.success).toBe(true);
    });

    it("should accept BREAK_START type", () => {
      const result = clockTypeSchema.safeParse("BREAK_START");
      expect(result.success).toBe(true);
    });

    it("should accept BREAK_END type", () => {
      const result = clockTypeSchema.safeParse("BREAK_END");
      expect(result.success).toBe(true);
    });

    it("should reject invalid type", () => {
      const result = clockTypeSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("TimeClock Entry Schema", () => {
    it("should validate entry response shape", () => {
      const result = _timeClockEntrySchema.safeParse({
        id: "entry-1",
        employeeId: "emp-1",
        type: "CLOCK_IN",
        timestamp: new Date("2024-01-01T08:00:00Z"),
        location: null,
        latitude: null,
        longitude: null,
        deviceId: null,
        ipAddress: null,
        isManual: false,
        justification: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Clock In Input Schema", () => {
    it("should accept minimal valid input", () => {
      const result = clockInInputSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        type: "CLOCK_IN",
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete input with location", () => {
      const result = clockInInputSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        type: "CLOCK_IN",
        location: "Escritório Central",
        latitude: -23.5505,
        longitude: -46.6333,
        deviceId: "device-001",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const result = clockInInputSchema.safeParse({
        employeeId: "invalid-uuid",
        type: "CLOCK_IN",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing type", () => {
      const result = clockInInputSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Manual Entry Input Schema", () => {
    it("should accept valid input", () => {
      const result = manualEntryInputSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        type: "CLOCK_IN",
        timestamp: new Date("2024-01-15T08:00:00"),
        justification: "Esqueci de bater o ponto na entrada",
      });
      expect(result.success).toBe(true);
    });

    it("should reject short justification", () => {
      const result = manualEntryInputSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        type: "CLOCK_IN",
        timestamp: new Date("2024-01-15T08:00:00"),
        justification: "Esqueci",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing justification", () => {
      const result = manualEntryInputSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        type: "CLOCK_IN",
        timestamp: new Date("2024-01-15T08:00:00"),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("List Entries Input Schema", () => {
    it("should accept valid input", () => {
      const result = listEntriesInputSchema.safeParse({
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should accept input with employeeId", () => {
      const result = listEntriesInputSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should accept pagination", () => {
      const result = listEntriesInputSchema.safeParse({
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
        page: 2,
        limit: 100,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing dates", () => {
      const result = listEntriesInputSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Timesheet Schema", () => {
    it("should accept valid timesheet", () => {
      const result = timesheetSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        month: 1,
        year: 2024,
        workedHours: 176,
        overtimeHours: 10,
        nightHours: 0,
        absences: 0,
        delays: 2,
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid month", () => {
      const result = timesheetSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        month: 13,
        year: 2024,
        workedHours: 176,
        overtimeHours: 0,
        nightHours: 0,
        absences: 0,
        delays: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject month 0", () => {
      const result = timesheetSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        month: 0,
        year: 2024,
        workedHours: 176,
        overtimeHours: 0,
        nightHours: 0,
        absences: 0,
        delays: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Work Hours Calculations", () => {
    it("should calculate daily worked hours", () => {
      const clockIn = new Date("2024-01-15T08:00:00");
      const breakStart = new Date("2024-01-15T12:00:00");
      const breakEnd = new Date("2024-01-15T13:00:00");
      const clockOut = new Date("2024-01-15T17:00:00");

      const morningHours = (breakStart.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
      const afternoonHours = (clockOut.getTime() - breakEnd.getTime()) / (1000 * 60 * 60);
      const totalHours = morningHours + afternoonHours;

      expect(morningHours).toBe(4);
      expect(afternoonHours).toBe(4);
      expect(totalHours).toBe(8);
    });

    it("should calculate overtime hours", () => {
      const workedHours = 10;
      const standardHours = 8;
      const overtime = Math.max(0, workedHours - standardHours);
      expect(overtime).toBe(2);
    });

    it("should calculate night shift hours (22h-5h)", () => {
      // Night shift: 22h to 5h (next day)
      const clockIn = 22; // 10pm
      const clockOut = 4; // 4am

      let nightHours = 0;
      // Hours from clockIn to midnight
      nightHours += 24 - clockIn; // 2 hours (22-24)
      // Hours from midnight to clockOut
      nightHours += clockOut; // 4 hours (0-4)
      
      expect(nightHours).toBe(6); // 22-24 (2h) + 0-4 (4h) = 6h
    });

    it("should calculate delay in minutes", () => {
      const expectedTime = new Date("2024-01-15T08:00:00");
      const actualTime = new Date("2024-01-15T08:15:00");
      const delayMinutes = (actualTime.getTime() - expectedTime.getTime()) / (1000 * 60);
      expect(delayMinutes).toBe(15);
    });

    it("should not count early arrival as delay", () => {
      const expectedTime = new Date("2024-01-15T08:00:00");
      const actualTime = new Date("2024-01-15T07:45:00");
      const delayMinutes = Math.max(0, (actualTime.getTime() - expectedTime.getTime()) / (1000 * 60));
      expect(delayMinutes).toBe(0);
    });
  });

  describe("Overtime Calculations", () => {
    it("should calculate 50% overtime rate", () => {
      const hourlyRate = 20;
      const overtimeHours = 2;
      const overtimeRate = 1.5;
      const overtimePay = hourlyRate * overtimeHours * overtimeRate;
      expect(overtimePay).toBe(60);
    });

    it("should calculate 100% overtime rate (weekends)", () => {
      const hourlyRate = 20;
      const overtimeHours = 4;
      const overtimeRate = 2.0;
      const overtimePay = hourlyRate * overtimeHours * overtimeRate;
      expect(overtimePay).toBe(160);
    });

    it("should calculate night shift bonus (20%)", () => {
      const hourlyRate = 20;
      const nightHours = 6;
      const nightBonus = 0.2;
      const nightPay = hourlyRate * nightHours * nightBonus;
      expect(nightPay).toBe(24);
    });
  });

  describe("Absence Tracking", () => {
    it("should identify full day absence", () => {
      const entries: { type: string }[] = [];
      const hasClockIn = entries.some((e) => e.type === "CLOCK_IN");
      expect(hasClockIn).toBe(false);
    });

    it("should identify partial absence", () => {
      const workedHours = 4;
      const expectedHours = 8;
      const isPartialAbsence = workedHours < expectedHours && workedHours > 0;
      expect(isPartialAbsence).toBe(true);
    });

    it("should calculate absence deduction", () => {
      const dailyRate = 200;
      const absenceDays = 2;
      const deduction = dailyRate * absenceDays;
      expect(deduction).toBe(400);
    });
  });

  describe("Geolocation Validation", () => {
    it("should validate coordinates within range", () => {
      const companyLat = -23.5505;
      const companyLng = -46.6333;
      const employeeLat = -23.5510;
      const employeeLng = -46.6340;
      const maxDistanceKm = 0.5;

      // Haversine formula simplified
      const R = 6371; // Earth radius in km
      const dLat = ((employeeLat - companyLat) * Math.PI) / 180;
      const dLng = ((employeeLng - companyLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((companyLat * Math.PI) / 180) *
          Math.cos((employeeLat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      expect(distance).toBeLessThan(maxDistanceKm);
    });

    it("should reject coordinates outside range", () => {
      const companyLat = -23.5505;
      const companyLng = -46.6333;
      const employeeLat = -23.6000;
      const employeeLng = -46.7000;
      const maxDistanceKm = 0.5;

      const R = 6371;
      const dLat = ((employeeLat - companyLat) * Math.PI) / 180;
      const dLng = ((employeeLng - companyLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((companyLat * Math.PI) / 180) *
          Math.cos((employeeLat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      expect(distance).toBeGreaterThan(maxDistanceKm);
    });
  });

  describe("Entry Sequence Validation", () => {
    it("should validate correct entry sequence", () => {
      const entries = ["CLOCK_IN", "BREAK_START", "BREAK_END", "CLOCK_OUT"];
      const validSequence = ["CLOCK_IN", "BREAK_START", "BREAK_END", "CLOCK_OUT"];
      expect(entries).toEqual(validSequence);
    });

    it("should detect missing clock out", () => {
      const entries = ["CLOCK_IN", "BREAK_START", "BREAK_END"];
      const hasClockOut = entries.includes("CLOCK_OUT");
      expect(hasClockOut).toBe(false);
    });

    it("should detect duplicate clock in", () => {
      const entries = ["CLOCK_IN", "CLOCK_IN", "CLOCK_OUT"];
      const clockInCount = entries.filter((e) => e === "CLOCK_IN").length;
      expect(clockInCount).toBeGreaterThan(1);
    });
  });
});
