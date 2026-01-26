import { describe, expect, it } from "vitest";
import { z } from "zod";

const listInputSchema = z
  .object({
    module: z.string().optional(),
    category: z.string().optional(),
    includeContent: z.boolean().optional(),
  })
  .optional();

const getBySlugInputSchema = z.object({ slug: z.string() });
const getByModuleInputSchema = z.object({ module: z.string() });

const createInputSchema = z.object({
  slug: z.string().min(3).max(100),
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  content: z.string().min(10),
  module: z.string().optional(),
  category: z.string().optional(),
  icon: z.string().optional(),
  orderIndex: z.number().default(0),
});

const updateInputSchema = z.object({
  id: z.string(),
  slug: z.string().min(3).max(100).optional(),
  title: z.string().min(3).max(255).optional(),
  description: z.string().optional(),
  content: z.string().min(10).optional(),
  module: z.string().optional(),
  category: z.string().optional(),
  icon: z.string().optional(),
  orderIndex: z.number().optional(),
  isPublished: z.boolean().optional(),
});

const deleteInputSchema = z.object({ id: z.string() });

describe("Tutorials Router Schemas", () => {
  describe("list input", () => {
    it("accepts undefined", () => {
      expect(listInputSchema.safeParse(undefined).success).toBe(true);
    });

    it("accepts filters", () => {
      expect(listInputSchema.safeParse({ module: "MATERIALS", includeContent: true }).success).toBe(true);
    });
  });

  describe("getBySlug/getByModule inputs", () => {
    it("requires slug", () => {
      expect(getBySlugInputSchema.safeParse({ slug: "intro" }).success).toBe(true);
      expect(getBySlugInputSchema.safeParse({}).success).toBe(false);
    });

    it("requires module", () => {
      expect(getByModuleInputSchema.safeParse({ module: "MATERIALS" }).success).toBe(true);
      expect(getByModuleInputSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("create input", () => {
    it("validates length constraints", () => {
      expect(createInputSchema.safeParse({ slug: "ab", title: "abc", content: "1234567890" }).success).toBe(false);
      expect(
        createInputSchema.safeParse({ slug: "intro-mat", title: "Introdução", content: "Conteúdo longo...", orderIndex: 1 }).success
      ).toBe(true);
    });

    it("defaults orderIndex", () => {
      const parsed = createInputSchema.parse({ slug: "intro", title: "Intro", content: "1234567890" });
      expect(parsed.orderIndex).toBe(0);
    });
  });

  describe("update/delete inputs", () => {
    it("update requires id", () => {
      expect(updateInputSchema.safeParse({ id: "t1", title: "Novo" }).success).toBe(true);
      expect(updateInputSchema.safeParse({ title: "Novo" }).success).toBe(false);
    });

    it("delete requires id", () => {
      expect(deleteInputSchema.safeParse({ id: "t1" }).success).toBe(true);
    });
  });
});
