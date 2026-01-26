import { describe, expect, it } from "vitest";
import { z } from "zod";

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
});
