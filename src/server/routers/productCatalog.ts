/**
 * Router tRPC para Catálogo de Produtos
 * VIO-885: Modelo de Dados do Catálogo
 */

import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { type Prisma, ProductStatus } from "@prisma/client";

// Helper para gerar slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const productCatalogRouter = createTRPCRouter({
  // ==========================================
  // CATEGORIAS
  // ==========================================

  listCategories: tenantProcedure
    .input(
      z
        .object({
          parentId: z.string().uuid().optional().nullable(),
          includeInactive: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.productCategory.findMany({
        where: {
          ...tenantFilter(ctx.companyId),
          parentId: input?.parentId ?? null,
          ...(input?.includeInactive ? {} : { isActive: true }),
        },
        include: {
          children: {
            where: input?.includeInactive ? {} : { isActive: true },
            orderBy: { order: "asc" },
          },
          _count: { select: { products: true } },
        },
        orderBy: { order: "asc" },
      });
    }),

  getCategory: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.productCategory.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId),
        },
        include: {
          parent: true,
          children: { orderBy: { order: "asc" } },
          products: {
            where: { isPublished: true },
            take: 10,
            orderBy: { name: "asc" },
          },
        },
      });
    }),

  createCategory: tenantProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().url().optional(),
        parentId: z.string().uuid().optional().nullable(),
        order: z.number().int().optional(),
        isActive: z.boolean().optional(),
        isShared: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slug = input.slug || generateSlug(input.name);

      return ctx.prisma.productCategory.create({
        data: {
          name: input.name,
          slug,
          description: input.description,
          imageUrl: input.imageUrl,
          parentId: input.parentId,
          order: input.order ?? 0,
          isActive: input.isActive ?? true,
          isShared: input.isShared ?? false,
          companyId: ctx.companyId,
        },
      });
    }),

  updateCategory: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        slug: z.string().optional(),
        description: z.string().optional().nullable(),
        imageUrl: z.string().url().optional().nullable(),
        parentId: z.string().uuid().optional().nullable(),
        order: z.number().int().optional(),
        isActive: z.boolean().optional(),
        isShared: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      return ctx.prisma.productCategory.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description ?? undefined,
          imageUrl: data.imageUrl ?? undefined,
          parentId: data.parentId,
          order: data.order,
          isActive: data.isActive,
          isShared: data.isShared,
        },
      });
    }),

  deleteCategory: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const productsCount = await ctx.prisma.product.count({
        where: { categoryId: input.id },
      });

      if (productsCount > 0) {
        throw new Error(
          `Não é possível excluir: ${productsCount} produto(s) vinculado(s)`
        );
      }

      const childrenCount = await ctx.prisma.productCategory.count({
        where: { parentId: input.id },
      });

      if (childrenCount > 0) {
        throw new Error(
          `Não é possível excluir: ${childrenCount} subcategoria(s) vinculada(s)`
        );
      }

      return ctx.prisma.productCategory.delete({
        where: { id: input.id },
      });
    }),

  // ==========================================
  // PRODUTOS
  // ==========================================

  listProducts: tenantProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          categoryId: z.string().uuid().optional(),
          status: z.enum(["draft", "active", "inactive", "discontinued"]).optional(),
          isPublished: z.boolean().optional(),
          page: z.number().int().min(1).optional(),
          limit: z.number().int().min(1).max(100).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const where: Prisma.ProductWhereInput = {
        ...tenantFilter(ctx.companyId),
        ...(input?.search && {
          OR: [
            { name: { contains: input.search, mode: "insensitive" as const } },
            { code: { contains: input.search, mode: "insensitive" as const } },
          ],
        }),
        ...(input?.categoryId && { categoryId: input.categoryId }),
        ...(input?.status && { status: input.status }),
        ...(input?.isPublished !== undefined && { isPublished: input.isPublished }),
      };

      const [products, total] = await Promise.all([
        ctx.prisma.product.findMany({
          where,
          include: {
            category: { select: { id: true, name: true, slug: true } },
            material: { select: { id: true, code: true, description: true } },
            images: { where: { isPrimary: true }, take: 1 },
            _count: { select: { images: true, videos: true, attachments: true } },
          },
          orderBy: { updatedAt: "desc" },
          skip,
          take: limit,
        }),
        ctx.prisma.product.count({ where }),
      ]);

      return {
        products,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }),

  getProduct: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.product.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId) },
        include: {
          category: true,
          material: {
            select: {
              id: true,
              code: true,
              description: true,
              unit: true,
              lastPurchasePrice: true,
            },
          },
          images: { orderBy: { order: "asc" } },
          videos: { orderBy: { order: "asc" } },
          attachments: { orderBy: { order: "asc" } },
        },
      });
    }),

  getProductBySlug: tenantProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.product.findFirst({
        where: {
          slug: input.slug,
          ...tenantFilter(ctx.companyId),
          isPublished: true,
        },
        include: {
          category: true,
          images: { orderBy: { order: "asc" } },
          videos: { orderBy: { order: "asc" } },
          attachments: { orderBy: { order: "asc" } },
        },
      });
    }),

  createProduct: tenantProcedure
    .input(
      z.object({
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
        status: z.enum(["draft", "active", "inactive", "discontinued"]).optional(),
        isPublished: z.boolean().optional(),
        featuredOrder: z.number().int().optional(),
        isShared: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slug = input.slug || generateSlug(input.name);

      return ctx.prisma.product.create({
        data: {
          code: input.code,
          name: input.name,
          slug,
          shortDescription: input.shortDescription,
          description: input.description,
          specifications: input.specifications as Prisma.InputJsonValue,
          metaTitle: input.metaTitle,
          metaDescription: input.metaDescription,
          listPrice: input.listPrice,
          salePrice: input.salePrice,
          categoryId: input.categoryId,
          materialId: input.materialId,
          tags: input.tags ?? [],
          status: input.status ?? "draft",
          isPublished: input.isPublished ?? false,
          publishedAt: input.isPublished ? new Date() : null,
          featuredOrder: input.featuredOrder,
          isShared: input.isShared ?? false,
          companyId: ctx.companyId,
        },
      });
    }),

  updateProduct: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        code: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        slug: z.string().optional(),
        shortDescription: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        specifications: z.record(z.string(), z.unknown()).optional().nullable(),
        metaTitle: z.string().optional().nullable(),
        metaDescription: z.string().optional().nullable(),
        listPrice: z.number().optional().nullable(),
        salePrice: z.number().optional().nullable(),
        categoryId: z.string().uuid().optional().nullable(),
        materialId: z.string().uuid().optional().nullable(),
        tags: z.array(z.string()).optional(),
        status: z.enum(["draft", "active", "inactive", "discontinued"]).optional(),
        isPublished: z.boolean().optional(),
        featuredOrder: z.number().int().optional().nullable(),
        isShared: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, specifications, ...rest } = input;

      return ctx.prisma.product.update({
        where: { id },
        data: {
          ...rest,
          specifications: specifications as Prisma.InputJsonValue ?? undefined,
          publishedAt: rest.isPublished ? new Date() : undefined,
        },
      });
    }),

  deleteProduct: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.product.delete({ where: { id: input.id } });
    }),

  publishProduct: tenantProcedure
    .input(z.object({ id: z.string().uuid(), publish: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.product.update({
        where: { id: input.id },
        data: {
          isPublished: input.publish,
          publishedAt: input.publish ? new Date() : null,
          status: input.publish ? "active" : "draft",
        },
      });
    }),

  // ==========================================
  // IMAGENS
  // ==========================================

  addImage: tenantProcedure
    .input(
      z.object({
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.isPrimary) {
        await ctx.prisma.productImage.updateMany({
          where: { productId: input.productId },
          data: { isPrimary: false },
        });
      }

      return ctx.prisma.productImage.create({
        data: {
          productId: input.productId,
          url: input.url,
          thumbnailUrl: input.thumbnailUrl,
          alt: input.alt,
          caption: input.caption,
          order: input.order ?? 0,
          isPrimary: input.isPrimary ?? false,
          width: input.width,
          height: input.height,
          sizeBytes: input.sizeBytes,
        },
      });
    }),

  updateImage: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        alt: z.string().optional().nullable(),
        caption: z.string().optional().nullable(),
        order: z.number().int().optional(),
        isPrimary: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      if (data.isPrimary) {
        const image = await ctx.prisma.productImage.findUnique({ where: { id } });
        if (image) {
          await ctx.prisma.productImage.updateMany({
            where: { productId: image.productId, id: { not: id } },
            data: { isPrimary: false },
          });
        }
      }

      return ctx.prisma.productImage.update({
        where: { id },
        data: {
          alt: data.alt ?? undefined,
          caption: data.caption ?? undefined,
          order: data.order,
          isPrimary: data.isPrimary,
        },
      });
    }),

  deleteImage: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.productImage.delete({ where: { id: input.id } });
    }),

  // ==========================================
  // VÍDEOS
  // ==========================================

  addVideo: tenantProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        url: z.string().url(),
        thumbnailUrl: z.string().url().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(["training", "demo", "testimonial", "unboxing", "installation"]).optional(),
        duration: z.number().int().optional(),
        order: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.productVideo.create({
        data: {
          productId: input.productId,
          url: input.url,
          thumbnailUrl: input.thumbnailUrl,
          title: input.title,
          description: input.description,
          type: input.type ?? "demo",
          duration: input.duration,
          order: input.order ?? 0,
        },
      });
    }),

  updateVideo: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        url: z.string().url().optional(),
        thumbnailUrl: z.string().url().optional().nullable(),
        title: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        type: z.enum(["training", "demo", "testimonial", "unboxing", "installation"]).optional(),
        duration: z.number().int().optional().nullable(),
        order: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      return ctx.prisma.productVideo.update({
        where: { id },
        data: {
          url: data.url,
          thumbnailUrl: data.thumbnailUrl ?? undefined,
          title: data.title,
          description: data.description ?? undefined,
          type: data.type,
          duration: data.duration ?? undefined,
          order: data.order,
        },
      });
    }),

  deleteVideo: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.productVideo.delete({ where: { id: input.id } });
    }),

  // ==========================================
  // ANEXOS
  // ==========================================

  addAttachment: tenantProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        url: z.string().url(),
        fileName: z.string().min(1),
        fileType: z.string().min(1),
        sizeBytes: z.number().int().optional(),
        type: z.enum(["datasheet", "manual", "certificate", "brochure", "warranty"]).optional(),
        order: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.productAttachment.create({
        data: {
          productId: input.productId,
          url: input.url,
          fileName: input.fileName,
          fileType: input.fileType,
          sizeBytes: input.sizeBytes,
          type: input.type ?? "datasheet",
          order: input.order ?? 0,
        },
      });
    }),

  updateAttachment: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        fileName: z.string().min(1).optional(),
        type: z.enum(["datasheet", "manual", "certificate", "brochure", "warranty"]).optional(),
        order: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.productAttachment.update({ where: { id }, data });
    }),

  deleteAttachment: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.productAttachment.delete({ where: { id: input.id } });
    }),

  // ==========================================
  // ESTATÍSTICAS
  // ==========================================

  getStats: tenantProcedure.query(async ({ ctx }) => {
    const filter = tenantFilter(ctx.companyId);

    const [totalProducts, publishedProducts, draftProducts, totalCategories, productsWithImages] =
      await Promise.all([
        ctx.prisma.product.count({ where: filter }),
        ctx.prisma.product.count({ where: { ...filter, isPublished: true } }),
        ctx.prisma.product.count({ where: { ...filter, status: "draft" } }),
        ctx.prisma.productCategory.count({ where: filter }),
        ctx.prisma.product.count({ where: { ...filter, images: { some: {} } } }),
      ]);

    return {
      totalProducts,
      publishedProducts,
      draftProducts,
      totalCategories,
      productsWithImages,
      productsWithoutImages: totalProducts - productsWithImages,
    };
  }),

  // ==========================================
  // SINCRONIZAÇÃO MATERIAL → PRODUCT
  // ==========================================

  // Listar materiais sem produto vinculado
  getMaterialsWithoutProduct: tenantProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          categoryId: z.string().uuid().optional(),
          page: z.number().int().min(1).optional(),
          limit: z.number().int().min(1).max(100).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const where: Prisma.MaterialWhereInput = {
        ...tenantFilter(ctx.companyId),
        catalogProducts: { none: {} },
        status: "ACTIVE",
        ...(input?.search && {
          OR: [
            { description: { contains: input.search, mode: "insensitive" as const } },
            { code: { equals: parseInt(input.search) || -1 } },
          ],
        }),
        ...(input?.categoryId && { categoryId: input.categoryId }),
      };

      const [materials, total] = await Promise.all([
        ctx.prisma.material.findMany({
          where,
          select: {
            id: true,
            code: true,
            description: true,
            unit: true,
            ncm: true,
            weight: true,
            lastPurchasePrice: true,
            category: { select: { id: true, name: true } },
          },
          orderBy: { description: "asc" },
          skip,
          take: limit,
        }),
        ctx.prisma.material.count({ where }),
      ]);

      return {
        materials,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }),

  // Criar produto a partir de material
  syncFromMaterial: tenantProcedure
    .input(
      z.object({
        materialId: z.string().uuid(),
        name: z.string().optional(),
        shortDescription: z.string().optional(),
        categoryId: z.string().uuid().optional(),
        listPrice: z.number().optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const material = await ctx.prisma.material.findFirst({
        where: { id: input.materialId, ...tenantFilter(ctx.companyId) },
      });

      if (!material) {
        throw new Error("Material não encontrado");
      }

      // Verificar se já existe produto vinculado
      const existingProduct = await ctx.prisma.product.findFirst({
        where: { materialId: input.materialId },
      });

      if (existingProduct) {
        throw new Error("Material já possui produto vinculado");
      }

      const name = input.name || material.description;
      const slug = generateSlug(name);

      return ctx.prisma.product.create({
        data: {
          code: `MAT-${material.code}`,
          name,
          slug,
          shortDescription: input.shortDescription || material.description,
          specifications: {
            ncm: material.ncm,
            unit: material.unit,
            weight: material.weight,
            materialCode: material.code,
          } as Prisma.InputJsonValue,
          categoryId: input.categoryId,
          materialId: input.materialId,
          listPrice: input.listPrice,
          status: input.isPublished ? "active" : "draft",
          isPublished: input.isPublished ?? false,
          publishedAt: input.isPublished ? new Date() : null,
          companyId: ctx.companyId,
        },
      });
    }),

  // Sincronizar múltiplos materiais em lote
  syncMultiple: tenantProcedure
    .input(
      z.object({
        materialIds: z.array(z.string().uuid()),
        categoryId: z.string().uuid().optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const materials = await ctx.prisma.material.findMany({
        where: {
          id: { in: input.materialIds },
          ...tenantFilter(ctx.companyId),
          catalogProducts: { none: {} },
        },
      });

      if (materials.length === 0) {
        return { created: 0, skipped: input.materialIds.length };
      }

      const products = materials.map((material) => ({
        code: `MAT-${material.code}`,
        name: material.description,
        slug: generateSlug(material.description) + `-${material.code}`,
        shortDescription: material.description,
        specifications: {
          ncm: material.ncm,
          unit: material.unit,
          weight: material.weight,
          materialCode: material.code,
        } as Prisma.InputJsonValue,
        categoryId: input.categoryId,
        materialId: material.id,
        status: input.isPublished ? ("ACTIVE" as ProductStatus) : ("DRAFT" as ProductStatus),
        isPublished: input.isPublished ?? false,
        publishedAt: input.isPublished ? new Date() : null,
        companyId: ctx.companyId,
      }));

      await ctx.prisma.product.createMany({ data: products });

      return {
        created: materials.length,
        skipped: input.materialIds.length - materials.length,
      };
    }),

  // Vincular produto existente a material
  linkToMaterial: tenantProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        materialId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar se material existe e pertence à empresa
      const material = await ctx.prisma.material.findFirst({
        where: { id: input.materialId, ...tenantFilter(ctx.companyId) },
      });

      if (!material) {
        throw new Error("Material não encontrado");
      }

      // Verificar se produto existe
      const product = await ctx.prisma.product.findFirst({
        where: { id: input.productId, ...tenantFilter(ctx.companyId) },
      });

      if (!product) {
        throw new Error("Produto não encontrado");
      }

      // Verificar se material já está vinculado a outro produto
      const existingLink = await ctx.prisma.product.findFirst({
        where: { materialId: input.materialId },
      });

      if (existingLink && existingLink.id !== input.productId) {
        throw new Error("Material já está vinculado a outro produto");
      }

      return ctx.prisma.product.update({
        where: { id: input.productId },
        data: {
          materialId: input.materialId,
          specifications: {
            ...(product.specifications as Record<string, unknown> || {}),
            ncm: material.ncm,
            unit: material.unit,
            weight: material.weight,
            materialCode: material.code,
          } as Prisma.InputJsonValue,
        },
      });
    }),

  // Desvincular material de produto
  unlinkMaterial: tenantProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.product.update({
        where: { id: input.productId },
        data: { materialId: null },
      });
    }),

  // Obter estatísticas de sincronização
  getSyncStats: tenantProcedure.query(async ({ ctx }) => {
    const filter = tenantFilter(ctx.companyId);

    const [totalMaterials, materialsWithProduct, productsWithMaterial] = await Promise.all([
      ctx.prisma.material.count({ where: { ...filter, status: "ACTIVE" } }),
      ctx.prisma.material.count({
        where: { ...filter, status: "ACTIVE", catalogProducts: { some: {} } },
      }),
      ctx.prisma.product.count({ where: { ...filter, materialId: { not: null } } }),
    ]);

    return {
      totalMaterials,
      materialsWithProduct,
      materialsWithoutProduct: totalMaterials - materialsWithProduct,
      productsWithMaterial,
      syncPercentage: totalMaterials > 0 ? Math.round((materialsWithProduct / totalMaterials) * 100) : 0,
    };
  }),

  // Análise avançada de materiais para sincronização com sugestão de categoria
  analyzeMaterialsForSync: tenantProcedure
    .input(
      z.object({
        markup: z.number().min(0).max(500).default(30),
        limit: z.number().min(1).max(100).default(50),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { markup = 30, limit = 50 } = input || {};
      const filter = tenantFilter(ctx.companyId);

      const materials = await ctx.prisma.material.findMany({
        where: {
          ...filter,
          status: "ACTIVE",
          catalogProducts: { none: {} },
        },
        take: limit,
        orderBy: { description: "asc" },
      });

      const suggestions = materials.map((material) => {
        const ncmChapter = material.ncm?.substring(0, 2) || "";
        const categoryMap: Record<string, string> = {
          "84": "Máquinas e Equipamentos",
          "85": "Equipamentos Elétricos",
          "39": "Plásticos",
          "72": "Ferro e Aço",
          "73": "Obras de Ferro",
          "76": "Alumínio",
          "40": "Borracha",
          "90": "Instrumentos de Precisão",
        };

        const suggestedCategory = categoryMap[ncmChapter] || "Geral";
        const suggestedPrice = (material.lastPurchasePrice || 0) * (1 + markup / 100);

        return {
          id: material.id,
          code: material.code,
          description: material.description,
          ncm: material.ncm,
          unit: material.unit,
          lastPurchasePrice: material.lastPurchasePrice || 0,
          suggestedPrice: Math.round(suggestedPrice * 100) / 100,
          suggestedCategory,
          markup,
        };
      });

      return {
        suggestions,
        total: suggestions.length,
        config: { markup },
      };
    }),
});
