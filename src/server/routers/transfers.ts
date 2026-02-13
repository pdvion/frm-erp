import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { withCodeRetry } from "../utils/next-code";

export const transfersRouter = createTRPCRouter({
  list: tenantProcedure
    .input(z.object({
      status: z.enum(["PENDING", "IN_TRANSIT", "RECEIVED", "CANCELLED", "ALL"]).optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { status, page = 1, limit = 20 } = input || {};
      const where: Prisma.StockTransferWhereInput = {
        ...tenantFilter(ctx.companyId, false),
        ...(status && status !== "ALL" && { status }),
      };

      const [transfers, total] = await Promise.all([
        ctx.prisma.stockTransfer.findMany({
          where,
          include: {
            fromLocation: { select: { id: true, code: true, name: true } },
            toLocation: { select: { id: true, code: true, name: true } },
            _count: { select: { items: true } },
          },
          orderBy: { requestedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.stockTransfer.count({ where }),
      ]);

      return { transfers, total, pages: Math.ceil(total / limit) };
    }),

  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.stockTransfer.findUnique({
        where: { id: input.id },
        include: {
          fromLocation: true,
          toLocation: true,
          items: {
            include: { material: { select: { id: true, code: true, description: true, unit: true } } },
          },
        },
      });
    }),

  create: tenantProcedure
    .input(z.object({
      fromLocationId: z.string(),
      toLocationId: z.string(),
      notes: z.string().optional(),
      items: z.array(z.object({
        materialId: z.string(),
        requestedQty: z.number().positive(),
        unit: z.string().default("UN"),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      if (input.fromLocationId === input.toLocationId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Origem e destino devem ser diferentes" });
      }

      return withCodeRetry(async (attempt) => {
        const lastTransfer = await ctx.prisma.stockTransfer.findFirst({
          where: tenantFilter(ctx.companyId, false),
          orderBy: { code: "desc" },
          select: { code: true },
        });

        return ctx.prisma.stockTransfer.create({
          data: {
            code: (lastTransfer?.code || 0) + 1 + attempt,
            companyId: ctx.companyId,
            fromLocationId: input.fromLocationId,
            toLocationId: input.toLocationId,
            notes: input.notes,
            requestedBy: ctx.tenant.userId,
            items: { create: input.items },
          },
        });
      });
    }),

  ship: tenantProcedure
    .input(z.object({
      id: z.string(),
      items: z.array(z.object({ id: z.string(), shippedQty: z.number() })),
    }))
    .mutation(async ({ input, ctx }) => {
      for (const item of input.items) {
        await ctx.prisma.stockTransferItem.update({
          where: { id: item.id },
          data: { shippedQty: item.shippedQty },
        });
      }

      return ctx.prisma.stockTransfer.update({
        where: { id: input.id },
        data: { status: "IN_TRANSIT", shippedAt: new Date(), shippedBy: ctx.tenant.userId },
      });
    }),

  receive: tenantProcedure
    .input(z.object({
      id: z.string(),
      items: z.array(z.object({ id: z.string(), receivedQty: z.number() })),
    }))
    .mutation(async ({ input, ctx }) => {
      const transfer = await ctx.prisma.stockTransfer.findUnique({
        where: { id: input.id },
        include: { items: true },
      });

      if (!transfer) throw new TRPCError({ code: "NOT_FOUND" });

      for (const item of input.items) {
        const transferItem = transfer.items.find(i => i.id === item.id);
        if (!transferItem) continue;

        await ctx.prisma.stockTransferItem.update({
          where: { id: item.id },
          data: { receivedQty: item.receivedQty },
        });

        await ctx.prisma.locationInventory.upsert({
          where: { locationId_materialId: { locationId: transfer.fromLocationId, materialId: transferItem.materialId } },
          create: { locationId: transfer.fromLocationId, materialId: transferItem.materialId, quantity: -item.receivedQty },
          update: { quantity: { decrement: item.receivedQty } },
        });

        await ctx.prisma.locationInventory.upsert({
          where: { locationId_materialId: { locationId: transfer.toLocationId, materialId: transferItem.materialId } },
          create: { locationId: transfer.toLocationId, materialId: transferItem.materialId, quantity: item.receivedQty },
          update: { quantity: { increment: item.receivedQty } },
        });
      }

      return ctx.prisma.stockTransfer.update({
        where: { id: input.id },
        data: { status: "RECEIVED", receivedAt: new Date(), receivedBy: ctx.tenant.userId },
      });
    }),

  cancel: tenantProcedure
    .input(z.object({ id: z.string(), reason: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.stockTransfer.update({
        where: { id: input.id },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancelledBy: ctx.tenant.userId, cancellationReason: input.reason },
      });
    }),
});
