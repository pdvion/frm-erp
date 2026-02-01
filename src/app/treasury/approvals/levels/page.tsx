"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import {
  Shield,
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
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";

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
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Níveis de Alçada"
        subtitle="Configure os níveis de aprovação por faixa de valor"
        icon={<Shield className="h-6 w-6" />}
        backHref="/treasury/approvals"
        module="finance"
        actions={
          !showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Novo Nível
            </Button>
          ) : undefined
        }
      />

      {/* Form */}
      {showForm && (
        <div className="bg-theme-card mb-6 rounded-xl border p-6 shadow-sm">
          <h2 className="text-theme mb-4 text-lg font-semibold">
            {editingId ? "Editar Nível de Alçada" : "Novo Nível de Alçada"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Código *"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                disabled={!!editingId}
                placeholder="Ex: NIVEL_1"
              />
              <Input
                label="Nome *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ex: Aprovação Gerencial"
              />
            </div>

            <div>
              <label
                htmlFor="level-description"
                className="text-theme-secondary mb-1 block text-sm font-medium"
              >
                Descrição
              </label>
              <Textarea
                id="level-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do nível de alçada..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Valor Mínimo (R$)"
                type="number"
                value={formData.minValue}
                onChange={(e) =>
                  setFormData({ ...formData, minValue: parseFloat(e.target.value) || 0 })
                }
                min={0}
                step={0.01}
              />
              <Input
                label="Valor Máximo (R$)"
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
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="requires-all"
                type="checkbox"
                checked={formData.requiresAllApprovers}
                onChange={(e) =>
                  setFormData({ ...formData, requiresAllApprovers: e.target.checked })
                }
                className="border-theme h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="requires-all" className="text-theme-secondary text-sm">
                Requer aprovação de todos os aprovadores (em sequência)
              </label>
            </div>

            {/* Approvers Section */}
            <div className="border-t pt-4">
              <h3 className="text-theme mb-3 flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                Aprovadores *
              </h3>

              <div className="mb-3">
                <Select
                  value=""
                  onChange={(value) => {
                    if (value) {
                      addApprover(value);
                    }
                  }}
                  placeholder="Selecione um usuário para adicionar..."
                  options={[
                    { value: "", label: "Selecione um usuário para adicionar..." },
                    ...(usersData
                      ?.filter((u) => !formData.approvers.some((a) => a.userId === u.userId))
                      .map((u) => ({
                        value: u.userId,
                        label: u.user?.name || u.user?.email || u.userId,
                      })) || []),
                  ]}
                />
              </div>

              {formData.approvers.length === 0 ? (
                <p className="text-theme-muted text-sm italic">Nenhum aprovador adicionado</p>
              ) : (
                <div className="space-y-2">
                  {formData.approvers.map((approver, idx) => (
                    <div
                      key={approver.userId}
                      className="bg-theme-tertiary flex items-center justify-between rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                          {idx + 1}
                        </span>
                        <span className="text-theme text-sm font-medium">{approver.userName}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-sm">
                          <input
                            type="checkbox"
                            checked={approver.canApprove}
                            onChange={() => toggleApproverPermission(approver.userId, "canApprove")}
                            className="border-theme h-4 w-4 rounded text-green-600 focus:ring-green-500"
                          />
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Aprovar
                        </label>

                        <label className="flex items-center gap-1.5 text-sm">
                          <input
                            type="checkbox"
                            checked={approver.canReject}
                            onChange={() => toggleApproverPermission(approver.userId, "canReject")}
                            className="border-theme h-4 w-4 rounded text-red-600 focus:ring-red-500"
                          />
                          <XCircle className="h-4 w-4 text-red-600" />
                          Rejeitar
                        </label>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeApprover(approver.userId)}
                          className="text-theme-muted hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <Button
                variant="outline"
                onClick={resetForm}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={isPending}
                leftIcon={<Save className="h-4 w-4" />}
              >
                {editingId ? "Salvar Alterações" : "Criar Nível"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Levels List */}
      <div className="bg-theme-card overflow-hidden rounded-xl border shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : levels?.length === 0 ? (
          <div className="text-theme-muted flex flex-col items-center justify-center py-12">
            <Shield className="text-theme-muted mb-3 h-12 w-12" />
            <p className="font-medium">Nenhum nível de alçada configurado</p>
            <p className="text-sm">Crie níveis para controlar aprovações por faixa de valor</p>
          </div>
        ) : (
          <div className="divide-y">
            {levels?.map((level) => (
              <div key={level.id} className="p-4">
                <div
                  className="flex cursor-pointer items-center justify-between"
                  onClick={() => setExpandedLevel(expandedLevel === level.id ? null : level.id)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        level.isActive
                          ? "bg-indigo-100 text-blue-600"
                          : "bg-theme-tertiary text-theme-muted"
                      }`}
                    >
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-theme font-medium">{level.name}</h3>
                        <span className="text-theme-muted font-mono text-xs">{level.code}</span>
                        {!level.isActive && (
                          <span className="bg-theme-tertiary text-theme-secondary rounded-full px-2 py-0.5 text-xs">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="text-theme-secondary flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(level.minValue)}
                          {level.maxValue ? ` - ${formatCurrency(level.maxValue)}` : "+"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {level.approvers.length} aprovador(es)
                        </span>
                        <span className="text-theme-muted">
                          {level._count.paymentRequests} solicitações
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(level);
                      }}
                      className="text-theme-muted hover:text-blue-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(level.id);
                      }}
                      disabled={level._count.paymentRequests > 0}
                      className="text-theme-muted hover:text-red-600"
                      title={
                        level._count.paymentRequests > 0
                          ? "Não é possível excluir nível com solicitações"
                          : "Excluir nível"
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {expandedLevel === level.id ? (
                      <ChevronUp className="text-theme-muted h-5 w-5" />
                    ) : (
                      <ChevronDown className="text-theme-muted h-5 w-5" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedLevel === level.id && (
                  <div className="mt-4 space-y-3 pl-14">
                    {level.description && (
                      <p className="text-theme-secondary text-sm">{level.description}</p>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Settings className="text-theme-muted h-4 w-4" />
                      <span className="text-theme-secondary">
                        {level.requiresAllApprovers
                          ? "Requer aprovação de todos em sequência"
                          : "Qualquer aprovador pode aprovar"}
                      </span>
                    </div>

                    <div className="bg-theme-tertiary rounded-lg p-3">
                      <h4 className="text-theme-muted mb-2 text-xs font-medium uppercase">
                        Aprovadores
                      </h4>
                      <div className="space-y-2">
                        {level.approvers.map((approver, idx) => (
                          <div
                            key={approver.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-700">
                                {idx + 1}
                              </span>
                              <span className="text-theme">
                                {approver.user?.name || approver.user?.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              {approver.canApprove && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="h-3 w-3" />
                                  Aprovar
                                </span>
                              )}
                              {approver.canReject && (
                                <span className="flex items-center gap-1 text-red-600">
                                  <XCircle className="h-3 w-3" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-theme-card mx-4 w-full max-w-md rounded-xl p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-theme text-lg font-semibold">Excluir Nível de Alçada</h3>
            </div>
            <p className="text-theme-secondary mb-6">
              Tem certeza que deseja excluir este nível de alçada? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteMutation.mutate({ id: deleteConfirm })}
                disabled={deleteMutation.isPending}
                isLoading={deleteMutation.isPending}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
