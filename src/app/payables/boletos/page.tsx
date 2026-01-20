"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  Search, 
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  Printer,
  Copy,
  Building2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";

type BoletoStatus = "PENDING" | "REGISTERED" | "PAID" | "CANCELLED" | "OVERDUE";

const statusConfig: Record<BoletoStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  REGISTERED: { label: "Registrado", color: "bg-blue-100 text-blue-800", icon: FileText },
  PAID: { label: "Pago", color: "bg-green-100 text-green-800", icon: CheckCircle },
  CANCELLED: { label: "Cancelado", color: "bg-gray-100 text-gray-800", icon: AlertTriangle },
  OVERDUE: { label: "Vencido", color: "bg-red-100 text-red-800", icon: AlertTriangle },
};

export default function BoletosPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data, isLoading, error } = trpc.payables.listBoletos.useQuery({
    search: search || undefined,
    status: (status || undefined) as "PENDING" | "PAID" | "CANCELLED" | undefined,
    page,
    limit: 15,
  });

  const boletos = data?.boletos ?? [];
  const pagination = data?.pagination;
  const stats = data?.stats;


  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Boletos Bancários"
        icon={<FileText className="w-6 h-6 text-indigo-600" />}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/payables/cnab"
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Remessa CNAB</span>
            </Link>
            <Link
              href="/payables/boletos/new"
              className="flex items-center gap-2 px-4 py-2 bg-[var(--frm-primary)] text-white rounded-lg hover:bg-[var(--frm-dark)] transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span>Gerar Boleto</span>
            </Link>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Pendentes</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
              <div className="text-xs text-gray-500">{formatCurrency(stats.pendingValue)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Registrados</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.registered}</div>
              <div className="text-xs text-gray-500">{formatCurrency(stats.registeredValue)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Pagos (Mês)</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.paidMonth}</div>
              <div className="text-xs text-gray-500">{formatCurrency(stats.paidValueMonth)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm">Vencidos</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.overdue}</div>
              <div className="text-xs text-gray-500">{formatCurrency(stats.overdueValue)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Building2 className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Total Emitido</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500">{formatCurrency(stats.totalValue)}</div>
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
                placeholder="Buscar por número, nosso número ou sacado..."
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
                <option value="REGISTERED">Registrados</option>
                <option value="PAID">Pagos</option>
                <option value="OVERDUE">Vencidos</option>
                <option value="CANCELLED">Cancelados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Erro ao carregar boletos: {error.message}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--frm-primary)]"></div>
              <span className="ml-3 text-gray-600">Carregando boletos...</span>
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
                      Nosso Número
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sacado
                    </th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimento
                    </th>
                    <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
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
                  {boletos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-12 h-12 text-gray-300" />
                          <p>Nenhum boleto encontrado</p>
                          <Link
                            href="/payables/boletos/new"
                            className="text-[var(--frm-primary)] hover:underline"
                          >
                            Gerar primeiro boleto
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    boletos.map((boleto) => {
                      const statusInfo = statusConfig[boleto.status as BoletoStatus] || statusConfig.PENDING;
                      const StatusIcon = statusInfo.icon;
                      return (
                        <tr key={boleto.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900 font-mono">
                              {boleto.ourNumber}
                            </div>
                            <div className="text-xs text-gray-500">
                              Doc: {boleto.documentNumber}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {boleto.payerName}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {boleto.payerDocument}
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap">
                            <div className={`text-sm ${boleto.isOverdue ? "text-red-600 font-medium" : "text-gray-600"}`}>
                              {formatDate(boleto.dueDate)}
                            </div>
                            {boleto.isOverdue && (
                              <div className="text-xs text-red-500">
                                {boleto.daysOverdue} dias em atraso
                              </div>
                            )}
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(boleto.value)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              {boleto.barcode && (
                                <button
                                  onClick={() => copyToClipboard(boleto.barcode!)}
                                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                  title="Copiar linha digitável"
                                >
                                  {copiedCode === boleto.barcode ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                              <button
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                title="Imprimir"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <Link
                                href={`/payables/boletos/${boleto.id}`}
                                className="p-1.5 text-[var(--frm-primary)] hover:bg-[var(--frm-50)] rounded"
                                title="Ver detalhes"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            </div>
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
