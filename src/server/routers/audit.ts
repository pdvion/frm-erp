import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";

export const auditRouter = createTRPCRouter({
  // Listar logs de auditoria
  list: tenantProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        action: z.enum(["CREATE", "UPDATE", "DELETE", "VIEW", "LOGIN", "LOGOUT", "EXPORT", "IMPORT"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { 
        userId, 
        entityType, 
        entityId, 
        action, 
        startDate, 
        endDate, 
        search,
        page = 1, 
        limit = 50 
      } = input ?? {};

      const where = {
        companyId: ctx.companyId,
        ...(userId && { userId }),
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
        ...(action && { action }),
        ...(startDate && endDate && {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }),
        ...(search && {
          OR: [
            { description: { contains: search, mode: "insensitive" as const } },
            { entityCode: { contains: search, mode: "insensitive" as const } },
            { userName: { contains: search, mode: "insensitive" as const } },
            { userEmail: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [logs, total] = await Promise.all([
        ctx.prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.auditLog.count({ where }),
      ]);

      return {
        logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Buscar log por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.auditLog.findFirst({
        where: { 
          id: input.id,
          companyId: ctx.companyId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }),

  // Estatísticas de auditoria
  stats: tenantProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input ?? {};
      
      const dateFilter = startDate && endDate ? {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      } : {};

      const [
        totalLogs,
        byAction,
        byEntityType,
        byUser,
      ] = await Promise.all([
        ctx.prisma.auditLog.count({
          where: { companyId: ctx.companyId, ...dateFilter },
        }),
        ctx.prisma.auditLog.groupBy({
          by: ["action"],
          where: { companyId: ctx.companyId, ...dateFilter },
          _count: true,
        }),
        ctx.prisma.auditLog.groupBy({
          by: ["entityType"],
          where: { companyId: ctx.companyId, ...dateFilter },
          _count: true,
        }),
        ctx.prisma.auditLog.groupBy({
          by: ["userId", "userName"],
          where: { companyId: ctx.companyId, ...dateFilter },
          _count: true,
          orderBy: { _count: { userId: "desc" } },
          take: 10,
        }),
      ]);

      return {
        totalLogs,
        byAction: byAction.map(item => ({
          action: item.action,
          count: item._count,
        })),
        byEntityType: byEntityType.map(item => ({
          entityType: item.entityType,
          count: item._count,
        })),
        topUsers: byUser.map(item => ({
          userId: item.userId,
          userName: item.userName,
          count: item._count,
        })),
      };
    }),

  // Histórico de uma entidade específica
  entityHistory: tenantProcedure
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.auditLog.findMany({
        where: {
          companyId: ctx.companyId,
          entityType: input.entityType,
          entityId: input.entityId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),
});
