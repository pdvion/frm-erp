import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { syncEntityEmbedding } from "../services/embeddingSync";

const salesOrderStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "IN_PRODUCTION",
  "READY",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

export const salesOrdersRouter = createTRPCRouter({
  list: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: salesOrderStatusEnum.optional(),
        customerId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const { search, status, customerId, startDate, endDate, page, limit } = input;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {
        ...tenantFilter(ctx.companyId),
      };

      if (search) {
        where.OR = [
          { code: { equals: parseInt(search) || -1 } },
          { customer: { companyName: { contains: search, mode: "insensitive" as const } } },
          { invoiceNumber: { contains: search, mode: "insensitive" as const } },
        ];
      }

      if (status) {
        where.status = status;
      }

      if (customerId) {
        where.customerId = customerId;
      }

      if (startDate) {
        where.orderDate = { ...(where.orderDate as object || {}), gte: new Date(startDate) };
      }

      if (endDate) {
        where.orderDate = { ...(where.orderDate as object || {}), lte: new Date(endDate) };
      }

      const [orders, total] = await Promise.all([
        prisma.salesOrder.findMany({
          where,
          include: {
            customer: { select: { id: true, code: true, companyName: true } },
            _count: { select: { items: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.salesOrder.count({ where }),
      ]);

      return {
        orders,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    }),

  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const order = await prisma.salesOrder.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId),
        },
        include: {
          customer: true,
          items: {
            include: {
              material: { select: { id: true, code: true, description: true, unit: true } },
            },
            orderBy: { sequence: "asc" },
          },
          sourceQuote: { select: { id: true, code: true } },
        },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }

      return order;
    }),

  create: tenantProcedure
    .input(
      z.object({
        customerId: z.string(),
        deliveryDate: z.string().optional(),
        paymentTerms: z.string().optional(),
        shippingMethod: z.string().optional(),
        shippingAddress: z.string().optional(),
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
          })
        ).min(1, "Pedido deve ter pelo menos um item"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Gerar código sequencial
      const lastOrder = await prisma.salesOrder.findFirst({
        where: { companyId: ctx.companyId },
        orderBy: { code: "desc" },
        select: { code: true },
      });

      const nextCode = (lastOrder?.code ?? 0) + 1;

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
        };
      });

      const order = await prisma.salesOrder.create({
        data: {
          code: nextCode,
          companyId: ctx.companyId,
          customerId: input.customerId,
          status: "PENDING",
          deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : null,
          paymentTerms: input.paymentTerms,
          shippingMethod: input.shippingMethod,
          shippingAddress: input.shippingAddress,
          notes: input.notes,
          internalNotes: input.internalNotes,
          subtotal,
          totalValue: subtotal,
          createdBy: ctx.tenant.userId,
          items: {
            create: itemsData,
          },
        },
        include: {
          items: true,
        },
      });

      syncEntityEmbedding({ prisma, companyId: ctx.companyId! }, "sales_order", order.id, "create");
      return order;
    }),

  update: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        customerId: z.string().optional(),
        deliveryDate: z.string().optional(),
        paymentTerms: z.string().optional(),
        shippingMethod: z.string().optional(),
        shippingAddress: z.string().optional(),
        discountPercent: z.number().min(0).max(100).optional(),
        discountValue: z.number().min(0).optional(),
        shippingValue: z.number().min(0).optional(),
        notes: z.string().optional(),
        internalNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const existing = await prisma.salesOrder.findFirst({
        where: { id, ...tenantFilter(ctx.companyId) },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }

      if (existing.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Só é possível editar pedidos pendentes" });
      }

      // Recalcular total se desconto ou frete mudou
      const discountPercent = data.discountPercent ?? existing.discountPercent;
      const discountValue = data.discountValue ?? existing.discountValue;
      const shippingValue = data.shippingValue ?? existing.shippingValue;

      const totalValue = Number(existing.subtotal) * (1 - Number(discountPercent) / 100) - Number(discountValue) + Number(shippingValue);

      const order = await prisma.salesOrder.update({
        where: { id },
        data: {
          customerId: data.customerId,
          deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
          paymentTerms: data.paymentTerms,
          shippingMethod: data.shippingMethod,
          shippingAddress: data.shippingAddress,
          discountPercent,
          discountValue,
          shippingValue,
          totalValue,
          notes: data.notes,
          internalNotes: data.internalNotes,
        },
      });

      syncEntityEmbedding({ prisma, companyId: ctx.companyId! }, "sales_order", order.id, "update");
      return order;
    }),

  // Confirmar pedido
  confirm: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const order = await prisma.salesOrder.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId) },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }

      if (order.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Pedido não está pendente" });
      }

      return prisma.salesOrder.update({
        where: { id: input.id },
        data: { status: "CONFIRMED" },
      });
    }),

  // Marcar como enviado
  ship: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        trackingCode: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const order = await prisma.salesOrder.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId) },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }

      if (!["CONFIRMED", "READY"].includes(order.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Pedido não pode ser enviado neste status" });
      }

      return prisma.salesOrder.update({
        where: { id: input.id },
        data: {
          status: "SHIPPED",
          shippedAt: new Date(),
          trackingCode: input.trackingCode,
        },
      });
    }),

  // Marcar como entregue
  deliver: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const order = await prisma.salesOrder.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId) },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }

      if (order.status !== "SHIPPED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Pedido não foi enviado" });
      }

      return prisma.salesOrder.update({
        where: { id: input.id },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date(),
        },
      });
    }),

  // Cancelar pedido
  cancel: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().min(1, "Motivo é obrigatório"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const order = await prisma.salesOrder.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId) },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }

      if (["DELIVERED", "CANCELLED"].includes(order.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Pedido não pode ser cancelado" });
      }

      return prisma.salesOrder.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: input.reason,
        },
      });
    }),

  // Adicionar item ao pedido
  addItem: tenantProcedure
    .input(
      z.object({
        orderId: z.string(),
        materialId: z.string(),
        description: z.string().optional(),
        quantity: z.number().positive(),
        unit: z.string().default("UN"),
        unitPrice: z.number().min(0),
        discountPercent: z.number().min(0).max(100).default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const order = await prisma.salesOrder.findFirst({
        where: { id: input.orderId, ...tenantFilter(ctx.companyId) },
        include: { items: true },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }

      if (order.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Só é possível adicionar itens em pedidos pendentes" });
      }

      const itemTotal = input.quantity * input.unitPrice * (1 - input.discountPercent / 100);
      const nextSequence = Math.max(...order.items.map((i) => i.sequence), 0) + 1;

      const item = await prisma.salesOrderItem.create({
        data: {
          orderId: input.orderId,
          materialId: input.materialId,
          description: input.description,
          quantity: input.quantity,
          unit: input.unit,
          unitPrice: input.unitPrice,
          discountPercent: input.discountPercent,
          totalPrice: itemTotal,
          sequence: nextSequence,
        },
      });

      // Atualizar subtotal do pedido
      const newSubtotal = Number(order.subtotal) + itemTotal;
      const newTotal = Number(newSubtotal) * (1 - Number(order.discountPercent) / 100) - Number(order.discountValue) + Number(order.shippingValue);

      await prisma.salesOrder.update({
        where: { id: input.orderId },
        data: { subtotal: newSubtotal, totalValue: newTotal },
      });

      return item;
    }),

  // Remover item do pedido
  removeItem: tenantProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const item = await prisma.salesOrderItem.findFirst({
        where: { id: input.itemId },
        include: { order: true },
      });

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado" });
      }

      // Verificar se o pedido pertence à empresa
      const order = await prisma.salesOrder.findFirst({
        where: { id: item.orderId, ...tenantFilter(ctx.companyId) },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }

      if (order.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Só é possível remover itens de pedidos pendentes" });
      }

      const newSubtotal = Number(order.subtotal) - Number(item.totalPrice);
      const newTotal = Number(newSubtotal) * (1 - Number(order.discountPercent) / 100) - Number(order.discountValue) + Number(order.shippingValue);

      await prisma.$transaction([
        prisma.salesOrderItem.delete({ where: { id: input.itemId } }),
        prisma.salesOrder.update({
          where: { id: order.id },
          data: { subtotal: newSubtotal, totalValue: newTotal },
        }),
      ]);

      return { success: true };
    }),

  // Dashboard de vendas
  dashboard: tenantProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalOrders,
      pendingOrders,
      monthlyOrders,
      monthlyRevenue,
      yearlyRevenue,
      byStatus,
    ] = await Promise.all([
      prisma.salesOrder.count({ where: tenantFilter(ctx.companyId) }),
      prisma.salesOrder.count({
        where: { ...tenantFilter(ctx.companyId), status: "PENDING" },
      }),
      prisma.salesOrder.count({
        where: {
          ...tenantFilter(ctx.companyId),
          orderDate: { gte: startOfMonth },
        },
      }),
      prisma.salesOrder.aggregate({
        where: {
          ...tenantFilter(ctx.companyId),
          orderDate: { gte: startOfMonth },
          status: { notIn: ["CANCELLED"] },
        },
        _sum: { totalValue: true },
      }),
      prisma.salesOrder.aggregate({
        where: {
          ...tenantFilter(ctx.companyId),
          orderDate: { gte: startOfYear },
          status: { notIn: ["CANCELLED"] },
        },
        _sum: { totalValue: true },
      }),
      prisma.salesOrder.groupBy({
        by: ["status"],
        where: tenantFilter(ctx.companyId),
        _count: true,
        _sum: { totalValue: true },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      monthlyOrders,
      monthlyRevenue: monthlyRevenue._sum?.totalValue ?? 0,
      yearlyRevenue: yearlyRevenue._sum?.totalValue ?? 0,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
        value: s._sum?.totalValue ?? 0,
      })),
    };
  }),
});
