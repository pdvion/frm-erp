"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { Wallet } from "lucide-react";
import { formatDate } from "@/lib/formatters";

export default function BudgetVersionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: version, isLoading, isError, error } = trpc.budget.getVersion.useQuery({ id });

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError) return <Alert variant="error" title="Erro">{error.message}</Alert>;
  if (!version) return <Alert variant="warning" title="Não encontrado">Versão orçamentária não encontrada.</Alert>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Versão: ${version.name}`}
        icon={<Wallet className="w-6 h-6" />}
        backHref="/budget"
      />

      <div className="bg-theme-card rounded-lg border border-theme p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-theme-muted">Status</span>
            <div className="mt-1"><Badge variant="default">{version.status}</Badge></div>
          </div>
          <div>
            <span className="text-theme-muted">Ano</span>
            <p className="text-theme mt-1">{version.year}</p>
          </div>
          <div>
            <span className="text-theme-muted">Criado em</span>
            <p className="text-theme mt-1">{formatDate(version.createdAt)}</p>
          </div>
          <div className="md:col-span-3">
            <span className="text-theme-muted">Descrição</span>
            <p className="text-theme mt-1">{version.description || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
