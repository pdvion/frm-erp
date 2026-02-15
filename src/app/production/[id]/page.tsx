"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDate, formatDateTime } from "@/lib/formatters";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import {
  Factory,
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
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PLANNED: { label: "Planejada", color: "text-theme-secondary", bgColor: "bg-theme-tertiary" },
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

  if (isLoading) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <div className="text-center">
          <Factory className="w-12 h-12 text-theme-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme mb-2">OP não encontrada</h3>
          <Link href="/production" className="text-blue-600 hover:text-indigo-800">
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  const config = statusConfig[order.status];
  const progress = Number(order.quantity) > 0 ? Math.round((Number(order.producedQty) / Number(order.quantity)) * 100) : 0;
  const remainingQty = Number(order.quantity) - Number(order.producedQty);

  const canRelease = order.status === "PLANNED";
  const canStart = order.status === "RELEASED";
  const canReport = order.status === "IN_PROGRESS";
  const canConsume = ["RELEASED", "IN_PROGRESS"].includes(order.status);
  const canCancel = !["COMPLETED", "CANCELLED"].includes(order.status) && 
    !order.materials.some((m) => Number(m.consumedQty) > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`OP #${order.code}`}
        subtitle={order.product?.description || "Produto não identificado"}
        icon={<Factory className="w-6 h-6" />}
        backHref="/production"
        module="production"
        actions={
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}>
              {config.label}
            </span>
            {canCancel && (
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(true)}
                leftIcon={<Ban className="w-4 h-4" />}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Cancelar
              </Button>
            )}
            {canRelease && (
              <Button
                onClick={() => releaseMutation.mutate({ id })}
                disabled={releaseMutation.isPending}
                isLoading={releaseMutation.isPending}
                leftIcon={<Check className="w-4 h-4" />}
              >
                Liberar
              </Button>
            )}
            {canStart && (
              <Button
                onClick={() => startMutation.mutate({ id })}
                disabled={startMutation.isPending}
                isLoading={startMutation.isPending}
                leftIcon={<Play className="w-4 h-4" />}
              >
                Iniciar Produção
              </Button>
            )}
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Produto e Progresso */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h3 className="font-medium text-theme mb-4">Produto</h3>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-medium text-theme">{order.product.description}</div>
                  <div className="text-sm text-theme-muted">Código: {order.product.code}</div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-theme-secondary">Progresso</span>
                      <span className="font-medium">{Number(order.producedQty)} / {Number(order.quantity)} {order.product.unit}</span>
                    </div>
                    <div className="w-full bg-theme-tertiary rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${progress >= 100 ? "bg-green-500" : "bg-indigo-500"}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="text-right text-sm text-theme-muted mt-1">{progress}%</div>
                  </div>
                </div>
              </div>

              {/* Apontamento */}
              {canReport && remainingQty > 0 && (
                <div className="mt-6 pt-6 border-t border-theme">
                  <h4 className="font-medium text-theme mb-3">Apontar Produção</h4>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      value={reportQty}
                      onChange={(e) => setReportQty(e.target.value)}
                      placeholder={String(remainingQty)}
                      max={remainingQty}
                      min={0}
                      className="w-32 px-3 py-2 border border-theme-input rounded-lg"
                    />
                    <span className="text-theme-muted">{order.product.unit}</span>
                    <Button
                      onClick={() => {
                        const qty = parseFloat(reportQty) || remainingQty;
                        if (qty > 0) {
                          reportMutation.mutate({ orderId: id, quantity: qty });
                        }
                      }}
                      disabled={reportMutation.isPending}
                      isLoading={reportMutation.isPending}
                      leftIcon={<Check className="w-4 h-4" />}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Apontar
                    </Button>
                  </div>
                  {reportMutation.error && (
                    <div className="mt-2 text-red-600 text-sm">{reportMutation.error.message}</div>
                  )}
                </div>
              )}
            </div>

            {/* Materiais */}
            <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
              <div className="px-6 py-4 border-b border-theme flex items-center gap-2">
                <Package className="w-5 h-5 text-theme-muted" />
                <h3 className="font-medium text-theme">Materiais</h3>
              </div>
              {order.materials.length === 0 ? (
                <div className="text-center py-8 text-theme-muted">
                  Nenhum material cadastrado
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-theme-table">
                    <thead className="bg-theme-tertiary">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                          Material
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                          Necessário
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                          Consumido
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                          Estoque
                        </th>
                        {canConsume && (
                          <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                            Ação
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-table">
                      {order.materials.map((mat) => {
                        const remaining = Number(mat.requiredQty) - Number(mat.consumedQty);
                        const inventory = mat.material.inventory[0];
                        const available = inventory?.availableQty || 0;
                        const isComplete = mat.consumedQty >= mat.requiredQty;

                        return (
                          <tr key={mat.id} className={isComplete ? "bg-green-50" : ""}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-theme">{mat.material.description}</div>
                              <div className="text-xs text-theme-muted">Cód: {mat.material.code}</div>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-theme">
                              {Number(mat.requiredQty)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={isComplete ? "text-green-600 font-medium" : "text-theme"}>
                                {Number(mat.consumedQty)}
                              </span>
                              {!isComplete && remaining > 0 && (
                                <span className="text-theme-muted text-sm ml-1">(falta {remaining})</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={Number(available) < remaining ? "text-red-600" : "text-theme-secondary"}>
                                {Number(available)}
                              </span>
                            </td>
                            {canConsume && (
                              <td className="px-4 py-3 text-center">
                                {!isComplete && (
                                  consumingMaterial === mat.id ? (
                                    <div className="flex items-center gap-2 justify-center">
                                      <Input
                                        type="number"
                                        value={consumeQty}
                                        onChange={(e) => setConsumeQty(e.target.value)}
                                        placeholder={String(Math.min(remaining, Number(available)))}
                                        className="w-20 px-2 py-1 border border-theme-input rounded text-sm"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const qty = parseFloat(consumeQty) || Math.min(remaining, Number(available));
                                          if (qty > 0) {
                                            consumeMutation.mutate({ materialId: mat.id, quantity: qty });
                                          }
                                        }}
                                        disabled={consumeMutation.isPending}
                                        isLoading={consumeMutation.isPending}
                                        className="text-green-600"
                                      >
                                        <Check className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setConsumingMaterial(null);
                                          setConsumeQty("");
                                        }}
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => setConsumingMaterial(mat.id)}
                                      disabled={Number(available) <= 0}
                                    >
                                      Consumir
                                    </Button>
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
              <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
                <div className="px-6 py-4 border-b border-theme flex items-center gap-2">
                  <Cog className="w-5 h-5 text-theme-muted" />
                  <h3 className="font-medium text-theme">Operações</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-theme-table">
                    <thead className="bg-theme-tertiary">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                          Seq
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                          Operação
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                          Centro
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                          Planejado
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                          Concluído
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-table">
                      {order.operations.map((op) => {
                        const isComplete = op.completedQty >= op.plannedQty;
                        return (
                          <tr key={op.id} className={isComplete ? "bg-green-50" : ""}>
                            <td className="px-4 py-3 text-theme-secondary">{op.sequence}</td>
                            <td className="px-4 py-3 font-medium text-theme">{op.name}</td>
                            <td className="px-4 py-3 text-theme-secondary">{op.workCenter || "-"}</td>
                            <td className="px-4 py-3 text-right text-theme">{Number(op.plannedQty)}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={isComplete ? "text-green-600 font-medium" : "text-theme"}>
                                {Number(op.completedQty)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isComplete ? (
                                <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                              ) : op.startedAt ? (
                                <Play className="w-5 h-5 text-purple-500 mx-auto" />
                              ) : (
                                <Clock className="w-5 h-5 text-theme-muted mx-auto" />
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
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h3 className="font-medium text-theme mb-4">Informações</h3>
              <div className="space-y-3 text-sm">
                {order.salesOrderNumber && (
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Pedido de Venda</span>
                    <span className="font-medium text-theme">{order.salesOrderNumber}</span>
                  </div>
                )}
                {order.customerName && (
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Cliente</span>
                    <span className="font-medium text-theme">{order.customerName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-theme-muted">Prioridade</span>
                  <span className="font-medium text-theme">
                    {order.priority === 1 ? "Urgente" : 
                      order.priority === 2 ? "Alta" :
                        order.priority === 3 ? "Normal" : "Baixa"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Entrega</span>
                  <span className="font-medium text-theme">{formatDate(order.dueDate)}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h3 className="font-medium text-theme mb-4">Histórico</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-theme-tertiary rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-theme-muted" />
                  </div>
                  <div>
                    <div className="font-medium text-theme">Criada</div>
                    <div className="text-sm text-theme-muted">{formatDateTime(order.createdAt)}</div>
                  </div>
                </div>

                {order.actualStart && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Play className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-theme">Iniciada</div>
                      <div className="text-sm text-theme-muted">{formatDateTime(order.actualStart)}</div>
                    </div>
                  </div>
                )}

                {order.actualEnd && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-theme">Concluída</div>
                      <div className="text-sm text-theme-muted">{formatDateTime(order.actualEnd)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-theme-card rounded-lg border border-theme p-6">
                <h3 className="font-medium text-theme mb-2">Observações</h3>
                <p className="text-theme-secondary text-sm whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => { setShowCancelModal(false); setCancelReason(""); }}
        title="Cancelar OP"
        description="Tem certeza que deseja cancelar esta ordem de produção?"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              Motivo do Cancelamento *
            </label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Informe o motivo..."
            />
          </div>

          {cancelMutation.error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {cancelMutation.error.message}
            </div>
          )}

          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
            >
              Voltar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!cancelReason.trim()) {
                  toast.warning("Informe o motivo");
                  return;
                }
                cancelMutation.mutate({ id, reason: cancelReason });
              }}
              disabled={cancelMutation.isPending}
              isLoading={cancelMutation.isPending}
              leftIcon={<Ban className="w-4 h-4" />}
            >
              Confirmar
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}
