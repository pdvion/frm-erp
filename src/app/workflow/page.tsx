"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  GitBranch,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Plus,
  Settings,
  ClipboardList,
} from "lucide-react";

type StatusBadgeProps = {
  status: string;
};

function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    PENDING: { color: "bg-theme-tertiary text-theme", label: "Pendente", icon: <Clock className="h-3 w-3" /> },
    IN_PROGRESS: { color: "bg-blue-100 text-blue-800", label: "Em Andamento", icon: <Play className="h-3 w-3" /> },
    COMPLETED: { color: "bg-green-100 text-green-800", label: "Concluído", icon: <CheckCircle className="h-3 w-3" /> },
    CANCELLED: { color: "bg-theme-tertiary text-theme", label: "Cancelado", icon: <XCircle className="h-3 w-3" /> },
    REJECTED: { color: "bg-red-100 text-red-800", label: "Rejeitado", icon: <XCircle className="h-3 w-3" /> },
  };

  const { color, label, icon } = config[status] || config.PENDING;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${color}`}>
      {icon}
      {label}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const config: Record<string, { color: string; label: string }> = {
    PURCHASE: { color: "bg-purple-100 text-purple-800", label: "Compras" },
    PAYMENT: { color: "bg-green-100 text-green-800", label: "Pagamentos" },
    HR: { color: "bg-blue-100 text-blue-800", label: "RH" },
    PRODUCTION: { color: "bg-orange-100 text-orange-800", label: "Produção" },
    SALES: { color: "bg-cyan-100 text-cyan-800", label: "Vendas" },
    GENERAL: { color: "bg-theme-tertiary text-theme", label: "Geral" },
  };

  const { color, label } = config[category] || config.GENERAL;

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

export default function WorkflowDashboardPage() {
  const { data: dashboard, isLoading } = trpc.workflow.getDashboard.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const { data: definitions } = trpc.workflow.listDefinitions.useQuery(
    { isActive: true },
    { enabled: !isLoading }
  );

  const { data: myTasks } = trpc.workflow.getMyPendingTasks.useQuery(undefined, {
    enabled: !isLoading,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const instances = dashboard?.instances || { total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0, rejected: 0 };
  const recentInstances = dashboard?.recentInstances || [];
  const pendingTasks = myTasks || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflow & Automação"
        icon={<GitBranch className="h-6 w-6 text-violet-600" />}
        module="REPORTS"
      >
        <Link
          href="/workflow/definitions"
          className="flex items-center gap-2 rounded-lg border border-theme-input bg-theme-card px-4 py-2 text-theme-secondary hover:bg-theme-hover"
        >
          <Settings className="h-4 w-4" />
          Configurar
        </Link>
        <Link
          href="/workflow/instances"
          className="flex items-center gap-2 rounded-lg border border-theme-input bg-theme-card px-4 py-2 text-theme-secondary hover:bg-theme-hover"
        >
          <ClipboardList className="h-4 w-4" />
          Execuções
        </Link>
        <Link
          href="/workflow/new"
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-white hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          Iniciar Workflow
        </Link>
      </PageHeader>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Cards de Resumo */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg border border-theme bg-theme-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-violet-100 p-3">
                  <GitBranch className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Workflows Ativos</p>
                  <p className="text-2xl font-bold text-theme">{dashboard?.activeDefinitions || 0}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-theme bg-theme-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-3">
                  <Play className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Em Andamento</p>
                  <p className="text-2xl font-bold text-theme">{instances.inProgress}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-theme bg-theme-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Concluídos</p>
                  <p className="text-2xl font-bold text-theme">{instances.completed}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-theme bg-theme-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-100 p-3">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Rejeitados</p>
                  <p className="text-2xl font-bold text-theme">{instances.rejected}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-theme bg-theme-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-3 ${pendingTasks.length > 0 ? "bg-orange-100" : "bg-theme-tertiary"}`}>
                  <AlertTriangle className={`h-6 w-6 ${pendingTasks.length > 0 ? "text-orange-600" : "text-theme-muted"}`} />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Minhas Pendências</p>
                  <p className="text-2xl font-bold text-theme">{pendingTasks.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Minhas Tarefas Pendentes */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-theme">Minhas Tarefas Pendentes</h2>
                <Link href="/workflow/my-tasks" className="text-sm text-violet-600 hover:text-violet-800">
                  Ver todas →
                </Link>
              </div>
              <div className="space-y-3">
                {pendingTasks.slice(0, 5).map((task) => (
                  <Link
                    key={task.id}
                    href={`/workflow/instances/${task.instance.id}`}
                    className="block rounded-lg border border-orange-200 bg-orange-50 p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-orange-900">{task.step.name}</p>
                          <CategoryBadge category={task.instance.definition.category} />
                        </div>
                        <p className="mt-1 text-sm text-orange-700">
                          {task.instance.definition.name} • {task.instance.code}
                        </p>
                        {task.dueAt && (
                          <p className="mt-1 text-xs text-orange-600">
                            Prazo: {new Date(task.dueAt).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-5 w-5 text-orange-400" />
                    </div>
                  </Link>
                ))}
                {pendingTasks.length === 0 && (
                  <div className="rounded-lg border border-dashed border-theme bg-theme-tertiary p-8 text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                    <p className="mt-2 text-sm text-theme-muted">Nenhuma tarefa pendente</p>
                  </div>
                )}
              </div>
            </section>

            {/* Workflows Disponíveis */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-theme">Workflows Disponíveis</h2>
                <Link href="/workflow/definitions" className="text-sm text-violet-600 hover:text-violet-800">
                  Gerenciar →
                </Link>
              </div>
              <div className="space-y-3">
                {definitions?.slice(0, 5).map((def) => (
                  <div
                    key={def.id}
                    className="rounded-lg border border-theme bg-theme-card p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-theme">{def.name}</p>
                          <CategoryBadge category={def.category} />
                        </div>
                        <p className="mt-1 text-xs text-theme-muted">
                          {def.code} • {def._count.steps} etapas • {def._count.instances} execuções
                        </p>
                      </div>
                      <Link
                        href={`/workflow/start/${def.id}`}
                        className="rounded-lg bg-violet-100 px-3 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-200"
                      >
                        Iniciar
                      </Link>
                    </div>
                  </div>
                ))}
                {(!definitions || definitions.length === 0) && (
                  <div className="rounded-lg border border-dashed border-theme bg-theme-tertiary p-8 text-center">
                    <GitBranch className="mx-auto h-12 w-12 text-theme-muted" />
                    <p className="mt-2 text-sm text-theme-muted">Nenhum workflow configurado</p>
                    <Link
                      href="/workflow/definitions/new"
                      className="mt-4 inline-flex items-center gap-2 text-sm text-violet-600 hover:text-violet-800"
                    >
                      <Plus className="h-4 w-4" />
                      Criar workflow
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Execuções Recentes */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-theme">Execuções Recentes</h2>
              <Link href="/workflow/instances" className="text-sm text-violet-600 hover:text-violet-800">
                Ver todas →
              </Link>
            </div>
            <div className="overflow-hidden rounded-lg border border-theme bg-theme-card shadow-sm">
              <table className="min-w-full divide-y divide-theme-table">
                <thead className="bg-theme-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-muted">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-muted">
                      Workflow
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-muted">
                      Etapa Atual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-muted">
                      Iniciado por
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-muted">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-muted">
                      Data
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table bg-theme-card">
                  {recentInstances.map((instance) => (
                    <tr key={instance.id} className="hover:bg-theme-hover">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-theme">
                        {instance.code}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-theme">{instance.definition.name}</span>
                          <CategoryBadge category={instance.definition.category} />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-theme-muted">
                        {instance.currentStep?.name || "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-theme-muted">
                        {instance.starter?.name || "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <StatusBadge status={instance.status} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-theme-muted">
                        {new Date(instance.startedAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <Link
                          href={`/workflow/instances/${instance.id}`}
                          className="text-violet-600 hover:text-violet-900"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {recentInstances.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-theme-muted">
                        Nenhuma execução encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
