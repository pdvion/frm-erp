"use client";

import Link from "next/link";
import { 
  FileText, BarChart3, Users, Calendar,
  Loader2, Clock, Download
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { trpc } from "@/lib/trpc";
import { SimpleBarChart, ChartCard } from "@/components/charts";

export default function ReportsDashboardPage() {
  const { data: kpis, isLoading } = trpc.dashboard.reportsKpis.useQuery();

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard de Relatórios"
          subtitle="Visão geral do módulo de relatórios"
          icon={<FileText className="w-6 h-6" />}
          module="reports"
          actions={
            <Link
              href="/reports"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Ver Relatórios
            </Link>
          }
        />

        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total de Relatórios */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Total Gerados</p>
                <p className="text-2xl font-bold text-theme">{kpis?.generated.total || 0}</p>
              </div>
            </div>
            <div className="text-sm text-theme-muted">
              Relatórios gerados desde o início
            </div>
          </div>

          {/* Relatórios Hoje */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Hoje</p>
                <p className="text-2xl font-bold text-green-600">{kpis?.generated.today || 0}</p>
              </div>
            </div>
            <div className="text-sm text-theme-muted">
              Relatórios gerados hoje
            </div>
          </div>

          {/* Relatórios na Semana */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Esta Semana</p>
                <p className="text-2xl font-bold text-blue-600">{kpis?.generated.week || 0}</p>
              </div>
            </div>
            <div className="text-sm text-theme-muted">
              Últimos 7 dias
            </div>
          </div>

          {/* Relatórios no Mês */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Este Mês</p>
                <p className="text-2xl font-bold text-purple-600">{kpis?.generated.month || 0}</p>
              </div>
            </div>
            <div className="text-sm text-theme-muted">
              Últimos 30 dias
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Relatórios por Tipo */}
          <ChartCard 
            title="Relatórios por Tipo" 
            subtitle="Últimos 30 dias"
          >
            <SimpleBarChart
              data={kpis?.byType || []}
              dataKeys={[
                { key: "count", color: "#6366F1" },
              ]}
              height={250}
            />
          </ChartCard>

          {/* Relatórios por Usuário */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-theme">Top Usuários</h3>
              <p className="text-sm text-theme-muted">Últimos 30 dias</p>
            </div>
            <div className="space-y-4">
              {kpis?.byUser.map((user, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-theme">{user.name}</p>
                    <div className="w-full bg-theme-tertiary rounded-full h-2 mt-1">
                      <div 
                        className="h-2 rounded-full bg-indigo-500"
                        style={{ width: `${Math.min((user.count / (kpis?.byUser[0]?.count || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-semibold text-theme">{user.count}</span>
                </div>
              ))}
              {(!kpis?.byUser || kpis.byUser.length === 0) && (
                <div className="py-8 text-center text-theme-muted">
                  Nenhum relatório gerado nos últimos 30 dias
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Relatórios Disponíveis */}
        <div className="bg-theme-card rounded-xl border border-theme p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-theme">Relatórios Disponíveis</h3>
            <p className="text-sm text-theme-muted">Acesso rápido aos relatórios mais utilizados</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Vendas por Período", href: "/reports/sales", icon: "📊" },
              { name: "Compras por Fornecedor", href: "/reports/purchases", icon: "🛒" },
              { name: "Estoque Atual", href: "/reports/inventory", icon: "📦" },
              { name: "Contas a Pagar", href: "/reports/payables", icon: "💰" },
              { name: "Contas a Receber", href: "/reports/receivables", icon: "💵" },
              { name: "Produção Mensal", href: "/reports/production", icon: "🏭" },
              { name: "Livro Fiscal", href: "/reports/fiscal", icon: "📋" },
              { name: "Folha de Pagamento", href: "/reports/payroll", icon: "👥" },
              { name: "Auditoria", href: "/reports/audit", icon: "🔍" },
            ].map((report, index) => (
              <Link
                key={index}
                href={report.href}
                className="flex items-center gap-3 p-4 bg-theme-hover rounded-lg hover:bg-theme-tertiary dark:hover:bg-theme-secondary transition-colors"
              >
                <span className="text-2xl">{report.icon}</span>
                <span className="font-medium text-theme">{report.name}</span>
                <Download className="w-4 h-4 text-theme-muted ml-auto" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
