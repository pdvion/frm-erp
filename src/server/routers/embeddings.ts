import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { getOpenAIKey } from "@/server/services/getAIApiKey";
import {
  composeMaterialEmbeddingText,
  generateEmbedding,
  upsertEmbedding,
  deleteEmbedding,
  processEmbeddingsBatch,
  getEmbeddingStatus,
  type MaterialEmbeddingData,
} from "@/lib/ai/embeddings";

export const embeddingsRouter = createTRPCRouter({
  /**
   * Gerar embedding para um material específico
   */
  generateForMaterial: tenantProcedure
    .input(z.object({ materialId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const apiKey = await getOpenAIKey(ctx.prisma, ctx.companyId);
      if (!apiKey) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Token de IA não configurado. Configure em Configurações > IA.",
        });
      }

      const material = await ctx.prisma.material.findFirst({
        where: {
          id: input.materialId,
          OR: [{ companyId: ctx.companyId }, { isShared: true }],
        },
        include: {
          category: { select: { name: true } },
        },
      });

      if (!material) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Material não encontrado" });
      }

      // Buscar subcategoria se existir
      let subCategoryName: string | null = null;
      if (material.subCategoryId) {
        const subCat = await ctx.prisma.category.findUnique({
          where: { id: material.subCategoryId },
          select: { name: true },
        });
        subCategoryName = subCat?.name ?? null;
      }

      const embeddingData: MaterialEmbeddingData = {
        id: material.id,
        code: material.code,
        description: material.description,
        internalCode: material.internalCode,
        ncm: material.ncm,
        unit: material.unit,
        categoryName: material.category?.name,
        subCategoryName,
        manufacturer: material.manufacturer,
        notes: material.notes,
        barcode: material.barcode,
      };

      const content = composeMaterialEmbeddingText(embeddingData);

      const { embedding, tokenCount } = await generateEmbedding(content, apiKey);

      await upsertEmbedding(ctx.prisma, {
        entityType: "material",
        entityId: material.id,
        companyId: ctx.companyId,
        content,
        metadata: {
          code: material.code,
          ncm: material.ncm,
          tokenCount,
        },
      }, embedding);

      return {
        success: true,
        materialId: material.id,
        content,
        tokenCount,
      };
    }),

  /**
   * Gerar embeddings em batch para todos os materiais pendentes
   */
  generateBatch: tenantProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(500).default(100),
        forceRegenerate: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const apiKey = await getOpenAIKey(ctx.prisma, ctx.companyId);
      if (!apiKey) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Token de IA não configurado. Configure em Configurações > IA.",
        });
      }

      // Buscar materiais que ainda não têm embedding
      let materialIds: string[] = [];

      if (!input.forceRegenerate) {
        // Buscar IDs que já têm embedding
        const existingEmbeddings = await ctx.prisma.embedding.findMany({
          where: {
            entityType: "material",
            companyId: ctx.companyId,
          },
          select: { entityId: true },
        });
        materialIds = existingEmbeddings.map((e) => e.entityId);
      }

      const materials = await ctx.prisma.material.findMany({
        where: {
          OR: [{ companyId: ctx.companyId }, { isShared: true }],
          status: "ACTIVE",
          ...(materialIds.length > 0 && !input.forceRegenerate
            ? { id: { notIn: materialIds } }
            : {}),
        },
        include: {
          category: { select: { name: true } },
        },
        take: input.limit,
        orderBy: { code: "asc" },
      });

      if (materials.length === 0) {
        return {
          total: 0,
          success: 0,
          failed: 0,
          errors: [],
          message: "Todos os materiais já possuem embeddings.",
        };
      }

      // Buscar subcategorias em batch
      const subCatIds = [...new Set(materials.map((m) => m.subCategoryId).filter(Boolean))] as string[];
      const subCategories = subCatIds.length > 0
        ? await ctx.prisma.category.findMany({
            where: { id: { in: subCatIds } },
            select: { id: true, name: true },
          })
        : [];
      const subCatMap = new Map(subCategories.map((c) => [c.id, c.name]));

      const embeddingData: MaterialEmbeddingData[] = materials.map((m) => ({
        id: m.id,
        code: m.code,
        description: m.description,
        internalCode: m.internalCode,
        ncm: m.ncm,
        unit: m.unit,
        categoryName: m.category?.name,
        subCategoryName: m.subCategoryId ? subCatMap.get(m.subCategoryId) ?? null : null,
        manufacturer: m.manufacturer,
        notes: m.notes,
        barcode: m.barcode,
      }));

      const result = await processEmbeddingsBatch(
        ctx.prisma,
        embeddingData,
        ctx.companyId,
        apiKey
      );

      return {
        ...result,
        message: `${result.success} de ${result.total} embeddings gerados com sucesso.`,
      };
    }),

  /**
   * Remover embedding de um material
   */
  deleteForMaterial: tenantProcedure
    .input(z.object({ materialId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await deleteEmbedding(ctx.prisma, "material", input.materialId);
      return { success: true };
    }),

  /**
   * Status dos embeddings da empresa
   */
  getStatus: tenantProcedure.query(async ({ ctx }) => {
    return getEmbeddingStatus(ctx.prisma, ctx.companyId);
  }),
});
