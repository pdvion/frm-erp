import { describe, it, expect } from "vitest";
import { tenantFilter, tenantFilterShared } from "./trpc";

describe("tRPC Utilities", () => {
  describe("tenantFilter", () => {
    it("should return empty object when companyId is null", () => {
      const result = tenantFilter(null);
      expect(result).toEqual({});
    });

    it("should return simple companyId filter", () => {
      const companyId = "company-123";
      const result = tenantFilter(companyId);

      expect(result).toEqual({ companyId });
      expect(result).not.toHaveProperty("OR");
    });

    it("should handle UUID companyId", () => {
      const companyId = "550e8400-e29b-41d4-a716-446655440000";
      const result = tenantFilter(companyId);

      expect(result).toEqual({ companyId });
    });
  });

  describe("tenantFilterShared", () => {
    it("should return empty object when companyId is null", () => {
      const result = tenantFilterShared(null);
      expect(result).toEqual({});
    });

    it("should return OR filter with shared data", () => {
      const companyId = "company-123";
      const result = tenantFilterShared(companyId);

      expect(result).toHaveProperty("OR");
      expect(result.OR).toHaveLength(3);
      expect(result.OR).toContainEqual({ companyId });
      expect(result.OR).toContainEqual({ companyId: null });
      expect(result.OR).toContainEqual({ isShared: true });
    });

    it("should include null companyId in OR filter for global records", () => {
      const companyId = "company-abc";
      const result = tenantFilterShared(companyId);

      const hasNullCompanyId = result.OR?.some(
        (condition: Record<string, unknown>) => condition.companyId === null
      );
      expect(hasNullCompanyId).toBe(true);
    });

    it("should include isShared in OR filter for shared records", () => {
      const companyId = "company-def";
      const result = tenantFilterShared(companyId);

      const hasIsShared = result.OR?.some(
        (condition: Record<string, unknown>) => condition.isShared === true
      );
      expect(hasIsShared).toBe(true);
    });
  });
});
