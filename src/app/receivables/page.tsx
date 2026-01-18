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
  TrendingUp,
  Plus,
  Eye,
  CreditCard,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  PARTIAL: { label: "Parcial", color: "bg-blue-100 text-blue-800", icon: <CreditCard className="w-4 h-4" /> },
  PAID: { label: "Recebido", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  OVERDUE: { label: "Vencido", color: "bg-red-100 text-red-800", icon: <AlertTriangle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelado", color: "bg-gray-100 text-gray-600", icon: <XCircle className="w-4 h-4" /> },
  WRITTEN_OFF: { label: "Baixado", color: "bg-gray-100 text-gray-600", icon: <XCircle className="w-4 h-4" /> },
};

export default function ReceivablesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.receivables.list.useQuery({
    search: search || undefined,
    status: statusFilter as "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED" | "WRITTEN_OFF" | "ALL" | undefined,
    page,
    limit: 20,
  });

  const { data: dashboard } = trpc.receivables.dashboard.useQuery();
  const { data: aging } = trpc.receivables.aging.useQuery();

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
                <DollarSign className="w-6 h-6 text-green-600" />
                <h1 className="text-xl font-semibold text-gray-900">Contas a Receber</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CompanySwitcher />
              <Link
                href="/receivables/new"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                Novo Título
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Cards */}
        {dashboard && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Vencidos</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboard.overdueValue)}
              </div>
              <div className="text-xs text-gray-500">{dashboard.overdueCount} títulos</div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Vence Hoje</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboard.dueTodayValue)}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-yellow-600 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Próx. 7 dias</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboard.dueNext7DaysValue)}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Próx. 30 dias</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboard.dueNext30DaysValue)}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Recebido (mês)</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboard.monthReceivedValue)}
              </div>
              <div className="text-xs text-gray-500">{dashboard.monthReceivedCount} recebimentos</div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Total a Receber</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  dashboard.overdueValue + 
                  dashboard.dueTodayValue + 
                  dashboard.dueNext7DaysValue + 
                  dashboard.dueNext30DaysValue
                )}
              </div>
            </div>
          </div>
        )}

        {/* Aging */}
        {aging && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Aging de Recebíveis</h3>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">A Vencer</div>
                <div className="text-lg font-semibold text-green-600">{formatCurrency(aging.current)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">1-30 dias</div>
                <div className="text-lg font-semibold text-yellow-600">{formatCurrency(aging.days1to30)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">31-60 dias</div>
                <div className="text-lg font-semibold text-orange-600">{formatCurrency(aging.days31to60)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">61-90 dias</div>
                <div className="text-lg font-semibold text-red-500">{formatCurrency(aging.days61to90)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">+90 dias</div>
                <div className="text-lg font-semibold text-red-700">{formatCurrency(aging.over90)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por descrição, documento ou cliente..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="ALL">Todos os status</option>
                <option value="PENDING">Pendentes</option>
                <option value="PARTIAL">Parcialmente pagos</option>
                <option value="OVERDUE">Vencidos</option>
                <option value="PAID">Recebidos</option>
                <option value="CANCELLED">Cancelados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : !data?.receivables.length ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhum título encontrado</p>
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
                        Cliente
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
                        Recebido
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
                    {data.receivables.map((receivable) => {
                      const status = receivable.isOverdue ? "OVERDUE" : receivable.status;
                      const config = statusConfig[status] || statusConfig.PENDING;

                      return (
                        <tr key={receivable.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {receivable.code}
                            {receivable.totalInstallments > 1 && (
                              <span className="text-gray-500 text-xs ml-1">
                                ({receivable.installmentNumber}/{receivable.totalInstallments})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {receivable.customer.companyName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {receivable.customer.code}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                            {receivable.description}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className={`text-sm ${receivable.isOverdue ? "text-red-600 font-medium" : "text-gray-600"}`}>
                              {formatDate(receivable.dueDate)}
                            </div>
                            {receivable.isOverdue && receivable.daysOverdue > 0 && (
                              <div className="text-xs text-red-500">
                                {receivable.daysOverdue} dias
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                            {formatCurrency(receivable.netValue)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-green-600">
                            {receivable.paidValue > 0 ? formatCurrency(receivable.paidValue) : "-"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                              {config.icon}
                              {config.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link
                              href={`/receivables/${receivable.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
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
                    Página {page} de {data.pages} ({data.total} títulos)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pages}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <ChevronRight className="w-5 h-5" />
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
