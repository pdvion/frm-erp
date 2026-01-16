import { z } from "zod";
import { createTRPCRouter, tenantProcedure, publicProcedure, tenantFilter } from "../trpc";

export const inventoryRouter = createTRPCRouter({
  // Listar estoque (com filtro de tenant)
  list: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        inventoryType: z.enum(["RAW_MATERIAL", "SEMI_FINISHED", "FINISHED", "CRITICAL", "DEAD", "SCRAP"]).optional(),
        belowMinimum: z.boolean().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search, inventoryType, belowMinimum, page = 1, limit = 20 } = input ?? {};
      
      const where = {
        ...tenantFilter(ctx.companyId),
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
          ...tenantFilter(ctx.companyId),
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

  // Registrar movimento de estoque
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

      // Buscar ou criar registro de estoque
      let inventory = await ctx.prisma.inventory.findFirst({
        where: {
          materialId,
          inventoryType,
          companyId: companyId ?? null,
        },
      });

      if (!inventory) {
        inventory = await ctx.prisma.inventory.create({
          data: {
            materialId,
            inventoryType,
            companyId,
            quantity: 0,
            availableQty: 0,
            unitCost: 0,
            totalCost: 0,
          },
        });
      }

      // Calcular novo saldo
      const isEntry = ["ENTRY", "RETURN", "PRODUCTION"].includes(movementType);
      const quantityChange = isEntry ? quantity : -quantity;
      const newQuantity = inventory.quantity + quantityChange;
      const totalCost = quantity * unitCost;

      // Criar movimento
      const movement = await ctx.prisma.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          movementType,
          quantity,
          unitCost,
          totalCost,
          balanceAfter: newQuantity,
          ...movementData,
        },
      });

      // Atualizar estoque
      await ctx.prisma.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: newQuantity,
          availableQty: newQuantity - inventory.reservedQty,
          lastMovementAt: new Date(),
          // Recalcular custo médio para entradas
          ...(isEntry && unitCost > 0 && {
            unitCost: (inventory.totalCost + totalCost) / (inventory.quantity + quantity),
            totalCost: inventory.totalCost + totalCost,
          }),
        },
      });

      return movement;
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
        inventory: { ...tenantFilter(ctx.companyId) },
        ...(inventoryId && { inventoryId }),
        ...(materialId && { inventory: { materialId, ...tenantFilter(ctx.companyId) } }),
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
});
