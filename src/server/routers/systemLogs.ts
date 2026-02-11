import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";

import { TRPCError } from "@trpc/server";

export const systemLogsRouter = createTRPCRouter({
  // Listar logs (admin)
  list: tenantProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(50),
      level: z.enum(["debug", "info", "warn", "error", "fatal"]).optional(),
      source: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      // Verificar permissão de admin
      const hasPermission = ctx.tenant.permissions.get("SETTINGS")?.level === "FULL";
      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para visualizar logs do sistema",
        });
      }

      const { page = 1, limit = 50, level, source, startDate, endDate } = input || {};

      const where = {
        ...(level && { level }),
        ...(source && { source: { contains: source } }),
        ...(startDate && { createdAt: { gte: new Date(startDate) } }),
        ...(endDate && { createdAt: { lte: new Date(endDate) } }),
      };

      const [logs, total] = await Promise.all([
        ctx.prisma.systemLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            user: { select: { id: true, name: true, email: true } },
            company: { select: { id: true, name: true } },
          },
        }),
        ctx.prisma.systemLog.count({ where }),
      ]);

      return {
        logs,
        total,
        pages: Math.ceil(total / limit),
        page,
      };
    }),

  // Obter log por ID
  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const hasPermission = ctx.tenant.permissions.get("SETTINGS")?.level === "FULL";
      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para visualizar logs do sistema",
        });
      }

      return ctx.prisma.systemLog.findUnique({
        where: { id: input.id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          company: { select: { id: true, name: true } },
        },
      });
    }),

  // Estatísticas de logs
  stats: tenantProcedure
    .input(z.object({
      days: z.number().default(7),
    }).optional())
    .query(async ({ input, ctx }) => {
      const hasPermission = ctx.tenant.permissions.get("SETTINGS")?.level === "FULL";
      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para visualizar logs do sistema",
        });
      }

      const days = input?.days || 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [byLevel, bySource, total, recentErrors] = await Promise.all([
        // Contagem por nível
        ctx.prisma.systemLog.groupBy({
          by: ["level"],
          where: { createdAt: { gte: startDate } },
          _count: true,
        }),
        // Top 10 fontes com mais logs
        ctx.prisma.systemLog.groupBy({
          by: ["source"],
          where: { createdAt: { gte: startDate }, source: { not: null } },
          _count: true,
          orderBy: { _count: { source: "desc" } },
          take: 10,
        }),
        // Total no período
        ctx.prisma.systemLog.count({
          where: { createdAt: { gte: startDate } },
        }),
        // Últimos erros
        ctx.prisma.systemLog.findMany({
          where: {
            level: { in: ["error", "fatal"] },
            createdAt: { gte: startDate },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            level: true,
            message: true,
            source: true,
            createdAt: true,
          },
        }),
      ]);

      return {
        period: { days, startDate, endDate: new Date() },
        total,
        byLevel: byLevel.reduce((acc, item) => {
          acc[item.level] = item._count;
          return acc;
        }, {} as Record<string, number>),
        bySource: bySource.map((item) => ({
          source: item.source,
          count: item._count,
        })),
        recentErrors,
      };
    }),

  // Listar fontes disponíveis
  sources: tenantProcedure.query(async ({ ctx }) => {
    const hasPermission = ctx.tenant.permissions.get("SETTINGS")?.level === "FULL";
    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Sem permissão para visualizar logs do sistema",
      });
    }

    const sources = await ctx.prisma.systemLog.findMany({
      where: { source: { not: null } },
      select: { source: true },
      distinct: ["source"],
    });

    return sources.map((s) => s.source).filter((s): s is string => s !== null);
  }),

  // Limpar logs antigos (admin)
  cleanup: tenantProcedure
    .input(z.object({ daysOld: z.number().default(30) }))
    .mutation(async ({ input, ctx }) => {
      const hasPermission = ctx.tenant.permissions.get("SETTINGS")?.level === "FULL";
      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para limpar logs do sistema",
        });
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - input.daysOld);

      // Manter erros por mais tempo
      const errorCutoffDate = new Date();
      errorCutoffDate.setDate(errorCutoffDate.getDate() - 90);

      const [deletedNormal, deletedErrors] = await Promise.all([
        ctx.prisma.systemLog.deleteMany({
          where: {
            createdAt: { lt: cutoffDate },
            level: { notIn: ["error", "fatal"] },
          },
        }),
        ctx.prisma.systemLog.deleteMany({
          where: {
            createdAt: { lt: errorCutoffDate },
            level: { in: ["error", "fatal"] },
          },
        }),
      ]);

      return {
        deleted: deletedNormal.count + deletedErrors.count,
        deletedNormal: deletedNormal.count,
        deletedErrors: deletedErrors.count,
      };
    }),
});
