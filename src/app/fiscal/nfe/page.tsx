"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  Search, 
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";

type NFeStatus = "PENDING" | "APPROVED" | "REJECTED" | "PROCESSING";

const statusConfig: Record<NFeStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  APPROVED: { label: "Aprovada", color: "bg-green-100 text-green-800", icon: CheckCircle },
  REJECTED: { label: "Rejeitada", color: "bg-red-100 text-red-800", icon: XCircle },
  PROCESSING: { label: "Processando", color: "bg-blue-100 text-blue-800", icon: AlertTriangle },
};

export default function NFePage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = trpc.nfe.list.useQuery({
    search: search || undefined,
    status: (status || undefined) as "PENDING" | "APPROVED" | "REJECTED" | "VALIDATED" | "CANCELLED" | undefined,
    page,
    limit: 15,
  });

  const invoices = data?.invoices ?? [];
  const pagination = data?.pagination;
  const stats = data?.stats;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Notas Fiscais Eletrônicas"
        icon={<FileText className="w-6 h-6 text-blue-600" />}
        actions={
          <Link
            href="/fiscal/nfe/import"
            className="flex items-center gap-2 px-4 py-2 bg-[var(--frm-primary)] text-white rounded-lg hover:bg-[var(--frm-dark)] transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span>Importar XML</span>
          </Link>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Pendentes</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Aprovadas (Mês)</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.approvedMonth}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm">Rejeitadas</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.rejected}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Valor Total (Mês)</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValueMonth)}</div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número, chave de acesso ou fornecedor..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--frm-primary)] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--frm-primary)] focus:border-transparent"
                aria-label="Filtrar por status"
              >
                <option value="">Todos os status</option>
                <option value="PENDING">Pendentes</option>
                <option value="APPROVED">Aprovadas</option>
                <option value="REJECTED">Rejeitadas</option>
                <option value="PROCESSING">Processando</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Erro ao carregar NFes: {error.message}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--frm-primary)]"></div>
              <span className="ml-3 text-gray-600">Carregando notas fiscais...</span>
            </div>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número/Série
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fornecedor
                    </th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Emissão
                    </th>
                    <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Total
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-12 h-12 text-gray-300" />
                          <p>Nenhuma nota fiscal encontrada</p>
                          <Link
                            href="/fiscal/nfe/import"
                            className="text-[var(--frm-primary)] hover:underline"
                          >
                            Importar primeira NFe
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => {
                      const statusInfo = statusConfig[invoice.status as NFeStatus] || statusConfig.PENDING;
                      const StatusIcon = statusInfo.icon;
                      return (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {invoice.invoiceNumber}
                            </div>
                            <div className="text-xs text-gray-500">
                              Série: {invoice.series}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {invoice.supplierName}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {invoice.supplierCnpj}
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {formatDate(invoice.issueDate)}
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(invoice.totalInvoice)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <Link
                              href={`/fiscal/nfe/${invoice.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-[var(--frm-primary)] hover:bg-[var(--frm-50)] rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Ver</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                  {pagination.total} registros
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Próxima página"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
