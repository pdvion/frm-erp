"use client";

import Link from "next/link";
import { 
  FileText, Receipt, Calculator, TrendingUp,
  ArrowRight, Loader2, BarChart3, AlertTriangle
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { SimpleBarChart, ChartCard } from "@/components/charts";

export default function FiscalDashboardPage() {
  const { data: kpis, isLoading } = trpc.dashboard.fiscalKpis.useQuery();

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-theme">Dashboard Fiscal</h1>
            <p className="text-theme-muted">Visão geral do módulo fiscal</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/invoices"
              className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-card border border-theme rounded-lg hover:bg-theme-hover"
            >
              NFes Recebidas
            </Link>
            <Link
              href="/billing"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              NFes Emitidas
            </Link>
          </div>
        </div>

        {/* Alertas */}
        {(kpis?.received.pending || 0) > 0 && (
          <Link
            href="/invoices?status=PENDING"
            className="flex items-center gap-3 p-4 rounded-lg border bg-yellow-50 border-yellow-200 text-yellow-800"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-medium">NFes Pendentes:</span>{" "}
              {kpis?.received.pending} notas aguardando validação
            </div>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}

        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* NFes Recebidas */}
          <Link href="/invoices" className="bg-theme-card rounded-xl border border-theme p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">NFes Recebidas</p>
                <p className="text-2xl font-bold text-theme">{kpis?.received.total || 0}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-muted">Pendentes</span>
                <span className="font-medium text-yellow-600">{kpis?.received.pending || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Validadas</span>
                <span className="font-medium text-blue-600">{kpis?.received.validated || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Aprovadas</span>
                <span className="font-medium text-green-600">{kpis?.received.approved || 0}</span>
              </div>
            </div>
          </Link>

          {/* NFes Emitidas */}
          <Link href="/billing" className="bg-theme-card rounded-xl border border-theme p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">NFes Emitidas</p>
                <p className="text-2xl font-bold text-theme">{kpis?.issued.total || 0}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-muted">Autorizadas</span>
                <span className="font-medium text-green-600">{kpis?.issued.authorized || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Canceladas</span>
                <span className="font-medium text-red-600">{kpis?.issued.cancelled || 0}</span>
              </div>
            </div>
          </Link>

          {/* Movimento do Mês */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Movimento do Mês</p>
                <p className="text-2xl font-bold text-theme">{(kpis?.received.monthCount || 0) + (kpis?.issued.monthCount || 0)}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-muted">Entradas</span>
                <span className="font-medium text-blue-600">{formatCurrency(kpis?.received.monthValue || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Saídas</span>
                <span className="font-medium text-green-600">{formatCurrency(kpis?.issued.monthValue || 0)}</span>
              </div>
            </div>
          </div>

          {/* Impostos do Mês */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Impostos (Entradas)</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(kpis?.taxes.total || 0)}
                </p>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-muted">ICMS</span>
                <span className="font-medium">{formatCurrency(kpis?.taxes.icms || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">IPI</span>
                <span className="font-medium">{formatCurrency(kpis?.taxes.ipi || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">PIS/COFINS</span>
                <span className="font-medium">{formatCurrency((kpis?.taxes.pis || 0) + (kpis?.taxes.cofins || 0))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evolução de NFes */}
          <ChartCard 
            title="Evolução de NFes" 
            subtitle="Últimos 6 meses"
            actions={
              <Link href="/reports/fiscal" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                Ver relatório
              </Link>
            }
          >
            <SimpleBarChart
              data={kpis?.nfesEvolution || []}
              dataKeys={[
                { key: "Recebidas", color: "#3B82F6" },
                { key: "Emitidas", color: "#10B981" },
              ]}
              height={250}
            />
          </ChartCard>

          {/* Resumo de Impostos */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-theme">Impostos por Tipo</h3>
              <p className="text-sm text-theme-muted">Baseado em NFes de entrada do mês</p>
            </div>
            <div className="space-y-4">
              {[
                { name: "ICMS", value: kpis?.taxes.icms || 0, color: "bg-blue-500" },
                { name: "IPI", value: kpis?.taxes.ipi || 0, color: "bg-green-500" },
                { name: "PIS", value: kpis?.taxes.pis || 0, color: "bg-yellow-500" },
                { name: "COFINS", value: kpis?.taxes.cofins || 0, color: "bg-red-500" },
              ].map((tax, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${tax.color}`} />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-theme">{tax.name}</span>
                      <span className="text-theme-secondary">{formatCurrency(tax.value)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${tax.color}`}
                        style={{ width: `${kpis?.taxes.total ? (tax.value / kpis.taxes.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/invoices/import"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Importar NFe</p>
              <p className="text-sm text-theme-muted">Upload de XML</p>
            </div>
          </Link>

          <Link
            href="/billing/new"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Emitir NFe</p>
              <p className="text-sm text-theme-muted">Nova nota fiscal</p>
            </div>
          </Link>

          <Link
            href="/fiscal/sped"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calculator className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-theme">SPED</p>
              <p className="text-sm text-theme-muted">Gerar arquivos</p>
            </div>
          </Link>

          <Link
            href="/reports/fiscal"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Relatórios</p>
              <p className="text-sm text-theme-muted">Livros fiscais</p>
            </div>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
