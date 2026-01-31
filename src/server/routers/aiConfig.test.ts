import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  AI_PROVIDERS,
  AI_MODELS,
  getDefaultModel,
  getModelInfo,
  calculateCost,
} from "@/lib/ai/models";

const aiProviderSchema = z.enum(["openai", "anthropic", "google"]);

const saveTokenInputSchema = z.object({
  provider: aiProviderSchema,
  token: z.string().min(1),
});

const removeTokenInputSchema = z.object({
  provider: aiProviderSchema,
});

const setDefaultProviderInputSchema = z.object({
  provider: aiProviderSchema,
});

const validateTokenInputSchema = z.object({
  provider: aiProviderSchema,
  token: z.string().min(1),
});

function validateToken(provider: "openai" | "anthropic" | "google", token: string): { valid: boolean; error?: string } {
  if (provider === "openai" && !token.startsWith("sk-")) {
    return { valid: false, error: "Token OpenAI deve começar com 'sk-'" };
  }
  if (provider === "anthropic" && !token.startsWith("sk-ant-")) {
    return { valid: false, error: "Token Anthropic deve começar com 'sk-ant-'" };
  }
  if (provider === "google" && token.length < 20) {
    return { valid: false, error: "Token Google parece inválido" };
  }
  return { valid: true };
}

describe("AI Config Router Schemas", () => {
  describe("provider enum", () => {
    it("accepts openai", () => {
      expect(aiProviderSchema.safeParse("openai").success).toBe(true);
    });

    it("rejects invalid", () => {
      expect(aiProviderSchema.safeParse("x").success).toBe(false);
    });
  });

  describe("saveToken input", () => {
    it("requires token", () => {
      expect(saveTokenInputSchema.safeParse({ provider: "openai", token: "sk-123" }).success).toBe(true);
      expect(saveTokenInputSchema.safeParse({ provider: "openai", token: "" }).success).toBe(false);
    });
  });

  describe("removeToken input", () => {
    it("accepts provider", () => {
      expect(removeTokenInputSchema.safeParse({ provider: "google" }).success).toBe(true);
    });
  });

  describe("setDefaultProvider input", () => {
    it("accepts provider", () => {
      expect(setDefaultProviderInputSchema.safeParse({ provider: "anthropic" }).success).toBe(true);
    });
  });

  describe("validateToken input + logic", () => {
    it("validates zod input", () => {
      expect(validateTokenInputSchema.safeParse({ provider: "openai", token: "sk-abc" }).success).toBe(true);
    });

    it("rejects openai token without sk-", () => {
      const result = validateToken("openai", "abc");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Token OpenAI deve começar com 'sk-'");
    });

    it("rejects anthropic token without sk-ant-", () => {
      const result = validateToken("anthropic", "sk-abc");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Token Anthropic deve começar com 'sk-ant-'");
    });

    it("rejects short google token", () => {
      const result = validateToken("google", "short");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Token Google parece inválido");
    });

    it("accepts valid tokens", () => {
      expect(validateToken("openai", "sk-123").valid).toBe(true);
      expect(validateToken("anthropic", "sk-ant-123").valid).toBe(true);
      expect(validateToken("google", "x".repeat(20)).valid).toBe(true);
    });
  });

  describe("setDefaultModel input", () => {
    const setDefaultModelInputSchema = z.object({
      provider: aiProviderSchema,
      model: z.string().min(1),
    });

    it("accepts valid input", () => {
      expect(
        setDefaultModelInputSchema.safeParse({
          provider: "openai",
          model: "gpt-4o",
        }).success
      ).toBe(true);
    });

    it("rejects empty model", () => {
      expect(
        setDefaultModelInputSchema.safeParse({
          provider: "openai",
          model: "",
        }).success
      ).toBe(false);
    });

    it("rejects invalid provider", () => {
      expect(
        setDefaultModelInputSchema.safeParse({
          provider: "invalid",
          model: "gpt-4o",
        }).success
      ).toBe(false);
    });
  });
});

