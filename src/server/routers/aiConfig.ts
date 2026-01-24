import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";

// Tipos de provedores de IA
const AI_PROVIDERS = ["openai", "anthropic", "google"] as const;

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

    return {
      openaiToken: config.openai_token ? "***configured***" : "",
      anthropicToken: config.anthropic_token ? "***configured***" : "",
      googleToken: config.google_token ? "***configured***" : "",
      defaultProvider: (config.default_provider as string) || "openai",
      isConfigured: !!(config.openai_token || config.anthropic_token || config.google_token),
    };
  }),

  // Salvar token de IA
  saveToken: tenantProcedure
    .input(
      z.object({
        provider: z.enum(AI_PROVIDERS),
        token: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const key = `${input.provider}_token`;

      await ctx.prisma.systemSetting.upsert({
        where: {
          key_companyId: {
            key,
            companyId: ctx.companyId,
          },
        },
        update: {
          value: { value: input.token },
          updatedBy: ctx.tenant.userId,
        },
        create: {
          key,
          value: { value: input.token },
          category: "ai",
          companyId: ctx.companyId,
          description: `Token de API ${input.provider.toUpperCase()}`,
          updatedBy: ctx.tenant.userId,
        },
      });

      return { success: true };
    }),

  // Remover token de IA
  removeToken: tenantProcedure
    .input(
      z.object({
        provider: z.enum(AI_PROVIDERS),
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
        provider: z.enum(AI_PROVIDERS),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.systemSetting.upsert({
        where: {
          key_companyId: {
            key: "default_provider",
            companyId: ctx.companyId,
          },
        },
        update: {
          value: { value: input.provider },
          updatedBy: ctx.tenant.userId,
        },
        create: {
          key: "default_provider",
          value: { value: input.provider },
          category: "ai",
          companyId: ctx.companyId,
          description: "Provedor de IA padrão",
          updatedBy: ctx.tenant.userId,
        },
      });

      return { success: true };
    }),

  // Validar token (teste de conexão)
  validateToken: tenantProcedure
    .input(
      z.object({
        provider: z.enum(AI_PROVIDERS),
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
