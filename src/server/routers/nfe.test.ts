import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const importInputSchema = z.object({
  xmlContent: z.string(),
});

const listInputSchema = z.object({
  status: z.enum(["PENDING", "PROCESSED", "REJECTED", "CANCELLED", "ALL"]).optional(),
  supplierId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  search: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
}).optional();

const byIdInputSchema = z.object({ id: z.string() });

const byAccessKeyInputSchema = z.object({ accessKey: z.string().min(44).max(44) });

const processInputSchema = z.object({
  id: z.string(),
  createReceiving: z.boolean().default(true),
  locationId: z.string().optional(),
  notes: z.string().optional(),
});

const rejectInputSchema = z.object({
  id: z.string(),
  reason: z.string().min(1),
});

const cancelInputSchema = z.object({
  id: z.string(),
  reason: z.string().min(1),
});

const linkMaterialInputSchema = z.object({
  invoiceItemId: z.string(),
  materialId: z.string(),
});

const unlinkMaterialInputSchema = z.object({
  invoiceItemId: z.string(),
});

const linkSupplierInputSchema = z.object({
  invoiceId: z.string(),
  supplierId: z.string(),
});

const deleteInputSchema = z.object({ id: z.string() });

const manifestInputSchema = z.object({
  accessKey: z.string().min(44).max(44),
  event: z.enum(["CIENCIA", "CONFIRMACAO", "DESCONHECIMENTO", "NAO_REALIZADA"]),
  justification: z.string().optional(),
});

const consultInputSchema = z.object({
  accessKey: z.string().min(44).max(44),
});

const downloadInputSchema = z.object({
  accessKey: z.string().min(44).max(44),
});

