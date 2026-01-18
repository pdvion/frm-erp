import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const customersRouter = createTRPCRouter({
  // Listar clientes
  list: tenantProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED", "ALL"]).optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { search, status, page = 1, limit = 20 } = input || {};

      const where: Prisma.CustomerWhereInput = {
        ...tenantFilter(ctx.companyId, false),
        ...(search && {
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            { companyName: { contains: search, mode: "insensitive" as const } },
            { tradeName: { contains: search, mode: "insensitive" as const } },
            { cnpj: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(status && status !== "ALL" && { status }),
      };

      const [customers, total] = await Promise.all([
        ctx.prisma.customer.findMany({
          where,
          include: {
            _count: { select: { receivables: true } },
          },
          orderBy: { companyName: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.customer.count({ where }),
      ]);

      return { customers, total, pages: Math.ceil(total / limit) };
    }),

  // Buscar por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const customer = await ctx.prisma.customer.findUnique({
        where: { id: input.id, ...tenantFilter(ctx.companyId, false) },
        include: {
          receivables: {
            orderBy: { dueDate: "desc" },
            take: 10,
          },
        },
      });

      if (!customer) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });
      }

      return customer;
    }),

  // Criar cliente
  create: tenantProcedure
    .input(z.object({
      code: z.string().min(1),
      type: z.enum(["COMPANY", "PERSON"]).default("COMPANY"),
      companyName: z.string().min(1),
      tradeName: z.string().optional(),
      cnpj: z.string().optional(),
      cpf: z.string().optional(),
      stateRegistration: z.string().optional(),
      municipalRegistration: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      mobile: z.string().optional(),
      website: z.string().optional(),
      contactName: z.string().optional(),
      addressStreet: z.string().optional(),
      addressNumber: z.string().optional(),
      addressComplement: z.string().optional(),
      addressNeighborhood: z.string().optional(),
      addressCity: z.string().optional(),
      addressState: z.string().optional(),
      addressZipCode: z.string().optional(),
      creditLimit: z.number().optional(),
      paymentTermDays: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar código único
      const existing = await ctx.prisma.customer.findFirst({
        where: { code: input.code, ...tenantFilter(ctx.companyId, false) },
      });

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Código já existe" });
      }

      const customer = await ctx.prisma.customer.create({
        data: {
          ...input,
          companyId: ctx.companyId,
          createdBy: ctx.tenant.userId,
        },
      });

      return customer;
    }),

  // Atualizar cliente
  update: tenantProcedure
    .input(z.object({
      id: z.string(),
      code: z.string().min(1).optional(),
      type: z.enum(["COMPANY", "PERSON"]).optional(),
      companyName: z.string().min(1).optional(),
      tradeName: z.string().optional(),
      cnpj: z.string().optional(),
      cpf: z.string().optional(),
      stateRegistration: z.string().optional(),
      municipalRegistration: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      mobile: z.string().optional(),
      website: z.string().optional(),
      contactName: z.string().optional(),
      addressStreet: z.string().optional(),
      addressNumber: z.string().optional(),
      addressComplement: z.string().optional(),
      addressNeighborhood: z.string().optional(),
      addressCity: z.string().optional(),
      addressState: z.string().optional(),
      addressZipCode: z.string().optional(),
      creditLimit: z.number().optional(),
      paymentTermDays: z.number().optional(),
      status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const customer = await ctx.prisma.customer.update({
        where: { id, ...tenantFilter(ctx.companyId, false) },
        data,
      });

      return customer;
    }),

  // Estatísticas do cliente
  stats: tenantProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ input, ctx }) => {
      const receivables = await ctx.prisma.accountsReceivable.findMany({
        where: { customerId: input.customerId },
        select: { status: true, netValue: true, paidValue: true },
      });

      const totalReceivables = receivables.length;
      const totalValue = receivables.reduce((sum, r) => sum + r.netValue, 0);
      const paidValue = receivables.reduce((sum, r) => sum + r.paidValue, 0);
      const pendingValue = totalValue - paidValue;
      const overdueCount = receivables.filter(r => r.status === "PENDING").length;

      return {
        totalReceivables,
        totalValue,
        paidValue,
        pendingValue,
        overdueCount,
      };
    }),
});
