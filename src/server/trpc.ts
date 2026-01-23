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
    
    // Debug log para identificar problema
    console.log("[TRPC Context]", {
      supabaseEmail: supabaseUser.email,
      localUserId: userId,
      localUserFound: !!localUser,
    });
    
    // Fallback para header (desenvolvimento) ou null
    const finalUserId = userId ?? opts.headers.get("x-user-id");
    const activeCompanyId = opts.headers.get("x-company-id");
    
    const tenant = await getTenantContext(finalUserId, activeCompanyId);
    
    // Debug log para tenant
    console.log("[TRPC Context] Tenant:", {
      userId: tenant.userId,
      companyId: tenant.companyId,
      companiesCount: tenant.companies.length,
    });
    
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
