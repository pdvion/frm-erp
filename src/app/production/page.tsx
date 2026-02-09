"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { LinkButton } from "@/components/ui/LinkButton";
import { formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Factory,
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
  Calendar,
  Settings,
  BarChart3,
  Cpu,
  Calculator,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PLANNED: { label: "Planejada", color: "bg-theme-tertiary text-theme-secondary", icon: <Clock className="w-4 h-4" /> },
  RELEASED: { label: "Liberada", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: <CheckCircle className="w-4 h-4" /> },
  IN_PROGRESS: { label: "Em Produção", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: <Play className="w-4 h-4" /> },
  COMPLETED: { label: "Concluída", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-500", icon: <XCircle className="w-4 h-4" /> },
};

const priorityConfig: Record<number, { label: string; color: string }> = {
  1: { label: "Urgente", color: "text-red-600" },
  2: { label: "Alta", color: "text-orange-600" },
  3: { label: "Normal", color: "text-theme-secondary" },
  4: { label: "Baixa", color: "text-blue-600" },
};

export default function ProductionPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.production.list.useQuery({
    search: search || undefined,
    status: statusFilter as "PLANNED" | "RELEASED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "ALL",
    page,
    limit: 20,
  });

  const { data: stats } = trpc.production.stats.useQuery();

  const isLate = (dueDate: Date | string | null, status: string) => {
    if (!dueDate || ["COMPLETED", "CANCELLED"].includes(status)) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ordens de Produção"
        subtitle="Gerencie ordens de produção"
        icon={<Factory className="w-6 h-6" />}
        module="production"
        actions={
          <Link href="/production/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>
              Nova OP
            </Button>
          </Link>
        }
      />

      <div>
        {/* Quick Access Menu */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Link
            href="/production/mrp"
            className="flex items-center gap-3 p-4 bg-theme-card rounded-lg border border-theme hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-theme">MRP</div>
              <div className="text-xs text-theme-muted">Planejamento</div>
            </div>
          </Link>
          <Link
            href="/production/mes"
            className="flex items-center gap-3 p-4 bg-theme-card rounded-lg border border-theme hover:border-green-300 hover:shadow-sm transition-all"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <Cpu className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-theme">MES</div>
              <div className="text-xs text-theme-muted">Chão de Fábrica</div>
            </div>
          </Link>
          <Link
            href="/production/oee"
            className="flex items-center gap-3 p-4 bg-theme-card rounded-lg border border-theme hover:border-purple-300 hover:shadow-sm transition-all"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-theme">OEE</div>
              <div className="text-xs text-theme-muted">Indicadores</div>
            </div>
          </Link>
          <Link
            href="/production/work-centers"
            className="flex items-center gap-3 p-4 bg-theme-card rounded-lg border border-theme hover:border-theme hover:shadow-sm transition-all"
          >
            <div className="p-2 bg-theme-tertiary rounded-lg">
              <Settings className="w-5 h-5 text-theme-secondary" />
            </div>
            <div>
              <div className="font-medium text-theme">Centros</div>
              <div className="text-xs text-theme-muted">Configuração</div>
            </div>
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.byStatus.filter(s => s.count > 0).map((s) => {
              const config = statusConfig[s.status];
              const progress = s.totalQty > 0 ? Math.round((s.producedQty / s.totalQty) * 100) : 0;
              return (
                <div key={s.status} className="bg-theme-card rounded-lg border border-theme p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`p-1 rounded ${config.color}`}>{config.icon}</span>
                    <span className="text-sm font-medium text-theme-secondary">{config.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-theme">{s.count}</div>
                  {s.status === "IN_PROGRESS" && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-theme-muted mb-1">
                        <span>Progresso</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-theme-tertiary rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {stats.urgentCount > 0 && (
              <div className="bg-red-50 rounded-lg border border-red-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-700">Urgentes</span>
                </div>
                <div className="text-2xl font-bold text-red-700">{stats.urgentCount}</div>
              </div>
            )}

            {stats.lateCount > 0 && (
              <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">Atrasadas</span>
                </div>
                <div className="text-2xl font-bold text-orange-700">{stats.lateCount}</div>
              </div>
            )}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-muted w-5 h-5 z-10" />
              <Input
                placeholder="Buscar por produto, pedido ou cliente..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>

            <Select
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              options={[
                { value: "ALL", label: "Todos os Status" },
                { value: "PLANNED", label: "Planejadas" },
                { value: "RELEASED", label: "Liberadas" },
                { value: "IN_PROGRESS", label: "Em Produção" },
                { value: "COMPLETED", label: "Concluídas" },
                { value: "CANCELLED", label: "Canceladas" },
              ]}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : !data?.orders.length ? (
            <div className="text-center py-12">
              <Factory className="w-12 h-12 text-theme-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-theme mb-2">Nenhuma OP encontrada</h3>
              <p className="text-theme-muted mb-4">
                {search || statusFilter !== "ALL"
                  ? "Tente ajustar os filtros"
                  : "Crie uma nova ordem de produção"}
              </p>
              <Link href="/production/new">
                <Button leftIcon={<Plus className="w-4 h-4" />}>
                  Nova OP
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        OP
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Produto
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Quantidade
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Progresso
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Entrega
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Prioridade
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {data.orders.map((order) => {
                      const statusCfg = statusConfig[order.status];
                      const priorityCfg = priorityConfig[order.priority];
                      const progress = order.quantity > 0 
                        ? Math.round((order.producedQty / order.quantity) * 100) 
                        : 0;
                      const late = isLate(order.dueDate, order.status);

                      return (
                        <tr key={order.id} className={`hover:bg-theme-hover ${late ? "bg-red-50" : ""}`}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-theme">#{order.code}</div>
                            {order.salesOrderNumber && (
                              <div className="text-xs text-theme-muted">PV: {order.salesOrderNumber}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-theme">{order.product.description}</div>
                            <div className="text-xs text-theme-muted">Cód: {order.product.code}</div>
                            {order.customerName && (
                              <div className="text-xs text-theme-muted">{order.customerName}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-medium text-theme">{order.quantity}</span>
                            <span className="text-theme-muted text-sm ml-1">{order.product.unit}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-theme-tertiary rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    progress >= 100 ? "bg-green-500" : "bg-indigo-500"
                                  }`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm text-theme-secondary w-12 text-right">{progress}%</span>
                            </div>
                            <div className="text-xs text-theme-muted text-center mt-1">
                              {order.producedQty} / {order.quantity}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={late ? "text-red-600 font-medium" : "text-theme-secondary"}>
                              {formatDate(order.dueDate)}
                            </span>
                            {late && (
                              <div className="text-xs text-red-500">Atrasada</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-medium ${priorityCfg.color}`}>
                              {priorityCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                              {statusCfg.icon}
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <LinkButton
                              href={`/production/${order.id}`}
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
              </div>

              {/* Pagination */}
              {data.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                  <div className="text-sm text-theme-muted">
                    Mostrando {(page - 1) * 20 + 1} a {Math.min(page * 20, data.total)} de {data.total}
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
                    <span className="text-sm text-theme-secondary">
                      Página {page} de {data.pages}
                    </span>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
