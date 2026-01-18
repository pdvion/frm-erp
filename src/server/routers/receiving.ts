import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const receivingRouter = createTRPCRouter({
  // Listar recebimentos
  list: tenantProcedure
    .input(z.object({
      status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED", "PARTIAL", "CANCELLED", "ALL"]).optional(),
      supplierId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { status, supplierId, startDate, endDate, page = 1, limit = 20 } = input || {};

      const where: Prisma.MaterialReceivingWhereInput = {
        ...tenantFilter(ctx.companyId),
        ...(status && status !== "ALL" && { status }),
        ...(supplierId && { supplierId }),
        ...(startDate && { receivingDate: { gte: startDate } }),
        ...(endDate && { receivingDate: { lte: endDate } }),
      };

      const [receivings, total] = await Promise.all([
        ctx.prisma.materialReceiving.findMany({
          where,
          include: {
            supplier: { select: { id: true, code: true, companyName: true } },
            purchaseOrder: { select: { id: true, code: true } },
            _count: { select: { items: true } },
          },
          orderBy: { receivingDate: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.materialReceiving.count({ where }),
      ]);

      return { receivings, total, pages: Math.ceil(total / limit) };
    }),

  // Obter recebimento por ID
  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.materialReceiving.findUnique({
        where: { id: input.id },
        include: {
          supplier: true,
          purchaseOrder: { include: { items: { include: { material: true } } } },
          location: true,
          items: {
            include: {
              material: { select: { id: true, code: true, description: true, unit: true } },
              purchaseOrderItem: true,
              divergences: true,
              certificates: true,
            },
          },
        },
      });
    }),

  // Criar recebimento a partir de NFe/XML
  createFromNfe: tenantProcedure
    .input(z.object({
      supplierId: z.string(),
      purchaseOrderId: z.string().optional(),
      nfeNumber: z.string(),
      nfeSeries: z.string().optional(),
      nfeKey: z.string().optional(),
      nfeXml: z.string().optional(),
      nfeIssueDate: z.date().optional(),
      totalValue: z.number(),
      freightValue: z.number().default(0),
      locationId: z.string().optional(),
      items: z.array(z.object({
        materialId: z.string(),
        purchaseOrderItemId: z.string().optional(),
        nfeItemNumber: z.number().optional(),
        description: z.string().optional(),
        unit: z.string().default("UN"),
        nfeQuantity: z.number(),
        unitPrice: z.number(),
        totalPrice: z.number(),
        icmsValue: z.number().default(0),
        ipiValue: z.number().default(0),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const lastReceiving = await ctx.prisma.materialReceiving.findFirst({
        where: tenantFilter(ctx.companyId),
        orderBy: { code: "desc" },
      });

      return ctx.prisma.materialReceiving.create({
        data: {
          code: (lastReceiving?.code || 0) + 1,
          companyId: ctx.companyId,
          supplierId: input.supplierId,
          purchaseOrderId: input.purchaseOrderId,
          nfeNumber: input.nfeNumber,
          nfeSeries: input.nfeSeries,
          nfeKey: input.nfeKey,
          nfeXml: input.nfeXml,
          nfeIssueDate: input.nfeIssueDate,
          totalValue: input.totalValue,
          freightValue: input.freightValue,
          locationId: input.locationId,
          createdBy: ctx.tenant.userId,
          items: { create: input.items },
        },
        include: { items: true },
      });
    }),

  // Iniciar conferência
  startConference: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const receiving = await ctx.prisma.materialReceiving.findUnique({ where: { id: input.id } });
      if (!receiving) throw new TRPCError({ code: "NOT_FOUND" });
      if (receiving.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Recebimento não está pendente" });
      }

      return ctx.prisma.materialReceiving.update({
        where: { id: input.id },
        data: { status: "IN_PROGRESS", conferredBy: ctx.tenant.userId, conferredAt: new Date() },
      });
    }),

  // Conferir item
  conferItem: tenantProcedure
    .input(z.object({
      itemId: z.string(),
      receivedQuantity: z.number(),
      approvedQuantity: z.number(),
      rejectedQuantity: z.number().default(0),
      rejectionReason: z.string().optional(),
      batchNumber: z.string().optional(),
      expirationDate: z.date().optional(),
      locationId: z.string().optional(),
      qualityStatus: z.string().optional(),
      qualityNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { itemId, ...data } = input;

      const status = data.rejectedQuantity > 0 && data.approvedQuantity === 0
        ? "REJECTED"
        : data.rejectedQuantity > 0
          ? "PARTIAL"
          : "APPROVED";

      return ctx.prisma.materialReceivingItem.update({
        where: { id: itemId },
        data: {
          ...data,
          status,
          conferredBy: ctx.tenant.userId,
          conferredAt: new Date(),
        },
      });
    }),

  // Registrar divergência
  addDivergence: tenantProcedure
    .input(z.object({
      receivingItemId: z.string(),
      type: z.string(),
      expectedValue: z.string().optional(),
      receivedValue: z.string().optional(),
      description: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.receivingDivergence.create({ data: input });
    }),

  // Finalizar recebimento (entrada no estoque)
  complete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const receiving = await ctx.prisma.materialReceiving.findUnique({
        where: { id: input.id },
        include: { items: true },
      });

      if (!receiving) throw new TRPCError({ code: "NOT_FOUND" });
      if (!["IN_PROGRESS", "PENDING"].includes(receiving.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Recebimento não pode ser finalizado" });
      }

      // Verificar se todos os itens foram conferidos
      const pendingItems = receiving.items.filter(i => i.status === "PENDING");
      if (pendingItems.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `${pendingItems.length} itens ainda não conferidos` });
      }

      // Dar entrada no estoque para cada item aprovado
      for (const item of receiving.items) {
        if (item.approvedQuantity > 0) {
          // Atualizar estoque geral
          await ctx.prisma.inventory.upsert({
            where: {
              materialId_companyId_inventoryType: { 
                materialId: item.materialId, 
                companyId: ctx.companyId!, 
                inventoryType: "RAW_MATERIAL" 
              },
            },
            create: {
              materialId: item.materialId,
              companyId: ctx.companyId,
              inventoryType: "RAW_MATERIAL",
              quantity: item.approvedQuantity,
              availableQty: item.approvedQuantity,
            },
            update: {
              quantity: { increment: item.approvedQuantity },
              availableQty: { increment: item.approvedQuantity },
            },
          });

          // Atualizar estoque por local (se especificado)
          const locationId = item.locationId || receiving.locationId;
          if (locationId) {
            await ctx.prisma.locationInventory.upsert({
              where: { locationId_materialId: { locationId, materialId: item.materialId } },
              create: { locationId, materialId: item.materialId, quantity: item.approvedQuantity },
              update: { quantity: { increment: item.approvedQuantity }, lastMovementAt: new Date() },
            });
          }

          // Buscar ou criar inventory para registrar movimento
          const inventory = await ctx.prisma.inventory.findFirst({
            where: { materialId: item.materialId, companyId: ctx.companyId },
          });

          if (inventory) {
            await ctx.prisma.inventoryMovement.create({
              data: {
                inventoryId: inventory.id,
                movementType: "ENTRY",
                quantity: item.approvedQuantity,
                unitCost: item.unitPrice,
                totalCost: item.approvedQuantity * item.unitPrice,
                supplierId: receiving.supplierId,
                documentType: "NFE",
                documentNumber: receiving.nfeNumber,
                notes: `Recebimento #${receiving.code}`,
              },
            });
          }

          // Atualizar quantidade recebida na OC (se vinculada)
          if (item.purchaseOrderItemId) {
            await ctx.prisma.purchaseOrderItem.update({
              where: { id: item.purchaseOrderItemId },
              data: { receivedQty: { increment: item.approvedQuantity } },
            });
          }
        }
      }

      // Verificar se houve rejeições
      const hasRejections = receiving.items.some(i => i.rejectedQuantity > 0);
      const allRejected = receiving.items.every(i => i.status === "REJECTED");

      return ctx.prisma.materialReceiving.update({
        where: { id: input.id },
        data: {
          status: allRejected ? "REJECTED" : hasRejections ? "PARTIAL" : "COMPLETED",
          approvedBy: ctx.tenant.userId,
          approvedAt: new Date(),
        },
      });
    }),

  // Rejeitar recebimento
  reject: tenantProcedure
    .input(z.object({ id: z.string(), reason: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.materialReceiving.update({
        where: { id: input.id },
        data: {
          status: "REJECTED",
          rejectedBy: ctx.tenant.userId,
          rejectedAt: new Date(),
          rejectionReason: input.reason,
        },
      });
    }),

  // Dashboard de recebimentos
  dashboard: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [pending, inProgress, completedMonth, byStatus] = await Promise.all([
      ctx.prisma.materialReceiving.count({
        where: { ...tenantFilter(ctx.companyId), status: "PENDING" },
      }),
      ctx.prisma.materialReceiving.count({
        where: { ...tenantFilter(ctx.companyId), status: "IN_PROGRESS" },
      }),
      ctx.prisma.materialReceiving.aggregate({
        where: {
          ...tenantFilter(ctx.companyId),
          status: "COMPLETED",
          approvedAt: { gte: startOfMonth },
        },
        _count: true,
        _sum: { totalValue: true },
      }),
      ctx.prisma.materialReceiving.groupBy({
        by: ["status"],
        where: tenantFilter(ctx.companyId),
        _count: true,
      }),
    ]);

    return {
      pending,
      inProgress,
      completedMonth: { count: completedMonth._count, value: completedMonth._sum.totalValue || 0 },
      byStatus,
    };
  }),
});
