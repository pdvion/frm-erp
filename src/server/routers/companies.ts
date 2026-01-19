import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import type { SystemModule } from "../context";

export const companiesRouter = createTRPCRouter({
  // Listar todas as empresas (admin)
  list: tenantProcedure.query(async ({ ctx }) => {
    // Verificar se usuário tem permissão de SETTINGS
    const hasPermission = ctx.tenant.permissions.get("SETTINGS")?.level === "FULL";
    
    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Sem permissão para gerenciar empresas",
      });
    }

    return prisma.company.findMany({
      orderBy: { code: "asc" },
      include: {
        _count: {
          select: {
            users: true,
            materials: true,
            suppliers: true,
          },
        },
      },
    });
  }),

  // Obter empresa por ID
  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.company.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              users: true,
              materials: true,
              suppliers: true,
              inventory: true,
              purchaseOrders: true,
            },
          },
        },
      });
    }),

  // Criar nova empresa
  create: tenantProcedure
    .input(z.object({
      name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
      tradeName: z.string().optional(),
      cnpj: z.string().optional(),
      ie: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      const hasPermission = ctx.tenant.permissions.get("SETTINGS")?.level === "FULL";
      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para criar empresas",
        });
      }

      // Verificar CNPJ duplicado
      if (input.cnpj) {
        const existing = await prisma.company.findUnique({
          where: { cnpj: input.cnpj },
        });
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "CNPJ já cadastrado",
          });
        }
      }

      // Buscar próximo código
      const lastCompany = await prisma.company.findFirst({
        orderBy: { code: "desc" },
      });
      const nextCode = (lastCompany?.code || 0) + 1;

      // Criar empresa
      const company = await prisma.company.create({
        data: {
          code: nextCode,
          ...input,
        },
      });

      return company;
    }),

  // Atualizar empresa
  update: tenantProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(3).optional(),
      tradeName: z.string().optional(),
      cnpj: z.string().optional(),
      ie: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const hasPermission = ctx.tenant.permissions.get("SETTINGS")?.level === "FULL";
      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para editar empresas",
        });
      }

      const { id, ...data } = input;

      // Verificar CNPJ duplicado
      if (data.cnpj) {
        const existing = await prisma.company.findFirst({
          where: { cnpj: data.cnpj, NOT: { id } },
        });
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "CNPJ já cadastrado em outra empresa",
          });
        }
      }

      return prisma.company.update({
        where: { id },
        data,
      });
    }),

  // Vincular usuário a uma empresa
  addUser: tenantProcedure
    .input(z.object({
      companyId: z.string(),
      userId: z.string(),
      isDefault: z.boolean().default(false),
      permissions: z.array(z.object({
        module: z.string(),
        permission: z.enum(["NONE", "VIEW", "EDIT", "FULL"]),
        canShare: z.boolean().default(false),
        canClone: z.boolean().default(false),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const hasPermission = ctx.tenant.permissions.get("SETTINGS")?.level === "FULL";
      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para gerenciar usuários",
        });
      }

      // Verificar se vínculo já existe
      const existing = await prisma.userCompany.findUnique({
        where: {
          userId_companyId: {
            userId: input.userId,
            companyId: input.companyId,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Usuário já vinculado a esta empresa",
        });
      }

      // Criar vínculo
      const userCompany = await prisma.userCompany.create({
        data: {
          userId: input.userId,
          companyId: input.companyId,
          isDefault: input.isDefault,
          isActive: true,
        },
      });

      // Criar permissões padrão ou customizadas
      const modules: SystemModule[] = ["MATERIALS", "SUPPLIERS", "QUOTES", "RECEIVING", "MATERIAL_OUT", "INVENTORY", "REPORTS", "SETTINGS"];
      
      if (input.permissions && input.permissions.length > 0) {
        await prisma.userCompanyPermission.createMany({
          data: input.permissions.map((p) => ({
            userId: input.userId,
            companyId: input.companyId,
            module: p.module as SystemModule,
            permission: p.permission,
            canShare: p.canShare,
            canClone: p.canClone,
          })),
        });
      } else {
        // Permissões padrão: VIEW para todos os módulos
        await prisma.userCompanyPermission.createMany({
          data: modules.map((module) => ({
            userId: input.userId,
            companyId: input.companyId,
            module,
            permission: "VIEW" as const,
            canShare: false,
            canClone: false,
          })),
        });
      }

      return userCompany;
    }),

  // Remover usuário de uma empresa
  removeUser: tenantProcedure
    .input(z.object({
      companyId: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const hasPermission = ctx.tenant.permissions.get("SETTINGS")?.level === "FULL";
      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para gerenciar usuários",
        });
      }

      // Remover permissões
      await prisma.userCompanyPermission.deleteMany({
        where: {
          userId: input.userId,
          companyId: input.companyId,
        },
      });

      // Remover vínculo
      await prisma.userCompany.delete({
        where: {
          userId_companyId: {
            userId: input.userId,
            companyId: input.companyId,
          },
        },
      });

      return { success: true };
    }),

  // Listar usuários de uma empresa
  listUsers: tenantProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ input }) => {
      return prisma.userCompany.findMany({
        where: { companyId: input.companyId },
        include: {
          user: {
            select: {
              id: true,
              code: true,
              name: true,
              email: true,
              isActive: true,
            },
          },
        },
      });
    }),

  // Atualizar permissões de um usuário em uma empresa
  updateUserPermissions: tenantProcedure
    .input(z.object({
      companyId: z.string(),
      userId: z.string(),
      permissions: z.array(z.object({
        module: z.string(),
        permission: z.enum(["NONE", "VIEW", "EDIT", "FULL"]),
        canShare: z.boolean().default(false),
        canClone: z.boolean().default(false),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const hasPermission = ctx.tenant.permissions.get("SETTINGS")?.level === "FULL";
      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para gerenciar permissões",
        });
      }

      // Deletar permissões existentes
      await prisma.userCompanyPermission.deleteMany({
        where: {
          userId: input.userId,
          companyId: input.companyId,
        },
      });

      // Criar novas permissões
      await prisma.userCompanyPermission.createMany({
        data: input.permissions.map((p) => ({
          userId: input.userId,
          companyId: input.companyId,
          module: p.module as SystemModule,
          permission: p.permission,
          canShare: p.canShare,
          canClone: p.canClone,
        })),
      });

      return { success: true };
    }),
});
