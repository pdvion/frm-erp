import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { auditCreate, auditUpdate, auditDelete } from "../services/audit";

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
        ...tenantFilter(ctx.companyId, false),
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
        where: { id: input.id, ...tenantFilter(ctx.companyId, false) },
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
      const material = await ctx.prisma.material.create({
        data: {
          ...input,
          companyId: ctx.companyId,
        },
      });

      await auditCreate("Material", material, String(material.code), {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return material;
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
      
      const oldMaterial = await ctx.prisma.material.findUnique({
        where: { id, companyId: ctx.companyId },
      });

      const material = await ctx.prisma.material.update({
        where: { id, companyId: ctx.companyId },
        data,
      });

      if (oldMaterial) {
        await auditUpdate("Material", id, String(material.code), oldMaterial, material, {
          userId: ctx.tenant.userId ?? undefined,
          companyId: ctx.companyId,
        });
      }

      return material;
    }),

  // Deletar material
  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const material = await ctx.prisma.material.findUnique({
        where: { id: input.id, companyId: ctx.companyId },
      });

      const deleted = await ctx.prisma.material.delete({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (material) {
        await auditDelete("Material", material, String(material.code), {
          userId: ctx.tenant.userId ?? undefined,
          companyId: ctx.companyId,
        });
      }

      return deleted;
    }),

  // Listar categorias
  listCategories: tenantProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.category.findMany({
        where: tenantFilter(ctx.companyId, true),
        orderBy: { name: "asc" },
      });
    }),

  // Criar categoria
  createCategory: tenantProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        isActive: z.boolean().default(true),
        isShared: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.prisma.category.create({
        data: {
          name: input.name,
          isActive: input.isActive,
          isShared: input.isShared,
          companyId: ctx.companyId,
        },
      });

      return category;
    }),
});
