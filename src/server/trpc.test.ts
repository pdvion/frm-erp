import { describe, it, expect } from "vitest";
import { tenantFilter } from "./trpc";

describe("tRPC Utilities", () => {
  describe("tenantFilter", () => {
    it("should return empty object when companyId is null", () => {
      const result = tenantFilter(null);
      expect(result).toEqual({});
    });

    it("should return empty object when companyId is null and includeShared is false", () => {
      const result = tenantFilter(null, false);
      expect(result).toEqual({});
    });

    it("should return OR filter with shared data when includeShared is true", () => {
      const companyId = "company-123";
      const result = tenantFilter(companyId, true);

      expect(result).toHaveProperty("OR");
      expect(result.OR).toHaveLength(3);
      expect(result.OR).toContainEqual({ companyId });
      expect(result.OR).toContainEqual({ companyId: null });
      expect(result.OR).toContainEqual({ isShared: true });
    });

    it("should return OR filter by default (includeShared defaults to true)", () => {
      const companyId = "company-456";
      const result = tenantFilter(companyId);

      expect(result).toHaveProperty("OR");
      expect(result.OR).toHaveLength(3);
    });

    it("should return simple companyId filter when includeShared is false", () => {
      const companyId = "company-789";
      const result = tenantFilter(companyId, false);

      expect(result).toEqual({ companyId });
      expect(result).not.toHaveProperty("OR");
    });

    it("should handle UUID companyId", () => {
      const companyId = "550e8400-e29b-41d4-a716-446655440000";
      const result = tenantFilter(companyId, false);

      expect(result).toEqual({ companyId });
    });

    it("should include null companyId in OR filter for global records", () => {
      const companyId = "company-abc";
      const result = tenantFilter(companyId, true);

      const hasNullCompanyId = result.OR?.some(
        (condition: Record<string, unknown>) => condition.companyId === null
      );
      expect(hasNullCompanyId).toBe(true);
    });

    it("should include isShared in OR filter for shared records", () => {
      const companyId = "company-def";
      const result = tenantFilter(companyId, true);

      const hasIsShared = result.OR?.some(
        (condition: Record<string, unknown>) => condition.isShared === true
      );
      expect(hasIsShared).toBe(true);
    });
  });
});
