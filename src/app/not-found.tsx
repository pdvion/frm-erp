"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Home, LayoutDashboard } from "lucide-react";

export default function NotFound() {
  const pathname = usePathname();
  const isMobileContext = pathname.startsWith("/m");

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-tertiary">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="text-8xl font-bold text-blue-600 mb-4">404</div>
        <h1 className="text-2xl font-semibold text-theme mb-2">
          Página não encontrada
        </h1>
        <p className="text-theme-muted mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href={isMobileContext ? "/m" : "/dashboard"}>
            <Button>
              <LayoutDashboard className="w-4 h-4 mr-2" />
              {isMobileContext ? "Voltar ao Início" : "Ir para o Dashboard"}
            </Button>
          </Link>
          {!isMobileContext && (
            <Link href="/">
              <Button variant="outline">
                <Home className="w-4 h-4 mr-2" />
                Página Inicial
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
