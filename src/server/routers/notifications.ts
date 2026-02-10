import { z } from "zod";
import { createTRPCRouter, tenantProcedure, authProcedure } from "../trpc";
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
        ctx.prisma.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.notification.count({ where }),
      ]);

      return {
        notifications,
        total,
        pages: Math.ceil(total / limit),
        page,
      };
    }),

  // Obter notificações não lidas (usa authProcedure pois não precisa de empresa ativa)
  unread: authProcedure
    .input(z.object({ limit: z.number().default(10) }).optional())
    .query(async ({ input, ctx }) => {
      return notificationService.getUnread(ctx.userId, input?.limit || 10);
    }),

  // Contar notificações não lidas (usa authProcedure pois não precisa de empresa ativa)
  countUnread: authProcedure.query(async ({ ctx }) => {
    return notificationService.countUnread(ctx.userId);
  }),

  // Marcar como lida (usa authProcedure pois não precisa de empresa ativa)
  markAsRead: authProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await notificationService.markAsRead(input.id, ctx.userId);
      return { success: true };
    }),

  // Marcar todas como lidas (usa authProcedure pois não precisa de empresa ativa)
  markAllAsRead: authProcedure.mutation(async ({ ctx }) => {
    await notificationService.markAllAsRead(ctx.userId);
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

  // Obter preferências de notificação (usa authProcedure pois não precisa de empresa ativa)
  getPreferences: authProcedure.query(async ({ ctx }) => {
    return ctx.prisma.notificationPreference.findMany({
      where: { userId: ctx.userId },
    });
  }),

  // Atualizar preferências (usa authProcedure pois não precisa de empresa ativa)
  updatePreferences: authProcedure
    .input(z.object({
      category: z.string(),
      emailEnabled: z.boolean().optional(),
      pushEnabled: z.boolean().optional(),
      inAppEnabled: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.notificationPreference.upsert({
        where: {
          userId_category: {
            userId: ctx.userId,
            category: input.category,
          },
        },
        create: {
          userId: ctx.userId,
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
