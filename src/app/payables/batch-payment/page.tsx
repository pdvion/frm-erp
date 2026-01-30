"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  Layers,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Filter,
  CreditCard,
  Building2,
  Search,
} from "lucide-react";

type FilterPeriod = "overdue" | "week" | "month" | "all";

export default function BatchPaymentPage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    totalPaid: number;
    successCount: number;
    failCount: number;
  } | null>(null);

  const { data: stats } = trpc.payables.batchPayStats.useQuery();

  const getDateFilter = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filterPeriod) {
      case "overdue":
        return { dueDateTo: today };
      case "week": {
        const endOfWeek = new Date(today);
        endOfWeek.setDate(endOfWeek.getDate() + 7);
        return { dueDateFrom: today, dueDateTo: endOfWeek };
      }
      case "month": {
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { dueDateFrom: today, dueDateTo: endOfMonth };
      }
      default:
        return {};
    }
  };

  const { data: payables, isLoading, refetch } = trpc.payables.listForPayment.useQuery(
    getDateFilter()
  );

  const batchPayMutation = trpc.payables.batchPay.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setSelectedIds(new Set());
      setShowConfirm(false);
      refetch();
    },
  });

  const filteredPayables = useMemo(() => {
    if (!payables) return [];
    if (!supplierSearch) return payables;

    const search = supplierSearch.toLowerCase();
    return payables.filter(
      (p) =>
        p.supplier?.companyName?.toLowerCase().includes(search) ||
        p.supplier?.tradeName?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search)
    );
  }, [payables, supplierSearch]);

  const selectedPayables = useMemo(() => {
    return filteredPayables.filter((p) => selectedIds.has(p.id));
  }, [filteredPayables, selectedIds]);

  const totalSelected = useMemo(() => {
    return selectedPayables.reduce((sum, p) => sum + p.remainingValue, 0);
  }, [selectedPayables]);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPayables.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPayables.map((p) => p.id)));
    }
  };

  const handlePay = () => {
    if (selectedIds.size === 0) return;

    batchPayMutation.mutate({
      payableIds: Array.from(selectedIds),
      paymentDate: new Date(paymentDate),
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pagamento em Lote"
        icon={<Layers className="w-6 h-6" />}
        module="FINANCE"
        breadcrumbs={[
          { label: "Contas a Pagar", href: "/payables" },
          { label: "Pagamento em Lote" },
        ]}
      />

      {/* Resultado do pagamento */}
      {result && (
        <div
          className={`p-4 rounded-lg border ${
            result.success
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-3">
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
            <div>
              <p className="font-medium text-theme">
                {result.successCount} título(s) pago(s) com sucesso
              </p>
              <p className="text-sm text-theme-muted">
                Total: {formatCurrency(result.totalPaid)}
                {result.failCount > 0 && ` | ${result.failCount} falha(s)`}
              </p>
            </div>
            <button
              onClick={() => setResult(null)}
              className="ml-auto text-sm text-theme-muted hover:text-theme"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Cards de estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setFilterPeriod("overdue")}
            className={`p-4 rounded-lg border transition-colors text-left ${
              filterPeriod === "overdue"
                ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                : "bg-theme-card border-theme hover:bg-theme-secondary"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Vencidos</p>
                <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {stats.overdue.count} títulos
                </p>
                <p className="text-sm text-theme-muted">
                  {formatCurrency(stats.overdue.value)}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilterPeriod("week")}
            className={`p-4 rounded-lg border transition-colors text-left ${
              filterPeriod === "week"
                ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700"
                : "bg-theme-card border-theme hover:bg-theme-secondary"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Calendar className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Esta Semana</p>
                <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                  {stats.thisWeek.count} títulos
                </p>
                <p className="text-sm text-theme-muted">
                  {formatCurrency(stats.thisWeek.value)}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilterPeriod("month")}
            className={`p-4 rounded-lg border transition-colors text-left ${
              filterPeriod === "month"
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                : "bg-theme-card border-theme hover:bg-theme-secondary"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Este Mês</p>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {stats.thisMonth.count} títulos
                </p>
                <p className="text-sm text-theme-muted">
                  {formatCurrency(stats.thisMonth.value)}
                </p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Filtros e ações */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <input
                type="text"
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                placeholder="Buscar fornecedor..."
                className="pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme w-64"
              />
            </div>

            <button
              onClick={() => setFilterPeriod("all")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                filterPeriod === "all"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-theme text-theme hover:bg-theme-secondary"
              }`}
            >
              <Filter className="w-4 h-4" />
              Todos
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-theme-muted" />
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
              />
            </div>

            <button
              onClick={() => setShowConfirm(true)}
              disabled={selectedIds.size === 0 || batchPayMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Pagar {selectedIds.size > 0 && `(${selectedIds.size})`}
            </button>
          </div>
        </div>
      </div>

      {/* Resumo da seleção */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-theme">
                <strong>{selectedIds.size}</strong> título(s) selecionado(s)
              </span>
            </div>
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              Total: {formatCurrency(totalSelected)}
            </div>
          </div>
        </div>
      )}

      {/* Tabela de títulos */}
      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-theme-secondary">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      filteredPayables.length > 0 &&
                      selectedIds.size === filteredPayables.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-theme-input"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                  Fornecedor
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                  Descrição
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                  Vencimento
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-theme-muted">
                  Valor
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-theme-muted">
                  Saldo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-theme-muted">
                    Carregando...
                  </td>
                </tr>
              ) : filteredPayables.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-theme-muted">
                    Nenhum título pendente encontrado
                  </td>
                </tr>
              ) : (
                filteredPayables.map((payable) => (
                  <tr
                    key={payable.id}
                    className={`hover:bg-theme-secondary transition-colors ${
                      selectedIds.has(payable.id) ? "bg-blue-50 dark:bg-blue-900/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(payable.id)}
                        onChange={() => toggleSelect(payable.id)}
                        className="w-4 h-4 rounded border-theme-input"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-theme-muted" />
                        <span className="text-theme font-medium">
                          {payable.supplier?.companyName || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-theme">
                      {payable.description}
                      {payable.documentNumber && (
                        <span className="text-sm text-theme-muted ml-2">
                          ({payable.documentNumber})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            payable.isOverdue
                              ? "text-red-600 dark:text-red-400 font-medium"
                              : "text-theme"
                          }
                        >
                          {formatDate(payable.dueDate)}
                        </span>
                        {payable.isOverdue && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                            {payable.daysOverdue}d
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-theme">
                      {formatCurrency(payable.netValue)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-theme">
                      {formatCurrency(payable.remainingValue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmação */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card border border-theme rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-theme mb-4">
              Confirmar Pagamento em Lote
            </h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-theme-muted">Títulos selecionados:</span>
                <span className="text-theme font-medium">{selectedIds.size}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-theme-muted">Data do pagamento:</span>
                <span className="text-theme font-medium">
                  {formatDate(paymentDate)}
                </span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t border-theme">
                <span className="text-theme">Total a pagar:</span>
                <span className="text-green-600 dark:text-green-400 font-bold">
                  {formatCurrency(totalSelected)}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-theme rounded-lg text-theme hover:bg-theme-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePay}
                disabled={batchPayMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {batchPayMutation.isPending ? "Processando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
