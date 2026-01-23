"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  RotateCcw,
  Eye,
  Trash2,
  Send,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { SupplierReturnStatus } from "@prisma/client";

const statusConfig: Record<SupplierReturnStatus, { label: string; color: string }> = {
  DRAFT: { label: "Rascunho", color: "bg-gray-100 text-gray-800" },
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "Aprovada", color: "bg-blue-100 text-blue-800" },
  INVOICED: { label: "Faturada", color: "bg-purple-100 text-purple-800" },
  COMPLETED: { label: "Concluída", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-800" },
};

export default function SupplierReturnsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupplierReturnStatus | "">("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = trpc.supplierReturns.list.useQuery({
    search: search || undefined,
    status: statusFilter || undefined,
    page,
    pageSize,
  });

  const utils = trpc.useUtils();

  const submitMutation = trpc.supplierReturns.submit.useMutation({
    onSuccess: () => {
      utils.supplierReturns.list.invalidate();
    },
  });

  const deleteMutation = trpc.supplierReturns.delete.useMutation({
    onSuccess: () => {
      utils.supplierReturns.list.invalidate();
    },
  });

  const handleSubmit = async (id: string) => {
    if (confirm("Enviar devolução para aprovação?")) {
      await submitMutation.mutateAsync({ id });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Excluir esta devolução?")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-theme">Devoluções a Fornecedor</h1>
            <p className="text-theme-muted">Gerencie devoluções de materiais</p>
          </div>
          <Link
            href="/supplier-returns/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Nova Devolução
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-theme-card rounded-xl border border-theme p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <input
                type="text"
                placeholder="Buscar por fornecedor..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-theme rounded-lg bg-theme-card text-theme focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-theme-muted" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as SupplierReturnStatus | "");
                  setPage(1);
                }}
                className="px-3 py-2 border border-theme rounded-lg bg-theme-card text-theme focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todos os status</option>
                {Object.entries(statusConfig).map(([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setPage(1);
              }}
              className="px-3 py-2 text-theme-muted hover:text-theme border border-theme rounded-lg"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-theme-card rounded-xl border border-theme overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : !data?.data.length ? (
            <div className="text-center py-12">
              <RotateCcw className="w-12 h-12 text-theme-muted mx-auto mb-4" />
              <p className="text-theme-muted">Nenhuma devolução encontrada</p>
              <Link
                href="/supplier-returns/new"
                className="inline-flex items-center gap-2 mt-4 text-indigo-600 hover:underline"
              >
                <Plus className="w-4 h-4" />
                Criar primeira devolução
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-theme-hover">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                      Nº
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                      Fornecedor
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                      NFe Origem
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-theme-muted">
                      Valor
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {data.data.map((item) => (
                    <tr key={item.id} className="hover:bg-theme-hover">
                      <td className="px-4 py-3 text-sm font-medium text-theme">
                        #{item.returnNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-theme-secondary">
                        {formatDate(item.returnDate)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-theme">
                          {item.supplier.companyName}
                        </div>
                        <div className="text-xs text-theme-muted">
                          {item.supplier.cnpj}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-theme-secondary">
                        {item.receivedInvoice ? (
                          <span>
                            NF {item.receivedInvoice.invoiceNumber}/{item.receivedInvoice.series}
                          </span>
                        ) : (
                          <span className="text-theme-muted">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-theme">
                        {formatCurrency(item.totalValue)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            statusConfig[item.status].color
                          }`}
                        >
                          {statusConfig[item.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/supplier-returns/${item.id}`}
                            className="p-1.5 text-theme-muted hover:text-indigo-600 rounded"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {item.status === "DRAFT" && (
                            <>
                              <button
                                onClick={() => handleSubmit(item.id)}
                                className="p-1.5 text-theme-muted hover:text-green-600 rounded"
                                title="Enviar para aprovação"
                                disabled={submitMutation.isPending}
                              >
                                <Send className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 text-theme-muted hover:text-red-600 rounded"
                                title="Excluir"
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {item.returnInvoiceNumber && (
                            <span
                              className="p-1.5 text-purple-600"
                              title={`NFe Devolução: ${item.returnInvoiceNumber}`}
                            >
                              <FileText className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
              <div className="text-sm text-theme-muted">
                Mostrando {(page - 1) * pageSize + 1} a{" "}
                {Math.min(page * pageSize, data.pagination.total)} de{" "}
                {data.pagination.total} registros
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-theme rounded-lg disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-theme">
                  Página {page} de {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                  className="p-2 border border-theme rounded-lg disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
