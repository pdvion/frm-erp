"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function ProductionCostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: cost, isLoading, isError, error } = trpc.productionCosts.byId.useQuery({ id });

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError) return <Alert variant="error" title="Erro">{error.message}</Alert>;
  if (!cost) return <Alert variant="warning" title="Não encontrado">Custo de produção não encontrado.</Alert>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Custo de Produção #${id.substring(0, 8)}`}
        icon={<Calculator className="w-6 h-6" />}
        backHref="/production/costs"
      />

      <div className="bg-theme-card rounded-lg border border-theme p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-theme-muted">Produto</span>
            <p className="text-theme mt-1 font-medium">{cost.productionOrder?.product?.description || "—"}</p>
          </div>
          <div>
            <span className="text-theme-muted">Custo Material</span>
            <p className="text-theme mt-1">{formatCurrency(Number(cost.materialCost ?? 0))}</p>
          </div>
          <div>
            <span className="text-theme-muted">Custo Mão de Obra</span>
            <p className="text-theme mt-1">{formatCurrency(Number(cost.laborCost ?? 0))}</p>
          </div>
          <div>
            <span className="text-theme-muted">Overhead</span>
            <p className="text-theme mt-1">{formatCurrency(Number(cost.overheadCost ?? 0))}</p>
          </div>
          <div>
            <span className="text-theme-muted">Custo Total</span>
            <p className="text-theme mt-1 font-semibold">{formatCurrency(Number(cost.totalCost ?? 0))}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
