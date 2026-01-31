import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import {
  AI_PROVIDERS,
  AI_MODELS,
  getDefaultModel,
  type AIProvider,
} from "@/lib/ai/models";

// Schema para providers
const aiProviderSchema = z.enum(AI_PROVIDERS);

export const aiConfigRouter = createTRPCRouter({
  // Obter configuração de IA
  get: tenantProcedure.query(async ({ ctx }) => {
    const settings = await ctx.prisma.systemSetting.findMany({
      where: {
        category: "ai",
        companyId: ctx.companyId,
      },
    });

    // Converter para objeto
    const config: Record<string, string | boolean> = {};
    for (const setting of settings) {
      const value = setting.value as { value: string | boolean };
      config[setting.key] = value.value;
    }

    const defaultProvider = (config.default_provider as AIProvider) || "openai";

    return {
      openaiToken: config.openai_token ? "***configured***" : "",
      anthropicToken: config.anthropic_token ? "***configured***" : "",
      googleToken: config.google_token ? "***configured***" : "",
      defaultProvider,
      isConfigured: !!(config.openai_token || config.anthropic_token || config.google_token),
      // Modelos selecionados (ou padrão recomendado)
      openaiModel: (config.openai_model as string) || getDefaultModel("openai"),
      anthropicModel: (config.anthropic_model as string) || getDefaultModel("anthropic"),
      googleModel: (config.google_model as string) || getDefaultModel("google"),
      // Configuração de fallback
      enableFallback: config.enable_fallback !== false, // default true
      fallbackProvider: (config.fallback_provider as AIProvider) || undefined,
      // Lista de modelos disponíveis para o frontend
      availableModels: AI_MODELS,
    };
  }),

  // Salvar token de IA
  saveToken: tenantProcedure
    .input(
      z.object({
        provider: aiProviderSchema,
        token: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const key = `${input.provider}_token`;

      // Usar findFirst + create/update para evitar problemas com índice parcial
      const existing = await ctx.prisma.systemSetting.findFirst({
        where: {
          key,
          companyId: ctx.companyId,
        },
      });

      if (existing) {
        await ctx.prisma.systemSetting.update({
          where: { id: existing.id },
          data: {
            value: { value: input.token },
            updatedBy: ctx.tenant.userId,
          },
        });
      } else {
        await ctx.prisma.systemSetting.create({
          data: {
            key,
            value: { value: input.token },
            category: "ai",
            companyId: ctx.companyId,
            description: `Token de API ${input.provider.toUpperCase()}`,
            updatedBy: ctx.tenant.userId,
          },
        });
      }

      return { success: true };
    }),

  // Remover token de IA
  removeToken: tenantProcedure
    .input(
      z.object({
        provider: aiProviderSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const key = `${input.provider}_token`;

      await ctx.prisma.systemSetting.deleteMany({
        where: {
          key,
          companyId: ctx.companyId,
        },
      });

      return { success: true };
    }),

  // Definir provedor padrão
  setDefaultProvider: tenantProcedure
    .input(
      z.object({
        provider: aiProviderSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const key = "default_provider";

      // Usar findFirst + create/update para evitar problemas com índice parcial
      const existing = await ctx.prisma.systemSetting.findFirst({
        where: {
          key,
          companyId: ctx.companyId,
        },
      });

      if (existing) {
        await ctx.prisma.systemSetting.update({
          where: { id: existing.id },
          data: {
            value: { value: input.provider },
            updatedBy: ctx.tenant.userId,
          },
        });
      } else {
        await ctx.prisma.systemSetting.create({
          data: {
            key,
            value: { value: input.provider },
            category: "ai",
            companyId: ctx.companyId,
            description: "Provedor de IA padrão",
            updatedBy: ctx.tenant.userId,
          },
        });
      }

      return { success: true };
    }),

  // Definir modelo padrão por provider
  setDefaultModel: tenantProcedure
    .input(
      z.object({
        provider: aiProviderSchema,
        model: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const key = `${input.provider}_model`;

      // Validar se o modelo existe para o provider
      const providerModels = AI_MODELS[input.provider];
      const modelExists = providerModels.some((m) => m.id === input.model);
      if (!modelExists) {
        throw new Error(`Modelo ${input.model} não é válido para ${input.provider}`);
      }

      // Usar findFirst + create/update para evitar problemas com índice parcial
      const existing = await ctx.prisma.systemSetting.findFirst({
        where: {
          key,
          companyId: ctx.companyId,
        },
      });

      if (existing) {
        await ctx.prisma.systemSetting.update({
          where: { id: existing.id },
          data: {
            value: { value: input.model },
            updatedBy: ctx.tenant.userId,
          },
        });
      } else {
        await ctx.prisma.systemSetting.create({
          data: {
            key,
            value: { value: input.model },
            category: "ai",
            companyId: ctx.companyId,
            description: `Modelo padrão ${input.provider.toUpperCase()}`,
            updatedBy: ctx.tenant.userId,
          },
        });
      }

      return { success: true };
    }),

  // Configurar fallback automático
  setFallbackConfig: tenantProcedure
    .input(
      z.object({
        enableFallback: z.boolean(),
        fallbackProvider: aiProviderSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Salvar enable_fallback
      const enableKey = "enable_fallback";
      const existingEnable = await ctx.prisma.systemSetting.findFirst({
        where: { key: enableKey, companyId: ctx.companyId },
      });

      if (existingEnable) {
        await ctx.prisma.systemSetting.update({
          where: { id: existingEnable.id },
          data: {
            value: { value: input.enableFallback },
            updatedBy: ctx.tenant.userId,
          },
        });
      } else {
        await ctx.prisma.systemSetting.create({
          data: {
            key: enableKey,
            value: { value: input.enableFallback },
            category: "ai",
            companyId: ctx.companyId,
            description: "Habilitar fallback automático de IA",
            updatedBy: ctx.tenant.userId,
          },
        });
      }

      // Salvar fallback_provider (se definido)
      if (input.fallbackProvider) {
        const providerKey = "fallback_provider";
        const existingProvider = await ctx.prisma.systemSetting.findFirst({
          where: { key: providerKey, companyId: ctx.companyId },
        });

        if (existingProvider) {
          await ctx.prisma.systemSetting.update({
            where: { id: existingProvider.id },
            data: {
              value: { value: input.fallbackProvider },
              updatedBy: ctx.tenant.userId,
            },
          });
        } else {
          await ctx.prisma.systemSetting.create({
            data: {
              key: providerKey,
              value: { value: input.fallbackProvider },
              category: "ai",
              companyId: ctx.companyId,
              description: "Provider de fallback preferido",
              updatedBy: ctx.tenant.userId,
            },
          });
        }
      } else {
        // Remover fallback_provider se não definido
        await ctx.prisma.systemSetting.deleteMany({
          where: {
            key: "fallback_provider",
            companyId: ctx.companyId,
          },
        });
      }

      return { success: true };
    }),

  // Validar token (teste de conexão)
  validateToken: tenantProcedure
    .input(
      z.object({
        provider: aiProviderSchema,
        token: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      // Validação básica do formato do token
      if (input.provider === "openai" && !input.token.startsWith("sk-")) {
        return { valid: false, error: "Token OpenAI deve começar com 'sk-'" };
      }
      if (input.provider === "anthropic" && !input.token.startsWith("sk-ant-")) {
        return { valid: false, error: "Token Anthropic deve começar com 'sk-ant-'" };
      }
      if (input.provider === "google" && input.token.length < 20) {
        return { valid: false, error: "Token Google parece inválido" };
      }

      // TODO: Implementar validação real com chamada à API
      return { valid: true };
    }),
});
