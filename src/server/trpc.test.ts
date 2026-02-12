import { describe, it, expect } from "vitest";
import { tenantFilter, tenantFilterShared } from "./trpc";

describe("tRPC Utilities", () => {
  // Com ENABLE_PRISMA_RLS=true (default), tenantFilter e tenantFilterShared
  // retornam {} porque o createTenantPrisma já injeta o filtro automaticamente.
  // Isso evita filtro duplicado que causa erros no Prisma.

  describe("tenantFilter", () => {
    it("should return empty object when companyId is null", () => {
      const result = tenantFilter(null);
      expect(result).toEqual({});
    });

    it("should return empty object when RLS is active (default)", () => {
      const companyId = "company-123";
      const result = tenantFilter(companyId);
      // RLS Extension handles filtering via createTenantPrisma
      expect(result).toEqual({});
    });

    it("should return empty object for UUID companyId when RLS is active", () => {
      const companyId = "550e8400-e29b-41d4-a716-446655440000";
      const result = tenantFilter(companyId);
      expect(result).toEqual({});
    });
  });

  describe("tenantFilterShared", () => {
    it("should return empty object when companyId is null", () => {
      const result = tenantFilterShared(null);
      expect(result).toEqual({});
    });

    it("should return empty object when RLS is active (default)", () => {
      const companyId = "company-123";
      const result = tenantFilterShared(companyId);
      // RLS Extension handles shared model filtering via createTenantPrisma
      expect(result).toEqual({});
    });

    it("should return empty object for shared filter when RLS is active", () => {
      const companyId = "company-abc";
      const result = tenantFilterShared(companyId);
      expect(result).toEqual({});
    });

    it("should be a no-op when RLS Extension handles filtering", () => {
      const companyId = "company-def";
      const result = tenantFilterShared(companyId);
      expect(result).toEqual({});
      expect(result).not.toHaveProperty("OR");
    });
  });
});
