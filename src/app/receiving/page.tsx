"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { LinkButton } from "@/components/ui/LinkButton";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import {
  Package,
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
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";

const statusConfig: Record<string, { label: string; variant: BadgeVariant; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", variant: "warning", icon: <Clock className="w-4 h-4" /> },
  IN_PROGRESS: { label: "Em Conferência", variant: "info", icon: <Package className="w-4 h-4" /> },
  COMPLETED: { label: "Concluído", variant: "success", icon: <CheckCircle className="w-4 h-4" /> },
  PARTIAL: { label: "Parcial", variant: "orange", icon: <AlertTriangle className="w-4 h-4" /> },
  REJECTED: { label: "Rejeitado", variant: "error", icon: <XCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelado", variant: "default", icon: <XCircle className="w-4 h-4" /> },
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

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Entrada de Materiais" 
        icon={<Package className="w-6 h-6 text-blue-600" />}
        module="RECEIVING"
      >
        <LinkButton
          href="/receiving/new"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Nova Entrada
        </LinkButton>
      </PageHeader>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPIs */}
        {dashboard && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-yellow-600 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Pendentes</span>
              </div>
              <div className="text-2xl font-bold text-theme">{dashboard.pending}</div>
            </div>
            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Package className="w-4 h-4" />
                <span className="text-sm font-medium">Em Conferência</span>
              </div>
              <div className="text-2xl font-bold text-theme">{dashboard.inProgress}</div>
            </div>
            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Concluídos (Mês)</span>
              </div>
              <div className="text-2xl font-bold text-theme">{dashboard.completedMonth.count}</div>
            </div>
            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Valor (Mês)</span>
              </div>
              <div className="text-2xl font-bold text-theme">{formatCurrency(dashboard.completedMonth.value)}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-theme-muted" />
            <Select
              value={statusFilter}
              onChange={(value) => { setStatusFilter(value); setPage(1); }}
              options={[
                { value: "ALL", label: "Todos os status" },
                { value: "PENDING", label: "Pendentes" },
                { value: "IN_PROGRESS", label: "Em Conferência" },
                { value: "COMPLETED", label: "Concluídos" },
                { value: "PARTIAL", label: "Parciais" },
                { value: "REJECTED", label: "Rejeitados" },
              ]}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : !data?.receivings.length ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-theme-muted mb-4" />
              <p className="text-theme-muted">Nenhum recebimento encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Fornecedor</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">NFe</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Data</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Itens</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Valor</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {data.receivings.map((receiving) => {
                      const config = statusConfig[receiving.status] || statusConfig.PENDING;
                      return (
                        <tr key={receiving.id} className="hover:bg-theme-hover">
                          <td className="px-4 py-3 font-medium text-theme">#{receiving.code}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-theme-muted" />
                              <span className="text-sm">{receiving.supplier.companyName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {receiving.nfeNumber && (
                              <div className="flex items-center justify-center gap-1 text-sm text-theme-secondary">
                                <FileText className="w-3 h-3" />
                                {receiving.nfeNumber}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-sm text-theme-secondary">
                              <Calendar className="w-3 h-3" />
                              {formatDate(receiving.receivingDate)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-theme-secondary">{receiving._count.items}</td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-theme">
                            {formatCurrency(receiving.totalValue)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={config.variant}>
                              {config.icon}
                              {config.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <LinkButton
                              href={`/receiving/${receiving.id}`}
                              variant="ghost"
                              size="sm"
                              leftIcon={<Eye className="w-4 h-4" />}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {receiving.status === "PENDING" ? "Conferir" : "Ver"}
                            </LinkButton>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {data.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                  <div className="text-sm text-theme-muted">Página {page} de {data.pages}</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pages}
                    >
                      <ChevronRight className="w-5 h-5" />
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
