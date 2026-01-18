"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Package,
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
  FileText,
  Wrench,
  Briefcase,
  FolderKanban,
  MoreHorizontal,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Rascunho", color: "bg-gray-100 text-gray-600", icon: <FileText className="w-4 h-4" /> },
  PENDING: { label: "Aguardando", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  APPROVED: { label: "Aprovada", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-4 h-4" /> },
  IN_SEPARATION: { label: "Em Separação", color: "bg-purple-100 text-purple-800", icon: <Play className="w-4 h-4" /> },
  PARTIAL: { label: "Parcial", color: "bg-orange-100 text-orange-800", icon: <AlertTriangle className="w-4 h-4" /> },
  COMPLETED: { label: "Concluída", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-500", icon: <XCircle className="w-4 h-4" /> },
};

const typeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  PRODUCTION: { label: "Produção", icon: <Package className="w-4 h-4" /> },
  MAINTENANCE: { label: "Manutenção", icon: <Wrench className="w-4 h-4" /> },
  ADMINISTRATIVE: { label: "Administrativo", icon: <Briefcase className="w-4 h-4" /> },
  PROJECT: { label: "Projeto", icon: <FolderKanban className="w-4 h-4" /> },
  OTHER: { label: "Outros", icon: <MoreHorizontal className="w-4 h-4" /> },
};

const priorityConfig: Record<number, { label: string; color: string }> = {
  1: { label: "Urgente", color: "text-red-600" },
  2: { label: "Alta", color: "text-orange-600" },
  3: { label: "Normal", color: "text-gray-600" },
  4: { label: "Baixa", color: "text-blue-600" },
};

export default function RequisitionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.requisitions.list.useQuery({
    search: search || undefined,
    status: statusFilter as "DRAFT" | "PENDING" | "APPROVED" | "IN_SEPARATION" | "PARTIAL" | "COMPLETED" | "CANCELLED" | "ALL",
    type: typeFilter as "PRODUCTION" | "MAINTENANCE" | "ADMINISTRATIVE" | "PROJECT" | "OTHER" | "ALL",
    page,
    limit: 20,
  });

  const { data: stats } = trpc.requisitions.stats.useQuery();

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString("pt-BR");
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
                <Package className="w-6 h-6 text-indigo-600" />
                <h1 className="text-xl font-semibold text-gray-900">Requisições de Material</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CompanySwitcher />
              <Link
                href="/requisitions/new"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Nova Requisição
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.byStatus.map((s) => {
              const config = statusConfig[s.status];
              return (
                <div key={s.status} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`p-1 rounded ${config.color}`}>{config.icon}</span>
                    <span className="text-sm font-medium text-gray-600">{config.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{s.count}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por OP, centro de custo, departamento..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Todos os Status</option>
                <option value="DRAFT">Rascunho</option>
                <option value="PENDING">Aguardando</option>
                <option value="APPROVED">Aprovadas</option>
                <option value="IN_SEPARATION">Em Separação</option>
                <option value="PARTIAL">Parciais</option>
                <option value="COMPLETED">Concluídas</option>
                <option value="CANCELLED">Canceladas</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Todos os Tipos</option>
                <option value="PRODUCTION">Produção</option>
                <option value="MAINTENANCE">Manutenção</option>
                <option value="ADMINISTRATIVE">Administrativo</option>
                <option value="PROJECT">Projeto</option>
                <option value="OTHER">Outros</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : !data?.requisitions.length ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma requisição encontrada</h3>
              <p className="text-gray-500 mb-4">
                {search || statusFilter !== "ALL" || typeFilter !== "ALL"
                  ? "Tente ajustar os filtros de busca"
                  : "Crie uma nova requisição para solicitar materiais"}
              </p>
              <Link
                href="/requisitions/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Nova Requisição
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Código
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Destino
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Itens
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Prioridade
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Data
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
                    {data.requisitions.map((req) => {
                      const statusCfg = statusConfig[req.status];
                      const typeCfg = typeConfig[req.type];
                      const priorityCfg = priorityConfig[req.priority];

                      return (
                        <tr key={req.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">#{req.code}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-gray-600">
                              {typeCfg.icon}
                              <span>{typeCfg.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-gray-900">
                              {req.orderNumber && <div className="font-medium">OP: {req.orderNumber}</div>}
                              {req.costCenter && <div className="text-sm text-gray-500">CC: {req.costCenter}</div>}
                              {req.department && <div className="text-sm text-gray-500">{req.department}</div>}
                              {!req.orderNumber && !req.costCenter && !req.department && (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-medium text-gray-900">{req._count.items}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-medium ${priorityCfg.color}`}>
                              {priorityCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {formatDate(req.requestedAt)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                              {statusCfg.icon}
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link
                              href={`/requisitions/${req.id}`}
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
