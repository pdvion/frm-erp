import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getTenantContext, hasPermission, type SystemModule, type PermissionLevel } from "./context";
import { checkRateLimit, type RateLimitType } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";

async function getSupabaseUser() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore errors in Server Components
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    // Retornar null se houver erro ao obter usuário
    return null;
  }
}

export const createTRPCContext = async (opts: { headers: Headers }) => {
  // Contexto padrão vazio para endpoints públicos
  const emptyTenant = {
    userId: null,
    companyId: null,
    companies: [],
    permissions: new Map(),
  };

  try {
    // Obter usuário autenticado do Supabase
    const supabaseUser = await getSupabaseUser();
    
    // Se não há usuário autenticado, retornar contexto vazio (para endpoints públicos)
    if (!supabaseUser?.email) {
      return {
        prisma,
        tenant: emptyTenant,
        supabaseUser: null,
        ...opts,
      };
    }
    
    // Buscar usuário no banco local pelo email do Supabase
    const localUser = await prisma.user.findUnique({
      where: { email: supabaseUser.email },
    });
    const userId = localUser?.id ?? null;
    
    
    // Fallback para header (desenvolvimento) ou null
    const finalUserId = userId ?? opts.headers.get("x-user-id");
    const activeCompanyId = opts.headers.get("x-company-id");
    
    const tenant = await getTenantContext(finalUserId, activeCompanyId);
    
    
    return {
      prisma,
      tenant,
      supabaseUser,
      ...opts,
    };
  } catch (error) {
    // Em caso de erro, retornar contexto vazio para não quebrar endpoints públicos
    console.error("Error creating TRPC context:", error);
    return {
      prisma,
      tenant: emptyTenant,
      supabaseUser: null,
      ...opts,
    };
  }
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

// Procedure que requer sessão Supabase válida (email), mas NÃO exige usuário local
// Útil para endpoints como ensureUser que rodam antes do usuário existir no banco local
export const supabaseAuthProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.supabaseUser?.email) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sessão Supabase inválida.",
    });
  }
  return next({
    ctx: {
      ...ctx,
      supabaseUser: ctx.supabaseUser,
    },
  });
});

// Procedure que requer apenas autenticação (userId), sem exigir empresa ativa
// Útil para endpoints como notificações que funcionam independente da empresa
export const authProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.tenant.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Você precisa estar autenticado para acessar este recurso.",
    });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.tenant.userId,
    },
  });
});

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

// Helper para criar filtro de tenant
// Para models com companyId NOT NULL, usar tenantFilter(companyId) → { companyId }
// Para models com companyId nullable + isShared, usar tenantFilterShared(companyId)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function tenantFilter(companyId: string | null, _includeShared?: boolean) {
  if (!companyId) return {};
  return { companyId };
}

// Filtro para models com isShared (Category, ProductCategory, etc.)
export function tenantFilterShared(companyId: string | null) {
  if (!companyId) return {};
  return {
    OR: [
      { companyId },
      { companyId: null },
      { isShared: true },
    ],
  };
}

// Middleware de rate limiting
const rateLimitMiddleware = (type: RateLimitType) => {
  return t.middleware(async ({ ctx, next }) => {
    const identifier = ctx.tenant.userId || ctx.headers.get("x-forwarded-for") || "anonymous";
    
    try {
      checkRateLimit(identifier, type);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: error.message,
        });
      }
      throw error;
    }
    
    return next();
  });
};

// Procedure com rate limiting para API geral
export const rateLimitedProcedure = tenantProcedure.use(rateLimitMiddleware("API"));

// Procedure com rate limiting para operações sensíveis
export const sensitiveProcedure = tenantProcedure.use(rateLimitMiddleware("SENSITIVE"));

// Procedure com rate limiting para uploads
export const uploadProcedure = tenantProcedure.use(rateLimitMiddleware("UPLOAD"));

// Procedure com rate limiting para relatórios
export const reportsProcedure = tenantProcedure.use(rateLimitMiddleware("REPORTS"));
