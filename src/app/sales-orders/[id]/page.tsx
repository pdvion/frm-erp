"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { ShoppingCart } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/formatters";

export default function SalesOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, isLoading, isError, error } = trpc.salesOrders.byId.useQuery({ id });

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError) return <Alert variant="error" title="Erro">{error.message}</Alert>;
  if (!order) return <Alert variant="warning" title="Não encontrado">Pedido de venda não encontrado.</Alert>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Pedido #${order.code}`}
        icon={<ShoppingCart className="w-6 h-6" />}
        backHref="/sales/orders"
      />

      <div className="bg-theme-card rounded-lg border border-theme p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-theme-muted">Cliente</span>
            <p className="text-theme mt-1 font-medium">{order.customer?.companyName || "—"}</p>
          </div>
          <div>
            <span className="text-theme-muted">Data</span>
            <p className="text-theme mt-1">{formatDate(order.orderDate)}</p>
          </div>
          <div>
            <span className="text-theme-muted">Status</span>
            <div className="mt-1"><Badge variant="default">{order.status}</Badge></div>
          </div>
          <div>
            <span className="text-theme-muted">Valor Total</span>
            <p className="text-theme mt-1 font-semibold">{formatCurrency(Number(order.totalValue ?? 0))}</p>
          </div>
          <div>
            <span className="text-theme-muted">Condição de Pagamento</span>
            <p className="text-theme mt-1">{order.paymentTerms || "—"}</p>
          </div>
          <div>
            <span className="text-theme-muted">Observações</span>
            <p className="text-theme mt-1">{order.notes || "—"}</p>
          </div>
        </div>
      </div>

      {order.items && order.items.length > 0 && (
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          <div className="p-4 border-b border-theme">
            <h3 className="text-sm font-semibold text-theme">Itens ({order.items.length})</h3>
          </div>
          <table className="w-full">
            <thead className="bg-theme-table-header border-b border-theme">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Material</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Qtd</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Preço Unit.</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-table">
              {order.items.map((item) => (
                <tr key={item.id} className="hover:bg-theme-table-hover transition-colors">
                  <td className="px-4 py-3 text-sm text-theme">{item.material?.description || item.materialId}</td>
                  <td className="px-4 py-3 text-sm text-theme text-right">{Number(item.quantity)}</td>
                  <td className="px-4 py-3 text-sm text-theme text-right">{formatCurrency(Number(item.unitPrice ?? 0))}</td>
                  <td className="px-4 py-3 text-sm text-theme text-right font-medium">{formatCurrency(Number(item.totalPrice ?? 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
