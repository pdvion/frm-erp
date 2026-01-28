"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { KanbanBoard, KanbanCard, ViewToggle } from "@/components/ui";
import type { KanbanColumn } from "@/components/ui";
import {
  FileText,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Loader2,
  AlertCircle,
  Filter,
  BarChart3,
  Calendar,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Rascunho", color: "bg-theme-secondary text-theme-muted", icon: <FileText className="w-4 h-4" /> },
  PENDING: { label: "Pendente", color: "bg-yellow-900/30 text-yellow-400", icon: <Clock className="w-4 h-4" /> },
  SENT: { label: "Enviada", color: "bg-blue-900/30 text-blue-400", icon: <Send className="w-4 h-4" /> },
  RECEIVED: { label: "Recebida", color: "bg-purple-900/30 text-purple-400", icon: <FileText className="w-4 h-4" /> },
  APPROVED: { label: "Aprovada", color: "bg-green-900/30 text-green-400", icon: <CheckCircle className="w-4 h-4" /> },
  REJECTED: { label: "Rejeitada", color: "bg-red-900/30 text-red-400", icon: <XCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelada", color: "bg-theme-card text-theme-muted", icon: <XCircle className="w-4 h-4" /> },
};

// Status colors for Kanban
const statusColors: Record<string, string> = {
  DRAFT: "#9CA3AF",
  PENDING: "#F59E0B",
  SENT: "#3B82F6",
  RECEIVED: "#8B5CF6",
  APPROVED: "#10B981",
  REJECTED: "#EF4444",
  CANCELLED: "#6B7280",
};

interface Quote {
  id: string;
  code: number;
  status: string;
  requestDate: Date | string;
  totalValue: number;
  supplier: {
    code: number;
    companyName: string;
    tradeName: string | null;
  };
  _count: {
    items: number;
  };
}

export default function QuotesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "kanban">("list");

  const { data, isLoading, error, refetch } = trpc.quotes.list.useQuery({
    search: search || undefined,
    status: statusFilter ? (statusFilter as "DRAFT" | "PENDING" | "SENT" | "RECEIVED" | "APPROVED" | "REJECTED" | "CANCELLED") : undefined,
    page,
    limit: 20,
  });

  const { data: stats } = trpc.quotes.stats.useQuery();


  // Prepare Kanban columns
  const kanbanColumns = useMemo((): KanbanColumn<Quote>[] => {
    if (!data?.quotes) return [];

    const statusOrder = ["DRAFT", "PENDING", "SENT", "RECEIVED", "APPROVED", "REJECTED"];
    
    return statusOrder.map((status) => ({
      id: status,
      title: statusConfig[status]?.label || status,
      color: statusColors[status] || "#6B7280",
      items: data.quotes.filter((q) => q.status === status) as Quote[],
    }));
  }, [data]);

  const handleCardClick = (quote: Quote) => {
    router.push(`/quotes/${quote.id}`);
  };

  const updateStatusMutation = trpc.quotes.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleCardMove = (itemId: string, _fromColumnId: string, toColumnId: string) => {
    const validStatuses = ["DRAFT", "PENDING", "SENT", "RECEIVED", "APPROVED", "REJECTED", "CANCELLED"] as const;
    if (validStatuses.includes(toColumnId as typeof validStatuses[number])) {
      updateStatusMutation.mutate({
        id: itemId,
        status: toColumnId as typeof validStatuses[number],
      });
    }
  };

  const renderQuoteCard = ({ item }: { item: Quote }) => (
    <KanbanCard
      title={`#${item.code.toString().padStart(6, "0")}`}
      subtitle={item.supplier.tradeName || item.supplier.companyName}
      footer={
        <div className="flex items-center justify-between text-xs text-theme-muted">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(item.requestDate)}
          </span>
          <span className="font-medium text-white">
            {formatCurrency(item.totalValue)}
          </span>
        </div>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Cotações" 
        icon={<FileText className="w-6 h-6" />}
        module="QUOTES"
      >
        <Link
          href="/quotes/compare"
          className="flex items-center gap-2 px-4 py-2 border border-purple-700 text-purple-400 rounded-lg hover:bg-purple-900/20 transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          Comparar
        </Link>
        <Link
          href="/quotes/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Cotação
        </Link>
      </PageHeader>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-theme-card rounded-lg p-4 border border-theme">
            <div className="text-2xl font-bold text-theme">{stats.total}</div>
            <div className="text-sm text-theme-secondary">Total</div>
          </div>
          {stats.byStatus.map((s) => {
            const config = statusConfig[s.status];
            return (
              <div
                key={s.status}
                className={`bg-theme-card rounded-lg p-4 border cursor-pointer transition-colors ${statusFilter === s.status ? "border-blue-500" : "border-theme hover:border-theme-hover"}`}
                onClick={() => setStatusFilter(statusFilter === s.status ? "" : s.status)}
              >
                <div className="flex items-center gap-2">
                  <span className={`p-1 rounded ${config.color}`}>
                    {config.icon}
                  </span>
                  <div className="text-xl font-bold text-theme">{s.count}</div>
                </div>
                <div className="text-sm text-theme-secondary">{config.label}</div>
                <div className="text-xs text-theme-muted mt-1">
                  {formatCurrency(s.totalValue)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="bg-theme-card rounded-lg border border-theme p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
            <input
              type="text"
              placeholder="Buscar por fornecedor ou observações..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-theme-muted" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos os status</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">Erro ao carregar cotações</span>
        </div>
      ) : data?.quotes.length === 0 ? (
        <div className="bg-theme-card rounded-lg border border-theme p-12 text-center">
          <FileText className="w-12 h-12 text-theme-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme mb-2">
            Nenhuma cotação encontrada
          </h3>
          <p className="text-theme-secondary mb-4">
            {search || statusFilter
              ? "Tente ajustar os filtros de busca"
              : "Comece criando sua primeira cotação"}
          </p>
          <Link
            href="/quotes/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nova Cotação
          </Link>
        </div>
      ) : view === "kanban" ? (
        /* Kanban View */
        <KanbanBoard
          columns={kanbanColumns}
          renderCard={renderQuoteCard}
          onCardClick={handleCardClick}
          onCardMove={handleCardMove}
          emptyMessage="Nenhuma cotação encontrada"
        />
      ) : (
        <>
          {/* Table View */}
          <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-theme-table">
              <thead className="bg-theme-table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Fornecedor
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Data
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Itens
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-table">
                {data?.quotes.map((quote) => {
                  const config = statusConfig[quote.status];
                  return (
                    <tr key={quote.id} className="hover:bg-theme-table-hover">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-medium text-theme">
                          #{quote.code.toString().padStart(6, "0")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-theme">
                          {quote.supplier.tradeName || quote.supplier.companyName}
                        </div>
                        <div className="text-sm text-theme-muted">
                          Cód: {quote.supplier.code}
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-theme-secondary">
                        {formatDate(quote.requestDate)}
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-theme-secondary">
                        {quote._count.items} {quote._count.items === 1 ? "item" : "itens"}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-theme">
                          {formatCurrency(quote.totalValue)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
                        >
                          {config.icon}
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/quotes/${quote.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors"
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
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-theme-secondary">
                Mostrando {((page - 1) * 20) + 1} a{" "}
                {Math.min(page * 20, data.pagination.total)} de{" "}
                {data.pagination.total} cotações
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-theme text-theme-secondary hover:bg-theme-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 text-sm text-theme-secondary">
                  {page} / {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.pagination.totalPages}
                  className="p-2 rounded-lg border border-theme text-theme-secondary hover:bg-theme-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
