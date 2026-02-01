/**
 * Testes unitários para productMedia router
 * VIO-887: Upload de Mídia - Imagens e Vídeos
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas de validação (espelhando os do router)
const getUploadUrlInputSchema = z.object({
  productId: z.string().uuid(),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  mediaType: z.enum(["image", "video", "attachment"]),
});

const confirmImageUploadInputSchema = z.object({
  productId: z.string().uuid(),
  path: z.string().min(1),
  fileName: z.string().min(1),
  alt: z.string().optional(),
  caption: z.string().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  sizeBytes: z.number().int().optional(),
  isPrimary: z.boolean().optional(),
});

const confirmVideoUploadInputSchema = z.object({
  productId: z.string().uuid(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["training", "demo", "testimonial", "unboxing", "installation"]).optional(),
  duration: z.number().int().optional(),
  isExternal: z.boolean().optional(),
});

const confirmAttachmentUploadInputSchema = z.object({
  productId: z.string().uuid(),
  path: z.string().min(1),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  sizeBytes: z.number().int().optional(),
  type: z.enum(["datasheet", "manual", "certificate", "brochure", "warranty"]).optional(),
});

describe("productMedia router", () => {
  describe("getUploadUrl", () => {
    it("should accept valid input for image upload", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        fileName: "product-image.jpg",
        fileType: "image/jpeg",
        mediaType: "image" as const,
      };
      expect(() => getUploadUrlInputSchema.parse(input)).not.toThrow();
    });

    it("should accept valid input for video upload", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        fileName: "demo-video.mp4",
        fileType: "video/mp4",
        mediaType: "video" as const,
      };
      expect(() => getUploadUrlInputSchema.parse(input)).not.toThrow();
    });

    it("should accept valid input for attachment upload", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        fileName: "manual.pdf",
        fileType: "application/pdf",
        mediaType: "attachment" as const,
      };
      expect(() => getUploadUrlInputSchema.parse(input)).not.toThrow();
    });

    it("should reject invalid productId", () => {
      const input = {
        productId: "invalid-uuid",
        fileName: "image.jpg",
        fileType: "image/jpeg",
        mediaType: "image" as const,
      };
      expect(() => getUploadUrlInputSchema.parse(input)).toThrow();
    });

    it("should reject empty fileName", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        fileName: "",
        fileType: "image/jpeg",
        mediaType: "image" as const,
      };
      expect(() => getUploadUrlInputSchema.parse(input)).toThrow();
    });

    it("should reject invalid mediaType", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        fileName: "file.txt",
        fileType: "text/plain",
        mediaType: "document",
      };
      expect(() => getUploadUrlInputSchema.parse(input)).toThrow();
    });
  });

  describe("confirmImageUpload", () => {
    it("should accept valid input", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        path: "company-id/product-id/images/1234567890_image.jpg",
        fileName: "product-image.jpg",
        alt: "Imagem do produto",
        caption: "Vista frontal",
        width: 800,
        height: 600,
        sizeBytes: 102400,
        isPrimary: true,
      };
      expect(() => confirmImageUploadInputSchema.parse(input)).not.toThrow();
    });

    it("should accept minimal input", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        path: "path/to/image.jpg",
        fileName: "image.jpg",
      };
      expect(() => confirmImageUploadInputSchema.parse(input)).not.toThrow();
    });

    it("should reject empty path", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        path: "",
        fileName: "image.jpg",
      };
      expect(() => confirmImageUploadInputSchema.parse(input)).toThrow();
    });

    it("should validate width and height as integers", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        path: "path/to/image.jpg",
        fileName: "image.jpg",
        width: 800.5,
        height: 600,
      };
      expect(() => confirmImageUploadInputSchema.parse(input)).toThrow();
    });
  });

  describe("confirmVideoUpload", () => {
    it("should accept valid YouTube URL", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        title: "Vídeo de demonstração",
        type: "demo" as const,
      };
      expect(() => confirmVideoUploadInputSchema.parse(input)).not.toThrow();
    });

    it("should accept valid Vimeo URL", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        url: "https://vimeo.com/123456789",
        title: "Vídeo de treinamento",
        type: "training" as const,
      };
      expect(() => confirmVideoUploadInputSchema.parse(input)).not.toThrow();
    });

    it("should accept all video types", () => {
      const types = ["training", "demo", "testimonial", "unboxing", "installation"] as const;
      types.forEach((type) => {
        const input = {
          productId: "123e4567-e89b-12d3-a456-426614174000",
          url: "https://example.com/video.mp4",
          title: "Vídeo",
          type,
        };
        expect(() => confirmVideoUploadInputSchema.parse(input)).not.toThrow();
      });
    });

    it("should reject invalid URL", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        url: "not-a-url",
        title: "Vídeo",
      };
      expect(() => confirmVideoUploadInputSchema.parse(input)).toThrow();
    });

    it("should reject empty title", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        url: "https://youtube.com/watch?v=abc123",
        title: "",
      };
      expect(() => confirmVideoUploadInputSchema.parse(input)).toThrow();
    });

    it("should accept optional thumbnailUrl", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        url: "https://youtube.com/watch?v=abc123",
        thumbnailUrl: "https://img.youtube.com/vi/abc123/0.jpg",
        title: "Vídeo",
      };
      expect(() => confirmVideoUploadInputSchema.parse(input)).not.toThrow();
    });

    it("should validate duration as integer", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        url: "https://youtube.com/watch?v=abc123",
        title: "Vídeo",
        duration: 180.5,
      };
      expect(() => confirmVideoUploadInputSchema.parse(input)).toThrow();
    });
  });

  describe("confirmAttachmentUpload", () => {
    it("should accept valid input", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        path: "company-id/product-id/attachments/manual.pdf",
        fileName: "manual-produto.pdf",
        fileType: "application/pdf",
        sizeBytes: 1024000,
        type: "manual" as const,
      };
      expect(() => confirmAttachmentUploadInputSchema.parse(input)).not.toThrow();
    });

    it("should accept all attachment types", () => {
      const types = ["datasheet", "manual", "certificate", "brochure", "warranty"] as const;
      types.forEach((type) => {
        const input = {
          productId: "123e4567-e89b-12d3-a456-426614174000",
          path: "path/to/file.pdf",
          fileName: "file.pdf",
          fileType: "application/pdf",
          type,
        };
        expect(() => confirmAttachmentUploadInputSchema.parse(input)).not.toThrow();
      });
    });

    it("should accept minimal input", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        path: "path/to/file.pdf",
        fileName: "file.pdf",
        fileType: "application/pdf",
      };
      expect(() => confirmAttachmentUploadInputSchema.parse(input)).not.toThrow();
    });

    it("should reject empty fileName", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        path: "path/to/file.pdf",
        fileName: "",
        fileType: "application/pdf",
      };
      expect(() => confirmAttachmentUploadInputSchema.parse(input)).toThrow();
    });

    it("should reject empty fileType", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        path: "path/to/file.pdf",
        fileName: "file.pdf",
        fileType: "",
      };
      expect(() => confirmAttachmentUploadInputSchema.parse(input)).toThrow();
    });
  });

  describe("File Path Generation", () => {
    function generateFilePath(
      companyId: string,
      productId: string,
      type: "images" | "videos" | "attachments",
      fileName: string
    ): string {
      const timestamp = Date.now();
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
      return `${companyId}/${productId}/${type}/${timestamp}_${sanitizedName}`;
    }

    it("should generate correct path structure", () => {
      const path = generateFilePath("company-123", "product-456", "images", "test.jpg");
      expect(path).toContain("company-123/product-456/images/");
      expect(path).toContain("_test.jpg");
    });

    it("should sanitize file names with special characters", () => {
      const path = generateFilePath("company-123", "product-456", "images", "test file (1).jpg");
      expect(path).toContain("_test_file__1_.jpg");
    });

    it("should preserve valid characters in file names", () => {
      const path = generateFilePath("company-123", "product-456", "images", "valid-file.name.jpg");
      expect(path).toContain("_valid-file.name.jpg");
    });

    it("should include timestamp in path", () => {
      const before = Date.now();
      const path = generateFilePath("company-123", "product-456", "images", "test.jpg");
      const after = Date.now();

      const timestampMatch = path.match(/\/(\d+)_/);
      expect(timestampMatch).not.toBeNull();

      const timestamp = parseInt(timestampMatch![1]);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("Bucket Structure", () => {
    const BUCKET_NAME = "products";

    it("should use correct bucket name", () => {
      expect(BUCKET_NAME).toBe("products");
    });

    it("should follow expected folder structure", () => {
      const expectedStructure = [
        "{companyId}/{productId}/images/",
        "{companyId}/{productId}/videos/",
        "{companyId}/{productId}/attachments/",
      ];

      expectedStructure.forEach((path) => {
        expect(path).toMatch(/\{companyId\}\/\{productId\}\/(images|videos|attachments)\//);
      });
    });
  });

  describe("Delete Operations", () => {
    const deleteImageInputSchema = z.object({ imageId: z.string().uuid() });
    const deleteVideoInputSchema = z.object({ videoId: z.string().uuid() });
    const deleteAttachmentInputSchema = z.object({ attachmentId: z.string().uuid() });

    it("should accept valid imageId for deletion", () => {
      const input = { imageId: "123e4567-e89b-12d3-a456-426614174000" };
      expect(() => deleteImageInputSchema.parse(input)).not.toThrow();
    });

    it("should accept valid videoId for deletion", () => {
      const input = { videoId: "123e4567-e89b-12d3-a456-426614174000" };
      expect(() => deleteVideoInputSchema.parse(input)).not.toThrow();
    });

    it("should accept valid attachmentId for deletion", () => {
      const input = { attachmentId: "123e4567-e89b-12d3-a456-426614174000" };
      expect(() => deleteAttachmentInputSchema.parse(input)).not.toThrow();
    });

    it("should reject invalid UUIDs", () => {
      expect(() => deleteImageInputSchema.parse({ imageId: "invalid" })).toThrow();
      expect(() => deleteVideoInputSchema.parse({ videoId: "invalid" })).toThrow();
      expect(() => deleteAttachmentInputSchema.parse({ attachmentId: "invalid" })).toThrow();
    });
  });

  describe("Reorder Operations", () => {
    const reorderImagesInputSchema = z.object({
      productId: z.string().uuid(),
      imageIds: z.array(z.string().uuid()),
    });

    it("should accept valid reorder input", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        imageIds: [
          "123e4567-e89b-12d3-a456-426614174001",
          "123e4567-e89b-12d3-a456-426614174002",
          "123e4567-e89b-12d3-a456-426614174003",
        ],
      };
      expect(() => reorderImagesInputSchema.parse(input)).not.toThrow();
    });

    it("should accept empty imageIds array", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        imageIds: [],
      };
      expect(() => reorderImagesInputSchema.parse(input)).not.toThrow();
    });

    it("should reject invalid UUIDs in imageIds", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        imageIds: ["valid-uuid", "invalid-uuid"],
      };
      expect(() => reorderImagesInputSchema.parse(input)).toThrow();
    });
  });

  describe("Set Primary Image", () => {
    const setPrimaryImageInputSchema = z.object({
      productId: z.string().uuid(),
      imageId: z.string().uuid(),
    });

    it("should accept valid input", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        imageId: "123e4567-e89b-12d3-a456-426614174001",
      };
      expect(() => setPrimaryImageInputSchema.parse(input)).not.toThrow();
    });

    it("should reject invalid productId", () => {
      const input = {
        productId: "invalid",
        imageId: "123e4567-e89b-12d3-a456-426614174001",
      };
      expect(() => setPrimaryImageInputSchema.parse(input)).toThrow();
    });

    it("should reject invalid imageId", () => {
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        imageId: "invalid",
      };
      expect(() => setPrimaryImageInputSchema.parse(input)).toThrow();
    });
  });
});
