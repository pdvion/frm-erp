"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { LinkButton } from "@/components/ui/LinkButton";
import { formatCurrency, formatDate } from "@/lib/formatters";

import { PageHeader } from "@/components/PageHeader";
import {
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Rascunho", color: "bg-theme-tertiary text-theme", icon: <Clock className="w-4 h-4" /> },
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: <AlertCircle className="w-4 h-4" /> },
  AUTHORIZED: { label: "Autorizada", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
  DENIED: { label: "Rejeitada", color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
};

export default function IssuedInvoicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.issuedInvoices.list.useQuery({
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter as "DRAFT" | "PENDING" | "AUTHORIZED" | "CANCELLED" | "DENIED" : undefined,
    page,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notas Fiscais de Saída"
        icon={<FileText className="w-6 h-6" />}
        backHref="/sales"
        module="sales"
      />

      <main className="max-w-7xl mx-auto">
        {/* Filters */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <input
                type="text"
                placeholder="Buscar por número, chave ou cliente..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-theme-muted" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">Todos os status</option>
                <option value="DRAFT">Rascunhos</option>
                <option value="PENDING">Pendentes</option>
                <option value="AUTHORIZED">Autorizadas</option>
                <option value="CANCELLED">Canceladas</option>
                <option value="DENIED">Rejeitadas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : !data?.invoices.length ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-theme-muted mb-4" />
              <p className="text-theme-muted">Nenhuma nota fiscal encontrada</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        NF
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Emissão
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Pedido
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Itens
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        Valor
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {data.invoices.map((invoice) => {
                      const config = statusConfig[invoice.status] || statusConfig.DRAFT;

                      return (
                        <tr key={invoice.id} className="hover:bg-theme-hover">
                          <td className="px-4 py-3">
                            <div className="font-medium text-theme">{invoice.invoiceNumber}</div>
                            <div className="text-xs text-theme-muted">Série: {invoice.series}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-theme-muted" />
                              <div>
                                <div className="text-sm font-medium text-theme">
                                  {invoice.customer.companyName}
                                </div>
                                <div className="text-xs text-theme-muted">{invoice.customer.code}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-sm text-theme-secondary">
                              <Calendar className="w-3 h-3 text-theme-muted" />
                              {formatDate(invoice.issueDate)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-theme-secondary">
                            {invoice.salesOrder ? `#${invoice.salesOrder.code}` : "-"}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-theme-secondary">
                            {invoice._count.items}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-theme">
                            {formatCurrency(Number(invoice.totalValue))}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                              {config.icon}
                              {config.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <LinkButton
                              href={`/sales/invoices/${invoice.id}`}
                              variant="ghost"
                              size="sm"
                              leftIcon={<Eye className="w-4 h-4" />}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Ver
                            </LinkButton>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                  <div className="text-sm text-theme-muted">
                    Página {page} de {data.pages} ({data.total} notas)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="p-2 text-theme-muted hover:text-theme-secondary disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pages}
                      className="p-2 text-theme-muted hover:text-theme-secondary disabled:opacity-50"
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
