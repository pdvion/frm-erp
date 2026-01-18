import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const salesRouter = createTRPCRouter({
  // ==========================================================================
  // LEADS
  // ==========================================================================
  listLeads: tenantProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST", "ALL"]).optional(),
      assignedTo: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { search, status, assignedTo, page = 1, limit = 20 } = input || {};

      const where: Prisma.LeadWhereInput = {
        ...tenantFilter(ctx.companyId),
        ...(search && {
          OR: [
            { companyName: { contains: search, mode: "insensitive" as const } },
            { contactName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(status && status !== "ALL" && { status }),
        ...(assignedTo && { assignedTo }),
      };

      const [leads, total] = await Promise.all([
        ctx.prisma.lead.findMany({
          where,
          include: {
            customer: { select: { id: true, code: true, companyName: true } },
            assignedUser: { select: { id: true, name: true } },
            _count: { select: { activities: true, salesQuotes: true } },
          },
          orderBy: { updatedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.lead.count({ where }),
      ]);

      return { leads, total, pages: Math.ceil(total / limit) };
    }),

  getLead: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const lead = await ctx.prisma.lead.findUnique({
        where: { id: input.id },
        include: {
          customer: true,
          assignedUser: { select: { id: true, name: true, email: true } },
          activities: { orderBy: { createdAt: "desc" } },
          salesQuotes: { orderBy: { createdAt: "desc" } },
        },
      });

      return lead;
    }),

  createLead: tenantProcedure
    .input(z.object({
      code: z.string(),
      companyName: z.string(),
      contactName: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      source: z.enum(["WEBSITE", "REFERRAL", "COLD_CALL", "TRADE_SHOW", "SOCIAL_MEDIA", "EMAIL", "OTHER"]).default("OTHER"),
      estimatedValue: z.number().optional(),
      probability: z.number().optional(),
      expectedCloseDate: z.date().optional(),
      description: z.string().optional(),
      assignedTo: z.string().optional(),
      customerId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const lead = await ctx.prisma.lead.create({
        data: {
          ...input,
          companyId: ctx.companyId,
          createdBy: ctx.tenant.userId,
        },
      });

      return lead;
    }),

  updateLead: tenantProcedure
    .input(z.object({
      id: z.string(),
      companyName: z.string().optional(),
      contactName: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      source: z.enum(["WEBSITE", "REFERRAL", "COLD_CALL", "TRADE_SHOW", "SOCIAL_MEDIA", "EMAIL", "OTHER"]).optional(),
      status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]).optional(),
      estimatedValue: z.number().optional(),
      probability: z.number().optional(),
      expectedCloseDate: z.date().optional(),
      description: z.string().optional(),
      notes: z.string().optional(),
      assignedTo: z.string().optional(),
      lostReason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, status, ...data } = input;

      const updateData: Prisma.LeadUpdateInput = { ...data };

      if (status) {
        updateData.status = status;
        if (status === "WON") {
          updateData.wonAt = new Date();
        } else if (status === "LOST") {
          updateData.lostAt = new Date();
        }
      }

      const lead = await ctx.prisma.lead.update({
        where: { id },
        data: updateData,
      });

      return lead;
    }),

  addLeadActivity: tenantProcedure
    .input(z.object({
      leadId: z.string(),
      type: z.string(),
      subject: z.string(),
      description: z.string().optional(),
      scheduledAt: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const activity = await ctx.prisma.leadActivity.create({
        data: {
          ...input,
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

  // ==========================================================================
  // ORÇAMENTOS DE VENDA
  // ==========================================================================
  listQuotes: tenantProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["DRAFT", "SENT", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED", "CONVERTED", "ALL"]).optional(),
      customerId: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { search, status, customerId, page = 1, limit = 20 } = input || {};

      const where: Prisma.SalesQuoteWhereInput = {
        ...tenantFilter(ctx.companyId),
        ...(search && {
          OR: [
            { customer: { companyName: { contains: search, mode: "insensitive" as const } } },
            { notes: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(status && status !== "ALL" && { status }),
        ...(customerId && { customerId }),
      };

      const [quotes, total] = await Promise.all([
        ctx.prisma.salesQuote.findMany({
          where,
          include: {
            customer: { select: { id: true, code: true, companyName: true } },
            _count: { select: { items: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.salesQuote.count({ where }),
      ]);

      return { quotes, total, pages: Math.ceil(total / limit) };
    }),

  getQuote: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const quote = await ctx.prisma.salesQuote.findUnique({
        where: { id: input.id },
        include: {
          customer: true,
          lead: true,
          items: {
            include: { material: { select: { id: true, code: true, description: true, unit: true } } },
            orderBy: { sequence: "asc" },
          },
          convertedToOrder: true,
        },
      });

      return quote;
    }),

  createQuote: tenantProcedure
    .input(z.object({
      customerId: z.string(),
      leadId: z.string().optional(),
      validUntil: z.date().optional(),
      deliveryDays: z.number().optional(),
      paymentTerms: z.string().optional(),
      shippingMethod: z.string().optional(),
      notes: z.string().optional(),
      internalNotes: z.string().optional(),
      items: z.array(z.object({
        materialId: z.string(),
        description: z.string().optional(),
        quantity: z.number(),
        unit: z.string().default("UN"),
        unitPrice: z.number(),
        discountPercent: z.number().default(0),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const { items, ...quoteData } = input;

      // Gerar próximo código
      const lastQuote = await ctx.prisma.salesQuote.findFirst({
        where: tenantFilter(ctx.companyId),
        orderBy: { code: "desc" },
      });
      const nextCode = (lastQuote?.code || 0) + 1;

      // Calcular totais
      let subtotal = 0;
      const itemsWithTotal = items.map((item, index) => {
        const totalPrice = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
        subtotal += totalPrice;
        return { ...item, totalPrice, sequence: index };
      });

      const quote = await ctx.prisma.salesQuote.create({
        data: {
          ...quoteData,
          code: nextCode,
          companyId: ctx.companyId,
          subtotal,
          totalValue: subtotal,
          createdBy: ctx.tenant.userId,
          items: { create: itemsWithTotal },
        },
        include: { items: true },
      });

      return quote;
    }),

  sendQuote: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const quote = await ctx.prisma.salesQuote.update({
        where: { id: input.id },
        data: { status: "SENT", sentAt: new Date() },
      });

      return quote;
    }),

  acceptQuote: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const quote = await ctx.prisma.salesQuote.update({
        where: { id: input.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });

      return quote;
    }),

  rejectQuote: tenantProcedure
    .input(z.object({ id: z.string(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const quote = await ctx.prisma.salesQuote.update({
        where: { id: input.id },
        data: { status: "REJECTED", rejectedAt: new Date(), rejectionReason: input.reason },
      });

      return quote;
    }),

  convertQuoteToOrder: tenantProcedure
    .input(z.object({
      quoteId: z.string(),
      deliveryDate: z.date().optional(),
      shippingAddress: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const quote = await ctx.prisma.salesQuote.findUnique({
        where: { id: input.quoteId },
        include: { items: true },
      });

      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado" });
      }

      if (quote.status === "CONVERTED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Orçamento já convertido" });
      }

      // Gerar próximo código de pedido
      const lastOrder = await ctx.prisma.salesOrder.findFirst({
        where: tenantFilter(ctx.companyId),
        orderBy: { code: "desc" },
      });
      const nextCode = (lastOrder?.code || 0) + 1;

      // Criar pedido
      const order = await ctx.prisma.salesOrder.create({
        data: {
          code: nextCode,
          companyId: ctx.companyId,
          customerId: quote.customerId,
          quoteId: quote.id,
          deliveryDate: input.deliveryDate,
          shippingAddress: input.shippingAddress,
          paymentTerms: quote.paymentTerms,
          shippingMethod: quote.shippingMethod,
          subtotal: quote.subtotal,
          discountPercent: quote.discountPercent,
          discountValue: quote.discountValue,
          shippingValue: quote.shippingValue,
          taxValue: quote.taxValue,
          totalValue: quote.totalValue,
          notes: quote.notes,
          createdBy: ctx.tenant.userId,
          items: {
            create: quote.items.map((item) => ({
              materialId: item.materialId,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              discountPercent: item.discountPercent,
              totalPrice: item.totalPrice,
              sequence: item.sequence,
            })),
          },
        },
      });

      // Atualizar orçamento
      await ctx.prisma.salesQuote.update({
        where: { id: input.quoteId },
        data: { status: "CONVERTED", convertedToOrderId: order.id },
      });

      return order;
    }),

  // ==========================================================================
  // PEDIDOS DE VENDA
  // ==========================================================================
  listOrders: tenantProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["PENDING", "CONFIRMED", "IN_PRODUCTION", "READY", "SHIPPED", "DELIVERED", "CANCELLED", "ALL"]).optional(),
      customerId: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { search, status, customerId, page = 1, limit = 20 } = input || {};

      const where: Prisma.SalesOrderWhereInput = {
        ...tenantFilter(ctx.companyId),
        ...(search && {
          OR: [
            { customer: { companyName: { contains: search, mode: "insensitive" as const } } },
            { invoiceNumber: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(status && status !== "ALL" && { status }),
        ...(customerId && { customerId }),
      };

      const [orders, total] = await Promise.all([
        ctx.prisma.salesOrder.findMany({
          where,
          include: {
            customer: { select: { id: true, code: true, companyName: true } },
            _count: { select: { items: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.salesOrder.count({ where }),
      ]);

      return { orders, total, pages: Math.ceil(total / limit) };
    }),

  getOrder: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const order = await ctx.prisma.salesOrder.findUnique({
        where: { id: input.id },
        include: {
          customer: true,
          sourceQuote: true,
          items: {
            include: {
              material: { select: { id: true, code: true, description: true, unit: true } },
              productionOrder: { select: { id: true, code: true, status: true } },
            },
            orderBy: { sequence: "asc" },
          },
        },
      });

      return order;
    }),

  updateOrderStatus: tenantProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["PENDING", "CONFIRMED", "IN_PRODUCTION", "READY", "SHIPPED", "DELIVERED", "CANCELLED"]),
      trackingCode: z.string().optional(),
      invoiceNumber: z.string().optional(),
      cancellationReason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, status, ...data } = input;

      const updateData: Prisma.SalesOrderUpdateInput = { status, ...data };

      if (status === "SHIPPED") {
        updateData.shippedAt = new Date();
      } else if (status === "DELIVERED") {
        updateData.deliveredAt = new Date();
      } else if (status === "CANCELLED") {
        updateData.cancelledAt = new Date();
      }

      const order = await ctx.prisma.salesOrder.update({
        where: { id },
        data: updateData,
      });

      return order;
    }),

  // ==========================================================================
  // DASHBOARD
  // ==========================================================================
  dashboard: tenantProcedure
    .query(async ({ ctx }) => {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Pipeline de leads
      const leadsByStatus = await ctx.prisma.lead.groupBy({
        by: ["status"],
        where: tenantFilter(ctx.companyId),
        _count: true,
        _sum: { estimatedValue: true },
      });

      // Orçamentos pendentes
      const pendingQuotes = await ctx.prisma.salesQuote.aggregate({
        where: { ...tenantFilter(ctx.companyId), status: { in: ["DRAFT", "SENT", "VIEWED"] } },
        _count: true,
        _sum: { totalValue: true },
      });

      // Pedidos do mês
      const monthOrders = await ctx.prisma.salesOrder.aggregate({
        where: {
          ...tenantFilter(ctx.companyId),
          orderDate: { gte: startOfMonth },
          status: { not: "CANCELLED" },
        },
        _count: true,
        _sum: { totalValue: true },
      });

      // Pedidos por status
      const ordersByStatus = await ctx.prisma.salesOrder.groupBy({
        by: ["status"],
        where: tenantFilter(ctx.companyId),
        _count: true,
        _sum: { totalValue: true },
      });

      // Taxa de conversão (orçamentos aceitos / total)
      const totalQuotes = await ctx.prisma.salesQuote.count({
        where: { ...tenantFilter(ctx.companyId), status: { not: "DRAFT" } },
      });
      const acceptedQuotes = await ctx.prisma.salesQuote.count({
        where: { ...tenantFilter(ctx.companyId), status: { in: ["ACCEPTED", "CONVERTED"] } },
      });

      const conversionRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;

      return {
        leadsByStatus,
        pendingQuotes: {
          count: pendingQuotes._count,
          value: pendingQuotes._sum.totalValue || 0,
        },
        monthOrders: {
          count: monthOrders._count,
          value: monthOrders._sum.totalValue || 0,
        },
        ordersByStatus,
        conversionRate: Math.round(conversionRate * 100) / 100,
      };
    }),
});
