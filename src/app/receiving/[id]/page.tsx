"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  ChevronLeft,
  Package,
  Building2,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Loader2,
  Edit,
  Save,
  Plus,
  Minus,
  Truck,
  DollarSign,
  Hash,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <Clock className="w-4 h-4" /> },
  IN_PROGRESS: { label: "Em Conferência", color: "bg-blue-100 text-blue-800 border-blue-200", icon: <Package className="w-4 h-4" /> },
  COMPLETED: { label: "Concluído", color: "bg-green-100 text-green-800 border-green-200", icon: <CheckCircle className="w-4 h-4" /> },
  PARTIAL: { label: "Parcial", color: "bg-orange-100 text-orange-800 border-orange-200", icon: <AlertTriangle className="w-4 h-4" /> },
  REJECTED: { label: "Rejeitado", color: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelado", color: "bg-gray-100 text-gray-800 border-gray-200", icon: <XCircle className="w-4 h-4" /> },
};

interface ItemConference {
  itemId: string;
  receivedQuantity: number;
  notes: string;
}

export default function ReceivingDetailPage() {
  const params = useParams();
  // Router disponível para navegação futura
  const id = params.id as string;

  const [isConferencing, setIsConferencing] = useState(false);
  const [itemConferences, setItemConferences] = useState<Record<string, ItemConference>>({});

  const { data: receiving, isLoading, refetch } = trpc.receiving.getById.useQuery({ id });

  const startConferenceMutation = trpc.receiving.startConference.useMutation({
    onSuccess: () => refetch(),
  });

  const conferItemMutation = trpc.receiving.conferItem.useMutation({
    onSuccess: () => refetch(),
  });

  const completeReceivingMutation = trpc.receiving.complete.useMutation({
    onSuccess: () => {
      refetch();
      setIsConferencing(false);
    },
  });

  const handleStartConference = () => {
    startConferenceMutation.mutate({ id });
    setIsConferencing(true);
    
    // Inicializar conferência com quantidades da NFe
    if (receiving?.items) {
      const initial: Record<string, ItemConference> = {};
      receiving.items.forEach((item) => {
        initial[item.id] = {
          itemId: item.id,
          receivedQuantity: item.nfeQuantity,
          notes: "",
        };
      });
      setItemConferences(initial);
    }
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    setItemConferences((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        receivedQuantity: Math.max(0, (prev[itemId]?.receivedQuantity || 0) + delta),
      },
    }));
  };

  const handleCompleteConference = () => {
    // Conferir cada item
    Object.values(itemConferences).forEach((conf) => {
      conferItemMutation.mutate({
        receivingId: id,
        itemId: conf.itemId,
        receivedQuantity: conf.receivedQuantity,
        notes: conf.notes,
      });
    });

    // Completar recebimento
    completeReceivingMutation.mutate({ id });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!receiving) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Recebimento não encontrado</p>
          <Link href="/receiving" className="text-blue-600 hover:underline mt-2 inline-block">
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  const config = statusConfig[receiving.status] || statusConfig.PENDING;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/receiving" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Entrada #{receiving.code}
                </h1>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
                {config.icon}
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/receiving/${id}/mobile`}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Package className="w-4 h-4" />
                Versão Mobile
              </Link>
              <CompanySwitcher />
              {receiving.status === "PENDING" && !isConferencing && (
                <button
                  onClick={handleStartConference}
                  disabled={startConferenceMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {startConferenceMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Edit className="w-4 h-4" />
                  )}
                  Iniciar Conferência
                </button>
              )}
              {isConferencing && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsConferencing(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCompleteConference}
                    disabled={completeReceivingMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    {completeReceivingMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Finalizar Conferência
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados da NFe */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Dados da NFe
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Número</label>
                  <p className="text-sm font-medium text-gray-900">{receiving.nfeNumber || "-"}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Série</label>
                  <p className="text-sm text-gray-900">{receiving.nfeSeries || "-"}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Data Emissão</label>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(receiving.nfeIssueDate)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Data Recebimento</label>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <Truck className="w-4 h-4 text-gray-400" />
                    {formatDate(receiving.receivingDate)}
                  </p>
                </div>
              </div>
              {receiving.nfeKey && (
                <div className="mt-4">
                  <label className="text-xs text-gray-500 uppercase">Chave de Acesso</label>
                  <p className="text-sm font-mono text-gray-900 break-all">{receiving.nfeKey}</p>
                </div>
              )}
            </div>

            {/* Itens */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Itens ({receiving.items.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">UN</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qtd NFe</th>
                      {isConferencing && (
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qtd Recebida</th>
                      )}
                      {receiving.status === "COMPLETED" && (
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qtd Recebida</th>
                      )}
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Vlr Unit</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {receiving.items.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.material?.description || item.description}
                            </p>
                            {item.material && (
                              <p className="text-xs text-gray-500">
                                {item.material.code}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-500">{item.unit}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {item.nfeQuantity.toLocaleString("pt-BR")}
                        </td>
                        {isConferencing && (
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleQuantityChange(item.id, -1)}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <input
                                type="number"
                                value={itemConferences[item.id]?.receivedQuantity || 0}
                                onChange={(e) => setItemConferences((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    receivedQuantity: parseFloat(e.target.value) || 0,
                                  },
                                }))}
                                className="w-20 text-center border border-gray-300 rounded px-2 py-1"
                              />
                              <button
                                onClick={() => handleQuantityChange(item.id, 1)}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                        {receiving.status === "COMPLETED" && (
                          <td className="px-4 py-3 text-sm text-right">
                            <span className={item.receivedQuantity !== item.nfeQuantity ? "text-orange-600 font-medium" : "text-green-600"}>
                              {item.receivedQuantity?.toLocaleString("pt-BR") || "-"}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm text-right text-gray-500">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Fornecedor */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Fornecedor
              </h3>
              {receiving.supplier ? (
                <div>
                  <p className="font-medium text-gray-900">{receiving.supplier.companyName}</p>
                  <p className="text-sm text-gray-500">{receiving.supplier.cnpj}</p>
                  <p className="text-xs text-gray-400 mt-1">Código: {receiving.supplier.code}</p>
                </div>
              ) : (
                <p className="text-gray-500">Não vinculado</p>
              )}
            </div>

            {/* Valores */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Valores
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Produtos</span>
                  <span className="text-sm text-gray-900">{formatCurrency(receiving.totalValue - (receiving.freightValue || 0))}</span>
                </div>
                {receiving.freightValue && receiving.freightValue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Frete</span>
                    <span className="text-sm text-gray-900">{formatCurrency(receiving.freightValue)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(receiving.totalValue)}</span>
                </div>
              </div>
            </div>

            {/* Pedido de Compra */}
            {receiving.purchaseOrder && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-600" />
                  Pedido de Compra
                </h3>
                <Link
                  href={`/purchase-orders/${receiving.purchaseOrder.id}`}
                  className="text-blue-600 hover:underline"
                >
                  OC #{receiving.purchaseOrder.code}
                </Link>
              </div>
            )}

            {/* Observações */}
            {receiving.notes && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Observações</h3>
                <p className="text-sm text-gray-600">{receiving.notes}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
