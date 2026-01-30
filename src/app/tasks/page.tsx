"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  ClipboardList,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Plus,
  Eye,
  Play,
  User,
  Building2,
  Users,
  Shield,
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
  URGENT: { label: "Urgente", color: "text-red-600 bg-red-50" },
  HIGH: { label: "Alta", color: "text-orange-600 bg-orange-50" },
  NORMAL: { label: "Normal", color: "text-theme-secondary bg-theme-tertiary" },
  LOW: { label: "Baixa", color: "text-blue-600 bg-blue-50" },
};

const targetTypeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  user: { label: "Usuário", icon: <User className="w-4 h-4" /> },
  department: { label: "Departamento", icon: <Building2 className="w-4 h-4" /> },
  group: { label: "Grupo", icon: <Users className="w-4 h-4" /> },
  permission: { label: "Permissão", icon: <Shield className="w-4 h-4" /> },
};

export default function TasksPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"all" | "my" | "available">("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.tasks.list.useQuery({
    search: search || undefined,
    status: statusFilter as "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED" | "ALL",
    priority: priorityFilter ? (priorityFilter as "URGENT" | "HIGH" | "NORMAL" | "LOW") : undefined,
    myTasks: viewMode === "my",
    availableTasks: viewMode === "available",
    page,
    limit: 20,
  }, {
    refetchOnMount: true, // VIO-774: Garantir dados atualizados
  });

  const { data: stats } = trpc.tasks.stats.useQuery(undefined, {
    refetchOnMount: true, // VIO-774: Garantir dados atualizados
  });

  const isOverdue = (deadline: Date | string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Tarefas" 
        icon={<ClipboardList className="w-6 h-6 text-blue-600" />}
        module="SETTINGS"
      >
        <Link href="/tasks/new">
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Nova Tarefa
          </Button>
        </Link>
      </PageHeader>

      <div>
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-yellow-600 mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Pendentes</span>
              </div>
              <div className="text-2xl font-bold text-theme">
                {stats.byStatus.find(s => s.status === "PENDING")?.count || 0}
              </div>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Play className="w-5 h-5" />
                <span className="text-sm font-medium">Em Andamento</span>
              </div>
              <div className="text-2xl font-bold text-theme">
                {stats.byStatus.find(s => s.status === "IN_PROGRESS")?.count || 0}
              </div>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-medium">Atrasadas</span>
              </div>
              <div className="text-2xl font-bold text-theme">{stats.overdue}</div>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">Minhas Pendentes</span>
              </div>
              <div className="text-2xl font-bold text-theme">{stats.myPending}</div>
            </div>
          </div>
        )}

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === "all"
                ? "bg-blue-600 text-white"
                : "bg-theme-card text-theme-secondary hover:bg-theme-hover border border-theme"
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setViewMode("my")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === "my"
                ? "bg-blue-600 text-white"
                : "bg-theme-card text-theme-secondary hover:bg-theme-hover border border-theme"
            }`}
          >
            Minhas Tarefas
          </button>
          <button
            onClick={() => setViewMode("available")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === "available"
                ? "bg-blue-600 text-white"
                : "bg-theme-card text-theme-secondary hover:bg-theme-hover border border-theme"
            }`}
          >
            Disponíveis para Aceitar
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
            <input
              type="text"
              placeholder="Buscar tarefas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos os Status</option>
              <option value="PENDING">Pendente</option>
              <option value="ACCEPTED">Aceita</option>
              <option value="IN_PROGRESS">Em Andamento</option>
              <option value="ON_HOLD">Em Espera</option>
              <option value="COMPLETED">Concluída</option>
              <option value="CANCELLED">Cancelada</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as Prioridades</option>
              <option value="URGENT">Urgente</option>
              <option value="HIGH">Alta</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Baixa</option>
            </select>
          </div>
        </div>

        {/* Tasks List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : !data?.tasks.length ? (
          <div className="text-center py-12 bg-theme-card rounded-lg border border-theme">
            <ClipboardList className="w-12 h-12 mx-auto text-theme-muted mb-4" />
            <p className="text-theme-muted">Nenhuma tarefa encontrada</p>
          </div>
        ) : (
          <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
            <table className="min-w-full divide-y divide-theme-table">
              <thead className="bg-theme-tertiary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                    Tarefa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                    Destino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                    Proprietário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                    Prazo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-table">
                {data.tasks.map((task) => {
                  const status = statusConfig[task.status];
                  const priority = priorityConfig[task.priority];
                  const targetType = targetTypeConfig[task.targetType];

                  return (
                    <tr key={task.id} className="hover:bg-theme-hover">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${priority.color}`}>
                                {priority.label}
                              </span>
                              <span className="font-medium text-theme">{task.title}</span>
                            </div>
                            {task.description && (
                              <p className="text-sm text-theme-muted mt-1 line-clamp-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-theme-secondary">
                          {targetType.icon}
                          <span>
                            {task.targetUser?.name ||
                              task.targetDepartment?.name ||
                              task.targetGroup?.name ||
                              task.targetPermission ||
                              "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {task.owner ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-sm text-theme">{task.owner.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-theme-muted">Não atribuída</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {task.deadline ? (
                          <span
                            className={`text-sm ${
                              isOverdue(task.deadline) ? "text-red-600 font-medium" : "text-theme-secondary"
                            }`}
                          >
                            {formatDate(task.deadline)}
                            {isOverdue(task.deadline) && " (Atrasada)"}
                          </span>
                        ) : (
                          <span className="text-sm text-theme-muted">Sem prazo</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                        >
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-theme">
                <div className="text-sm text-theme-muted">
                  Página {data.page} de {data.pages} ({data.total} tarefas)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 border border-theme-input rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-theme-hover"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.pages}
                    className="p-2 border border-theme-input rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-theme-hover"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
