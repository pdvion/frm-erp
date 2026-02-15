"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { ClipboardList } from "lucide-react";
import { formatDate } from "@/lib/formatters";

export default function PickingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: picking, isLoading, isError, error } = trpc.picking.byId.useQuery({ id });

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError) return <Alert variant="error" title="Erro">{error.message}</Alert>;
  if (!picking) return <Alert variant="warning" title="Não encontrado">Lista de separação não encontrada.</Alert>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Picking #${picking.code}`}
        icon={<ClipboardList className="w-6 h-6" />}
        backHref="/picking"
      />

      <div className="bg-theme-card rounded-lg border border-theme p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-theme-muted">Status</span>
            <div className="mt-1"><Badge variant="default">{picking.status}</Badge></div>
          </div>
          <div>
            <span className="text-theme-muted">Criado em</span>
            <p className="text-theme mt-1">{formatDate(picking.createdAt)}</p>
          </div>
          <div>
            <span className="text-theme-muted">Observações</span>
            <p className="text-theme mt-1">{picking.notes || "—"}</p>
          </div>
        </div>
      </div>

      {picking.items && picking.items.length > 0 && (
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          <div className="p-4 border-b border-theme">
            <h3 className="text-sm font-semibold text-theme">Itens ({picking.items.length})</h3>
          </div>
          <table className="w-full">
            <thead className="bg-theme-table-header border-b border-theme">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Material</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Qtd Solicitada</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Qtd Separada</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-table">
              {picking.items.map((item) => (
                <tr key={item.id} className="hover:bg-theme-table-hover transition-colors">
                  <td className="px-4 py-3 text-sm text-theme">{item.material?.description || item.materialId}</td>
                  <td className="px-4 py-3 text-sm text-theme text-right">{Number(item.requestedQty)}</td>
                  <td className="px-4 py-3 text-sm text-theme text-right">{Number(item.pickedQty ?? 0)}</td>
                  <td className="px-4 py-3 text-sm"><Badge variant="default">{item.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
