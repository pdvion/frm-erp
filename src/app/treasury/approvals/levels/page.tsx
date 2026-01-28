"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import {
  Shield,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";

interface ApproverInput {
  userId: string;
  userName?: string;
  canApprove: boolean;
  canReject: boolean;
}

interface LevelFormData {
  code: string;
  name: string;
  description: string;
  minValue: number;
  maxValue: number | null;
  requiresAllApprovers: boolean;
  approvers: ApproverInput[];
}

const emptyForm: LevelFormData = {
  code: "",
  name: "",
  description: "",
  minValue: 0,
  maxValue: null,
  requiresAllApprovers: false,
  approvers: [],
};

export default function ApprovalLevelsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LevelFormData>(emptyForm);
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: levels, isLoading } = trpc.approvals.listLevels.useQuery({ includeInactive: true });
  const { data: usersData } = trpc.companies.listUsers.useQuery({ companyId: "" });

  const createMutation = trpc.approvals.createLevel.useMutation({
    onSuccess: () => {
      utils.approvals.listLevels.invalidate();
      resetForm();
    },
  });

  const updateMutation = trpc.approvals.updateLevel.useMutation({
    onSuccess: () => {
      utils.approvals.listLevels.invalidate();
      resetForm();
    },
  });

  const deleteMutation = trpc.approvals.deleteLevel.useMutation({
    onSuccess: () => {
      utils.approvals.listLevels.invalidate();
      setDeleteConfirm(null);
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleEdit = (level: NonNullable<typeof levels>[0]) => {
    setEditingId(level.id);
    setFormData({
      code: level.code,
      name: level.name,
      description: level.description || "",
      minValue: level.minValue,
      maxValue: level.maxValue,
      requiresAllApprovers: level.requiresAllApprovers,
      approvers: level.approvers.map((a) => ({
        userId: a.userId,
        userName: a.user?.name || a.user?.email || "",
        canApprove: a.canApprove,
        canReject: a.canReject,
      })),
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.approvers.length === 0) {
      alert("Adicione pelo menos um aprovador");
      return;
    }

    const payload = {
      code: formData.code,
      name: formData.name,
      description: formData.description || undefined,
      minValue: formData.minValue,
      maxValue: formData.maxValue || undefined,
      requiresAllApprovers: formData.requiresAllApprovers,
      approvers: formData.approvers.map((a) => ({
        userId: a.userId,
        canApprove: a.canApprove,
        canReject: a.canReject,
      })),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const addApprover = (userId: string) => {
    const user = usersData?.find((u) => u.userId === userId);
    if (!user || formData.approvers.some((a) => a.userId === userId)) return;

    setFormData({
      ...formData,
      approvers: [
        ...formData.approvers,
        {
          userId,
          userName: user.user?.name || user.user?.email || "",
          canApprove: true,
          canReject: true,
        },
      ],
    });
  };

  const removeApprover = (userId: string) => {
    setFormData({
      ...formData,
      approvers: formData.approvers.filter((a) => a.userId !== userId),
    });
  };

  const toggleApproverPermission = (userId: string, field: "canApprove" | "canReject") => {
    setFormData({
      ...formData,
      approvers: formData.approvers.map((a) =>
        a.userId === userId ? { ...a, [field]: !a[field] } : a
      ),
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/treasury/approvals"
            className="p-2 hover:bg-theme-hover rounded-lg transition-colors"
            aria-label="Voltar para Aprovações"
          >
            <ArrowLeft className="w-5 h-5 text-theme-secondary" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-theme flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-600" />
              Níveis de Alçada
            </h1>
            <p className="text-theme-secondary">Configure os níveis de aprovação por faixa de valor</p>
          </div>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Nível
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-theme-card rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-theme mb-4">
            {editingId ? "Editar Nível de Alçada" : "Novo Nível de Alçada"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="level-code" className="block text-sm font-medium text-theme-secondary mb-1">
                  Código *
                </label>
                <input
                  id="level-code"
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  disabled={!!editingId}
                  placeholder="Ex: NIVEL_1"
                  className="w-full border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-theme-tertiary"
                />
              </div>

              <div>
                <label htmlFor="level-name" className="block text-sm font-medium text-theme-secondary mb-1">
                  Nome *
                </label>
                <input
                  id="level-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ex: Aprovação Gerencial"
                  className="w-full border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="level-description" className="block text-sm font-medium text-theme-secondary mb-1">
                Descrição
              </label>
              <textarea
                id="level-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do nível de alçada..."
                rows={2}
                className="w-full border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="level-min-value" className="block text-sm font-medium text-theme-secondary mb-1">
                  Valor Mínimo (R$)
                </label>
                <input
                  id="level-min-value"
                  type="number"
                  value={formData.minValue}
                  onChange={(e) => setFormData({ ...formData, minValue: parseFloat(e.target.value) || 0 })}
                  min={0}
                  step={0.01}
                  className="w-full border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="level-max-value" className="block text-sm font-medium text-theme-secondary mb-1">
                  Valor Máximo (R$)
                </label>
                <input
                  id="level-max-value"
                  type="number"
                  value={formData.maxValue ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxValue: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  min={0}
                  step={0.01}
                  placeholder="Sem limite"
                  className="w-full border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="requires-all"
                type="checkbox"
                checked={formData.requiresAllApprovers}
                onChange={(e) => setFormData({ ...formData, requiresAllApprovers: e.target.checked })}
                className="w-4 h-4 rounded border-theme text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="requires-all" className="text-sm text-theme-secondary">
                Requer aprovação de todos os aprovadores (em sequência)
              </label>
            </div>

            {/* Approvers Section */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-theme mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Aprovadores *
              </h3>

              <div className="mb-3">
                <label htmlFor="add-approver" className="sr-only">
                  Adicionar aprovador
                </label>
                <select
                  id="add-approver"
                  onChange={(e) => {
                    if (e.target.value) {
                      addApprover(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="w-full border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Selecione um usuário para adicionar...</option>
                  {usersData
                    ?.filter((u) => !formData.approvers.some((a) => a.userId === u.userId))
                    .map((u) => (
                      <option key={u.userId} value={u.userId}>
                        {u.user?.name || u.user?.email}
                      </option>
                    ))}
                </select>
              </div>

              {formData.approvers.length === 0 ? (
                <p className="text-sm text-theme-muted italic">Nenhum aprovador adicionado</p>
              ) : (
                <div className="space-y-2">
                  {formData.approvers.map((approver, idx) => (
                    <div
                      key={approver.userId}
                      className="flex items-center justify-between p-3 bg-theme-tertiary rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-medium">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-theme">{approver.userName}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-sm">
                          <input
                            type="checkbox"
                            checked={approver.canApprove}
                            onChange={() => toggleApproverPermission(approver.userId, "canApprove")}
                            className="w-4 h-4 rounded border-theme text-green-600 focus:ring-green-500"
                          />
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Aprovar
                        </label>

                        <label className="flex items-center gap-1.5 text-sm">
                          <input
                            type="checkbox"
                            checked={approver.canReject}
                            onChange={() => toggleApproverPermission(approver.userId, "canReject")}
                            className="w-4 h-4 rounded border-theme text-red-600 focus:ring-red-500"
                          />
                          <XCircle className="w-4 h-4 text-red-600" />
                          Rejeitar
                        </label>

                        <button
                          type="button"
                          onClick={() => removeApprover(approver.userId)}
                          className="p-1 text-theme-muted hover:text-red-600 transition-colors"
                          aria-label="Remover aprovador"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-theme-secondary hover:bg-theme-hover rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? "Salvar Alterações" : "Criar Nível"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Levels List */}
      <div className="bg-theme-card rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : levels?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-theme-muted">
            <Shield className="w-12 h-12 mb-3 text-theme-muted" />
            <p className="font-medium">Nenhum nível de alçada configurado</p>
            <p className="text-sm">Crie níveis para controlar aprovações por faixa de valor</p>
          </div>
        ) : (
          <div className="divide-y">
            {levels?.map((level) => (
              <div key={level.id} className="p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedLevel(expandedLevel === level.id ? null : level.id)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        level.isActive ? "bg-indigo-100 text-indigo-600" : "bg-theme-tertiary text-theme-muted"
                      }`}
                    >
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-theme">{level.name}</h3>
                        <span className="text-xs text-theme-muted font-mono">{level.code}</span>
                        {!level.isActive && (
                          <span className="px-2 py-0.5 bg-theme-tertiary text-theme-secondary text-xs rounded-full">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-theme-secondary">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {formatCurrency(level.minValue)}
                          {level.maxValue ? ` - ${formatCurrency(level.maxValue)}` : "+"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {level.approvers.length} aprovador(es)
                        </span>
                        <span className="text-theme-muted">
                          {level._count.paymentRequests} solicitações
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(level);
                      }}
                      className="p-2 text-theme-muted hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      aria-label="Editar nível"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(level.id);
                      }}
                      disabled={level._count.paymentRequests > 0}
                      className="p-2 text-theme-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Excluir nível"
                      title={
                        level._count.paymentRequests > 0
                          ? "Não é possível excluir nível com solicitações"
                          : "Excluir nível"
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {expandedLevel === level.id ? (
                      <ChevronUp className="w-5 h-5 text-theme-muted" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-theme-muted" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedLevel === level.id && (
                  <div className="mt-4 pl-14 space-y-3">
                    {level.description && (
                      <p className="text-sm text-theme-secondary">{level.description}</p>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Settings className="w-4 h-4 text-theme-muted" />
                      <span className="text-theme-secondary">
                        {level.requiresAllApprovers
                          ? "Requer aprovação de todos em sequência"
                          : "Qualquer aprovador pode aprovar"}
                      </span>
                    </div>

                    <div className="bg-theme-tertiary rounded-lg p-3">
                      <h4 className="text-xs font-medium text-theme-muted uppercase mb-2">
                        Aprovadores
                      </h4>
                      <div className="space-y-2">
                        {level.approvers.map((approver, idx) => (
                          <div
                            key={approver.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs">
                                {idx + 1}
                              </span>
                              <span className="text-theme">
                                {approver.user?.name || approver.user?.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              {approver.canApprove && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-3 h-3" />
                                  Aprovar
                                </span>
                              )}
                              {approver.canReject && (
                                <span className="flex items-center gap-1 text-red-600">
                                  <XCircle className="w-3 h-3" />
                                  Rejeitar
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-theme">Excluir Nível de Alçada</h3>
            </div>
            <p className="text-theme-secondary mb-6">
              Tem certeza que deseja excluir este nível de alçada? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-theme-secondary hover:bg-theme-hover rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate({ id: deleteConfirm })}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
