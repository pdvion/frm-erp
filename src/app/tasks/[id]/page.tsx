"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDateTime } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Play,
  User,
  History,
  Send,
  X,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  ACCEPTED: { label: "Aceita", color: "bg-blue-100 text-blue-800", icon: <User className="w-4 h-4" /> },
  IN_PROGRESS: { label: "Em Andamento", color: "bg-purple-100 text-purple-800", icon: <Play className="w-4 h-4" /> },
  ON_HOLD: { label: "Em Espera", color: "bg-orange-100 text-orange-800", icon: <AlertTriangle className="w-4 h-4" /> },
  COMPLETED: { label: "Concluída", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelada", color: "bg-theme-tertiary text-theme-muted", icon: <XCircle className="w-4 h-4" /> },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  URGENT: { label: "Urgente", color: "text-red-600 bg-red-50 border-red-200" },
  HIGH: { label: "Alta", color: "text-orange-600 bg-orange-50 border-orange-200" },
  NORMAL: { label: "Normal", color: "text-theme-secondary bg-theme-tertiary border-theme" },
  LOW: { label: "Baixa", color: "text-blue-600 bg-blue-50 border-blue-200" },
};

const actionConfig: Record<string, { label: string; color: string }> = {
  created: { label: "Criada", color: "text-theme-secondary" },
  accepted: { label: "Aceita", color: "text-blue-600" },
  started: { label: "Iniciada", color: "text-purple-600" },
  delegated: { label: "Delegada", color: "text-orange-600" },
  completed: { label: "Concluída", color: "text-green-600" },
  cancelled: { label: "Cancelada", color: "text-red-600" },
  comment: { label: "Comentário", color: "text-theme-secondary" },
};

