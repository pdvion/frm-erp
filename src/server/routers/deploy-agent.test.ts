import { describe, expect, it } from "vitest";
import { z } from "zod";

const listPendingImportsInputSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

const getImportDetailsInputSchema = z.object({ id: z.string() });

const previewImportInputSchema = z.object({
  invoiceId: z.string(),
  importSuppliers: z.boolean().default(true),
  importMaterials: z.boolean().default(true),
});

const executeImportInputSchema = z.object({
  invoiceId: z.string(),
  importSuppliers: z.boolean().default(true),
  importMaterials: z.boolean().default(true),
  updateIfExists: z.boolean().default(false),
});

const rejectImportInputSchema = z.object({
  invoiceId: z.string(),
  reason: z.string().optional(),
});

describe("Deploy Agent Router Schemas", () => {
  describe("listPendingImports input", () => {
    it("applies defaults", () => {
      const parsed = listPendingImportsInputSchema.parse({});
      expect(parsed.limit).toBe(50);
    });

    it("validates limit boundaries", () => {
      expect(listPendingImportsInputSchema.safeParse({ limit: 1 }).success).toBe(true);
      expect(listPendingImportsInputSchema.safeParse({ limit: 100 }).success).toBe(true);
      expect(listPendingImportsInputSchema.safeParse({ limit: 0 }).success).toBe(false);
      expect(listPendingImportsInputSchema.safeParse({ limit: 101 }).success).toBe(false);
    });

    it("accepts status filter", () => {
      expect(listPendingImportsInputSchema.safeParse({ status: "PENDING" }).success).toBe(true);
    });
  });

  describe("getImportDetails input", () => {
    it("requires id", () => {
      expect(getImportDetailsInputSchema.safeParse({ id: "inv-1" }).success).toBe(true);
      expect(getImportDetailsInputSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("previewImport input", () => {
    it("applies defaults", () => {
      const parsed = previewImportInputSchema.parse({ invoiceId: "inv-1" });
      expect(parsed.importSuppliers).toBe(true);
      expect(parsed.importMaterials).toBe(true);
    });
  });

  describe("executeImport input", () => {
    it("applies defaults", () => {
      const parsed = executeImportInputSchema.parse({ invoiceId: "inv-1" });
      expect(parsed.importSuppliers).toBe(true);
      expect(parsed.importMaterials).toBe(true);
      expect(parsed.updateIfExists).toBe(false);
    });
  });

  describe("rejectImport input", () => {
    it("accepts optional reason", () => {
      expect(rejectImportInputSchema.safeParse({ invoiceId: "inv-1" }).success).toBe(true);
      expect(rejectImportInputSchema.safeParse({ invoiceId: "inv-1", reason: "Duplicada" }).success).toBe(true);
    });
  });
});
