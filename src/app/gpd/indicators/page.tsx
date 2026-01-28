"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { BarChart2, Plus, TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/formatters";

export default function GPDIndicatorsPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  const [newValue, setNewValue] = useState({ period: "", value: 0, notes: "" });

  const { data: indicators, isLoading, refetch } = trpc.gpd.listIndicators.useQuery({
    isActive: true,
  });

  const recordMutation = trpc.gpd.recordIndicatorValue.useMutation({
    onSuccess: () => {
      refetch();
      setShowModal(false);
      setSelectedIndicator(null);
      setNewValue({ period: "", value: 0, notes: "" });
    },
  });

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "ABOVE": return "text-green-600 bg-green-100 dark:bg-green-900/30";
      case "ON_TARGET": return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
      case "BELOW": return "text-red-600 bg-red-100 dark:bg-red-900/30";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case "ABOVE": return <TrendingUp className="w-4 h-4" />;
      case "ON_TARGET": return <Minus className="w-4 h-4" />;
      case "BELOW": return <TrendingDown className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    switch (status) {
      case "ABOVE": return "Acima";
      case "ON_TARGET": return "Na Meta";
      case "BELOW": return "Abaixo";
      default: return "Sem dados";
    }
  };

  const frequencyLabels = {
    DAILY: "Diário",
    WEEKLY: "Semanal",
    MONTHLY: "Mensal",
    QUARTERLY: "Trimestral",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Indicadores GPD"
        icon={<BarChart2 className="w-6 h-6" />}
        module="GPD"
        breadcrumbs={[
          { label: "GPD", href: "/gpd" },
          { label: "Indicadores" },
        ]}
      />

      {isLoading ? (
        <div className="bg-theme-card border border-theme rounded-lg p-8 text-center text-theme-muted">
          Carregando...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {indicators?.map((indicator) => {
            const lastHistory = indicator.history?.[0];
            const status = lastHistory?.status;

            return (
              <div key={indicator.id} className="bg-theme-card border border-theme rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                    {getStatusLabel(status)}
                  </span>
                  <span className="text-xs text-theme-muted">
                    {indicator.frequency ? frequencyLabels[indicator.frequency] : ""}
                  </span>
                </div>
                <h3 className="font-semibold text-theme mb-1">{indicator.name}</h3>
                {indicator.goal && (
                  <p className="text-xs text-theme-muted mb-2">Meta: {indicator.goal.title}</p>
                )}
                <div className="flex items-end justify-between mt-3">
                  <div>
                    <p className="text-xs text-theme-muted">Atual</p>
                    <p className="text-2xl font-bold text-theme">
                      {indicator.currentValue ?? "-"} {indicator.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-theme-muted">Meta</p>
                    <p className="text-lg font-semibold text-theme-muted">
                      {indicator.targetExpected ?? "-"} {indicator.unit}
                    </p>
                  </div>
                </div>
                {indicator.targetExpected && indicator.currentValue !== null && (
                  <div className="mt-3">
                    <div className="h-2 bg-theme-hover rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${status === "BELOW" ? "bg-red-500" : status === "ABOVE" ? "bg-green-500" : "bg-blue-500"}`}
                        style={{ width: `${Math.min(100, (indicator.currentValue / indicator.targetExpected) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {indicator.lastUpdated && (
                  <p className="text-xs text-theme-muted mt-2">
                    Atualizado: {formatDate(indicator.lastUpdated)}
                  </p>
                )}
                <button
                  onClick={() => {
                    setSelectedIndicator(indicator.id);
                    setShowModal(true);
                  }}
                  className="mt-3 w-full flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <Plus className="w-4 h-4" />
                  Registrar Valor
                </button>
              </div>
            );
          })}
          {indicators?.length === 0 && (
            <div className="col-span-full bg-theme-card border border-theme rounded-lg p-8 text-center text-theme-muted">
              <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum indicador encontrado</p>
              <p className="text-sm mt-1">Crie indicadores vinculados às metas GPD</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de registro de valor */}
      {showModal && selectedIndicator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card border border-theme rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-theme mb-4">Registrar Valor</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Período</label>
                <input
                  type="date"
                  value={newValue.period}
                  onChange={(e) => setNewValue({ ...newValue, period: e.target.value })}
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-card text-theme"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  value={newValue.value}
                  onChange={(e) => setNewValue({ ...newValue, value: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-card text-theme"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Observações</label>
                <textarea
                  value={newValue.notes}
                  onChange={(e) => setNewValue({ ...newValue, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-card text-theme"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedIndicator(null);
                }}
                className="px-4 py-2 border border-theme rounded-lg text-theme hover:bg-theme-hover"
              >
                Cancelar
              </button>
              <button
                onClick={() => recordMutation.mutate({
                  indicatorId: selectedIndicator,
                  period: newValue.period,
                  value: newValue.value,
                  notes: newValue.notes || undefined,
                })}
                disabled={!newValue.period || recordMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {recordMutation.isPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <Link href="/gpd" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Voltar para GPD
        </Link>
      </div>
    </div>
  );
}
