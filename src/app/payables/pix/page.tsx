"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  QrCode, 
  Search, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  Copy,
  Send,
  RefreshCw,
  Building2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";

type PixStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";

const statusConfig: Record<PixStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  PROCESSING: { label: "Processando", color: "bg-blue-100 text-blue-800", icon: RefreshCw },
  COMPLETED: { label: "Concluído", color: "bg-green-100 text-green-800", icon: CheckCircle },
  FAILED: { label: "Falhou", color: "bg-red-100 text-red-800", icon: AlertTriangle },
  CANCELLED: { label: "Cancelado", color: "bg-gray-100 text-gray-800", icon: AlertTriangle },
};

export default function PixPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [page, setPage] = useState(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data, isLoading, error } = trpc.payables.listPixTransactions.useQuery({
    search: search || undefined,
    status: status as PixStatus | undefined,
    type: type as "PAYMENT" | "TRANSFER" | undefined,
    page,
    limit: 15,
  });

  const transactions = data?.transactions ?? [];
  const pagination = data?.pagination;
  const stats = data?.stats;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatPixKey = (key: string, type: string) => {
    if (type === "CPF" || type === "CNPJ") {
      return key.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    if (type === "PHONE") {
      return key.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return key;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Transações PIX"
        icon={<QrCode className="w-6 h-6 text-purple-600" />}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/payables/pix/schedule"
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Clock className="w-5 h-5" />
              <span>Agendamentos</span>
            </Link>
            <Link
              href="/payables/pix/new"
              className="flex items-center gap-2 px-4 py-2 bg-[var(--frm-primary)] text-white rounded-lg hover:bg-[var(--frm-dark)] transition-colors"
            >
              <Send className="w-5 h-5" />
              <span>Novo PIX</span>
            </Link>
          </div>
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
              <div className="text-xs text-gray-500">{formatCurrency(stats.pendingValue)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <RefreshCw className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Processando</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.processing}</div>
              <div className="text-xs text-gray-500">{formatCurrency(stats.processingValue)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Concluídos (Hoje)</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.completedToday}</div>
              <div className="text-xs text-gray-500">{formatCurrency(stats.completedValueToday)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Building2 className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Total (Mês)</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalMonth}</div>
              <div className="text-xs text-gray-500">{formatCurrency(stats.totalValueMonth)}</div>
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
                placeholder="Buscar por chave PIX, nome ou E2E ID..."
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
                <option value="PROCESSING">Processando</option>
                <option value="COMPLETED">Concluídos</option>
                <option value="FAILED">Falhou</option>
                <option value="CANCELLED">Cancelados</option>
              </select>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--frm-primary)] focus:border-transparent"
                aria-label="Filtrar por tipo"
              >
                <option value="">Todos os tipos</option>
                <option value="PAYMENT">Pagamento</option>
                <option value="TRANSFER">Transferência</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Erro ao carregar transações: {error.message}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--frm-primary)]"></div>
              <span className="ml-3 text-gray-600">Carregando transações...</span>
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
                      Data/Hora
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destinatário
                    </th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chave PIX
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
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <QrCode className="w-12 h-12 text-gray-300" />
                          <p>Nenhuma transação PIX encontrada</p>
                          <Link
                            href="/payables/pix/new"
                            className="text-[var(--frm-primary)] hover:underline"
                          >
                            Realizar primeiro PIX
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const statusInfo = statusConfig[tx.status as PixStatus] || statusConfig.PENDING;
                      const StatusIcon = statusInfo.icon;
                      return (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">
                              {formatDateTime(tx.createdAt)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {tx.type === "PAYMENT" ? "Pagamento" : "Transferência"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {tx.recipientName}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {tx.recipientDocument}
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="text-xs text-gray-500">{tx.pixKeyType}</div>
                                <div className="text-sm text-gray-900 font-mono truncate max-w-[200px]">
                                  {formatPixKey(tx.pixKey, tx.pixKeyType)}
                                </div>
                              </div>
                              <button
                                onClick={() => copyToClipboard(tx.pixKey)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                                title="Copiar chave"
                              >
                                {copiedKey === tx.pixKey ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(tx.value)}
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
                              href={`/payables/pix/${tx.id}`}
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

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <QrCode className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Sobre o PIX</h4>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• Transações são processadas em tempo real (24/7)</li>
                <li>• Limite diário configurável por conta bancária</li>
                <li>• Suporte a chaves CPF/CNPJ, Email, Telefone e Aleatória</li>
                <li>• Comprovantes disponíveis para download após conclusão</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
