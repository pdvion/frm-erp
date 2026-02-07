import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import {
  classifyByTextSimilarity,
  classifyWithAI,
  type ClassificationResult,
} from "@/lib/ai/classifier";
import { getOpenAIKey } from "@/server/services/getAIApiKey";

export const aiClassifierRouter = createTRPCRouter({
  /**
   * Classificar item de NFe para encontrar material correspondente
   */
  classifyNfeItem: tenantProcedure
    .input(
      z.object({
        nfeItemDescription: z.string().min(1),
        supplierId: z.string().optional(),
        useAI: z.boolean().default(true),
        limit: z.number().min(1).max(10).default(5),
      })
    )
    .mutation(async ({ ctx, input }): Promise<ClassificationResult & { costCenterSuggestion?: string }> => {
      // Buscar materiais do tenant
      const materials = await ctx.prisma.material.findMany({
        where: {
          OR: [
            { companyId: ctx.companyId },
            { isShared: true },
          ],
          status: "ACTIVE",
        },
        select: {
          id: true,
          code: true,
          description: true,
          category: { select: { name: true } },
          ncm: true,
        },
        take: 500, // Limitar para performance
      });

      const materialData = materials.map((m) => ({
        id: m.id,
        code: m.code,
        description: m.description,
        category: m.category?.name,
        ncm: m.ncm ?? undefined,
      }));

      let result: ClassificationResult;

      if (input.useAI) {
        const apiKey = await getOpenAIKey(ctx.prisma, ctx.companyId);

        if (apiKey) {
          result = await classifyWithAI(
            input.nfeItemDescription,
            materialData,
            apiKey,
            input.limit
          );
        } else {
          // Fallback para similaridade de texto
          result = classifyByTextSimilarity(
            input.nfeItemDescription,
            materialData,
            input.limit
          );
        }
      } else {
        result = classifyByTextSimilarity(
          input.nfeItemDescription,
          materialData,
          input.limit
        );
      }

      // Se tiver sugestão de material e fornecedor, buscar sugestão de centro de custo
      let costCenterSuggestion: string | undefined;
      if (result.suggestions.length > 0 && input.supplierId) {
        // Buscar histórico de compras via material (que tem costCenterFrm)
        const materials = await ctx.prisma.material.findMany({
          where: {
            id: { in: result.suggestions.map((s) => s.id) },
            costCenterFrm: { not: null },
          },
          select: {
            id: true,
            costCenterFrm: true,
          },
          take: 10,
        });

        // Usar o centro de custo do material mais provável
        const topMaterial = materials.find((m) => m.id === result.suggestions[0]?.id);
        if (topMaterial?.costCenterFrm) {
          costCenterSuggestion = topMaterial.costCenterFrm;
        }
      }

      return {
        ...result,
        costCenterSuggestion,
      };
    }),

  /**
   * Registrar feedback do usuário sobre classificação
   * Usado para melhorar o modelo ao longo do tempo
   */
  registerFeedback: tenantProcedure
    .input(
      z.object({
        nfeItemDescription: z.string(),
        suggestedMaterialId: z.string(),
        selectedMaterialId: z.string(),
        wasCorrect: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Registrar feedback para aprendizado futuro
      await ctx.prisma.systemLog.create({
        data: {
          level: "info",
          source: "ai_classifier",
          message: input.wasCorrect
            ? "Classificação aceita"
            : "Classificação corrigida",
          context: {
            nfeItemDescription: input.nfeItemDescription,
            suggestedMaterialId: input.suggestedMaterialId,
            selectedMaterialId: input.selectedMaterialId,
            wasCorrect: input.wasCorrect,
          },
          companyId: ctx.companyId,
          userId: ctx.tenant.userId,
        },
      });

      return { success: true };
    }),

  /**
   * Obter estatísticas de classificação
   */
  getStats: tenantProcedure.query(async ({ ctx }) => {
    const logs = await ctx.prisma.systemLog.findMany({
      where: {
        source: "ai_classifier",
        companyId: ctx.companyId,
      },
      select: {
        context: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    let total = 0;
    let correct = 0;

    for (const log of logs) {
      const context = log.context as { wasCorrect?: boolean } | null;
      if (context?.wasCorrect !== undefined) {
        total++;
        if (context.wasCorrect) correct++;
      }
    }

    return {
      totalClassifications: total,
      correctClassifications: correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      lastClassificationDate: logs[0]?.createdAt ?? null,
    };
  }),
});
