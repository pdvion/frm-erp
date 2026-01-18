import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const productionRouter = createTRPCRouter({
  // Listar ordens de produção
  list: tenantProcedure
    .input(z.object({
      status: z.enum(["PLANNED", "RELEASED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ALL"]).optional(),
      search: z.string().optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
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
        prisma.productionOrder.findMany({
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
        prisma.productionOrder.count({ where }),
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
      const order = await prisma.productionOrder.findFirst({
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
      materials: z.array(z.object({
        materialId: z.string(),
        requiredQty: z.number().positive(),
        notes: z.string().optional(),
      })).optional(),
      operations: z.array(z.object({
        sequence: z.number(),
        name: z.string(),
        workCenter: z.string().optional(),
        setupTime: z.number().default(0),
        runTime: z.number().default(0),
        plannedQty: z.number().positive(),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Obter próximo código
      const lastOrder = await prisma.productionOrder.findFirst({
        where: { companyId: ctx.companyId },
        orderBy: { code: "desc" },
        select: { code: true },
      });
      const nextCode = (lastOrder?.code || 0) + 1;

      // Criar OP com materiais e operações
      const order = await prisma.productionOrder.create({
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
              workCenter: op.workCenter,
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
      const order = await prisma.productionOrder.findFirst({
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

      return prisma.productionOrderMaterial.create({
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
      const order = await prisma.productionOrder.findFirst({
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

      return prisma.productionOrderOperation.create({
        data: {
          orderId: input.orderId,
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
      const order = await prisma.productionOrder.findFirst({
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

      return prisma.productionOrder.update({
        where: { id: input.id },
        data: { status: "RELEASED" },
      });
    }),

  // Iniciar produção
  start: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const order = await prisma.productionOrder.findFirst({
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

      return prisma.productionOrder.update({
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
      const order = await prisma.productionOrder.findFirst({
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

      const newProducedQty = order.producedQty + input.quantity;
      const isComplete = newProducedQty >= order.quantity;

      // Atualizar OP
      await prisma.productionOrder.update({
        where: { id: input.orderId },
        data: {
          producedQty: newProducedQty,
          status: isComplete ? "COMPLETED" : "IN_PROGRESS",
          actualEnd: isComplete ? new Date() : undefined,
        },
      });

      // Atualizar operação se especificada
      if (input.operationId) {
        await prisma.productionOrderOperation.update({
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
        let inventory = order.product.inventory[0];
        
        if (!inventory) {
          // Criar registro de estoque
          inventory = await prisma.inventory.create({
            data: {
              materialId: order.product.id,
              companyId: ctx.companyId,
              inventoryType: "FINISHED",
              quantity: 0,
              availableQty: 0,
              unitCost: 0,
              totalCost: 0,
            },
          });
        }

        // Criar movimentação de entrada
        await prisma.inventoryMovement.create({
          data: {
            inventoryId: inventory.id,
            movementType: "ENTRY",
            quantity: input.quantity,
            unitCost: 0, // TODO: calcular custo de produção
            totalCost: 0,
            balanceAfter: inventory.quantity + input.quantity,
            documentType: "OP",
            documentNumber: String(order.code),
            documentId: order.id,
            notes: `Produção OP #${order.code} - ${order.product.description}`,
            userId: ctx.tenant.userId,
          },
        });

        // Atualizar estoque
        await prisma.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: { increment: input.quantity },
            availableQty: { increment: input.quantity },
            lastMovementAt: new Date(),
          },
        });
      }

      return { success: true, newProducedQty, isComplete };
    }),

  // Consumir material
  consumeMaterial: tenantProcedure
    .input(z.object({
      materialId: z.string(), // ID do ProductionOrderMaterial
      quantity: z.number().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      const orderMaterial = await prisma.productionOrderMaterial.findFirst({
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
      if (!inventory || inventory.availableQty < input.quantity) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Estoque insuficiente. Disponível: ${inventory?.availableQty || 0}`,
        });
      }

      const unitCost = inventory.unitCost;
      const totalCost = unitCost * input.quantity;

      // Atualizar material da OP
      await prisma.productionOrderMaterial.update({
        where: { id: input.materialId },
        data: {
          consumedQty: { increment: input.quantity },
          unitCost,
          totalCost: { increment: totalCost },
        },
      });

      // Criar movimentação de saída
      await prisma.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          movementType: "EXIT",
          quantity: input.quantity,
          unitCost,
          totalCost,
          balanceAfter: inventory.quantity - input.quantity,
          documentType: "OP",
          documentNumber: String(orderMaterial.order.code),
          documentId: orderMaterial.order.id,
          notes: `Consumo OP #${orderMaterial.order.code} - ${orderMaterial.material.description}`,
          userId: ctx.tenant.userId,
        },
      });

      // Atualizar estoque
      await prisma.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: { decrement: input.quantity },
          availableQty: { decrement: input.quantity },
          totalCost: { decrement: totalCost },
          lastMovementAt: new Date(),
        },
      });

      return { success: true };
    }),

  // Cancelar OP
  cancel: tenantProcedure
    .input(z.object({
      id: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const order = await prisma.productionOrder.findFirst({
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
      const hasConsumption = order.materials.some((m) => m.consumedQty > 0);
      if (hasConsumption) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível cancelar OP com materiais já consumidos",
        });
      }

      return prisma.productionOrder.update({
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
      prisma.productionOrder.groupBy({
        by: ["status"],
        where: tenantFilter(ctx.companyId, false),
        _count: true,
        _sum: { quantity: true, producedQty: true },
      }),
      prisma.productionOrder.count({
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: { in: ["PLANNED", "RELEASED", "IN_PROGRESS"] },
          priority: 1,
        },
      }),
      prisma.productionOrder.count({
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
