import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";

export const costCentersRouter = createTRPCRouter({
  // Listar centros de custo
  list: tenantProcedure
    .input(z.object({
      search: z.string().optional(),
      includeInactive: z.boolean().default(false),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { search, includeInactive } = input || {};

      const where = {
        ...tenantFilter(ctx.companyId),
        ...(search && {
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(!includeInactive && { isActive: true }),
      };

      const costCenters = await ctx.prisma.costCenter.findMany({
        where,
        include: {
          parent: { select: { id: true, code: true, name: true } },
          children: { select: { id: true, code: true, name: true } },
          _count: { select: { payableAllocations: true, receivables: true } },
        },
        orderBy: { code: "asc" },
      });

      return costCenters;
    }),

  // Buscar por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const costCenter = await ctx.prisma.costCenter.findUnique({
        where: { id: input.id, ...tenantFilter(ctx.companyId) },
        include: {
          parent: true,
          children: true,
        },
      });

      if (!costCenter) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Centro de custo não encontrado" });
      }

      return costCenter;
    }),

  // Criar centro de custo
  create: tenantProcedure
    .input(z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      parentId: z.string().optional(),
      budget: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar código único
      const existing = await ctx.prisma.costCenter.findFirst({
        where: { code: input.code, ...tenantFilter(ctx.companyId) },
      });

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Código já existe" });
      }

      const costCenter = await ctx.prisma.costCenter.create({
        data: {
          ...input,
          companyId: ctx.companyId,
        },
      });

      return costCenter;
    }),

  // Atualizar centro de custo
  update: tenantProcedure
    .input(z.object({
      id: z.string(),
      code: z.string().min(1).optional(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      parentId: z.string().nullable().optional(),
      budget: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const costCenter = await ctx.prisma.costCenter.update({
        where: { id, ...tenantFilter(ctx.companyId) },
        data,
      });

      return costCenter;
    }),

  // Excluir centro de custo
  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Verificar se tem alocações
      const allocations = await ctx.prisma.payableCostAllocation.count({
        where: { costCenterId: input.id },
      });

      if (allocations > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Centro de custo possui alocações e não pode ser excluído",
        });
      }

      await ctx.prisma.costCenter.delete({
        where: { id: input.id, ...tenantFilter(ctx.companyId) },
      });

      return { success: true };
    }),
});
