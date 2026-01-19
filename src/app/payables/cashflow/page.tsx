"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  Loader2,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  Calendar,
  BarChart3,
  Wallet,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type GroupBy = "day" | "week" | "month";

export default function CashflowPage() {
  const [groupBy, setGroupBy] = useState<GroupBy>("day");
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const { data, isLoading, error } = trpc.payables.cashflow.useQuery({
    groupBy,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    if (groupBy === "month") {
      return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    } else if (groupBy === "week") {
      const endDate = new Date(date);
      endDate.setDate(date.getDate() + 6);
      return `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - ${endDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
    }
    return date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/payables" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Fluxo de Caixa Projetado
              </h1>
            </div>
            <CompanySwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">Agrupar por:</span>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              {(["day", "week", "month"] as GroupBy[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupBy(g)}
                  className={`px-3 py-1.5 text-sm ${
                    groupBy === g
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {g === "day" ? "Dia" : g === "week" ? "Semana" : "Mês"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Calculando fluxo de caixa...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Erro ao carregar fluxo de caixa: {error.message}</p>
          </div>
        )}

        {/* Content */}
        {data && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm">Saldo Atual</span>
                </div>
                <p className={`text-xl font-bold ${data.initialBalance >= 0 ? "text-gray-900" : "text-red-600"}`}>
                  {formatCurrency(data.initialBalance)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.bankAccounts.length} conta(s) bancária(s)
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <ArrowUpCircle className="w-4 h-4" />
                  <span className="text-sm">Entradas</span>
                </div>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(data.totalInflows)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Recebimentos previstos</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <ArrowDownCircle className="w-4 h-4" />
                  <span className="text-sm">Saídas</span>
                </div>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(data.totalOutflows)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Pagamentos previstos</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">Saldo Projetado</span>
                </div>
                <p className={`text-xl font-bold ${data.projectedBalance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                  {formatCurrency(data.projectedBalance)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.netCashflow >= 0 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{formatCurrency(data.netCashflow)}
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      {formatCurrency(data.netCashflow)}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Alerta de saldo negativo */}
            {data.negativeDays > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Atenção: Saldo negativo projetado</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Existem {data.negativeDays} período(s) com saldo negativo projetado.
                    O menor saldo será de {formatCurrency(data.lowestBalance)}.
                  </p>
                </div>
              </div>
            )}

            {/* Tabela de Fluxo */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Período
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Entradas
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Saídas
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Saldo
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-10">
                        
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.entries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          Nenhum movimento projetado para o período.
                        </td>
                      </tr>
                    ) : (
                      data.entries.map((entry) => (
                        <>
                          <tr
                            key={entry.date}
                            className={`hover:bg-gray-50 cursor-pointer ${
                              entry.balance < 0 ? "bg-red-50" : ""
                            }`}
                            onClick={() =>
                              setExpandedDate(expandedDate === entry.date ? null : entry.date)
                            }
                          >
                            <td className="px-4 py-3">
                              <span className="font-medium text-gray-900">
                                {formatDate(entry.date)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {entry.inflows > 0 && (
                                <span className="text-green-600 font-medium">
                                  +{formatCurrency(entry.inflows)}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {entry.outflows > 0 && (
                                <span className="text-red-600 font-medium">
                                  -{formatCurrency(entry.outflows)}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`font-bold ${
                                  entry.balance >= 0 ? "text-gray-900" : "text-red-600"
                                }`}
                              >
                                {formatCurrency(entry.balance)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {entry.details.length > 0 && (
                                expandedDate === entry.date ? (
                                  <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                )
                              )}
                            </td>
                          </tr>
                          {expandedDate === entry.date && entry.details.length > 0 && (
                            <tr>
                              <td colSpan={5} className="bg-gray-50 px-4 py-2">
                                <div className="space-y-1">
                                  {entry.details.map((detail, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between text-sm py-1"
                                    >
                                      <div className="flex items-center gap-2">
                                        {detail.type === "in" ? (
                                          <ArrowUpCircle className="w-4 h-4 text-green-500" />
                                        ) : (
                                          <ArrowDownCircle className="w-4 h-4 text-red-500" />
                                        )}
                                        <span className="text-gray-600">{detail.entity}</span>
                                        <span className="text-gray-400">-</span>
                                        <span className="text-gray-500">{detail.description}</span>
                                      </div>
                                      <span
                                        className={
                                          detail.type === "in" ? "text-green-600" : "text-red-600"
                                        }
                                      >
                                        {detail.type === "in" ? "+" : "-"}
                                        {formatCurrency(detail.value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Contas Bancárias */}
            {data.bankAccounts.length > 0 && (
              <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Contas Bancárias
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.bankAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm text-gray-700">{account.name}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(Number(account.currentBalance) || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
