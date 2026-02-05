import { describe, it, expect } from "vitest";
import { z } from "zod";

const getStatusSchema = z.object({ companyId: z.string().uuid() });
const startSchema = z.object({ companyId: z.string().uuid() });
const updateStepSchema = z.object({
  companyId: z.string().uuid(),
  step: z.number().min(1).max(5),
  data: z.record(z.string(), z.unknown()),
});
const completeSchema = z.object({ companyId: z.string().uuid() });

describe("Onboarding Router - Schema Validation", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";

  describe("getStatus", () => {
    it("aceita companyId válido", () => {
      expect(() => getStatusSchema.parse({ companyId: validUuid })).not.toThrow();
    });
    it("rejeita companyId inválido", () => {
      expect(() => getStatusSchema.parse({ companyId: "invalid" })).toThrow();
    });
  });

  describe("start", () => {
    it("aceita companyId válido", () => {
      expect(() => startSchema.parse({ companyId: validUuid })).not.toThrow();
    });
    it("rejeita companyId inválido", () => {
      expect(() => startSchema.parse({ companyId: "bad" })).toThrow();
    });
  });

  describe("updateStep", () => {
    it("aceita step 1-5", () => {
      for (let step = 1; step <= 5; step++) {
        expect(() => updateStepSchema.parse({ companyId: validUuid, step, data: {} })).not.toThrow();
      }
    });
    it("rejeita step 0", () => {
      expect(() => updateStepSchema.parse({ companyId: validUuid, step: 0, data: {} })).toThrow();
    });
    it("rejeita step 6", () => {
      expect(() => updateStepSchema.parse({ companyId: validUuid, step: 6, data: {} })).toThrow();
    });
    it("aceita data com campos", () => {
      expect(() => updateStepSchema.parse({ companyId: validUuid, step: 1, data: { name: "Test" } })).not.toThrow();
    });
  });

  describe("complete", () => {
    it("aceita companyId válido", () => {
      expect(() => completeSchema.parse({ companyId: validUuid })).not.toThrow();
    });
    it("rejeita companyId inválido", () => {
      expect(() => completeSchema.parse({ companyId: "" })).toThrow();
    });
  });
});
