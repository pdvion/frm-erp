import { describe, expect, it } from "vitest";
import { z } from "zod";

const listInputSchema = z
  .object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(50),
    eventType: z.string().optional(),
    userId: z.string().optional(),
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
  })
  .optional();

const listResponseSchema = z.object({
  logs: z.array(
    z.object({
      id: z.string(),
      eventType: z.string(),
      userId: z.string().nullable(),
      email: z.string().nullable(),
      ipAddress: z.string().nullable(),
      createdAt: z.date(),
      payload: z.record(z.string(), z.unknown()),
    })
  ),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

const statsResponseSchema = z.object({
  last24h: z.number(),
  last7d: z.number(),
  byType: z.array(z.object({ type: z.string(), count: z.number() })),
});

describe("AuthLogs Router Schemas", () => {
  describe("list input", () => {
    it("accepts undefined", () => {
      expect(listInputSchema.safeParse(undefined).success).toBe(true);
    });

    it("applies defaults", () => {
      const parsed = listInputSchema.parse({});
      expect(parsed?.page).toBe(1);
      expect(parsed?.limit).toBe(50);
    });

    it("validates max limit", () => {
      expect(listInputSchema.safeParse({ limit: 100 }).success).toBe(true);
      expect(listInputSchema.safeParse({ limit: 101 }).success).toBe(false);
    });

    it("accepts filters", () => {
      const result = listInputSchema.safeParse({
        eventType: "login",
        userId: "user-1",
        dateFrom: new Date("2024-01-01"),
        dateTo: new Date("2024-12-31"),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("list response", () => {
    it("validates response shape", () => {
      const result = listResponseSchema.safeParse({
        logs: [
          {
            id: "log-1",
            eventType: "login",
            userId: null,
            email: "user@example.com",
            ipAddress: "127.0.0.1",
            createdAt: new Date("2024-01-01"),
            payload: { action: "login" },
          },
        ],
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("stats response", () => {
    it("validates response shape", () => {
      const result = statsResponseSchema.safeParse({
        last24h: 10,
        last7d: 100,
        byType: [{ type: "login", count: 50 }],
      });
      expect(result.success).toBe(true);
    });
  });
});
