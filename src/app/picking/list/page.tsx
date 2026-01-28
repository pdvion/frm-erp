"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  List,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Package,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Eye,
} from "lucide-react";
import Link from "next/link";

type StatusFilter = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "ALL";
type PriorityFilter = "LOW" | "NORMAL" | "HIGH" | "URGENT" | "ALL";

export default function PickingListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.picking.list.useQuery({
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    priority: priorityFilter !== "ALL" ? priorityFilter : undefined,
    page,
    limit: 20,
  });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
      IN_PROGRESS: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      COMPLETED: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
      CANCELLED: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    };
    const labels: Record<string, string> = {
      PENDING: "Pendente",
      IN_PROGRESS: "Em Andamento",
      COMPLETED: "Concluído",
      CANCELLED: "Cancelado",
    };
    const icons: Record<string, React.ReactNode> = {
      PENDING: <Clock className="w-3 h-3" />,
      IN_PROGRESS: <Play className="w-3 h-3" />,
      COMPLETED: <CheckCircle2 className="w-3 h-3" />,
      CANCELLED: <XCircle className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${styles[status] || styles.PENDING}`}>
        {icons[status]}
        {labels[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      LOW: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
      NORMAL: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      HIGH: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
      URGENT: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    };
    const labels: Record<string, string> = {
      LOW: "Baixa",
      NORMAL: "Normal",
      HIGH: "Alta",
      URGENT: "Urgente",
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${styles[priority] || styles.NORMAL}`}>
        {labels[priority] || priority}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      REQUISITION: "Requisição",
      SALES_ORDER: "Pedido Venda",
      PRODUCTION_ORDER: "Ordem Produção",
      TRANSFER: "Transferência",
    };
    return labels[type] || type;
  };

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "ALL", label: "Todos" },
    { value: "PENDING", label: "Pendentes" },
    { value: "IN_PROGRESS", label: "Em Andamento" },
    { value: "COMPLETED", label: "Concluídos" },
    { value: "CANCELLED", label: "Cancelados" },
  ];

  const priorityOptions: { value: PriorityFilter; label: string }[] = [
    { value: "ALL", label: "Todas" },
    { value: "URGENT", label: "Urgente" },
    { value: "HIGH", label: "Alta" },
    { value: "NORMAL", label: "Normal" },
    { value: "LOW", label: "Baixa" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lista de Separação"
        icon={<List className="w-6 h-6" />}
        module="INVENTORY"
        breadcrumbs={[
          { label: "Estoque", href: "/inventory" },
          { label: "Picking", href: "/picking" },
          { label: "Lista" },
        ]}
        actions={
          <Link
            href="/picking/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Package className="w-4 h-4" />
            Nova Separação
          </Link>
        }
      />

      {/* Filtros */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <input
              type="text"
              placeholder="Buscar por código..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-theme-muted" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setPage(1);
              }}
              className="px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value as PriorityFilter);
                setPage(1);
              }}
              className="px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
            >
              {priorityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Prioridade: {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-theme-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">Código</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">Tipo</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">Itens</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">Prioridade</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">Responsável</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">Criado em</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">Status</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-theme-muted">
                    Carregando...
                  </td>
                </tr>
              ) : !data?.pickingLists || data.pickingLists.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-theme-muted">
                    Nenhuma lista de separação encontrada
                  </td>
                </tr>
              ) : (
                data.pickingLists.map((picking) => (
                  <tr key={picking.id} className="hover:bg-theme-secondary transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-theme">{picking.code}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-theme">
                      {getTypeBadge(picking.type)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-theme">
                        <Package className="w-4 h-4 text-theme-muted" />
                        {picking._count.items}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getPriorityBadge(picking.priority)}
                    </td>
                    <td className="px-4 py-3">
                      {picking.assignee ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-theme-muted" />
                          <span className="text-sm text-theme">{picking.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-theme-muted">Não atribuído</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-theme-muted">
                      {formatDate(picking.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(picking.status)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/picking/${picking.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
            <p className="text-sm text-theme-muted">
              Página {page} de {data.pages} ({data.total} registros)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 border border-theme rounded-lg text-theme hover:bg-theme-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="flex items-center gap-1 px-3 py-1.5 border border-theme rounded-lg text-theme hover:bg-theme-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Links */}
      <div className="flex gap-4">
        <Link
          href="/picking"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Voltar para Picking
        </Link>
      </div>
    </div>
  );
}
