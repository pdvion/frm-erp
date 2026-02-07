import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, tenantProcedure, sensitiveProcedure } from "../trpc";
import {
  AI_PROVIDERS,
  AI_MODELS,
  getDefaultModel,
  type AIProvider,
} from "@/lib/ai/models";
import {
  AI_TASK_TYPES,
  DEFAULT_TASK_CONFIG,
  getTaskConfigKey,
  type AITaskType,
} from "@/lib/ai/taskConfig";
import { saveSecret, deleteSecret, hasSecret, migrateSecretsFromSystemSettings } from "@/server/services/secrets";

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

  // Salvar token de IA (Vault + systemSettings)
  saveToken: sensitiveProcedure
    .input(
      z.object({
        provider: aiProviderSchema,
        token: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const key = `${input.provider}_token`;

      // 1. Salvar no Vault (criptografado)
      try {
        await saveSecret(ctx.prisma, key, input.token, ctx.companyId, `Token de API ${input.provider.toUpperCase()}`);
      } catch {
        // Vault indisponível — continuar com systemSettings
      }

      // 2. Salvar no systemSettings (fallback legado)
      const existing = await ctx.prisma.systemSetting.findFirst({
        where: { key, companyId: ctx.companyId },
      });

      if (existing) {
        await ctx.prisma.systemSetting.update({
          where: { id: existing.id },
          data: {
            value: { value: input.token },
            updatedBy: ctx.tenant?.userId ?? null,
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
            updatedBy: ctx.tenant?.userId ?? null,
          },
        });
      }

      return { success: true };
    }),

  // Remover token de IA (Vault + systemSettings)
  removeToken: tenantProcedure
    .input(
      z.object({
        provider: aiProviderSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const key = `${input.provider}_token`;

      // 1. Remover do Vault
      try {
        await deleteSecret(ctx.prisma, key, ctx.companyId);
      } catch {
        // Vault indisponível — continuar
      }

      // 2. Remover do systemSettings
      await ctx.prisma.systemSetting.deleteMany({
        where: { key, companyId: ctx.companyId },
      });

      return { success: true };
    }),

  // Migrar tokens do systemSettings para o Vault
  migrateToVault: sensitiveProcedure.mutation(async ({ ctx }) => {
    const secretKeys = ["openai_token", "anthropic_token", "google_token"];
    const result = await migrateSecretsFromSystemSettings(ctx.prisma, ctx.companyId, secretKeys);

    return {
      success: true,
      migrated: result.migrated,
      skipped: result.skipped,
    };
  }),

  // Verificar status do Vault
  vaultStatus: tenantProcedure.query(async ({ ctx }) => {
    const providers: AIProvider[] = ["openai", "anthropic", "google"];
    const status: Record<string, { vault: boolean; legacy: boolean }> = {};

    for (const p of providers) {
      const key = `${p}_token`;
      let inVault = false;
      try {
        inVault = await hasSecret(ctx.prisma, key, ctx.companyId);
      } catch {
        // Vault indisponível
      }

      const inLegacy = !!(await ctx.prisma.systemSetting.findFirst({
        where: { key, companyId: ctx.companyId },
        select: { id: true },
      }));

      status[p] = { vault: inVault, legacy: inLegacy };
    }

    return status;
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
            updatedBy: ctx.tenant?.userId ?? null,
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
            updatedBy: ctx.tenant?.userId ?? null,
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
        throw new TRPCError({ code: "BAD_REQUEST", message: `Modelo ${input.model} não é válido para ${input.provider}` });
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
            updatedBy: ctx.tenant?.userId ?? null,
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
            updatedBy: ctx.tenant?.userId ?? null,
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
            updatedBy: ctx.tenant?.userId ?? null,
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
            updatedBy: ctx.tenant?.userId ?? null,
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
              updatedBy: ctx.tenant?.userId ?? null,
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
              updatedBy: ctx.tenant?.userId ?? null,
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

  // ==========================================
  // CONFIGURAÇÃO POR TIPO DE TAREFA
  // ==========================================

  // Listar tipos de tarefa disponíveis
  listTaskTypes: tenantProcedure.query(() => {
    return Object.entries(AI_TASK_TYPES).map(([key, value]) => ({
      taskId: key as AITaskType,
      label: value.label,
      description: value.description,
      defaultConfig: DEFAULT_TASK_CONFIG[key as AITaskType],
    }));
  }),

  // Obter configuração de todas as tarefas
  getTaskConfigs: tenantProcedure.query(async ({ ctx }) => {
    const settings = await ctx.prisma.systemSetting.findMany({
      where: {
        category: "ai",
        companyId: ctx.companyId,
        key: { startsWith: "ai_task_" },
      },
    });

    const configs: Record<string, { provider: string; model: string; temperature?: number }> = {};

    for (const setting of settings) {
      const taskKey = setting.key.replace("ai_task_", "").toUpperCase();
      const value = setting.value as { provider?: string; model?: string; temperature?: number };
      if (value.provider) {
        configs[taskKey] = {
          provider: value.provider,
          model: value.model || "",
          temperature: value.temperature,
        };
      }
    }

    return configs;
  }),

  // Obter configuração para uma tarefa específica
  getTaskConfig: tenantProcedure
    .input(z.object({ task: z.string() }))
    .query(async ({ ctx, input }) => {
      const taskType = input.task as AITaskType;
      const key = getTaskConfigKey(taskType);

      const setting = await ctx.prisma.systemSetting.findFirst({
        where: {
          category: "ai",
          key,
          companyId: ctx.companyId,
        },
      });

      if (setting) {
        const value = setting.value as { provider: string; model: string; temperature?: number };
        return {
          isCustom: true,
          provider: value.provider,
          model: value.model,
          temperature: value.temperature,
        };
      }

      const defaultConfig = DEFAULT_TASK_CONFIG[taskType];
      return {
        isCustom: false,
        provider: defaultConfig?.preferredProvider || "openai",
        model: defaultConfig?.preferredModel || "gpt-4o-mini",
        temperature: defaultConfig?.temperature || 0.5,
        reason: defaultConfig?.reason,
      };
    }),

  // Salvar configuração para uma tarefa
  setTaskConfig: tenantProcedure
    .input(
      z.object({
        task: z.string(),
        provider: z.enum([...AI_PROVIDERS, "auto"]),
        model: z.string().optional(),
        temperature: z.number().min(0).max(2).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const taskType = input.task as AITaskType;
      const key = getTaskConfigKey(taskType);

      if (input.provider === "auto") {
        // Remover configuração customizada, usar padrão
        await ctx.prisma.systemSetting.deleteMany({
          where: {
            key,
            companyId: ctx.companyId,
          },
        });
        return { success: true, isCustom: false };
      }

      // Salvar configuração customizada
      const existing = await ctx.prisma.systemSetting.findFirst({
        where: { key, companyId: ctx.companyId },
      });

      const value = {
        provider: input.provider,
        model: input.model || "",
        temperature: input.temperature,
      };

      if (existing) {
        await ctx.prisma.systemSetting.update({
          where: { id: existing.id },
          data: { value },
        });
      } else {
        await ctx.prisma.systemSetting.create({
          data: {
            key,
            value,
            category: "ai",
            companyId: ctx.companyId,
          },
        });
      }

      return { success: true, isCustom: true };
    }),

  // Resetar todas as configurações de tarefas para padrão
  resetTaskConfigs: tenantProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.systemSetting.deleteMany({
      where: {
        category: "ai",
        companyId: ctx.companyId,
        key: { startsWith: "ai_task_" },
      },
    });

    return { success: true };
  }),
});
