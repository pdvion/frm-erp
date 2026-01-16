import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter, publicProcedure } from "../trpc";

export const materialsRouter = createTRPCRouter({
  // Listar todos os materiais
  list: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        categoryId: z.string().optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search, categoryId, status, page = 1, limit = 20 } = input ?? {};
      
      const where = {
        // Filtro de tenant (inclui dados compartilhados)
        ...tenantFilter(ctx.companyId),
        ...(search && {
          OR: [
            { description: { contains: search, mode: "insensitive" as const } },
            { internalCode: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(categoryId && { categoryId }),
        ...(status && { status }),
      };

      const [materials, total] = await Promise.all([
        ctx.prisma.material.findMany({
          where,
          include: {
            category: true,
          },
          orderBy: { code: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.material.count({ where }),
      ]);

      return {
        materials,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Buscar material por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.material.findUnique({
        where: { id: input.id, ...tenantFilter(ctx.companyId) },
        include: {
          category: true,
          inventory: true,
          supplierMaterials: {
            include: { supplier: true },
          },
        },
      });
    }),

  // Criar material
  create: tenantProcedure
    .input(
      z.object({
        code: z.number(),
        internalCode: z.string().optional(),
        description: z.string().min(1),
        categoryId: z.string().optional(),
        unit: z.string().default("UN"),
        location: z.string().optional(),
        minQuantity: z.number().default(0),
        maxQuantity: z.number().optional(),
        ncm: z.string().optional(),
        requiresQualityCheck: z.boolean().default(false),
        isShared: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.material.create({
        data: {
          ...input,
          companyId: ctx.companyId,
        },
      });
    }),

  // Atualizar material
  update: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        internalCode: z.string().optional(),
        description: z.string().optional(),
        categoryId: z.string().optional(),
        unit: z.string().optional(),
        location: z.string().optional(),
        minQuantity: z.number().optional(),
        maxQuantity: z.number().optional(),
        ncm: z.string().optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
        requiresQualityCheck: z.boolean().optional(),
        isShared: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.material.update({
        where: { id, companyId: ctx.companyId },
        data,
      });
    }),

  // Deletar material
  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.material.delete({
        where: { id: input.id, companyId: ctx.companyId },
      });
    }),

  // Listar categorias
  listCategories: tenantProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.category.findMany({
        where: tenantFilter(ctx.companyId),
        orderBy: { name: "asc" },
      });
    }),
});
