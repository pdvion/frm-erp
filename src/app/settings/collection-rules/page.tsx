"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  Mail,
  MessageSquare,
  Phone,
  FileText,
  AlertTriangle,
  Scale,
  ChevronDown,
  ChevronUp,
  Bell,
} from "lucide-react";

const actionTypeConfig = {
  EMAIL: { label: "E-mail", icon: Mail, color: "text-blue-600" },
  SMS: { label: "SMS", icon: MessageSquare, color: "text-green-600" },
  WHATSAPP: { label: "WhatsApp", icon: MessageSquare, color: "text-emerald-600" },
  PHONE: { label: "Telefone", icon: Phone, color: "text-purple-600" },
  LETTER: { label: "Carta", icon: FileText, color: "text-theme-secondary" },
  NEGATIVATION: { label: "Negativação", icon: AlertTriangle, color: "text-orange-600" },
  PROTEST: { label: "Protesto", icon: Scale, color: "text-red-600" },
};

type ActionType = keyof typeof actionTypeConfig;

interface StepFormData {
  stepOrder: number;
  name: string;
  daysOffset: number;
  actionType: ActionType;
  templateSubject: string;
  templateBody: string;
  isActive: boolean;
}

export default function CollectionRulesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [showStepForm, setShowStepForm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    isDefault: false,
  });
  const [stepFormData, setStepFormData] = useState<StepFormData>({
    stepOrder: 1,
    name: "",
    daysOffset: 0,
    actionType: "EMAIL",
    templateSubject: "",
    templateBody: "",
    isActive: true,
  });

  const { data, isLoading, refetch } = trpc.collectionRules.list.useQuery({
    isActive: undefined,
  });

  const createMutation = trpc.collectionRules.create.useMutation({
    onSuccess: () => {
      resetForm();
      refetch();
    },
  });

  const updateMutation = trpc.collectionRules.update.useMutation({
    onSuccess: () => {
      resetForm();
      refetch();
    },
  });

  const deleteMutation = trpc.collectionRules.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const addStepMutation = trpc.collectionRules.addStep.useMutation({
    onSuccess: () => {
      resetStepForm();
      refetch();
    },
  });

  const deleteStepMutation = trpc.collectionRules.deleteStep.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      isActive: true,
      isDefault: false,
    });
  };

  const resetStepForm = () => {
    setShowStepForm(null);
    setStepFormData({
      stepOrder: 1,
      name: "",
      daysOffset: 0,
      actionType: "EMAIL",
      templateSubject: "",
      templateBody: "",
      isActive: true,
    });
  };

  const handleEdit = (rule: NonNullable<typeof data>["rules"][number]) => {
    setEditingId(rule.id);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      isActive: rule.isActive,
      isDefault: rule.isDefault,
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

  const handleAddStep = (ruleId: string, maxOrder: number) => {
    setShowStepForm(ruleId);
    setStepFormData((prev) => ({ ...prev, stepOrder: maxOrder + 1 }));
  };

  const handleStepSubmit = (e: React.FormEvent, ruleId: string) => {
    e.preventDefault();
    addStepMutation.mutate({ ruleId, ...stepFormData });
  };

  const formatDaysOffset = (days: number) => {
    if (days === 0) return "No vencimento";
    if (days < 0) return `${Math.abs(days)} dias antes`;
    return `${days} dias após`;
  };

  return (
    <div className="min-h-screen bg-theme-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <PageHeader
            title="Réguas de Cobrança"
            subtitle="Configure as etapas automáticas de cobrança para títulos vencidos"
            icon={<Bell className="w-6 h-6" />}
            backHref="/settings"
            module="settings"
            actions={
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Nova Régua
              </button>
            }
          />
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-theme-card rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? "Editar Régua" : "Nova Régua de Cobrança"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Régua Padrão"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Descrição opcional"
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-theme-secondary">Ativa</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) =>
                      setFormData({ ...formData, isDefault: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-theme-secondary">Régua Padrão</span>
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-theme-secondary border rounded-lg hover:bg-theme-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingId ? (
                    "Salvar"
                  ) : (
                    "Criar"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : !data?.rules.length ? (
          <div className="bg-theme-card rounded-lg shadow-sm border p-12 text-center">
            <p className="text-theme-muted">Nenhuma régua de cobrança cadastrada</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-blue-600 hover:underline"
            >
              Criar primeira régua
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {data.rules.map((rule) => (
              <div
                key={rule.id}
                className="bg-theme-card rounded-lg shadow-sm border overflow-hidden"
              >
                {/* Rule Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-theme-secondary"
                  onClick={() =>
                    setExpandedRuleId(
                      expandedRuleId === rule.id ? null : rule.id
                    )
                  }
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {rule.isActive ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-theme-muted" />
                      )}
                      {rule.isDefault && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-theme">{rule.name}</h3>
                      {rule.description && (
                        <p className="text-sm text-theme-muted">
                          {rule.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-theme-muted">
                      {rule.steps.length} etapa(s)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(rule);
                        }}
                        className="p-2 text-theme-muted hover:text-blue-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm("Deseja excluir esta régua de cobrança?")
                          ) {
                            deleteMutation.mutate({ id: rule.id });
                          }
                        }}
                        className="p-2 text-theme-muted hover:text-red-600"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {expandedRuleId === rule.id ? (
                        <ChevronUp className="w-5 h-5 text-theme-muted" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-theme-muted" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Steps */}
                {expandedRuleId === rule.id && (
                  <div className="border-t bg-theme-secondary p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-theme-secondary">
                        Etapas da Régua
                      </h4>
                      <button
                        onClick={() =>
                          handleAddStep(
                            rule.id,
                            Math.max(0, ...rule.steps.map((s) => s.stepOrder))
                          )
                        }
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Etapa
                      </button>
                    </div>

                    {/* Step Form */}
                    {showStepForm === rule.id && (
                      <form
                        onSubmit={(e) => handleStepSubmit(e, rule.id)}
                        className="bg-theme-card rounded-lg border p-4 mb-4 space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">
                              Nome da Etapa *
                            </label>
                            <input
                              type="text"
                              value={stepFormData.name}
                              onChange={(e) =>
                                setStepFormData({
                                  ...stepFormData,
                                  name: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                              placeholder="Ex: Lembrete de vencimento"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">
                              Dias (relativo ao vencimento) *
                            </label>
                            <input
                              type="number"
                              value={stepFormData.daysOffset}
                              onChange={(e) =>
                                setStepFormData({
                                  ...stepFormData,
                                  daysOffset: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                              placeholder="-5 = 5 dias antes"
                            />
                            <p className="text-xs text-theme-muted mt-1">
                              Negativo = antes, Positivo = depois
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-theme-secondary mb-1">
                              Tipo de Ação *
                            </label>
                            <select
                              value={stepFormData.actionType}
                              onChange={(e) =>
                                setStepFormData({
                                  ...stepFormData,
                                  actionType: e.target.value as ActionType,
                                })
                              }
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                            >
                              {Object.entries(actionTypeConfig).map(
                                ([key, config]) => (
                                  <option key={key} value={key}>
                                    {config.label}
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-secondary mb-1">
                            Assunto do Template
                          </label>
                          <input
                            type="text"
                            value={stepFormData.templateSubject}
                            onChange={(e) =>
                              setStepFormData({
                                ...stepFormData,
                                templateSubject: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            placeholder="Ex: Lembrete: Título vence em {dias} dias"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-theme-secondary mb-1">
                            Corpo do Template
                          </label>
                          <textarea
                            value={stepFormData.templateBody}
                            onChange={(e) =>
                              setStepFormData({
                                ...stepFormData,
                                templateBody: e.target.value,
                              })
                            }
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            placeholder="Variáveis: {cliente}, {valor}, {vencimento}, {dias}"
                          />
                        </div>
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={resetStepForm}
                            className="px-3 py-1.5 text-sm text-theme-secondary border rounded-lg hover:bg-theme-secondary"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={addStepMutation.isPending}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {addStepMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Adicionar"
                            )}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Steps List */}
                    {rule.steps.length === 0 ? (
                      <p className="text-sm text-theme-muted text-center py-4">
                        Nenhuma etapa configurada
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {rule.steps.map((step) => {
                          const config = actionTypeConfig[step.actionType as ActionType];
                          const Icon = config?.icon || Mail;
                          return (
                            <div
                              key={step.id}
                              className="bg-theme-card rounded-lg border p-3 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-2 rounded-lg bg-theme-tertiary ${config?.color || "text-theme-secondary"}`}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-theme-muted">
                                      #{step.stepOrder}
                                    </span>
                                    <span className="font-medium text-theme">
                                      {step.name}
                                    </span>
                                    {!step.isActive && (
                                      <span className="text-xs px-2 py-0.5 bg-theme-tertiary text-theme-muted rounded">
                                        Inativa
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-theme-muted">
                                    <span>{formatDaysOffset(step.daysOffset)}</span>
                                    <span>•</span>
                                    <span>{config?.label || step.actionType}</span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (
                                    confirm("Deseja excluir esta etapa?")
                                  ) {
                                    deleteStepMutation.mutate({
                                      stepId: step.id,
                                    });
                                  }
                                }}
                                className="p-2 text-theme-muted hover:text-red-600"
                                disabled={deleteStepMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
