import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const suppliersRouter = createTRPCRouter({
  // Listar todos os fornecedores
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search, status, page = 1, limit = 20 } = input ?? {};
      
      const where = {
        ...(search && {
          OR: [
            { companyName: { contains: search, mode: "insensitive" as const } },
            { tradeName: { contains: search, mode: "insensitive" as const } },
            { cnpj: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(status && { status }),
      };

      const [suppliers, total] = await Promise.all([
        ctx.prisma.supplier.findMany({
          where,
          orderBy: { companyName: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.supplier.count({ where }),
      ]);

      return {
        suppliers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Buscar fornecedor por ID
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.supplier.findUnique({
        where: { id: input.id },
        include: {
          supplierMaterials: {
            include: { material: true },
          },
          quotes: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });
    }),

  // Criar fornecedor
  create: publicProcedure
    .input(
      z.object({
        code: z.number(),
        companyName: z.string().min(1),
        tradeName: z.string().optional(),
        cnpj: z.string().optional(),
        cpf: z.string().optional(),
        ie: z.string().optional(),
        im: z.string().optional(),
        address: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        phone: z.string().optional(),
        mobile: z.string().optional(),
        email: z.string().email().optional(),
        website: z.string().optional(),
        contactName: z.string().optional(),
        paymentTerms: z.string().optional(),
        notes: z.string().optional(),
        companyId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.supplier.create({
        data: input,
      });
    }),

  // Atualizar fornecedor
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        companyName: z.string().optional(),
        tradeName: z.string().optional(),
        cnpj: z.string().optional(),
        cpf: z.string().optional(),
        ie: z.string().optional(),
        im: z.string().optional(),
        address: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        phone: z.string().optional(),
        mobile: z.string().optional(),
        email: z.string().email().optional(),
        website: z.string().optional(),
        contactName: z.string().optional(),
        paymentTerms: z.string().optional(),
        notes: z.string().optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
        qualityIndex: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.supplier.update({
        where: { id },
        data,
      });
    }),

  // Deletar fornecedor
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.supplier.delete({
        where: { id: input.id },
      });
    }),
});
