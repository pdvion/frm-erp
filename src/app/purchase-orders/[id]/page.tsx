"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import {
  ShoppingCart,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Loader2,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
  Package,
  Calendar,
  CreditCard,
  FileText,
  Trash2,
  Send,
  PackageCheck,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Rascunho", color: "text-theme-muted", bgColor: "bg-theme-secondary", icon: <FileText className="w-4 h-4" /> },
  PENDING: { label: "Pendente", color: "text-yellow-400", bgColor: "bg-yellow-900/30", icon: <Clock className="w-4 h-4" /> },
  APPROVED: { label: "Aprovado", color: "text-blue-400", bgColor: "bg-blue-900/30", icon: <CheckCircle className="w-4 h-4" /> },
  SENT: { label: "Enviado", color: "text-purple-400", bgColor: "bg-purple-900/30", icon: <Truck className="w-4 h-4" /> },
  PARTIAL: { label: "Parcial", color: "text-orange-400", bgColor: "bg-orange-900/30", icon: <Package className="w-4 h-4" /> },
  COMPLETED: { label: "Concluído", color: "text-green-400", bgColor: "bg-green-900/30", icon: <CheckCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelado", color: "text-red-400", bgColor: "bg-red-900/30", icon: <XCircle className="w-4 h-4" /> },
};

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [receiveQty, setReceiveQty] = useState<number>(0);

  const { data: order, isLoading, error, refetch } = trpc.purchaseOrders.byId.useQuery({ id });
  const utils = trpc.useUtils();

  const updateStatusMutation = trpc.purchaseOrders.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      utils.purchaseOrders.list.invalidate();
    },
  });

  const registerReceiptMutation = trpc.purchaseOrders.registerReceipt.useMutation({
    onSuccess: () => {
      setShowReceiveModal(false);
      setSelectedItemId(null);
      setReceiveQty(0);
      refetch();
      utils.purchaseOrders.list.invalidate();
    },
  });

  const deleteMutation = trpc.purchaseOrders.delete.useMutation({
    onSuccess: () => {
      router.push("/purchase-orders");
    },
  });


  const handleReceive = (itemId: string, pendingQty: number) => {
    setSelectedItemId(itemId);
    setReceiveQty(pendingQty);
    setShowReceiveModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <div>
            <h3 className="font-medium text-theme">Erro ao carregar pedido</h3>
            <p className="text-red-400 text-sm">
              {error?.message || "Pedido não encontrado"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const config = statusConfig[order.status];
  const canEdit = order.status === "DRAFT";
  const canSend = ["DRAFT", "PENDING", "APPROVED"].includes(order.status);
  const canReceive = ["SENT", "PARTIAL"].includes(order.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`PC-${order.code.toString().padStart(6, "0")}`}
        icon={<ShoppingCart className="w-6 h-6" />}
        backHref="/purchase-orders"
        badge={{ label: config.label, color: config.color, bgColor: config.bgColor }}
      >
        {canSend && order.status !== "SENT" && (
          <button
            onClick={() => updateStatusMutation.mutate({ id, status: "SENT" })}
            disabled={updateStatusMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Enviar ao Fornecedor
          </button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier Info */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h2 className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-theme-muted" />
              Fornecedor
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-theme-muted">Razão Social</div>
                <div className="font-medium text-theme">
                  {order.supplier.companyName}
                </div>
              </div>
              {order.supplier.tradeName && (
                <div>
                  <div className="text-sm text-theme-muted">Nome Fantasia</div>
                  <div className="font-medium text-theme">
                    {order.supplier.tradeName}
                  </div>
                </div>
              )}
              {order.supplier.cnpj && (
                <div>
                  <div className="text-sm text-theme-muted">CNPJ</div>
                  <div className="font-medium text-theme">
                    {order.supplier.cnpj}
                  </div>
                </div>
              )}
              {order.supplier.phone && (
                <div className="flex items-center gap-2 text-theme-secondary">
                  <Phone className="w-4 h-4 text-theme-muted" />
                  <span>{order.supplier.phone}</span>
                </div>
              )}
              {order.supplier.email && (
                <div className="flex items-center gap-2 text-theme-secondary">
                  <Mail className="w-4 h-4 text-theme-muted" />
                  <span>{order.supplier.email}</span>
                </div>
              )}
              {order.supplier.city && (
                <div className="flex items-center gap-2 text-theme-secondary">
                  <MapPin className="w-4 h-4 text-theme-muted" />
                  <span>
                    {order.supplier.city}
                    {order.supplier.state && ` - ${order.supplier.state}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-theme flex items-center gap-2">
                <Package className="w-5 h-5 text-theme-muted" />
                Itens ({order.items.length})
              </h2>
              {canReceive && (
                <span className="text-sm text-orange-400 font-medium">
                  Aguardando recebimento
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-theme-table">
                <thead className="bg-theme-table-header">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                      Material
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                      Qtd Pedida
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                      Qtd Recebida
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                      Preço Unit.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                      Total
                    </th>
                    {canReceive && (
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Ação
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {order.items.map((item) => {
                    const pendingQty = item.quantity - item.receivedQty;
                    const isComplete = pendingQty <= 0;

                    return (
                      <tr key={item.id} className={`hover:bg-theme-table-hover ${isComplete ? "bg-green-900/20" : ""}`}>
                        <td className="px-4 py-4">
                          <div className="font-medium text-theme">
                            {item.material.code} - {item.material.description}
                          </div>
                          <div className="text-sm text-theme-muted">
                            {item.material.category?.name || "Sem categoria"} •{" "}
                            {item.material.unit}
                          </div>
                          {item.quoteItem && (
                            <div className="text-xs text-blue-400 mt-1">
                              Cotação #{order.quote?.code.toString().padStart(6, "0")}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right text-theme">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className={`font-medium ${isComplete ? "text-green-400" : "text-orange-400"}`}>
                            {item.receivedQty}
                          </span>
                          {!isComplete && (
                            <span className="text-theme-muted text-sm ml-1">
                              ({pendingQty} pendente)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right text-theme">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-theme">
                          {formatCurrency(item.totalPrice)}
                        </td>
                        {canReceive && (
                          <td className="px-4 py-4 text-center">
                            {isComplete ? (
                              <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                                <CheckCircle className="w-4 h-4" />
                                Completo
                              </span>
                            ) : (
                              <button
                                onClick={() => handleReceive(item.id, pendingQty)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700"
                              >
                                <PackageCheck className="w-4 h-4" />
                                Receber
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-theme-table-header">
                  <tr>
                    <td colSpan={canReceive ? 4 : 3} className="px-4 py-3 text-right font-medium text-theme">
                      Subtotal:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-theme">
                      {formatCurrency(order.totalValue)}
                    </td>
                    {canReceive && <td></td>}
                  </tr>
                  {order.freightValue > 0 && (
                    <tr>
                      <td colSpan={canReceive ? 4 : 3} className="px-4 py-2 text-right text-sm text-theme-secondary">
                        Frete:
                      </td>
                      <td className="px-4 py-2 text-right text-theme">
                        {formatCurrency(order.freightValue)}
                      </td>
                      {canReceive && <td></td>}
                    </tr>
                  )}
                  {order.discountPercent > 0 && (
                    <tr>
                      <td colSpan={canReceive ? 4 : 3} className="px-4 py-2 text-right text-sm text-theme-secondary">
                        Desconto ({order.discountPercent}%):
                      </td>
                      <td className="px-4 py-2 text-right text-green-400">
                        -{formatCurrency(order.totalValue * (order.discountPercent / 100))}
                      </td>
                      {canReceive && <td></td>}
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-medium text-theme mb-3">
                Observações
              </h2>
              <p className="text-theme-secondary whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Actions */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h3 className="font-medium text-theme mb-4">Status</h3>
            {canEdit ? (
              <select
                value={order.status}
                onChange={(e) => updateStatusMutation.mutate({ 
                  id, 
                  status: e.target.value as "DRAFT" | "PENDING" | "APPROVED" | "SENT" | "PARTIAL" | "COMPLETED" | "CANCELLED"
                })}
                disabled={updateStatusMutation.isPending}
                className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-teal-500"
              >
                <option value="DRAFT">Rascunho</option>
                <option value="PENDING">Pendente</option>
                <option value="APPROVED">Aprovado</option>
              </select>
            ) : (
              <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${config.color}`}>
                {config.icon}
                {config.label}
              </span>
            )}
          </div>

          {/* Quote Reference */}
          {order.quote && (
            <div className="bg-blue-900/20 rounded-lg border border-blue-800 p-6">
              <h3 className="font-medium text-blue-400 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Cotação de Origem
              </h3>
              <Link
                href={`/quotes/${order.quote.id}`}
                className="text-blue-400 hover:text-blue-300 font-mono text-lg"
              >
                #{order.quote.code.toString().padStart(6, "0")}
              </Link>
            </div>
          )}

          {/* Dates */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h3 className="font-medium text-theme mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-theme-muted" />
              Datas
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-muted">Pedido:</span>
                <span className="font-medium text-theme">{formatDate(order.orderDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Previsão Entrega:</span>
                <span className="font-medium text-theme">{formatDate(order.expectedDeliveryDate)}</span>
              </div>
              {order.actualDeliveryDate && (
                <div className="flex justify-between">
                  <span className="text-theme-muted">Entrega Real:</span>
                  <span className="font-medium text-green-400">{formatDate(order.actualDeliveryDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Terms */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h3 className="font-medium text-theme mb-4">Condições</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CreditCard className="w-4 h-4 text-theme-muted mt-0.5" />
                <div>
                  <div className="text-theme-muted">Pagamento</div>
                  <div className="font-medium text-theme">{order.paymentTerms || "-"}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-theme-muted mt-0.5" />
                <div>
                  <div className="text-theme-muted">Entrega</div>
                  <div className="font-medium text-theme">{order.deliveryTerms || "-"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Delete */}
          {canEdit && (
            <button
              onClick={() => {
                if (confirm("Tem certeza que deseja excluir este pedido?")) {
                  deleteMutation.mutate({ id });
                }
              }}
              disabled={deleteMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-800 text-red-400 rounded-lg hover:bg-red-900/20 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Pedido
            </button>
          )}
        </div>
      </div>

      {/* Receive Modal */}
      {showReceiveModal && selectedItemId && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="receive-modal-title"
          onKeyDown={(e) => e.key === "Escape" && setShowReceiveModal(false)}
        >
          <div className="bg-theme-card border border-theme rounded-lg p-6 w-full max-w-md mx-4">
            <h3 id="receive-modal-title" className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-teal-500" />
              Registrar Recebimento
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-secondary mb-1">
                Quantidade Recebida
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={receiveQty}
                onChange={(e) => setReceiveQty(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReceiveModal(false);
                  setSelectedItemId(null);
                }}
                className="flex-1 px-4 py-2 border border-theme text-theme-secondary rounded-lg hover:bg-theme-hover"
              >
                Cancelar
              </button>
              <button
                onClick={() => registerReceiptMutation.mutate({ 
                  itemId: selectedItemId, 
                  receivedQty: receiveQty 
                })}
                disabled={registerReceiptMutation.isPending || receiveQty <= 0}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {registerReceiptMutation.isPending ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
