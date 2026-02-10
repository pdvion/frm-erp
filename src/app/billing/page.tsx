"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { LinkButton } from "@/components/ui/LinkButton";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { toNumber } from "@/lib/precision";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
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
  TrendingUp,
  AlertTriangle,
  FileCheck,
} from "lucide-react";
import { Badge, colorToVariant } from "@/components/ui/Badge";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Rascunho", color: "bg-theme-tertiary text-theme", icon: <Clock className="w-4 h-4" /> },
  AUTHORIZED: { label: "Autorizada", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-500", icon: <XCircle className="w-4 h-4" /> },
  DENIED: { label: "Denegada", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: <AlertTriangle className="w-4 h-4" /> },
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faturamento"
        subtitle="Emissão de notas fiscais"
        icon={<FileText className="w-6 h-6" />}
        module="fiscal"
        actions={
          <Button
            onClick={() => setShowNewModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nova NFe
          </Button>
        }
      />

      <div>
        {/* Dashboard Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-theme-card p-4 rounded-lg border border-theme">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-theme-secondary">Faturamento do Mês</span>
            </div>
            <div className="text-2xl font-bold text-theme">
              {formatCurrency(toNumber(dashboard?.monthInvoices?.value))}
            </div>
            <div className="text-sm text-theme-muted">
              {dashboard?.monthInvoices?.count || 0} notas
            </div>
          </div>

          <div className="bg-theme-card p-4 rounded-lg border border-theme">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-theme-secondary">Autorizadas</span>
            </div>
            <div className="text-2xl font-bold text-theme">
              {dashboard?.byStatus?.find((s) => s.status === "AUTHORIZED")?.count || 0}
            </div>
          </div>

          <div className="bg-theme-card p-4 rounded-lg border border-theme">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-theme-secondary">Pendentes</span>
            </div>
            <div className="text-2xl font-bold text-theme">
              {dashboard?.pendingAuth || 0}
            </div>
          </div>

          <div className="bg-theme-card p-4 rounded-lg border border-theme">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-theme-secondary">Top Cliente</span>
            </div>
            <div className="text-lg font-bold text-theme truncate">
              {dashboard?.topCustomers?.[0]?.customerName || "-"}
            </div>
            <div className="text-sm text-theme-muted">
              {dashboard?.topCustomers?.[0]?.value
                ? formatCurrency(toNumber(dashboard.topCustomers[0].value))
                : "-"}
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = dashboard?.byStatus?.find((s) => s.status === status)?.count || 0;
            return (
              <Button
                key={status}
                variant={statusFilter === status ? "primary" : "outline"}
                onClick={() => setStatusFilter(statusFilter === status ? "" : status)}
                className={`p-4 h-auto flex-col items-start ${
                  statusFilter === status
                    ? "border-indigo-500 bg-indigo-50"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`p-1 rounded ${config.color}`}>{config.icon}</span>
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                <div className="text-2xl font-bold">{count}</div>
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
                placeholder="Buscar por número, cliente..."
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
                size="sm"
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
              <p className="text-theme-muted mb-4">Crie uma nova nota fiscal para começar</p>
              <Button
                onClick={() => setShowNewModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Nova NFe
              </Button>
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
                        Cliente
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
                      const config = statusConfig[invoice.status] || statusConfig.DRAFT;
                      return (
                        <tr key={invoice.id} className="hover:bg-theme-hover">
                          <td className="px-6 py-4">
                            <div className="font-medium text-theme">
                              {invoice.invoiceNumber}
                            </div>
                            <div className="text-xs text-theme-muted">
                              Série {invoice.series}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-theme-muted" />
                              <div>
                                <div className="font-medium text-theme">
                                  {invoice.customer?.companyName}
                                </div>
                                <div className="text-sm text-theme-muted">
                                  {invoice.customer?.code}
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
                            {formatCurrency(toNumber(invoice.totalValue))}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1 text-theme-secondary">
                              <Package className="w-4 h-4 text-theme-muted" />
                              {invoice._count?.items || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant={colorToVariant(config.color)}>
                              {config.icon}
                              {config.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <LinkButton
                                href={`/billing/${invoice.id}`}
                                variant="ghost"
                                size="sm"
                                leftIcon={<Eye className="w-4 h-4" />}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Ver
                              </LinkButton>
                              {invoice.status === "DRAFT" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => authorizeMutation.mutate({ id: invoice.id })}
                                  disabled={authorizeMutation.isPending}
                                  leftIcon={<Send className="w-4 h-4" />}
                                  className="text-green-600 hover:bg-green-50"
                                >
                                  Autorizar
                                </Button>
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
                <div className="flex items-center justify-between px-6 py-4 border-t border-theme">
                  <div className="text-sm text-theme-muted">
                    Mostrando {(page - 1) * 20 + 1} a{" "}
                    {Math.min(page * 20, data.total)} de {data.total}
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
                      {page} / {Math.ceil(data.total / 20)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= Math.ceil(data.total / 20)}
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
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-invoice-title"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="bg-theme-card rounded-lg p-6 w-full max-w-lg mx-4">
        <h3 id="new-invoice-title" className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" />
          Nova Nota Fiscal
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-theme-secondary mb-2">
            Selecione o Pedido de Venda
          </label>
          <Select
            value={selectedOrderId}
            onChange={setSelectedOrderId}
            placeholder="Selecione..."
            options={[
              { value: "", label: "Selecione..." },
              ...(orders?.orders?.map((order) => ({
                value: order.id,
                label: `Pedido #${order.code} - ${order.customer?.companyName} - ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(order.totalValue))}`,
              })) || []),
            ]}
          />
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
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!selectedOrderId}
            isLoading={createFromOrderMutation.isPending}
            className="flex-1"
          >
            {createFromOrderMutation.isPending ? "Criando..." : "Criar NFe"}
          </Button>
        </div>
      </div>
    </div>
  );
}
