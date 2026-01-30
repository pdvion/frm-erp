"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
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
  DRAFT: { label: "Rascunho", color: "bg-theme-tertiary text-theme-secondary", icon: <FileText className="w-4 h-4" /> },
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
  3: { label: "Normal", color: "text-theme-secondary" },
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


  return (
    <div className="space-y-6">
      <PageHeader 
        title="Requisições de Material" 
        icon={<Package className="w-6 h-6 text-amber-600" />}
        module="MATERIAL_OUT"
      >
        <Link href="/requisitions/new">
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Nova Requisição
          </Button>
        </Link>
      </PageHeader>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.byStatus.map((s) => {
              const config = statusConfig[s.status];
              return (
                <div key={s.status} className="bg-theme-card rounded-lg border border-theme p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`p-1 rounded ${config.color}`}>{config.icon}</span>
                    <span className="text-sm font-medium text-theme-secondary">{config.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-theme">{s.count}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-muted w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por OP, centro de custo, departamento..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
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
                className="px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
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
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : !data?.requisitions.length ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-theme-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-theme mb-2">Nenhuma requisição encontrada</h3>
              <p className="text-theme-muted mb-4">
                {search || statusFilter !== "ALL" || typeFilter !== "ALL"
                  ? "Tente ajustar os filtros de busca"
                  : "Crie uma nova requisição para solicitar materiais"}
              </p>
              <Link href="/requisitions/new">
                <Button leftIcon={<Plus className="w-4 h-4" />}>
                  Nova Requisição
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
                        Código
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Destino
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Itens
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Prioridade
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Data
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
                    {data.requisitions.map((req) => {
                      const statusCfg = statusConfig[req.status];
                      const typeCfg = typeConfig[req.type];
                      const priorityCfg = priorityConfig[req.priority];

                      return (
                        <tr key={req.id} className="hover:bg-theme-hover">
                          <td className="px-4 py-3">
                            <div className="font-medium text-theme">#{req.code}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-theme-secondary">
                              {typeCfg.icon}
                              <span>{typeCfg.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-theme">
                              {req.orderNumber && <div className="font-medium">OP: {req.orderNumber}</div>}
                              {req.costCenter && <div className="text-sm text-theme-muted">CC: {req.costCenter}</div>}
                              {req.department && <div className="text-sm text-theme-muted">{req.department}</div>}
                              {!req.orderNumber && !req.costCenter && !req.department && (
                                <span className="text-theme-muted">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-medium text-theme">{req._count.items}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-medium ${priorityCfg.color}`}>
                              {priorityCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-theme-secondary">
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
                              className="inline-flex items-center gap-1 px-3 py-1 text-blue-600 hover:text-indigo-800"
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
                <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                  <div className="text-sm text-theme-muted">
                    Mostrando {(page - 1) * 20 + 1} a {Math.min(page * 20, data.total)} de {data.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="p-2 border border-theme-input rounded-lg disabled:opacity-50 hover:bg-theme-hover"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-theme-secondary">
                      Página {page} de {data.pages}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pages}
                      className="p-2 border border-theme-input rounded-lg disabled:opacity-50 hover:bg-theme-hover"
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
