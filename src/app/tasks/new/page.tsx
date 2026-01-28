"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import {
  ClipboardList,
  Save,
  Loader2,
  AlertTriangle,
  User,
  Building2,
  Users,
  Shield,
  Calendar,
} from "lucide-react";

const targetTypeConfig = {
  user: { label: "Usuário Específico", icon: User, description: "Atribuir a um usuário específico" },
  department: { label: "Departamento", icon: Building2, description: "Qualquer usuário do departamento pode aceitar" },
  group: { label: "Grupo", icon: Users, description: "Qualquer usuário do grupo pode aceitar" },
  permission: { label: "Por Permissão", icon: Shield, description: "Usuários com permissão específica" },
};

const priorityOptions = [
  { value: "URGENT", label: "Urgente", color: "text-red-600" },
  { value: "HIGH", label: "Alta", color: "text-orange-600" },
  { value: "NORMAL", label: "Normal", color: "text-theme-secondary" },
  { value: "LOW", label: "Baixa", color: "text-blue-600" },
];

const entityTypeOptions = [
  { value: "", label: "Nenhum" },
  { value: "NFE", label: "NFe" },
  { value: "REQUISITION", label: "Requisição" },
  { value: "PURCHASE_ORDER", label: "Pedido de Compra" },
  { value: "QUOTE", label: "Cotação" },
  { value: "PAYABLE", label: "Conta a Pagar" },
  { value: "RECEIVABLE", label: "Conta a Receber" },
  { value: "PRODUCTION_ORDER", label: "Ordem de Produção" },
  { value: "OTHER", label: "Outro" },
];

export default function NewTaskPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"URGENT" | "HIGH" | "NORMAL" | "LOW">("NORMAL");
  const [targetType, setTargetType] = useState<"user" | "department" | "group" | "permission">("user");
  const [targetUserId, setTargetUserId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [slaAcceptHours, setSlaAcceptHours] = useState("");
  const [slaResolveHours, setSlaResolveHours] = useState("");
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");

  // Mutation
  const createMutation = trpc.tasks.create.useMutation({
    onSuccess: (data) => {
      router.push(`/tasks/${data.id}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Informe o título da tarefa");
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      targetType,
      targetUserId: targetType === "user" && targetUserId ? targetUserId : undefined,
      deadline: deadline ? new Date(deadline) : undefined,
      slaAcceptHours: slaAcceptHours ? parseInt(slaAcceptHours) : undefined,
      slaResolveHours: slaResolveHours ? parseInt(slaResolveHours) : undefined,
      entityType: entityType ? (entityType as "NFE" | "REQUISITION" | "PURCHASE_ORDER" | "QUOTE" | "PAYABLE" | "RECEIVABLE" | "PRODUCTION_ORDER" | "OTHER") : undefined,
      entityId: entityId || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-500/10 rounded-lg">
          <ClipboardList className="w-6 h-6 text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-theme">Nova Tarefa</h1>
          <p className="text-sm text-theme-muted">Criar nova tarefa</p>
        </div>
      </div>

      <div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h2 className="text-lg font-medium text-theme mb-4">
              Informações Básicas
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-theme-secondary mb-1">
                  Título *
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Descreva a tarefa..."
                  className="w-full px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-theme-secondary mb-1">
                  Descrição
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes adicionais..."
                  rows={4}
                  className="w-full px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-theme-secondary mb-1">
                  Prioridade
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "URGENT" | "HIGH" | "NORMAL" | "LOW")}
                  className="w-full px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {priorityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Destinatário */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h2 className="text-lg font-medium text-theme mb-4">
              Destinatário
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {(Object.entries(targetTypeConfig) as [keyof typeof targetTypeConfig, typeof targetTypeConfig[keyof typeof targetTypeConfig]][]).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTargetType(key)}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      targetType === key
                        ? "border-purple-500 bg-purple-50"
                        : "border-theme hover:border-theme"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-5 h-5 ${targetType === key ? "text-purple-600" : "text-theme-muted"}`} />
                      <span className={`font-medium ${targetType === key ? "text-purple-900" : "text-theme"}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-theme-muted">{config.description}</p>
                  </button>
                );
              })}
            </div>

            {targetType === "user" && (
              <div>
                <label htmlFor="targetUserId" className="block text-sm font-medium text-theme-secondary mb-1">
                  ID do Usuário
                </label>
                <input
                  id="targetUserId"
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="ID do usuário destinatário"
                  className="w-full px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
          </div>

          {/* Prazos e SLA */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h2 className="text-lg font-medium text-theme mb-4">
              Prazos e SLA
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-theme-secondary mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Prazo Final
                </label>
                <input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label htmlFor="slaAccept" className="block text-sm font-medium text-theme-secondary mb-1">
                  SLA Aceite (horas)
                </label>
                <input
                  id="slaAccept"
                  type="number"
                  value={slaAcceptHours}
                  onChange={(e) => setSlaAcceptHours(e.target.value)}
                  placeholder="Ex: 4"
                  min="1"
                  className="w-full px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label htmlFor="slaResolve" className="block text-sm font-medium text-theme-secondary mb-1">
                  SLA Resolução (horas)
                </label>
                <input
                  id="slaResolve"
                  type="number"
                  value={slaResolveHours}
                  onChange={(e) => setSlaResolveHours(e.target.value)}
                  placeholder="Ex: 24"
                  min="1"
                  className="w-full px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Vínculo com Entidade */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h2 className="text-lg font-medium text-theme mb-4">
              Vínculo com Entidade (Opcional)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="entityType" className="block text-sm font-medium text-theme-secondary mb-1">
                  Tipo de Entidade
                </label>
                <select
                  id="entityType"
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  className="w-full px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {entityTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {entityType && (
                <div>
                  <label htmlFor="entityId" className="block text-sm font-medium text-theme-secondary mb-1">
                    ID da Entidade
                  </label>
                  <input
                    id="entityId"
                    type="text"
                    value={entityId}
                    onChange={(e) => setEntityId(e.target.value)}
                    placeholder="ID da entidade vinculada"
                    className="w-full px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-4">
            <Link
              href="/tasks"
              className="px-6 py-2 border border-theme-input rounded-lg text-theme-secondary hover:bg-theme-hover"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Criar Tarefa
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
