"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Package,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Eye,
  Building2,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  IN_PROGRESS: { label: "Em Conferência", color: "bg-blue-100 text-blue-800", icon: <Package className="w-4 h-4" /> },
  COMPLETED: { label: "Concluído", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  PARTIAL: { label: "Parcial", color: "bg-orange-100 text-orange-800", icon: <AlertTriangle className="w-4 h-4" /> },
  REJECTED: { label: "Rejeitado", color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelado", color: "bg-gray-100 text-gray-800", icon: <XCircle className="w-4 h-4" /> },
};

export default function ReceivingPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.receiving.list.useQuery({
    status: statusFilter as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "PARTIAL" | "CANCELLED" | "ALL" | undefined,
    page,
    limit: 20,
  });

  const { data: dashboard } = trpc.receiving.dashboard.useQuery();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Entrada de Materiais</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CompanySwitcher />
              <Link
                href="/receiving/new"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Nova Entrada
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPIs */}
        {dashboard && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-yellow-600 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Pendentes</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{dashboard.pending}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Package className="w-4 h-4" />
                <span className="text-sm font-medium">Em Conferência</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{dashboard.inProgress}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Concluídos (Mês)</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{dashboard.completedMonth.count}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Valor (Mês)</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(dashboard.completedMonth.value)}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="ALL">Todos os status</option>
              <option value="PENDING">Pendentes</option>
              <option value="IN_PROGRESS">Em Conferência</option>
              <option value="COMPLETED">Concluídos</option>
              <option value="PARTIAL">Parciais</option>
              <option value="REJECTED">Rejeitados</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : !data?.receivings.length ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhum recebimento encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">NFe</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Itens</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.receivings.map((receiving) => {
                      const config = statusConfig[receiving.status] || statusConfig.PENDING;
                      return (
                        <tr key={receiving.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">#{receiving.code}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{receiving.supplier.companyName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {receiving.nfeNumber && (
                              <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                                <FileText className="w-3 h-3" />
                                {receiving.nfeNumber}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                              <Calendar className="w-3 h-3" />
                              {formatDate(receiving.receivingDate)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">{receiving._count.items}</td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                            {formatCurrency(receiving.totalValue)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                              {config.icon}
                              {config.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link
                              href={`/receiving/${receiving.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            >
                              <Eye className="w-4 h-4" />
                              {receiving.status === "PENDING" ? "Conferir" : "Ver"}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {data.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <div className="text-sm text-gray-500">Página {page} de {data.pages}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage(page - 1)} disabled={page === 1} className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setPage(page + 1)} disabled={page === data.pages} className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50">
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
