"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
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
  DRAFT: { label: "Rascunho", color: "bg-theme-tertiary text-theme" },
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
        <PageHeader
          title="Devoluções a Fornecedor"
          subtitle="Gerencie devoluções de materiais"
          icon={<RotateCcw className="h-6 w-6" />}
          module="inventory"
          actions={
            <Link
              href="/supplier-returns/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Nova Devolução
            </Link>
          }
        />

        {/* Filters */}
        <div className="bg-theme-card border-theme rounded-xl border p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="text-theme-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por fornecedor..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="border-theme bg-theme-card text-theme w-full rounded-lg border py-2 pr-4 pl-10 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-theme-muted h-4 w-4" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as SupplierReturnStatus | "");
                  setPage(1);
                }}
                className="border-theme bg-theme-card text-theme rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
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
              className="text-theme-muted hover:text-theme border-theme rounded-lg border px-3 py-2"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-theme-card border-theme overflow-hidden rounded-xl border">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : !data?.data.length ? (
            <div className="py-12 text-center">
              <RotateCcw className="text-theme-muted mx-auto mb-4 h-12 w-12" />
              <p className="text-theme-muted">Nenhuma devolução encontrada</p>
              <Link
                href="/supplier-returns/new"
                className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline"
              >
                <Plus className="h-4 w-4" />
                Criar primeira devolução
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-theme-hover">
                  <tr>
                    <th className="text-theme-muted px-4 py-3 text-left text-sm font-medium">Nº</th>
                    <th className="text-theme-muted px-4 py-3 text-left text-sm font-medium">
                      Data
                    </th>
                    <th className="text-theme-muted px-4 py-3 text-left text-sm font-medium">
                      Fornecedor
                    </th>
                    <th className="text-theme-muted px-4 py-3 text-left text-sm font-medium">
                      NFe Origem
                    </th>
                    <th className="text-theme-muted px-4 py-3 text-right text-sm font-medium">
                      Valor
                    </th>
                    <th className="text-theme-muted px-4 py-3 text-center text-sm font-medium">
                      Status
                    </th>
                    <th className="text-theme-muted px-4 py-3 text-center text-sm font-medium">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-theme divide-y">
                  {data.data.map((item) => (
                    <tr key={item.id} className="hover:bg-theme-hover">
                      <td className="text-theme px-4 py-3 text-sm font-medium">
                        #{item.returnNumber}
                      </td>
                      <td className="text-theme-secondary px-4 py-3 text-sm">
                        {formatDate(item.returnDate)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-theme text-sm font-medium">
                          {item.supplier.companyName}
                        </div>
                        <div className="text-theme-muted text-xs">{item.supplier.cnpj}</div>
                      </td>
                      <td className="text-theme-secondary px-4 py-3 text-sm">
                        {item.receivedInvoice ? (
                          <span>
                            NF {item.receivedInvoice.invoiceNumber}/{item.receivedInvoice.series}
                          </span>
                        ) : (
                          <span className="text-theme-muted">-</span>
                        )}
                      </td>
                      <td className="text-theme px-4 py-3 text-right text-sm font-medium">
                        {formatCurrency(item.totalValue)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
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
                            className="text-theme-muted rounded p-1.5 hover:text-blue-600"
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {item.status === "DRAFT" && (
                            <>
                              <button
                                onClick={() => handleSubmit(item.id)}
                                className="text-theme-muted rounded p-1.5 hover:text-green-600"
                                title="Enviar para aprovação"
                                disabled={submitMutation.isPending}
                              >
                                <Send className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-theme-muted rounded p-1.5 hover:text-red-600"
                                title="Excluir"
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {item.returnInvoiceNumber && (
                            <span
                              className="p-1.5 text-purple-600"
                              title={`NFe Devolução: ${item.returnInvoiceNumber}`}
                            >
                              <FileText className="h-4 w-4" />
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
            <div className="border-theme flex items-center justify-between border-t px-4 py-3">
              <div className="text-theme-muted text-sm">
                Mostrando {(page - 1) * pageSize + 1} a{" "}
                {Math.min(page * pageSize, data.pagination.total)} de {data.pagination.total}{" "}
                registros
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-theme rounded-lg border p-2 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-theme text-sm">
                  Página {page} de {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                  className="border-theme rounded-lg border p-2 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
