import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const tenantRouter = createTRPCRouter({
  // Retorna informações do tenant atual
  current: publicProcedure.query(async ({ ctx }) => {
    return {
      userId: ctx.tenant.userId,
      companyId: ctx.tenant.companyId,
      companies: ctx.tenant.companies,
      permissions: Object.fromEntries(ctx.tenant.permissions),
    };
  }),

  // Trocar empresa ativa
  switchCompany: publicProcedure
    .input(z.object({ companyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se o usuário tem acesso à empresa
      const hasAccess = ctx.tenant.companies.some(
        (c) => c.id === input.companyId
      );

      if (!hasAccess) {
        throw new Error("Você não tem acesso a esta empresa.");
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
