import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const pickingRouter = createTRPCRouter({
  // Listar picking lists
  list: tenantProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
        priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
        type: z.enum(["REQUISITION", "SALES_ORDER", "PRODUCTION_ORDER", "TRANSFER"]).optional(),
        assignedTo: z.string().uuid().optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { status, priority, type, assignedTo, search, page = 1, limit = 20 } = input || {};

      const where: Prisma.PickingListWhereInput = {
        companyId: ctx.companyId,
        ...(status && { status }),
        ...(priority && { priority }),
        ...(type && { type }),
        ...(assignedTo && { assignedTo }),
        ...(search && {
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            { notes: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [pickingLists, total] = await Promise.all([
        ctx.prisma.pickingList.findMany({
          where,
          include: {
            assignee: { select: { id: true, name: true } },
            creator: { select: { id: true, name: true } },
            _count: { select: { items: true } },
          },
          orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.pickingList.count({ where }),
      ]);

      return {
        pickingLists,
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  // Buscar por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const pickingList = await ctx.prisma.pickingList.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
          items: {
            include: {
              material: { select: { id: true, code: true, description: true, unit: true } },
              location: { select: { id: true, code: true, name: true } },
              picker: { select: { id: true, name: true } },
            },
            orderBy: { sequence: "asc" },
          },
          verifications: {
            include: {
              verifier: { select: { id: true, name: true } },
            },
            orderBy: { verifiedAt: "desc" },
          },
        },
      });

      if (!pickingList) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lista de separação não encontrada" });
      }

      return pickingList;
    }),

  // Criar picking list
  create: tenantProcedure
    .input(
      z.object({
        type: z.enum(["REQUISITION", "SALES_ORDER", "PRODUCTION_ORDER", "TRANSFER"]),
        sourceId: z.string().uuid().optional(),
        sourceType: z.string().optional(),
        priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
        assignedTo: z.string().uuid().optional(),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            materialId: z.string().uuid(),
            locationId: z.string().uuid().optional(),
            requestedQty: z.number().positive(),
            lotNumber: z.string().optional(),
            serialNumber: z.string().optional(),
            expirationDate: z.date().optional(),
          })
        ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Gerar código sequencial
      const lastPicking = await ctx.prisma.pickingList.findFirst({
        where: { companyId: ctx.companyId },
        orderBy: { code: "desc" },
        select: { code: true },
      });

      const nextNumber = lastPicking
        ? parseInt(lastPicking.code.replace("PK", "")) + 1
        : 1;
      const code = `PK${nextNumber.toString().padStart(6, "0")}`;

      const pickingList = await ctx.prisma.pickingList.create({
        data: {
          companyId: ctx.companyId,
          code,
          type: input.type,
          sourceId: input.sourceId,
          sourceType: input.sourceType,
          priority: input.priority,
          assignedTo: input.assignedTo,
          notes: input.notes,
          createdBy: ctx.tenant.userId,
          items: {
            create: input.items.map((item, index) => ({
              materialId: item.materialId,
              locationId: item.locationId,
              requestedQty: item.requestedQty,
              lotNumber: item.lotNumber,
              serialNumber: item.serialNumber,
              expirationDate: item.expirationDate,
              sequence: index + 1,
            })),
          },
        },
        include: {
          items: {
            include: {
              material: { select: { id: true, code: true, description: true, unit: true } },
            },
          },
        },
      });

      return pickingList;
    }),

  // Criar picking list a partir de requisição
  createFromRequisition: tenantProcedure
    .input(
      z.object({
        requisitionId: z.string().uuid(),
        priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
        assignedTo: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const requisition = await ctx.prisma.materialRequisition.findFirst({
        where: { id: input.requisitionId, ...tenantFilter(ctx.companyId, false) },
        include: {
          items: {
            include: {
              material: true,
            },
          },
        },
      });

      if (!requisition) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Requisição não encontrada" });
      }

      if (requisition.status !== "APPROVED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Requisição precisa estar aprovada" });
      }

      // Gerar código sequencial
      const lastPicking = await ctx.prisma.pickingList.findFirst({
        where: { companyId: ctx.companyId },
        orderBy: { code: "desc" },
        select: { code: true },
      });

      const nextNumber = lastPicking
        ? parseInt(lastPicking.code.replace("PK", "")) + 1
        : 1;
      const code = `PK${nextNumber.toString().padStart(6, "0")}`;

      const pickingList = await ctx.prisma.pickingList.create({
        data: {
          companyId: ctx.companyId,
          code,
          type: "REQUISITION",
          sourceId: requisition.id,
          sourceType: "MaterialRequisition",
          priority: input.priority,
          assignedTo: input.assignedTo,
          createdBy: ctx.tenant.userId,
          items: {
            create: requisition.items.map((item, index) => ({
              materialId: item.materialId,
              requestedQty: item.requestedQty,
              sequence: index + 1,
            })),
          },
        },
        include: {
          items: {
            include: {
              material: { select: { id: true, code: true, description: true, unit: true } },
            },
          },
        },
      });

      // Atualizar status da requisição
      await ctx.prisma.materialRequisition.update({
        where: { id: requisition.id },
        data: { status: "IN_SEPARATION" },
      });

      return pickingList;
    }),

  // Iniciar separação
  start: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const pickingList = await ctx.prisma.pickingList.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!pickingList) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lista de separação não encontrada" });
      }

      if (pickingList.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Lista já foi iniciada" });
      }

      return ctx.prisma.pickingList.update({
        where: { id: input.id },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
          assignedTo: pickingList.assignedTo || ctx.tenant.userId,
        },
      });
    }),

  // Registrar item separado
  pickItem: tenantProcedure
    .input(
      z.object({
        itemId: z.string().uuid(),
        pickedQty: z.number().min(0),
        locationId: z.string().uuid().optional(),
        lotNumber: z.string().optional(),
        serialNumber: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.pickingListItem.findUnique({
        where: { id: input.itemId },
        include: {
          pickingList: true,
        },
      });

      if (!item || item.pickingList.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado" });
      }

      if (item.pickingList.status !== "IN_PROGRESS") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Lista não está em separação" });
      }

      // Determinar status do item
      let status: "PENDING" | "PARTIAL" | "PICKED" | "NOT_FOUND" = "PENDING";
      if (input.pickedQty === 0) {
        status = "NOT_FOUND";
      } else if (input.pickedQty < item.requestedQty) {
        status = "PARTIAL";
      } else {
        status = "PICKED";
      }

      return ctx.prisma.pickingListItem.update({
        where: { id: input.itemId },
        data: {
          pickedQty: input.pickedQty,
          status,
          locationId: input.locationId,
          lotNumber: input.lotNumber,
          serialNumber: input.serialNumber,
          notes: input.notes,
          pickedAt: new Date(),
          pickedBy: ctx.tenant.userId,
        },
      });
    }),

  // Completar separação
  complete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const pickingList = await ctx.prisma.pickingList.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          items: true,
        },
      });

      if (!pickingList) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lista de separação não encontrada" });
      }

      if (pickingList.status !== "IN_PROGRESS") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Lista não está em separação" });
      }

      // Verificar se todos os itens foram processados
      const pendingItems = pickingList.items.filter((i) => i.status === "PENDING");
      if (pendingItems.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${pendingItems.length} item(s) ainda não foram separados`,
        });
      }

      return ctx.prisma.pickingList.update({
        where: { id: input.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    }),

  // Cancelar picking list
  cancel: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const pickingList = await ctx.prisma.pickingList.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!pickingList) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lista de separação não encontrada" });
      }

      if (pickingList.status === "COMPLETED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Lista já foi concluída" });
      }

      return ctx.prisma.pickingList.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          notes: input.reason
            ? `${pickingList.notes || ""}\n[CANCELADO] ${input.reason}`.trim()
            : pickingList.notes,
        },
      });
    }),

  // Verificar/conferir picking list
  verify: tenantProcedure
    .input(
      z.object({
        pickingListId: z.string().uuid(),
        status: z.enum(["APPROVED", "REJECTED", "PARTIAL"]),
        discrepancies: z.array(
          z.object({
            itemId: z.string().uuid(),
            expectedQty: z.number(),
            actualQty: z.number(),
            reason: z.string().optional(),
          })
        ).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const pickingList = await ctx.prisma.pickingList.findFirst({
        where: { id: input.pickingListId, companyId: ctx.companyId },
      });

      if (!pickingList) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lista de separação não encontrada" });
      }

      if (pickingList.status !== "COMPLETED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Lista precisa estar concluída para verificação" });
      }

      return ctx.prisma.pickingVerification.create({
        data: {
          pickingListId: input.pickingListId,
          verifiedBy: ctx.tenant.userId!,
          status: input.status,
          discrepancies: input.discrepancies as Prisma.InputJsonValue ?? [],
          notes: input.notes,
        },
      });
    }),

  // Dashboard de picking
  getDashboard: tenantProcedure.query(async ({ ctx }) => {
    const [statusCounts, priorityCounts, recentLists, myPendingLists] = await Promise.all([
      // Contagem por status
      ctx.prisma.pickingList.groupBy({
        by: ["status"],
        where: { companyId: ctx.companyId },
        _count: true,
      }),
      // Contagem por prioridade (apenas pendentes e em progresso)
      ctx.prisma.pickingList.groupBy({
        by: ["priority"],
        where: {
          companyId: ctx.companyId,
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
        _count: true,
      }),
      // Listas recentes
      ctx.prisma.pickingList.findMany({
        where: { companyId: ctx.companyId },
        include: {
          assignee: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      // Minhas listas pendentes
      ctx.prisma.pickingList.findMany({
        where: {
          companyId: ctx.companyId,
          assignedTo: ctx.tenant.userId,
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
        include: {
          _count: { select: { items: true } },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        take: 5,
      }),
    ]);

    const statusMap = statusCounts.reduce(
      (acc, item) => ({ ...acc, [item.status]: item._count }),
      { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 }
    );

    const priorityMap = priorityCounts.reduce(
      (acc, item) => ({ ...acc, [item.priority]: item._count }),
      { LOW: 0, NORMAL: 0, HIGH: 0, URGENT: 0 }
    );

    return {
      status: statusMap,
      priority: priorityMap,
      recentLists,
      myPendingLists,
    };
  }),

  // Listar usuários disponíveis para atribuição
  listAssignees: tenantProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      where: {
        isActive: true,
        userCompanies: {
          some: { companyId: ctx.companyId },
        },
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
  }),
});
