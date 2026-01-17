import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook para verificar permissões do usuário atual
 */
export function usePermissions() {
  const { user } = useAuth();
  
  const { data: permissions = [], isLoading } = trpc.groups.getUserPermissions.useQuery(
    { userId: user?.id ?? "" },
    { enabled: !!user?.id }
  );

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  const hasPermission = (requiredPermission: string): boolean => {
    if (!permissions.length) return false;
    
    // Admin tem acesso total
    if (permissions.includes("*")) return true;
    
    // Permissão exata
    if (permissions.includes(requiredPermission)) return true;
    
    // Permissão wildcard (ex: "materials.*" inclui "materials.view")
    const [module] = requiredPermission.split(".");
    if (permissions.includes(`${module}.*`)) return true;
    
    // Permissão de visualização genérica
    if (requiredPermission.endsWith(".view") && permissions.includes("*.view")) {
      return true;
    }
    
    return false;
  };

  /**
   * Verifica se o usuário tem TODAS as permissões especificadas
   */
  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.every((p) => hasPermission(p));
  };

  /**
   * Verifica se o usuário tem ALGUMA das permissões especificadas
   */
  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.some((p) => hasPermission(p));
  };

  /**
   * Verifica se o usuário é admin (tem permissão "*")
   */
  const isAdmin = (): boolean => {
    return permissions.includes("*");
  };

  return {
    permissions,
    isLoading,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isAdmin,
  };
}

/**
 * Hook para buscar grupos do usuário atual
 */
export function useUserGroups() {
  const { user } = useAuth();
  
  const { data: groups = [], isLoading, refetch } = trpc.groups.getUserGroups.useQuery(
    { userId: user?.id ?? "" },
    { enabled: !!user?.id }
  );

  return {
    groups,
    isLoading,
    refetch,
  };
}
