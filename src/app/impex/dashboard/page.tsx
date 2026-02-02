"use client";

import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  Ship,
  Loader2,
  Package,
  DollarSign,
  Banknote,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
} from "lucide-react";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Rascunho", color: "bg-theme-tertiary text-theme-secondary" },
  PENDING_SHIPMENT: { label: "Aguardando Embarque", color: "bg-yellow-100 text-yellow-700" },
  IN_TRANSIT: { label: "Em Trânsito", color: "bg-blue-100 text-blue-700" },
  ARRIVED: { label: "Chegou", color: "bg-purple-100 text-purple-700" },
  IN_CLEARANCE: { label: "Em Desembaraço", color: "bg-orange-100 text-orange-700" },
  CLEARED: { label: "Desembaraçado", color: "bg-green-100 text-green-700" },
  DELIVERED: { label: "Entregue", color: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

export default function ImpExDashboardPage() {
  const { data, isLoading } = trpc.impex.getDashboardData.useQuery();

  const formatCurrency = (value: number, currency = "USD") => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(value);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard de Importação"
        icon={<Ship className="w-6 h-6" />}
        module="PURCHASES"
        breadcrumbs={[
          { label: "ImpEx", href: "/impex" },
          { label: "Dashboard" },
        ]}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-theme-card border border-theme rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-theme-muted">Processos Ativos</p>
              <p className="text-2xl font-bold text-theme">{data?.kpis.activeProcesses || 0}</p>
              <p className="text-xs text-theme-muted">de {data?.kpis.totalProcesses || 0} total</p>
            </div>
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-theme-muted">Valor em Trânsito</p>
              <p className="text-2xl font-bold text-theme">
                {formatCurrency(data?.kpis.totalValueInTransit || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Banknote className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-theme-muted">Câmbio em Aberto</p>
              <p className="text-2xl font-bold text-theme">
                {formatCurrency(data?.kpis.totalExchangeOpen || 0)}
              </p>
              <p className="text-xs text-theme-muted">
                {data?.kpis.openExchangeContracts || 0} contratos
              </p>
            </div>
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-lg p-4">
          <div className="flex items-center gap-3">
            {(data?.kpis.totalExchangeVariation || 0) > 0 ? (
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            ) : (data?.kpis.totalExchangeVariation || 0) < 0 ? (
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            ) : (
              <div className="p-2 bg-theme-tertiary rounded-lg">
                <Banknote className="w-5 h-5 text-theme-secondary" />
              </div>
            )}
            <div>
              <p className="text-sm text-theme-muted">Variação Cambial</p>
              <p
                className={`text-2xl font-bold ${
                  (data?.kpis.totalExchangeVariation || 0) > 0
                    ? "text-red-600"
                    : (data?.kpis.totalExchangeVariation || 0) < 0
                      ? "text-green-600"
                      : "text-theme"
                }`}
              >
                {formatCurrency(Math.abs(data?.kpis.totalExchangeVariation || 0), "BRL")}
              </p>
              <p className="text-xs text-theme-muted">
                {(data?.kpis.totalExchangeVariation || 0) > 0 ? "Perda" : (data?.kpis.totalExchangeVariation || 0) < 0 ? "Ganho" : "Neutro"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {(data?.kpis.expiredContracts || 0) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-medium text-red-800">Atenção: Contratos de câmbio vencidos</p>
            <p className="text-sm text-red-600">
              Você tem {data?.kpis.expiredContracts} contrato(s) de câmbio vencido(s).{" "}
              <Link href="/impex/exchange" className="underline">
                Ver contratos
              </Link>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status dos Processos */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="font-semibold text-theme mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Processos por Status
          </h3>
          <div className="space-y-3">
            {Object.entries(data?.statusBreakdown || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      STATUS_LABELS[status]?.color || "bg-theme-tertiary text-theme-secondary"
                    }`}
                  >
                    {STATUS_LABELS[status]?.label || status}
                  </span>
                </div>
                <span className="font-medium text-theme">{count as number}</span>
              </div>
            ))}
            {Object.keys(data?.statusBreakdown || {}).length === 0 && (
              <p className="text-theme-muted text-center py-4">Nenhum processo cadastrado</p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-theme">
            <Link
              href="/impex/processes"
              className="text-blue-600 hover:underline text-sm"
            >
              Ver todos os processos →
            </Link>
          </div>
        </div>

        {/* Próximas Chegadas */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="font-semibold text-theme mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Próximas Chegadas
          </h3>
          <div className="space-y-3">
            {data?.upcomingArrivals?.map((arrival) => (
              <Link
                key={arrival.id}
                href={`/impex/processes/${arrival.id}`}
                className="flex items-center justify-between p-3 bg-theme-secondary rounded-lg hover:bg-theme-secondary/80"
              >
                <div>
                  <p className="font-medium text-theme">{arrival.processNumber}</p>
                  <p className="text-sm text-theme-muted">{arrival.supplier}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-theme">{arrival.destinationPort}</p>
                  <p className="text-xs text-theme-muted">ETA: {formatDate(arrival.eta)}</p>
                </div>
              </Link>
            ))}
            {(!data?.upcomingArrivals || data.upcomingArrivals.length === 0) && (
              <p className="text-theme-muted text-center py-4">Nenhuma chegada prevista</p>
            )}
          </div>
        </div>

        {/* Processos Recentes */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="font-semibold text-theme mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Processos Recentes
          </h3>
          <div className="space-y-3">
            {data?.recentProcesses?.map((process) => (
              <Link
                key={process.id}
                href={`/impex/processes/${process.id}`}
                className="flex items-center justify-between p-3 bg-theme-secondary rounded-lg hover:bg-theme-secondary/80"
              >
                <div>
                  <p className="font-medium text-theme">{process.processNumber}</p>
                  <p className="text-sm text-theme-muted">{process.supplier}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      STATUS_LABELS[process.status]?.color || "bg-theme-tertiary text-theme-secondary"
                    }`}
                  >
                    {STATUS_LABELS[process.status]?.label || process.status}
                  </span>
                  <p className="text-sm text-theme mt-1">
                    {formatCurrency(process.fobValue, process.currency ?? undefined)}
                  </p>
                </div>
              </Link>
            ))}
            {(!data?.recentProcesses || data.recentProcesses.length === 0) && (
              <p className="text-theme-muted text-center py-4">Nenhum processo recente</p>
            )}
          </div>
        </div>

        {/* Links Rápidos */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="font-semibold text-theme mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/impex/processes/new"
              className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center hover:bg-blue-100"
            >
              <Package className="w-6 h-6 mx-auto text-blue-600 mb-2" />
              <p className="text-sm font-medium text-blue-700">Novo Processo</p>
            </Link>
            <Link
              href="/impex/exchange/new"
              className="p-4 bg-green-50 border border-green-200 rounded-lg text-center hover:bg-green-100"
            >
              <Banknote className="w-6 h-6 mx-auto text-green-600 mb-2" />
              <p className="text-sm font-medium text-green-700">Novo Contrato</p>
            </Link>
            <Link
              href="/impex/reports"
              className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center hover:bg-purple-100"
            >
              <TrendingUp className="w-6 h-6 mx-auto text-purple-600 mb-2" />
              <p className="text-sm font-medium text-purple-700">Relatórios</p>
            </Link>
            <Link
              href="/impex"
              className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center hover:bg-orange-100"
            >
              <Ship className="w-6 h-6 mx-auto text-orange-600 mb-2" />
              <p className="text-sm font-medium text-orange-700">Cadastros</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
