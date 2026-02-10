"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LinkButton } from "@/components/ui/LinkButton";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { KanbanBoard, KanbanCard, ViewToggle } from "@/components/ui";
import type { KanbanColumn } from "@/components/ui";
import {
  ClipboardList,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Eye,
  Play,
  User,
  Building2,
  Users,
  Shield,
  Calendar,
} from "lucide-react";
import { Badge, colorToVariant } from "@/components/ui/Badge";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: <Clock className="w-4 h-4" /> },
  ACCEPTED: { label: "Aceita", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: <User className="w-4 h-4" /> },
  IN_PROGRESS: { label: "Em Andamento", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: <Play className="w-4 h-4" /> },
  ON_HOLD: { label: "Em Espera", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: <AlertTriangle className="w-4 h-4" /> },
  COMPLETED: { label: "Concluída", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle className="w-4 h-4" /> },
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
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"all" | "my" | "available">("all");
  const [view, setView] = useState<"list" | "kanban">("list");
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

  // Kanban columns configuration
  const kanbanColumns = useMemo((): KanbanColumn<NonNullable<typeof data>["tasks"][number]>[] => {
    if (!data?.tasks) return [];
    
    const statusOrder = ["PENDING", "ACCEPTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED"];
    const statusColors: Record<string, string> = {
      PENDING: "#eab308",
      ACCEPTED: "#3b82f6",
      IN_PROGRESS: "#8b5cf6",
      ON_HOLD: "#f97316",
      COMPLETED: "#22c55e",
    };

    return statusOrder.map((status) => ({
      id: status,
      title: statusConfig[status]?.label || status,
      color: statusColors[status] || "#6b7280",
      items: data.tasks.filter((task) => task.status === status),
    }));
  }, [data]);

  const handleCardClick = (task: NonNullable<typeof data>["tasks"][number]) => {
    router.push(`/tasks/${task.id}`);
  };

  const utils = trpc.useUtils();
  const updateTaskStatus = trpc.tasks.updateStatus.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.tasks.stats.invalidate();
    },
  });

  const handleCardMove = (taskId: string, _fromColumnId: string, toColumnId: string) => {
    updateTaskStatus.mutate({
      id: taskId,
      status: toColumnId as "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED",
    });
  };

  const renderTaskCard = ({ item: task }: { item: NonNullable<typeof data>["tasks"][number]; onClick?: (item: NonNullable<typeof data>["tasks"][number]) => void }) => {
    const priority = priorityConfig[task.priority as keyof typeof priorityConfig];
    const overdue = isOverdue(task.deadline);

    const footer = (
      <div className="flex items-center justify-between text-xs text-theme-muted">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span className="truncate max-w-[80px]">
            {task.owner?.name || "Não atribuída"}
          </span>
        </div>
        {task.deadline && (
          <div className={`flex items-center gap-1 ${overdue ? "text-red-600 font-medium" : ""}`}>
            <Calendar className="w-3 h-3" />
            <span>{formatDate(task.deadline)}</span>
          </div>
        )}
      </div>
    );

    return (
      <KanbanCard
        title={task.title}
        subtitle={task.description || undefined}
        badge={{
          text: priority.label,
          color: priority.color.includes("red") ? "#dc2626" :
            priority.color.includes("orange") ? "#ea580c" :
              priority.color.includes("blue") ? "#2563eb" : "#6b7280",
        }}
        footer={footer}
        className={overdue ? "border-l-4 border-l-red-500" : ""}
      />
    );
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
          <Button
            variant={viewMode === "all" ? "primary" : "outline"}
            onClick={() => setViewMode("all")}
          >
            Todas
          </Button>
          <Button
            variant={viewMode === "my" ? "primary" : "outline"}
            onClick={() => setViewMode("my")}
          >
            Minhas Tarefas
          </Button>
          <Button
            variant={viewMode === "available" ? "primary" : "outline"}
            onClick={() => setViewMode("available")}
          >
            Disponíveis para Aceitar
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted z-10" />
            <Input
              placeholder="Buscar tarefas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { value: "ALL", label: "Todos os Status" },
                { value: "PENDING", label: "Pendente" },
                { value: "ACCEPTED", label: "Aceita" },
                { value: "IN_PROGRESS", label: "Em Andamento" },
                { value: "ON_HOLD", label: "Em Espera" },
                { value: "COMPLETED", label: "Concluída" },
                { value: "CANCELLED", label: "Cancelada" },
              ]}
            />

            <Select
              value={priorityFilter}
              onChange={(value) => setPriorityFilter(value)}
              options={[
                { value: "", label: "Todas as Prioridades" },
                { value: "URGENT", label: "Urgente" },
                { value: "HIGH", label: "Alta" },
                { value: "NORMAL", label: "Normal" },
                { value: "LOW", label: "Baixa" },
              ]}
            />
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </div>

        {/* Tasks Content */}
        {isLoading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : !data?.tasks.length ? (
          <div className="text-center py-12 bg-theme-card rounded-lg border border-theme">
            <ClipboardList className="w-12 h-12 mx-auto text-theme-muted mb-4" />
            <p className="text-theme-muted">Nenhuma tarefa encontrada</p>
          </div>
        ) : view === "kanban" ? (
          /* Kanban View */
          <KanbanBoard
            columns={kanbanColumns}
            renderCard={renderTaskCard}
            onCardClick={handleCardClick}
            onCardMove={handleCardMove}
            emptyMessage="Nenhuma tarefa encontrada"
          />
        ) : (
          /* Table View */
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
                  const status = statusConfig[task.status as keyof typeof statusConfig];
                  const priority = priorityConfig[task.priority as keyof typeof priorityConfig];
                  const targetType = targetTypeConfig[task.targetType as keyof typeof targetTypeConfig];

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
                        <Badge variant={colorToVariant(status.color)}>
                          {status.icon}
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <LinkButton
                          href={`/tasks/${task.id}`}
                          variant="ghost"
                          size="sm"
                          leftIcon={<Eye className="w-4 h-4" />}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Ver
                        </LinkButton>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.pages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
