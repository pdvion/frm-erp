"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  Package,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Plus,
  ClipboardList,
  User,
  Box,
} from "lucide-react";
import { Badge, colorToVariant } from "@/components/ui/Badge";

type StatusBadgeProps = {
  status: string;
};

function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    PENDING: { color: "bg-theme-tertiary text-theme", label: "Pendente", icon: <Clock className="h-3 w-3" /> },
    IN_PROGRESS: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", label: "Em Separação", icon: <Play className="h-3 w-3" /> },
    COMPLETED: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", label: "Concluído", icon: <CheckCircle className="h-3 w-3" /> },
    CANCELLED: { color: "bg-theme-tertiary text-theme", label: "Cancelado", icon: <XCircle className="h-3 w-3" /> },
  };

  const { color, label, icon } = config[status] || config.PENDING;

  return (
    <Badge variant={colorToVariant(color)}>
      {icon}
      {label}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { color: string; label: string }> = {
    LOW: { color: "bg-theme-tertiary text-theme-secondary", label: "Baixa" },
    NORMAL: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "Normal" },
    HIGH: { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", label: "Alta" },
    URGENT: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Urgente" },
  };

  const { color, label } = config[priority] || config.NORMAL;

  return (
    <Badge variant={colorToVariant(color)}>
      {label}
    </Badge>
  );
}

function TypeBadge({ type }: { type: string }) {
  const config: Record<string, { color: string; label: string }> = {
    REQUISITION: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", label: "Requisição" },
    SALES_ORDER: { color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400", label: "Pedido Venda" },
    PRODUCTION_ORDER: { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", label: "Ordem Produção" },
    TRANSFER: { color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", label: "Transferência" },
  };

  const { color, label } = config[type] || config.REQUISITION;

  return (
    <Badge variant={colorToVariant(color)}>
      {label}
    </Badge>
  );
}

export default function PickingDashboardPage() {
  const { data: dashboard, isLoading } = trpc.picking.getDashboard.useQuery(undefined, {
    refetchInterval: 30000,
  });

  // Lista de picking para uso futuro
  trpc.picking.list.useQuery(
    { limit: 10 },
    { enabled: !isLoading }
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const status = dashboard?.status || { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 };
  const priority = dashboard?.priority || { LOW: 0, NORMAL: 0, HIGH: 0, URGENT: 0 };
  const myPendingLists = dashboard?.myPendingLists || [];
  const recentLists = dashboard?.recentLists || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Picking - Lista de Separação"
        icon={<Package className="h-6 w-6 text-emerald-600" />}
        module="INVENTORY"
      >
        <Link
          href="/picking/list"
          className="flex items-center gap-2 rounded-lg border border-theme-input bg-theme-card px-4 py-2 text-theme-secondary hover:bg-theme-hover"
        >
          <ClipboardList className="h-4 w-4" />
          Ver Todas
        </Link>
        <Link
          href="/picking/new"
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Nova Lista
        </Link>
      </PageHeader>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Cards de Resumo */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-theme bg-theme-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-theme-tertiary p-3">
                  <Clock className="h-6 w-6 text-theme-secondary" />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Pendentes</p>
                  <p className="text-2xl font-bold text-theme">{status.PENDING}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-theme bg-theme-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-3">
                  <Play className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Em Separação</p>
                  <p className="text-2xl font-bold text-theme">{status.IN_PROGRESS}</p>
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
                  <p className="text-2xl font-bold text-theme">{status.COMPLETED}</p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg border p-6 shadow-sm ${priority.URGENT > 0 ? "border-red-200 bg-red-50" : "border-theme bg-theme-card"}`}>
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-3 ${priority.URGENT > 0 ? "bg-red-100" : "bg-orange-100"}`}>
                  <AlertTriangle className={`h-6 w-6 ${priority.URGENT > 0 ? "text-red-600" : "text-orange-600"}`} />
                </div>
                <div>
                  <p className="text-sm text-theme-muted">Urgentes</p>
                  <p className="text-2xl font-bold text-theme">{priority.URGENT + priority.HIGH}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Minhas Listas Pendentes */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-theme">Minhas Listas Pendentes</h2>
              </div>
              <div className="space-y-3">
                {myPendingLists.map((list) => (
                  <Link
                    key={list.id}
                    href={`/picking/${list.id}`}
                    className={`block rounded-lg border p-4 transition-shadow hover:shadow-md ${
                      list.priority === "URGENT" ? "border-red-200 bg-red-50" :
                        list.priority === "HIGH" ? "border-orange-200 bg-orange-50" :
                          "border-theme bg-theme-card"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-theme">{list.code}</p>
                          <PriorityBadge priority={list.priority} />
                          <StatusBadge status={list.status} />
                        </div>
                        <p className="mt-1 text-sm text-theme-muted">
                          {list._count.items} itens para separar
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-theme-muted" />
                    </div>
                  </Link>
                ))}
                {myPendingLists.length === 0 && (
                  <div className="rounded-lg border border-dashed border-theme bg-theme-tertiary p-8 text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                    <p className="mt-2 text-sm text-theme-muted">Nenhuma lista pendente para você</p>
                  </div>
                )}
              </div>
            </section>

            {/* Prioridades */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-theme">Por Prioridade</h2>
              </div>
              <div className="rounded-lg border border-theme bg-theme-card p-6 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span className="text-sm text-theme-secondary">Urgente</span>
                    </div>
                    <span className="text-lg font-semibold text-theme">{priority.URGENT}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-orange-500" />
                      <span className="text-sm text-theme-secondary">Alta</span>
                    </div>
                    <span className="text-lg font-semibold text-theme">{priority.HIGH}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span className="text-sm text-theme-secondary">Normal</span>
                    </div>
                    <span className="text-lg font-semibold text-theme">{priority.NORMAL}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-theme-tertiary" />
                      <span className="text-sm text-theme-secondary">Baixa</span>
                    </div>
                    <span className="text-lg font-semibold text-theme">{priority.LOW}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Listas Recentes */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-theme">Listas Recentes</h2>
              <Link href="/picking/list" className="text-sm text-emerald-600 hover:text-emerald-800">
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
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-muted">
                      Itens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-muted">
                      Responsável
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-muted">
                      Prioridade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-theme-muted">
                      Status
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table bg-theme-card">
                  {recentLists.map((list) => (
                    <tr key={list.id} className="hover:bg-theme-hover">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-theme">
                        {list.code}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <TypeBadge type={list.type} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-theme-muted">
                        <div className="flex items-center gap-1">
                          <Box className="h-4 w-4" />
                          {list._count.items}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-theme-muted">
                        {list.assignee ? (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {list.assignee.name}
                          </div>
                        ) : (
                          <span className="text-theme-muted">Não atribuído</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <PriorityBadge priority={list.priority} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <StatusBadge status={list.status} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <Link
                          href={`/picking/${list.id}`}
                          className="text-emerald-600 hover:text-emerald-900"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {recentLists.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-theme-muted">
                        Nenhuma lista de separação encontrada
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
