import { prisma } from "@/lib/prisma";

// Tipos locais (espelhando os enums do Prisma)
export type PermissionLevel = "NONE" | "VIEW" | "EDIT" | "FULL";
export type SystemModule = 
  | "MATERIALS" 
  | "SUPPLIERS" 
  | "QUOTES" 
  | "RECEIVING" 
  | "MATERIAL_OUT" 
  | "INVENTORY" 
  | "REPORTS" 
  | "SETTINGS";

export type TenantContext = {
  userId: string | null;
  companyId: string | null;
  companies: Array<{
    id: string;
    code: number;
    name: string;
    isDefault: boolean;
  }>;
  permissions: Map<SystemModule, {
    level: PermissionLevel;
    canShare: boolean;
    canClone: boolean;
  }>;
};

export async function getTenantContext(
  userId: string | null,
  activeCompanyId?: string | null
): Promise<TenantContext> {
  const emptyContext: TenantContext = {
    userId: null,
    companyId: null,
    companies: [],
    permissions: new Map(),
  };

  if (!userId) {
    return emptyContext;
  }

  // Buscar empresas que o usuário tem acesso
  const userCompanies = await prisma.userCompany.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      company: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
    orderBy: {
      isDefault: "desc",
    },
  });

  if (userCompanies.length === 0) {
    return { ...emptyContext, userId };
  }

  type UserCompanyWithCompany = typeof userCompanies[number];
  const companies = userCompanies.map((uc: UserCompanyWithCompany) => ({
    id: uc.company.id,
    code: uc.company.code,
    name: uc.company.name,
    isDefault: uc.isDefault,
  }));

  // Determinar empresa ativa
  let companyId: string | null = activeCompanyId ?? null;
  type CompanyItem = typeof companies[number];
  if (!companyId || !companies.find((c: CompanyItem) => c.id === companyId)) {
    // Usar empresa padrão ou primeira da lista
    const defaultCompany = companies.find((c: CompanyItem) => c.isDefault);
    companyId = defaultCompany?.id ?? companies[0].id;
  }

  // Buscar permissões para a empresa ativa
  const userPermissions = await prisma.userCompanyPermission.findMany({
    where: {
      userId,
      companyId,
    },
  });

  const permissions = new Map<SystemModule, {
    level: PermissionLevel;
    canShare: boolean;
    canClone: boolean;
  }>();

  for (const perm of userPermissions) {
    permissions.set(perm.module as SystemModule, {
      level: perm.permission as PermissionLevel,
      canShare: perm.canShare,
      canClone: perm.canClone,
    });
  }

  return {
    userId,
    companyId,
    companies,
    permissions,
  };
}

export function hasPermission(
  ctx: TenantContext,
  module: SystemModule,
  requiredLevel: PermissionLevel
): boolean {
  const perm = ctx.permissions.get(module);
  if (!perm) return false;

  const levels: PermissionLevel[] = ["NONE", "VIEW", "EDIT", "FULL"];
  const userLevelIndex = levels.indexOf(perm.level);
  const requiredLevelIndex = levels.indexOf(requiredLevel);

  return userLevelIndex >= requiredLevelIndex;
}

export function canShare(ctx: TenantContext, module: SystemModule): boolean {
  const perm = ctx.permissions.get(module);
  return perm?.canShare ?? false;
}

export function canClone(ctx: TenantContext, module: SystemModule): boolean {
  const perm = ctx.permissions.get(module);
  return perm?.canClone ?? false;
}
