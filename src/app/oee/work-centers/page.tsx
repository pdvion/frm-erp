"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Settings, Plus, Edit, ToggleLeft, ToggleRight } from "lucide-react";

export default function OEEWorkCentersPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const utils = trpc.useUtils();
  const { data: workCenters, isLoading } = trpc.oee.listWorkCenters.useQuery({ includeInactive });

  const createMutation = trpc.oee.createWorkCenter.useMutation({
    onSuccess: () => {
      utils.oee.listWorkCenters.invalidate();
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = trpc.oee.updateWorkCenter.useMutation({
    onSuccess: () => {
      utils.oee.listWorkCenters.invalidate();
      setShowModal(false);
      setEditingId(null);
      resetForm();
    },
  });

  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    capacityPerHour: 1,
    hoursPerDay: 8,
    daysPerWeek: 5,
    efficiencyTarget: 85,
    setupTimeMinutes: 0,
    costPerHour: 0,
  });

  const resetForm = () => {
    setForm({
      code: "",
      name: "",
      description: "",
      capacityPerHour: 1,
      hoursPerDay: 8,
      daysPerWeek: 5,
      efficiencyTarget: 85,
      setupTimeMinutes: 0,
      costPerHour: 0,
    });
  };

  const handleEdit = (wc: typeof workCenters extends (infer T)[] | undefined ? T : never) => {
    if (!wc) return;
    setEditingId(wc.id);
    setForm({
      code: wc.code,
      name: wc.name,
      description: wc.description || "",
      capacityPerHour: Number(wc.capacityPerHour),
      hoursPerDay: Number(wc.hoursPerDay),
      daysPerWeek: wc.daysPerWeek,
      efficiencyTarget: Number(wc.efficiencyTarget),
      setupTimeMinutes: wc.setupTimeMinutes,
      costPerHour: Number(wc.costPerHour),
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleToggleActive = (id: string, currentActive: boolean) => {
    updateMutation.mutate({ id, isActive: !currentActive });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centros de Trabalho OEE"
        module="PRODUCTION"
        icon={<Settings className="w-6 h-6" />}
        breadcrumbs={[
          { label: "OEE", href: "/oee" },
          { label: "Centros de Trabalho" },
        ]}
        actions={
          <Button
            onClick={() => { resetForm(); setEditingId(null); setShowModal(true); }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Novo Centro
          </Button>
        }
      />

      {/* Filtro */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <label className="flex items-center gap-2 text-sm text-theme cursor-pointer">
          <Input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded"
          />
          Incluir inativos
        </label>
      </div>

      {/* Tabela */}
      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-theme-table-header border-b border-theme">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Capacidade/h</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Meta OEE</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Setup (min)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-table">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-theme-muted">Carregando...</td>
              </tr>
            ) : workCenters?.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-theme-muted">
                  Nenhum centro de trabalho cadastrado
                </td>
              </tr>
            ) : (
              workCenters?.map((wc) => (
                <tr key={wc.id} className="hover:bg-theme-table-hover">
                  <td className="px-4 py-3 text-sm font-medium text-theme">{wc.code}</td>
                  <td className="px-4 py-3 text-sm text-theme">{wc.name}</td>
                  <td className="px-4 py-3 text-sm text-theme">{Number(wc.capacityPerHour)}</td>
                  <td className="px-4 py-3 text-sm text-theme">{Number(wc.efficiencyTarget)}%</td>
                  <td className="px-4 py-3 text-sm text-theme">{wc.setupTimeMinutes}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      wc.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-theme-tertiary text-theme"
                    }`}>
                      {wc.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(wc)}
                        className="p-1 text-blue-600 hover:text-blue-700"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(wc.id, wc.isActive)}
                        className={`p-1 ${wc.isActive ? "text-theme-secondary hover:text-theme-secondary" : "text-green-600 hover:text-green-700"}`}
                        title={wc.isActive ? "Desativar" : "Ativar"}
                      >
                        {wc.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card border border-theme rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-theme mb-4">
              {editingId ? "Editar Centro de Trabalho" : "Novo Centro de Trabalho"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Código"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                />
                <Input
                  label="Nome"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <Input
                label="Descrição"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Capacidade/h"
                  type="number"
                  min={1}
                  value={form.capacityPerHour}
                  onChange={(e) => setForm({ ...form, capacityPerHour: Number(e.target.value) })}
                />
                <Input
                  label="Horas/Dia"
                  type="number"
                  min={1}
                  max={24}
                  value={form.hoursPerDay}
                  onChange={(e) => setForm({ ...form, hoursPerDay: Number(e.target.value) })}
                />
                <Input
                  label="Dias/Semana"
                  type="number"
                  min={1}
                  max={7}
                  value={form.daysPerWeek}
                  onChange={(e) => setForm({ ...form, daysPerWeek: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Meta OEE (%)"
                  type="number"
                  min={0}
                  max={100}
                  value={form.efficiencyTarget}
                  onChange={(e) => setForm({ ...form, efficiencyTarget: Number(e.target.value) })}
                />
                <Input
                  label="Setup (min)"
                  type="number"
                  min={0}
                  value={form.setupTimeMinutes}
                  onChange={(e) => setForm({ ...form, setupTimeMinutes: Number(e.target.value) })}
                />
                <Input
                  label="Custo/h (R$)"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.costPerHour}
                  onChange={(e) => setForm({ ...form, costPerHour: Number(e.target.value) })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowModal(false); setEditingId(null); }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!form.code || !form.name}
                  isLoading={createMutation.isPending || updateMutation.isPending}
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
