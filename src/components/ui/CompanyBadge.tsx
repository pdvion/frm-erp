"use client";

import { Building2 } from "lucide-react";

interface CompanyBadgeProps {
  companyName?: string | null;
  companyId?: string | null;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Badge para mostrar a empresa de um registro
 * Usado em listagens quando "Todas as Empresas" está selecionado
 */
export function CompanyBadge({
  companyName,
  size = "sm",
  className = "",
}: CompanyBadgeProps) {
  if (!companyName) {
    return (
      <span className={`text-theme-muted italic ${size === "sm" ? "text-xs" : "text-sm"} ${className}`}>
        Sem empresa
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ${
        size === "sm" ? "text-xs" : "text-sm"
      } ${className}`}
    >
      <Building2 className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      <span className="truncate max-w-[120px]">{companyName}</span>
    </span>
  );
}

/**
 * Componente de coluna de tabela para empresa
 * Mostra apenas quando "Todas as Empresas" está selecionado
 */
export function CompanyColumn({
  show,
  companyName,
}: {
  show: boolean;
  companyName?: string | null;
}) {
  if (!show) return null;

  return (
    <td className="px-4 py-3">
      <CompanyBadge companyName={companyName} />
    </td>
  );
}

/**
 * Header de coluna de tabela para empresa
 * Mostra apenas quando "Todas as Empresas" está selecionado
 */
export function CompanyColumnHeader({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <th className="px-4 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
      Empresa
    </th>
  );
}
