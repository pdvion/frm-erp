"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import {
  Users,
  Loader2,
  Building2,
  Clock,
  DollarSign,
  UserPlus,
  Calendar,
  ArrowRight,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  ACTIVE: "Ativos",
  VACATION: "Férias",
  LEAVE: "Afastados",
  SUSPENDED: "Suspensos",
  TERMINATED: "Desligados",
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  VACATION: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  LEAVE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  SUSPENDED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  TERMINATED: "bg-theme-tertiary text-theme",
};

export default function HRDashboardPage() {
  const { data: dashboard, isLoading } = trpc.hr.dashboard.useQuery();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recursos Humanos"
        subtitle="Gestão de pessoas e folha"
        icon={<Users className="w-6 h-6" />}
        module="hr"
      />

      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : !dashboard ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-theme-muted mb-4" />
            <p className="text-theme-muted">Nenhum dado disponível</p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-theme-card rounded-lg border border-theme p-4">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Total Funcionários</span>
                </div>
                <div className="text-2xl font-bold text-theme">{dashboard.totalEmployees}</div>
              </div>
              {dashboard.byStatus.slice(0, 3).map((item) => (
                <div key={item.status} className="bg-theme-card rounded-lg border border-theme p-4">
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mb-2 ${statusColors[item.status] || "bg-theme-tertiary"}`}>
                    {statusLabels[item.status] || item.status}
                  </div>
                  <div className="text-2xl font-bold text-theme">{item._count}</div>
                </div>
              ))}
            </div>

            {/* Links Rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Link
                href="/hr/employees"
                className="bg-theme-card rounded-lg border border-theme p-6 hover:border-purple-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-theme">Funcionários</h3>
                    <p className="text-sm text-theme-muted">Cadastro e gestão</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/hr/departments"
                className="bg-theme-card rounded-lg border border-theme p-6 hover:border-purple-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-theme">Departamentos</h3>
                    <p className="text-sm text-theme-muted">Estrutura organizacional</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/hr/timesheet"
                className="bg-theme-card rounded-lg border border-theme p-6 hover:border-purple-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Clock className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-theme">Ponto</h3>
                    <p className="text-sm text-theme-muted">Registros e folha</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/hr/payroll"
                className="bg-theme-card rounded-lg border border-theme p-6 hover:border-purple-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <DollarSign className="w-8 h-8 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-theme">Folha</h3>
                    <p className="text-sm text-theme-muted">Pagamentos</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Contratações Recentes */}
            {dashboard.recentHires.length > 0 && (
              <div className="bg-theme-card rounded-lg border border-theme p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-theme flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-theme-muted" />
                    Contratações Recentes
                  </h2>
                  <Link href="/hr/employees" className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1">
                    Ver todos <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {dashboard.recentHires.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between p-3 bg-theme-tertiary rounded-lg">
                      <div>
                        <div className="font-medium text-theme">{emp.name}</div>
                        <div className="text-sm text-theme-muted">{emp.position?.name || "Sem cargo"}</div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-theme-muted">
                        <Calendar className="w-4 h-4" />
                        {formatDate(emp.hireDate)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
