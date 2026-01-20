"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  ChevronLeft,
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

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Rascunho", color: "bg-gray-100 text-gray-800", icon: <FileText className="w-4 h-4" /> },
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  APPROVED: { label: "Aprovado", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-4 h-4" /> },
  SENT: { label: "Enviado", color: "bg-purple-100 text-purple-800", icon: <Truck className="w-4 h-4" /> },
  PARTIAL: { label: "Parcial", color: "bg-orange-100 text-orange-800", icon: <Package className="w-4 h-4" /> },
  COMPLETED: { label: "Concluído", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-500", icon: <XCircle className="w-4 h-4" /> },
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="font-medium text-red-900">Erro ao carregar pedido</h3>
            <p className="text-red-700 text-sm">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/purchase-orders" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-teal-600" />
                  PC-{order.code.toString().padStart(6, "0")}
                </h1>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                  {config.icon}
                  {config.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CompanySwitcher />
              {canSend && order.status !== "SENT" && (
                <button
                  onClick={() => updateStatusMutation.mutate({ id, status: "SENT" })}
                  disabled={updateStatusMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Enviar ao Fornecedor
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gray-400" />
                Fornecedor
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Razão Social</div>
                  <div className="font-medium text-gray-900">
                    {order.supplier.companyName}
                  </div>
                </div>
                {order.supplier.tradeName && (
                  <div>
                    <div className="text-sm text-gray-500">Nome Fantasia</div>
                    <div className="font-medium text-gray-900">
                      {order.supplier.tradeName}
                    </div>
                  </div>
                )}
                {order.supplier.cnpj && (
                  <div>
                    <div className="text-sm text-gray-500">CNPJ</div>
                    <div className="font-medium text-gray-900">
                      {order.supplier.cnpj}
                    </div>
                  </div>
                )}
                {order.supplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{order.supplier.phone}</span>
                  </div>
                )}
                {order.supplier.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{order.supplier.email}</span>
                  </div>
                )}
                {order.supplier.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>
                      {order.supplier.city}
                      {order.supplier.state && ` - ${order.supplier.state}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-400" />
                  Itens ({order.items.length})
                </h2>
                {canReceive && (
                  <span className="text-sm text-orange-600 font-medium">
                    Aguardando recebimento
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Material
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Qtd Pedida
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Qtd Recebida
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Preço Unit.
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                      {canReceive && (
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Ação
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {order.items.map((item) => {
                      const pendingQty = item.quantity - item.receivedQty;
                      const isComplete = pendingQty <= 0;

                      return (
                        <tr key={item.id} className={`hover:bg-gray-50 ${isComplete ? "bg-green-50" : ""}`}>
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">
                              {item.material.code} - {item.material.description}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.material.category?.name || "Sem categoria"} •{" "}
                              {item.material.unit}
                            </div>
                            {item.quoteItem && (
                              <div className="text-xs text-blue-600 mt-1">
                                Cotação #{order.quote?.code.toString().padStart(6, "0")}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className={`font-medium ${isComplete ? "text-green-600" : "text-orange-600"}`}>
                              {item.receivedQty}
                            </span>
                            {!isComplete && (
                              <span className="text-gray-400 text-sm ml-1">
                                ({pendingQty} pendente)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right text-gray-900">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-gray-900">
                            {formatCurrency(item.totalPrice)}
                          </td>
                          {canReceive && (
                            <td className="px-4 py-4 text-center">
                              {isComplete ? (
                                <span className="inline-flex items-center gap-1 text-green-600 text-sm">
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
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={canReceive ? 4 : 3} className="px-4 py-3 text-right font-medium text-gray-900">
                        Subtotal:
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {formatCurrency(order.totalValue)}
                      </td>
                      {canReceive && <td></td>}
                    </tr>
                    {order.freightValue > 0 && (
                      <tr>
                        <td colSpan={canReceive ? 4 : 3} className="px-4 py-2 text-right text-sm text-gray-500">
                          Frete:
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900">
                          {formatCurrency(order.freightValue)}
                        </td>
                        {canReceive && <td></td>}
                      </tr>
                    )}
                    {order.discountPercent > 0 && (
                      <tr>
                        <td colSpan={canReceive ? 4 : 3} className="px-4 py-2 text-right text-sm text-gray-500">
                          Desconto ({order.discountPercent}%):
                        </td>
                        <td className="px-4 py-2 text-right text-green-600">
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
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-3">
                  Observações
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Status</h3>
              {canEdit ? (
                <select
                  value={order.status}
                  onChange={(e) => updateStatusMutation.mutate({ 
                    id, 
                    status: e.target.value as "DRAFT" | "PENDING" | "APPROVED" | "SENT" | "PARTIAL" | "COMPLETED" | "CANCELLED"
                  })}
                  disabled={updateStatusMutation.isPending}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
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
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Cotação de Origem
                </h3>
                <Link
                  href={`/quotes/${order.quote.id}`}
                  className="text-blue-600 hover:text-blue-800 font-mono text-lg"
                >
                  #{order.quote.code.toString().padStart(6, "0")}
                </Link>
              </div>
            )}

            {/* Dates */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                Datas
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pedido:</span>
                  <span className="font-medium">{formatDate(order.orderDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Previsão Entrega:</span>
                  <span className="font-medium">{formatDate(order.expectedDeliveryDate)}</span>
                </div>
                {order.actualDeliveryDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Entrega Real:</span>
                    <span className="font-medium text-green-600">{formatDate(order.actualDeliveryDate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Terms */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Condições</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-gray-500">Pagamento</div>
                    <div className="font-medium">{order.paymentTerms || "-"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Truck className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-gray-500">Entrega</div>
                    <div className="font-medium">{order.deliveryTerms || "-"}</div>
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Pedido
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Receive Modal */}
      {showReceiveModal && selectedItemId && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="receive-modal-title"
          onKeyDown={(e) => e.key === "Escape" && setShowReceiveModal(false)}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 id="receive-modal-title" className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-teal-600" />
              Registrar Recebimento
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade Recebida
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={receiveQty}
                onChange={(e) => setReceiveQty(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReceiveModal(false);
                  setSelectedItemId(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
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
