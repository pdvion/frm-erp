"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GitBranch, Plus, Lock, CheckCircle2, FileEdit } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/formatters";

type VersionStatus = "DRAFT" | "APPROVED" | "LOCKED" | undefined;

export default function BudgetVersionsPage() {
  const currentYear = new Date().getFullYear();
  const [statusFilter, setStatusFilter] = useState<VersionStatus>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [newVersion, setNewVersion] = useState({
    year: currentYear,
    name: "",
    type: "ORIGINAL" as "ORIGINAL" | "REVISED" | "FORECAST",
    description: "",
    copyFromVersionId: undefined as string | undefined,
    adjustmentPercent: 0,
  });

  const { data: versions, isLoading, refetch } = trpc.budget.listVersions.useQuery({
    status: statusFilter,
  });

  const createMutation = trpc.budget.createVersion.useMutation({
    onSuccess: () => {
      refetch();
      setShowModal(false);
      setNewVersion({ year: currentYear, name: "", type: "ORIGINAL", description: "", copyFromVersionId: undefined, adjustmentPercent: 0 });
    },
  });

  const updateMutation = trpc.budget.updateVersion.useMutation({
    onSuccess: () => refetch(),
  });

  const statusColors = {
    DRAFT: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30",
    APPROVED: "text-green-600 bg-green-100 dark:bg-green-900/30",
    LOCKED: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
  };

  const statusLabels = {
    DRAFT: "Rascunho",
    APPROVED: "Aprovado",
    LOCKED: "Bloqueado",
  };

  const typeLabels = {
    ORIGINAL: "Original",
    REVISED: "Revisado",
    FORECAST: "Forecast",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Versões de Orçamento"
        icon={<GitBranch className="w-6 h-6" />}
        module="BUDGET"
        breadcrumbs={[
          { label: "Orçamento", href: "/budget" },
          { label: "Versões" },
        ]}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nova Versão
          </button>
        }
      />

      {/* Filtros */}
      <div className="flex gap-2">
        <button
          onClick={() => setStatusFilter(undefined)}
          className={`px-3 py-1.5 rounded-lg text-sm ${!statusFilter ? "bg-blue-600 text-white" : "bg-theme-card border border-theme text-theme"}`}
        >
          Todas
        </button>
        {(["DRAFT", "APPROVED", "LOCKED"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-sm ${statusFilter === status ? "bg-blue-600 text-white" : "bg-theme-card border border-theme text-theme"}`}
          >
            {statusLabels[status]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="bg-theme-card border border-theme rounded-lg p-8 text-center text-theme-muted">
          Carregando...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {versions?.map((version) => (
            <div key={version.id} className="bg-theme-card border border-theme rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-theme">{version.name}</h3>
                  <p className="text-sm text-theme-muted">{version.year} - {typeLabels[version.type]}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${statusColors[version.status]}`}>
                  {statusLabels[version.status]}
                </span>
              </div>
              {version.description && (
                <p className="text-sm text-theme-muted mb-3">{version.description}</p>
              )}
              <div className="text-xs text-theme-muted mb-3">
                <p>Criado por: {version.creator?.name || "Sistema"}</p>
                <p>Em: {formatDateTime(version.createdAt)}</p>
                {version.approver && <p>Aprovado por: {version.approver.name}</p>}
                <p>{version._count.entries} entradas</p>
              </div>
              <div className="flex gap-2">
                {version.status === "DRAFT" && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateMutation.mutate({ id: version.id, status: "APPROVED" })}
                      className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                      leftIcon={<CheckCircle2 className="w-3 h-3" />}
                    >
                      Aprovar
                    </Button>
                    <Link
                      href={`/budget/planning?version=${version.id}`}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    >
                      <FileEdit className="w-3 h-3" />
                      Editar
                    </Link>
                  </>
                )}
                {version.status === "APPROVED" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateMutation.mutate({ id: version.id, status: "LOCKED" })}
                    className="text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    leftIcon={<Lock className="w-3 h-3" />}
                  >
                    Bloquear
                  </Button>
                )}
              </div>
            </div>
          ))}
          {versions?.length === 0 && (
            <div className="col-span-full bg-theme-card border border-theme rounded-lg p-8 text-center text-theme-muted">
              <GitBranch className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma versão encontrada</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de criação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card border border-theme rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-theme mb-4">Nova Versão de Orçamento</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Ano"
                  type="number"
                  value={newVersion.year}
                  onChange={(e) => setNewVersion({ ...newVersion, year: Number(e.target.value) })}
                />
                <div>
                  <label className="block text-sm font-medium text-theme mb-1">Tipo</label>
                  <select
                    value={newVersion.type}
                    onChange={(e) => setNewVersion({ ...newVersion, type: e.target.value as "ORIGINAL" | "REVISED" | "FORECAST" })}
                    className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-card text-theme"
                  >
                    <option value="ORIGINAL">Original</option>
                    <option value="REVISED">Revisado</option>
                    <option value="FORECAST">Forecast</option>
                  </select>
                </div>
              </div>
              <Input
                label="Nome"
                value={newVersion.name}
                onChange={(e) => setNewVersion({ ...newVersion, name: e.target.value })}
                placeholder="Ex: Orçamento 2026 - Original"
              />
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Copiar de (opcional)</label>
                <select
                  value={newVersion.copyFromVersionId || ""}
                  onChange={(e) => setNewVersion({ ...newVersion, copyFromVersionId: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-card text-theme"
                >
                  <option value="">Não copiar</option>
                  {versions?.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.year})</option>
                  ))}
                </select>
              </div>
              {newVersion.copyFromVersionId && (
                <Input
                  label="Ajuste % (opcional)"
                  type="number"
                  value={newVersion.adjustmentPercent}
                  onChange={(e) => setNewVersion({ ...newVersion, adjustmentPercent: Number(e.target.value) })}
                  placeholder="Ex: 5 para +5%"
                />
              )}
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Descrição</label>
                <textarea
                  value={newVersion.description}
                  onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-card text-theme"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => createMutation.mutate(newVersion)}
                disabled={!newVersion.name}
                isLoading={createMutation.isPending}
              >
                Criar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <Link href="/budget" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Voltar para Orçamento
        </Link>
      </div>
    </div>
  );
}
