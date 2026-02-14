import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { InventoryService } from "../services/inventory";
import { emitWebhook } from "../services/webhook";

export const productionRouter = createTRPCRouter({
  // Listar ordens de produção
  list: tenantProcedure
    .input(z.object({
      status: z.enum(["PLANNED", "RELEASED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ALL"]).optional(),
      search: z.string().nullish(),
      dateFrom: z.date().nullish(),
      dateTo: z.date().nullish(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { 
        status, 
        search,
        dateFrom,
        dateTo,
        page = 1, 
        limit = 20,
      } = input || {};

      const where: Prisma.ProductionOrderWhereInput = {
        ...tenantFilter(ctx.companyId, false),
      };

      if (status && status !== "ALL") {
        where.status = status;
      }

      if (dateFrom || dateTo) {
        where.dueDate = {};
        if (dateFrom) where.dueDate.gte = dateFrom;
        if (dateTo) where.dueDate.lte = dateTo;
      }

      if (search) {
        where.OR = [
          { salesOrderNumber: { contains: search, mode: "insensitive" as const } },
          { customerName: { contains: search, mode: "insensitive" as const } },
          { product: { description: { contains: search, mode: "insensitive" as const } } },
        ];
      }

      const [orders, total] = await Promise.all([
        ctx.prisma.productionOrder.findMany({
          where,
          include: {
            product: {
              select: { id: true, code: true, description: true, unit: true },
            },
            _count: { select: { materials: true, operations: true } },
          },
          orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.productionOrder.count({ where }),
      ]);

      return {
        orders,
        total,
        pages: Math.ceil(total / limit),
        page,
      };
    }),

  // Buscar OP por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const order = await ctx.prisma.productionOrder.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId, false),
        },
        include: {
          product: true,
          materials: {
            include: {
              material: {
                include: {
                  inventory: {
                    where: { companyId: ctx.companyId },
                  },
                },
              },
            },
          },
          operations: {
            orderBy: { sequence: "asc" },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ordem de produção não encontrada",
        });
      }

      return order;
    }),

  // Criar OP
  create: tenantProcedure
    .input(z.object({
      productId: z.string(),
      quantity: z.number().positive(),
      dueDate: z.date().optional(),
      plannedStart: z.date().optional(),
      plannedEnd: z.date().optional(),
      priority: z.number().min(1).max(4).default(3),
      salesOrderNumber: z.string().optional(),
      customerName: z.string().optional(),
      notes: z.string().optional(),
      requestType: z.enum(["SALES", "STOCK", "EXPORT", "NORMAL", "REWORK"]).optional(),
      executionType: z.enum(["MANUFACTURE", "ALTER"]).optional(),
      deliveryType: z.enum(["ASSEMBLED", "LOOSE"]).optional(),
      materials: z.array(z.object({
        materialId: z.string(),
        requiredQty: z.number().positive(),
        notes: z.string().optional(),
      })).optional(),
      operations: z.array(z.object({
        sequence: z.number(),
        name: z.string(),
        workCenterId: z.string().uuid().optional(),
        setupTime: z.number().default(0),
        runTime: z.number().default(0),
        plannedQty: z.number().positive(),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Obter próximo código
      const lastOrder = await ctx.prisma.productionOrder.findFirst({
        where: { companyId: ctx.companyId },
        orderBy: { code: "desc" },
        select: { code: true },
      });
      const nextCode = (lastOrder?.code || 0) + 1;

      // Criar OP com materiais e operações
      const order = await ctx.prisma.productionOrder.create({
        data: {
          code: nextCode,
          companyId: ctx.companyId,
          productId: input.productId,
          quantity: input.quantity,
          dueDate: input.dueDate,
          plannedStart: input.plannedStart,
          plannedEnd: input.plannedEnd,
          priority: input.priority,
          salesOrderNumber: input.salesOrderNumber,
          customerName: input.customerName,
          notes: input.notes,
          request_type: input.requestType,
          execution_type: input.executionType,
          delivery_type: input.deliveryType,
          createdBy: ctx.tenant.userId,
          materials: input.materials ? {
            create: input.materials.map((m) => ({
              materialId: m.materialId,
              requiredQty: m.requiredQty,
              notes: m.notes,
            })),
          } : undefined,
          operations: input.operations ? {
            create: input.operations.map((op) => ({
              sequence: op.sequence,
              name: op.name,
              workCenterId: op.workCenterId,
              setupTime: op.setupTime,
              runTime: op.runTime,
              plannedQty: op.plannedQty,
            })),
          } : undefined,
        },
        include: {
          product: true,
          materials: { include: { material: true } },
          operations: true,
        },
      });

      emitWebhook(ctx.prisma, ctx.companyId, "production_order.created", {
        id: order.id, code: order.code, productId: order.productId,
        quantity: Number(order.quantity), priority: order.priority,
      }, { entityType: "ProductionOrder", entityId: order.id });

      return order;
    }),

  // Adicionar material à OP
  addMaterial: tenantProcedure
    .input(z.object({
      orderId: z.string(),
      materialId: z.string(),
      requiredQty: z.number().positive(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const order = await ctx.prisma.productionOrder.findFirst({
        where: {
          id: input.orderId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ordem de produção não encontrada",
        });
      }

      if (!["PLANNED", "RELEASED"].includes(order.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Só é possível adicionar materiais em OPs planejadas ou liberadas",
        });
      }

      return ctx.prisma.productionOrderMaterial.create({
        data: {
          orderId: input.orderId,
          materialId: input.materialId,
          requiredQty: input.requiredQty,
          notes: input.notes,
        },
        include: { material: true },
      });
    }),

  // Adicionar operação à OP
  addOperation: tenantProcedure
    .input(z.object({
      orderId: z.string(),
      sequence: z.number(),
      name: z.string(),
      workCenter: z.string().optional(),
      setupTime: z.number().default(0),
      runTime: z.number().default(0),
      plannedQty: z.number().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      const order = await ctx.prisma.productionOrder.findFirst({
        where: {
          id: input.orderId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ordem de produção não encontrada",
        });
      }

      if (!["PLANNED", "RELEASED"].includes(order.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Só é possível adicionar operações em OPs planejadas ou liberadas",
        });
      }

      return ctx.prisma.productionOrderOperation.create({
        data: {
          orderId: input.orderId,
          companyId: ctx.companyId,
          sequence: input.sequence,
          name: input.name,
          workCenter: input.workCenter,
          setupTime: input.setupTime,
          runTime: input.runTime,
          plannedQty: input.plannedQty,
        },
      });
    }),

  // Liberar OP
  release: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const order = await ctx.prisma.productionOrder.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId, false),
        },
        include: { materials: true },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ordem de produção não encontrada",
        });
      }

      if (order.status !== "PLANNED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Só é possível liberar OPs planejadas",
        });
      }

      return ctx.prisma.productionOrder.update({
        where: { id: input.id },
        data: { status: "RELEASED" },
      });
    }),

  // Iniciar produção
  start: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const order = await ctx.prisma.productionOrder.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ordem de produção não encontrada",
        });
      }

      if (order.status !== "RELEASED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Só é possível iniciar OPs liberadas",
        });
      }

      return ctx.prisma.productionOrder.update({
        where: { id: input.id },
        data: {
          status: "IN_PROGRESS",
          actualStart: new Date(),
        },
      });
    }),

  // Apontar produção (quantidade produzida)
  reportProduction: tenantProcedure
    .input(z.object({
      orderId: z.string(),
      quantity: z.number().positive(),
      scrapQty: z.number().default(0),
      operationId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const order = await ctx.prisma.productionOrder.findFirst({
        where: {
          id: input.orderId,
          ...tenantFilter(ctx.companyId, false),
        },
        include: {
          product: {
            include: {
              inventory: {
                where: { companyId: ctx.companyId },
              },
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ordem de produção não encontrada",
        });
      }

      if (order.status !== "IN_PROGRESS") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Só é possível apontar em OPs em produção",
        });
      }

      const newProducedQty = Number(order.producedQty) + Number(input.quantity);
      const isComplete = newProducedQty >= Number(order.quantity);

      // Transação para garantir atomicidade (OP + operação + inventário)
      const result = await ctx.prisma.$transaction(async (tx) => {
        // Atualizar OP
        await tx.productionOrder.update({
          where: { id: input.orderId },
          data: {
            producedQty: newProducedQty,
            status: isComplete ? "COMPLETED" : "IN_PROGRESS",
            actualEnd: isComplete ? new Date() : undefined,
          },
        });

        // Atualizar operação se especificada
        if (input.operationId) {
          await tx.productionOrderOperation.update({
            where: { id: input.operationId },
            data: {
              completedQty: { increment: input.quantity },
              scrapQty: { increment: input.scrapQty },
              completedAt: isComplete ? new Date() : undefined,
            },
          });
        }

        // Dar entrada do produto acabado no estoque
        if (input.quantity > 0) {
          const inventoryService = new InventoryService(ctx.prisma);
          const inventory = await inventoryService.getOrCreateInventory(tx, order.product.id, ctx.companyId, "FINISHED");

          // Calcular custo de produção baseado nos materiais consumidos
          const consumedMaterials = await tx.productionOrderMaterial.findMany({
            where: { orderId: order.id },
            include: { material: true },
          });
          
          let totalMaterialCost = 0;
          for (const mat of consumedMaterials) {
            const materialCost = mat.material.lastPurchasePrice || 0;
            totalMaterialCost += Number(materialCost) * Number(mat.consumedQty);
          }
          
          const unitCost = newProducedQty > 0 
            ? totalMaterialCost / newProducedQty 
            : totalMaterialCost / Number(order.quantity);
          const totalCost = unitCost * input.quantity;

          await inventoryService.recordProductionEntry(tx, {
            inventoryId: inventory.id,
            currentQuantity: Number(inventory.quantity),
            quantity: input.quantity,
            unitCost,
            documentNumber: String(order.code),
            documentId: order.id,
            productDescription: order.product.description,
            userId: ctx.tenant.userId,
          });
        }

        return { success: true, newProducedQty, isComplete };
      });

      if (isComplete) {
        emitWebhook(ctx.prisma, ctx.companyId, "production_order.completed", {
          id: input.orderId, code: order.code, producedQty: newProducedQty,
        }, { entityType: "ProductionOrder", entityId: input.orderId });
      }

      return result;
    }),

  // Consumir material
  consumeMaterial: tenantProcedure
    .input(z.object({
      materialId: z.string(), // ID do ProductionOrderMaterial
      quantity: z.number().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      const orderMaterial = await ctx.prisma.productionOrderMaterial.findFirst({
        where: { id: input.materialId },
        include: {
          order: true,
          material: {
            include: {
              inventory: {
                where: { companyId: ctx.companyId },
              },
            },
          },
        },
      });

      if (!orderMaterial) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Material não encontrado",
        });
      }

      if (orderMaterial.order.companyId !== ctx.companyId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão",
        });
      }

      if (!["RELEASED", "IN_PROGRESS"].includes(orderMaterial.order.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "OP não está em status válido para consumo",
        });
      }

      const inventory = orderMaterial.material.inventory[0];
      if (!inventory || Number(inventory.availableQty) < Number(input.quantity)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Estoque insuficiente. Disponível: ${inventory?.availableQty || 0}`,
        });
      }

      const unitCost = inventory.unitCost;
      const totalCost = Number(unitCost) * Number(input.quantity);

      // Transação para garantir atomicidade (material OP + movimentação + estoque)
      return ctx.prisma.$transaction(async (tx) => {
        await tx.productionOrderMaterial.update({
          where: { id: input.materialId },
          data: {
            consumedQty: { increment: input.quantity },
            unitCost,
            totalCost: { increment: totalCost },
          },
        });

        const inventoryService = new InventoryService(ctx.prisma);
        await inventoryService.recordProductionConsumption(tx, {
          inventoryId: inventory.id,
          currentQuantity: Number(inventory.quantity),
          quantity: input.quantity,
          unitCost,
          totalCost,
          documentNumber: String(orderMaterial.order.code),
          documentId: orderMaterial.order.id,
          materialDescription: orderMaterial.material.description,
          userId: ctx.tenant.userId,
        });

        return { success: true };
      });
    }),

  // Cancelar OP
  cancel: tenantProcedure
    .input(z.object({
      id: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const order = await ctx.prisma.productionOrder.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId, false),
        },
        include: { materials: true },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ordem de produção não encontrada",
        });
      }

      if (order.status === "COMPLETED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível cancelar OP concluída",
        });
      }

      // Verificar se houve consumo
      const hasConsumption = order.materials.some((m) => Number(m.consumedQty) > 0);
      if (hasConsumption) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível cancelar OP com materiais já consumidos",
        });
      }

      return ctx.prisma.productionOrder.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          notes: `${order.notes || ""}\n[CANCELADO] ${input.reason}`.trim(),
        },
      });
    }),

  // Estatísticas
  stats: tenantProcedure.query(async ({ ctx }) => {
    const [byStatus, urgentCount, lateCount] = await Promise.all([
      ctx.prisma.productionOrder.groupBy({
        by: ["status"],
        where: tenantFilter(ctx.companyId, false),
        _count: true,
        _sum: { quantity: true, producedQty: true },
      }),
      ctx.prisma.productionOrder.count({
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: { in: ["PLANNED", "RELEASED", "IN_PROGRESS"] },
          priority: 1,
        },
      }),
      ctx.prisma.productionOrder.count({
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: { in: ["PLANNED", "RELEASED", "IN_PROGRESS"] },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return {
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
        totalQty: s._sum.quantity || 0,
        producedQty: s._sum.producedQty || 0,
      })),
      urgentCount,
      lateCount,
    };
  }),
});
