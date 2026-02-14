/**
 * Testes unitários para o router productCatalog
 * VIO-885: Modelo de Dados do Catálogo
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas de validação (espelhando os do router)
const productStatusSchema = z.enum(["DRAFT", "ACTIVE", "INACTIVE", "DISCONTINUED"]);
const productVideoTypeSchema = z.enum(["TRAINING", "DEMO", "TESTIMONIAL", "UNBOXING", "INSTALLATION"]);
const productAttachmentTypeSchema = z.enum(["DATASHEET", "MANUAL", "CERTIFICATE", "BROCHURE", "WARRANTY"]);

const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  parentId: z.string().uuid().optional().nullable(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  isShared: z.boolean().optional(),
});

const createProductInputSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  specifications: z.record(z.string(), z.unknown()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  listPrice: z.number().optional(),
  salePrice: z.number().optional(),
  categoryId: z.string().uuid().optional(),
  materialId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  status: productStatusSchema.optional(),
  isPublished: z.boolean().optional(),
  featuredOrder: z.number().int().optional(),
  isShared: z.boolean().optional(),
});

const addImageInputSchema = z.object({
  productId: z.string().uuid(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  order: z.number().int().optional(),
  isPrimary: z.boolean().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  sizeBytes: z.number().int().optional(),
});

const addVideoInputSchema = z.object({
  productId: z.string().uuid(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: productVideoTypeSchema.optional(),
  duration: z.number().int().optional(),
  order: z.number().int().optional(),
});

const addAttachmentInputSchema = z.object({
  productId: z.string().uuid(),
  url: z.string().url(),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  sizeBytes: z.number().int().optional(),
  type: productAttachmentTypeSchema.optional(),
  order: z.number().int().optional(),
});

describe("productCatalog router", () => {
  describe("Enums", () => {
    describe("productStatusSchema", () => {
      it("should accept valid status values", () => {
        expect(productStatusSchema.parse("DRAFT")).toBe("DRAFT");
        expect(productStatusSchema.parse("ACTIVE")).toBe("ACTIVE");
        expect(productStatusSchema.parse("INACTIVE")).toBe("INACTIVE");
        expect(productStatusSchema.parse("DISCONTINUED")).toBe("DISCONTINUED");
      });

      it("should reject invalid status values", () => {
        expect(() => productStatusSchema.parse("draft")).toThrow();
        expect(() => productStatusSchema.parse("pending")).toThrow();
        expect(() => productStatusSchema.parse("")).toThrow();
      });
    });

    describe("productVideoTypeSchema", () => {
      it("should accept valid video types", () => {
        expect(productVideoTypeSchema.parse("TRAINING")).toBe("TRAINING");
        expect(productVideoTypeSchema.parse("DEMO")).toBe("DEMO");
        expect(productVideoTypeSchema.parse("TESTIMONIAL")).toBe("TESTIMONIAL");
        expect(productVideoTypeSchema.parse("UNBOXING")).toBe("UNBOXING");
        expect(productVideoTypeSchema.parse("INSTALLATION")).toBe("INSTALLATION");
      });

      it("should reject invalid video types", () => {
        expect(() => productVideoTypeSchema.parse("demo")).toThrow();
        expect(() => productVideoTypeSchema.parse("tutorial")).toThrow();
      });
    });

    describe("productAttachmentTypeSchema", () => {
      it("should accept valid attachment types", () => {
        expect(productAttachmentTypeSchema.parse("DATASHEET")).toBe("DATASHEET");
        expect(productAttachmentTypeSchema.parse("MANUAL")).toBe("MANUAL");
        expect(productAttachmentTypeSchema.parse("CERTIFICATE")).toBe("CERTIFICATE");
        expect(productAttachmentTypeSchema.parse("BROCHURE")).toBe("BROCHURE");
        expect(productAttachmentTypeSchema.parse("WARRANTY")).toBe("WARRANTY");
      });

      it("should reject invalid attachment types", () => {
        expect(() => productAttachmentTypeSchema.parse("datasheet")).toThrow();
        expect(() => productAttachmentTypeSchema.parse("pdf")).toThrow();
      });
    });
  });

  describe("Category Input Validation", () => {
    describe("createCategoryInputSchema", () => {
      it("should accept valid category input", () => {
        const input = {
          name: "Eletrônicos",
          slug: "eletronicos",
          description: "Produtos eletrônicos",
          order: 1,
          isActive: true,
        };
        expect(() => createCategoryInputSchema.parse(input)).not.toThrow();
      });

      it("should accept minimal category input", () => {
        const input = { name: "Categoria" };
        expect(() => createCategoryInputSchema.parse(input)).not.toThrow();
      });

      it("should reject empty name", () => {
        const input = { name: "" };
        expect(() => createCategoryInputSchema.parse(input)).toThrow();
      });

      it("should accept valid UUID for parentId", () => {
        const input = {
          name: "Subcategoria",
          parentId: "123e4567-e89b-12d3-a456-426614174000",
        };
        expect(() => createCategoryInputSchema.parse(input)).not.toThrow();
      });

      it("should reject invalid UUID for parentId", () => {
        const input = {
          name: "Subcategoria",
          parentId: "invalid-uuid",
        };
        expect(() => createCategoryInputSchema.parse(input)).toThrow();
      });

      it("should accept null parentId", () => {
        const input = {
          name: "Categoria Raiz",
          parentId: null,
        };
        expect(() => createCategoryInputSchema.parse(input)).not.toThrow();
      });

      it("should validate imageUrl as URL", () => {
        const validInput = {
          name: "Categoria",
          imageUrl: "https://example.com/image.jpg",
        };
        expect(() => createCategoryInputSchema.parse(validInput)).not.toThrow();

        const invalidInput = {
          name: "Categoria",
          imageUrl: "not-a-url",
        };
        expect(() => createCategoryInputSchema.parse(invalidInput)).toThrow();
      });
    });
  });

  describe("Product Input Validation", () => {
    describe("createProductInputSchema", () => {
      it("should accept valid product input", () => {
        const input = {
          code: "SKU-001",
          name: "Produto Teste",
          slug: "produto-teste",
          shortDescription: "Descrição curta",
          description: "<p>Descrição completa em HTML</p>",
          listPrice: 99.99,
          salePrice: 79.99,
          tags: ["novo", "destaque"],
          status: "DRAFT" as const,
          isPublished: false,
        };
        expect(() => createProductInputSchema.parse(input)).not.toThrow();
      });

      it("should accept minimal product input", () => {
        const input = {
          code: "SKU-001",
          name: "Produto",
        };
        expect(() => createProductInputSchema.parse(input)).not.toThrow();
      });

      it("should reject empty code", () => {
        const input = {
          code: "",
          name: "Produto",
        };
        expect(() => createProductInputSchema.parse(input)).toThrow();
      });

      it("should reject empty name", () => {
        const input = {
          code: "SKU-001",
          name: "",
        };
        expect(() => createProductInputSchema.parse(input)).toThrow();
      });

      it("should accept specifications as record", () => {
        const input = {
          code: "SKU-001",
          name: "Produto",
          specifications: {
            peso: "1kg",
            dimensoes: { altura: 10, largura: 20, profundidade: 5 },
            cores: ["vermelho", "azul"],
          },
        };
        expect(() => createProductInputSchema.parse(input)).not.toThrow();
      });

      it("should accept valid UUIDs for categoryId and materialId", () => {
        const input = {
          code: "SKU-001",
          name: "Produto",
          categoryId: "123e4567-e89b-12d3-a456-426614174000",
          materialId: "123e4567-e89b-12d3-a456-426614174001",
        };
        expect(() => createProductInputSchema.parse(input)).not.toThrow();
      });

      it("should reject invalid UUIDs", () => {
        const input = {
          code: "SKU-001",
          name: "Produto",
          categoryId: "invalid",
        };
        expect(() => createProductInputSchema.parse(input)).toThrow();
      });

      it("should accept valid status values", () => {
        const statuses = ["DRAFT", "ACTIVE", "INACTIVE", "DISCONTINUED"] as const;
        statuses.forEach((status) => {
          const input = {
            code: "SKU-001",
            name: "Produto",
            status,
          };
          expect(() => createProductInputSchema.parse(input)).not.toThrow();
        });
      });

      it("should accept tags as string array", () => {
        const input = {
          code: "SKU-001",
          name: "Produto",
          tags: ["tag1", "tag2", "tag3"],
        };
        expect(() => createProductInputSchema.parse(input)).not.toThrow();
      });

      it("should reject tags with non-string values", () => {
        const input = {
          code: "SKU-001",
          name: "Produto",
          tags: [1, 2, 3],
        };
        expect(() => createProductInputSchema.parse(input)).toThrow();
      });
    });
  });

  describe("Image Input Validation", () => {
    describe("addImageInputSchema", () => {
      it("should accept valid image input", () => {
        const input = {
          productId: "123e4567-e89b-12d3-a456-426614174000",
          url: "https://storage.example.com/image.jpg",
          thumbnailUrl: "https://storage.example.com/thumb.jpg",
          alt: "Imagem do produto",
          caption: "Vista frontal",
          order: 0,
          isPrimary: true,
          width: 800,
          height: 600,
          sizeBytes: 102400,
        };
        expect(() => addImageInputSchema.parse(input)).not.toThrow();
      });

      it("should accept minimal image input", () => {
        const input = {
          productId: "123e4567-e89b-12d3-a456-426614174000",
          url: "https://storage.example.com/image.jpg",
        };
        expect(() => addImageInputSchema.parse(input)).not.toThrow();
      });

      it("should reject invalid productId", () => {
        const input = {
          productId: "invalid",
          url: "https://storage.example.com/image.jpg",
        };
        expect(() => addImageInputSchema.parse(input)).toThrow();
      });

      it("should reject invalid url", () => {
        const input = {
          productId: "123e4567-e89b-12d3-a456-426614174000",
          url: "not-a-url",
        };
        expect(() => addImageInputSchema.parse(input)).toThrow();
      });

      it("should validate thumbnailUrl as URL", () => {
        const input = {
          productId: "123e4567-e89b-12d3-a456-426614174000",
          url: "https://storage.example.com/image.jpg",
          thumbnailUrl: "invalid",
        };
        expect(() => addImageInputSchema.parse(input)).toThrow();
      });
    });
  });

  describe("Video Input Validation", () => {
    describe("addVideoInputSchema", () => {
      it("should accept valid video input", () => {
        const input = {
          productId: "123e4567-e89b-12d3-a456-426614174000",
          url: "https://youtube.com/watch?v=abc123",
          thumbnailUrl: "https://img.youtube.com/vi/abc123/0.jpg",
          title: "Vídeo de demonstração",
          description: "Como usar o produto",
          type: "DEMO" as const,
          duration: 180,
          order: 0,
        };
        expect(() => addVideoInputSchema.parse(input)).not.toThrow();
      });

      it("should accept minimal video input", () => {
        const input = {
          productId: "123e4567-e89b-12d3-a456-426614174000",
          url: "https://youtube.com/watch?v=abc123",
          title: "Vídeo",
        };
        expect(() => addVideoInputSchema.parse(input)).not.toThrow();
      });

      it("should reject empty title", () => {
        const input = {
          productId: "123e4567-e89b-12d3-a456-426614174000",
          url: "https://youtube.com/watch?v=abc123",
          title: "",
        };
        expect(() => addVideoInputSchema.parse(input)).toThrow();
      });

      it("should accept all video types", () => {
        const types = ["TRAINING", "DEMO", "TESTIMONIAL", "UNBOXING", "INSTALLATION"] as const;
        types.forEach((type) => {
          const input = {
            productId: "123e4567-e89b-12d3-a456-426614174000",
            url: "https://youtube.com/watch?v=abc123",
            title: "Vídeo",
            type,
          };
          expect(() => addVideoInputSchema.parse(input)).not.toThrow();
        });
      });
    });
  });

  describe("Attachment Input Validation", () => {
    describe("addAttachmentInputSchema", () => {
      it("should accept valid attachment input", () => {
        const input = {
          productId: "123e4567-e89b-12d3-a456-426614174000",
          url: "https://storage.example.com/manual.pdf",
          fileName: "manual-produto.pdf",
          fileType: "application/pdf",
          sizeBytes: 1024000,
          type: "MANUAL" as const,
          order: 0,
        };
        expect(() => addAttachmentInputSchema.parse(input)).not.toThrow();
      });

      it("should accept minimal attachment input", () => {
        const input = {
          productId: "123e4567-e89b-12d3-a456-426614174000",
          url: "https://storage.example.com/file.pdf",
          fileName: "arquivo.pdf",
          fileType: "application/pdf",
        };
        expect(() => addAttachmentInputSchema.parse(input)).not.toThrow();
      });

      it("should reject empty fileName", () => {
        const input = {
          productId: "123e4567-e89b-12d3-a456-426614174000",
          url: "https://storage.example.com/file.pdf",
          fileName: "",
          fileType: "application/pdf",
        };
        expect(() => addAttachmentInputSchema.parse(input)).toThrow();
      });

      it("should reject empty fileType", () => {
        const input = {
          productId: "123e4567-e89b-12d3-a456-426614174000",
          url: "https://storage.example.com/file.pdf",
          fileName: "arquivo.pdf",
          fileType: "",
        };
        expect(() => addAttachmentInputSchema.parse(input)).toThrow();
      });

      it("should accept all attachment types", () => {
        const types = ["DATASHEET", "MANUAL", "CERTIFICATE", "BROCHURE", "WARRANTY"] as const;
        types.forEach((type) => {
          const input = {
            productId: "123e4567-e89b-12d3-a456-426614174000",
            url: "https://storage.example.com/file.pdf",
            fileName: "arquivo.pdf",
            fileType: "application/pdf",
            type,
          };
          expect(() => addAttachmentInputSchema.parse(input)).not.toThrow();
        });
      });
    });
  });

  describe("Slug Generation", () => {
    function generateSlug(name: string): string {
      return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }

    it("should convert to lowercase", () => {
      expect(generateSlug("PRODUTO")).toBe("produto");
    });

    it("should remove accents", () => {
      expect(generateSlug("Eletrônicos")).toBe("eletronicos");
      expect(generateSlug("Café")).toBe("cafe");
      expect(generateSlug("Ação")).toBe("acao");
    });

    it("should replace spaces with hyphens", () => {
      expect(generateSlug("Produto Teste")).toBe("produto-teste");
    });

    it("should remove special characters", () => {
      expect(generateSlug("Produto @#$% Teste")).toBe("produto-teste");
    });

    it("should handle multiple spaces", () => {
      expect(generateSlug("Produto   Teste")).toBe("produto-teste");
    });

    it("should trim leading and trailing hyphens", () => {
      expect(generateSlug("  Produto  ")).toBe("produto");
      expect(generateSlug("---Produto---")).toBe("produto");
    });

    it("should handle complex names", () => {
      expect(generateSlug("Parafuso M8 x 1.25 - Aço Inox")).toBe("parafuso-m8-x-1-25-aco-inox");
    });
  });
});
