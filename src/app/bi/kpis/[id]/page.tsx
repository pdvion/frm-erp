"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { BarChart3 } from "lucide-react";
import { formatDate } from "@/lib/formatters";

export default function KpiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: kpi, isLoading, isError, error } = trpc.bi.getKpi.useQuery({ id });

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError) return <Alert variant="error" title="Erro">{error.message}</Alert>;
  if (!kpi) return <Alert variant="warning" title="Não encontrado">KPI não encontrado.</Alert>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={kpi.name}
        icon={<BarChart3 className="w-6 h-6" />}
        backHref="/bi/kpis"
      />

      <div className="bg-theme-card rounded-lg border border-theme p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-theme-muted">Unidade</span>
            <p className="text-theme mt-1">{kpi.unit || "—"}</p>
          </div>
          <div>
            <span className="text-theme-muted">Meta</span>
            <p className="text-theme mt-1 font-semibold">{kpi.targetExpected != null ? Number(kpi.targetExpected) : "—"}</p>
          </div>
          <div>
            <span className="text-theme-muted">Frequência</span>
            <p className="text-theme mt-1">{kpi.frequency || "—"}</p>
          </div>
          <div>
            <span className="text-theme-muted">Descrição</span>
            <p className="text-theme mt-1">{kpi.description || "—"}</p>
          </div>
          <div>
            <span className="text-theme-muted">Status</span>
            <div className="mt-1">
              <Badge variant={kpi.isActive ? "success" : "default"}>
                {kpi.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
          <div>
            <span className="text-theme-muted">Criado em</span>
            <p className="text-theme mt-1">{formatDate(kpi.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
