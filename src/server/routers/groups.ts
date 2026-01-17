import { z } from "zod";
import { createTRPCRouter, tenantProcedure, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";

// Schema de permissões disponíveis no sistema
export const SYSTEM_PERMISSIONS = {
  // Materiais
  "materials.view": "Visualizar materiais",
  "materials.create": "Criar materiais",
  "materials.edit": "Editar materiais",
  "materials.delete": "Excluir materiais",
  "materials.*": "Acesso total a materiais",
  
  // Fornecedores
  "suppliers.view": "Visualizar fornecedores",
  "suppliers.create": "Criar fornecedores",
  "suppliers.edit": "Editar fornecedores",
  "suppliers.delete": "Excluir fornecedores",
  "suppliers.*": "Acesso total a fornecedores",
  
  // Cotações
  "quotes.view": "Visualizar cotações",
  "quotes.create": "Criar cotações",
  "quotes.edit": "Editar cotações",
  "quotes.delete": "Excluir cotações",
  "quotes.*": "Acesso total a cotações",
  
  // Pedidos de Compra
  "purchase_orders.view": "Visualizar pedidos",
  "purchase_orders.create": "Criar pedidos",
  "purchase_orders.edit": "Editar pedidos",
  "purchase_orders.approve": "Aprovar pedidos",
  "purchase_orders.*": "Acesso total a pedidos",
  
  // Estoque
  "inventory.view": "Visualizar estoque",
  "inventory.entry": "Entrada de materiais",
  "inventory.exit": "Saída de materiais",
  "inventory.adjust": "Ajustar estoque",
  "inventory.*": "Acesso total a estoque",
  
  // NFe/Invoices
  "invoices.view": "Visualizar NFe",
  "invoices.import": "Importar NFe",
  "invoices.approve": "Aprovar NFe",
  "invoices.*": "Acesso total a NFe",
  
  // Financeiro
  "finance.payables.view": "Visualizar contas a pagar",
  "finance.payables.create": "Criar contas a pagar",
  "finance.payables.pay": "Pagar contas",
  "finance.receivables.view": "Visualizar contas a receber",
  "finance.receivables.create": "Criar contas a receber",
  "finance.*": "Acesso total ao financeiro",
  
  // Produção
  "production.orders.view": "Visualizar ordens de produção",
  "production.orders.create": "Criar ordens de produção",
  "production.pointing": "Apontamento de produção",
  "production.*": "Acesso total à produção",
  
  // Configurações
  "settings.landing.view": "Visualizar config. landing page",
  "settings.landing.edit": "Editar landing page",
  "settings.theme.view": "Visualizar tema",
  "settings.theme.edit": "Editar tema",
  "settings.company.view": "Visualizar config. empresa",
  "settings.company.edit": "Editar config. empresa",
  "settings.*": "Acesso total a configurações",
  
  // Usuários e Grupos
  "users.view": "Visualizar usuários",
  "users.create": "Criar usuários",
  "users.edit": "Editar usuários",
  "users.delete": "Excluir usuários",
  "users.*": "Acesso total a usuários",
  "groups.view": "Visualizar grupos",
  "groups.create": "Criar grupos",
  "groups.edit": "Editar grupos",
  "groups.delete": "Excluir grupos",
  "groups.*": "Acesso total a grupos",
  
  // Auditoria
  "audit.view": "Visualizar logs de auditoria",
  "audit.*": "Acesso total a auditoria",
  
  // Relatórios
  "reports.view": "Visualizar relatórios",
  "reports.export": "Exportar relatórios",
  "reports.*": "Acesso total a relatórios",
  
  // Admin
  "*": "Acesso total ao sistema (Admin)",
} as const;

export type SystemPermission = keyof typeof SYSTEM_PERMISSIONS;

// Função para verificar se uma permissão específica está incluída
export function hasPermissionInList(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  // Admin tem acesso total
  if (userPermissions.includes("*")) return true;
  
  // Permissão exata
  if (userPermissions.includes(requiredPermission)) return true;
  
  // Permissão wildcard (ex: "materials.*" inclui "materials.view")
  const [module] = requiredPermission.split(".");
  if (userPermissions.includes(`${module}.*`)) return true;
  
  // Permissão de visualização genérica
  if (requiredPermission.endsWith(".view") && userPermissions.includes("*.view")) {
    return true;
  }
  
  return false;
}

export const groupsRouter = createTRPCRouter({
  // Listar todos os grupos (globais + da empresa)
  list: tenantProcedure
    .input(z.object({
      includeMembers: z.boolean().default(false),
    }).optional())
    .query(async ({ ctx, input }) => {
      const groups = await prisma.userGroup.findMany({
        where: {
          OR: [
            { companyId: null }, // Grupos globais do sistema
            { companyId: ctx.companyId }, // Grupos da empresa
          ],
          isActive: true,
        },
        include: input?.includeMembers ? {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: { members: true },
          },
        } : {
          _count: {
            select: { members: true },
          },
        },
        orderBy: [
          { isSystem: "desc" },
          { name: "asc" },
        ],
      });

      return groups;
    }),

  // Buscar grupo por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const group = await prisma.userGroup.findFirst({
        where: {
          id: input.id,
          OR: [
            { companyId: null },
            { companyId: ctx.companyId },
          ],
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              addedByUser: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Grupo não encontrado",
        });
      }

      return group;
    }),

  // Criar novo grupo (apenas para a empresa)
  create: tenantProcedure
    .input(z.object({
      name: z.string().min(2).max(100),
      description: z.string().optional(),
      permissions: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar se já existe grupo com mesmo nome na empresa
      const existing = await prisma.userGroup.findFirst({
        where: {
          name: input.name,
          companyId: ctx.companyId,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe um grupo com este nome",
        });
      }

      const group = await prisma.userGroup.create({
        data: {
          name: input.name,
          description: input.description,
          permissions: input.permissions,
          companyId: ctx.companyId,
          isSystem: false,
        },
      });

      return group;
    }),

  // Atualizar grupo
  update: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(2).max(100).optional(),
      description: z.string().optional(),
      permissions: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const group = await prisma.userGroup.findFirst({
        where: {
          id: input.id,
          OR: [
            { companyId: null, isSystem: false }, // Grupos globais não-sistema podem ser editados
            { companyId: ctx.companyId },
          ],
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Grupo não encontrado ou sem permissão para editar",
        });
      }

      // Grupos do sistema só podem ter permissões alteradas, não nome/descrição
      if (group.isSystem && (input.name || input.description !== undefined)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Grupos do sistema não podem ter nome ou descrição alterados",
        });
      }

      const updated = await prisma.userGroup.update({
        where: { id: input.id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.permissions && { permissions: input.permissions }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
      });

      return updated;
    }),

  // Excluir grupo
  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const group = await prisma.userGroup.findFirst({
        where: {
          id: input.id,
          companyId: ctx.companyId, // Só pode excluir grupos da própria empresa
          isSystem: false, // Não pode excluir grupos do sistema
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Grupo não encontrado ou não pode ser excluído",
        });
      }

      await prisma.userGroup.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Adicionar membro ao grupo
  addMember: tenantProcedure
    .input(z.object({
      groupId: z.string().uuid(),
      userId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar se o grupo existe e é acessível
      const group = await prisma.userGroup.findFirst({
        where: {
          id: input.groupId,
          OR: [
            { companyId: null },
            { companyId: ctx.companyId },
          ],
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Grupo não encontrado",
        });
      }

      // Verificar se o usuário existe
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      // Verificar se já é membro
      const existingMember = await prisma.userGroupMember.findUnique({
        where: {
          userId_groupId: {
            userId: input.userId,
            groupId: input.groupId,
          },
        },
      });

      if (existingMember) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Usuário já é membro deste grupo",
        });
      }

      const member = await prisma.userGroupMember.create({
        data: {
          userId: input.userId,
          groupId: input.groupId,
          addedBy: ctx.tenant.userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return member;
    }),

  // Remover membro do grupo
  removeMember: tenantProcedure
    .input(z.object({
      groupId: z.string().uuid(),
      userId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar se o grupo é acessível
      const group = await prisma.userGroup.findFirst({
        where: {
          id: input.groupId,
          OR: [
            { companyId: null },
            { companyId: ctx.companyId },
          ],
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Grupo não encontrado",
        });
      }

      await prisma.userGroupMember.deleteMany({
        where: {
          userId: input.userId,
          groupId: input.groupId,
        },
      });

      return { success: true };
    }),

  // Buscar grupos de um usuário
  getUserGroups: tenantProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const memberships = await prisma.userGroupMember.findMany({
        where: {
          userId: input.userId,
          group: {
            OR: [
              { companyId: null },
              { companyId: ctx.companyId },
            ],
            isActive: true,
          },
        },
        include: {
          group: true,
        },
      });

      return memberships.map((m: { group: typeof memberships[0]["group"] }) => m.group);
    }),

  // Buscar permissões consolidadas de um usuário
  getUserPermissions: tenantProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const memberships = await prisma.userGroupMember.findMany({
        where: {
          userId: input.userId,
          group: {
            OR: [
              { companyId: null },
              { companyId: ctx.companyId },
            ],
            isActive: true,
          },
        },
        include: {
          group: {
            select: {
              permissions: true,
            },
          },
        },
      });

      // Consolidar todas as permissões
      const allPermissions = new Set<string>();
      memberships.forEach((m: { group: { permissions: unknown } }) => {
        const permissions = m.group.permissions as string[];
        permissions.forEach((p: string) => allPermissions.add(p));
      });

      return Array.from(allPermissions);
    }),

  // Listar permissões disponíveis no sistema
  listPermissions: publicProcedure.query(() => {
    return Object.entries(SYSTEM_PERMISSIONS).map(([key, description]) => ({
      key,
      description,
      module: key.split(".")[0],
    }));
  }),
});
