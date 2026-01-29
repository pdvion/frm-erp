"use client";

import Link from "next/link";
import { 
  Users, Calendar, Gift, DollarSign, Clock,
  ArrowRight, Loader2, BarChart3, Building2, UserPlus
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { SimpleBarChart, DonutChart, ChartCard } from "@/components/charts";

export default function HRDashboardPage() {
  const { data: kpis, isLoading } = trpc.dashboard.hrKpis.useQuery();

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
          title="Dashboard de RH"
          subtitle="Visão geral do módulo de recursos humanos"
          icon={<Users className="w-6 h-6" />}
          module="hr"
          actions={
            <div className="flex gap-2">
              <Link
                href="/hr/employees"
                className="px-4 py-2 text-sm font-medium text-theme-secondary bg-theme-card border border-theme rounded-lg hover:bg-theme-hover"
              >
                Funcionários
              </Link>
              <Link
                href="/hr/payroll"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Folha de Pagamento
              </Link>
            </div>
          }
        />

        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Funcionários */}
          <Link href="/hr/employees" className="bg-theme-card rounded-xl border border-theme p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Funcionários</p>
                <p className="text-2xl font-bold text-theme">{kpis?.employees.total || 0}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-muted">Ativos</span>
                <span className="font-medium text-green-600">{kpis?.employees.active || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Em Férias</span>
                <span className="font-medium text-blue-600">{kpis?.employees.onVacation || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Afastados</span>
                <span className="font-medium text-yellow-600">{kpis?.employees.onLeave || 0}</span>
              </div>
            </div>
          </Link>

          {/* Férias do Mês */}
          <Link href="/hr/vacations" className="bg-theme-card rounded-xl border border-theme p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Férias no Mês</p>
                <p className="text-2xl font-bold text-theme">{kpis?.vacations.thisMonth || 0}</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-theme-muted">Pendentes de Aprovação</p>
              <p className="text-lg font-semibold text-yellow-600">{kpis?.vacations.pending || 0}</p>
            </div>
          </Link>

          {/* Ponto do Dia */}
          <Link href="/hr/timeclock" className="bg-theme-card rounded-xl border border-theme p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Ponto Hoje</p>
                <p className="text-2xl font-bold text-green-600">{kpis?.timeclock.present || 0}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-muted">Presentes</span>
                <span className="font-medium text-green-600">{kpis?.timeclock.present || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Atrasados</span>
                <span className="font-medium text-red-600">{kpis?.timeclock.late || 0}</span>
              </div>
            </div>
          </Link>

          {/* Folha de Pagamento */}
          <Link href="/hr/payroll" className="bg-theme-card rounded-xl border border-theme p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Folha do Mês</p>
                <p className="text-2xl font-bold text-theme">
                  {formatCurrency(kpis?.payroll.netTotal || 0)}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-theme-muted">Bruto</p>
              <p className="text-lg font-semibold text-theme-secondary">
                {formatCurrency(kpis?.payroll.grossTotal || 0)}
              </p>
            </div>
          </Link>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Admissões */}
          <ChartCard 
            title="Admissões" 
            subtitle="Últimos 6 meses"
            actions={
              <Link href="/reports/hr" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                Ver relatório
              </Link>
            }
          >
            <SimpleBarChart
              data={kpis?.hiringTrend || []}
              dataKeys={[
                { key: "Admissões", color: "#10B981" },
              ]}
              height={250}
            />
          </ChartCard>

          {/* Funcionários por Departamento */}
          <ChartCard 
            title="Funcionários por Departamento" 
            subtitle="Distribuição atual"
          >
            <DonutChart
              data={kpis?.employeesByDepartment.map(d => ({ name: d.name, value: d.count })) || []}
              dataKey="value"
              height={250}
            />
          </ChartCard>
        </div>

        {/* Aniversariantes do Mês */}
        <div className="bg-theme-card rounded-xl border border-theme p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <Gift className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-theme">Aniversariantes do Mês</h3>
                <p className="text-sm text-theme-muted">{kpis?.birthdays.length || 0} colaboradores</p>
              </div>
            </div>
          </div>
          
          {kpis?.birthdays && kpis.birthdays.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kpis.birthdays.map((birthday, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-theme-hover rounded-lg">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <span className="text-pink-600 font-medium">
                      {new Date(birthday.date).getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-theme">{birthday.name}</p>
                    <p className="text-sm text-theme-muted">
                      {new Date(birthday.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-theme-muted">
              Nenhum aniversariante este mês
            </div>
          )}
        </div>

        {/* Departamentos */}
        <div className="bg-theme-card rounded-xl border border-theme p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-theme">Quadro por Departamento</h3>
              <p className="text-sm text-theme-muted">Funcionários ativos</p>
            </div>
            <Link href="/hr/departments" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              Ver todos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis?.employeesByDepartment.map((dept, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-theme-hover rounded-lg">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-theme">{dept.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-theme">{dept.count}</p>
                  <p className="text-xs text-theme-muted">funcionários</p>
                </div>
              </div>
            ))}
            {(!kpis?.employeesByDepartment || kpis.employeesByDepartment.length === 0) && (
              <div className="col-span-full py-8 text-center text-theme-muted">
                Nenhum departamento cadastrado
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/hr/employees/new"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Novo Funcionário</p>
              <p className="text-sm text-theme-muted">Admissão</p>
            </div>
          </Link>

          <Link
            href="/hr/vacations"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Férias</p>
              <p className="text-sm text-theme-muted">Programar férias</p>
            </div>
          </Link>

          <Link
            href="/hr/timeclock"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Ponto</p>
              <p className="text-sm text-theme-muted">Controle de ponto</p>
            </div>
          </Link>

          <Link
            href="/hr/payroll"
            className="flex items-center gap-4 p-4 bg-theme-card rounded-xl border border-theme hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-theme">Folha</p>
              <p className="text-sm text-theme-muted">Processar folha</p>
            </div>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
