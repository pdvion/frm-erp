"use client";

import { use } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  Ship,
  Edit,
  Loader2,
  Calendar,
  DollarSign,
  Package,
  MapPin,
  FileText,
  Clock,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Rascunho", color: "bg-theme-tertiary text-theme-secondary" },
  PENDING_SHIPMENT: { label: "Aguardando Embarque", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  IN_TRANSIT: { label: "Em Trânsito", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  ARRIVED: { label: "Chegou", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  IN_CLEARANCE: { label: "Em Desembaraço", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  CLEARED: { label: "Desembaraçado", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  DELIVERED: { label: "Entregue", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export default function ImportProcessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: process, isLoading, refetch } = trpc.impex.getProcess.useQuery({ id });

  const deleteItemMutation = trpc.impex.deleteProcessItem.useMutation({
    onSuccess: () => refetch(),
    onError: (error) => toast.error(`Erro ao excluir item: ${error.message}`),
  });

  const deleteCostMutation = trpc.impex.deleteProcessCost.useMutation({
    onSuccess: () => refetch(),
    onError: (error) => toast.error(`Erro ao excluir custo: ${error.message}`),
  });

  const deleteEventMutation = trpc.impex.deleteProcessEvent.useMutation({
    onSuccess: () => refetch(),
    onError: (error) => toast.error(`Erro ao excluir evento: ${error.message}`),
  });

  const formatCurrency = (value: number | string | null | undefined, currency = "USD") => {
    if (!value) return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(num);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!process) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-theme">Processo não encontrado</h2>
        <Link href="/impex/processes" className="text-blue-600 hover:underline mt-2 inline-block">
          Voltar para lista
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Processo ${process.processNumber}`}
        icon={<Ship className="w-6 h-6" />}
        module="PURCHASES"
        breadcrumbs={[
          { label: "ImpEx", href: "/impex" },
          { label: "Processos", href: "/impex/processes" },
          { label: process.processNumber },
        ]}
        actions={
          <Button
            onClick={() => window.location.href = `/impex/processes/${id}/edit`}
            leftIcon={<Edit className="w-4 h-4" />}
          >
            Editar
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-theme-card border border-theme rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-theme">Informações Gerais</h3>
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  STATUS_LABELS[process.status]?.color || "bg-theme-tertiary text-theme-secondary"
                }`}
              >
                {STATUS_LABELS[process.status]?.label || process.status}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-theme-muted">Referência</span>
                <p className="text-theme font-medium">{process.reference || "-"}</p>
              </div>
              <div>
                <span className="text-sm text-theme-muted">Fornecedor</span>
                <p className="text-theme font-medium">{process.supplier?.companyName || "-"}</p>
              </div>
              <div>
                <span className="text-sm text-theme-muted">Despachante</span>
                <p className="text-theme font-medium">{process.customsBroker?.name || "-"}</p>
              </div>
              <div>
                <span className="text-sm text-theme-muted">Incoterm</span>
                <p className="text-theme font-medium">{process.incoterm?.code || "-"}</p>
              </div>
              <div>
                <span className="text-sm text-theme-muted">Tipo de Carga</span>
                <p className="text-theme font-medium">
                  {process.cargoType?.code} - {process.cargoType?.name}
                </p>
              </div>
              <div>
                <span className="text-sm text-theme-muted">BL</span>
                <p className="text-theme font-medium">{process.blNumber || "-"}</p>
              </div>
            </div>
          </div>

          <div className="bg-theme-card border border-theme rounded-lg p-6">
            <h3 className="font-semibold text-theme mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Rota
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 p-4 bg-theme-secondary rounded-lg text-center">
                <p className="text-lg font-bold text-theme">{process.originPort?.code}</p>
                <p className="text-sm text-theme-muted">{process.originPort?.name}</p>
                <p className="text-xs text-theme-muted">{process.originPort?.country}</p>
              </div>
              <div className="text-2xl text-theme-muted">→</div>
              <div className="flex-1 p-4 bg-theme-secondary rounded-lg text-center">
                <p className="text-lg font-bold text-theme">{process.destinationPort?.code}</p>
                <p className="text-sm text-theme-muted">{process.destinationPort?.name}</p>
                <p className="text-xs text-theme-muted">{process.destinationPort?.country}</p>
              </div>
            </div>
          </div>

          <div className="bg-theme-card border border-theme rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-theme flex items-center gap-2">
                <Package className="w-4 h-4" />
                Itens ({process.importProcessItems?.length || 0})
              </h3>
            </div>
            {process.importProcessItems?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-theme">
                      <th className="text-left py-2 text-theme-muted">Material</th>
                      <th className="text-left py-2 text-theme-muted">NCM</th>
                      <th className="text-right py-2 text-theme-muted">Qtd</th>
                      <th className="text-right py-2 text-theme-muted">Preço Unit.</th>
                      <th className="text-right py-2 text-theme-muted">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {process.importProcessItems.map((item) => (
                      <tr key={item.id} className="border-b border-theme">
                        <td className="py-2 text-theme">
                          {item.material?.code} - {item.material?.description || item.description}
                        </td>
                        <td className="py-2 text-theme">{item.ncmCode || "-"}</td>
                        <td className="py-2 text-right text-theme">{Number(item.quantity)}</td>
                        <td className="py-2 text-right text-theme">
                          {formatCurrency(Number(item.unitPrice), process.currency ?? undefined)}
                        </td>
                        <td className="py-2 text-right text-theme font-medium">
                          {formatCurrency(Number(item.totalPrice), process.currency ?? undefined)}
                        </td>
                        <td className="py-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteItemMutation.mutate({ id: item.id })}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-theme-muted text-center py-4">Nenhum item cadastrado</p>
            )}
          </div>

          <div className="bg-theme-card border border-theme rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-theme flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Custos ({process.importProcessCosts?.length || 0})
              </h3>
            </div>
            {process.importProcessCosts?.length ? (
              <div className="space-y-2">
                {process.importProcessCosts.map((cost) => (
                  <div
                    key={cost.id}
                    className="flex items-center justify-between p-3 bg-theme-secondary rounded-lg"
                  >
                    <div>
                      <p className="text-theme font-medium">{cost.description}</p>
                      <p className="text-sm text-theme-muted">
                        {cost.costType} {cost.isEstimated && "(Estimado)"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-theme font-medium">
                        {formatCurrency(Number(cost.value), cost.currency)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCostMutation.mutate({ id: cost.id })}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-theme-muted text-center py-4">Nenhum custo cadastrado</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-theme-card border border-theme rounded-lg p-6">
            <h3 className="font-semibold text-theme mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Valores
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-theme-muted">Invoice</span>
                <span className="text-theme font-medium">
                  {formatCurrency(Number(process.fobValue || 0), process.currency ?? undefined)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Frete</span>
                <span className="text-theme">
                  {formatCurrency(process.freightValue ? Number(process.freightValue) : null, process.currency ?? undefined)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Seguro</span>
                <span className="text-theme">
                  {formatCurrency(process.insuranceValue ? Number(process.insuranceValue) : null, process.currency ?? undefined)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-theme-card border border-theme rounded-lg p-6">
            <h3 className="font-semibold text-theme mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Datas
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-theme-muted">Invoice</span>
                <span className="text-theme">{formatDate(process.orderDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">ETD</span>
                <span className="text-theme">{formatDate(process.etd)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">ETA</span>
                <span className="text-theme">{formatDate(process.eta)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Chegada Real</span>
                <span className="text-theme">{formatDate(process.actualArrival)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Desembaraço</span>
                <span className="text-theme">{formatDate(process.clearanceDate)}</span>
              </div>
            </div>
          </div>

          <div className="bg-theme-card border border-theme rounded-lg p-6">
            <h3 className="font-semibold text-theme mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Timeline ({process.importProcessEvents?.length || 0})
            </h3>
            {process.importProcessEvents?.length ? (
              <div className="space-y-3">
                {process.importProcessEvents.map((event: { id: string; eventType: string; eventDate: Date; description?: string | null }) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm text-theme font-medium">{event.eventType}</p>
                      <p className="text-xs text-theme-muted">{formatDate(event.eventDate)}</p>
                      {event.description && (
                        <p className="text-xs text-theme-muted mt-1">{event.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEventMutation.mutate({ id: event.id })}
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-theme-muted text-center py-4 text-sm">Nenhum evento</p>
            )}
          </div>

          {process.notes && (
            <div className="bg-theme-card border border-theme rounded-lg p-6">
              <h3 className="font-semibold text-theme mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Observações
              </h3>
              <p className="text-sm text-theme whitespace-pre-wrap">{process.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
