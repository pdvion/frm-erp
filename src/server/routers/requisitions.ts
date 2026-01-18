import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const requisitionsRouter = createTRPCRouter({
  // Listar requisições
  list: tenantProcedure
    .input(z.object({
      status: z.enum(["DRAFT", "PENDING", "APPROVED", "IN_SEPARATION", "PARTIAL", "COMPLETED", "CANCELLED", "ALL"]).optional(),
      type: z.enum(["PRODUCTION", "MAINTENANCE", "ADMINISTRATIVE", "PROJECT", "OTHER", "ALL"]).optional(),
      search: z.string().optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { 
        status, 
        type,
        search,
        dateFrom,
        dateTo,
        page = 1, 
        limit = 20,
      } = input || {};

      const where: Prisma.MaterialRequisitionWhereInput = {
        ...tenantFilter(ctx.companyId, false),
      };

      if (status && status !== "ALL") {
        where.status = status;
      }

      if (type && type !== "ALL") {
        where.type = type;
      }

      if (dateFrom || dateTo) {
        where.requestedAt = {};
        if (dateFrom) where.requestedAt.gte = dateFrom;
        if (dateTo) where.requestedAt.lte = dateTo;
      }

      if (search) {
        where.OR = [
          { orderNumber: { contains: search, mode: "insensitive" as const } },
          { costCenter: { contains: search, mode: "insensitive" as const } },
          { department: { contains: search, mode: "insensitive" as const } },
          { notes: { contains: search, mode: "insensitive" as const } },
        ];
      }

      const [requisitions, total] = await Promise.all([
        prisma.materialRequisition.findMany({
          where,
          include: {
            items: {
              include: {
                material: {
                  select: { id: true, code: true, description: true, unit: true },
                },
              },
            },
            _count: { select: { items: true } },
          },
          orderBy: { requestedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.materialRequisition.count({ where }),
      ]);

      return {
        requisitions,
        total,
        pages: Math.ceil(total / limit),
        page,
      };
    }),

  // Buscar requisição por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const requisition = await prisma.materialRequisition.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId, false),
        },
        include: {
          items: {
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
        },
      });

      if (!requisition) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Requisição não encontrada",
        });
      }

      return requisition;
    }),

  // Criar requisição
  create: tenantProcedure
    .input(z.object({
      type: z.enum(["PRODUCTION", "MAINTENANCE", "ADMINISTRATIVE", "PROJECT", "OTHER"]).default("PRODUCTION"),
      costCenter: z.string().optional(),
      projectCode: z.string().optional(),
      orderNumber: z.string().optional(),
      department: z.string().optional(),
      priority: z.number().min(1).max(4).default(3),
      notes: z.string().optional(),
      items: z.array(z.object({
        materialId: z.string(),
        requestedQty: z.number().positive(),
        notes: z.string().optional(),
      })).min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      // Obter próximo código
      const lastRequisition = await prisma.materialRequisition.findFirst({
        where: { companyId: ctx.companyId },
        orderBy: { code: "desc" },
        select: { code: true },
      });
      const nextCode = (lastRequisition?.code || 0) + 1;

      // Criar requisição com itens
      const requisition = await prisma.materialRequisition.create({
        data: {
          code: nextCode,
          companyId: ctx.companyId,
          type: input.type,
          costCenter: input.costCenter,
          projectCode: input.projectCode,
          orderNumber: input.orderNumber,
          department: input.department,
          priority: input.priority,
          notes: input.notes,
          requestedBy: ctx.tenant.userId,
          createdBy: ctx.tenant.userId,
          status: "DRAFT",
          items: {
            create: input.items.map((item) => ({
              materialId: item.materialId,
              requestedQty: item.requestedQty,
              notes: item.notes,
            })),
          },
        },
        include: {
          items: {
            include: {
              material: true,
            },
          },
        },
      });

      return requisition;
    }),

  // Adicionar item à requisição
  addItem: tenantProcedure
    .input(z.object({
      requisitionId: z.string(),
      materialId: z.string(),
      requestedQty: z.number().positive(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const requisition = await prisma.materialRequisition.findFirst({
        where: {
          id: input.requisitionId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!requisition) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Requisição não encontrada",
        });
      }

      if (requisition.status !== "DRAFT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Só é possível adicionar itens em requisições em rascunho",
        });
      }

      return prisma.materialRequisitionItem.create({
        data: {
          requisitionId: input.requisitionId,
          materialId: input.materialId,
          requestedQty: input.requestedQty,
          notes: input.notes,
        },
        include: {
          material: true,
        },
      });
    }),

  // Remover item da requisição
  removeItem: tenantProcedure
    .input(z.object({
      itemId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const item = await prisma.materialRequisitionItem.findFirst({
        where: { id: input.itemId },
        include: {
          requisition: true,
        },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item não encontrado",
        });
      }

      if (item.requisition.companyId !== ctx.companyId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão",
        });
      }

      if (item.requisition.status !== "DRAFT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Só é possível remover itens de requisições em rascunho",
        });
      }

      return prisma.materialRequisitionItem.delete({
        where: { id: input.itemId },
      });
    }),

  // Enviar para aprovação
  submit: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const requisition = await prisma.materialRequisition.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId, false),
        },
        include: { items: true },
      });

      if (!requisition) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Requisição não encontrada",
        });
      }

      if (requisition.status !== "DRAFT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Requisição já foi enviada",
        });
      }

      if (requisition.items.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Requisição não possui itens",
        });
      }

      return prisma.materialRequisition.update({
        where: { id: input.id },
        data: { status: "PENDING" },
      });
    }),

  // Aprovar requisição
  approve: tenantProcedure
    .input(z.object({
      id: z.string(),
      items: z.array(z.object({
        itemId: z.string(),
        approvedQty: z.number().min(0),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const requisition = await prisma.materialRequisition.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId, false),
        },
        include: { items: true },
      });

      if (!requisition) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Requisição não encontrada",
        });
      }

      if (requisition.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Requisição não está pendente de aprovação",
        });
      }

      // Atualizar quantidades aprovadas
      if (input.items) {
        for (const item of input.items) {
          await prisma.materialRequisitionItem.update({
            where: { id: item.itemId },
            data: { approvedQty: item.approvedQty },
          });
        }
      } else {
        // Aprovar todas as quantidades solicitadas
        for (const item of requisition.items) {
          await prisma.materialRequisitionItem.update({
            where: { id: item.id },
            data: { approvedQty: item.requestedQty },
          });
        }
      }

      return prisma.materialRequisition.update({
        where: { id: input.id },
        data: {
          status: "APPROVED",
          approvedBy: ctx.tenant.userId,
          approvedAt: new Date(),
        },
      });
    }),

  // Iniciar separação
  startSeparation: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const requisition = await prisma.materialRequisition.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!requisition) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Requisição não encontrada",
        });
      }

      if (requisition.status !== "APPROVED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Requisição não está aprovada",
        });
      }

      return prisma.materialRequisition.update({
        where: { id: input.id },
        data: {
          status: "IN_SEPARATION",
          separatedBy: ctx.tenant.userId,
        },
      });
    }),

  // Separar item (baixa no estoque)
  separateItem: tenantProcedure
    .input(z.object({
      itemId: z.string(),
      quantity: z.number().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      const item = await prisma.materialRequisitionItem.findFirst({
        where: { id: input.itemId },
        include: {
          requisition: true,
          material: {
            include: {
              inventory: {
                where: { companyId: ctx.companyId },
              },
            },
          },
        },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item não encontrado",
        });
      }

      if (item.requisition.companyId !== ctx.companyId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão",
        });
      }

      if (!["APPROVED", "IN_SEPARATION", "PARTIAL"].includes(item.requisition.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Requisição não está em status válido para separação",
        });
      }

      const approvedQty = item.approvedQty ?? item.requestedQty;
      const remainingQty = approvedQty - item.separatedQty;

      if (input.quantity > remainingQty) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Quantidade excede o restante a separar (${remainingQty})`,
        });
      }

      // Verificar estoque disponível
      const inventory = item.material.inventory[0];
      if (!inventory || inventory.availableQty < input.quantity) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Estoque insuficiente. Disponível: ${inventory?.availableQty || 0}`,
        });
      }

      // Calcular custo
      const unitCost = inventory.unitCost;
      const totalCost = unitCost * input.quantity;

      // Atualizar item
      const newSeparatedQty = item.separatedQty + input.quantity;
      await prisma.materialRequisitionItem.update({
        where: { id: input.itemId },
        data: {
          separatedQty: newSeparatedQty,
          unitCost,
          totalCost: item.totalCost + totalCost,
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
          documentType: "REQ",
          documentNumber: String(item.requisition.code),
          documentId: item.requisition.id,
          notes: `Requisição #${item.requisition.code} - ${item.material.description}`,
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

      // Verificar se requisição foi completada
      const allItems = await prisma.materialRequisitionItem.findMany({
        where: { requisitionId: item.requisition.id },
      });

      const allCompleted = allItems.every((i) => {
        const approved = i.approvedQty ?? i.requestedQty;
        return i.separatedQty >= approved;
      });

      const anyCompleted = allItems.some((i) => i.separatedQty > 0);

      let newStatus = item.requisition.status;
      if (allCompleted) {
        newStatus = "COMPLETED";
      } else if (anyCompleted) {
        newStatus = "PARTIAL";
      }

      if (newStatus !== item.requisition.status) {
        await prisma.materialRequisition.update({
          where: { id: item.requisition.id },
          data: {
            status: newStatus,
            separatedAt: allCompleted ? new Date() : undefined,
          },
        });
      }

      return { success: true, newSeparatedQty };
    }),

  // Cancelar requisição
  cancel: tenantProcedure
    .input(z.object({
      id: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const requisition = await prisma.materialRequisition.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId, false),
        },
        include: { items: true },
      });

      if (!requisition) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Requisição não encontrada",
        });
      }

      // Verificar se já houve separação
      const hasSeparation = requisition.items.some((i) => i.separatedQty > 0);
      if (hasSeparation) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível cancelar requisição com itens já separados",
        });
      }

      return prisma.materialRequisition.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          notes: `${requisition.notes || ""}\n[CANCELADO] ${input.reason}`.trim(),
        },
      });
    }),

  // Estatísticas
  stats: tenantProcedure.query(async ({ ctx }) => {
    const [byStatus, byType, recentCount] = await Promise.all([
      prisma.materialRequisition.groupBy({
        by: ["status"],
        where: tenantFilter(ctx.companyId, false),
        _count: true,
      }),
      prisma.materialRequisition.groupBy({
        by: ["type"],
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: { notIn: ["CANCELLED", "COMPLETED"] },
        },
        _count: true,
      }),
      prisma.materialRequisition.count({
        where: {
          ...tenantFilter(ctx.companyId, false),
          requestedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // últimos 7 dias
          },
        },
      }),
    ]);

    return {
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byType: byType.map((t) => ({ type: t.type, count: t._count })),
      recentCount,
    };
  }),
});
