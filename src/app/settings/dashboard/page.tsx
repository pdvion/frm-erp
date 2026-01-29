"use client";

import Link from "next/link";
import { 
  Users, Shield, Activity, Settings,
  Loader2, BarChart3, Clock, AlertTriangle
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { trpc } from "@/lib/trpc";
import { SimpleBarChart, ChartCard } from "@/components/charts";

export default function SystemDashboardPage() {
  const { data: kpis, isLoading } = trpc.dashboard.systemKpis.useQuery();

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
        <PageHeader
          title="Dashboard do Sistema"
          subtitle="Visão geral de administração"
          icon={<BarChart3 className="w-6 h-6" />}
          backHref="/settings"
          module="settings"
          actions={
            <div className="flex gap-2">
              <Link
                href="/settings/users"
                className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-card border border-theme rounded-lg hover:bg-theme-hover"
              >
                Usuários
              </Link>
              <Link
                href="/audit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Auditoria
              </Link>
            </div>
          }
        />

        {/* Alertas */}
        {(kpis?.auth.failed || 0) > 5 && (
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-red-50 border-red-200 text-red-800">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-medium">Tentativas de Login Falhas:</span>{" "}
              {kpis?.auth.failed} tentativas nos últimos 30 dias
            </div>
          </div>
        )}

        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Usuários */}
          <Link href="/settings/users" className="bg-theme-card rounded-xl border border-theme p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Usuários</p>
                <p className="text-2xl font-bold text-theme">{kpis?.users.total || 0}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-muted">Ativos</span>
                <span className="font-medium text-green-600">{kpis?.users.active || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Administradores</span>
                <span className="font-medium text-purple-600">{kpis?.users.admins || 0}</span>
              </div>
            </div>
          </Link>

          {/* Auditoria */}
          <Link href="/audit" className="bg-theme-card rounded-xl border border-theme p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Auditoria (30d)</p>
                <p className="text-2xl font-bold text-theme">{kpis?.audit.total || 0}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-muted">Criações</span>
                <span className="font-medium text-green-600">{kpis?.audit.creates || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Alterações</span>
                <span className="font-medium text-blue-600">{kpis?.audit.updates || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Exclusões</span>
                <span className="font-medium text-red-600">{kpis?.audit.deletes || 0}</span>
              </div>
            </div>
          </Link>

          {/* Autenticação */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Logins (30d)</p>
                <p className="text-2xl font-bold text-green-600">{kpis?.auth.logins || 0}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-muted">Sucesso</span>
                <span className="font-medium text-green-600">{kpis?.auth.logins || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Falhas</span>
                <span className="font-medium text-red-600">{kpis?.auth.failed || 0}</span>
              </div>
            </div>
          </div>

          {/* Atividade Hoje */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Atividade Hoje</p>
                <p className="text-2xl font-bold text-theme">{kpis?.audit.today || 0}</p>
              </div>
            </div>
            <div className="text-sm text-theme-muted">
              Registros de auditoria nas últimas 24h
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Atividade por Módulo */}
          <ChartCard 
            title="Atividade por Módulo" 
            subtitle="Últimos 30 dias"
            actions={
              <Link href="/audit" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                Ver auditoria
              </Link>
            }
          >
            <SimpleBarChart
              data={kpis?.activityByModule || []}
              dataKeys={[
                { key: "count", color: "#6366F1" },
              ]}
              height={250}
            />
          </ChartCard>

          {/* Top Módulos */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-theme">Módulos Mais Utilizados</h3>
              <p className="text-sm text-theme-muted">Baseado em logs de auditoria</p>
            </div>
            <div className="space-y-4">
              {kpis?.activityByModule.slice(0, 5).map((module, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-sm font-medium text-indigo-600">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-theme">{module.name}</p>
                    <div className="w-full bg-theme-tertiary rounded-full h-2 mt-1">
                      <div 
                        className="h-2 rounded-full bg-indigo-500"
                        style={{ width: `${Math.min((module.count / (kpis?.activityByModule[0]?.count || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-semibold text-theme">{module.count}</span>
                </div>
              ))}
              {(!kpis?.activityByModule || kpis.activityByModule.length === 0) && (
                <div className="py-8 text-center text-theme-muted">
                  Nenhuma atividade registrada
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/settings/users/new"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Novo Usuário</p>
              <p className="text-sm text-theme-muted">Convidar usuário</p>
            </div>
          </Link>

          <Link
            href="/settings/groups"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Permissões</p>
              <p className="text-sm text-theme-muted">Grupos de acesso</p>
            </div>
          </Link>

          <Link
            href="/audit"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Auditoria</p>
              <p className="text-sm text-theme-muted">Logs do sistema</p>
            </div>
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-theme-tertiary rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-theme-secondary" />
            </div>
            <div>
              <p className="font-medium text-theme">Configurações</p>
              <p className="text-sm text-theme-muted">Parâmetros gerais</p>
            </div>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
