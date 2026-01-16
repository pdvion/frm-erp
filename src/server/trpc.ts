import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantContext, hasPermission, type TenantContext, type SystemModule, type PermissionLevel } from "./context";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  // Por enquanto, simular usuário logado (admin)
  // TODO: Integrar com Supabase Auth
  const userId = opts.headers.get("x-user-id") ?? "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const activeCompanyId = opts.headers.get("x-company-id");
  
  const tenant = await getTenantContext(userId, activeCompanyId);
  
  return {
    prisma,
    tenant,
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Procedure que requer empresa ativa
export const tenantProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.tenant.companyId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Nenhuma empresa ativa. Selecione uma empresa para continuar.",
    });
  }
  return next({
    ctx: {
      ...ctx,
      companyId: ctx.tenant.companyId,
    },
  });
});

// Procedure que verifica permissão em um módulo
export const createProtectedProcedure = (module: SystemModule, requiredLevel: PermissionLevel) => {
  return tenantProcedure.use(async ({ ctx, next }) => {
    if (!hasPermission(ctx.tenant, module, requiredLevel)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Você não tem permissão para acessar ${module}.`,
      });
    }
    return next();
  });
};

// Helper para criar filtro de tenant (inclui dados compartilhados)
export function tenantFilter(companyId: string | null, includeShared = true) {
  if (!companyId) return {};
  
  if (includeShared) {
    return {
      OR: [
        { companyId },
        { companyId: null },
        { isShared: true },
      ],
    };
  }
  
  return { companyId };
}
