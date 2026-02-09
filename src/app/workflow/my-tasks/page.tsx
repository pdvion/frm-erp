"use client";

import { Suspense } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Filter,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { NativeSelect } from "@/components/ui/NativeSelect";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    PENDING: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Pendente", icon: <Clock className="h-3 w-3" /> },
    ACCEPTED: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", label: "Aceita", icon: <Play className="h-3 w-3" /> },
    IN_PROGRESS: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", label: "Em Andamento", icon: <Play className="h-3 w-3" /> },
    COMPLETED: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", label: "Concluída", icon: <CheckCircle className="h-3 w-3" /> },
    CANCELLED: { color: "bg-theme-tertiary text-theme", label: "Cancelada", icon: <XCircle className="h-3 w-3" /> },
  };

  const { color, label, icon } = config[status] || config.PENDING;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${color}`}>
      {icon}
      {label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { color: string; label: string }> = {
    URGENT: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", label: "Urgente" },
    HIGH: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", label: "Alta" },
    NORMAL: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", label: "Normal" },
    LOW: { color: "bg-theme-tertiary text-theme", label: "Baixa" },
  };

  const { color, label } = config[priority] || config.NORMAL;

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

function MyTasksContent() {
  const { filters, setFilters } = useUrlFilters({
    defaults: { page: 1, status: undefined },
  });

  const page = (filters.page as number) || 1;
  const status = filters.status as string | undefined;

  const { data, isLoading, error } = trpc.tasks.list.useQuery({
    myTasks: true,
    status: status as "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED" | "ALL" | undefined,
    page,
    limit: 20,
  });

  const tasks = data?.tasks ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minhas Tarefas"
        icon={<ClipboardList className="w-6 h-6" />}
        module="REPORTS"
        breadcrumbs={[
          { label: "Workflow", href: "/workflow" },
          { label: "Minhas Tarefas" },
        ]}
        actions={
          <Link
            href="/workflow"
            className="flex items-center gap-2 px-4 py-2 border border-theme rounded-lg hover:bg-theme-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        }
      />

      {/* Filters */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-theme-muted" />
          <NativeSelect
            value={status ?? ""}
            onChange={(e) => {
              setFilters({ status: e.target.value || undefined, page: 1 });
            }}
            className="px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
          >
            <option value="">Todos os status</option>
            <option value="PENDING">Pendente</option>
            <option value="ACCEPTED">Aceita</option>
            <option value="IN_PROGRESS">Em Andamento</option>
            <option value="COMPLETED">Concluída</option>
            <option value="CANCELLED">Cancelada</option>
          </NativeSelect>
        </div>
      </div>

      {/* List */}
      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-theme-muted">Carregando...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">Erro: {error.message}</div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-theme-muted">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma tarefa encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-theme">
            {tasks.map((task) => (
              <div key={task.id} className="p-4 hover:bg-theme-secondary/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-theme">{task.title}</h3>
                      <PriorityBadge priority={task.priority || "MEDIUM"} />
                    </div>
                    {task.description && (
                      <p className="text-sm text-theme-muted line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-theme-muted">
                      <span>#{task.code}</span>
                      {task.deadline && (
                        <span>Prazo: {new Date(task.deadline).toLocaleDateString("pt-BR")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={task.status || "PENDING"} />
                    <Link
                      href={`/workflow/tasks/${task.id}`}
                      className="p-2 text-violet-600 hover:bg-violet-100 rounded-lg"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyTasksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
      <MyTasksContent />
    </Suspense>
  );
}
