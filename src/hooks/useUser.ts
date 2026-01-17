"use client";

import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";

export function useUser() {
  const { user, session, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Buscar dados do tenant (empresa ativa, permissões)
  const { data: tenant, isLoading: tenantLoading } = trpc.tenant.current.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
      staleTime: 5 * 60 * 1000, // 5 minutos
    }
  );

  // Encontrar empresa ativa
  const activeCompany = tenant?.companies?.find(
    (c) => c.id === tenant.companyId
  ) ?? null;

  return {
    // Auth data
    user,
    session,
    isAuthenticated,
    
    // Tenant data
    companyId: tenant?.companyId ?? null,
    company: activeCompany,
    companies: tenant?.companies ?? [],
    permissions: tenant?.permissions ?? {},
    
    // Loading states
    isLoading: authLoading || tenantLoading,
    
    // Helpers
    hasPermission: (module: string, level: "VIEW" | "EDIT" | "FULL") => {
      if (!tenant?.permissions) return false;
      const permission = tenant.permissions[module];
      if (!permission) return false;
      
      const levels = ["NONE", "VIEW", "EDIT", "FULL"];
      const requiredLevel = levels.indexOf(level);
      const userLevel = levels.indexOf(permission.level);
      
      return userLevel >= requiredLevel;
    },
    
    canAccessModule: (module: string) => {
      if (!tenant?.permissions) return false;
      const permission = tenant.permissions[module];
      return permission && permission.level !== "NONE";
    },
  };
}
