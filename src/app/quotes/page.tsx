"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
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
  DRAFT: { label: "Rascunho", color: "bg-gray-100 text-gray-800", icon: <FileText className="w-4 h-4" /> },
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  SENT: { label: "Enviada", color: "bg-blue-100 text-blue-800", icon: <Send className="w-4 h-4" /> },
  RECEIVED: { label: "Recebida", color: "bg-purple-100 text-purple-800", icon: <FileText className="w-4 h-4" /> },
  APPROVED: { label: "Aprovada", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  REJECTED: { label: "Rejeitada", color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelada", color: "bg-gray-100 text-gray-500", icon: <XCircle className="w-4 h-4" /> },
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

  const { data, isLoading, error } = trpc.quotes.list.useQuery({
    search: search || undefined,
    status: statusFilter ? (statusFilter as "DRAFT" | "PENDING" | "SENT" | "RECEIVED" | "APPROVED" | "REJECTED" | "CANCELLED") : undefined,
    page,
    limit: 20,
  });

  const { data: stats } = trpc.quotes.stats.useQuery();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

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
  }, [data?.quotes]);

  const handleCardClick = (quote: Quote) => {
    router.push(`/quotes/${quote.id}`);
  };

  const renderQuoteCard = ({ item }: { item: Quote }) => (
    <KanbanCard
      title={`#${item.code.toString().padStart(6, "0")}`}
      subtitle={item.supplier.tradeName || item.supplier.companyName}
      footer={
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(item.requestDate)}
          </span>
          <span className="font-medium text-gray-900">
            {formatCurrency(item.totalValue)}
          </span>
        </div>
      }
    />
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Cotações" 
        icon={<FileText className="w-6 h-6 text-purple-600" />}
        module="QUOTES"
      >
        <Link
          href="/quotes/compare"
          className="flex items-center gap-2 px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            {stats.byStatus.map((s) => {
              const config = statusConfig[s.status];
              return (
                <div
                  key={s.status}
                  className="bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:border-blue-300 transition-colors"
                  onClick={() => setStatusFilter(statusFilter === s.status ? "" : s.status)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`p-1 rounded ${config.color}`}>
                      {config.icon}
                    </span>
                    <div className="text-xl font-bold text-gray-900">{s.count}</div>
                  </div>
                  <div className="text-sm text-gray-500">{config.label}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatCurrency(s.totalValue)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por fornecedor ou observações..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">Erro ao carregar cotações</span>
          </div>
        ) : data?.quotes.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma cotação encontrada
            </h3>
            <p className="text-gray-500 mb-4">
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
            emptyMessage="Nenhuma cotação encontrada"
          />
        ) : (
          <>
            {/* Table View */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fornecedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Itens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.quotes.map((quote) => {
                    const config = statusConfig[quote.status];
                    return (
                      <tr key={quote.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            #{quote.code.toString().padStart(6, "0")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {quote.supplier.tradeName || quote.supplier.companyName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Cód: {quote.supplier.code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(quote.requestDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {quote._count.items} {quote._count.items === 1 ? "item" : "itens"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
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
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Mostrando {((page - 1) * 20) + 1} a{" "}
                  {Math.min(page * 20, data.pagination.total)} de{" "}
                  {data.pagination.total} cotações
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="px-4 py-2 text-sm">
                    {page} / {data.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.pagination.totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
