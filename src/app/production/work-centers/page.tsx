"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Settings,
  Loader2,
  Plus,
  Pencil,
  CheckCircle,
  XCircle,
  Factory,
  Clock,
  Target,
  DollarSign,
} from "lucide-react";

export default function WorkCentersPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
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

  const { data: workCenters, isLoading, refetch } = trpc.oee.listWorkCenters.useQuery({ includeInactive: true });

  const createMutation = trpc.oee.createWorkCenter.useMutation({
    onSuccess: () => {
      resetForm();
      refetch();
    },
  });

  const updateMutation = trpc.oee.updateWorkCenter.useMutation({
    onSuccess: () => {
      resetForm();
      refetch();
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
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
    setFormData({
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
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    updateMutation.mutate({ id, isActive: !isActive });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centros de Trabalho"
        icon={<Settings className="w-6 h-6" />}
        backHref="/production"
        module="production"
        actions={
          <Button
            onClick={() => setShowForm(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Novo Centro
          </Button>
        }
      />

      <main className="max-w-7xl mx-auto">
        {/* Formulário */}
        {showForm && (
          <div className="bg-theme-card rounded-lg border border-theme p-6 mb-6">
            <h2 className="text-lg font-medium text-theme mb-4">
              {editingId ? "Editar Centro de Trabalho" : "Novo Centro de Trabalho"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Código *"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  placeholder="Ex: CT-001"
                />
                <div className="md:col-span-2">
                  <Input
                    label="Nome *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ex: Torno CNC 01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Descrição</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Descrição do centro de trabalho..."
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input
                  label="Capacidade/Hora"
                  type="number"
                  value={formData.capacityPerHour}
                  onChange={(e) => setFormData({ ...formData, capacityPerHour: parseFloat(e.target.value) || 1 })}
                  min={0.1}
                  step={0.1}
                />
                <Input
                  label="Horas/Dia"
                  type="number"
                  value={formData.hoursPerDay}
                  onChange={(e) => setFormData({ ...formData, hoursPerDay: parseInt(e.target.value) || 8 })}
                  min={1}
                  max={24}
                />
                <Input
                  label="Dias/Semana"
                  type="number"
                  value={formData.daysPerWeek}
                  onChange={(e) => setFormData({ ...formData, daysPerWeek: parseInt(e.target.value) || 5 })}
                  min={1}
                  max={7}
                />
                <Input
                  label="Meta OEE (%)"
                  type="number"
                  value={formData.efficiencyTarget}
                  onChange={(e) => setFormData({ ...formData, efficiencyTarget: parseInt(e.target.value) || 85 })}
                  min={0}
                  max={100}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Tempo Setup (min)"
                  type="number"
                  value={formData.setupTimeMinutes}
                  onChange={(e) => setFormData({ ...formData, setupTimeMinutes: parseInt(e.target.value) || 0 })}
                  min={0}
                />
                <Input
                  label="Custo/Hora (R$)"
                  type="number"
                  value={formData.costPerHour}
                  onChange={(e) => setFormData({ ...formData, costPerHour: parseFloat(e.target.value) || 0 })}
                  min={0}
                  step={0.01}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Lista */}
        {workCenters?.length === 0 ? (
          <div className="bg-theme-card rounded-lg border border-theme p-8 text-center">
            <Factory className="w-12 h-12 text-theme-muted mx-auto mb-4" />
            <p className="text-theme-muted mb-4">Nenhum centro de trabalho cadastrado</p>
            <Button
              onClick={() => setShowForm(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Criar Primeiro Centro
            </Button>
          </div>
        ) : (
          <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
            <table className="w-full">
              <thead className="bg-theme-tertiary">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-theme-muted">Código</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-theme-muted">Nome</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-theme-muted">Capacidade</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-theme-muted">Horário</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-theme-muted">Meta OEE</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-theme-muted">Custo/Hora</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-theme-muted">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-theme-muted">Ações</th>
                </tr>
              </thead>
              <tbody>
                {workCenters?.map((wc) => (
                  <tr key={wc.id} className="border-t border-theme hover:bg-theme-hover">
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm bg-theme-tertiary px-2 py-1 rounded">{wc.code}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{wc.name}</div>
                      {wc.description && <div className="text-xs text-theme-muted">{wc.description}</div>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <Factory className="w-4 h-4 text-theme-muted" />
                        {Number(wc.capacityPerHour)}/h
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <Clock className="w-4 h-4 text-theme-muted" />
                        {Number(wc.hoursPerDay)}h x {Number(wc.daysPerWeek)}d
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <Target className="w-4 h-4 text-theme-muted" />
                        {Number(wc.efficiencyTarget)}%
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <DollarSign className="w-4 h-4 text-theme-muted" />
                        {formatCurrency(wc.costPerHour)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(wc.id, wc.isActive)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          wc.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-theme-tertiary text-theme-secondary"
                        }`}
                      >
                        {wc.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Inativo
                          </>
                        )}
                      </Button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(wc)}
                          className="p-1 text-blue-600 hover:bg-blue-50"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
