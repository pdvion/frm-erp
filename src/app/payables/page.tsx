"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  DollarSign,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Building2,
  FileText,
  TrendingUp,
  Plus,
  Eye,
  CreditCard,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  PARTIAL: { label: "Parcial", color: "bg-blue-100 text-blue-800", icon: <CreditCard className="w-4 h-4" /> },
  PAID: { label: "Pago", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  OVERDUE: { label: "Vencido", color: "bg-red-100 text-red-800", icon: <AlertTriangle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelado", color: "bg-gray-100 text-gray-500", icon: <XCircle className="w-4 h-4" /> },
};

export default function PayablesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = trpc.payables.list.useQuery({
    search: search || undefined,
    status: statusFilter as "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED" | "ALL",
    page,
    limit: 20,
  });

  const { data: stats } = trpc.payables.stats.useQuery();
  const { data: aging } = trpc.payables.aging.useQuery();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
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
                <DollarSign className="w-6 h-6 text-indigo-600" />
                <h1 className="text-xl font-semibold text-gray-900">Contas a Pagar</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CompanySwitcher />
              <Link
                href="/payables/new"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Novo Título
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-medium">Vencidos</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalOverdue.value)}
              </div>
              <div className="text-sm text-gray-500">{stats.totalOverdue.count} títulos</div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <Calendar className="w-5 h-5" />
                <span className="text-sm font-medium">Vence Hoje</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.dueToday.value)}
              </div>
              <div className="text-sm text-gray-500">{stats.dueToday.count} títulos</div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-yellow-600 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">Esta Semana</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.dueThisWeek.value)}
              </div>
              <div className="text-sm text-gray-500">{stats.dueThisWeek.count} títulos</div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Este Mês</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.dueThisMonth.value)}
              </div>
              <div className="text-sm text-gray-500">{stats.dueThisMonth.count} títulos</div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-medium">Total Pendente</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalPending.value)}
              </div>
              <div className="text-sm text-gray-500">{stats.totalPending.count} títulos</div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Pago no Mês</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.paidThisMonth.value)}
              </div>
              <div className="text-sm text-gray-500">{stats.paidThisMonth.count} títulos</div>
            </div>
          </div>
        )}

        {/* Aging Chart */}
        {aging && aging.some(a => a.count > 0) && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Aging - Vencimentos</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {aging.map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-center ${
                    index < 4 ? "bg-red-50" : "bg-green-50"
                  }`}
                >
                  <div className="text-xs text-gray-600 mb-1">{item.label}</div>
                  <div className={`text-lg font-bold ${index < 4 ? "text-red-700" : "text-green-700"}`}>
                    {item.count}
                  </div>
                  <div className="text-xs text-gray-500">{formatCurrency(item.value)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por descrição, documento ou fornecedor..."
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="ALL">Todos os Status</option>
                <option value="PENDING">Pendentes</option>
                <option value="OVERDUE">Vencidos</option>
                <option value="PARTIAL">Parcialmente Pagos</option>
                <option value="PAID">Pagos</option>
                <option value="CANCELLED">Cancelados</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${
                  showFilters ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "border-gray-300 text-gray-700"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : !data?.payables.length ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum título encontrado</h3>
              <p className="text-gray-500">
                {search || statusFilter !== "ALL"
                  ? "Tente ajustar os filtros de busca"
                  : "Títulos serão gerados automaticamente ao aprovar NFes"}
              </p>
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
                        Fornecedor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Descrição
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Vencimento
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Valor
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Pago
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Saldo
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
                    {data.payables.map((payable) => {
                      const displayStatus = payable.isOverdue ? "OVERDUE" : payable.status;
                      const config = statusConfig[displayStatus];
                      const balance = payable.netValue - payable.paidValue;

                      return (
                        <tr key={payable.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">#{payable.code}</div>
                            {payable.documentNumber && (
                              <div className="text-xs text-gray-500">NF {payable.documentNumber}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="font-medium text-gray-900">
                                  {payable.supplier.tradeName || payable.supplier.companyName}
                                </div>
                                <div className="text-xs text-gray-500">Cód: {payable.supplier.code}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-gray-900">{payable.description}</div>
                            {payable.totalInstallments > 1 && (
                              <div className="text-xs text-gray-500">
                                Parcela {payable.installmentNumber}/{payable.totalInstallments}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className={`font-medium ${payable.isOverdue ? "text-red-600" : "text-gray-900"}`}>
                              {formatDate(payable.dueDate)}
                            </div>
                            {payable.isOverdue && (
                              <div className="text-xs text-red-500">
                                {payable.daysOverdue} dias atraso
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {formatCurrency(payable.netValue)}
                          </td>
                          <td className="px-4 py-3 text-right text-green-600">
                            {payable.paidValue > 0 ? formatCurrency(payable.paidValue) : "-"}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {formatCurrency(balance)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                              {config.icon}
                              {config.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                href={`/payables/${payable.id}`}
                                className="p-1 text-gray-400 hover:text-indigo-600"
                                title="Ver detalhes"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              {payable.status !== "PAID" && payable.status !== "CANCELLED" && (
                                <Link
                                  href={`/payables/${payable.id}/pay`}
                                  className="p-1 text-gray-400 hover:text-green-600"
                                  title="Registrar pagamento"
                                >
                                  <CreditCard className="w-4 h-4" />
                                </Link>
                              )}
                              {payable.invoice && (
                                <Link
                                  href={`/invoices/${payable.invoice.id}`}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                  title="Ver NFe"
                                >
                                  <FileText className="w-4 h-4" />
                                </Link>
                              )}
                            </div>
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
                    Mostrando {(page - 1) * 20 + 1} a {Math.min(page * 20, data.total)} de {data.total} títulos
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-700">
                      Página {page} de {data.pages}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pages}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
