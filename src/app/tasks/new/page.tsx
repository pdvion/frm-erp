"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
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
  user: {
    label: "Usuário Específico",
    icon: User,
    description: "Atribuir a um usuário específico",
  },
  department: {
    label: "Departamento",
    icon: Building2,
    description: "Qualquer usuário do departamento pode aceitar",
  },
  group: { label: "Grupo", icon: Users, description: "Qualquer usuário do grupo pode aceitar" },
  permission: {
    label: "Por Permissão",
    icon: Shield,
    description: "Usuários com permissão específica",
  },
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
  const [targetType, setTargetType] = useState<"user" | "department" | "group" | "permission">(
    "user"
  );
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
      entityType: entityType
        ? (entityType as
            | "NFE"
            | "REQUISITION"
            | "PURCHASE_ORDER"
            | "QUOTE"
            | "PAYABLE"
            | "RECEIVABLE"
            | "PRODUCTION_ORDER"
            | "OTHER")
        : undefined,
      entityId: entityId || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Tarefa"
        subtitle="Criar nova tarefa"
        icon={<ClipboardList className="h-6 w-6" />}
        backHref="/tasks"
        module="settings"
      />

      <div>
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-theme-card border-theme rounded-lg border p-6">
            <h2 className="text-theme mb-4 text-lg font-medium">Informações Básicas</h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="text-theme-secondary mb-1 block text-sm font-medium"
                >
                  Título *
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Descreva a tarefa..."
                  className="border-theme-input w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="text-theme-secondary mb-1 block text-sm font-medium"
                >
                  Descrição
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes adicionais..."
                  rows={4}
                  className="border-theme-input w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label
                  htmlFor="priority"
                  className="text-theme-secondary mb-1 block text-sm font-medium"
                >
                  Prioridade
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as "URGENT" | "HIGH" | "NORMAL" | "LOW")
                  }
                  className="border-theme-input w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-purple-500"
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
          <div className="bg-theme-card border-theme rounded-lg border p-6">
            <h2 className="text-theme mb-4 text-lg font-medium">Destinatário</h2>
            <div className="mb-4 grid grid-cols-2 gap-4">
              {(
                Object.entries(targetTypeConfig) as [
                  keyof typeof targetTypeConfig,
                  (typeof targetTypeConfig)[keyof typeof targetTypeConfig],
                ][]
              ).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTargetType(key)}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      targetType === key
                        ? "border-purple-500 bg-purple-50"
                        : "border-theme hover:border-theme"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <Icon
                        className={`h-5 w-5 ${targetType === key ? "text-purple-600" : "text-theme-muted"}`}
                      />
                      <span
                        className={`font-medium ${targetType === key ? "text-purple-900" : "text-theme"}`}
                      >
                        {config.label}
                      </span>
                    </div>
                    <p className="text-theme-muted text-sm">{config.description}</p>
                  </button>
                );
              })}
            </div>

            {targetType === "user" && (
              <div>
                <label
                  htmlFor="targetUserId"
                  className="text-theme-secondary mb-1 block text-sm font-medium"
                >
                  ID do Usuário
                </label>
                <input
                  id="targetUserId"
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="ID do usuário destinatário"
                  className="border-theme-input w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
          </div>

          {/* Prazos e SLA */}
          <div className="bg-theme-card border-theme rounded-lg border p-6">
            <h2 className="text-theme mb-4 text-lg font-medium">Prazos e SLA</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label
                  htmlFor="deadline"
                  className="text-theme-secondary mb-1 block text-sm font-medium"
                >
                  <Calendar className="mr-1 inline h-4 w-4" />
                  Prazo Final
                </label>
                <input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="border-theme-input w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label
                  htmlFor="slaAccept"
                  className="text-theme-secondary mb-1 block text-sm font-medium"
                >
                  SLA Aceite (horas)
                </label>
                <input
                  id="slaAccept"
                  type="number"
                  value={slaAcceptHours}
                  onChange={(e) => setSlaAcceptHours(e.target.value)}
                  placeholder="Ex: 4"
                  min="1"
                  className="border-theme-input w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label
                  htmlFor="slaResolve"
                  className="text-theme-secondary mb-1 block text-sm font-medium"
                >
                  SLA Resolução (horas)
                </label>
                <input
                  id="slaResolve"
                  type="number"
                  value={slaResolveHours}
                  onChange={(e) => setSlaResolveHours(e.target.value)}
                  placeholder="Ex: 24"
                  min="1"
                  className="border-theme-input w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Vínculo com Entidade */}
          <div className="bg-theme-card border-theme rounded-lg border p-6">
            <h2 className="text-theme mb-4 text-lg font-medium">Vínculo com Entidade (Opcional)</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="entityType"
                  className="text-theme-secondary mb-1 block text-sm font-medium"
                >
                  Tipo de Entidade
                </label>
                <select
                  id="entityType"
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  className="border-theme-input w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-purple-500"
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
                  <label
                    htmlFor="entityId"
                    className="text-theme-secondary mb-1 block text-sm font-medium"
                  >
                    ID da Entidade
                  </label>
                  <input
                    id="entityId"
                    type="text"
                    value={entityId}
                    onChange={(e) => setEntityId(e.target.value)}
                    placeholder="ID da entidade vinculada"
                    className="border-theme-input w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-4">
            <Link
              href="/tasks"
              className="border-theme-input text-theme-secondary hover:bg-theme-hover rounded-lg border px-6 py-2"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
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
