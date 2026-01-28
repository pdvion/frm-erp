"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { PauseCircle } from "lucide-react";

type StopType = "PLANNED" | "UNPLANNED" | "SETUP" | "MAINTENANCE" | "QUALITY" | "MATERIAL" | "OTHER";

export default function OEEStopsPage() {
  const [showModal, setShowModal] = useState(false);
  const [workCenterId, setWorkCenterId] = useState("");

  const { data: workCenters } = trpc.oee.listWorkCenters.useQuery({});
  const { data: dashboard } = trpc.oee.dashboard.useQuery({});

  const logStopMutation = trpc.oee.logStop.useMutation({
    onSuccess: () => {
      setShowModal(false);
      setStopForm({
        workCenterId: "",
        stopType: "UNPLANNED",
        reason: "",
        solution: "",
      });
    },
  });

  const [stopForm, setStopForm] = useState({
    workCenterId: "",
    stopType: "UNPLANNED" as StopType,
    reason: "",
    solution: "",
  });

  const handleStopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logStopMutation.mutate({
      workCenterId: stopForm.workCenterId,
      stopType: stopForm.stopType,
      startTime: new Date(),
      reason: stopForm.reason,
      solution: stopForm.solution || undefined,
    });
  };

  const stopTypes = [
    { value: "PLANNED", label: "Planejada", color: "bg-blue-100 text-blue-800" },
    { value: "UNPLANNED", label: "Não Planejada", color: "bg-red-100 text-red-800" },
    { value: "SETUP", label: "Setup", color: "bg-purple-100 text-purple-800" },
    { value: "MAINTENANCE", label: "Manutenção", color: "bg-orange-100 text-orange-800" },
    { value: "QUALITY", label: "Qualidade", color: "bg-yellow-100 text-yellow-800" },
    { value: "MATERIAL", label: "Falta Material", color: "bg-gray-100 text-gray-800" },
    { value: "OTHER", label: "Outros", color: "bg-gray-100 text-gray-800" },
  ];

  const getStopTypeInfo = (type: string) => {
    return stopTypes.find((t) => t.value === type) || stopTypes[6];
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paradas de Produção"
        module="PRODUCTION"
        icon={<PauseCircle className="w-6 h-6" />}
        breadcrumbs={[
          { label: "OEE", href: "/oee" },
          { label: "Paradas" },
        ]}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <PauseCircle className="w-4 h-4" />
            Registrar Parada
          </button>
        }
      />

      {/* Resumo por Tipo */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {stopTypes.map((type) => {
          const count = dashboard?.stopsByType.find((s) => s.stopType === type.value)?._count || 0;
          const duration = dashboard?.stopsByType.find((s) => s.stopType === type.value)?._sum?.durationMinutes || 0;
          return (
            <div key={type.value} className="bg-theme-card border border-theme rounded-lg p-4">
              <span className={`px-2 py-1 rounded text-xs font-medium ${type.color}`}>
                {type.label}
              </span>
              <p className="text-2xl font-bold text-theme mt-2">{count}</p>
              <p className="text-xs text-theme-muted">{duration} min</p>
            </div>
          );
        })}
      </div>

      {/* Filtro por Centro */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Centro de Trabalho</label>
            <select
              value={workCenterId}
              onChange={(e) => setWorkCenterId(e.target.value)}
              className="px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme min-w-[200px]"
            >
              <option value="">Todos</option>
              {workCenters?.map((wc) => (
                <option key={wc.id} value={wc.id}>{wc.code} - {wc.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Paradas por Tipo (Pareto) */}
      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        <div className="p-4 border-b border-theme">
          <h3 className="font-semibold text-theme">Análise de Paradas (Pareto)</h3>
        </div>
        <table className="w-full">
          <thead className="bg-theme-table-header border-b border-theme">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Ocorrências</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Duração Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">% do Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-table">
            {dashboard?.stopsByType.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-theme-muted">
                  Nenhuma parada registrada no período
                </td>
              </tr>
            ) : (
              (() => {
                const totalDuration = dashboard?.stopsByType.reduce(
                  (sum, s) => sum + (s._sum?.durationMinutes || 0),
                  0
                ) || 1;
                let accumulated = 0;

                return dashboard?.stopsByType
                  .sort((a, b) => (b._sum?.durationMinutes || 0) - (a._sum?.durationMinutes || 0))
                  .map((stop) => {
                    const duration = stop._sum?.durationMinutes || 0;
                    const percent = (duration / totalDuration) * 100;
                    accumulated += percent;
                    const typeInfo = getStopTypeInfo(stop.stopType);

                    return (
                      <tr key={stop.stopType} className="hover:bg-theme-table-hover">
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-theme">{stop._count}</td>
                        <td className="px-4 py-3 text-sm text-theme">{duration} min</td>
                        <td className="px-4 py-3 text-sm text-theme">{percent.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-sm text-theme">{accumulated.toFixed(1)}%</td>
                      </tr>
                    );
                  });
              })()
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Registro */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card border border-theme rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-theme mb-4">Registrar Parada</h3>
            <form onSubmit={handleStopSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Centro de Trabalho</label>
                <select
                  value={stopForm.workCenterId}
                  onChange={(e) => setStopForm({ ...stopForm, workCenterId: e.target.value })}
                  className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                  required
                >
                  <option value="">Selecione...</option>
                  {workCenters?.map((wc) => (
                    <option key={wc.id} value={wc.id}>{wc.code} - {wc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Tipo de Parada</label>
                <select
                  value={stopForm.stopType}
                  onChange={(e) => setStopForm({ ...stopForm, stopType: e.target.value as StopType })}
                  className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                >
                  {stopTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Motivo</label>
                <textarea
                  value={stopForm.reason}
                  onChange={(e) => setStopForm({ ...stopForm, reason: e.target.value })}
                  className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                  rows={2}
                  required
                  placeholder="Descreva o motivo da parada..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Solução (opcional)</label>
                <textarea
                  value={stopForm.solution}
                  onChange={(e) => setStopForm({ ...stopForm, solution: e.target.value })}
                  className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                  rows={2}
                  placeholder="Ação tomada para resolver..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-theme rounded-lg hover:bg-theme-secondary text-theme"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={logStopMutation.isPending || !stopForm.workCenterId || !stopForm.reason}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {logStopMutation.isPending ? "Registrando..." : "Registrar Parada"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
