import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, authProcedure, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import type { SystemModule } from "../context";

export const tenantRouter = createTRPCRouter({
  // Garantir que o usuário existe no banco local (auto-provisioning)
  // ensureUser precisa ser público pois é chamado antes do usuário existir no banco local
  ensureUser: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.supabaseUser?.email) {
      return { created: false, userId: null };
    }

    // Verificar se usuário já existe
    let localUser = await prisma.user.findUnique({
      where: { email: ctx.supabaseUser.email },
    });

    if (localUser) {
      return { created: false, userId: localUser.id };
    }

    // Buscar empresa padrão
    const defaultCompany = await prisma.company.findFirst({
      orderBy: { code: "asc" },
    });

    if (!defaultCompany) {
      return { created: false, userId: null, error: "Nenhuma empresa cadastrada" };
    }

    // Buscar próximo código
    const lastUser = await prisma.user.findFirst({
      orderBy: { code: "desc" },
      select: { code: true },
    });
    const nextCode = (lastUser?.code ?? 0) + 1;

    // Criar usuário
    localUser = await prisma.user.create({
      data: {
        code: nextCode,
        email: ctx.supabaseUser.email,
        name: ctx.supabaseUser.user_metadata?.name || ctx.supabaseUser.email.split("@")[0],
        password: "supabase-auth",
        isActive: true,
        companyId: defaultCompany.id,
      },
    });

    // Vincular à empresa
    await prisma.userCompany.create({
      data: {
        userId: localUser.id,
        companyId: defaultCompany.id,
        isDefault: true,
        isActive: true,
      },
    });

    // Criar permissões
    const modules: SystemModule[] = ["MATERIALS", "SUPPLIERS", "QUOTES", "RECEIVING", "MATERIAL_OUT", "INVENTORY", "REPORTS", "SETTINGS"];
    await prisma.userCompanyPermission.createMany({
      data: modules.map((module) => ({
        userId: localUser!.id,
        companyId: defaultCompany.id,
        module,
        permission: "FULL" as const,
        canShare: true,
        canClone: true,
      })),
    });

    return { created: true, userId: localUser.id };
  }),

  // Retorna informações do tenant atual
  current: authProcedure.query(async ({ ctx }) => {
    return {
      userId: ctx.tenant.userId,
      companyId: ctx.tenant.companyId,
      companies: ctx.tenant.companies,
      permissions: Object.fromEntries(ctx.tenant.permissions),
    };
  }),

  // Trocar empresa ativa
  switchCompany: authProcedure
    .input(z.object({ companyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se o usuário tem acesso à empresa
      const hasAccess = ctx.tenant.companies.some(
        (c) => c.id === input.companyId
      );

      if (!hasAccess) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem acesso a esta empresa." });
      }

      // Retornar a empresa selecionada (o frontend deve persistir)
      const company = ctx.tenant.companies.find(
        (c) => c.id === input.companyId
      );

      return {
        success: true,
        company,
      };
    }),
});
