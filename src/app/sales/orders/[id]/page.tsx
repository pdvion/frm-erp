"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Package,
  Loader2,
  Building2,
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Factory,
  MapPin,
  CreditCard,
  FileText,
  Box,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  CONFIRMED: { label: "Confirmado", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-4 h-4" /> },
  IN_PRODUCTION: { label: "Em Produção", color: "bg-purple-100 text-purple-800", icon: <Factory className="w-4 h-4" /> },
  READY: { label: "Pronto", color: "bg-indigo-100 text-indigo-800", icon: <Package className="w-4 h-4" /> },
  SHIPPED: { label: "Enviado", color: "bg-orange-100 text-orange-800", icon: <Truck className="w-4 h-4" /> },
  DELIVERED: { label: "Entregue", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
};

export default function SalesOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: order, isLoading, refetch } = trpc.salesOrders.byId.useQuery({ id });
  const utils = trpc.useUtils();

  const confirmMutation = trpc.salesOrders.confirm.useMutation({
    onSuccess: () => {
      refetch();
      utils.salesOrders.list.invalidate();
    },
  });

  const shipMutation = trpc.salesOrders.ship.useMutation({
    onSuccess: () => {
      refetch();
      utils.salesOrders.list.invalidate();
    },
  });

  const deliverMutation = trpc.salesOrders.deliver.useMutation({
    onSuccess: () => {
      refetch();
      utils.salesOrders.list.invalidate();
    },
  });

  const cancelMutation = trpc.salesOrders.cancel.useMutation({
    onSuccess: () => {
      refetch();
      utils.salesOrders.list.invalidate();
    },
  });

  const handleConfirm = () => {
    if (confirm("Confirmar este pedido?")) {
      confirmMutation.mutate({ id });
    }
  };

  const handleShip = () => {
    const trackingCode = prompt("Código de rastreio (opcional):");
    shipMutation.mutate({ id, trackingCode: trackingCode || undefined });
  };

  const handleDeliver = () => {
    if (confirm("Marcar pedido como entregue?")) {
      deliverMutation.mutate({ id });
    }
  };

  const handleCancel = () => {
    const reason = prompt("Motivo do cancelamento:");
    if (reason) {
      cancelMutation.mutate({ id, reason });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-theme-muted mb-4">Pedido não encontrado</p>
        <Link href="/sales/orders" className="text-green-600 hover:underline">
          Voltar para lista
        </Link>
      </div>
    );
  }

  const config = statusConfig[order.status] || statusConfig.PENDING;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Pedido #${order.code}`}
        icon={<Package className="w-6 h-6" />}
        backHref="/sales/orders"
        module="sales"
        badge={{ label: config.label, color: config.color.split(" ")[1], bgColor: config.color.split(" ")[0] }}
        actions={
          <div className="flex items-center gap-2">
            {order.status === "PENDING" && (
              <Button
                onClick={handleConfirm}
                isLoading={confirmMutation.isPending}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Confirmar
              </Button>
            )}
            {["CONFIRMED", "READY"].includes(order.status) && (
              <Button
                onClick={handleShip}
                isLoading={shipMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
                leftIcon={<Truck className="w-4 h-4" />}
              >
                Enviar
              </Button>
            )}
            {order.status === "SHIPPED" && (
              <Button
                onClick={handleDeliver}
                isLoading={deliverMutation.isPending}
                variant="success"
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Entregar
              </Button>
            )}
            {!["DELIVERED", "CANCELLED"].includes(order.status) && (
              <Button
                onClick={handleCancel}
                isLoading={cancelMutation.isPending}
                variant="danger"
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Cancelar
              </Button>
            )}
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cliente */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-theme-muted" />
                Cliente
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-theme-muted">Razão Social</label>
                  <p className="text-theme font-medium">{order.customer.companyName}</p>
                </div>
                <div>
                  <label className="text-sm text-theme-muted">Código</label>
                  <p className="text-theme">{order.customer.code}</p>
                </div>
                {order.customer.cnpj && (
                  <div>
                    <label className="text-sm text-theme-muted">CNPJ</label>
                    <p className="text-theme">{order.customer.cnpj}</p>
                  </div>
                )}
                {order.customer.email && (
                  <div>
                    <label className="text-sm text-theme-muted">Email</label>
                    <p className="text-theme">{order.customer.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Itens */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                <Box className="w-5 h-5 text-theme-muted" />
                Itens do Pedido ({order.items.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-theme-muted uppercase">
                        Produto
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-theme-muted uppercase">
                        Qtd
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-theme-muted uppercase">
                        Preço Unit.
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-theme-muted uppercase">
                        Desc.
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-theme-muted uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          <div className="font-medium text-theme">{item.material.description}</div>
                          <div className="text-xs text-theme-muted">Cód: {item.material.code}</div>
                        </td>
                        <td className="px-3 py-2 text-right text-theme">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-3 py-2 text-right text-theme">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right text-theme-muted">
                          {item.discountPercent > 0 ? `${item.discountPercent}%` : "-"}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-theme">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Observações */}
            {(order.notes || order.internalNotes) && (
              <div className="bg-theme-card rounded-lg border border-theme p-6">
                <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-theme-muted" />
                  Observações
                </h2>
                {order.notes && (
                  <div className="mb-4">
                    <label className="text-sm text-theme-muted">Observações</label>
                    <p className="text-theme whitespace-pre-wrap">{order.notes}</p>
                  </div>
                )}
                {order.internalNotes && (
                  <div>
                    <label className="text-sm text-theme-muted">Observações Internas</label>
                    <p className="text-theme whitespace-pre-wrap">{order.internalNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Totais */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4">Totais</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-theme-muted">Subtotal</span>
                  <span className="text-theme">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discountPercent > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Desconto ({order.discountPercent}%)</span>
                    <span>-{formatCurrency(order.subtotal * order.discountPercent / 100)}</span>
                  </div>
                )}
                {order.discountValue > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Desconto</span>
                    <span>-{formatCurrency(order.discountValue)}</span>
                  </div>
                )}
                {order.shippingValue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Frete</span>
                    <span className="text-theme">{formatCurrency(order.shippingValue)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-theme font-semibold text-lg">
                  <span className="text-theme">Total</span>
                  <span className="text-green-600">{formatCurrency(order.totalValue)}</span>
                </div>
              </div>
            </div>

            {/* Entrega */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-theme-muted" />
                Entrega
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-theme-muted">Previsão</span>
                  <span className="text-theme">
                    {order.deliveryDate ? formatDate(order.deliveryDate) : "-"}
                  </span>
                </div>
                {order.shippingMethod && (
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Método</span>
                    <span className="text-theme">{order.shippingMethod}</span>
                  </div>
                )}
                {order.trackingCode && (
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Rastreio</span>
                    <span className="text-theme font-mono">{order.trackingCode}</span>
                  </div>
                )}
                {order.shippingAddress && (
                  <div className="pt-2 border-t border-theme">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-theme-muted mt-0.5" />
                      <span className="text-theme">{order.shippingAddress}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pagamento */}
            {order.paymentTerms && (
              <div className="bg-theme-card rounded-lg border border-theme p-6">
                <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-theme-muted" />
                  Pagamento
                </h2>
                <p className="text-theme">{order.paymentTerms}</p>
              </div>
            )}

            {/* Datas */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-theme-muted" />
                Histórico
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-theme-muted">Criado em</span>
                  <span className="text-theme">{formatDateTime(order.createdAt)}</span>
                </div>
                {order.shippedAt && (
                  <div className="flex justify-between text-orange-600">
                    <span>Enviado em</span>
                    <span>{formatDateTime(order.shippedAt)}</span>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="flex justify-between text-green-600">
                    <span>Entregue em</span>
                    <span>{formatDateTime(order.deliveredAt)}</span>
                  </div>
                )}
                {order.cancelledAt && (
                  <div className="flex justify-between text-red-600">
                    <span>Cancelado em</span>
                    <span>{formatDateTime(order.cancelledAt)}</span>
                  </div>
                )}
              </div>
              {order.cancellationReason && (
                <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
                  <strong>Motivo:</strong> {order.cancellationReason}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
