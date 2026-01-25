import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const listInputSchema = z.object({
  search: z.string().optional(),
  includeInactive: z.boolean().default(false),
}).optional();

const byIdInputSchema = z.object({ id: z.string() });

const createInputSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().optional(),
  budget: z.number().optional(),
});

const updateInputSchema = z.object({
  id: z.string(),
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  budget: z.number().optional(),
  isActive: z.boolean().optional(),
});

const deleteInputSchema = z.object({ id: z.string() });

describe("CostCenters Router Schemas", () => {
  describe("list input", () => {
    it("should accept empty input", () => {
      const result = listInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept search string", () => {
      const result = listInputSchema.safeParse({ search: "admin" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.search).toBe("admin");
      }
    });

    it("should default includeInactive to false", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.includeInactive).toBe(false);
      }
    });

    it("should accept includeInactive true", () => {
      const result = listInputSchema.safeParse({ includeInactive: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.includeInactive).toBe(true);
      }
    });
  });

  describe("byId input", () => {
    it("should accept valid id", () => {
      const result = byIdInputSchema.safeParse({ id: "cc-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = byIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject non-string id", () => {
      const result = byIdInputSchema.safeParse({ id: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe("create input", () => {
    it("should accept valid input", () => {
      const result = createInputSchema.safeParse({
        code: "CC001",
        name: "Administrativo",
      });
      expect(result.success).toBe(true);
    });

    it("should accept input with all fields", () => {
      const result = createInputSchema.safeParse({
        code: "CC002",
        name: "Produção",
        description: "Centro de custo de produção",
        parentId: "cc-parent",
        budget: 50000,
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty code", () => {
      const result = createInputSchema.safeParse({
        code: "",
        name: "Test",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const result = createInputSchema.safeParse({
        code: "CC001",
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing code", () => {
      const result = createInputSchema.safeParse({
        name: "Test",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing name", () => {
      const result = createInputSchema.safeParse({
        code: "CC001",
      });
      expect(result.success).toBe(false);
    });

    it("should accept budget as number", () => {
      const result = createInputSchema.safeParse({
        code: "CC001",
        name: "Test",
        budget: 10000.50,
      });
      expect(result.success).toBe(true);
    });

    it("should reject budget as string", () => {
      const result = createInputSchema.safeParse({
        code: "CC001",
        name: "Test",
        budget: "10000",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("update input", () => {
    it("should accept id only", () => {
      const result = updateInputSchema.safeParse({ id: "cc-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateInputSchema.safeParse({
        id: "cc-123",
        name: "Novo Nome",
      });
      expect(result.success).toBe(true);
    });

    it("should accept full update", () => {
      const result = updateInputSchema.safeParse({
        id: "cc-123",
        code: "CC001-NEW",
        name: "Novo Nome",
        description: "Nova descrição",
        parentId: "cc-parent",
        budget: 75000,
        isActive: false,
      });
      expect(result.success).toBe(true);
    });

    it("should accept null parentId", () => {
      const result = updateInputSchema.safeParse({
        id: "cc-123",
        parentId: null,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateInputSchema.safeParse({
        name: "Test",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty code", () => {
      const result = updateInputSchema.safeParse({
        id: "cc-123",
        code: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("delete input", () => {
    it("should accept valid id", () => {
      const result = deleteInputSchema.safeParse({ id: "cc-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = deleteInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
