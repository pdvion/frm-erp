"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Users,
  ChevronLeft,
  Loader2,
  Building2,
  Briefcase,
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
  ACTIVE: "bg-green-100 text-green-800",
  VACATION: "bg-blue-100 text-blue-800",
  LEAVE: "bg-yellow-100 text-yellow-800",
  SUSPENDED: "bg-orange-100 text-orange-800",
  TERMINATED: "bg-gray-100 text-gray-800",
};

export default function HRDashboardPage() {
  const { data: dashboard, isLoading } = trpc.hr.dashboard.useQuery();

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-semibold text-gray-900">Recursos Humanos</h1>
              </div>
            </div>
            <CompanySwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : !dashboard ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum dado disponível</p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Total Funcionários</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{dashboard.totalEmployees}</div>
              </div>
              {dashboard.byStatus.slice(0, 3).map((item) => (
                <div key={item.status} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mb-2 ${statusColors[item.status] || "bg-gray-100"}`}>
                    {statusLabels[item.status] || item.status}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{item._count}</div>
                </div>
              ))}
            </div>

            {/* Links Rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Link
                href="/hr/employees"
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-purple-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Funcionários</h3>
                    <p className="text-sm text-gray-500">Cadastro e gestão</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/hr/departments"
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-purple-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Departamentos</h3>
                    <p className="text-sm text-gray-500">Estrutura organizacional</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/hr/timesheet"
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-purple-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Clock className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Ponto</h3>
                    <p className="text-sm text-gray-500">Registros e folha</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/hr/payroll"
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-purple-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <DollarSign className="w-8 h-8 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Folha</h3>
                    <p className="text-sm text-gray-500">Pagamentos</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Contratações Recentes */}
            {dashboard.recentHires.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-gray-400" />
                    Contratações Recentes
                  </h2>
                  <Link href="/hr/employees" className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1">
                    Ver todos <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {dashboard.recentHires.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{emp.name}</div>
                        <div className="text-sm text-gray-500">{emp.position?.name || "Sem cargo"}</div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
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
      </main>
    </div>
  );
}
