"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { LayoutDashboard, Pencil } from "lucide-react";
import Link from "next/link";

export default function DashboardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: dashboard, isLoading, isError, error } = trpc.bi.getDashboard.useQuery({ id });

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError) return <Alert variant="error" title="Erro">{error.message}</Alert>;
  if (!dashboard) return <Alert variant="warning" title="Não encontrado">Dashboard não encontrado.</Alert>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={dashboard.name}
        icon={<LayoutDashboard className="w-6 h-6" />}
        backHref="/bi/dashboards"
        actions={
          <Link href={`/bi/dashboards/${id}/edit`}>
            <Button variant="outline">
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </Link>
        }
      />

      <div className="bg-theme-card rounded-lg border border-theme p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-theme-muted">Descrição</span>
            <p className="text-theme mt-1">{dashboard.description || "—"}</p>
          </div>
          <div>
            <span className="text-theme-muted">Status</span>
            <div className="mt-1">
              <Badge variant={dashboard.isPublic ? "success" : "default"}>
                {dashboard.isPublic ? "Público" : "Privado"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {dashboard.widgets && Array.isArray(dashboard.widgets) && (
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h3 className="text-sm font-semibold text-theme mb-4">Widgets ({(dashboard.widgets as unknown[]).length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(dashboard.widgets as { title?: string; type?: string }[]).map((w, i) => (
              <div key={i} className="bg-theme-secondary rounded-lg border border-theme p-4">
                <p className="text-sm font-medium text-theme">{w.title || `Widget ${i + 1}`}</p>
                <p className="text-xs text-theme-muted mt-1">{w.type || "chart"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
