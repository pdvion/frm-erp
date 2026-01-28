"use client";

import { use, useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  Banknote,
  Edit,
  Loader2,
  Calendar,
  DollarSign,
  Building2,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Aberto", color: "bg-blue-100 text-blue-700" },
  PARTIALLY_LIQUIDATED: { label: "Parcialmente Liquidado", color: "bg-yellow-100 text-yellow-700" },
  LIQUIDATED: { label: "Liquidado", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

export default function ExchangeContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [showLiquidateForm, setShowLiquidateForm] = useState(false);
  const [liquidationData, setLiquidationData] = useState({
    foreignValue: 0,
    liquidationRate: 0,
    liquidationDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const { data: contract, isLoading, refetch } = trpc.impex.getExchangeContract.useQuery({ id });

  const liquidateMutation = trpc.impex.liquidateContract.useMutation({
    onSuccess: () => {
      setShowLiquidateForm(false);
      setLiquidationData({
        foreignValue: 0,
        liquidationRate: 0,
        liquidationDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
      refetch();
    },
    onError: (error) => {
      alert(`Erro ao liquidar contrato: ${error.message}`);
    },
  });

  const formatCurrency = (value: number | string | null | undefined, currency = "BRL") => {
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

  const handleLiquidate = (e: React.FormEvent) => {
    e.preventDefault();
    liquidateMutation.mutate({
      contractId: id,
      foreignValue: liquidationData.foreignValue,
      liquidationRate: liquidationData.liquidationRate,
      liquidationDate: liquidationData.liquidationDate,
      notes: liquidationData.notes || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-theme">Contrato não encontrado</h2>
        <Link href="/impex/exchange" className="text-blue-600 hover:underline mt-2 inline-block">
          Voltar para lista
        </Link>
      </div>
    );
  }

  const remainingValue = Number(contract.foreignValue) - Number(contract.liquidatedValue || 0);
  const isExpired = new Date(contract.maturityDate) < new Date();
  const canLiquidate = contract.status === "OPEN" || contract.status === "PARTIALLY_LIQUIDATED";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Contrato ${contract.contractNumber}`}
        icon={<Banknote className="w-6 h-6" />}
        module="PURCHASES"
        breadcrumbs={[
          { label: "ImpEx", href: "/impex" },
          { label: "Câmbio", href: "/impex/exchange" },
          { label: contract.contractNumber },
        ]}
        actions={
          <div className="flex gap-2">
            {canLiquidate && (
              <button
                onClick={() => setShowLiquidateForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                Liquidar
              </button>
            )}
            <Link
              href={`/impex/exchange/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-theme-card border border-theme rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-theme">Informações do Contrato</h3>
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  STATUS_LABELS[contract.status]?.color || "bg-gray-100 text-gray-700"
                }`}
              >
                {STATUS_LABELS[contract.status]?.label || contract.status}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-theme-muted">Banco</span>
                <p className="text-theme font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {contract.bankAccount?.bankName || contract.bankAccount?.name}
                </p>
              </div>
              <div>
                <span className="text-sm text-theme-muted">Conta</span>
                <p className="text-theme">{contract.bankAccount?.accountNumber || "-"}</p>
              </div>
              {contract.process && (
                <div>
                  <span className="text-sm text-theme-muted">Processo de Importação</span>
                  <Link
                    href={`/impex/processes/${contract.process.id}`}
                    className="text-blue-600 hover:underline block"
                  >
                    {contract.process.processNumber}
                  </Link>
                  <p className="text-xs text-theme-muted">{contract.process.supplier?.companyName}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-theme-card border border-theme rounded-lg p-6">
            <h3 className="font-semibold text-theme mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Valores
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-theme-secondary rounded-lg">
                <p className="text-sm text-theme-muted">Valor Contratado</p>
                <p className="text-xl font-bold text-theme">
                  {formatCurrency(Number(contract.foreignValue), contract.foreignCurrency)}
                </p>
              </div>
              <div className="p-4 bg-theme-secondary rounded-lg">
                <p className="text-sm text-theme-muted">Taxa Contratada</p>
                <p className="text-xl font-bold text-theme">{formatRate(Number(contract.contractRate))}</p>
              </div>
              <div className="p-4 bg-theme-secondary rounded-lg">
                <p className="text-sm text-theme-muted">Valor em BRL</p>
                <p className="text-xl font-bold text-theme">
                  {formatCurrency(Number(contract.brlValue), "BRL")}
                </p>
              </div>
              <div className="p-4 bg-theme-secondary rounded-lg">
                <p className="text-sm text-theme-muted">Saldo a Liquidar</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(remainingValue, contract.foreignCurrency)}
                </p>
              </div>
            </div>

            {contract.exchangeVariation && Number(contract.exchangeVariation) !== 0 && (
              <div className="mt-4 p-4 rounded-lg border border-theme">
                <div className="flex items-center gap-3">
                  {Number(contract.exchangeVariation) > 0 ? (
                    <TrendingDown className="w-6 h-6 text-red-500" />
                  ) : (
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  )}
                  <div>
                    <p className="text-sm text-theme-muted">Variação Cambial Total</p>
                    <p
                      className={`text-xl font-bold ${
                        Number(contract.exchangeVariation) > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {formatCurrency(Math.abs(Number(contract.exchangeVariation)), "BRL")}
                    </p>
                    <p className="text-xs text-theme-muted">
                      {Number(contract.exchangeVariation) > 0 ? "Perda cambial" : "Ganho cambial"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-theme-card border border-theme rounded-lg p-6">
            <h3 className="font-semibold text-theme mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Histórico de Liquidações ({contract.liquidations?.length || 0})
            </h3>
            {contract.liquidations?.length ? (
              <div className="space-y-3">
                {contract.liquidations.map((liq) => (
                  <div
                    key={liq.id}
                    className="flex items-center justify-between p-4 bg-theme-secondary rounded-lg"
                  >
                    <div>
                      <p className="text-theme font-medium">
                        {formatCurrency(Number(liq.foreignValue), contract.foreignCurrency)} @ {formatRate(Number(liq.liquidationRate))}
                      </p>
                      <p className="text-sm text-theme-muted">{formatDate(liq.liquidationDate)}</p>
                      {liq.notes && <p className="text-xs text-theme-muted mt-1">{liq.notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-theme">{formatCurrency(Number(liq.brlValue), "BRL")}</p>
                      <p
                        className={`text-sm font-medium ${
                          Number(liq.variation) > 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {Number(liq.variation) > 0 ? "+" : ""}
                        {formatCurrency(Number(liq.variation), "BRL")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-theme-muted text-center py-4">Nenhuma liquidação realizada</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-theme-card border border-theme rounded-lg p-6">
            <h3 className="font-semibold text-theme mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Datas
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-theme-muted">Contrato</span>
                <span className="text-theme">{formatDate(contract.contractDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Vencimento</span>
                <span className={`font-medium ${isExpired ? "text-red-600" : "text-theme"}`}>
                  {formatDate(contract.maturityDate)}
                  {isExpired && (
                    <AlertTriangle className="w-4 h-4 inline ml-1 text-red-500" />
                  )}
                </span>
              </div>
              {contract.liquidationDate && (
                <div className="flex justify-between">
                  <span className="text-theme-muted">Última Liquidação</span>
                  <span className="text-theme">{formatDate(contract.liquidationDate)}</span>
                </div>
              )}
            </div>
          </div>

          {contract.notes && (
            <div className="bg-theme-card border border-theme rounded-lg p-6">
              <h3 className="font-semibold text-theme mb-4">Observações</h3>
              <p className="text-sm text-theme whitespace-pre-wrap">{contract.notes}</p>
            </div>
          )}
        </div>
      </div>

      {showLiquidateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card border border-theme rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-theme mb-4">Liquidar Contrato</h3>
            <form onSubmit={handleLiquidate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Valor a Liquidar ({contract.foreignCurrency}) *
                </label>
                <input
                  type="number"
                  value={liquidationData.foreignValue}
                  onChange={(e) =>
                    setLiquidationData((prev) => ({
                      ...prev,
                      foreignValue: parseFloat(e.target.value) || 0,
                    }))
                  }
                  required
                  min="0"
                  max={remainingValue}
                  step="0.01"
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
                />
                <p className="text-xs text-theme-muted mt-1">
                  Saldo disponível: {formatCurrency(remainingValue, contract.foreignCurrency)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Taxa de Liquidação *
                </label>
                <input
                  type="number"
                  value={liquidationData.liquidationRate}
                  onChange={(e) =>
                    setLiquidationData((prev) => ({
                      ...prev,
                      liquidationRate: parseFloat(e.target.value) || 0,
                    }))
                  }
                  required
                  min="0"
                  step="0.0001"
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
                />
                <p className="text-xs text-theme-muted mt-1">
                  Taxa contratada: {formatRate(Number(contract.contractRate))}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Data da Liquidação *
                </label>
                <input
                  type="date"
                  value={liquidationData.liquidationDate}
                  onChange={(e) =>
                    setLiquidationData((prev) => ({
                      ...prev,
                      liquidationDate: e.target.value,
                    }))
                  }
                  required
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Observações</label>
                <textarea
                  value={liquidationData.notes}
                  onChange={(e) =>
                    setLiquidationData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
                />
              </div>

              {liquidationData.foreignValue > 0 && liquidationData.liquidationRate > 0 && (
                <div className="p-3 bg-theme-secondary rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-theme-muted">Valor em BRL:</span>
                    <span className="text-theme font-medium">
                      {formatCurrency(
                        liquidationData.foreignValue * liquidationData.liquidationRate,
                        "BRL"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-theme-muted">Variação:</span>
                    <span
                      className={`font-medium ${
                        liquidationData.liquidationRate > Number(contract.contractRate)
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {formatCurrency(
                        liquidationData.foreignValue *
                          (liquidationData.liquidationRate - Number(contract.contractRate)),
                        "BRL"
                      )}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLiquidateForm(false)}
                  className="px-4 py-2 border border-theme rounded-lg hover:bg-theme-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={liquidateMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {liquidateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Confirmar Liquidação
                </button>
              </div>

              {liquidateMutation.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {liquidateMutation.error.message}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
