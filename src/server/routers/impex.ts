import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";

export const impexRouter = createTRPCRouter({
  // ==========================================================================
  // PORTS (Portos)
  // ==========================================================================

  listPorts: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        country: z.string().optional(),
        type: z.enum(["MARITIME", "AIRPORT", "BORDER"]).optional(),
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search, country, type, isActive } = input ?? {};

      const where = {
        OR: [
          { companyId: ctx.companyId },
          { isShared: true },
        ],
        ...(search && {
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(country && { country }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive }),
      };

      return ctx.prisma.port.findMany({
        where,
        orderBy: [{ country: "asc" }, { name: "asc" }],
      });
    }),

  createPort: tenantProcedure
    .input(
      z.object({
        code: z.string().min(3).max(10),
        name: z.string().min(2),
        country: z.string().length(2),
        type: z.enum(["MARITIME", "AIRPORT", "BORDER"]),
        isShared: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.port.create({
        data: {
          ...input,
          companyId: input.isShared ? null : ctx.companyId,
        },
      });
    }),

  updatePort: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        code: z.string().min(3).max(10).optional(),
        name: z.string().min(2).optional(),
        country: z.string().length(2).optional(),
        type: z.enum(["MARITIME", "AIRPORT", "BORDER"]).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.port.update({
        where: { id },
        data,
      });
    }),

  deletePort: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.port.delete({
        where: { id: input.id },
      });
    }),

  // ==========================================================================
  // CUSTOMS BROKERS (Despachantes Aduaneiros)
  // ==========================================================================

  listBrokers: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search, isActive } = input ?? {};

      const where = {
        ...tenantFilter(ctx.companyId, false),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { cnpj: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(isActive !== undefined && { isActive }),
      };

      return ctx.prisma.customsBroker.findMany({
        where,
        orderBy: { name: "asc" },
      });
    }),

  createBroker: tenantProcedure
    .input(
      z.object({
        name: z.string().min(2),
        cnpj: z.string().min(14).max(18),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.customsBroker.create({
        data: {
          ...input,
          companyId: ctx.companyId,
        },
      });
    }),

  updateBroker: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(2).optional(),
        cnpj: z.string().min(14).max(18).optional(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.customsBroker.update({
        where: { id },
        data,
      });
    }),

  deleteBroker: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.customsBroker.delete({
        where: { id: input.id },
      });
    }),

  // ==========================================================================
  // CARGO TYPES (Tipos de Carga)
  // ==========================================================================

  listCargoTypes: tenantProcedure
    .input(
      z.object({
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { isActive } = input ?? {};

      return ctx.prisma.cargoType.findMany({
        where: {
          ...(isActive !== undefined && { isActive }),
        },
        orderBy: { code: "asc" },
      });
    }),

  createCargoType: tenantProcedure
    .input(
      z.object({
        code: z.string().min(2).max(10),
        name: z.string().min(2),
        description: z.string().optional(),
        isShared: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.cargoType.create({
        data: input,
      });
    }),

  updateCargoType: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        code: z.string().min(2).max(10).optional(),
        name: z.string().min(2).optional(),
        description: z.string().optional().nullable(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.cargoType.update({
        where: { id },
        data,
      });
    }),

  deleteCargoType: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.cargoType.delete({
        where: { id: input.id },
      });
    }),

  // ==========================================================================
  // INCOTERMS
  // ==========================================================================

  listIncoterms: tenantProcedure
    .input(
      z.object({
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { isActive } = input ?? {};

      return ctx.prisma.incoterm.findMany({
        where: {
          ...(isActive !== undefined && { isActive }),
        },
        orderBy: { code: "asc" },
      });
    }),

  createIncoterm: tenantProcedure
    .input(
      z.object({
        code: z.string().min(2).max(10),
        name: z.string().min(2),
        description: z.string().optional(),
        isShared: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.incoterm.create({
        data: input,
      });
    }),

  updateIncoterm: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        code: z.string().min(2).max(10).optional(),
        name: z.string().min(2).optional(),
        description: z.string().optional().nullable(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.incoterm.update({
        where: { id },
        data,
      });
    }),

  deleteIncoterm: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.incoterm.delete({
        where: { id: input.id },
      });
    }),

  // ==========================================================================
  // DASHBOARD
  // ==========================================================================

  dashboard: tenantProcedure.query(async ({ ctx }) => {
    const [
      portsCount,
      brokersCount,
      cargoTypesCount,
      incotermsCount,
    ] = await Promise.all([
      ctx.prisma.port.count({
        where: {
          OR: [
            { companyId: ctx.companyId },
            { isShared: true },
          ],
          isActive: true,
        },
      }),
      ctx.prisma.customsBroker.count({
        where: {
          ...tenantFilter(ctx.companyId, false),
          isActive: true,
        },
      }),
      ctx.prisma.cargoType.count({
        where: { isActive: true },
      }),
      ctx.prisma.incoterm.count({
        where: { isActive: true },
      }),
    ]);

    return {
      portsCount,
      brokersCount,
      cargoTypesCount,
      incotermsCount,
    };
  }),
});
