"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Package,
  ChevronLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Play,
  Send,
  Ban,
  Check,
  Minus,
  Plus,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: "Rascunho", color: "text-gray-600", bgColor: "bg-gray-100" },
  PENDING: { label: "Aguardando Aprovação", color: "text-yellow-800", bgColor: "bg-yellow-100" },
  APPROVED: { label: "Aprovada", color: "text-blue-800", bgColor: "bg-blue-100" },
  IN_SEPARATION: { label: "Em Separação", color: "text-purple-800", bgColor: "bg-purple-100" },
  PARTIAL: { label: "Parcialmente Atendida", color: "text-orange-800", bgColor: "bg-orange-100" },
  COMPLETED: { label: "Concluída", color: "text-green-800", bgColor: "bg-green-100" },
  CANCELLED: { label: "Cancelada", color: "text-red-600", bgColor: "bg-red-100" },
};

export default function RequisitionDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [separatingItem, setSeparatingItem] = useState<string | null>(null);
  const [separateQty, setSeparateQty] = useState("");

  const { data: requisition, isLoading, refetch } = trpc.requisitions.byId.useQuery({ id });
  const utils = trpc.useUtils();

  const submitMutation = trpc.requisitions.submit.useMutation({
    onSuccess: () => refetch(),
  });

  const approveMutation = trpc.requisitions.approve.useMutation({
    onSuccess: () => refetch(),
  });

  const startSeparationMutation = trpc.requisitions.startSeparation.useMutation({
    onSuccess: () => refetch(),
  });

  const separateItemMutation = trpc.requisitions.separateItem.useMutation({
    onSuccess: () => {
      setSeparatingItem(null);
      setSeparateQty("");
      refetch();
    },
  });

  const cancelMutation = trpc.requisitions.cancel.useMutation({
    onSuccess: () => {
      setShowCancelModal(false);
      refetch();
    },
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("pt-BR");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!requisition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Requisição não encontrada</h3>
          <Link href="/requisitions" className="text-indigo-600 hover:text-indigo-800">
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  const config = statusConfig[requisition.status];
  const canSubmit = requisition.status === "DRAFT" && requisition.items.length > 0;
  const canApprove = requisition.status === "PENDING";
  const canStartSeparation = requisition.status === "APPROVED";
  const canSeparate = ["APPROVED", "IN_SEPARATION", "PARTIAL"].includes(requisition.status);
  const canCancel = !["COMPLETED", "CANCELLED"].includes(requisition.status) && 
    !requisition.items.some((i) => i.separatedQty > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/requisitions" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Package className="w-6 h-6 text-indigo-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Requisição #{requisition.code}
                </h1>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}>
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <CompanySwitcher />
              
              {canCancel && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                >
                  <Ban className="w-4 h-4" />
                  Cancelar
                </button>
              )}

              {canSubmit && (
                <button
                  onClick={() => submitMutation.mutate({ id })}
                  disabled={submitMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Enviar para Aprovação
                </button>
              )}

              {canApprove && (
                <button
                  onClick={() => approveMutation.mutate({ id })}
                  disabled={approveMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Aprovar
                </button>
              )}

              {canStartSeparation && (
                <button
                  onClick={() => startSeparationMutation.mutate({ id })}
                  disabled={startSeparationMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {startSeparationMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Iniciar Separação
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
            {/* Items Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Itens da Requisição</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Material
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Solicitado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Aprovado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Separado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Estoque
                      </th>
                      {canSeparate && (
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Ação
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {requisition.items.map((item) => {
                      const approved = item.approvedQty ?? item.requestedQty;
                      const remaining = approved - item.separatedQty;
                      const inventory = item.material.inventory[0];
                      const available = inventory?.availableQty || 0;
                      const isComplete = item.separatedQty >= approved;

                      return (
                        <tr key={item.id} className={isComplete ? "bg-green-50" : ""}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">
                              {item.material.description}
                            </div>
                            <div className="text-sm text-gray-500">
                              Cód: {item.material.code}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {item.requestedQty}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {item.approvedQty ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={isComplete ? "text-green-600 font-medium" : "text-gray-900"}>
                              {item.separatedQty}
                            </span>
                            {!isComplete && remaining > 0 && (
                              <span className="text-gray-400 text-sm ml-1">
                                (falta {remaining})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={available < remaining ? "text-red-600" : "text-gray-600"}>
                              {available}
                            </span>
                          </td>
                          {canSeparate && (
                            <td className="px-4 py-3 text-center">
                              {!isComplete && (
                                separatingItem === item.id ? (
                                  <div className="flex items-center gap-2 justify-center">
                                    <input
                                      type="number"
                                      value={separateQty}
                                      onChange={(e) => setSeparateQty(e.target.value)}
                                      placeholder={String(Math.min(remaining, available))}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                      max={Math.min(remaining, available)}
                                      min={0}
                                    />
                                    <button
                                      onClick={() => {
                                        const qty = parseFloat(separateQty) || Math.min(remaining, available);
                                        if (qty > 0) {
                                          separateItemMutation.mutate({
                                            itemId: item.id,
                                            quantity: qty,
                                          });
                                        }
                                      }}
                                      disabled={separateItemMutation.isPending}
                                      className="p-1 text-green-600 hover:text-green-800"
                                    >
                                      {separateItemMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Check className="w-4 h-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSeparatingItem(null);
                                        setSeparateQty("");
                                      }}
                                      className="p-1 text-gray-400 hover:text-gray-600"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setSeparatingItem(item.id)}
                                    disabled={available <= 0}
                                    className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Separar
                                  </button>
                                )
                              )}
                              {isComplete && (
                                <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {separateItemMutation.error && (
                <div className="px-6 py-3 bg-red-50 border-t border-red-200">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{separateItemMutation.error.message}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Informações</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipo</span>
                  <span className="font-medium text-gray-900">{requisition.type}</span>
                </div>
                {requisition.orderNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">OP/OS</span>
                    <span className="font-medium text-gray-900">{requisition.orderNumber}</span>
                  </div>
                )}
                {requisition.costCenter && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Centro de Custo</span>
                    <span className="font-medium text-gray-900">{requisition.costCenter}</span>
                  </div>
                )}
                {requisition.department && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Departamento</span>
                    <span className="font-medium text-gray-900">{requisition.department}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Prioridade</span>
                  <span className="font-medium text-gray-900">
                    {requisition.priority === 1 ? "Urgente" : 
                     requisition.priority === 2 ? "Alta" :
                     requisition.priority === 3 ? "Normal" : "Baixa"}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Histórico</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Criada</div>
                    <div className="text-sm text-gray-500">{formatDateTime(requisition.createdAt)}</div>
                  </div>
                </div>

                {requisition.approvedAt && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Aprovada</div>
                      <div className="text-sm text-gray-500">{formatDateTime(requisition.approvedAt)}</div>
                    </div>
                  </div>
                )}

                {requisition.separatedAt && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Separação Concluída</div>
                      <div className="text-sm text-gray-500">{formatDateTime(requisition.separatedAt)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {requisition.notes && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-medium text-gray-900 mb-2">Observações</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{requisition.notes}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cancelar Requisição</h3>
            
            <p className="text-gray-600 mb-4">
              Tem certeza que deseja cancelar esta requisição?
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo do Cancelamento *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Informe o motivo..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {cancelMutation.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {cancelMutation.error.message}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  if (!cancelReason.trim()) {
                    alert("Informe o motivo");
                    return;
                  }
                  cancelMutation.mutate({ id, reason: cancelReason });
                }}
                disabled={cancelMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Ban className="w-4 h-4" />
                )}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
