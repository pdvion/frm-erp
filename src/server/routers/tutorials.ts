import { z } from "zod";
import { createTRPCRouter, publicProcedure, tenantProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";

export const tutorialsRouter = createTRPCRouter({
  // Listar todos os tutoriais publicados
  list: publicProcedure
    .input(z.object({
      module: z.string().optional(),
      category: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return prisma.tutorial.findMany({
        where: {
          isPublished: true,
          ...(input?.module && { module: input.module }),
          ...(input?.category && { category: input.category }),
        },
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          module: true,
          category: true,
          icon: true,
          orderIndex: true,
        },
      });
    }),

  // Obter tutorial por slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const tutorial = await prisma.tutorial.findUnique({
        where: { slug: input.slug },
      });

      if (!tutorial || !tutorial.isPublished) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tutorial não encontrado",
        });
      }

      return tutorial;
    }),

  // Obter tutorial por módulo (para ajuda contextual)
  getByModule: publicProcedure
    .input(z.object({ module: z.string() }))
    .query(async ({ input }) => {
      return prisma.tutorial.findFirst({
        where: {
          module: input.module,
          isPublished: true,
        },
        orderBy: { orderIndex: "asc" },
      });
    }),

  // Criar tutorial (admin)
  create: tenantProcedure
    .input(z.object({
      slug: z.string().min(3).max(100),
      title: z.string().min(3).max(255),
      description: z.string().optional(),
      content: z.string().min(10),
      module: z.string().optional(),
      category: z.string().optional(),
      icon: z.string().optional(),
      orderIndex: z.number().default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      const hasPermission = ctx.tenant.permissions.get("SETTINGS")?.level === "FULL";
      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para criar tutoriais",
        });
      }

      // Verificar slug duplicado
      const existing = await prisma.tutorial.findUnique({
        where: { slug: input.slug },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe um tutorial com este slug",
        });
      }

      return prisma.tutorial.create({
        data: {
          ...input,
          createdBy: ctx.tenant.userId,
        },
      });
    }),

  // Atualizar tutorial (admin)
  update: tenantProcedure
    .input(z.object({
      id: z.string(),
      slug: z.string().min(3).max(100).optional(),
      title: z.string().min(3).max(255).optional(),
      description: z.string().optional(),
      content: z.string().min(10).optional(),
      module: z.string().optional(),
      category: z.string().optional(),
      icon: z.string().optional(),
      orderIndex: z.number().optional(),
      isPublished: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const hasPermission = ctx.tenant.permissions.get("SETTINGS")?.level === "FULL";
      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para editar tutoriais",
        });
      }

      const { id, ...data } = input;

      // Verificar slug duplicado
      if (data.slug) {
        const existing = await prisma.tutorial.findFirst({
          where: { slug: data.slug, NOT: { id } },
        });
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe um tutorial com este slug",
          });
        }
      }

      return prisma.tutorial.update({
        where: { id },
        data,
      });
    }),

  // Excluir tutorial (admin)
  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const hasPermission = ctx.tenant.permissions.get("SETTINGS")?.level === "FULL";
      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para excluir tutoriais",
        });
      }

      await prisma.tutorial.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Listar categorias disponíveis
  categories: publicProcedure.query(async () => {
    const tutorials = await prisma.tutorial.findMany({
      where: { isPublished: true },
      select: { category: true },
      distinct: ["category"],
    });

    return tutorials
      .map((t) => t.category)
      .filter((c): c is string => c !== null);
  }),

  // Listar módulos com tutoriais
  modules: publicProcedure.query(async () => {
    const tutorials = await prisma.tutorial.findMany({
      where: { isPublished: true },
      select: { module: true },
      distinct: ["module"],
    });

    return tutorials
      .map((t) => t.module)
      .filter((m): m is string => m !== null);
  }),
});
