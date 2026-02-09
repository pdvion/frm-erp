"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
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
    { value: "PLANNED", label: "Planejada", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    { value: "UNPLANNED", label: "Não Planejada", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
    { value: "SETUP", label: "Setup", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
    { value: "MAINTENANCE", label: "Manutenção", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
    { value: "QUALITY", label: "Qualidade", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
    { value: "MATERIAL", label: "Falta Material", color: "bg-theme-tertiary text-theme" },
    { value: "OTHER", label: "Outros", color: "bg-theme-tertiary text-theme" },
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
          <Button
            onClick={() => setShowModal(true)}
            leftIcon={<PauseCircle className="w-4 h-4" />}
            className="bg-red-600 hover:bg-red-700"
          >
            Registrar Parada
          </Button>
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
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-theme mb-1">Centro de Trabalho</label>
            <Select
              value={workCenterId}
              onChange={setWorkCenterId}
              placeholder="Todos"
              options={workCenters?.map((wc) => ({ value: wc.id, label: `${wc.code} - ${wc.name}` })) || []}
            />
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
                <Select
                  value={stopForm.workCenterId}
                  onChange={(value) => setStopForm({ ...stopForm, workCenterId: value })}
                  placeholder="Selecione..."
                  required
                  options={workCenters?.map((wc) => ({ value: wc.id, label: `${wc.code} - ${wc.name}` })) || []}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Tipo de Parada</label>
                <Select
                  value={stopForm.stopType}
                  onChange={(value) => setStopForm({ ...stopForm, stopType: value as StopType })}
                  options={stopTypes.map((t) => ({ value: t.value, label: t.label }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Motivo</label>
                <Textarea
                  value={stopForm.reason}
                  onChange={(e) => setStopForm({ ...stopForm, reason: e.target.value })}
                  rows={2}
                  required
                  placeholder="Descreva o motivo da parada..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Solução (opcional)</label>
                <Textarea
                  value={stopForm.solution}
                  onChange={(e) => setStopForm({ ...stopForm, solution: e.target.value })}
                  rows={2}
                  placeholder="Ação tomada para resolver..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!stopForm.workCenterId || !stopForm.reason}
                  isLoading={logStopMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Registrar Parada
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