describe("setFallbackConfig input", () => {
  const setFallbackConfigInputSchema = z.object({
    enableFallback: z.boolean(),
    fallbackProvider: z.enum(["openai", "anthropic", "google"]).optional(),
  });

  it("accepts valid input with provider", () => {
    expect(
      setFallbackConfigInputSchema.safeParse({
        enableFallback: true,
        fallbackProvider: "anthropic",
      }).success
    ).toBe(true);
  });

  it("accepts valid input without provider", () => {
    expect(
      setFallbackConfigInputSchema.safeParse({
        enableFallback: false,
      }).success
    ).toBe(true);
  });

  it("rejects invalid provider", () => {
    expect(
      setFallbackConfigInputSchema.safeParse({
        enableFallback: true,
        fallbackProvider: "invalid",
      }).success
    ).toBe(false);
  });
});

describe("AI Models Module", () => {
  describe("AI_PROVIDERS", () => {
    it("has 3 providers", () => {
      expect(AI_PROVIDERS).toHaveLength(3);
      expect(AI_PROVIDERS).toContain("openai");
      expect(AI_PROVIDERS).toContain("anthropic");
      expect(AI_PROVIDERS).toContain("google");
    });
  });

  describe("AI_MODELS", () => {
    it("has models for each provider", () => {
      expect(AI_MODELS.openai.length).toBeGreaterThan(0);
      expect(AI_MODELS.anthropic.length).toBeGreaterThan(0);
      expect(AI_MODELS.google.length).toBeGreaterThan(0);
    });

    it("each model has required fields", () => {
      for (const provider of AI_PROVIDERS) {
        for (const model of AI_MODELS[provider]) {
          expect(model.id).toBeDefined();
          expect(model.name).toBeDefined();
          expect(model.description).toBeDefined();
          expect(model.contextWindow).toBeGreaterThan(0);
          expect(model.costPer1MInput).toBeGreaterThanOrEqual(0);
          expect(model.costPer1MOutput).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it("each provider has exactly one recommended model", () => {
      for (const provider of AI_PROVIDERS) {
        const recommended = AI_MODELS[provider].filter((m) => m.recommended);
        expect(recommended.length).toBe(1);
      }
    });
  });

  describe("getDefaultModel", () => {
    it("returns recommended model for openai", () => {
      const model = getDefaultModel("openai");
      expect(model).toBe("gpt-4o");
    });

    it("returns recommended model for anthropic", () => {
      const model = getDefaultModel("anthropic");
      expect(model).toBe("claude-3-5-sonnet-20241022");
    });

    it("returns recommended model for google", () => {
      const model = getDefaultModel("google");
      expect(model).toBe("gemini-1.5-pro");
    });
  });

  describe("getModelInfo", () => {
    it("returns model info for valid model", () => {
      const info = getModelInfo("openai", "gpt-4o");
      expect(info).toBeDefined();
      expect(info?.name).toBe("GPT-4o");
      expect(info?.recommended).toBe(true);
    });

    it("returns undefined for invalid model", () => {
      const info = getModelInfo("openai", "invalid-model");
      expect(info).toBeUndefined();
    });
  });

  describe("calculateCost", () => {
    it("calculates cost correctly for gpt-4o", () => {
      // gpt-4o: $2.50/1M input, $10.00/1M output
      const cost = calculateCost("openai", "gpt-4o", 1000, 500);
      // (1000 * 2.50 + 500 * 10.00) / 1_000_000 = 0.0075
      expect(cost).toBeCloseTo(0.0075, 6);
    });

    it("calculates cost correctly for claude-3-5-sonnet", () => {
      // claude-3-5-sonnet: $3.00/1M input, $15.00/1M output
      const cost = calculateCost("anthropic", "claude-3-5-sonnet-20241022", 10000, 5000);
      // (10000 * 3.00 + 5000 * 15.00) / 1_000_000 = 0.105
      expect(cost).toBeCloseTo(0.105, 6);
    });

    it("returns 0 for invalid model", () => {
      const cost = calculateCost("openai", "invalid-model", 1000, 500);
      expect(cost).toBe(0);
    });
  });
});
