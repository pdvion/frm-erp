"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Factory,
  ChevronLeft,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  Ban,
  Check,
  Package,
  Cog,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PLANNED: { label: "Planejada", color: "text-gray-600", bgColor: "bg-gray-100" },
  RELEASED: { label: "Liberada", color: "text-blue-800", bgColor: "bg-blue-100" },
  IN_PROGRESS: { label: "Em Produção", color: "text-purple-800", bgColor: "bg-purple-100" },
  COMPLETED: { label: "Concluída", color: "text-green-800", bgColor: "bg-green-100" },
  CANCELLED: { label: "Cancelada", color: "text-red-600", bgColor: "bg-red-100" },
};

export default function ProductionOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [reportQty, setReportQty] = useState("");
  const [consumingMaterial, setConsumingMaterial] = useState<string | null>(null);
  const [consumeQty, setConsumeQty] = useState("");

  const { data: order, isLoading, refetch } = trpc.production.byId.useQuery({ id });

  const releaseMutation = trpc.production.release.useMutation({
    onSuccess: () => refetch(),
  });

  const startMutation = trpc.production.start.useMutation({
    onSuccess: () => refetch(),
  });

  const reportMutation = trpc.production.reportProduction.useMutation({
    onSuccess: () => {
      setReportQty("");
      refetch();
    },
  });

  const consumeMutation = trpc.production.consumeMaterial.useMutation({
    onSuccess: () => {
      setConsumingMaterial(null);
      setConsumeQty("");
      refetch();
    },
  });

  const cancelMutation = trpc.production.cancel.useMutation({
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

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Factory className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">OP não encontrada</h3>
          <Link href="/production" className="text-indigo-600 hover:text-indigo-800">
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  const config = statusConfig[order.status];
  const progress = order.quantity > 0 ? Math.round((order.producedQty / order.quantity) * 100) : 0;
  const remainingQty = order.quantity - order.producedQty;

  const canRelease = order.status === "PLANNED";
  const canStart = order.status === "RELEASED";
  const canReport = order.status === "IN_PROGRESS";
  const canConsume = ["RELEASED", "IN_PROGRESS"].includes(order.status);
  const canCancel = !["COMPLETED", "CANCELLED"].includes(order.status) && 
    !order.materials.some((m) => m.consumedQty > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/production" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Factory className="w-6 h-6 text-indigo-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  OP #{order.code}
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

              {canRelease && (
                <button
                  onClick={() => releaseMutation.mutate({ id })}
                  disabled={releaseMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {releaseMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Liberar
                </button>
              )}

              {canStart && (
                <button
                  onClick={() => startMutation.mutate({ id })}
                  disabled={startMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {startMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Iniciar Produção
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
            {/* Produto e Progresso */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Produto</h3>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Package className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-medium text-gray-900">{order.product.description}</div>
                  <div className="text-sm text-gray-500">Código: {order.product.code}</div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progresso</span>
                      <span className="font-medium">{order.producedQty} / {order.quantity} {order.product.unit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${progress >= 100 ? "bg-green-500" : "bg-indigo-500"}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="text-right text-sm text-gray-500 mt-1">{progress}%</div>
                  </div>
                </div>
              </div>

              {/* Apontamento */}
              {canReport && remainingQty > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Apontar Produção</h4>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={reportQty}
                      onChange={(e) => setReportQty(e.target.value)}
                      placeholder={String(remainingQty)}
                      max={remainingQty}
                      min={0}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <span className="text-gray-500">{order.product.unit}</span>
                    <button
                      onClick={() => {
                        const qty = parseFloat(reportQty) || remainingQty;
                        if (qty > 0) {
                          reportMutation.mutate({ orderId: id, quantity: qty });
                        }
                      }}
                      disabled={reportMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {reportMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Apontar
                    </button>
                  </div>
                  {reportMutation.error && (
                    <div className="mt-2 text-red-600 text-sm">{reportMutation.error.message}</div>
                  )}
                </div>
              )}
            </div>

            {/* Materiais */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-400" />
                <h3 className="font-medium text-gray-900">Materiais</h3>
              </div>
              {order.materials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum material cadastrado
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Material
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Necessário
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Consumido
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Estoque
                        </th>
                        {canConsume && (
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Ação
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {order.materials.map((mat) => {
                        const remaining = mat.requiredQty - mat.consumedQty;
                        const inventory = mat.material.inventory[0];
                        const available = inventory?.availableQty || 0;
                        const isComplete = mat.consumedQty >= mat.requiredQty;

                        return (
                          <tr key={mat.id} className={isComplete ? "bg-green-50" : ""}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{mat.material.description}</div>
                              <div className="text-xs text-gray-500">Cód: {mat.material.code}</div>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-gray-900">
                              {mat.requiredQty}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={isComplete ? "text-green-600 font-medium" : "text-gray-900"}>
                                {mat.consumedQty}
                              </span>
                              {!isComplete && remaining > 0 && (
                                <span className="text-gray-400 text-sm ml-1">(falta {remaining})</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={available < remaining ? "text-red-600" : "text-gray-600"}>
                                {available}
                              </span>
                            </td>
                            {canConsume && (
                              <td className="px-4 py-3 text-center">
                                {!isComplete && (
                                  consumingMaterial === mat.id ? (
                                    <div className="flex items-center gap-2 justify-center">
                                      <input
                                        type="number"
                                        value={consumeQty}
                                        onChange={(e) => setConsumeQty(e.target.value)}
                                        placeholder={String(Math.min(remaining, available))}
                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                      />
                                      <button
                                        onClick={() => {
                                          const qty = parseFloat(consumeQty) || Math.min(remaining, available);
                                          if (qty > 0) {
                                            consumeMutation.mutate({ materialId: mat.id, quantity: qty });
                                          }
                                        }}
                                        disabled={consumeMutation.isPending}
                                        className="p-1 text-green-600 hover:text-green-800"
                                      >
                                        {consumeMutation.isPending ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Check className="w-4 h-4" />
                                        )}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setConsumingMaterial(null);
                                          setConsumeQty("");
                                        }}
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setConsumingMaterial(mat.id)}
                                      disabled={available <= 0}
                                      className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 disabled:opacity-50"
                                    >
                                      Consumir
                                    </button>
                                  )
                                )}
                                {isComplete && <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {consumeMutation.error && (
                <div className="px-6 py-3 bg-red-50 border-t border-red-200 text-red-700 text-sm">
                  {consumeMutation.error.message}
                </div>
              )}
            </div>

            {/* Operações */}
            {order.operations.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                  <Cog className="w-5 h-5 text-gray-400" />
                  <h3 className="font-medium text-gray-900">Operações</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Seq
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Operação
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Centro
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Planejado
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Concluído
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {order.operations.map((op) => {
                        const isComplete = op.completedQty >= op.plannedQty;
                        return (
                          <tr key={op.id} className={isComplete ? "bg-green-50" : ""}>
                            <td className="px-4 py-3 text-gray-600">{op.sequence}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{op.name}</td>
                            <td className="px-4 py-3 text-gray-600">{op.workCenter || "-"}</td>
                            <td className="px-4 py-3 text-right text-gray-900">{op.plannedQty}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={isComplete ? "text-green-600 font-medium" : "text-gray-900"}>
                                {op.completedQty}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isComplete ? (
                                <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                              ) : op.startedAt ? (
                                <Play className="w-5 h-5 text-purple-500 mx-auto" />
                              ) : (
                                <Clock className="w-5 h-5 text-gray-400 mx-auto" />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Informações</h3>
              <div className="space-y-3 text-sm">
                {order.salesOrderNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pedido de Venda</span>
                    <span className="font-medium text-gray-900">{order.salesOrderNumber}</span>
                  </div>
                )}
                {order.customerName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cliente</span>
                    <span className="font-medium text-gray-900">{order.customerName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Prioridade</span>
                  <span className="font-medium text-gray-900">
                    {order.priority === 1 ? "Urgente" : 
                     order.priority === 2 ? "Alta" :
                     order.priority === 3 ? "Normal" : "Baixa"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Entrega</span>
                  <span className="font-medium text-gray-900">{formatDate(order.dueDate)}</span>
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
                    <div className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</div>
                  </div>
                </div>

                {order.actualStart && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Play className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Iniciada</div>
                      <div className="text-sm text-gray-500">{formatDateTime(order.actualStart)}</div>
                    </div>
                  </div>
                )}

                {order.actualEnd && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Concluída</div>
                      <div className="text-sm text-gray-500">{formatDateTime(order.actualEnd)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-medium text-gray-900 mb-2">Observações</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cancelar OP</h3>
            
            <p className="text-gray-600 mb-4">
              Tem certeza que deseja cancelar esta ordem de produção?
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
