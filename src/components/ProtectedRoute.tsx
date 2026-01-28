"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireMFA?: boolean;
}

export function ProtectedRoute({ children, requireMFA = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Salvar a URL atual para redirecionar após login
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?returnUrl=${returnUrl}`);
    }

    // Verificar MFA se necessário
    if (!isLoading && isAuthenticated && requireMFA && session) {
      const aal = (session as { user?: { aal?: string } })?.user?.aal;
      if (aal !== "aal2") {
        router.push("/mfa/verify");
      }
    }
  }, [isAuthenticated, isLoading, router, pathname, requireMFA, session]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-secondary">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--frm-primary)] mx-auto mb-4" />
          <p className="text-theme-secondary">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