export default function TaskDetailPage() {
  const params = useParams();
  useRouter(); // Keep for potential future navigation
  const taskId = params.id as string;

  const [comment, setComment] = useState("");
  const [resolution, setResolution] = useState("");
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const utils = trpc.useUtils();

  const { data: task, isLoading } = trpc.tasks.getById.useQuery({ id: taskId });

  const acceptMutation = trpc.tasks.accept.useMutation({
    onSuccess: () => utils.tasks.getById.invalidate({ id: taskId }),
  });

  const startMutation = trpc.tasks.start.useMutation({
    onSuccess: () => utils.tasks.getById.invalidate({ id: taskId }),
  });

  const completeMutation = trpc.tasks.complete.useMutation({
    onSuccess: () => {
      utils.tasks.getById.invalidate({ id: taskId });
      setShowCompleteModal(false);
    },
  });

  const cancelMutation = trpc.tasks.cancel.useMutation({
    onSuccess: () => utils.tasks.getById.invalidate({ id: taskId }),
  });

  const addCommentMutation = trpc.tasks.addComment.useMutation({
    onSuccess: () => {
      utils.tasks.getById.invalidate({ id: taskId });
      setComment("");
    },
  });

  const formatDuration = (hours: number | null) => {
    if (hours === null) return "-";
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${hours.toFixed(1)} horas`;
    return `${(hours / 24).toFixed(1)} dias`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <div className="text-center">
          <ClipboardList className="w-12 h-12 mx-auto text-theme-muted mb-4" />
          <p className="text-theme-muted">Tarefa não encontrada</p>
          <Link href="/tasks" className="text-blue-600 hover:underline mt-2 inline-block">
            Voltar para tarefas
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];
  const canAccept = task.status === "PENDING";
  const canStart = task.status === "ACCEPTED";
  const canComplete = task.status === "IN_PROGRESS" || task.status === "ACCEPTED";
  const canCancel = task.status !== "COMPLETED" && task.status !== "CANCELLED";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Tarefa #${task.code}`}
        icon={<ClipboardList className="w-6 h-6 text-blue-600" />}
        backHref="/tasks"
        module="SETTINGS"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Info */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full border ${priority.color}`}>
                      {priority.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                      {status.icon}
                      {status.label}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-theme">{task.title}</h2>
                </div>
              </div>

              {task.description && (
                <div className="prose prose-sm max-w-none text-theme-secondary mb-6">
                  <p>{task.description}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-theme">
                {canAccept && (
                  <button
                    onClick={() => acceptMutation.mutate({ taskId })}
                    disabled={acceptMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {acceptMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    Aceitar Tarefa
                  </button>
                )}

                {canStart && (
                  <button
                    onClick={() => startMutation.mutate({ taskId })}
                    disabled={startMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {startMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Iniciar Trabalho
                  </button>
                )}

                {canComplete && (
                  <button
                    onClick={() => setShowCompleteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Concluir
                  </button>
                )}

                {canCancel && (
                  <button
                    onClick={() => {
                      if (confirm("Tem certeza que deseja cancelar esta tarefa?")) {
                        cancelMutation.mutate({ taskId });
                      }
                    }}
                    disabled={cancelMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            {/* History */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h3 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico
              </h3>

              <div className="space-y-4">
                {task.history.map((entry) => {
                  const action = actionConfig[entry.action] || { label: entry.action, color: "text-theme-secondary" };

                  return (
                    <div key={entry.id} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-theme-tertiary rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-theme-muted" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-theme">
                            {entry.user?.name || "Sistema"}
                          </span>
                          <span className={`text-sm ${action.color}`}>{action.label}</span>
                          <span className="text-sm text-theme-muted">
                            {formatDateTime(entry.createdAt)}
                          </span>
                        </div>
                        {entry.comment && (
                          <p className="text-sm text-theme-secondary mt-1">{entry.comment}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Comment */}
              <div className="mt-6 pt-4 border-t border-theme">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Adicionar comentário..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="flex-1 px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      if (comment.trim()) {
                        addCommentMutation.mutate({ taskId, comment });
                      }
                    }}
                    disabled={!comment.trim() || addCommentMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addCommentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h3 className="text-lg font-semibold text-theme mb-4">Detalhes</h3>

              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-theme-muted">Criada por</dt>
                  <dd className="text-sm font-medium text-theme">
                    {task.createdBy?.name || "-"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-theme-muted">Criada em</dt>
                  <dd className="text-sm font-medium text-theme">
                    {formatDateTime(task.createdAt)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-theme-muted">Proprietário</dt>
                  <dd className="text-sm font-medium text-theme">
                    {task.owner?.name || "Não atribuída"}
                  </dd>
                </div>

                {task.acceptedAt && (
                  <div>
                    <dt className="text-sm text-theme-muted">Aceita em</dt>
                    <dd className="text-sm font-medium text-theme">
                      {formatDateTime(task.acceptedAt)}
                    </dd>
                  </div>
                )}

                {task.deadline && (
                  <div>
                    <dt className="text-sm text-theme-muted">Prazo</dt>
                    <dd className={`text-sm font-medium ${
                      new Date(task.deadline) < new Date() ? "text-red-600" : "text-theme"
                    }`}>
                      {formatDateTime(task.deadline)}
                    </dd>
                  </div>
                )}

                {task.completedAt && (
                  <div>
                    <dt className="text-sm text-theme-muted">Concluída em</dt>
                    <dd className="text-sm font-medium text-green-600">
                      {formatDateTime(task.completedAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* SLA Metrics */}
            {task.slaMetrics && (
              <div className="bg-theme-card rounded-lg border border-theme p-6">
                <h3 className="text-lg font-semibold text-theme mb-4">Métricas SLA</h3>

                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm text-theme-muted">Tempo para Aceitar</dt>
                    <dd className="flex items-center gap-2">
                      <span className="text-sm font-medium text-theme">
                        {formatDuration(task.slaMetrics.timeToAcceptHours)}
                      </span>
                      {task.slaMetrics.slaAcceptMet !== null && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          task.slaMetrics.slaAcceptMet
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {task.slaMetrics.slaAcceptMet ? "Dentro do SLA" : "Fora do SLA"}
                        </span>
                      )}
                    </dd>
                    <dd className="text-xs text-theme-muted">
                      Meta: {task.slaMetrics.slaAcceptHours}h
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-theme-muted">Tempo para Resolver</dt>
                    <dd className="flex items-center gap-2">
                      <span className="text-sm font-medium text-theme">
                        {formatDuration(task.slaMetrics.timeToCompleteHours)}
                      </span>
                      {task.slaMetrics.slaResolveMet !== null && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          task.slaMetrics.slaResolveMet
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {task.slaMetrics.slaResolveMet ? "Dentro do SLA" : "Fora do SLA"}
                        </span>
                      )}
                    </dd>
                    <dd className="text-xs text-theme-muted">
                      Meta: {task.slaMetrics.slaResolveHours}h
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Complete Modal */}
      {showCompleteModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="complete-task-title"
          onKeyDown={(e) => e.key === "Escape" && setShowCompleteModal(false)}
        >
          <div className="bg-theme-card rounded-lg p-6 w-full max-w-md">
            <h3 id="complete-task-title" className="text-lg font-semibold text-theme mb-4">Concluir Tarefa</h3>
            <textarea
              placeholder="Descreva a resolução (opcional)..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2 text-theme-secondary hover:bg-theme-hover rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => completeMutation.mutate({ taskId, resolution })}
                disabled={completeMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {completeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Concluir"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
