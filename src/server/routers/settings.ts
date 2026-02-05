import { z } from "zod";
import { createTRPCRouter, tenantProcedure, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";

// Categorias de configurações
export const SETTING_CATEGORIES = {
  landing: "Landing Page",
  theme: "Tema e Aparência",
  general: "Geral",
  email: "E-mail",
  integrations: "Integrações",
} as const;

export type SettingCategory = keyof typeof SETTING_CATEGORIES;

export const settingsRouter = createTRPCRouter({
  // Buscar configuração por chave
  getByKey: tenantProcedure
    .input(z.object({
      key: z.string(),
      companyId: z.string().uuid().optional(),
    }))
    .query(async ({ input }) => {
      // Primeiro tenta buscar configuração específica da empresa
      if (input.companyId) {
        const companySetting = await prisma.systemSetting.findFirst({
          where: {
            key: input.key,
            companyId: input.companyId,
          },
        });
        if (companySetting) return companySetting;
      }

      // Fallback para configuração global
      const globalSetting = await prisma.systemSetting.findFirst({
        where: {
          key: input.key,
          companyId: null,
        },
      });

      return globalSetting;
    }),

  // Buscar múltiplas configurações por prefixo (ex: "landing.*")
  getByPrefix: tenantProcedure
    .input(z.object({
      prefix: z.string(),
      companyId: z.string().uuid().optional(),
    }))
    .query(async ({ input }) => {
      const settings = await prisma.systemSetting.findMany({
        where: {
          key: { startsWith: input.prefix },
          OR: [
            { companyId: null },
            ...(input.companyId ? [{ companyId: input.companyId }] : []),
          ],
        },
        orderBy: { key: "asc" },
      });

      // Se há configuração específica da empresa, ela tem prioridade
      const settingsMap = new Map<string, typeof settings[0]>();
      
      // Primeiro adiciona globais
      settings
        .filter((s) => s.companyId === null)
        .forEach((s) => settingsMap.set(s.key, s));
      
      // Depois sobrescreve com específicas da empresa
      if (input.companyId) {
        settings
          .filter((s) => s.companyId === input.companyId)
          .forEach((s) => settingsMap.set(s.key, s));
      }

      return Array.from(settingsMap.values());
    }),

  // Buscar todas as configurações de uma categoria
  getByCategory: tenantProcedure
    .input(z.object({
      category: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const settings = await prisma.systemSetting.findMany({
        where: {
          category: input.category,
          OR: [
            { companyId: null },
            { companyId: ctx.companyId },
          ],
        },
        include: {
          updatedByUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { key: "asc" },
      });

      // Priorizar configurações da empresa
      const settingsMap = new Map<string, typeof settings[0]>();
      settings
        .filter((s) => s.companyId === null)
        .forEach((s) => settingsMap.set(s.key, s));
      settings
        .filter((s) => s.companyId === ctx.companyId)
        .forEach((s) => settingsMap.set(s.key, s));

      return Array.from(settingsMap.values());
    }),

  // Atualizar configuração
  update: tenantProcedure
    .input(z.object({
      key: z.string(),
      value: z.unknown(),
      description: z.string().optional(),
      global: z.boolean().default(false), // Se true, atualiza a global; se false, cria/atualiza para a empresa
    }))
    .mutation(async ({ input, ctx }) => {
      const companyId = input.global ? null : ctx.companyId;

      // Verificar se a configuração existe
      const existing = await prisma.systemSetting.findFirst({
        where: {
          key: input.key,
          companyId,
        },
      });

      if (existing) {
        // Atualizar existente
        return prisma.systemSetting.update({
          where: { id: existing.id },
          data: {
            value: input.value as object,
            description: input.description,
            updatedBy: ctx.tenant.userId,
          },
        });
      }

      // Buscar a configuração global para obter categoria
      const globalSetting = await prisma.systemSetting.findFirst({
        where: {
          key: input.key,
          companyId: null,
        },
      });

      if (!globalSetting && !input.global) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Configuração não encontrada. Crie primeiro a configuração global.",
        });
      }

      // Criar nova configuração para a empresa
      return prisma.systemSetting.create({
        data: {
          key: input.key,
          value: input.value as object,
          category: globalSetting?.category ?? "general",
          description: input.description ?? globalSetting?.description,
          companyId,
          updatedBy: ctx.tenant.userId,
        },
      });
    }),

  // Criar nova configuração (apenas global)
  create: tenantProcedure
    .input(z.object({
      key: z.string(),
      value: z.unknown(),
      category: z.string().default("general"),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar se já existe
      const existing = await prisma.systemSetting.findFirst({
        where: {
          key: input.key,
          companyId: null,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Configuração já existe",
        });
      }

      return prisma.systemSetting.create({
        data: {
          key: input.key,
          value: input.value as object,
          category: input.category,
          description: input.description,
          companyId: null,
          updatedBy: ctx.tenant.userId,
        },
      });
    }),

  // Deletar configuração específica da empresa (restaura para global)
  resetToGlobal: tenantProcedure
    .input(z.object({
      key: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      await prisma.systemSetting.deleteMany({
        where: {
          key: input.key,
          companyId: ctx.companyId,
        },
      });

      return { success: true };
    }),

  // Buscar configurações da landing page (público)
  getLandingConfig: publicProcedure
    .input(z.object({
      companyId: z.string().uuid().optional(),
    }).optional())
    .query(async ({ input }) => {
      const settings = await prisma.systemSetting.findMany({
        where: {
          category: "landing",
          OR: [
            { companyId: null },
            ...(input?.companyId ? [{ companyId: input.companyId }] : []),
          ],
        },
      });

      // Montar objeto de configuração
      const config: Record<string, unknown> = {};
      
      // Primeiro adiciona globais
      settings
        .filter((s) => s.companyId === null)
        .forEach((s) => {
          config[s.key] = s.value;
        });
      
      // Depois sobrescreve com específicas
      if (input?.companyId) {
        settings
          .filter((s) => s.companyId === input.companyId)
          .forEach((s) => {
            config[s.key] = s.value;
          });
      }

      return {
        hero: {
          title: config["landing.hero.title"] ?? "Gestão Industrial",
          subtitle: config["landing.hero.subtitle"] ?? "Completa e Moderna",
          description: config["landing.hero.description"] ?? "",
          image: config["landing.hero.image"] ?? null,
        },
        features: config["landing.features"] ?? [],
        trustIndicators: config["landing.trust_indicators"] ?? [],
      };
    }),

  // Listar categorias disponíveis
  listCategories: tenantProcedure.query(() => {
    return Object.entries(SETTING_CATEGORIES).map(([key, label]) => ({
      key,
      label,
    }));
  }),
});
