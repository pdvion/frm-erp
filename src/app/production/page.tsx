"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/formatters";
import { CompanySwitcher } from "@/components/CompanySwitcher";
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
  PLANNED: { label: "Planejada", color: "bg-gray-100 text-gray-600", icon: <Clock className="w-4 h-4" /> },
  RELEASED: { label: "Liberada", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-4 h-4" /> },
  IN_PROGRESS: { label: "Em Produção", color: "bg-purple-100 text-purple-800", icon: <Play className="w-4 h-4" /> },
  COMPLETED: { label: "Concluída", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-500", icon: <XCircle className="w-4 h-4" /> },
};

const priorityConfig: Record<number, { label: string; color: string }> = {
  1: { label: "Urgente", color: "text-red-600" },
  2: { label: "Alta", color: "text-orange-600" },
  3: { label: "Normal", color: "text-gray-600" },
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Factory className="w-6 h-6 text-indigo-600" />
                <h1 className="text-xl font-semibold text-gray-900">Ordens de Produção</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CompanySwitcher />
              <Link
                href="/production/new"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Nova OP
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Access Menu */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Link
            href="/production/mrp"
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">MRP</div>
              <div className="text-xs text-gray-500">Planejamento</div>
            </div>
          </Link>
          <Link
            href="/production/mes"
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <Cpu className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">MES</div>
              <div className="text-xs text-gray-500">Chão de Fábrica</div>
            </div>
          </Link>
          <Link
            href="/production/oee"
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">OEE</div>
              <div className="text-xs text-gray-500">Indicadores</div>
            </div>
          </Link>
          <Link
            href="/production/work-centers"
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-sm transition-all"
          >
            <div className="p-2 bg-gray-100 rounded-lg">
              <Settings className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Centros</div>
              <div className="text-xs text-gray-500">Configuração</div>
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
                <div key={s.status} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`p-1 rounded ${config.color}`}>{config.icon}</span>
                    <span className="text-sm font-medium text-gray-600">{config.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{s.count}</div>
                  {s.status === "IN_PROGRESS" && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progresso</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
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
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por produto, pedido ou cliente..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Todos os Status</option>
              <option value="PLANNED">Planejadas</option>
              <option value="RELEASED">Liberadas</option>
              <option value="IN_PROGRESS">Em Produção</option>
              <option value="COMPLETED">Concluídas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : !data?.orders.length ? (
            <div className="text-center py-12">
              <Factory className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma OP encontrada</h3>
              <p className="text-gray-500 mb-4">
                {search || statusFilter !== "ALL"
                  ? "Tente ajustar os filtros"
                  : "Crie uma nova ordem de produção"}
              </p>
              <Link
                href="/production/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Nova OP
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        OP
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Produto
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Quantidade
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Progresso
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Entrega
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Prioridade
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.orders.map((order) => {
                      const statusCfg = statusConfig[order.status];
                      const priorityCfg = priorityConfig[order.priority];
                      const progress = order.quantity > 0 
                        ? Math.round((order.producedQty / order.quantity) * 100) 
                        : 0;
                      const late = isLate(order.dueDate, order.status);

                      return (
                        <tr key={order.id} className={`hover:bg-gray-50 ${late ? "bg-red-50" : ""}`}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">#{order.code}</div>
                            {order.salesOrderNumber && (
                              <div className="text-xs text-gray-500">PV: {order.salesOrderNumber}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{order.product.description}</div>
                            <div className="text-xs text-gray-500">Cód: {order.product.code}</div>
                            {order.customerName && (
                              <div className="text-xs text-gray-500">{order.customerName}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-medium text-gray-900">{order.quantity}</span>
                            <span className="text-gray-500 text-sm ml-1">{order.product.unit}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    progress >= 100 ? "bg-green-500" : "bg-indigo-500"
                                  }`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 w-12 text-right">{progress}%</span>
                            </div>
                            <div className="text-xs text-gray-500 text-center mt-1">
                              {order.producedQty} / {order.quantity}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={late ? "text-red-600 font-medium" : "text-gray-600"}>
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
                            <Link
                              href={`/production/${order.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1 text-indigo-600 hover:text-indigo-800"
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
              </div>

              {/* Pagination */}
              {data.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Mostrando {(page - 1) * 20 + 1} a {Math.min(page * 20, data.total)} de {data.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-700">
                      Página {page} de {data.pages}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pages}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
