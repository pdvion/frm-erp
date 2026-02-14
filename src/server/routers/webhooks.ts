import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import {
  WebhookService,
  generateSecret,
  WEBHOOK_EVENT_TYPES,
  type WebhookEventType,
} from "../services/webhook";

const webhookEventTypeValues = Object.keys(WEBHOOK_EVENT_TYPES) as [
  WebhookEventType,
  ...WebhookEventType[],
];

export const webhooksRouter = createTRPCRouter({
  // ──────────────────────────────────────────────
  // LIST CONFIGS
  // ──────────────────────────────────────────────
  list: tenantProcedure
    .input(
      z.object({
        status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
        search: z.string().optional(),
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const where = {
        companyId,
        ...(input?.status && { status: input.status }),
        ...(input?.search && {
          OR: [
            { name: { contains: input.search, mode: "insensitive" as const } },
            { url: { contains: input.search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [webhooks, total] = await Promise.all([
        ctx.prisma.webhookConfig.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            url: true,
            events: true,
            status: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                deliveries: true,
              },
            },
          },
        }),
        ctx.prisma.webhookConfig.count({ where }),
      ]);

      return {
        webhooks: webhooks.map((w) => ({
          ...w,
          secret: undefined,
          deliveryCount: w._count.deliveries,
          _count: undefined,
        })),
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  // ──────────────────────────────────────────────
  // GET BY ID
  // ──────────────────────────────────────────────
  byId: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;

      const webhook = await ctx.prisma.webhookConfig.findFirst({
        where: { id: input.id, companyId },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!webhook) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Webhook não encontrado" });
      }

      return {
        ...webhook,
        secret: webhook.secret ? "••••••••" : null,
      };
    }),

  // ──────────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────────
  create: tenantProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        url: z.string().url().max(2048),
        events: z.array(z.enum(webhookEventTypeValues)).min(1),
        description: z.string().max(500).optional(),
        headers: z.record(z.string(), z.string()).optional(),
        timeoutMs: z.number().int().min(1000).max(30000).optional(),
        maxRetries: z.number().int().min(0).max(5).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const secret = generateSecret();

      const webhook = await ctx.prisma.webhookConfig.create({
        data: {
          companyId,
          name: input.name,
          url: input.url,
          secret,
          events: input.events,
          description: input.description,
          headers: (input.headers ?? {}) as Prisma.InputJsonValue,
          timeoutMs: input.timeoutMs ?? 10000,
          maxRetries: input.maxRetries ?? 3,
          createdBy: ctx.tenant.userId ?? undefined,
        },
      });

      return {
        ...webhook,
        secret,
      };
    }),

  // ──────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────
  update: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        url: z.string().url().max(2048).optional(),
        events: z.array(z.enum(webhookEventTypeValues)).min(1).optional(),
        status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
        description: z.string().max(500).optional().nullable(),
        headers: z.record(z.string(), z.string()).optional(),
        timeoutMs: z.number().int().min(1000).max(30000).optional(),
        maxRetries: z.number().int().min(0).max(5).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;

      const existing = await ctx.prisma.webhookConfig.findFirst({
        where: { id: input.id, companyId },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Webhook não encontrado" });
      }

      const updated = await ctx.prisma.webhookConfig.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.url !== undefined && { url: input.url }),
          ...(input.events !== undefined && { events: input.events }),
          ...(input.status !== undefined && { status: input.status }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.headers !== undefined && { headers: input.headers as Prisma.InputJsonValue }),
          ...(input.timeoutMs !== undefined && { timeoutMs: input.timeoutMs }),
          ...(input.maxRetries !== undefined && { maxRetries: input.maxRetries }),
        },
      });

      return {
        ...updated,
        secret: "••••••••",
      };
    }),

  // ──────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────
  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;

      const existing = await ctx.prisma.webhookConfig.findFirst({
        where: { id: input.id, companyId },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Webhook não encontrado" });
      }

      await ctx.prisma.webhookConfig.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // ──────────────────────────────────────────────
  // ROTATE SECRET
  // ──────────────────────────────────────────────
  rotateSecret: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const svc = new WebhookService(ctx.prisma);
      const newSecret = await svc.rotateSecret(input.id, companyId);
      return { secret: newSecret };
    }),

  // ──────────────────────────────────────────────
  // SEND TEST EVENT
  // ──────────────────────────────────────────────
  sendTest: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const svc = new WebhookService(ctx.prisma);
      const eventId = await svc.sendTestEvent(input.id, companyId);
      return { eventId };
    }),

  // ──────────────────────────────────────────────
  // GET DELIVERY STATS
  // ──────────────────────────────────────────────
  deliveryStats: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        periodDays: z.number().int().min(1).max(90).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const svc = new WebhookService(ctx.prisma);
      return svc.getDeliveryStats(input.id, companyId, input.periodDays ?? 7);
    }),

  // ──────────────────────────────────────────────
  // LIST DELIVERIES
  // ──────────────────────────────────────────────
  listDeliveries: tenantProcedure
    .input(
      z.object({
        webhookId: z.string().uuid(),
        status: z.enum(["PENDING", "SUCCESS", "FAILED", "DEAD_LETTER"]).optional(),
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const page = input.page ?? 1;
      const limit = input.limit ?? 20;
      const skip = (page - 1) * limit;

      // Verify ownership
      const config = await ctx.prisma.webhookConfig.findFirst({
        where: { id: input.webhookId, companyId },
        select: { id: true },
      });

      if (!config) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Webhook não encontrado" });
      }

      const where = {
        webhookId: input.webhookId,
        ...(input.status && { status: input.status }),
      };

      const [deliveries, total] = await Promise.all([
        ctx.prisma.webhookDelivery.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            event: {
              select: {
                eventType: true,
                entityType: true,
                entityId: true,
              },
            },
          },
        }),
        ctx.prisma.webhookDelivery.count({ where }),
      ]);

      return {
        deliveries,
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  // ──────────────────────────────────────────────
  // LIST EVENTS
  // ──────────────────────────────────────────────
  listEvents: tenantProcedure
    .input(
      z.object({
        eventType: z.string().optional(),
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const where = {
        companyId,
        ...(input?.eventType && { eventType: input.eventType }),
      };

      const [events, total] = await Promise.all([
        ctx.prisma.webhookEvent.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          select: {
            id: true,
            eventType: true,
            entityType: true,
            entityId: true,
            metadata: true,
            createdAt: true,
            _count: {
              select: { deliveries: true },
            },
          },
        }),
        ctx.prisma.webhookEvent.count({ where }),
      ]);

      return {
        events: events.map((e) => ({
          ...e,
          deliveryCount: e._count.deliveries,
          _count: undefined,
        })),
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  // ──────────────────────────────────────────────
  // GET EVENT TYPES (static)
  // ──────────────────────────────────────────────
  eventTypes: tenantProcedure.query(() => {
    return Object.entries(WEBHOOK_EVENT_TYPES).map(([key, description]) => ({
      value: key,
      label: description,
    }));
  }),
});
