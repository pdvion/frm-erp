import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";

const quoteStatusEnum = z.enum([
  "DRAFT",
  "SENT",
  "VIEWED",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CONVERTED",
]);

export const salesQuotesRouter = createTRPCRouter({
  list: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: quoteStatusEnum.optional(),
        customerId: z.string().optional(),
        leadId: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const { search, status, customerId, leadId, page, limit } = input;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {
        ...tenantFilter(ctx.companyId),
      };

      if (search) {
        where.OR = [
          { code: { equals: parseInt(search) || -1 } },
          { customer: { companyName: { contains: search, mode: "insensitive" as const } } },
        ];
      }

      if (status) {
        where.status = status;
      }

      if (customerId) {
        where.customerId = customerId;
      }

      if (leadId) {
        where.leadId = leadId;
      }

      const [quotes, total] = await Promise.all([
        ctx.prisma.salesQuote.findMany({
          where,
          include: {
            customer: { select: { id: true, code: true, companyName: true } },
            lead: { select: { id: true, code: true, companyName: true } },
            _count: { select: { items: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        ctx.prisma.salesQuote.count({ where }),
      ]);

      return {
        quotes,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    }),

  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const quote = await ctx.prisma.salesQuote.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId),
        },
        include: {
          customer: true,
          lead: { select: { id: true, code: true, companyName: true, status: true } },
          items: {
            include: {
              material: { select: { id: true, code: true, description: true, unit: true } },
            },
            orderBy: { sequence: "asc" },
          },
          convertedToOrder: { select: { id: true, code: true, status: true } },
        },
      });

      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado" });
      }

      return quote;
    }),

  create: tenantProcedure
    .input(
      z.object({
        customerId: z.string(),
        leadId: z.string().optional(),
        validUntil: z.string().optional(),
        deliveryDays: z.number().optional(),
        paymentTerms: z.string().optional(),
        shippingMethod: z.string().optional(),
        notes: z.string().optional(),
        internalNotes: z.string().optional(),
        items: z.array(
          z.object({
            materialId: z.string(),
            description: z.string().optional(),
            quantity: z.number().positive(),
            unit: z.string().default("UN"),
            unitPrice: z.number().min(0),
            discountPercent: z.number().min(0).max(100).default(0),
            notes: z.string().optional(),
          })
        ).min(1, "Orçamento deve ter pelo menos um item"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Gerar código sequencial
      const lastQuote = await ctx.prisma.salesQuote.findFirst({
        where: { companyId: ctx.companyId },
        orderBy: { code: "desc" },
        select: { code: true },
      });

      const nextCode = (lastQuote?.code ?? 0) + 1;

      // Calcular totais dos itens
      let subtotal = 0;
      const itemsData = input.items.map((item, index) => {
        const itemTotal = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
        subtotal += itemTotal;
        return {
          materialId: item.materialId,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          totalPrice: itemTotal,
          sequence: index + 1,
          notes: item.notes,
        };
      });

      const quote = await ctx.prisma.salesQuote.create({
        data: {
          code: nextCode,
          companyId: ctx.companyId,
          customerId: input.customerId,
          leadId: input.leadId,
          status: "DRAFT",
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          deliveryDays: input.deliveryDays,
          paymentTerms: input.paymentTerms,
          shippingMethod: input.shippingMethod,
          notes: input.notes,
          internalNotes: input.internalNotes,
          subtotal,
          totalValue: subtotal,
          createdBy: ctx.tenant.userId,
          items: {
            create: itemsData,
          },
        },
        include: { items: true },
      });

      return quote;
    }),

  update: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        customerId: z.string().optional(),
        validUntil: z.string().optional(),
        deliveryDays: z.number().optional(),
        paymentTerms: z.string().optional(),
        shippingMethod: z.string().optional(),
        discountPercent: z.number().min(0).max(100).optional(),
        discountValue: z.number().min(0).optional(),
        shippingValue: z.number().min(0).optional(),
        notes: z.string().optional(),
        internalNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const existing = await ctx.prisma.salesQuote.findFirst({
        where: { id, ...tenantFilter(ctx.companyId) },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado" });
      }

      if (!["DRAFT", "SENT"].includes(existing.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Orçamento não pode ser editado neste status" });
      }

      // Recalcular total se desconto ou frete mudou
      const discountPercent = data.discountPercent ?? existing.discountPercent;
      const discountValue = data.discountValue ?? existing.discountValue;
      const shippingValue = data.shippingValue ?? existing.shippingValue;

      const totalValue = Number(existing.subtotal) * (1 - Number(discountPercent) / 100) - Number(discountValue) + Number(shippingValue);

      const quote = await ctx.prisma.salesQuote.update({
        where: { id },
        data: {
          customerId: data.customerId,
          validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
          deliveryDays: data.deliveryDays,
          paymentTerms: data.paymentTerms,
          shippingMethod: data.shippingMethod,
          discountPercent,
          discountValue,
          shippingValue,
          totalValue,
          notes: data.notes,
          internalNotes: data.internalNotes,
        },
      });

      return quote;
    }),

  // Enviar orçamento ao cliente
  send: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const quote = await ctx.prisma.salesQuote.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId) },
      });

      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado" });
      }

      if (quote.status !== "DRAFT") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Orçamento já foi enviado" });
      }

      return ctx.prisma.salesQuote.update({
        where: { id: input.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });
    }),

  // Marcar como visualizado
  markViewed: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const quote = await ctx.prisma.salesQuote.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId) },
      });

      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado" });
      }

      if (quote.status !== "SENT") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Orçamento não está em status enviado" });
      }

      return ctx.prisma.salesQuote.update({
        where: { id: input.id },
        data: {
          status: "VIEWED",
          viewedAt: new Date(),
        },
      });
    }),

  // Aceitar orçamento
  accept: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const quote = await ctx.prisma.salesQuote.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId) },
      });

      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado" });
      }

      if (!["SENT", "VIEWED"].includes(quote.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Orçamento não pode ser aceito neste status" });
      }

      return ctx.prisma.salesQuote.update({
        where: { id: input.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });
    }),

  // Rejeitar orçamento
  reject: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const quote = await ctx.prisma.salesQuote.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId) },
      });

      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado" });
      }

      if (!["SENT", "VIEWED"].includes(quote.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Orçamento não pode ser rejeitado neste status" });
      }

      // Atualizar lead se houver
      if (quote.leadId) {
        await ctx.prisma.lead.update({
          where: { id: quote.leadId },
          data: { status: "LOST", lostAt: new Date(), lostReason: input.reason },
        });
      }

      return ctx.prisma.salesQuote.update({
        where: { id: input.id },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
          rejectionReason: input.reason,
        },
      });
    }),

  // Converter em pedido de venda
  convertToOrder: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const quote = await ctx.prisma.salesQuote.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId) },
        include: { items: true },
      });

      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado" });
      }

      if (quote.status !== "ACCEPTED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Apenas orçamentos aceitos podem ser convertidos" });
      }

      if (quote.convertedToOrderId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Orçamento já foi convertido em pedido" });
      }

      // Gerar código do pedido
      const lastOrder = await ctx.prisma.salesOrder.findFirst({
        where: { companyId: ctx.companyId },
        orderBy: { code: "desc" },
        select: { code: true },
      });

      const nextOrderCode = (lastOrder?.code ?? 0) + 1;

      // Transação para garantir atomicidade (order + quote update + lead update)
      return ctx.prisma.$transaction(async (tx) => {
        const order = await tx.salesOrder.create({
          data: {
            code: nextOrderCode,
            companyId: ctx.companyId,
            customerId: quote.customerId,
            quoteId: quote.id,
            status: "PENDING",
            deliveryDate: quote.deliveryDays
              ? new Date(Date.now() + quote.deliveryDays * 24 * 60 * 60 * 1000)
              : null,
            paymentTerms: quote.paymentTerms,
            shippingMethod: quote.shippingMethod,
            subtotal: quote.subtotal,
            discountPercent: quote.discountPercent,
            discountValue: quote.discountValue,
            shippingValue: quote.shippingValue,
            totalValue: quote.totalValue,
            notes: quote.notes,
            internalNotes: quote.internalNotes,
            createdBy: ctx.tenant.userId,
            items: {
              create: quote.items.map((item, index) => ({
                materialId: item.materialId,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                discountPercent: item.discountPercent,
                totalPrice: item.totalPrice,
                sequence: index + 1,
                notes: item.notes,
              })),
            },
          },
        });

        await tx.salesQuote.update({
          where: { id: input.id },
          data: {
            status: "CONVERTED",
            convertedToOrderId: order.id,
          },
        });

        if (quote.leadId) {
          await tx.lead.update({
            where: { id: quote.leadId },
            data: { status: "WON", wonAt: new Date() },
          });
        }

        return order;
      });
    }),

  // Duplicar orçamento
  duplicate: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const quote = await ctx.prisma.salesQuote.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId) },
        include: { items: true },
      });

      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado" });
      }

      // Gerar novo código
      const lastQuote = await ctx.prisma.salesQuote.findFirst({
        where: { companyId: ctx.companyId },
        orderBy: { code: "desc" },
        select: { code: true },
      });

      const nextCode = (lastQuote?.code ?? 0) + 1;

      const newQuote = await ctx.prisma.salesQuote.create({
        data: {
          code: nextCode,
          companyId: ctx.companyId,
          customerId: quote.customerId,
          leadId: quote.leadId,
          status: "DRAFT",
          deliveryDays: quote.deliveryDays,
          paymentTerms: quote.paymentTerms,
          shippingMethod: quote.shippingMethod,
          subtotal: quote.subtotal,
          discountPercent: quote.discountPercent,
          discountValue: quote.discountValue,
          shippingValue: quote.shippingValue,
          totalValue: quote.totalValue,
          notes: quote.notes,
          internalNotes: quote.internalNotes,
          createdBy: ctx.tenant.userId,
          items: {
            create: quote.items.map((item, index) => ({
              materialId: item.materialId,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              discountPercent: item.discountPercent,
              totalPrice: item.totalPrice,
              sequence: index + 1,
              notes: item.notes,
            })),
          },
        },
        include: { items: true },
      });

      return newQuote;
    }),

  // Adicionar item
  addItem: tenantProcedure
    .input(
      z.object({
        quoteId: z.string(),
        materialId: z.string(),
        description: z.string().optional(),
        quantity: z.number().positive(),
        unit: z.string().default("UN"),
        unitPrice: z.number().min(0),
        discountPercent: z.number().min(0).max(100).default(0),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const quote = await ctx.prisma.salesQuote.findFirst({
        where: { id: input.quoteId, ...tenantFilter(ctx.companyId) },
        include: { items: true },
      });

      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado" });
      }

      if (!["DRAFT", "SENT"].includes(quote.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Orçamento não pode ser editado neste status" });
      }

      const itemTotal = input.quantity * input.unitPrice * (1 - input.discountPercent / 100);
      const nextSequence = Math.max(...quote.items.map((i) => i.sequence), 0) + 1;

      const item = await ctx.prisma.salesQuoteItem.create({
        data: {
          quoteId: input.quoteId,
          materialId: input.materialId,
          description: input.description,
          quantity: input.quantity,
          unit: input.unit,
          unitPrice: input.unitPrice,
          discountPercent: input.discountPercent,
          totalPrice: itemTotal,
          sequence: nextSequence,
          notes: input.notes,
        },
      });

      // Atualizar subtotal do orçamento
      const newSubtotal = Number(quote.subtotal) + itemTotal;
      const newTotal = Number(newSubtotal) * (1 - Number(quote.discountPercent) / 100) - Number(quote.discountValue) + Number(quote.shippingValue);

      await ctx.prisma.salesQuote.update({
        where: { id: input.quoteId },
        data: { subtotal: newSubtotal, totalValue: newTotal },
      });

      return item;
    }),

  // Remover item
  removeItem: tenantProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const item = await ctx.prisma.salesQuoteItem.findFirst({
        where: { id: input.itemId },
        include: { quote: true },
      });

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado" });
      }

      // Verificar se o orçamento pertence à empresa
      const quote = await ctx.prisma.salesQuote.findFirst({
        where: { id: item.quoteId, ...tenantFilter(ctx.companyId) },
      });

      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado" });
      }

      if (!["DRAFT", "SENT"].includes(quote.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Orçamento não pode ser editado neste status" });
      }

      const newSubtotal = Number(quote.subtotal) - Number(item.totalPrice);
      const newTotal = Number(newSubtotal) * (1 - Number(quote.discountPercent) / 100) - Number(quote.discountValue) + Number(quote.shippingValue);

      await ctx.prisma.$transaction([
        ctx.prisma.salesQuoteItem.delete({ where: { id: input.itemId } }),
        ctx.prisma.salesQuote.update({
          where: { id: quote.id },
          data: { subtotal: newSubtotal, totalValue: newTotal },
        }),
      ]);

      return { success: true };
    }),

  // Dashboard de orçamentos
  dashboard: tenantProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalQuotes,
      draftQuotes,
      sentQuotes,
      monthlyQuotes,
      conversionRate,
      byStatus,
    ] = await Promise.all([
      ctx.prisma.salesQuote.count({ where: tenantFilter(ctx.companyId) }),
      ctx.prisma.salesQuote.count({
        where: { ...tenantFilter(ctx.companyId), status: "DRAFT" },
      }),
      ctx.prisma.salesQuote.count({
        where: { ...tenantFilter(ctx.companyId), status: "SENT" },
      }),
      ctx.prisma.salesQuote.count({
        where: {
          ...tenantFilter(ctx.companyId),
          createdAt: { gte: startOfMonth },
        },
      }),
      // Taxa de conversão
      (async () => {
        const converted = await ctx.prisma.salesQuote.count({
          where: { ...tenantFilter(ctx.companyId), status: "CONVERTED" },
        });
        const total = await ctx.prisma.salesQuote.count({
          where: {
            ...tenantFilter(ctx.companyId),
            status: { in: ["CONVERTED", "REJECTED", "EXPIRED"] },
          },
        });
        return total > 0 ? (converted / total) * 100 : 0;
      })(),
      ctx.prisma.salesQuote.groupBy({
        by: ["status"],
        where: tenantFilter(ctx.companyId),
        _count: true,
        _sum: { totalValue: true },
      }),
    ]);

    return {
      totalQuotes,
      draftQuotes,
      sentQuotes,
      monthlyQuotes,
      conversionRate,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
        value: s._sum?.totalValue ?? 0,
      })),
    };
  }),
});
