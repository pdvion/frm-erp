"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDateTime } from "@/lib/formatters";

import { PageHeader } from "@/components/PageHeader";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Play,
  Send,
  Ban,
  Check,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: "Rascunho", color: "text-theme-secondary", bgColor: "bg-theme-tertiary" },
  PENDING: { label: "Aguardando Aprovação", color: "text-yellow-800", bgColor: "bg-yellow-100" },
  APPROVED: { label: "Aprovada", color: "text-blue-800", bgColor: "bg-blue-100" },
  IN_SEPARATION: { label: "Em Separação", color: "text-purple-800", bgColor: "bg-purple-100" },
  PARTIAL: { label: "Parcialmente Atendida", color: "text-orange-800", bgColor: "bg-orange-100" },
  COMPLETED: { label: "Concluída", color: "text-green-800", bgColor: "bg-green-100" },
  CANCELLED: { label: "Cancelada", color: "text-red-600", bgColor: "bg-red-100" },
};

const typeLabels: Record<string, string> = {
  PRODUCTION: "Produção",
  MAINTENANCE: "Manutenção",
  ADMINISTRATIVE: "Administrativo",
  PROJECT: "Projeto",
  OTHER: "Outro",
};

export default function RequisitionDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [separatingItem, setSeparatingItem] = useState<string | null>(null);
  const [separateQty, setSeparateQty] = useState("");

  const { data: requisition, isLoading, refetch } = trpc.requisitions.byId.useQuery({ id });

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

  if (isLoading) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!requisition) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-theme-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme mb-2">Requisição não encontrada</h3>
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
    <div className="space-y-6">
      <PageHeader
        title={`Requisição #${requisition.code}`}
        icon={<Package className="w-6 h-6" />}
        backHref="/requisitions"
        module="requisitions"
        badge={{ label: config.label, color: config.color, bgColor: config.bgColor }}
        actions={
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items Table */}
            <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-theme">
                <h3 className="text-base sm:text-lg font-semibold text-theme">Itens da Requisição</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Material
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        Solicitado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        Aprovado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        Separado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        Estoque
                      </th>
                      {canSeparate && (
                        <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                          Ação
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {requisition.items.map((item) => {
                      const approved = item.approvedQty ?? item.requestedQty;
                      const remaining = approved - item.separatedQty;
                      const inventory = item.material.inventory[0];
                      const available = inventory?.availableQty || 0;
                      const isComplete = item.separatedQty >= approved;

                      return (
                        <tr key={item.id} className={isComplete ? "bg-green-50" : ""}>
                          <td className="px-4 py-3 min-w-[120px]">
                            <div className="font-medium text-theme text-sm sm:text-base break-words">
                              {item.material.description}
                            </div>
                            <div className="text-xs sm:text-sm text-theme-muted">
                              Cód: {item.material.code}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-theme">
                            {item.requestedQty}
                          </td>
                          <td className="px-4 py-3 text-right text-theme-secondary">
                            {item.approvedQty ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={isComplete ? "text-green-600 font-medium" : "text-theme"}>
                              {item.separatedQty}
                            </span>
                            {!isComplete && remaining > 0 && (
                              <span className="text-theme-muted text-sm ml-1">
                                (falta {remaining})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={available < remaining ? "text-red-600" : "text-theme-secondary"}>
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
                                      className="w-20 px-2 py-1 border border-theme-input rounded text-sm"
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
                                      className="p-1 text-theme-muted hover:text-theme-secondary"
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
            <div className="bg-theme-card rounded-lg border border-theme p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-theme mb-4">Informações</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-theme-muted">Tipo</span>
                  <span className="font-medium text-theme">{typeLabels[requisition.type] || requisition.type}</span>
                </div>
                {requisition.orderNumber && (
                  <div className="flex justify-between">
                    <span className="text-theme-muted">OP/OS</span>
                    <span className="font-medium text-theme">{requisition.orderNumber}</span>
                  </div>
                )}
                {requisition.costCenter && (
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Centro de Custo</span>
                    <span className="font-medium text-theme">{requisition.costCenter}</span>
                  </div>
                )}
                {requisition.department && (
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Departamento</span>
                    <span className="font-medium text-theme">{requisition.department}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-theme-muted">Prioridade</span>
                  <span className="font-medium text-theme">
                    {requisition.priority === 1 ? "Urgente" : 
                      requisition.priority === 2 ? "Alta" :
                        requisition.priority === 3 ? "Normal" : "Baixa"}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-theme-card rounded-lg border border-theme p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-theme mb-4">Histórico</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-theme-tertiary rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-theme-muted" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-theme">Criada</div>
                    <div className="text-sm text-theme-muted">{formatDateTime(requisition.createdAt)}</div>
                    {requisition.createdByName && (
                      <div className="text-xs text-theme-muted">por {requisition.createdByName}</div>
                    )}
                  </div>
                </div>

                {requisition.status === "PENDING" && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Send className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-theme">Enviada para Aprovação</div>
                      <div className="text-sm text-theme-muted">{formatDateTime(requisition.requestedAt)}</div>
                      {requisition.requestedByName && (
                        <div className="text-xs text-theme-muted">por {requisition.requestedByName}</div>
                      )}
                    </div>
                  </div>
                )}

                {requisition.approvedAt && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-theme">Aprovada</div>
                      <div className="text-sm text-theme-muted">{formatDateTime(requisition.approvedAt)}</div>
                      {requisition.approvedByName && (
                        <div className="text-xs text-theme-muted">por {requisition.approvedByName}</div>
                      )}
                    </div>
                  </div>
                )}

                {requisition.separatedAt && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-theme">Separação Concluída</div>
                      <div className="text-sm text-theme-muted">{formatDateTime(requisition.separatedAt)}</div>
                      {requisition.separatedByName && (
                        <div className="text-xs text-theme-muted">por {requisition.separatedByName}</div>
                      )}
                    </div>
                  </div>
                )}

                {requisition.status === "CANCELLED" && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Ban className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-red-700">Cancelada</div>
                      <div className="text-sm text-theme-muted">{formatDateTime(requisition.updatedAt)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {requisition.notes && (
              <div className="bg-theme-card rounded-lg border border-theme p-6">
                <h3 className="font-medium text-theme mb-2">Observações</h3>
                <p className="text-theme-secondary text-sm whitespace-pre-wrap">{requisition.notes}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-requisition-title"
          onKeyDown={(e) => e.key === "Escape" && setShowCancelModal(false)}
        >
          <div className="bg-theme-card rounded-lg p-6 w-full max-w-md">
            <h3 id="cancel-requisition-title" className="text-lg font-medium text-theme mb-4">Cancelar Requisição</h3>
            
            <p className="text-theme-secondary mb-4">
              Tem certeza que deseja cancelar esta requisição?
            </p>

            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">
                Motivo do Cancelamento *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Informe o motivo..."
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                className="px-4 py-2 border border-theme-input rounded-lg text-theme-secondary hover:bg-theme-hover"
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
