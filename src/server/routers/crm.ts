/**
 * CRM Avançado Router
 *
 * Pipelines, Oportunidades, Contatos, Comunicação, Scoring, Forecasting, Performance.
 *
 * @see VIO-1076
 */

import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { CrmService } from "../services/crm";
import { emitWebhook } from "../services/webhook";

export const crmRouter = createTRPCRouter({
  // ========================================================================
  // PIPELINES
  // ========================================================================

  listPipelines: tenantProcedure
    .input(
      z.object({ includeInactive: z.boolean().optional() }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const where: Record<string, unknown> = { companyId };
      if (!input?.includeInactive) where.isActive = true;

      return ctx.prisma.salesPipeline.findMany({
        where,
        orderBy: { createdAt: "asc" },
      });
    }),

  getPipeline: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const pipeline = await ctx.prisma.salesPipeline.findFirst({
        where: { id: input.id, companyId },
        include: { opportunities: { where: { status: "OPEN" }, orderBy: { createdAt: "desc" } } },
      });
      if (!pipeline) throw new TRPCError({ code: "NOT_FOUND", message: "Pipeline não encontrado" });
      return pipeline;
    }),

  createPipeline: tenantProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        stages: z
          .array(
            z.object({
              order: z.number().int().min(1),
              name: z.string().min(1),
              probability: z.number().int().min(0).max(100),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const svc = new CrmService(ctx.prisma);
      return svc.createPipeline(companyId, input.name, input.description, input.stages);
    }),

  updatePipeline: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().nullable().optional(),
        stages: z
          .array(
            z.object({
              order: z.number().int().min(1),
              name: z.string().min(1),
              probability: z.number().int().min(0).max(100),
            }),
          )
          .optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const { id, ...data } = input;
      const existing = await ctx.prisma.salesPipeline.findFirst({
        where: { id, companyId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Pipeline não encontrado" });

      return ctx.prisma.salesPipeline.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.stages !== undefined && { stages: JSON.parse(JSON.stringify(data.stages)) }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });
    }),

  // ========================================================================
  // CONTATOS
  // ========================================================================

  listContacts: tenantProcedure
    .input(
      z.object({
        customerId: z.string().uuid().optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const { customerId, search, page = 1, limit = 20 } = input ?? {};

      const where: Record<string, unknown> = { companyId, isActive: true };
      if (customerId) where.customerId = customerId;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.prisma.contact.findMany({
          where,
          include: { customer: { select: { id: true, companyName: true } } },
          orderBy: { name: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.contact.count({ where }),
      ]);

      return { items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }),

  createContact: tenantProcedure
    .input(
      z.object({
        customerId: z.string().uuid(),
        name: z.string().min(1).max(255),
        role: z.string().max(100).optional(),
        department: z.string().max(100).optional(),
        email: z.string().email().optional(),
        phone: z.string().max(30).optional(),
        mobile: z.string().max(30).optional(),
        isPrimary: z.boolean().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      return ctx.prisma.contact.create({
        data: { ...input, companyId },
      });
    }),

  updateContact: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        role: z.string().max(100).nullable().optional(),
        department: z.string().max(100).nullable().optional(),
        email: z.string().email().nullable().optional(),
        phone: z.string().max(30).nullable().optional(),
        mobile: z.string().max(30).nullable().optional(),
        isPrimary: z.boolean().optional(),
        isActive: z.boolean().optional(),
        notes: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const { id, ...data } = input;
      const existing = await ctx.prisma.contact.findFirst({ where: { id, companyId } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Contato não encontrado" });
      return ctx.prisma.contact.update({ where: { id }, data });
    }),

  // ========================================================================
  // OPORTUNIDADES
  // ========================================================================

  listOpportunities: tenantProcedure
    .input(
      z.object({
        pipelineId: z.string().uuid().optional(),
        customerId: z.string().uuid().optional(),
        assignedTo: z.string().uuid().optional(),
        status: z.enum(["OPEN", "WON", "LOST"]).optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const { pipelineId, customerId, assignedTo, status, search, page = 1, limit = 50 } = input ?? {};

      const where: Record<string, unknown> = { companyId };
      if (pipelineId) where.pipelineId = pipelineId;
      if (customerId) where.customerId = customerId;
      if (assignedTo) where.assignedTo = assignedTo;
      if (status) where.status = status;
      if (search) {
        where.title = { contains: search, mode: "insensitive" as const };
      }

      const [items, total] = await Promise.all([
        ctx.prisma.opportunity.findMany({
          where,
          include: {
            customer: { select: { id: true, companyName: true } },
            pipeline: { select: { id: true, name: true } },
            assignedUser: { select: { id: true, name: true } },
          },
          orderBy: { updatedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.opportunity.count({ where }),
      ]);

      return { items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }),

  getOpportunity: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const opp = await ctx.prisma.opportunity.findFirst({
        where: { id: input.id, companyId },
        include: {
          customer: { select: { id: true, companyName: true, email: true, phone: true } },
          pipeline: true,
          assignedUser: { select: { id: true, name: true, email: true } },
          communicationLogs: { orderBy: { occurredAt: "desc" }, take: 10 },
        },
      });
      if (!opp) throw new TRPCError({ code: "NOT_FOUND", message: "Oportunidade não encontrada" });
      return opp;
    }),

  createOpportunity: tenantProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        customerId: z.string().uuid(),
        pipelineId: z.string().uuid(),
        stage: z.string().min(1),
        value: z.number().min(0),
        probability: z.number().int().min(0).max(100).optional(),
        expectedCloseDate: z.string().optional(),
        leadId: z.string().uuid().optional(),
        assignedTo: z.string().uuid().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const svc = new CrmService(ctx.prisma);
      return svc.createOpportunity({
        ...input,
        companyId,
        expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : null,
        createdBy: ctx.tenant.userId ?? null,
      });
    }),

  moveOpportunity: tenantProcedure
    .input(
      z.object({
        opportunityId: z.string().uuid(),
        newStage: z.string().min(1),
        probability: z.number().int().min(0).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const svc = new CrmService(ctx.prisma);
      return svc.moveOpportunity({ ...input, companyId: ctx.tenant.companyId! });
    }),

  winOpportunity: tenantProcedure
    .input(z.object({ opportunityId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const svc = new CrmService(ctx.prisma);
      const result = await svc.winOpportunity({ ...input, companyId: ctx.tenant.companyId! });

      emitWebhook(ctx.prisma, ctx.tenant.companyId!, "opportunity.won", {
        id: input.opportunityId, title: result.title, value: Number(result.value),
      }, { entityType: "Opportunity", entityId: input.opportunityId });

      return result;
    }),

  loseOpportunity: tenantProcedure
    .input(
      z.object({
        opportunityId: z.string().uuid(),
        lostReason: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const svc = new CrmService(ctx.prisma);
      const result = await svc.loseOpportunity({ ...input, companyId: ctx.tenant.companyId! });

      emitWebhook(ctx.prisma, ctx.tenant.companyId!, "opportunity.lost", {
        id: input.opportunityId, title: result.title, value: Number(result.value),
        lostReason: input.lostReason,
      }, { entityType: "Opportunity", entityId: input.opportunityId });

      return result;
    }),

  // ========================================================================
  // COMUNICAÇÃO
  // ========================================================================

  listCommunications: tenantProcedure
    .input(
      z.object({
        customerId: z.string().uuid().optional(),
        opportunityId: z.string().uuid().optional(),
        channel: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const { customerId, opportunityId, channel, page = 1, limit = 20 } = input ?? {};

      const where: Record<string, unknown> = { companyId };
      if (customerId) where.customerId = customerId;
      if (opportunityId) where.opportunityId = opportunityId;
      if (channel) where.channel = channel;

      const [items, total] = await Promise.all([
        ctx.prisma.communicationLog.findMany({
          where,
          include: {
            customer: { select: { id: true, companyName: true } },
            opportunity: { select: { id: true, title: true } },
          },
          orderBy: { occurredAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.communicationLog.count({ where }),
      ]);

      return { items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }),

  createCommunication: tenantProcedure
    .input(
      z.object({
        customerId: z.string().uuid(),
        opportunityId: z.string().uuid().optional(),
        channel: z.enum(["EMAIL", "PHONE", "WHATSAPP", "MEETING", "VISIT"]),
        direction: z.enum(["INBOUND", "OUTBOUND"]),
        subject: z.string().max(255).optional(),
        content: z.string().optional(),
        contactName: z.string().max(255).optional(),
        scheduledAt: z.string().optional(),
        occurredAt: z.string().optional(),
        durationMinutes: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      return ctx.prisma.communicationLog.create({
        data: {
          companyId,
          customerId: input.customerId,
          opportunityId: input.opportunityId ?? null,
          channel: input.channel,
          direction: input.direction,
          subject: input.subject ?? null,
          content: input.content ?? null,
          contactName: input.contactName ?? null,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
          durationMinutes: input.durationMinutes ?? null,
          createdBy: ctx.tenant.userId ?? null,
        },
      });
    }),

  // ========================================================================
  // LEAD SCORING
  // ========================================================================

  listScoringRules: tenantProcedure.query(async ({ ctx }) => {
    const companyId = ctx.tenant.companyId!;
    return ctx.prisma.leadScoringRule.findMany({
      where: { companyId },
      orderBy: { createdAt: "asc" },
    });
  }),

  createScoringRule: tenantProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        field: z.string().min(1).max(50),
        operator: z.enum([
          "EQUALS",
          "NOT_EQUALS",
          "CONTAINS",
          "GREATER_THAN",
          "LESS_THAN",
          "GREATER_EQUAL",
          "LESS_EQUAL",
          "IN",
        ]),
        value: z.string().min(1),
        score: z.number().int().min(-100).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      return ctx.prisma.leadScoringRule.create({
        data: { ...input, companyId },
      });
    }),

  updateScoringRule: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        field: z.string().min(1).max(50).optional(),
        operator: z.enum([
          "EQUALS",
          "NOT_EQUALS",
          "CONTAINS",
          "GREATER_THAN",
          "LESS_THAN",
          "GREATER_EQUAL",
          "LESS_EQUAL",
          "IN",
        ]).optional(),
        value: z.string().optional(),
        score: z.number().int().min(-100).max(100).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const { id, ...data } = input;
      const existing = await ctx.prisma.leadScoringRule.findFirst({ where: { id, companyId } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Regra não encontrada" });
      return ctx.prisma.leadScoringRule.update({ where: { id }, data });
    }),

  scoreLead: tenantProcedure
    .input(z.object({ leadId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const svc = new CrmService(ctx.prisma);
      const score = await svc.scoreLeadById(companyId, input.leadId);
      return { leadId: input.leadId, score };
    }),

  // ========================================================================
  // METAS DE VENDAS
  // ========================================================================

  listSalesTargets: tenantProcedure
    .input(
      z.object({
        year: z.number().int(),
        month: z.number().int().min(1).max(12).optional(),
        userId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const where: Record<string, unknown> = { companyId, year: input.year };
      if (input.month) where.month = input.month;
      if (input.userId) where.userId = input.userId;

      return ctx.prisma.salesTarget.findMany({
        where,
        include: { user: { select: { id: true, name: true } } },
        orderBy: [{ year: "asc" }, { month: "asc" }],
      });
    }),

  upsertSalesTarget: tenantProcedure
    .input(
      z.object({
        userId: z.string().uuid().nullable(),
        year: z.number().int(),
        month: z.number().int().min(1).max(12),
        targetValue: z.number().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;

      const existing = await ctx.prisma.salesTarget.findFirst({
        where: {
          companyId,
          userId: input.userId,
          year: input.year,
          month: input.month,
        },
      });

      if (existing) {
        return ctx.prisma.salesTarget.update({
          where: { id: existing.id },
          data: { targetValue: input.targetValue },
        });
      }

      return ctx.prisma.salesTarget.create({
        data: {
          companyId,
          userId: input.userId,
          year: input.year,
          month: input.month,
          targetValue: input.targetValue,
          actualValue: 0,
        },
      });
    }),

  // ========================================================================
  // RELATÓRIOS
  // ========================================================================

  getForecast: tenantProcedure
    .input(
      z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        pipelineId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const svc = new CrmService(ctx.prisma);
      return svc.getForecast(
        companyId,
        input.startDate,
        input.endDate,
        input.pipelineId,
      );
    }),

  getSalesPerformance: tenantProcedure
    .input(
      z.object({
        year: z.number().int(),
        month: z.number().int().min(1).max(12),
      }),
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const svc = new CrmService(ctx.prisma);
      return svc.getSalesPerformance(companyId, input.year, input.month);
    }),

  getCustomer360: tenantProcedure
    .input(z.object({ customerId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;

      const [customer, contacts, opportunities, communications, receivables] = await Promise.all([
        ctx.prisma.customer.findFirst({
          where: { id: input.customerId, companyId },
        }),
        ctx.prisma.contact.findMany({
          where: { customerId: input.customerId, companyId, isActive: true },
          orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
        }),
        ctx.prisma.opportunity.findMany({
          where: { customerId: input.customerId, companyId },
          include: { pipeline: { select: { name: true } } },
          orderBy: { updatedAt: "desc" },
          take: 20,
        }),
        ctx.prisma.communicationLog.findMany({
          where: { customerId: input.customerId, companyId },
          orderBy: { occurredAt: "desc" },
          take: 20,
        }),
        ctx.prisma.accountsReceivable.findMany({
          where: { customerId: input.customerId, companyId },
          orderBy: { dueDate: "desc" },
          take: 10,
        }),
      ]);

      if (!customer) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });

      // Calcular resumo de oportunidades
      const oppSummary = {
        open: opportunities.filter((o: { status: string }) => o.status === "OPEN").length,
        won: opportunities.filter((o: { status: string }) => o.status === "WON").length,
        lost: opportunities.filter((o: { status: string }) => o.status === "LOST").length,
        totalValue: opportunities
          .filter((o: { status: string }) => o.status === "WON")
          .reduce((sum: number, o: { value: unknown }) => sum + Number(o.value), 0),
      };

      return {
        customer,
        contacts,
        opportunities,
        communications,
        receivables,
        summary: oppSummary,
      };
    }),
});
