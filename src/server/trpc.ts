import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getTenantContext, hasPermission, type SystemModule, type PermissionLevel } from "./context";

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
    
    // Buscar ou criar usuário no banco local pelo email do Supabase
    let localUser = await prisma.user.findUnique({
      where: { email: supabaseUser.email },
    });
    
    // Auto-provisioning: criar usuário se não existir
    if (!localUser) {
      // Buscar empresa padrão para novos usuários
      const defaultCompany = await prisma.company.findFirst({
        orderBy: { code: "asc" },
      });
      
      if (defaultCompany) {
        // Buscar próximo código de usuário
        const lastUser = await prisma.user.findFirst({
          orderBy: { code: "desc" },
          select: { code: true },
        });
        const nextCode = (lastUser?.code ?? 0) + 1;
        
        // Criar usuário
        localUser = await prisma.user.create({
          data: {
            code: nextCode,
            email: supabaseUser.email,
            name: supabaseUser.user_metadata?.name || supabaseUser.email.split("@")[0],
            password: "supabase-auth",
            isActive: true,
            companyId: defaultCompany.id,
          },
        });
        
        // Vincular à empresa padrão
        await prisma.userCompany.create({
          data: {
            userId: localUser.id,
            companyId: defaultCompany.id,
            isDefault: true,
            isActive: true,
          },
        });
        
        // Criar permissões básicas (FULL para todos os módulos)
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
      }
    }
    
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
