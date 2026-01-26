import { describe, expect, it } from "vitest";
import { z } from "zod";

const getUploadUrlInputSchema = z.object({
  fileName: z.string(),
  path: z.string(),
  contentType: z.string(),
});

const confirmUploadInputSchema = z.object({ path: z.string() });
const deleteInputSchema = z.object({ path: z.string() });

const listInputSchema = z.object({
  path: z.string(),
  limit: z.number().default(50),
});

const getPublicUrlInputSchema = z.object({ path: z.string() });

function isAllowedContentType(contentType: string): boolean {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
  return allowedTypes.includes(contentType);
}

describe("Storage Router Schemas", () => {
  describe("getUploadUrl input", () => {
    it("requires fileName/path/contentType", () => {
      expect(getUploadUrlInputSchema.safeParse({ fileName: "a.png", path: "landing/hero", contentType: "image/png" }).success).toBe(true);
      expect(getUploadUrlInputSchema.safeParse({ fileName: "a.png", path: "landing/hero" }).success).toBe(false);
    });

    it("checks allowed types", () => {
      expect(isAllowedContentType("image/png")).toBe(true);
      expect(isAllowedContentType("application/pdf")).toBe(false);
    });
  });

  describe("confirmUpload/delete/getPublicUrl inputs", () => {
    it("accept path", () => {
      expect(confirmUploadInputSchema.safeParse({ path: "landing/hero/123.png" }).success).toBe(true);
      expect(deleteInputSchema.safeParse({ path: "landing/hero/123.png" }).success).toBe(true);
      expect(getPublicUrlInputSchema.safeParse({ path: "landing/hero/123.png" }).success).toBe(true);
    });
  });

  describe("list input", () => {
    it("defaults limit", () => {
      const parsed = listInputSchema.parse({ path: "landing" });
      expect(parsed.limit).toBe(50);
    });
  });
});
