"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  FileText,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Loader2,
  Building2,
  Calendar,
  Package,
  Eye,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  Ban,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Rascunho", color: "bg-gray-100 text-gray-800", icon: <Clock className="w-4 h-4" /> },
  AUTHORIZED: { label: "Autorizada", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-500", icon: <XCircle className="w-4 h-4" /> },
  DENIED: { label: "Denegada", color: "bg-orange-100 text-orange-800", icon: <AlertTriangle className="w-4 h-4" /> },
};

export default function BillingPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [showNewModal, setShowNewModal] = useState(false);

  const { data, isLoading, refetch } = trpc.billing.list.useQuery({
    search: search || undefined,
    status: statusFilter as "DRAFT" | "AUTHORIZED" | "CANCELLED" | "DENIED" | undefined,
    page,
    limit: 20,
  });

  const { data: dashboard } = trpc.billing.dashboard.useQuery();

  const authorizeMutation = trpc.billing.authorize.useMutation({
    onSuccess: () => refetch(),
  });

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
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Faturamento
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <CompanySwitcher />
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Nova NFe
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Faturamento do Mês</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(dashboard?.monthInvoices?.value || 0)}
            </div>
            <div className="text-sm text-gray-500">
              {dashboard?.monthInvoices?.count || 0} notas
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Autorizadas</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {dashboard?.byStatus?.find((s) => s.status === "AUTHORIZED")?.count || 0}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-gray-600">Pendentes</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {dashboard?.pendingAuth || 0}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Top Cliente</span>
            </div>
            <div className="text-lg font-bold text-gray-900 truncate">
              {dashboard?.topCustomers?.[0]?.customerName || "-"}
            </div>
            <div className="text-sm text-gray-500">
              {dashboard?.topCustomers?.[0]?.value
                ? formatCurrency(dashboard.topCustomers[0].value)
                : "-"}
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = dashboard?.byStatus?.find((s) => s.status === status)?.count || 0;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? "" : status)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  statusFilter === status
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`p-1 rounded ${config.color}`}>{config.icon}</span>
                  <span className="text-sm font-medium text-gray-600">{config.label}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número, cliente..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {statusFilter && (
              <button
                onClick={() => setStatusFilter("")}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Limpar filtro
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : data?.invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma NFe encontrada</h3>
              <p className="text-gray-500 mb-4">Crie uma nova nota fiscal para começar</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Nova NFe
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Número
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Emissão
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Itens
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data?.invoices.map((invoice) => {
                      const config = statusConfig[invoice.status] || statusConfig.DRAFT;
                      return (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {invoice.invoiceNumber}
                            </div>
                            <div className="text-xs text-gray-500">
                              Série {invoice.series}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="font-medium text-gray-900">
                                  {invoice.customer?.companyName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {invoice.customer?.code}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {formatDate(invoice.issueDate)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900">
                            {formatCurrency(invoice.totalValue)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1 text-gray-600">
                              <Package className="w-4 h-4 text-gray-400" />
                              {invoice._count?.items || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                              {config.icon}
                              {config.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                href={`/billing/${invoice.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg"
                              >
                                <Eye className="w-4 h-4" />
                                Ver
                              </Link>
                              {invoice.status === "DRAFT" && (
                                <button
                                  onClick={() => authorizeMutation.mutate({ id: invoice.id })}
                                  disabled={authorizeMutation.isPending}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg"
                                >
                                  <Send className="w-4 h-4" />
                                  Autorizar
                                </button>
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
              {data && data.total > 20 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Mostrando {(page - 1) * 20 + 1} a{" "}
                    {Math.min(page * 20, data.total)} de {data.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-600">
                      {page} / {Math.ceil(data.total / 20)}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= Math.ceil(data.total / 20)}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* New Invoice Modal */}
      {showNewModal && (
        <NewInvoiceModal
          onClose={() => setShowNewModal(false)}
          onSuccess={() => {
            setShowNewModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function NewInvoiceModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [selectedOrderId, setSelectedOrderId] = useState("");

  const { data: orders } = trpc.sales.listOrders.useQuery({
    status: "CONFIRMED",
    limit: 50,
  });

  const createFromOrderMutation = trpc.billing.createFromOrder.useMutation({
    onSuccess: () => onSuccess(),
  });

  const handleCreate = () => {
    if (selectedOrderId) {
      createFromOrderMutation.mutate({ salesOrderId: selectedOrderId });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-600" />
          Nova Nota Fiscal
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecione o Pedido de Venda
          </label>
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Selecione...</option>
            {orders?.orders?.map((order) => (
              <option key={order.id} value={order.id}>
                Pedido #{order.code} - {order.customer?.companyName} - {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.totalValue)}
              </option>
            ))}
          </select>
        </div>

        {createFromOrderMutation.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Erro ao criar nota</span>
            </div>
            <div className="text-sm text-red-600 mt-1">
              {createFromOrderMutation.error.message}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedOrderId || createFromOrderMutation.isPending}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {createFromOrderMutation.isPending ? "Criando..." : "Criar NFe"}
          </button>
        </div>
      </div>
    </div>
  );
}
