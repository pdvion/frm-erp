"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { Target } from "lucide-react";
import { formatDate } from "@/lib/formatters";

export default function ActionPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: action, isLoading, isError, error } = trpc.gpd.getActionPlan.useQuery({ id });

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError) return <Alert variant="error" title="Erro">{error.message}</Alert>;
  if (!action) return <Alert variant="warning" title="Não encontrado">Plano de ação não encontrado.</Alert>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={action.title}
        icon={<Target className="w-6 h-6" />}
        backHref="/gpd/actions"
      />

      <div className="bg-theme-card rounded-lg border border-theme p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-theme-muted">Status</span>
            <div className="mt-1"><Badge variant="default">{action.status}</Badge></div>
          </div>
          <div>
            <span className="text-theme-muted">Responsável</span>
            <p className="text-theme mt-1">{action.responsible?.name || "—"}</p>
          </div>
          <div>
            <span className="text-theme-muted">Prazo</span>
            <p className="text-theme mt-1">{action.dueDate ? formatDate(action.dueDate) : "—"}</p>
          </div>
          <div className="md:col-span-3">
            <span className="text-theme-muted">Descrição</span>
            <p className="text-theme mt-1">{action.description || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
