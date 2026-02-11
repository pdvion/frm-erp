import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { auditCreate } from "../services/audit";
import { emitEvent } from "../services/events";
import { InventoryService } from "../services/inventory";

export const inventoryRouter = createTRPCRouter({
  // Listar estoque (com filtro de tenant)
  list: tenantProcedure
    .input(
      z.object({
        search: z.string().nullish(),
        inventoryType: z.enum(["RAW_MATERIAL", "SEMI_FINISHED", "FINISHED", "CRITICAL", "DEAD", "SCRAP"]).nullish(),
        belowMinimum: z.boolean().nullish(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search, inventoryType, belowMinimum, page = 1, limit = 20 } = input ?? {};
      
      const where = {
        ...tenantFilter(ctx.companyId, false), // Inventory não tem isShared
        ...(inventoryType && { inventoryType }),
        ...(search && {
          material: {
            OR: [
              { description: { contains: search, mode: "insensitive" as const } },
              { internalCode: { contains: search, mode: "insensitive" as const } },
            ],
          },
        }),
      };

      const [inventory, total] = await Promise.all([
        ctx.prisma.inventory.findMany({
          where,
          include: {
            material: {
              include: { category: true },
            },
          },
          orderBy: { material: { description: "asc" } },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.inventory.count({ where }),
      ]);

      // Filtrar por estoque abaixo do mínimo se necessário
      let filteredInventory = inventory;
      if (belowMinimum) {
        filteredInventory = inventory.filter(
          (inv: typeof inventory[number]) => inv.quantity < (inv.material.minQuantity ?? 0)
        );
      }

      return {
        inventory: filteredInventory,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Buscar estoque por material
  byMaterialId: tenantProcedure
    .input(z.object({ materialId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.inventory.findMany({
        where: { 
          materialId: input.materialId,
          ...tenantFilter(ctx.companyId, false), // Inventory não tem isShared
        },
        include: {
          material: true,
          movements: {
            orderBy: { movementDate: "desc" },
            take: 50,
          },
        },
      });
    }),

  // Registrar movimento de estoque (com locking otimista)
  createMovement: tenantProcedure
    .input(
      z.object({
        materialId: z.string(),
        inventoryType: z.enum(["RAW_MATERIAL", "SEMI_FINISHED", "FINISHED", "CRITICAL", "DEAD", "SCRAP"]).default("RAW_MATERIAL"),
        movementType: z.enum(["ENTRY", "EXIT", "TRANSFER", "ADJUSTMENT", "RETURN", "PRODUCTION"]),
        quantity: z.number(),
        unitCost: z.number().default(0),
        documentType: z.string().optional(),
        documentNumber: z.string().optional(),
        supplierId: z.string().optional(),
        notes: z.string().optional(),
        userId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const inventoryService = new InventoryService(ctx.prisma);
      const result = await inventoryService.createMovement({
        ...input,
        companyId: ctx.companyId,
      });

      // Auditar movimento (fora da transação para não bloquear)
      await auditCreate("InventoryMovement", result, `${input.movementType} - ${result.inventory.material.code}`, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return result;
    }),

  // Listar movimentos
  listMovements: tenantProcedure
    .input(
      z.object({
        inventoryId: z.string().optional(),
        materialId: z.string().optional(),
        movementType: z.enum(["ENTRY", "EXIT", "TRANSFER", "ADJUSTMENT", "RETURN", "PRODUCTION"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { inventoryId, materialId, movementType, startDate, endDate, page = 1, limit = 50 } = input ?? {};

      const where = {
        inventory: { ...tenantFilter(ctx.companyId, false) },
        ...(inventoryId && { inventoryId }),
        ...(materialId && { inventory: { materialId, ...tenantFilter(ctx.companyId, false) } }),
        ...(movementType && { movementType }),
        ...(startDate && endDate && {
          movementDate: {
            gte: startDate,
            lte: endDate,
          },
        }),
      };

      const [movements, total] = await Promise.all([
        ctx.prisma.inventoryMovement.findMany({
          where,
          include: {
            inventory: {
              include: { material: true },
            },
            supplier: true,
            user: true,
          },
          orderBy: { movementDate: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.inventoryMovement.count({ where }),
      ]);

      return {
        movements,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Verificar itens com estoque abaixo do mínimo
  checkLowStock: tenantProcedure.query(async ({ ctx }) => {
    const inventoryService = new InventoryService(ctx.prisma);
    return inventoryService.checkLowStock(ctx.companyId);
  }),

  // Gerar notificações para estoque baixo
  generateLowStockNotifications: tenantProcedure.mutation(async ({ ctx }) => {
    const inventoryService = new InventoryService(ctx.prisma);
    const { alerts } = await inventoryService.checkLowStock(ctx.companyId);

    if (alerts.length === 0) {
      return { created: 0, message: "Nenhum item com estoque baixo" };
    }

    // Emitir eventos de estoque baixo para cada item
    for (const alert of alerts) {
      emitEvent(alert.severity === "critical" ? "inventory.criticalStock" : "inventory.lowStock", {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId ?? undefined,
      }, {
        materialId: alert.materialId,
        materialName: alert.materialDescription,
        currentQty: alert.currentStock,
        minQty: alert.minStock,
      });
    }

    return {
      created: alerts.length,
      itemCount: alerts.length,
    };
  }),

  // ==========================================================================
  // RESERVAS DE ESTOQUE
  // ==========================================================================

  // Criar reserva de material
  createReservation: tenantProcedure
    .input(z.object({
      materialId: z.string(),
      quantity: z.number().positive(),
      documentType: z.string(), // REQUISITION, PRODUCTION_ORDER, SALES_ORDER
      documentId: z.string(),
      documentNumber: z.string().optional(),
      expiresAt: z.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const inventoryService = new InventoryService(ctx.prisma);
      const reservation = await inventoryService.createReservation({
        ...input,
        companyId: ctx.companyId,
        userId: ctx.tenant.userId,
      });

      await auditCreate("StockReservation", reservation, String(reservation.code), {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return reservation;
    }),

  // Liberar reserva
  releaseReservation: tenantProcedure
    .input(z.object({
      reservationId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const inventoryService = new InventoryService(ctx.prisma);
      return inventoryService.releaseReservation({
        ...input,
        companyId: ctx.companyId,
        userId: ctx.tenant.userId,
      });
    }),

  // Consumir reserva (baixa efetiva)
  consumeReservation: tenantProcedure
    .input(z.object({
      reservationId: z.string(),
      quantity: z.number().positive().optional(), // Se não informado, consome tudo
    }))
    .mutation(async ({ ctx, input }) => {
      const inventoryService = new InventoryService(ctx.prisma);
      return inventoryService.consumeReservation({
        ...input,
        companyId: ctx.companyId,
        userId: ctx.tenant.userId,
      });
    }),

  // Listar reservas
  listReservations: tenantProcedure
    .input(z.object({
      materialId: z.string().optional(),
      documentType: z.string().optional(),
      documentId: z.string().optional(),
      status: z.enum(["ACTIVE", "CONSUMED", "RELEASED", "EXPIRED"]).optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { materialId, documentType, documentId, status, page = 1, limit = 20 } = input ?? {};

      const where = {
        ...tenantFilter(ctx.companyId, false),
        ...(materialId && { materialId }),
        ...(documentType && { documentType }),
        ...(documentId && { documentId }),
        ...(status && { status }),
      };

      const [reservations, total] = await Promise.all([
        ctx.prisma.stockReservation.findMany({
          where,
          include: {
            material: { select: { id: true, code: true, description: true, unit: true } },
            inventory: true,
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.stockReservation.count({ where }),
      ]);

      return { reservations, total };
    }),

  // ==========================================================================
  // DASHBOARD DE ESTOQUE
  // ==========================================================================

  dashboard: tenantProcedure.query(async ({ ctx }) => {
    const [
      totalItems,
      totalValue,
      lowStockCount,
      recentMovements,
      pendingTransfers,
      activeReservations,
    ] = await Promise.all([
      // Total de itens em estoque
      ctx.prisma.inventory.count({
        where: { ...tenantFilter(ctx.companyId, false), quantity: { gt: 0 } },
      }),
      // Valor total em estoque
      ctx.prisma.inventory.aggregate({
        where: tenantFilter(ctx.companyId, false),
        _sum: { totalCost: true },
      }),
      // Itens com estoque baixo
      ctx.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM inventory i
        JOIN materials m ON i."materialId" = m.id
        WHERE i."companyId" = ${ctx.companyId}::uuid
        AND i.quantity < COALESCE(m."minQuantity", 0)
        AND m."minQuantity" > 0
      `,
      // Movimentos recentes
      ctx.prisma.inventoryMovement.findMany({
        where: { inventory: tenantFilter(ctx.companyId, false) },
        include: {
          inventory: { include: { material: { select: { code: true, description: true } } } },
        },
        orderBy: { movementDate: "desc" },
        take: 10,
      }),
      // Transferências pendentes (usando enum TransferStatus)
      ctx.prisma.stockTransfer.count({
        where: { ...tenantFilter(ctx.companyId, false), status: "PENDING" as const },
      }),
      // Reservas ativas
      ctx.prisma.stockReservation.count({
        where: { ...tenantFilter(ctx.companyId, false), status: "ACTIVE" },
      }),
    ]);

    return {
      totalItems,
      totalValue: totalValue._sum.totalCost || 0,
      lowStockCount: Number(lowStockCount[0]?.count || 0),
      pendingTransfers,
      activeReservations,
      recentMovements,
    };
  }),
});
