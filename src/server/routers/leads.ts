import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { emitWebhook } from "../services/webhook";

export const leadsRouter = createTRPCRouter({
  list: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]).optional(),
        source: z.enum(["WEBSITE", "REFERRAL", "COLD_CALL", "TRADE_SHOW", "SOCIAL_MEDIA", "EMAIL", "OTHER"]).optional(),
        assignedTo: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const { search, status, source, assignedTo, page, limit } = input;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {
        ...tenantFilter(ctx.companyId),
      };

      if (search) {
        where.OR = [
          { companyName: { contains: search, mode: "insensitive" as const } },
          { contactName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { code: { contains: search, mode: "insensitive" as const } },
        ];
      }

      if (status) {
        where.status = status;
      }

      if (source) {
        where.source = source;
      }

      if (assignedTo) {
        where.assignedTo = assignedTo;
      }

      const [leads, total] = await Promise.all([
        ctx.prisma.lead.findMany({
          where,
          include: {
            customer: { select: { id: true, code: true } },
            assignedUser: { select: { id: true, name: true, email: true } },
            _count: { select: { activities: true, salesQuotes: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        ctx.prisma.lead.count({ where }),
      ]);

      return {
        leads,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    }),

  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const lead = await ctx.prisma.lead.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId),
        },
        include: {
          customer: true,
          assignedUser: { select: { id: true, name: true, email: true } },
          activities: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
          salesQuotes: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado" });
      }

      return lead;
    }),

  create: tenantProcedure
    .input(
      z.object({
        companyName: z.string().min(1, "Nome da empresa é obrigatório"),
        contactName: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        source: z.enum(["WEBSITE", "REFERRAL", "COLD_CALL", "TRADE_SHOW", "SOCIAL_MEDIA", "EMAIL", "OTHER"]).default("OTHER"),
        estimatedValue: z.number().optional(),
        probability: z.number().min(0).max(100).optional(),
        expectedCloseDate: z.string().optional(),
        description: z.string().optional(),
        notes: z.string().optional(),
        assignedTo: z.string().optional(),
        customerId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Gerar código sequencial + criar lead em transação para evitar race condition
      const lead = await ctx.prisma.$transaction(async (tx) => {
        const lastLead = await tx.lead.findFirst({
          where: { companyId: ctx.companyId },
          orderBy: { code: "desc" },
          select: { code: true },
        });

        const nextCode = lastLead ? String(parseInt(lastLead.code) + 1).padStart(6, "0") : "000001";

        return tx.lead.create({
          data: {
            code: nextCode,
            companyId: ctx.companyId,
            companyName: input.companyName,
            contactName: input.contactName,
            email: input.email || null,
            phone: input.phone,
            source: input.source,
            status: "NEW",
            estimatedValue: input.estimatedValue,
            probability: input.probability ?? 50,
            expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : null,
            description: input.description,
            notes: input.notes,
            assignedTo: input.assignedTo,
            customerId: input.customerId,
            createdBy: ctx.tenant.userId,
          },
        });
      });

      emitWebhook(ctx.prisma, ctx.companyId, "lead.created", {
        id: lead.id, code: lead.code, companyName: lead.companyName,
        source: lead.source, estimatedValue: Number(lead.estimatedValue ?? 0),
      }, { entityType: "Lead", entityId: lead.id });

      return lead;
    }),

  update: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        companyName: z.string().optional(),
        contactName: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        source: z.enum(["WEBSITE", "REFERRAL", "COLD_CALL", "TRADE_SHOW", "SOCIAL_MEDIA", "EMAIL", "OTHER"]).optional(),
        status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]).optional(),
        estimatedValue: z.number().optional(),
        probability: z.number().min(0).max(100).optional(),
        expectedCloseDate: z.string().optional(),
        description: z.string().optional(),
        notes: z.string().optional(),
        assignedTo: z.string().optional(),
        customerId: z.string().optional(),
        lostReason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const existing = await ctx.prisma.lead.findFirst({
        where: { id, ...tenantFilter(ctx.companyId) },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado" });
      }

      // Atualizar datas de status
      const statusData: Record<string, unknown> = {};
      if (data.status === "WON" && existing.status !== "WON") {
        statusData.wonAt = new Date();
      }
      if (data.status === "LOST" && existing.status !== "LOST") {
        statusData.lostAt = new Date();
      }

      const lead = await ctx.prisma.lead.update({
        where: { id },
        data: {
          companyName: data.companyName,
          contactName: data.contactName,
          email: data.email || null,
          phone: data.phone,
          source: data.source,
          status: data.status,
          estimatedValue: data.estimatedValue,
          probability: data.probability,
          expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
          description: data.description,
          notes: data.notes,
          lostReason: data.lostReason,
          customerId: data.customerId,
          ...statusData,
        },
      });

      return lead;
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.lead.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId) },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado" });
      }

      await ctx.prisma.lead.delete({ where: { id: input.id } });

      return { success: true };
    }),

  // Adicionar atividade ao lead
  addActivity: tenantProcedure
    .input(
      z.object({
        leadId: z.string(),
        type: z.enum(["CALL", "EMAIL", "MEETING", "NOTE", "TASK"]),
        subject: z.string().min(1),
        description: z.string().optional(),
        scheduledAt: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const lead = await ctx.prisma.lead.findFirst({
        where: { id: input.leadId, ...tenantFilter(ctx.companyId) },
      });

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado" });
      }

      const activity = await ctx.prisma.leadActivity.create({
        data: {
          leadId: input.leadId,
          type: input.type,
          subject: input.subject,
          description: input.description,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          createdBy: ctx.tenant.userId,
        },
      });

      // Atualizar último contato
      await ctx.prisma.lead.update({
        where: { id: input.leadId },
        data: { lastContactAt: new Date() },
      });

      return activity;
    }),

  // Completar atividade
  completeActivity: tenantProcedure
    .input(z.object({ activityId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const activity = await ctx.prisma.leadActivity.update({
        where: { id: input.activityId },
        data: { completedAt: new Date() },
      });

      return activity;
    }),

  // Converter lead em cliente
  convertToCustomer: tenantProcedure
    .input(z.object({ leadId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const lead = await ctx.prisma.lead.findFirst({
        where: { id: input.leadId, ...tenantFilter(ctx.companyId) },
      });

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado" });
      }

      if (lead.customerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Lead já convertido em cliente" });
      }

      // Transação para garantir atomicidade (nextCode + customer + lead update)
      const customer = await ctx.prisma.$transaction(async (tx) => {
        const lastCustomer = await tx.customer.findFirst({
          where: { companyId: ctx.companyId },
          orderBy: { code: "desc" },
          select: { code: true },
        });

        const nextCode = lastCustomer ? String(parseInt(lastCustomer.code) + 1).padStart(6, "0") : "000001";

        const created = await tx.customer.create({
          data: {
            code: nextCode,
            companyId: ctx.companyId,
            companyName: lead.companyName,
            email: lead.email,
            phone: lead.phone,
            status: "ACTIVE",
          },
        });

        await tx.lead.update({
          where: { id: input.leadId },
          data: {
            customerId: created.id,
            status: "WON",
            wonAt: new Date(),
          },
        });

        return created;
      });

      emitWebhook(ctx.prisma, ctx.companyId, "lead.converted", {
        leadId: input.leadId, companyName: lead.companyName,
      }, { entityType: "Lead", entityId: input.leadId });

      return customer;
    }),

  // Estatísticas do funil
  funnelStats: tenantProcedure.query(async ({ ctx }) => {
    const stats = await ctx.prisma.lead.groupBy({
      by: ["status"],
      where: tenantFilter(ctx.companyId),
      _count: true,
      _sum: { estimatedValue: true },
    });

    const statusOrder = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
    
    return statusOrder.map((status) => {
      const stat = stats.find((s) => s.status === status);
      return {
        status,
        count: stat?._count ?? 0,
        value: stat?._sum?.estimatedValue ?? 0,
      };
    });
  }),

  // Dashboard de leads
  dashboard: tenantProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalLeads,
      newThisMonth,
      wonThisMonth,
      lostThisMonth,
      totalValue,
      bySource,
    ] = await Promise.all([
      ctx.prisma.lead.count({ where: tenantFilter(ctx.companyId) }),
      ctx.prisma.lead.count({
        where: {
          ...tenantFilter(ctx.companyId),
          createdAt: { gte: startOfMonth },
        },
      }),
      ctx.prisma.lead.count({
        where: {
          ...tenantFilter(ctx.companyId),
          status: "WON",
          wonAt: { gte: startOfMonth },
        },
      }),
      ctx.prisma.lead.count({
        where: {
          ...tenantFilter(ctx.companyId),
          status: "LOST",
          lostAt: { gte: startOfMonth },
        },
      }),
      ctx.prisma.lead.aggregate({
        where: {
          ...tenantFilter(ctx.companyId),
          status: { notIn: ["LOST"] },
        },
        _sum: { estimatedValue: true },
      }),
      ctx.prisma.lead.groupBy({
        by: ["source"],
        where: tenantFilter(ctx.companyId),
        _count: true,
      }),
    ]);

    const conversionRate = newThisMonth > 0 ? (wonThisMonth / newThisMonth) * 100 : 0;

    return {
      totalLeads,
      newThisMonth,
      wonThisMonth,
      lostThisMonth,
      conversionRate: Math.round(conversionRate * 10) / 10,
      pipelineValue: totalValue._sum?.estimatedValue ?? 0,
      bySource: bySource.map((s) => ({
        source: String(s.source),
        count: s._count,
      })),
    };
  }),
});
