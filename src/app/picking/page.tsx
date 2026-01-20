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

type StatusBadgeProps = {
  status: string;
};

function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    PENDING: { color: "bg-gray-100 text-gray-800", label: "Pendente", icon: <Clock className="h-3 w-3" /> },
    IN_PROGRESS: { color: "bg-blue-100 text-blue-800", label: "Em Separação", icon: <Play className="h-3 w-3" /> },
    COMPLETED: { color: "bg-green-100 text-green-800", label: "Concluído", icon: <CheckCircle className="h-3 w-3" /> },
    CANCELLED: { color: "bg-gray-100 text-gray-800", label: "Cancelado", icon: <XCircle className="h-3 w-3" /> },
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
    LOW: { color: "bg-gray-100 text-gray-600", label: "Baixa" },
    NORMAL: { color: "bg-blue-100 text-blue-700", label: "Normal" },
    HIGH: { color: "bg-orange-100 text-orange-700", label: "Alta" },
    URGENT: { color: "bg-red-100 text-red-700", label: "Urgente" },
  };

  const { color, label } = config[priority] || config.NORMAL;

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const config: Record<string, { color: string; label: string }> = {
    REQUISITION: { color: "bg-purple-100 text-purple-700", label: "Requisição" },
    SALES_ORDER: { color: "bg-cyan-100 text-cyan-700", label: "Pedido Venda" },
    PRODUCTION_ORDER: { color: "bg-orange-100 text-orange-700", label: "Ordem Produção" },
    TRANSFER: { color: "bg-indigo-100 text-indigo-700", label: "Transferência" },
  };

  const { color, label } = config[type] || config.REQUISITION;

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${color}`}>
      {label}
    </span>
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
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const status = dashboard?.status || { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 };
  const priority = dashboard?.priority || { LOW: 0, NORMAL: 0, HIGH: 0, URGENT: 0 };
  const myPendingLists = dashboard?.myPendingLists || [];
  const recentLists = dashboard?.recentLists || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Picking - Lista de Separação"
        icon={<Package className="h-6 w-6 text-emerald-600" />}
        module="INVENTORY"
      >
        <Link
          href="/picking/list"
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
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
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-100 p-3">
                  <Clock className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">{status.PENDING}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-3">
                  <Play className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Em Separação</p>
                  <p className="text-2xl font-bold text-gray-900">{status.IN_PROGRESS}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Concluídos</p>
                  <p className="text-2xl font-bold text-gray-900">{status.COMPLETED}</p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg border p-6 shadow-sm ${priority.URGENT > 0 ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"}`}>
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-3 ${priority.URGENT > 0 ? "bg-red-100" : "bg-orange-100"}`}>
                  <AlertTriangle className={`h-6 w-6 ${priority.URGENT > 0 ? "text-red-600" : "text-orange-600"}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Urgentes</p>
                  <p className="text-2xl font-bold text-gray-900">{priority.URGENT + priority.HIGH}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Minhas Listas Pendentes */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Minhas Listas Pendentes</h2>
              </div>
              <div className="space-y-3">
                {myPendingLists.map((list) => (
                  <Link
                    key={list.id}
                    href={`/picking/${list.id}`}
                    className={`block rounded-lg border p-4 transition-shadow hover:shadow-md ${
                      list.priority === "URGENT" ? "border-red-200 bg-red-50" :
                      list.priority === "HIGH" ? "border-orange-200 bg-orange-50" :
                      "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{list.code}</p>
                          <PriorityBadge priority={list.priority} />
                          <StatusBadge status={list.status} />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {list._count.items} itens para separar
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </Link>
                ))}
                {myPendingLists.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                    <p className="mt-2 text-sm text-gray-500">Nenhuma lista pendente para você</p>
                  </div>
                )}
              </div>
            </section>

            {/* Prioridades */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Por Prioridade</h2>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span className="text-sm text-gray-700">Urgente</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{priority.URGENT}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-orange-500" />
                      <span className="text-sm text-gray-700">Alta</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{priority.HIGH}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span className="text-sm text-gray-700">Normal</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{priority.NORMAL}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-gray-400" />
                      <span className="text-sm text-gray-700">Baixa</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{priority.LOW}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Listas Recentes */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Listas Recentes</h2>
              <Link href="/picking/list" className="text-sm text-emerald-600 hover:text-emerald-800">
                Ver todas →
              </Link>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Itens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Responsável
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Prioridade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {recentLists.map((list) => (
                    <tr key={list.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {list.code}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <TypeBadge type={list.type} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Box className="h-4 w-4" />
                          {list._count.items}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {list.assignee ? (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {list.assignee.name}
                          </div>
                        ) : (
                          <span className="text-gray-400">Não atribuído</span>
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
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
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
