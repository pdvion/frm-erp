"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { Flag } from "lucide-react";
import { formatDate } from "@/lib/formatters";

export default function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: goal, isLoading, isError, error } = trpc.gpd.getGoal.useQuery({ id });

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError) return <Alert variant="error" title="Erro">{error.message}</Alert>;
  if (!goal) return <Alert variant="warning" title="Não encontrado">Meta não encontrada.</Alert>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={goal.title}
        icon={<Flag className="w-6 h-6" />}
        backHref="/gpd/goals"
      />

      <div className="bg-theme-card rounded-lg border border-theme p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-theme-muted">Status</span>
            <div className="mt-1"><Badge variant="default">{goal.status}</Badge></div>
          </div>
          <div>
            <span className="text-theme-muted">Categoria</span>
            <p className="text-theme mt-1">{goal.category || "—"}</p>
          </div>
          <div>
            <span className="text-theme-muted">Responsável</span>
            <p className="text-theme mt-1">{goal.owner?.name || "—"}</p>
          </div>
          <div>
            <span className="text-theme-muted">Meta</span>
            <p className="text-theme mt-1 font-semibold">{goal.targetValue != null ? Number(goal.targetValue) : "—"} {goal.unit || ""}</p>
          </div>
          <div>
            <span className="text-theme-muted">Ano</span>
            <p className="text-theme mt-1">{goal.year}</p>
          </div>
          <div>
            <span className="text-theme-muted">Peso</span>
            <p className="text-theme mt-1">{goal.weight != null ? Number(goal.weight) : "—"}</p>
          </div>
          <div className="md:col-span-3">
            <span className="text-theme-muted">Descrição</span>
            <p className="text-theme mt-1">{goal.description || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
