"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
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
  TrendingUp,
  Plus,
  Eye,
  CreditCard,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { NativeSelect } from "@/components/ui/NativeSelect";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  PARTIAL: { label: "Parcial", color: "bg-blue-100 text-blue-800", icon: <CreditCard className="w-4 h-4" /> },
  PAID: { label: "Recebido", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  OVERDUE: { label: "Vencido", color: "bg-red-100 text-red-800", icon: <AlertTriangle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelado", color: "bg-theme-tertiary text-theme-secondary", icon: <XCircle className="w-4 h-4" /> },
  WRITTEN_OFF: { label: "Baixado", color: "bg-theme-tertiary text-theme-secondary", icon: <XCircle className="w-4 h-4" /> },
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas a Receber"
        subtitle="Gerencie títulos a receber"
        icon={<DollarSign className="w-6 h-6" />}
        module="finance"
        actions={
          <LinkButton href="/receivables/new" leftIcon={<Plus className="w-4 h-4" />}>
            Novo Título
          </LinkButton>
        }
      />

      <div>
        {/* Dashboard Cards */}
        {dashboard && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Vencidos</span>
              </div>
              <div className="text-2xl font-bold text-theme">
                {formatCurrency(dashboard.overdueValue)}
              </div>
              <div className="text-xs text-theme-muted">{dashboard.overdueCount} títulos</div>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Vence Hoje</span>
              </div>
              <div className="text-2xl font-bold text-theme">
                {formatCurrency(dashboard.dueTodayValue)}
              </div>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-yellow-600 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Próx. 7 dias</span>
              </div>
              <div className="text-2xl font-bold text-theme">
                {formatCurrency(dashboard.dueNext7DaysValue)}
              </div>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Próx. 30 dias</span>
              </div>
              <div className="text-2xl font-bold text-theme">
                {formatCurrency(dashboard.dueNext30DaysValue)}
              </div>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Recebido (mês)</span>
              </div>
              <div className="text-2xl font-bold text-theme">
                {formatCurrency(dashboard.monthReceivedValue)}
              </div>
              <div className="text-xs text-theme-muted">{dashboard.monthReceivedCount} recebimentos</div>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Total a Receber</span>
              </div>
              <div className="text-2xl font-bold text-theme">
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
          <div className="bg-theme-card rounded-lg border border-theme p-4 mb-8">
            <h3 className="text-sm font-medium text-theme-secondary mb-3">Aging de Recebíveis</h3>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-xs text-theme-muted mb-1">A Vencer</div>
                <div className="text-lg font-semibold text-green-600">{formatCurrency(aging.current)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-theme-muted mb-1">1-30 dias</div>
                <div className="text-lg font-semibold text-yellow-600">{formatCurrency(aging.days1to30)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-theme-muted mb-1">31-60 dias</div>
                <div className="text-lg font-semibold text-orange-600">{formatCurrency(aging.days31to60)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-theme-muted mb-1">61-90 dias</div>
                <div className="text-lg font-semibold text-red-500">{formatCurrency(aging.days61to90)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-theme-muted mb-1">+90 dias</div>
                <div className="text-lg font-semibold text-red-700">{formatCurrency(aging.over90)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <Input
                type="text"
                placeholder="Buscar por descrição, documento ou cliente..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-theme-muted" />
              <NativeSelect
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="ALL">Todos os status</option>
                <option value="PENDING">Pendentes</option>
                <option value="PARTIAL">Parcialmente pagos</option>
                <option value="OVERDUE">Vencidos</option>
                <option value="PAID">Recebidos</option>
                <option value="CANCELLED">Cancelados</option>
              </NativeSelect>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : !data?.receivables.length ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 mx-auto text-theme-muted mb-4" />
              <p className="text-theme-muted">Nenhum título encontrado</p>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Cliente
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
                        Recebido
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
                    {data.receivables.map((receivable) => {
                      const status = receivable.isOverdue ? "OVERDUE" : receivable.status;
                      const config = statusConfig[status] || statusConfig.PENDING;

                      return (
                        <tr key={receivable.id} className="hover:bg-theme-hover">
                          <td className="px-4 py-3 text-sm font-medium text-theme">
                            {receivable.code}
                            {receivable.totalInstallments > 1 && (
                              <span className="text-theme-muted text-xs ml-1">
                                ({receivable.installmentNumber}/{receivable.totalInstallments})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-theme-muted" />
                              <div>
                                <div className="text-sm font-medium text-theme">
                                  {receivable.customer.companyName}
                                </div>
                                <div className="text-xs text-theme-muted">
                                  {receivable.customer.code}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-theme-secondary max-w-xs truncate">
                            {receivable.description}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className={`text-sm ${receivable.isOverdue ? "text-red-600 font-medium" : "text-theme-secondary"}`}>
                              {formatDate(receivable.dueDate)}
                            </div>
                            {receivable.isOverdue && receivable.daysOverdue > 0 && (
                              <div className="text-xs text-red-500">
                                {receivable.daysOverdue} dias
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-theme">
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
                <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                  <div className="text-sm text-theme-muted">
                    Página {page} de {data.pages} ({data.total} títulos)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pages}
                      aria-label="Próxima página"
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
