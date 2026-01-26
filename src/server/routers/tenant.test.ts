import { describe, expect, it } from "vitest";
import { z } from "zod";

const switchCompanyInputSchema = z.object({
  companyId: z.string(),
});

const currentResponseSchema = z.object({
  userId: z.string().nullable(),
  companyId: z.string().nullable(),
  companies: z.array(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      code: z.number().optional(),
    })
  ),
  permissions: z.record(z.string(), z.unknown()),
});

const ensureUserResponseSchema = z.object({
  created: z.boolean(),
  userId: z.string().nullable(),
  error: z.string().optional(),
});

describe("Tenant Router Schemas", () => {
  describe("switchCompany input", () => {
    it("accepts companyId", () => {
      expect(switchCompanyInputSchema.safeParse({ companyId: "company-1" }).success).toBe(true);
    });
  });

  describe("ensureUser response", () => {
    it("accepts created=false no user", () => {
      const result = ensureUserResponseSchema.safeParse({ created: false, userId: null });
      expect(result.success).toBe(true);
    });

    it("accepts created=true with userId", () => {
      const result = ensureUserResponseSchema.safeParse({ created: true, userId: "user-1" });
      expect(result.success).toBe(true);
    });

    it("accepts error field", () => {
      const result = ensureUserResponseSchema.safeParse({ created: false, userId: null, error: "Nenhuma empresa cadastrada" });
      expect(result.success).toBe(true);
    });
  });

  describe("current response", () => {
    it("validates response shape", () => {
      const result = currentResponseSchema.safeParse({
        userId: "user-1",
        companyId: "company-1",
        companies: [{ id: "company-1", name: "Empresa" }],
        permissions: { SETTINGS: { level: "FULL" } },
      });
      expect(result.success).toBe(true);
    });
  });
});
