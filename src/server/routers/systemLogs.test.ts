import { describe, expect, it } from "vitest";
import { z } from "zod";

const listInputSchema = z
  .object({
    page: z.number().default(1),
    limit: z.number().default(50),
    level: z.enum(["debug", "info", "warn", "error", "fatal"]).optional(),
    source: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .optional();

const getByIdInputSchema = z.object({ id: z.string() });

const statsInputSchema = z
  .object({
    days: z.number().default(7),
  })
  .optional();

const cleanupInputSchema = z.object({
  daysOld: z.number().default(30),
});

describe("SystemLogs Router Schemas", () => {
  describe("list input", () => {
    it("accepts undefined", () => {
      expect(listInputSchema.safeParse(undefined).success).toBe(true);
    });

    it("applies defaults", () => {
      const parsed = listInputSchema.parse({});
      expect(parsed?.page).toBe(1);
      expect(parsed?.limit).toBe(50);
    });

    it("accepts level filter", () => {
      expect(listInputSchema.safeParse({ level: "error" }).success).toBe(true);
      expect(listInputSchema.safeParse({ level: "x" }).success).toBe(false);
    });
  });

  describe("getById input", () => {
    it("requires id", () => {
      expect(getByIdInputSchema.safeParse({ id: "log-1" }).success).toBe(true);
      expect(getByIdInputSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("stats input", () => {
    it("accepts undefined and applies default", () => {
      expect(statsInputSchema.safeParse(undefined).success).toBe(true);
      const parsed = statsInputSchema.parse({});
      expect(parsed?.days).toBe(7);
    });
  });

  describe("cleanup input", () => {
    it("defaults daysOld", () => {
      const parsed = cleanupInputSchema.parse({});
      expect(parsed.daysOld).toBe(30);
    });
  });
});
