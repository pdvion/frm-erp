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
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

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
    <div className="space-y-6">
      <PageHeader
        title="Notas Fiscais Eletrônicas"
        icon={<FileText className="w-6 h-6 text-blue-600" />}
        actions={
          <Button
            onClick={() => window.location.href = "/fiscal/nfe/import"}
            leftIcon={<Upload className="w-5 h-5" />}
          >
            Importar XML
          </Button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-theme-card rounded-xl border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-secondary mb-1">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Pendentes</span>
              </div>
              <div className="text-2xl font-bold text-theme">{stats.pending}</div>
            </div>
            <div className="bg-theme-card rounded-xl border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-secondary mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Aprovadas (Mês)</span>
              </div>
              <div className="text-2xl font-bold text-theme">{stats.approvedMonth}</div>
            </div>
            <div className="bg-theme-card rounded-xl border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-secondary mb-1">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm">Rejeitadas</span>
              </div>
              <div className="text-2xl font-bold text-theme">{stats.rejected}</div>
            </div>
            <div className="bg-theme-card rounded-xl border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-secondary mb-1">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Valor Total (Mês)</span>
              </div>
              <div className="text-2xl font-bold text-theme">{formatCurrency(stats.totalValueMonth)}</div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-theme-card rounded-xl border border-theme p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted z-10" />
              <Input
                placeholder="Buscar por número, chave de acesso ou fornecedor..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-theme-muted" />
              <Select
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
                placeholder="Todos os status"
                options={[
                  { value: "", label: "Todos os status" },
                  { value: "PENDING", label: "Pendentes" },
                  { value: "APPROVED", label: "Aprovadas" },
                  { value: "REJECTED", label: "Rejeitadas" },
                  { value: "PROCESSING", label: "Processando" },
                ]}
              />
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
          <div className="bg-theme-card rounded-xl border border-theme p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--frm-primary)]"></div>
              <span className="ml-3 text-theme-secondary">Carregando notas fiscais...</span>
            </div>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <div className="bg-theme-card rounded-xl border border-theme overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-theme-table-header border-b border-theme">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Número/Série
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Fornecedor
                    </th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Data Emissão
                    </th>
                    <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Valor Total
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-theme-muted">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-12 h-12 text-theme-muted" />
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
                        <tr key={invoice.id} className="hover:bg-theme-hover">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-theme">
                              {invoice.invoiceNumber}
                            </div>
                            <div className="text-xs text-theme-muted">
                              Série: {invoice.series}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-theme max-w-xs truncate">
                              {invoice.supplierName}
                            </div>
                            <div className="text-xs text-theme-muted font-mono">
                              {invoice.supplierCnpj}
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-theme-secondary">
                              {formatDate(invoice.issueDate)}
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-theme">
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
              <div className="px-4 py-3 border-t border-theme flex items-center justify-between">
                <div className="text-sm text-theme-secondary">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                  {pagination.total} registros
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-theme-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <span className="text-sm text-theme-secondary">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <Button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.totalPages}
                    className="p-2 rounded-lg hover:bg-theme-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Próxima página"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
