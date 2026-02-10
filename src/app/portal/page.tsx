"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  User,
  FileText,
  Calendar,
  Clock,
  Bell,
  Briefcase,
  DollarSign,
  Download,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function EmployeePortalPage() {
  const [currentMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  const { data: profile, isLoading: profileLoading } =
    trpc.employeePortal.getMyProfile.useQuery();

  const { data: payslips } = trpc.employeePortal.getMyPayslips.useQuery({
    limit: 3,
  });

  const { data: vacations } = trpc.employeePortal.getMyVacations.useQuery();

  const { data: timeRecords } = trpc.employeePortal.getMyTimeRecords.useQuery({
    month: currentMonth.month,
    year: currentMonth.year,
  });

  const { data: announcements } =
    trpc.employeePortal.getAnnouncements.useQuery({ limit: 5 });

  if (profileLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-theme-secondary rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-theme-secondary rounded"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Perfil não encontrado
          </h2>
          <p className="text-yellow-600 dark:text-yellow-400">
            Seu usuário não está vinculado a um funcionário. Entre em contato
            com o RH.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Olá, ${profile.name.split(" ")[0]}!`}
        subtitle="Portal do Colaborador"
        icon={<User className="w-6 h-6" />}
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/portal/timeclock">
          <div className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-4 text-center transition-colors cursor-pointer">
            <Clock className="w-8 h-8 mx-auto mb-2" />
            <span className="font-medium">Registrar Ponto</span>
          </div>
        </Link>
        <Link href="/portal/payslips">
          <div className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-4 text-center transition-colors cursor-pointer">
            <FileText className="w-8 h-8 mx-auto mb-2" />
            <span className="font-medium">Holerites</span>
          </div>
        </Link>
        <Link href="/portal/vacations">
          <div className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-4 text-center transition-colors cursor-pointer">
            <Calendar className="w-8 h-8 mx-auto mb-2" />
            <span className="font-medium">Férias</span>
          </div>
        </Link>
        <Link href="/portal/profile">
          <div className="bg-slate-600 hover:bg-slate-700 text-white rounded-lg p-4 text-center transition-colors cursor-pointer">
            <User className="w-8 h-8 mx-auto mb-2" />
            <span className="font-medium">Meus Dados</span>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Meu Perfil
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-theme-muted">
                Nome
              </span>
              <p className="font-medium text-theme">
                {profile.name}
              </p>
            </div>
            <div>
              <span className="text-sm text-theme-muted">
                Cargo
              </span>
              <p className="font-medium text-theme">
                {profile.position?.name || "Não definido"}
              </p>
            </div>
            <div>
              <span className="text-sm text-theme-muted">
                Departamento
              </span>
              <p className="font-medium text-theme">
                {profile.department?.name || "Não definido"}
              </p>
            </div>
            <div>
              <span className="text-sm text-theme-muted">
                Admissão
              </span>
              <p className="font-medium text-theme">
                {new Date(profile.hireDate).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
        </div>

        {/* Vacation Balance */}
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Saldo de Férias
          </h2>
          {vacations?.balance && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-theme-muted">
                  Dias Adquiridos
                </span>
                <span className="text-2xl font-bold text-theme">
                  {vacations.balance.totalEarned}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-theme-muted">
                  Dias Usados
                </span>
                <span className="text-xl font-semibold text-red-600">
                  {vacations.balance.used}
                </span>
              </div>
              <div className="border-t border-theme pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-theme-muted">
                    Disponível
                  </span>
                  <span className="text-3xl font-bold text-green-600">
                    {vacations.balance.available}
                  </span>
                </div>
              </div>
              <Link href="/portal/vacations/request">
                <Button className="w-full mt-2">Solicitar Férias</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Time Clock Summary */}
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Ponto do Mês
          </h2>
          {timeRecords?.summary && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-theme-muted">
                  Horas Trabalhadas
                </span>
                <span className="font-semibold text-theme">
                  {timeRecords.summary.totalWorkedHours}h{" "}
                  {timeRecords.summary.totalWorkedMinutes}m
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-theme-muted">
                  Horas Extras
                </span>
                <span className="font-semibold text-blue-600">
                  {timeRecords.summary.totalOvertimeHours}h{" "}
                  {timeRecords.summary.totalOvertimeMinutes}m
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-theme-muted">
                  Dias Trabalhados
                </span>
                <span className="font-semibold text-theme">
                  {timeRecords.summary.workDays}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-theme-muted">Faltas</span>
                <span className="font-semibold text-red-600">
                  {timeRecords.summary.absences}
                </span>
              </div>
              <Link href="/portal/timesheet">
                <Button variant="secondary" className="w-full mt-2">
                  Ver Espelho de Ponto
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payslips */}
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-theme flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Últimos Holerites
            </h2>
            <Link
              href="/portal/payslips"
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
            >
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {payslips?.map((payslip) => (
              <div
                key={payslip.id}
                className="flex justify-between items-center p-3 bg-theme-secondary rounded-lg"
              >
                <div>
                  <p className="font-medium text-theme">
                    {String(payslip.payroll.referenceMonth).padStart(2, "0")}/
                    {payslip.payroll.referenceYear}
                  </p>
                  <p className="text-sm text-theme-muted">
                    {payslip.payroll.status === "CLOSED"
                      ? "Fechado"
                      : "Em processamento"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-theme">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(Number(payslip.netSalary || 0))}
                  </span>
                  <Link href={`/portal/payslips/${payslip.id}`}>
                    <Button variant="secondary" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            {(!payslips || payslips.length === 0) && (
              <p className="text-theme-muted text-center py-4">
                Nenhum holerite disponível
              </p>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Comunicados
          </h2>
          <div className="space-y-3">
            {announcements && announcements.length > 0 ? (
              announcements.map((announcement: { id: string; title: string; content: string; createdAt: Date }) => (
                <div
                  key={announcement.id}
                  className="p-3 bg-theme-secondary rounded-lg"
                >
                  <p className="font-medium text-theme">
                    {announcement.title}
                  </p>
                  <p className="text-sm text-theme-muted mt-1 line-clamp-2">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-theme-muted mt-2">
                    {new Date(announcement.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-theme-muted text-center py-4">
                Nenhum comunicado recente
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
