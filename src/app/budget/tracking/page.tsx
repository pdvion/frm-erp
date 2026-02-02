"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/formatters";
import { toNumber } from "@/lib/precision";

export default function BudgetTrackingPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: dashboard, isLoading } = trpc.budget.getDashboard.useQuery({ year });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OK": return "text-green-600 bg-green-100 dark:bg-green-900/30";
      case "WARNING": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
      case "EXCEEDED": return "text-red-600 bg-red-100 dark:bg-red-900/30";
      default: return "text-theme-secondary bg-theme-tertiary dark:bg-theme/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OK": return <CheckCircle2 className="w-4 h-4" />;
      case "WARNING": return <AlertTriangle className="w-4 h-4" />;
      case "EXCEEDED": return <TrendingDown className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Acompanhamento Orçamentário"
        icon={<TrendingUp className="w-6 h-6" />}
        module="BUDGET"
        breadcrumbs={[
          { label: "Orçamento", href: "/budget" },
          { label: "Acompanhamento" },
        ]}
      />

      {/* Filtro de ano */}
      <div className="flex gap-2">
        {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`px-4 py-2 rounded-lg text-sm ${year === y ? "bg-blue-600 text-white" : "bg-theme-card border border-theme text-theme"}`}
          >
            {y}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="bg-theme-card border border-theme rounded-lg p-8 text-center text-theme-muted">
          Carregando...
        </div>
      ) : dashboard?.version ? (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-theme-card border border-theme rounded-lg p-4">
              <p className="text-sm text-theme-muted">Orçado</p>
              <p className="text-2xl font-bold text-theme">{formatCurrency(dashboard.summary.budgeted)}</p>
            </div>
            <div className="bg-theme-card border border-theme rounded-lg p-4">
              <p className="text-sm text-theme-muted">Realizado</p>
              <p className="text-2xl font-bold text-theme">{formatCurrency(dashboard.summary.actual)}</p>
            </div>
            <div className="bg-theme-card border border-theme rounded-lg p-4">
              <p className="text-sm text-theme-muted">Variação</p>
              <p className={`text-2xl font-bold ${dashboard.summary.variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(dashboard.summary.variance)}
              </p>
            </div>
            <div className="bg-theme-card border border-theme rounded-lg p-4">
              <p className="text-sm text-theme-muted">% Variação</p>
              <p className={`text-2xl font-bold ${dashboard.summary.variancePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                {dashboard.summary.variancePercent.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Tabela por conta */}
          <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
            <div className="p-4 border-b border-theme">
              <h3 className="font-semibold text-theme">
                {dashboard.version.name} - {dashboard.version.type}
              </h3>
            </div>
            <table className="w-full">
              <thead className="bg-theme-hover">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-theme">Conta</th>
                  <th className="text-right p-3 text-sm font-medium text-theme">Orçado</th>
                  <th className="text-right p-3 text-sm font-medium text-theme">Realizado</th>
                  <th className="text-right p-3 text-sm font-medium text-theme">Variação</th>
                  <th className="text-right p-3 text-sm font-medium text-theme">%</th>
                  <th className="text-center p-3 text-sm font-medium text-theme">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {dashboard.byAccount.map((account) => (
                  <tr key={account.id} className="hover:bg-theme-hover">
                    <td className="p-3 text-sm text-theme">
                      <span className="font-mono text-xs text-theme-muted mr-2">{account.code}</span>
                      {account.name}
                    </td>
                    <td className="p-3 text-right text-sm text-theme">{formatCurrency(toNumber(account.budgeted))}</td>
                    <td className="p-3 text-right text-sm text-theme">{formatCurrency(toNumber(account.actual))}</td>
                    <td className={`p-3 text-right text-sm ${account.variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(account.variance)}
                    </td>
                    <td className={`p-3 text-right text-sm ${account.variancePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {account.variancePercent.toFixed(1)}%
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getStatusColor(account.status)}`}>
                        {getStatusIcon(account.status)}
                        {account.status === "OK" ? "OK" : account.status === "WARNING" ? "Atenção" : "Excedido"}
                      </span>
                    </td>
                  </tr>
                ))}
                {dashboard.byAccount.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-theme-muted">
                      Nenhum dado orçamentário para o período
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-theme-card border border-theme rounded-lg p-8 text-center text-theme-muted">
          <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma versão de orçamento encontrada para {year}</p>
        </div>
      )}

      <div className="flex gap-4">
        <Link href="/budget" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Voltar para Orçamento
        </Link>
      </div>
    </div>
  );
}
