"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { CompanyBadge } from "@/components/ui/CompanyBadge";
import { useMultiTenant } from "@/hooks/useMultiTenant";
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
  Calendar,
  Building2,
  FileText,
  TrendingUp,
  Plus,
  Eye,
  CreditCard,
  BarChart3,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";

const statusConfig: Record<string, { label: string; variant: BadgeVariant; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", variant: "warning", icon: <Clock className="w-4 h-4" /> },
  PARTIAL: { label: "Parcial", variant: "info", icon: <CreditCard className="w-4 h-4" /> },
  PAID: { label: "Pago", variant: "success", icon: <CheckCircle className="w-4 h-4" /> },
  OVERDUE: { label: "Vencido", variant: "error", icon: <AlertTriangle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelado", variant: "default", icon: <XCircle className="w-4 h-4" /> },
};

export default function PayablesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const { showCompanyColumn } = useMultiTenant();

  const { data, isLoading } = trpc.payables.list.useQuery({
    search: search || undefined,
    status: statusFilter as "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED" | "ALL",
    page,
    limit: 20,
  });

  const { data: stats } = trpc.payables.stats.useQuery();
  const { data: aging } = trpc.payables.aging.useQuery();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Contas a Pagar" 
        icon={<DollarSign className="w-6 h-6 text-blue-600" />}
        module="SETTINGS"
      >
        <Link
          href="/payables/cashflow"
          className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50"
        >
          <BarChart3 className="w-4 h-4" />
          Fluxo de Caixa
        </Link>
        <Link
          href="/payables/cnab"
          className="flex items-center gap-2 px-4 py-2 border border-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover"
        >
          <Building2 className="w-4 h-4" />
          CNAB
        </Link>
        <Link
          href="/payables/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Novo Título
        </Link>
      </PageHeader>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-medium">Vencidos</span>
              </div>
              <div className="text-2xl font-bold text-theme">
                {formatCurrency(stats.totalOverdue.value)}
              </div>
              <div className="text-sm text-theme-muted">{stats.totalOverdue.count} títulos</div>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <Calendar className="w-5 h-5" />
                <span className="text-sm font-medium">Vence Hoje</span>
              </div>
              <div className="text-2xl font-bold text-theme">
                {formatCurrency(stats.dueToday.value)}
              </div>
              <div className="text-sm text-theme-muted">{stats.dueToday.count} títulos</div>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-yellow-600 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">Esta Semana</span>
              </div>
              <div className="text-2xl font-bold text-theme">
                {formatCurrency(stats.dueThisWeek.value)}
              </div>
              <div className="text-sm text-theme-muted">{stats.dueThisWeek.count} títulos</div>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Este Mês</span>
              </div>
              <div className="text-2xl font-bold text-theme">
                {formatCurrency(stats.dueThisMonth.value)}
              </div>
              <div className="text-sm text-theme-muted">{stats.dueThisMonth.count} títulos</div>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-medium">Total Pendente</span>
              </div>
              <div className="text-2xl font-bold text-theme">
                {formatCurrency(stats.totalPending.value)}
              </div>
              <div className="text-sm text-theme-muted">{stats.totalPending.count} títulos</div>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Pago no Mês</span>
              </div>
              <div className="text-2xl font-bold text-theme">
                {formatCurrency(stats.paidThisMonth.value)}
              </div>
              <div className="text-sm text-theme-muted">{stats.paidThisMonth.count} títulos</div>
            </div>
          </div>
        )}

        {/* Aging Chart */}
        {aging && aging.some(a => a.count > 0) && (
          <div className="bg-theme-card rounded-lg border border-theme p-6 mb-8">
            <h3 className="text-lg font-medium text-theme mb-4">Aging - Vencimentos</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {aging.map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-center ${
                    index < 4 ? "bg-red-50" : "bg-green-50"
                  }`}
                >
                  <div className="text-xs text-theme-secondary mb-1">{item.label}</div>
                  <div className={`text-lg font-bold ${index < 4 ? "text-red-700" : "text-green-700"}`}>
                    {item.count}
                  </div>
                  <div className="text-xs text-theme-muted">{formatCurrency(item.value)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-muted w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por descrição, documento ou fornecedor..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <NativeSelect
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-indigo-500"
              >
                <option value="ALL">Todos os Status</option>
                <option value="PENDING">Pendentes</option>
                <option value="OVERDUE">Vencidos</option>
                <option value="PARTIAL">Parcialmente Pagos</option>
                <option value="PAID">Pagos</option>
                <option value="CANCELLED">Cancelados</option>
              </NativeSelect>

              <Button
                variant={showFilters ? "primary" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<Filter className="w-4 h-4" />}
                className={showFilters ? "bg-indigo-600 hover:bg-indigo-700" : ""}
              >
                Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : !data?.payables.length ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-theme-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-theme mb-2">Nenhum título encontrado</h3>
              <p className="text-theme-muted">
                {search || statusFilter !== "ALL"
                  ? "Tente ajustar os filtros de busca"
                  : "Títulos serão gerados automaticamente ao aprovar NFes"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Código
                      </th>
                      {showCompanyColumn && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                          Empresa
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Fornecedor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Descrição
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Vencimento
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        Valor
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        Pago
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        Saldo
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
                    {data.payables.map((payable) => {
                      const displayStatus = payable.isOverdue ? "OVERDUE" : payable.status;
                      const config = statusConfig[displayStatus];
                      const balance = Number(payable.netValue) - Number(payable.paidValue);

                      return (
                        <tr key={payable.id} className="hover:bg-theme-hover">
                          <td className="px-4 py-3">
                            <div className="font-medium text-theme">#{payable.code}</div>
                            {payable.documentNumber && (
                              <div className="text-xs text-theme-muted">NF {payable.documentNumber}</div>
                            )}
                          </td>
                          {showCompanyColumn && (
                            <td className="px-4 py-3">
                              <CompanyBadge companyName={payable.company?.name} />
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-theme-muted" />
                              <div>
                                <div className="font-medium text-theme">
                                  {payable.supplier.tradeName || payable.supplier.companyName}
                                </div>
                                <div className="text-xs text-theme-muted">Cód: {payable.supplier.code}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-theme">{payable.description}</div>
                            {payable.totalInstallments > 1 && (
                              <div className="text-xs text-theme-muted">
                                Parcela {payable.installmentNumber}/{payable.totalInstallments}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className={`font-medium ${payable.isOverdue ? "text-red-600" : "text-theme"}`}>
                              {formatDate(payable.dueDate)}
                            </div>
                            {payable.isOverdue && (
                              <div className="text-xs text-red-500">
                                {payable.daysOverdue} dias atraso
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-theme">
                            {formatCurrency(payable.netValue)}
                          </td>
                          <td className="px-4 py-3 text-right text-green-600">
                            {Number(payable.paidValue) > 0 ? formatCurrency(payable.paidValue) : "-"}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-theme">
                            {formatCurrency(balance)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={config.variant}>
                              {config.icon}
                              {config.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                href={`/payables/${payable.id}`}
                                className="p-1 text-theme-muted hover:text-blue-600"
                                title="Ver detalhes"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              {payable.status !== "PAID" && payable.status !== "CANCELLED" && (
                                <Link
                                  href={`/payables/${payable.id}/pay`}
                                  className="p-1 text-theme-muted hover:text-green-600"
                                  title="Registrar pagamento"
                                >
                                  <CreditCard className="w-4 h-4" />
                                </Link>
                              )}
                              {payable.invoice && (
                                <Link
                                  href={`/invoices/${payable.invoice.id}`}
                                  className="p-1 text-theme-muted hover:text-blue-600"
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
                <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                  <div className="text-sm text-theme-muted">
                    Mostrando {(page - 1) * 20 + 1} a {Math.min(page * 20, data.total)} de {data.total} títulos
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-theme-secondary">
                      Página {page} de {data.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pages}
                      aria-label="Próxima página"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
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
