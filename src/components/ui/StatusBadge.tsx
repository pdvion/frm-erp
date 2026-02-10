"use client";

import { Badge } from "@/components/ui/Badge";
import type { ReactNode } from "react";

type StatusVariant = "success" | "warning" | "error" | "info" | "default" | "purple" | "orange" | "cyan" | "pink";

interface StatusBadgeProps {
  status: string;
  children?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

const STATUS_MAP: Record<string, { variant: StatusVariant; label: string }> = {
  // Common entity statuses
  ACTIVE: { variant: "success", label: "Ativo" },
  INACTIVE: { variant: "default", label: "Inativo" },
  BLOCKED: { variant: "error", label: "Bloqueado" },

  // Workflow / process statuses
  PENDING: { variant: "warning", label: "Pendente" },
  IN_PROGRESS: { variant: "info", label: "Em Andamento" },
  COMPLETED: { variant: "success", label: "Concluído" },
  CANCELLED: { variant: "error", label: "Cancelado" },
  REJECTED: { variant: "error", label: "Rejeitado" },

  // Approval statuses
  APPROVED: { variant: "success", label: "Aprovado" },
  WAITING_APPROVAL: { variant: "warning", label: "Aguardando Aprovação" },

  // Financial statuses
  PAID: { variant: "success", label: "Pago" },
  OVERDUE: { variant: "error", label: "Vencido" },
  PARTIAL: { variant: "warning", label: "Parcial" },
  OPEN: { variant: "info", label: "Aberto" },

  // Product statuses
  DRAFT: { variant: "default", label: "Rascunho" },
  PUBLISHED: { variant: "success", label: "Publicado" },
  ARCHIVED: { variant: "default", label: "Arquivado" },

  // Receiving statuses
  RECEIVED: { variant: "success", label: "Recebido" },
  RETURNED: { variant: "error", label: "Devolvido" },

  // Quality
  CONFORMING: { variant: "success", label: "Conforme" },
  NON_CONFORMING: { variant: "error", label: "Não Conforme" },

  // Priority
  URGENT: { variant: "error", label: "Urgente" },
  HIGH: { variant: "orange", label: "Alta" },
  MEDIUM: { variant: "warning", label: "Média" },
  LOW: { variant: "info", label: "Baixa" },
};

/**
 * StatusBadge — maps common status strings to DS Badge variants.
 * Falls back to "default" variant for unknown statuses.
 */
export function StatusBadge({ status, children, icon, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { variant: "default" as StatusVariant, label: status };

  return (
    <Badge variant={config.variant} className={className}>
      {icon && <span className="mr-1">{icon}</span>}
      {children ?? config.label}
    </Badge>
  );
}
