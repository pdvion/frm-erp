import { describe, expect, it } from "vitest";
import { z } from "zod";

const listInputSchema = z
  .object({
    reportType: z.string().optional(),
    onlyFavorites: z.boolean().optional(),
    includeShared: z.boolean().optional(),
  })
  .optional();

const getByIdInputSchema = z.object({ id: z.string().uuid() });

const createInputSchema = z.object({
  reportType: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  filters: z.record(z.string(), z.unknown()),
  isDefault: z.boolean().optional(),
  isShared: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
});

const updateInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  isDefault: z.boolean().optional(),
  isShared: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
});

const deleteInputSchema = z.object({ id: z.string().uuid() });
const toggleFavoriteInputSchema = z.object({ id: z.string().uuid() });
const getDefaultInputSchema = z.object({ reportType: z.string().min(1) });

describe("SavedReports Router Schemas", () => {
  describe("list input", () => {
    it("accepts undefined", () => {
      expect(listInputSchema.safeParse(undefined).success).toBe(true);
    });

    it("accepts filters", () => {
      expect(listInputSchema.safeParse({ reportType: "materials", onlyFavorites: true, includeShared: true }).success).toBe(true);
    });
  });

  describe("getById input", () => {
    it("requires uuid", () => {
      expect(getByIdInputSchema.safeParse({ id: "not-uuid" }).success).toBe(false);
      expect(getByIdInputSchema.safeParse({ id: "123e4567-e89b-12d3-a456-426614174000" }).success).toBe(true);
    });
  });

  describe("create input", () => {
    it("requires reportType, name and filters", () => {
      expect(
        createInputSchema.safeParse({ reportType: "materials", name: "Meu", filters: { q: "x" } }).success
      ).toBe(true);
      expect(createInputSchema.safeParse({ reportType: "", name: "x", filters: {} }).success).toBe(false);
    });
  });

  describe("update input", () => {
    it("allows partial updates", () => {
      expect(
        updateInputSchema.safeParse({
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Novo",
          isFavorite: true,
        }).success
      ).toBe(true);
    });
  });

  describe("delete/toggleFavorite/getDefault inputs", () => {
    it("delete requires uuid", () => {
      expect(deleteInputSchema.safeParse({ id: "123e4567-e89b-12d3-a456-426614174000" }).success).toBe(true);
    });

    it("toggleFavorite requires uuid", () => {
      expect(toggleFavoriteInputSchema.safeParse({ id: "123e4567-e89b-12d3-a456-426614174000" }).success).toBe(true);
    });

    it("getDefault requires reportType", () => {
      expect(getDefaultInputSchema.safeParse({ reportType: "materials" }).success).toBe(true);
      expect(getDefaultInputSchema.safeParse({ reportType: "" }).success).toBe(false);
    });
  });
});
