import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { auditCreate } from "../services/audit";
import { emitEvent } from "../services/events";

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
      const { materialId, inventoryType, movementType, quantity, unitCost, ...movementData } = input;
      const companyId = ctx.companyId;
      const isEntry = ["ENTRY", "RETURN", "PRODUCTION"].includes(movementType);

      // Usar transação interativa para garantir atomicidade
      const result = await ctx.prisma.$transaction(async (tx) => {
        // Buscar ou criar registro de estoque
        let inventory = await tx.inventory.findFirst({
          where: {
            materialId,
            inventoryType,
            companyId: companyId ?? null,
          },
        });

        if (!inventory) {
          inventory = await tx.inventory.create({
            data: {
              materialId,
              inventoryType,
              companyId,
              quantity: 0,
              availableQty: 0,
              unitCost: 0,
              totalCost: 0,
              version: 1,
            },
          });
        }

        // Calcular novo saldo
        const quantityChange = isEntry ? quantity : -quantity;
        const newQuantity = inventory.quantity + quantityChange;
        const totalCost = quantity * unitCost;

        // Verificar saldo disponível para saídas
        if (!isEntry && newQuantity < 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Saldo insuficiente. Disponível: ${inventory.quantity}, Solicitado: ${quantity}` });
        }

        // Criar movimento
        const movement = await tx.inventoryMovement.create({
          data: {
            inventoryId: inventory.id,
            movementType,
            quantity,
            unitCost,
            totalCost,
            balanceAfter: newQuantity,
            ...movementData,
          },
          include: {
            inventory: {
              include: { material: true },
            },
          },
        });

        // Atualizar estoque com optimistic locking
        const currentVersion = inventory.version;
        const updated = await tx.inventory.updateMany({
          where: {
            id: inventory.id,
            version: currentVersion, // Optimistic lock check
          },
          data: {
            quantity: newQuantity,
            availableQty: newQuantity - inventory.reservedQty,
            lastMovementAt: new Date(),
            version: currentVersion + 1, // Increment version
            // Recalcular custo médio para entradas
            ...(isEntry && unitCost > 0 && {
              unitCost: (inventory.totalCost + totalCost) / (inventory.quantity + quantity),
              totalCost: inventory.totalCost + totalCost,
            }),
          },
        });

        // Se nenhum registro foi atualizado, houve conflito de concorrência
        if (updated.count === 0) {
          throw new TRPCError({ code: "CONFLICT", message: "Conflito de concorrência detectado. O estoque foi modificado por outro usuário. Por favor, tente novamente." });
        }

        return movement;
      }, {
        maxWait: 5000, // 5 segundos de espera máxima
        timeout: 10000, // 10 segundos de timeout
      });

      // Auditar movimento (fora da transação para não bloquear)
      await auditCreate("InventoryMovement", result, `${movementType} - ${result.inventory.material.code}`, {
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
    // Buscar materiais com estoque abaixo do mínimo
    const lowStockItems = await ctx.prisma.inventory.findMany({
      where: {
        ...tenantFilter(ctx.companyId, false),
      },
      include: {
        material: {
          include: { category: true },
        },
      },
    });

    // Filtrar apenas os que estão abaixo do mínimo
    const alerts = lowStockItems
      .filter((inv) => inv.material.minQuantity && inv.quantity < inv.material.minQuantity)
      .map((inv) => ({
        inventoryId: inv.id,
        materialId: inv.material.id,
        materialCode: inv.material.code,
        materialDescription: inv.material.description,
        unit: inv.material.unit,
        category: inv.material.category?.name || "Sem categoria",
        currentStock: inv.quantity,
        minStock: inv.material.minQuantity || 0,
        deficit: (inv.material.minQuantity || 0) - inv.quantity,
        percentOfMin: inv.material.minQuantity 
          ? Math.round((inv.quantity / inv.material.minQuantity) * 100) 
          : 0,
        severity: inv.quantity <= 0 
          ? "critical" as const
          : inv.quantity < (inv.material.minQuantity || 0) * 0.5 
            ? "high" as const 
            : "medium" as const,
      }))
      .sort((a, b) => {
        // Ordenar por severidade e depois por déficit
        const severityOrder = { critical: 0, high: 1, medium: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return b.deficit - a.deficit;
      });

    return {
      totalAlerts: alerts.length,
      critical: alerts.filter((a) => a.severity === "critical").length,
      high: alerts.filter((a) => a.severity === "high").length,
      medium: alerts.filter((a) => a.severity === "medium").length,
      alerts,
    };
  }),

  // Gerar notificações para estoque baixo
  generateLowStockNotifications: tenantProcedure.mutation(async ({ ctx }) => {
    // Buscar itens com estoque baixo
    const lowStockItems = await ctx.prisma.inventory.findMany({
      where: {
        ...tenantFilter(ctx.companyId, false),
      },
      include: {
        material: true,
      },
    });

    const itemsToNotify = lowStockItems.filter(
      (inv) => inv.material.minQuantity && inv.quantity < inv.material.minQuantity
    );

    if (itemsToNotify.length === 0) {
      return { created: 0, message: "Nenhum item com estoque baixo" };
    }

    // Emitir eventos de estoque baixo para cada item
    for (const item of itemsToNotify) {
      const isCritical = item.quantity <= (item.material.minQuantity || 0) * 0.5;
      emitEvent(isCritical ? "inventory.criticalStock" : "inventory.lowStock", {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId ?? undefined,
      }, {
        materialId: item.materialId,
        materialName: item.material.description,
        currentQty: item.quantity,
        minQty: item.material.minQuantity || 0,
      });
    }

    return {
      created: itemsToNotify.length,
      itemCount: itemsToNotify.length,
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
      // Buscar estoque disponível
      const inventory = await ctx.prisma.inventory.findFirst({
        where: {
          materialId: input.materialId,
          ...tenantFilter(ctx.companyId, false),
        },
        include: { material: true },
      });

      if (!inventory) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Material não encontrado no estoque" });
      }

      if (inventory.availableQty < input.quantity) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Quantidade disponível insuficiente. Disponível: ${inventory.availableQty}` });
      }

      // Gerar código da reserva
      const lastReservation = await ctx.prisma.stockReservation.findFirst({
        where: tenantFilter(ctx.companyId, false),
        orderBy: { code: "desc" },
      });
      const nextCode = (lastReservation?.code || 0) + 1;

      // Criar reserva
      const reservation = await ctx.prisma.stockReservation.create({
        data: {
          code: nextCode,
          companyId: ctx.companyId,
          inventoryId: inventory.id,
          materialId: input.materialId,
          quantity: input.quantity,
          documentType: input.documentType,
          documentId: input.documentId,
          documentNumber: input.documentNumber,
          expiresAt: input.expiresAt,
          notes: input.notes,
          status: "ACTIVE",
          createdBy: ctx.tenant.userId,
        },
        include: {
          material: true,
          inventory: true,
        },
      });

      // Atualizar quantidade reservada no estoque
      await ctx.prisma.inventory.update({
        where: { id: inventory.id },
        data: {
          reservedQty: inventory.reservedQty + input.quantity,
          availableQty: inventory.availableQty - input.quantity,
        },
      });

      await auditCreate("StockReservation", reservation, String(nextCode), {
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
      const reservation = await ctx.prisma.stockReservation.findFirst({
        where: {
          id: input.reservationId,
          ...tenantFilter(ctx.companyId, false),
          status: "ACTIVE",
        },
        include: { inventory: true },
      });

      if (!reservation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reserva não encontrada ou já liberada" });
      }

      // Atualizar reserva
      const updated = await ctx.prisma.stockReservation.update({
        where: { id: input.reservationId },
        data: {
          status: "RELEASED",
          releasedAt: new Date(),
          releasedBy: ctx.tenant.userId,
          releaseReason: input.reason,
        },
      });

      // Devolver quantidade ao estoque disponível
      await ctx.prisma.inventory.update({
        where: { id: reservation.inventoryId },
        data: {
          reservedQty: reservation.inventory.reservedQty - reservation.quantity,
          availableQty: reservation.inventory.availableQty + reservation.quantity,
        },
      });

      return updated;
    }),

  // Consumir reserva (baixa efetiva)
  consumeReservation: tenantProcedure
    .input(z.object({
      reservationId: z.string(),
      quantity: z.number().positive().optional(), // Se não informado, consome tudo
    }))
    .mutation(async ({ ctx, input }) => {
      const reservation = await ctx.prisma.stockReservation.findFirst({
        where: {
          id: input.reservationId,
          ...tenantFilter(ctx.companyId, false),
          status: "ACTIVE",
        },
        include: { inventory: { include: { material: true } } },
      });

      if (!reservation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reserva não encontrada ou já consumida" });
      }

      const quantityToConsume = input.quantity || reservation.quantity;
      if (quantityToConsume > reservation.quantity) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Quantidade a consumir maior que a reservada" });
      }

      // Criar movimento de saída
      await ctx.prisma.inventoryMovement.create({
        data: {
          inventoryId: reservation.inventoryId,
          movementType: "EXIT",
          quantity: quantityToConsume,
          unitCost: reservation.inventory.unitCost,
          totalCost: quantityToConsume * reservation.inventory.unitCost,
          balanceAfter: reservation.inventory.quantity - quantityToConsume,
          documentType: reservation.documentType,
          documentNumber: reservation.documentNumber,
          notes: `Consumo de reserva #${reservation.code}`,
          userId: ctx.tenant.userId,
        },
      });

      // Atualizar estoque
      await ctx.prisma.inventory.update({
        where: { id: reservation.inventoryId },
        data: {
          quantity: reservation.inventory.quantity - quantityToConsume,
          reservedQty: reservation.inventory.reservedQty - quantityToConsume,
          totalCost: (reservation.inventory.quantity - quantityToConsume) * reservation.inventory.unitCost,
          lastMovementAt: new Date(),
        },
      });

      // Atualizar ou finalizar reserva
      const remainingQty = reservation.quantity - quantityToConsume;
      const updated = await ctx.prisma.stockReservation.update({
        where: { id: input.reservationId },
        data: {
          quantity: remainingQty,
          consumedQty: (reservation.consumedQty || 0) + quantityToConsume,
          status: remainingQty <= 0 ? "CONSUMED" : "ACTIVE",
          ...(remainingQty <= 0 && { consumedAt: new Date() }),
        },
      });

      return updated;
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
