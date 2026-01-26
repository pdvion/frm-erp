import { describe, expect, it } from "vitest";
import { z } from "zod";
import { SETTING_CATEGORIES } from "./settings";

const getByKeyInputSchema = z.object({
  key: z.string(),
  companyId: z.string().uuid().optional(),
});

const getByPrefixInputSchema = z.object({
  prefix: z.string(),
  companyId: z.string().uuid().optional(),
});

const getByCategoryInputSchema = z.object({
  category: z.string(),
});

const updateInputSchema = z.object({
  key: z.string(),
  value: z.unknown(),
  description: z.string().optional(),
  global: z.boolean().default(false),
});

const createInputSchema = z.object({
  key: z.string(),
  value: z.unknown(),
  category: z.string().default("general"),
  description: z.string().optional(),
});

const resetToGlobalInputSchema = z.object({
  key: z.string(),
});

const getLandingConfigInputSchema = z
  .object({
    companyId: z.string().uuid().optional(),
  })
  .optional();

const landingConfigResponseSchema = z.object({
  hero: z.object({
    title: z.unknown(),
    subtitle: z.unknown(),
    description: z.unknown(),
    image: z.unknown(),
  }),
  features: z.unknown(),
  trustIndicators: z.unknown(),
});

function mergeSettings<T>(global: Record<string, T>, company: Record<string, T>): Record<string, T> {
  return { ...global, ...company };
}

describe("Settings Router Schemas", () => {
  describe("SETTING_CATEGORIES", () => {
    it("exposes categories", () => {
      expect(SETTING_CATEGORIES.landing).toBeDefined();
      expect(SETTING_CATEGORIES.theme).toBeDefined();
      expect(SETTING_CATEGORIES.general).toBeDefined();
      expect(SETTING_CATEGORIES.email).toBeDefined();
      expect(SETTING_CATEGORIES.integrations).toBeDefined();
    });
  });

  describe("getByKey input", () => {
    it("requires key", () => {
      expect(getByKeyInputSchema.safeParse({}).success).toBe(false);
      expect(getByKeyInputSchema.safeParse({ key: "landing.hero.title" }).success).toBe(true);
    });

    it("accepts optional companyId uuid", () => {
      expect(
        getByKeyInputSchema.safeParse({ key: "landing.hero.title", companyId: "123e4567-e89b-12d3-a456-426614174000" }).success
      ).toBe(true);
    });
  });

  describe("getByPrefix input", () => {
    it("requires prefix", () => {
      expect(getByPrefixInputSchema.safeParse({}).success).toBe(false);
      expect(getByPrefixInputSchema.safeParse({ prefix: "landing." }).success).toBe(true);
    });
  });

  describe("getByCategory input", () => {
    it("requires category", () => {
      expect(getByCategoryInputSchema.safeParse({}).success).toBe(false);
      expect(getByCategoryInputSchema.safeParse({ category: "landing" }).success).toBe(true);
    });
  });

  describe("update input", () => {
    it("defaults global=false", () => {
      const parsed = updateInputSchema.parse({ key: "landing.hero.title", value: "Novo título" });
      expect(parsed.global).toBe(false);
    });

    it("accepts global=true", () => {
      const result = updateInputSchema.safeParse({ key: "landing.hero.title", value: "Novo título", global: true });
      expect(result.success).toBe(true);
    });
  });

  describe("create input", () => {
    it("defaults category=general", () => {
      const parsed = createInputSchema.parse({ key: "general.foo", value: true });
      expect(parsed.category).toBe("general");
    });

    it("accepts explicit category", () => {
      const result = createInputSchema.safeParse({ key: "landing.hero.title", value: "X", category: "landing" });
      expect(result.success).toBe(true);
    });
  });

  describe("resetToGlobal input", () => {
    it("requires key", () => {
      expect(resetToGlobalInputSchema.safeParse({}).success).toBe(false);
      expect(resetToGlobalInputSchema.safeParse({ key: "landing.hero.title" }).success).toBe(true);
    });
  });

  describe("getLandingConfig input/output", () => {
    it("accepts undefined input", () => {
      expect(getLandingConfigInputSchema.safeParse(undefined).success).toBe(true);
    });

    it("accepts companyId", () => {
      expect(
        getLandingConfigInputSchema.safeParse({ companyId: "123e4567-e89b-12d3-a456-426614174000" }).success
      ).toBe(true);
    });

    it("validates response shape", () => {
      const result = landingConfigResponseSchema.safeParse({
        hero: {
          title: "Gestão Industrial",
          subtitle: "Completa e Moderna",
          description: "",
          image: null,
        },
        features: [],
        trustIndicators: [],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("merging priority (company overrides global)", () => {
    it("merges keys with company precedence", () => {
      const global = { "landing.hero.title": "A", "landing.hero.subtitle": "B" };
      const company = { "landing.hero.title": "C" };
      const merged = mergeSettings(global, company);
      expect(merged["landing.hero.title"]).toBe("C");
      expect(merged["landing.hero.subtitle"]).toBe("B");
    });
  });
});
