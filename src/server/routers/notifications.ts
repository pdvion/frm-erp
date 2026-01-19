import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { notificationService } from "../services/notifications";

export const notificationsRouter = createTRPCRouter({
  // Listar notificações do usuário
  list: tenantProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      category: z.enum(["system", "business", "error"]).optional(),
      unreadOnly: z.boolean().default(false),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { page = 1, limit = 20, category, unreadOnly = false } = input || {};
      const userId = ctx.tenant.userId;

      if (!userId) {
        return { notifications: [], total: 0, pages: 0, page: 1 };
      }

      const where = {
        OR: [
          { userId },
          { userId: null }, // Notificações globais
        ],
        ...(category && { category }),
        ...(unreadOnly && { isRead: false }),
      };

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.notification.count({ where }),
      ]);

      return {
        notifications,
        total,
        pages: Math.ceil(total / limit),
        page,
      };
    }),

  // Obter notificações não lidas
  unread: tenantProcedure
    .input(z.object({ limit: z.number().default(10) }).optional())
    .query(async ({ input, ctx }) => {
      const userId = ctx.tenant.userId;
      if (!userId) return [];

      return notificationService.getUnread(userId, input?.limit || 10);
    }),

  // Contar notificações não lidas
  countUnread: tenantProcedure.query(async ({ ctx }) => {
    const userId = ctx.tenant.userId;
    if (!userId) return 0;

    return notificationService.countUnread(userId);
  }),

  // Marcar como lida
  markAsRead: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.tenant.userId;
      if (!userId) return { success: false };

      await notificationService.markAsRead(input.id, userId);
      return { success: true };
    }),

  // Marcar todas como lidas
  markAllAsRead: tenantProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.tenant.userId;
    if (!userId) return { success: false };

    await notificationService.markAllAsRead(userId);
    return { success: true };
  }),

  // Criar notificação (admin/sistema)
  create: tenantProcedure
    .input(z.object({
      userId: z.string().optional(),
      companyId: z.string().optional(),
      type: z.enum(["info", "success", "warning", "error"]),
      category: z.enum(["system", "business", "error"]),
      title: z.string(),
      message: z.string().optional(),
      link: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return notificationService.create(input);
    }),

  // Obter preferências de notificação
  getPreferences: tenantProcedure.query(async ({ ctx }) => {
    const userId = ctx.tenant.userId;
    if (!userId) return [];

    return prisma.notificationPreference.findMany({
      where: { userId },
    });
  }),

  // Atualizar preferências
  updatePreferences: tenantProcedure
    .input(z.object({
      category: z.string(),
      emailEnabled: z.boolean().optional(),
      pushEnabled: z.boolean().optional(),
      inAppEnabled: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.tenant.userId;
      if (!userId) return null;

      return prisma.notificationPreference.upsert({
        where: {
          userId_category: {
            userId,
            category: input.category,
          },
        },
        create: {
          userId,
          category: input.category,
          emailEnabled: input.emailEnabled ?? true,
          pushEnabled: input.pushEnabled ?? true,
          inAppEnabled: input.inAppEnabled ?? true,
        },
        update: {
          emailEnabled: input.emailEnabled,
          pushEnabled: input.pushEnabled,
          inAppEnabled: input.inAppEnabled,
        },
      });
    }),
});
