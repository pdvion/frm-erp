import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { Prisma } from "@prisma/client";

export const stockLocationsRouter = createTRPCRouter({
  // Listar locais de estoque
  list: tenantProcedure
    .input(z.object({
      search: z.string().optional(),
      type: z.enum(["WAREHOUSE", "PRODUCTION", "QUALITY", "SHIPPING", "RECEIVING", "EXTERNAL", "ALL"]).optional(),
      includeInactive: z.boolean().default(false),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { search, type, includeInactive } = input || {};

      const where: Prisma.StockLocationWhereInput = {
        ...tenantFilter(ctx.companyId),
        ...(search && {
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(type && type !== "ALL" && { type }),
        ...(!includeInactive && { isActive: true }),
      };

      const locations = await ctx.prisma.stockLocation.findMany({
        where,
        include: {
          parent: { select: { id: true, code: true, name: true } },
          _count: { select: { locationInventory: true, children: true } },
        },
        orderBy: { code: "asc" },
      });

      return locations;
    }),

  // Obter local por ID
  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const location = await ctx.prisma.stockLocation.findUnique({
        where: { id: input.id },
        include: {
          parent: true,
          children: true,
          locationInventory: {
            include: { material: { select: { id: true, code: true, description: true, unit: true } } },
            orderBy: { material: { description: "asc" } },
          },
        },
      });

      return location;
    }),

  // Criar local
  create: tenantProcedure
    .input(z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      type: z.enum(["WAREHOUSE", "PRODUCTION", "QUALITY", "SHIPPING", "RECEIVING", "EXTERNAL"]).default("WAREHOUSE"),
      parentId: z.string().optional(),
      address: z.string().optional(),
      isDefault: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      // Se for default, remover default dos outros
      if (input.isDefault) {
        await ctx.prisma.stockLocation.updateMany({
          where: { ...tenantFilter(ctx.companyId), isDefault: true },
          data: { isDefault: false },
        });
      }

      const location = await ctx.prisma.stockLocation.create({
        data: {
          ...input,
          companyId: ctx.companyId,
        },
      });

      return location;
    }),

  // Atualizar local
  update: tenantProcedure
    .input(z.object({
      id: z.string(),
      code: z.string().min(1).optional(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      type: z.enum(["WAREHOUSE", "PRODUCTION", "QUALITY", "SHIPPING", "RECEIVING", "EXTERNAL"]).optional(),
      parentId: z.string().nullable().optional(),
      address: z.string().optional(),
      isActive: z.boolean().optional(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, isDefault, ...data } = input;

      if (isDefault) {
        await ctx.prisma.stockLocation.updateMany({
          where: { ...tenantFilter(ctx.companyId), isDefault: true },
          data: { isDefault: false },
        });
      }

      const location = await ctx.prisma.stockLocation.update({
        where: { id },
        data: { ...data, ...(isDefault !== undefined && { isDefault }) },
      });

      return location;
    }),

  // Estoque por local
  getInventory: tenantProcedure
    .input(z.object({
      locationId: z.string(),
      search: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const where: Prisma.LocationInventoryWhereInput = {
        locationId: input.locationId,
        ...(input.search && {
          material: {
            OR: [
              { description: { contains: input.search, mode: "insensitive" as const } },
              { code: { equals: parseInt(input.search) || -1 } },
            ],
          },
        }),
      };

      const inventory = await ctx.prisma.locationInventory.findMany({
        where,
        include: {
          material: { select: { id: true, code: true, description: true, unit: true } },
        },
        orderBy: { material: { description: "asc" } },
      });

      return inventory;
    }),
});
