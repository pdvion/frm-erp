"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { LayoutDashboard } from "lucide-react";

export default function DashboardEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: dashboard, isLoading, isError, error } = trpc.bi.getDashboard.useQuery({ id });

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError) return <Alert variant="error" title="Erro">{error.message}</Alert>;
  if (!dashboard) return <Alert variant="warning" title="Não encontrado">Dashboard não encontrado.</Alert>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar: ${dashboard.name}`}
        icon={<LayoutDashboard className="w-6 h-6" />}
        backHref={`/bi/dashboards/${id}`}
      />
      <Alert variant="info" title="Em desenvolvimento">
        A edição visual de dashboards será implementada em breve.
      </Alert>
    </div>
  );
}