describe("NFe Router Schemas", () => {
  describe("import input", () => {
    it("should accept valid XML content", () => {
      const result = importInputSchema.safeParse({
        xmlContent: "<nfeProc>...</nfeProc>",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing xmlContent", () => {
      const result = importInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("list input", () => {
    it("should accept empty input", () => {
      const result = listInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept status PENDING", () => {
      const result = listInputSchema.safeParse({ status: "PENDING" });
      expect(result.success).toBe(true);
    });

    it("should accept status PROCESSED", () => {
      const result = listInputSchema.safeParse({ status: "PROCESSED" });
      expect(result.success).toBe(true);
    });

    it("should accept status REJECTED", () => {
      const result = listInputSchema.safeParse({ status: "REJECTED" });
      expect(result.success).toBe(true);
    });

    it("should accept status CANCELLED", () => {
      const result = listInputSchema.safeParse({ status: "CANCELLED" });
      expect(result.success).toBe(true);
    });

    it("should accept status ALL", () => {
      const result = listInputSchema.safeParse({ status: "ALL" });
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = listInputSchema.safeParse({ status: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("should accept supplierId", () => {
      const result = listInputSchema.safeParse({ supplierId: "sup-123" });
      expect(result.success).toBe(true);
    });

    it("should accept date range", () => {
      const result = listInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should accept search string", () => {
      const result = listInputSchema.safeParse({ search: "12345" });
      expect(result.success).toBe(true);
    });

    it("should default page to 1", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.page).toBe(1);
      }
    });

    it("should default limit to 20", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.limit).toBe(20);
      }
    });
  });

  describe("byId input", () => {
    it("should accept valid id", () => {
      const result = byIdInputSchema.safeParse({ id: "nfe-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = byIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("byAccessKey input", () => {
    it("should accept valid 44-char access key", () => {
      const result = byAccessKeyInputSchema.safeParse({
        accessKey: "35260112345678000190550010000123451234567890",
      });
      expect(result.success).toBe(true);
    });

    it("should reject access key too short", () => {
      const result = byAccessKeyInputSchema.safeParse({
        accessKey: "123456789",
      });
      expect(result.success).toBe(false);
    });

    it("should reject access key too long", () => {
      const result = byAccessKeyInputSchema.safeParse({
        accessKey: "352601123456780001905500100001234512345678901234567890",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing accessKey", () => {
      const result = byAccessKeyInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("process input", () => {
    it("should accept valid process input", () => {
      const result = processInputSchema.safeParse({
        id: "nfe-123",
      });
      expect(result.success).toBe(true);
    });

    it("should apply default createReceiving", () => {
      const result = processInputSchema.safeParse({
        id: "nfe-123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.createReceiving).toBe(true);
      }
    });

    it("should accept full input", () => {
      const result = processInputSchema.safeParse({
        id: "nfe-123",
        createReceiving: false,
        locationId: "loc-001",
        notes: "Processamento manual",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = processInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("reject input", () => {
    it("should accept valid rejection", () => {
      const result = rejectInputSchema.safeParse({
        id: "nfe-123",
        reason: "Dados incorretos",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing reason", () => {
      const result = rejectInputSchema.safeParse({
        id: "nfe-123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty reason", () => {
      const result = rejectInputSchema.safeParse({
        id: "nfe-123",
        reason: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("cancel input", () => {
    it("should accept valid cancellation", () => {
      const result = cancelInputSchema.safeParse({
        id: "nfe-123",
        reason: "Nota cancelada pelo emitente",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing reason", () => {
      const result = cancelInputSchema.safeParse({
        id: "nfe-123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty reason", () => {
      const result = cancelInputSchema.safeParse({
        id: "nfe-123",
        reason: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("linkMaterial input", () => {
    it("should accept valid link", () => {
      const result = linkMaterialInputSchema.safeParse({
        invoiceItemId: "item-123",
        materialId: "mat-456",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing invoiceItemId", () => {
      const result = linkMaterialInputSchema.safeParse({
        materialId: "mat-456",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing materialId", () => {
      const result = linkMaterialInputSchema.safeParse({
        invoiceItemId: "item-123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("unlinkMaterial input", () => {
    it("should accept valid unlink", () => {
      const result = unlinkMaterialInputSchema.safeParse({
        invoiceItemId: "item-123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing invoiceItemId", () => {
      const result = unlinkMaterialInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("linkSupplier input", () => {
    it("should accept valid link", () => {
      const result = linkSupplierInputSchema.safeParse({
        invoiceId: "nfe-123",
        supplierId: "sup-456",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing invoiceId", () => {
      const result = linkSupplierInputSchema.safeParse({
        supplierId: "sup-456",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing supplierId", () => {
      const result = linkSupplierInputSchema.safeParse({
        invoiceId: "nfe-123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("delete input", () => {
    it("should accept valid id", () => {
      const result = deleteInputSchema.safeParse({ id: "nfe-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = deleteInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("manifest input", () => {
    it("should accept valid CIENCIA manifest", () => {
      const result = manifestInputSchema.safeParse({
        accessKey: "35260112345678000190550010000123451234567890",
        event: "CIENCIA",
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid CONFIRMACAO manifest", () => {
      const result = manifestInputSchema.safeParse({
        accessKey: "35260112345678000190550010000123451234567890",
        event: "CONFIRMACAO",
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid DESCONHECIMENTO manifest", () => {
      const result = manifestInputSchema.safeParse({
        accessKey: "35260112345678000190550010000123451234567890",
        event: "DESCONHECIMENTO",
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid NAO_REALIZADA manifest", () => {
      const result = manifestInputSchema.safeParse({
        accessKey: "35260112345678000190550010000123451234567890",
        event: "NAO_REALIZADA",
      });
      expect(result.success).toBe(true);
    });

    it("should accept manifest with justification", () => {
      const result = manifestInputSchema.safeParse({
        accessKey: "35260112345678000190550010000123451234567890",
        event: "DESCONHECIMENTO",
        justification: "Operação não realizada por esta empresa",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid event", () => {
      const result = manifestInputSchema.safeParse({
        accessKey: "35260112345678000190550010000123451234567890",
        event: "INVALID",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid access key length", () => {
      const result = manifestInputSchema.safeParse({
        accessKey: "123",
        event: "CIENCIA",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("consult input", () => {
    it("should accept valid access key", () => {
      const result = consultInputSchema.safeParse({
        accessKey: "35260112345678000190550010000123451234567890",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid access key length", () => {
      const result = consultInputSchema.safeParse({
        accessKey: "123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("download input", () => {
    it("should accept valid access key", () => {
      const result = downloadInputSchema.safeParse({
        accessKey: "35260112345678000190550010000123451234567890",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid access key length", () => {
      const result = downloadInputSchema.safeParse({
        accessKey: "123",
      });
      expect(result.success).toBe(false);
    });
  });
});
