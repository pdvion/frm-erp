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
  CANCELLED: { label: "Cancelado", color: "bg-theme-tertiary text-theme border-gray-200", icon: <XCircle className="w-4 h-4" /> },
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
      <div className="space-y-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!receiving) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-theme-muted">Recebimento não encontrado</p>
          <Link href="/receiving" className="text-blue-600 hover:underline mt-2 inline-block">
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  const config = statusConfig[receiving.status] || statusConfig.PENDING;

  return (
    <div className="space-y-6">
      <header className="bg-theme-card border-b border-theme sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/receiving" className="text-theme-muted hover:text-theme-secondary">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-theme">
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
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-sm text-theme-secondary hover:text-theme border border-theme-input rounded-lg hover:bg-theme-hover"
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
                    className="px-4 py-2 text-theme-secondary hover:text-theme"
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
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Dados da NFe
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-theme-muted uppercase">Número</label>
                  <p className="text-sm font-medium text-theme">{receiving.nfeNumber || "-"}</p>
                </div>
                <div>
                  <label className="text-xs text-theme-muted uppercase">Série</label>
                  <p className="text-sm text-theme">{receiving.nfeSeries || "-"}</p>
                </div>
                <div>
                  <label className="text-xs text-theme-muted uppercase">Data Emissão</label>
                  <p className="text-sm text-theme flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-theme-muted" />
                    {formatDate(receiving.nfeIssueDate)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-theme-muted uppercase">Data Recebimento</label>
                  <p className="text-sm text-theme flex items-center gap-1">
                    <Truck className="w-4 h-4 text-theme-muted" />
                    {formatDate(receiving.receivingDate)}
                  </p>
                </div>
              </div>
              {receiving.nfeKey && (
                <div className="mt-4">
                  <label className="text-xs text-theme-muted uppercase">Chave de Acesso</label>
                  <p className="text-sm font-mono text-theme break-all">{receiving.nfeKey}</p>
                </div>
              )}
            </div>

            {/* Itens */}
            <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
              <div className="px-6 py-4 border-b border-theme">
                <h2 className="text-lg font-semibold text-theme flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Itens ({receiving.items.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Material</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">UN</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Qtd NFe</th>
                      {isConferencing && (
                        <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Qtd Recebida</th>
                      )}
                      {receiving.status === "COMPLETED" && (
                        <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Qtd Recebida</th>
                      )}
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Vlr Unit</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {receiving.items.map((item, index) => (
                      <tr key={item.id} className="hover:bg-theme-hover">
                        <td className="px-4 py-3 text-sm text-theme-muted">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-theme">
                              {item.material?.description || item.description}
                            </p>
                            {item.material && (
                              <p className="text-xs text-theme-muted">
                                {item.material.code}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-theme-muted">{item.unit}</td>
                        <td className="px-4 py-3 text-sm text-right text-theme">
                          {item.nfeQuantity.toLocaleString("pt-BR")}
                        </td>
                        {isConferencing && (
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleQuantityChange(item.id, -1)}
                                className="p-1 text-theme-muted hover:text-theme-secondary hover:bg-theme-hover rounded"
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
                                className="w-20 text-center border border-theme-input rounded px-2 py-1"
                              />
                              <button
                                onClick={() => handleQuantityChange(item.id, 1)}
                                className="p-1 text-theme-muted hover:text-theme-secondary hover:bg-theme-hover rounded"
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
                        <td className="px-4 py-3 text-sm text-right text-theme-muted">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-theme">
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
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h3 className="text-sm font-semibold text-theme mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Fornecedor
              </h3>
              {receiving.supplier ? (
                <div>
                  <p className="font-medium text-theme">{receiving.supplier.companyName}</p>
                  <p className="text-sm text-theme-muted">{receiving.supplier.cnpj}</p>
                  <p className="text-xs text-theme-muted mt-1">Código: {receiving.supplier.code}</p>
                </div>
              ) : (
                <p className="text-theme-muted">Não vinculado</p>
              )}
            </div>

            {/* Valores */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h3 className="text-sm font-semibold text-theme mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Valores
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-theme-muted">Produtos</span>
                  <span className="text-sm text-theme">{formatCurrency(receiving.totalValue - (receiving.freightValue || 0))}</span>
                </div>
                {receiving.freightValue && receiving.freightValue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-theme-muted">Frete</span>
                    <span className="text-sm text-theme">{formatCurrency(receiving.freightValue)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-theme">
                  <span className="text-sm font-semibold text-theme">Total</span>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(receiving.totalValue)}</span>
                </div>
              </div>
            </div>

            {/* Pedido de Compra */}
            {receiving.purchaseOrder && (
              <div className="bg-theme-card rounded-lg border border-theme p-6">
                <h3 className="text-sm font-semibold text-theme mb-4 flex items-center gap-2">
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
              <div className="bg-theme-card rounded-lg border border-theme p-6">
                <h3 className="text-sm font-semibold text-theme mb-2">Observações</h3>
                <p className="text-sm text-theme-secondary">{receiving.notes}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
