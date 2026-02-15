"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Target, Plus, Clock, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/formatters";

type ActionStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | undefined;
type ActionType = "CORRECTIVE" | "PREVENTIVE" | "IMPROVEMENT" | undefined;

export default function GPDActionsPage() {
  const [statusFilter, setStatusFilter] = useState<ActionStatus>(undefined);
  const [typeFilter, setTypeFilter] = useState<ActionType>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [newAction, setNewAction] = useState({
    title: "",
    description: "",
    type: "IMPROVEMENT" as "CORRECTIVE" | "PREVENTIVE" | "IMPROVEMENT",
    priority: 3,
    dueDate: "",
  });

  const { data: actions, isLoading, refetch } = trpc.gpd.listActionPlans.useQuery({
    status: statusFilter,
    type: typeFilter,
  });

  const createMutation = trpc.gpd.createActionPlan.useMutation({
    onSuccess: () => {
      refetch();
      setShowModal(false);
      setNewAction({ title: "", description: "", type: "IMPROVEMENT", priority: 3, dueDate: "" });
    },
  });

  const updateMutation = trpc.gpd.updateActionPlan.useMutation({
    onSuccess: () => refetch(),
  });

  const statusColors: Record<string, string> = {
    PENDING: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30",
    IN_PROGRESS: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    COMPLETED: "text-green-600 bg-green-100 dark:bg-green-900/30",
    CANCELLED: "text-theme-secondary bg-theme-tertiary dark:bg-theme/30",
  };

  const statusLabels: Record<string, string> = {
    PENDING: "Pendente",
    IN_PROGRESS: "Em Andamento",
    COMPLETED: "Concluída",
    CANCELLED: "Cancelada",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="w-4 h-4" />,
    IN_PROGRESS: <AlertTriangle className="w-4 h-4" />,
    COMPLETED: <CheckCircle2 className="w-4 h-4" />,
    CANCELLED: <XCircle className="w-4 h-4" />,
  };

  const typeLabels: Record<string, string> = {
    CORRECTIVE: "Corretiva",
    PREVENTIVE: "Preventiva",
    IMPROVEMENT: "Melhoria",
  };

  const priorityLabels = ["", "Urgente", "Alta", "Normal", "Baixa"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ações GPD"
        icon={<Target className="w-6 h-6" />}
        module="GPD"
        breadcrumbs={[
          { label: "GPD", href: "/gpd" },
          { label: "Ações" },
        ]}
        actions={
          <Button onClick={() => setShowModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Nova Ação
          </Button>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          <Button
            variant={!statusFilter ? "primary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(undefined)}
          >
            Todos
          </Button>
          {(["PENDING", "IN_PROGRESS", "COMPLETED"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "primary" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="flex items-center gap-1"
            >
              {statusIcons[status]}
              {statusLabels[status]}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          {(["CORRECTIVE", "PREVENTIVE", "IMPROVEMENT"] as const).map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? "primary" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(typeFilter === type ? undefined : type)}
            >
              {typeLabels[type]}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-theme-card border border-theme rounded-lg p-8 text-center text-theme-muted">
          Carregando...
        </div>
      ) : (
        <div className="space-y-4">
          {actions?.map((action) => (
            <div key={action.id} className="bg-theme-card border border-theme rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${statusColors[action.status]}`}>
                      {statusIcons[action.status]}
                      {statusLabels[action.status]}
                    </span>
                    <span className="px-2 py-1 rounded text-xs bg-theme-hover text-theme">
                      {typeLabels[action.type]}
                    </span>
                    <span className="px-2 py-1 rounded text-xs bg-theme-hover text-theme">
                      P{action.priority} - {priorityLabels[action.priority]}
                    </span>
                  </div>
                  <h3 className="font-semibold text-theme">{action.title}</h3>
                  {action.description && (
                    <p className="text-sm text-theme-muted mt-1">{action.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-theme-muted">
                    {action.goal && <span>Meta: {action.goal.title}</span>}
                    {action.responsible && <span>Responsável: {action.responsible.name}</span>}
                    {action.dueDate && <span>Prazo: {formatDate(action.dueDate)}</span>}
                    <span>{action._count.tasks} tarefas</span>
                  </div>
                  {(action.progress ?? 0) > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-theme-hover rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${action.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-theme-muted">{action.progress}%</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  {action.status === "PENDING" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateMutation.mutate({ id: action.id, status: "IN_PROGRESS" })}
                      className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      Iniciar
                    </Button>
                  )}
                  {action.status === "IN_PROGRESS" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateMutation.mutate({ id: action.id, status: "COMPLETED" })}
                      className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      Concluir
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {actions?.length === 0 && (
            <div className="bg-theme-card border border-theme rounded-lg p-8 text-center text-theme-muted">
              <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma ação encontrada</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de criação */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nova Ação"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Título"
            value={newAction.title}
            onChange={(e) => setNewAction({ ...newAction, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Tipo</label>
              <Select
                value={newAction.type}
                onChange={(value) => setNewAction({ ...newAction, type: value as typeof newAction.type })}
                options={[
                  { value: "CORRECTIVE", label: "Corretiva" },
                  { value: "PREVENTIVE", label: "Preventiva" },
                  { value: "IMPROVEMENT", label: "Melhoria" },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Prioridade</label>
              <Select
                value={String(newAction.priority)}
                onChange={(value) => setNewAction({ ...newAction, priority: Number(value) })}
                options={[
                  { value: "1", label: "1 - Urgente" },
                  { value: "2", label: "2 - Alta" },
                  { value: "3", label: "3 - Normal" },
                  { value: "4", label: "4 - Baixa" },
                ]}
              />
            </div>
          </div>
          <Input
            label="Prazo"
            type="date"
            value={newAction.dueDate}
            onChange={(e) => setNewAction({ ...newAction, dueDate: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Descrição</label>
            <Textarea
              value={newAction.description}
              onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
              rows={3}
            />
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate(newAction)}
              disabled={!newAction.title}
              isLoading={createMutation.isPending}
            >
              Salvar
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      <div className="flex gap-4">
        <Link href="/gpd" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Voltar para GPD
        </Link>
      </div>
    </div>
  );
}
