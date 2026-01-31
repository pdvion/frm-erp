"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  Banknote,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { TableSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Aberto", color: "bg-blue-100 text-blue-700" },
  PARTIALLY_LIQUIDATED: { label: "Parcialmente Liquidado", color: "bg-yellow-100 text-yellow-700" },
  LIQUIDATED: { label: "Liquidado", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

type StatusKey = keyof typeof STATUS_LABELS;

export default function ExchangeContractsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusKey | "">("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, refetch } = trpc.impex.listExchangeContracts.useQuery({
    search: search || undefined,
    status: (statusFilter || undefined) as "OPEN" | "PARTIALLY_LIQUIDATED" | "LIQUIDATED" | "CANCELLED" | undefined,
    page,
    limit,
  });

  const contracts = data?.items;
  const pagination = data?.pagination;

  const { data: summary } = trpc.impex.getExchangeSummary.useQuery();

  const deleteMutation = trpc.impex.deleteExchangeContract.useMutation({
    onSuccess: () => refetch(),
    onError: (error) => alert(`Erro ao excluir contrato: ${error.message}`),
  });

  const formatCurrency = (value: number | string | null | undefined, currency = "USD") => {
    if (value === null || value === undefined) return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(num);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatRate = (rate: number | string | null | undefined) => {
    if (rate === null || rate === undefined) return "-";
    const num = typeof rate === "string" ? parseFloat(rate) : rate;
    return num.toFixed(4);
  };

  const isExpired = (date: Date | string) => {
    return new Date(date) < new Date();
  };

  const isExpiringSoon = (date: Date | string) => {
    const maturity = new Date(date);
    const today = new Date();
    const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return maturity > today && maturity <= thirtyDays;
  };

  const handleDelete = (id: string, contractNumber: string) => {
    if (confirm(`Deseja excluir o contrato ${contractNumber}?`)) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contratos de Câmbio"
        icon={<Banknote className="w-6 h-6" />}
        module="PURCHASES"
        breadcrumbs={[
          { label: "ImpEx", href: "/impex" },
          { label: "Câmbio" },
        ]}
        actions={
          <Link
            href="/impex/exchange/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Contrato
          </Link>
        }
      />

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <p className="text-sm text-theme-muted">Contratos Abertos</p>
            <p className="text-2xl font-bold text-theme">{summary.openContracts}</p>
          </div>
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <p className="text-sm text-theme-muted">Total em Aberto (USD)</p>
            <p className="text-2xl font-bold text-theme">
              {formatCurrency(summary.totalForeignOpen, "USD")}
            </p>
          </div>
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <p className="text-sm text-theme-muted">Variação Cambial</p>
            <div className="flex items-center gap-2">
              {summary.totalVariation > 0 ? (
                <TrendingDown className="w-5 h-5 text-red-500" />
              ) : summary.totalVariation < 0 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : null}
              <p className={`text-2xl font-bold ${summary.totalVariation > 0 ? "text-red-600" : summary.totalVariation < 0 ? "text-green-600" : "text-theme"}`}>
                {formatCurrency(Math.abs(summary.totalVariation), "BRL")}
              </p>
            </div>
            <p className="text-xs text-theme-muted">
              {summary.totalVariation > 0 ? "Perda" : summary.totalVariation < 0 ? "Ganho" : "Neutro"}
            </p>
          </div>
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <p className="text-sm text-theme-muted">Alertas</p>
            <div className="flex items-center gap-4">
              {summary.expiredContracts > 0 && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-bold">{summary.expiredContracts}</span>
                  <span className="text-xs">vencidos</span>
                </div>
              )}
              {summary.expiringIn30Days > 0 && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <Calendar className="w-4 h-4" />
                  <span className="font-bold">{summary.expiringIn30Days}</span>
                  <span className="text-xs">em 30 dias</span>
                </div>
              )}
              {summary.expiredContracts === 0 && summary.expiringIn30Days === 0 && (
                <p className="text-green-600 font-medium">Nenhum alerta</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <input
              type="text"
              placeholder="Buscar por número do contrato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-theme rounded-lg hover:bg-theme-secondary"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-theme grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusKey | "")}
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              >
                <option value="">Todos</option>
                {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} columns={8} />
      ) : !contracts?.length ? (
        <div className="bg-theme-card border border-theme rounded-lg p-12 text-center">
          <Banknote className="w-12 h-12 mx-auto text-theme-muted mb-4" />
          <h3 className="text-lg font-medium text-theme mb-2">Nenhum contrato encontrado</h3>
          <p className="text-theme-muted mb-4">
            {search || statusFilter
              ? "Tente ajustar os filtros de busca"
              : "Comece criando seu primeiro contrato de câmbio"}
          </p>
          {!search && !statusFilter && (
            <Link
              href="/impex/exchange/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Novo Contrato
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-theme-secondary">
                <tr>
                  <th className="text-left py-3 px-4 text-theme-muted font-medium">Contrato</th>
                  <th className="text-left py-3 px-4 text-theme-muted font-medium">Banco</th>
                  <th className="text-right py-3 px-4 text-theme-muted font-medium">Valor</th>
                  <th className="text-right py-3 px-4 text-theme-muted font-medium">Taxa</th>
                  <th className="text-center py-3 px-4 text-theme-muted font-medium">Vencimento</th>
                  <th className="text-center py-3 px-4 text-theme-muted font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-theme-muted font-medium">Variação</th>
                  <th className="w-32"></th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.id} className="border-t border-theme hover:bg-theme-secondary/50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-theme">{contract.contractNumber}</p>
                      {contract.process && (
                        <p className="text-xs text-theme-muted">PI: {contract.process.processNumber}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-theme">
                      {contract.bankAccount?.bankName || contract.bankAccount?.name}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <p className="text-theme font-medium">
                        {formatCurrency(Number(contract.foreignValue), contract.foreignCurrency)}
                      </p>
                      <p className="text-xs text-theme-muted">
                        {formatCurrency(Number(contract.brlValue), "BRL")}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right text-theme">
                      {formatRate(Number(contract.contractRate))}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`${
                          isExpired(contract.maturityDate)
                            ? "text-red-600 font-medium"
                            : isExpiringSoon(contract.maturityDate)
                              ? "text-yellow-600"
                              : "text-theme"
                        }`}
                      >
                        {formatDate(contract.maturityDate)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          STATUS_LABELS[contract.status]?.color || "bg-theme-tertiary text-theme-secondary"
                        }`}
                      >
                        {STATUS_LABELS[contract.status]?.label || contract.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {contract.exchangeVariation ? (
                        <span
                          className={`font-medium ${
                            Number(contract.exchangeVariation) > 0
                              ? "text-red-600"
                              : Number(contract.exchangeVariation) < 0
                                ? "text-green-600"
                                : "text-theme"
                          }`}
                        >
                          {formatCurrency(Math.abs(Number(contract.exchangeVariation)), "BRL")}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/impex/exchange/${contract.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/impex/exchange/${contract.id}/edit`}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(contract.id, contract.contractNumber)}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-theme">
              <p className="text-sm text-theme-muted">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} contratos
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-2 border border-theme rounded-lg hover:bg-theme-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-theme px-2">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                  className="p-2 border border-theme rounded-lg hover:bg-theme-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
