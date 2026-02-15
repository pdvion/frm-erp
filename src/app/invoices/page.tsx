"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { LinkButton } from "@/components/ui/LinkButton";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  FileText,
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Building2,
  Calendar,
  Package,
  Eye,
} from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";

const statusConfig: Record<string, { label: string; variant: BadgeVariant; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", variant: "warning", icon: <Clock className="w-4 h-4" /> },
  VALIDATED: { label: "Validado", variant: "info", icon: <CheckCircle className="w-4 h-4" /> },
  APPROVED: { label: "Aprovado", variant: "success", icon: <CheckCircle className="w-4 h-4" /> },
  REJECTED: { label: "Rejeitado", variant: "error", icon: <XCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelado", variant: "default", icon: <XCircle className="w-4 h-4" /> },
};

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.receivedInvoices.list.useQuery({
    search: search || undefined,
    status: statusFilter ? (statusFilter as "PENDING" | "VALIDATED" | "APPROVED" | "REJECTED" | "CANCELLED") : undefined,
    page,
    limit: 20,
  });

  const { data: stats } = trpc.receivedInvoices.stats.useQuery();


  return (
    <div className="space-y-6">
      <PageHeader
        title="NFe Recebidas"
        subtitle="Gerencie notas fiscais recebidas"
        icon={<FileText className="w-6 h-6" />}
        module="fiscal"
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/invoices/pending"
              className="flex items-center gap-2 px-4 py-2 border border-indigo-600 text-blue-600 rounded-lg hover:bg-indigo-50"
            >
              <Clock className="w-4 h-4" />
            NFe Pendentes SEFAZ
            </Link>
            <LinkButton
              href="/invoices/import"
              leftIcon={<Upload className="w-4 h-4" />}
            >
            Importar XML
            </LinkButton>
          </div>
        }
      />

      <div>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const stat = stats?.find((s) => s.status === status);
            const isActive = statusFilter === status;
            return (
              <Button
                key={status}
                variant="ghost"
                onClick={() => setStatusFilter(isActive ? "" : status)}
                className={`p-4 rounded-lg border text-left transition-colors h-auto flex flex-col items-start ${
                  isActive
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500"
                    : "border-theme bg-theme-card hover:bg-theme-hover"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={config.variant}>{config.icon}</Badge>
                  <span className="text-sm font-medium text-theme-secondary">{config.label}</span>
                </div>
                <div className="text-2xl font-bold text-theme">{stat?.count ?? 0}</div>
                <div className="text-sm text-theme-muted">{formatCurrency(stat?.total ?? 0)}</div>
              </Button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted z-10" />
              <Input
                placeholder="Buscar por chave, número ou fornecedor..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            {statusFilter && (
              <Button
                variant="ghost"
                onClick={() => setStatusFilter("")}
              >
                Limpar filtro
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : data?.invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-theme-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-theme mb-2">Nenhuma NFe encontrada</h3>
              <p className="text-theme-muted mb-4">Importe um XML para começar</p>
              <LinkButton
                href="/invoices/import"
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Importar XML
              </LinkButton>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Número
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Fornecedor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Emissão
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Itens
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {data?.invoices.map((invoice) => {
                      const config = statusConfig[invoice.status];
                      return (
                        <tr key={invoice.id} className="hover:bg-theme-hover">
                          <td className="px-6 py-4">
                            <div className="font-medium text-theme">
                              {invoice.invoiceNumber}
                            </div>
                            <div className="text-xs text-theme-muted font-mono">
                              {invoice.accessKey.slice(0, 20)}...
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-theme-muted" />
                              <div>
                                <div className="font-medium text-theme">
                                  {invoice.supplier?.companyName || invoice.supplierName}
                                </div>
                                <div className="text-sm text-theme-muted">
                                  {invoice.supplierCnpj}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-theme-secondary">
                              <Calendar className="w-4 h-4 text-theme-muted" />
                              {formatDate(invoice.issueDate)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-theme">
                            {formatCurrency(invoice.totalInvoice)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1 text-theme-secondary">
                              <Package className="w-4 h-4 text-theme-muted" />
                              {invoice._count.items}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant={config.variant}>
                              {config.icon}
                              {config.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <LinkButton
                              href={`/invoices/${invoice.id}`}
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
              {data && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-theme">
                  <div className="text-sm text-theme-muted">
                    Mostrando {(page - 1) * 20 + 1} a{" "}
                    {Math.min(page * 20, data.pagination.total)} de {data.pagination.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <span className="px-4 py-2 text-sm text-theme-secondary">
                      {page} / {data.pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pagination.totalPages}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
}
