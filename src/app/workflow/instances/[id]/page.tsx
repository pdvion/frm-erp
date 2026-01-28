"use client";

import { use } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  GitBranch,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  User,
  Calendar,
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    PENDING: { color: "bg-yellow-100 text-yellow-800", label: "Pendente", icon: <Clock className="h-3 w-3" /> },
    IN_PROGRESS: { color: "bg-blue-100 text-blue-800", label: "Em Andamento", icon: <Play className="h-3 w-3" /> },
    COMPLETED: { color: "bg-green-100 text-green-800", label: "Concluído", icon: <CheckCircle className="h-3 w-3" /> },
    CANCELLED: { color: "bg-theme-tertiary text-theme", label: "Cancelado", icon: <XCircle className="h-3 w-3" /> },
    REJECTED: { color: "bg-red-100 text-red-800", label: "Rejeitado", icon: <XCircle className="h-3 w-3" /> },
    APPROVED: { color: "bg-green-100 text-green-800", label: "Aprovado", icon: <CheckCircle className="h-3 w-3" /> },
  };

  const { color, label, icon } = config[status] || config.PENDING;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${color}`}>
      {icon}
      {label}
    </span>
  );
}

export default function WorkflowInstanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: instance, isLoading, error } = trpc.workflow.getInstance.useQuery({ id });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !instance) {
    return (
      <div className="p-8 text-center">
        <GitBranch className="w-12 h-12 mx-auto mb-4 text-red-500 opacity-50" />
        <p className="text-red-500 mb-4">{error?.message || "Execução não encontrada"}</p>
        <Link href="/workflow/instances" className="text-violet-600 hover:underline">
          Voltar para execuções
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Execução #${instance.code}`}
        icon={<GitBranch className="w-6 h-6" />}
        module="REPORTS"
        breadcrumbs={[
          { label: "Workflow", href: "/workflow" },
          { label: "Execuções", href: "/workflow/instances" },
          { label: `#${instance.code}` },
        ]}
        actions={
          <Link
            href="/workflow/instances"
            className="flex items-center gap-2 px-4 py-2 border border-theme rounded-lg hover:bg-theme-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Steps Timeline */}
          <div className="bg-theme-card border border-theme rounded-lg p-6">
            <h2 className="text-lg font-semibold text-theme mb-4">Etapas</h2>
            <div className="space-y-4">
              {instance.stepHistory && instance.stepHistory.length > 0 ? (
                instance.stepHistory.map((task: typeof instance.stepHistory[number], index: number) => (
                  <div key={task.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        task.status === "COMPLETED"
                          ? "bg-green-100 text-green-600"
                          : task.status === "REJECTED"
                          ? "bg-red-100 text-red-600"
                          : task.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-theme-tertiary text-theme-secondary"
                      }`}>
                        {task.status === "COMPLETED" ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : task.status === "REJECTED" ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      {index < instance.stepHistory.length - 1 && (
                        <div className="w-0.5 h-full bg-theme-tertiary my-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-theme">{task.step?.name || `Etapa ${index + 1}`}</h3>
                        <StatusBadge status={task.status} />
                      </div>
                      {task.completer && (
                        <p className="text-sm text-theme-muted flex items-center gap-1 mt-1">
                          <User className="w-3 h-3" />
                          {task.completer.name}
                        </p>
                      )}
                      {task.completedAt && (
                        <p className="text-sm text-theme-muted flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.completedAt).toLocaleString("pt-BR")}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-theme-muted">Nenhuma etapa registrada</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Instance Info */}
          <div className="bg-theme-card border border-theme rounded-lg p-6">
            <h2 className="text-lg font-semibold text-theme mb-4">Informações</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-theme-muted uppercase">Workflow</p>
                <p className="text-sm text-theme">{instance.definition?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-theme-muted uppercase">Status</p>
                <StatusBadge status={instance.status} />
              </div>
              <div>
                <p className="text-xs text-theme-muted uppercase">Iniciado em</p>
                <p className="text-sm text-theme">
                  {new Date(instance.startedAt).toLocaleString("pt-BR")}
                </p>
              </div>
              {instance.completedAt && (
                <div>
                  <p className="text-xs text-theme-muted uppercase">Concluído em</p>
                  <p className="text-sm text-theme">
                    {new Date(instance.completedAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              )}
              {instance.starter && (
                <div>
                  <p className="text-xs text-theme-muted uppercase">Iniciado por</p>
                  <p className="text-sm text-theme">{instance.starter.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
