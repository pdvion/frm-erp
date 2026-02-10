"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FileText, Plus } from "lucide-react";

export default function ProductionLogsPage() {
  const [workCenterId, setWorkCenterId] = useState<string>("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [showModal, setShowModal] = useState(false);

  const { data: workCenters } = trpc.oee.listWorkCenters.useQuery({});
  const { data: dashboard, isLoading } = trpc.oee.dashboard.useQuery({
    startDate: new Date(startDate),
    endDate: new Date(endDate),
  });

  const logMutation = trpc.oee.logProduction.useMutation({
    onSuccess: () => {
      setShowModal(false);
    },
  });

  const [logForm, setLogForm] = useState({
    workCenterId: "",
    shiftNumber: 1,
    plannedQuantity: 0,
    producedQuantity: 0,
    goodQuantity: 0,
    scrapQuantity: 0,
    plannedTimeMinutes: 480,
    actualTimeMinutes: 480,
    stopTimeMinutes: 0,
  });

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logMutation.mutate({
      ...logForm,
      shiftDate: new Date(),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logs de Produção"
        module="PRODUCTION"
        icon={<FileText className="w-6 h-6" />}
        breadcrumbs={[
          { label: "OEE", href: "/oee" },
          { label: "Logs de Produção" },
        ]}
        actions={
          <Button
            onClick={() => setShowModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Registrar Produção
          </Button>
        }
      />

      {/* Filtros */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-theme mb-1">Centro de Trabalho</label>
            <Select
              value={workCenterId}
              onChange={setWorkCenterId}
              placeholder="Todos"
              options={workCenters?.map((wc) => ({ value: wc.id, label: `${wc.code} - ${wc.name}` })) || []}
            />
          </div>
          <Input
            label="Data Início"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Data Fim"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Resumo */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <p className="text-sm text-theme-muted">OEE Médio</p>
            <p className="text-2xl font-bold text-theme">{dashboard.averageOee.toFixed(1)}%</p>
          </div>
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <p className="text-sm text-theme-muted">Total Produzido</p>
            <p className="text-2xl font-bold text-theme">{Number(dashboard.productionSummary.totalProduced)}</p>
          </div>
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <p className="text-sm text-theme-muted">Peças Boas</p>
            <p className="text-2xl font-bold text-green-600">{Number(dashboard.productionSummary.totalGood)}</p>
          </div>
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <p className="text-sm text-theme-muted">Refugo</p>
            <p className="text-2xl font-bold text-red-600">{Number(dashboard.productionSummary.totalScrap)}</p>
          </div>
        </div>
      )}

      {/* Tabela por Centro de Trabalho */}
      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-theme-table-header border-b border-theme">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Centro</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Disponibilidade</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Performance</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Qualidade</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">OEE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-table">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-theme-muted">Carregando...</td>
              </tr>
            ) : dashboard?.oeeByWorkCenter.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-theme-muted">Nenhum registro no período</td>
              </tr>
            ) : (
              dashboard?.oeeByWorkCenter
                .filter((item) => !workCenterId || item.workCenter.id === workCenterId)
                .map((item) => (
                  <tr key={item.workCenter.id} className="hover:bg-theme-table-hover">
                    <td className="px-4 py-3 text-sm text-theme">
                      <span className="font-medium">{item.workCenter.code}</span>
                      <span className="text-theme-muted ml-2">{item.workCenter.name}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-theme">{item.availability.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-sm text-theme">{item.performance.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-sm text-theme">{item.quality.toFixed(1)}%</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        item.oee >= 85 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                          item.oee >= 65 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                            "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {item.oee.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Registro */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card border border-theme rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-theme mb-4">Registrar Produção</h3>
            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Centro de Trabalho</label>
                <Select
                  value={logForm.workCenterId}
                  onChange={(value) => setLogForm({ ...logForm, workCenterId: value })}
                  placeholder="Selecione..."
                  required
                  options={workCenters?.map((wc) => ({ value: wc.id, label: `${wc.code} - ${wc.name}` })) || []}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Qtd Planejada"
                  type="number"
                  value={logForm.plannedQuantity}
                  onChange={(e) => setLogForm({ ...logForm, plannedQuantity: Number(e.target.value) })}
                />
                <Input
                  label="Qtd Produzida"
                  type="number"
                  value={logForm.producedQuantity}
                  onChange={(e) => setLogForm({ ...logForm, producedQuantity: Number(e.target.value) })}
                />
                <Input
                  label="Qtd Boa"
                  type="number"
                  value={logForm.goodQuantity}
                  onChange={(e) => setLogForm({ ...logForm, goodQuantity: Number(e.target.value) })}
                />
                <Input
                  label="Refugo"
                  type="number"
                  value={logForm.scrapQuantity}
                  onChange={(e) => setLogForm({ ...logForm, scrapQuantity: Number(e.target.value) })}
                />
                <Input
                  label="Tempo Planejado (min)"
                  type="number"
                  value={logForm.plannedTimeMinutes}
                  onChange={(e) => setLogForm({ ...logForm, plannedTimeMinutes: Number(e.target.value) })}
                />
                <Input
                  label="Tempo Parada (min)"
                  type="number"
                  value={logForm.stopTimeMinutes}
                  onChange={(e) => setLogForm({ ...logForm, stopTimeMinutes: Number(e.target.value) })}
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
                  disabled={!logForm.workCenterId}
                  isLoading={logMutation.isPending}
                >
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
