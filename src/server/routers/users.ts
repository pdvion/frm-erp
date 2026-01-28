import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";

export const usersRouter = createTRPCRouter({
  // Listar usuários da empresa
  list: tenantProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          status: z.enum(["all", "active", "inactive"]).default("all"),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { search, status = "all", page = 1, limit = 20 } = input ?? {};

      // Buscar usuários vinculados à empresa
      const userCompanies = await prisma.userCompany.findMany({
        where: {
          companyId: ctx.companyId,
          ...(status !== "all" && { isActive: status === "active" }),
          user: search
            ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
              ],
            }
            : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              code: true,
              name: true,
              email: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
              groupMemberships: {
                include: {
                  group: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { user: { name: "asc" } },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await prisma.userCompany.count({
        where: {
          companyId: ctx.companyId,
          ...(status !== "all" && { isActive: status === "active" }),
          user: search
            ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
              ],
            }
            : undefined,
        },
      });

      return {
        items: userCompanies.map((uc) => ({
          id: uc.user.id,
          code: uc.user.code,
          name: uc.user.name,
          email: uc.user.email,
          isActive: uc.isActive && uc.user.isActive,
          isDefault: uc.isDefault,
          createdAt: uc.user.createdAt,
          updatedAt: uc.user.updatedAt,
          groups: uc.user.groupMemberships.map((gm) => gm.group),
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Buscar usuário por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userCompany = await prisma.userCompany.findFirst({
        where: {
          userId: input.id,
          companyId: ctx.companyId,
        },
        include: {
          user: {
            select: {
              id: true,
              code: true,
              name: true,
              email: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
              groupMemberships: {
                include: {
                  group: true,
                },
              },
              permissions: {
                where: { companyId: ctx.companyId },
              },
            },
          },
        },
      });

      if (!userCompany) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado nesta empresa",
        });
      }

      return {
        id: userCompany.user.id,
        code: userCompany.user.code,
        name: userCompany.user.name,
        email: userCompany.user.email,
        isActive: userCompany.isActive && userCompany.user.isActive,
        isDefault: userCompany.isDefault,
        createdAt: userCompany.user.createdAt,
        updatedAt: userCompany.user.updatedAt,
        groups: userCompany.user.groupMemberships.map((gm) => gm.group),
        permissions: userCompany.user.permissions,
      };
    }),

  // Convidar novo usuário
  invite: tenantProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        groupIds: z.array(z.string().uuid()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar se e-mail já existe
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        // Verificar se já está na empresa
        const existingAccess = await prisma.userCompany.findFirst({
          where: {
            userId: existingUser.id,
            companyId: ctx.companyId,
          },
        });

        if (existingAccess) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este usuário já tem acesso a esta empresa",
          });
        }

        // Adicionar acesso à empresa
        await prisma.userCompany.create({
          data: {
            userId: existingUser.id,
            companyId: ctx.companyId!,
            isDefault: false,
          },
        });

        // Adicionar aos grupos
        if (input.groupIds?.length) {
          await prisma.userGroupMember.createMany({
            data: input.groupIds.map((groupId) => ({
              userId: existingUser.id,
              groupId,
              addedBy: ctx.tenant.userId,
            })),
            skipDuplicates: true,
          });
        }

        return { id: existingUser.id, isNew: false };
      }

      // Criar novo usuário
      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          isActive: true,
        },
      });

      // Adicionar acesso à empresa
      await prisma.userCompany.create({
        data: {
          userId: user.id,
          companyId: ctx.companyId!,
          isDefault: true,
        },
      });

      // Adicionar aos grupos
      if (input.groupIds?.length) {
        await prisma.userGroupMember.createMany({
          data: input.groupIds.map((groupId) => ({
            userId: user.id,
            groupId,
            addedBy: ctx.tenant.userId,
          })),
        });
      }

      // TODO: Enviar e-mail de convite via Supabase Auth

      return { id: user.id, isNew: true };
    }),

  // Atualizar usuário
  update: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(2).max(100).optional(),
        groupIds: z.array(z.string().uuid()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userCompany = await prisma.userCompany.findFirst({
        where: {
          userId: input.id,
          companyId: ctx.companyId,
        },
      });

      if (!userCompany) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado nesta empresa",
        });
      }

      // Atualizar nome se fornecido
      if (input.name) {
        await prisma.user.update({
          where: { id: input.id },
          data: { name: input.name },
        });
      }

      // Atualizar grupos se fornecido
      if (input.groupIds !== undefined) {
        // Remover memberships atuais
        await prisma.userGroupMember.deleteMany({
          where: {
            userId: input.id,
            group: {
              OR: [{ companyId: null }, { companyId: ctx.companyId }],
            },
          },
        });

        // Adicionar novas memberships
        if (input.groupIds.length > 0) {
          await prisma.userGroupMember.createMany({
            data: input.groupIds.map((groupId) => ({
              userId: input.id,
              groupId,
              addedBy: ctx.tenant.userId,
            })),
          });
        }
      }

      return { success: true };
    }),

  // Desativar usuário na empresa
  deactivate: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userCompany = await prisma.userCompany.findFirst({
        where: {
          userId: input.id,
          companyId: ctx.companyId,
        },
      });

      if (!userCompany) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado nesta empresa",
        });
      }

      await prisma.userCompany.update({
        where: { id: userCompany.id },
        data: { isActive: false },
      });

      return { success: true };
    }),

  // Reativar usuário na empresa
  activate: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userCompany = await prisma.userCompany.findFirst({
        where: {
          userId: input.id,
          companyId: ctx.companyId,
        },
      });

      if (!userCompany) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado nesta empresa",
        });
      }

      await prisma.userCompany.update({
        where: { id: userCompany.id },
        data: { isActive: true },
      });

      return { success: true };
    }),

  // Estatísticas de usuários
  stats: tenantProcedure.query(async ({ ctx }) => {
    const [total, active, inactive] = await Promise.all([
      prisma.userCompany.count({
        where: { companyId: ctx.companyId },
      }),
      prisma.userCompany.count({
        where: { companyId: ctx.companyId, isActive: true },
      }),
      prisma.userCompany.count({
        where: { companyId: ctx.companyId, isActive: false },
      }),
    ]);

    return { total, active, inactive };
  }),
});
