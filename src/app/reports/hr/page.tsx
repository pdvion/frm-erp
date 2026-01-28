"use client";

import { PageHeader } from "@/components/PageHeader";
import { Users, Download, UserCheck, Clock, Calendar, DollarSign, FileText } from "lucide-react";
import Link from "next/link";

const reports = [
  {
    title: "Quadro de Funcionários",
    description: "Lista completa de colaboradores ativos",
    icon: <UserCheck className="w-5 h-5" />,
    href: "/reports/headcount",
  },
  {
    title: "Banco de Horas",
    description: "Saldo de horas por colaborador",
    icon: <Clock className="w-5 h-5" />,
    href: "/hr/timeclock/hours-bank",
  },
  {
    title: "Férias Programadas",
    description: "Calendário de férias dos colaboradores",
    icon: <Calendar className="w-5 h-5" />,
    href: "/hr/vacation",
  },
  {
    title: "Folha de Pagamento",
    description: "Resumo da folha de pagamento mensal",
    icon: <DollarSign className="w-5 h-5" />,
    href: "/hr/payroll",
  },
  {
    title: "Histórico de Admissões",
    description: "Relatório de admissões por período",
    icon: <Users className="w-5 h-5" />,
    href: "/hr/admissions",
  },
  {
    title: "Turnover",
    description: "Análise de rotatividade de pessoal",
    icon: <FileText className="w-5 h-5" />,
    href: "/reports/hr/turnover",
  },
];

export default function HRReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios de RH"
        icon={<Users className="w-6 h-6" />}
        module="REPORTS"
        breadcrumbs={[
          { label: "Relatórios", href: "/reports" },
          { label: "RH" },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report, idx) => (
          <Link
            key={idx}
            href={report.href}
            className="bg-theme-card border border-theme rounded-lg p-4 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">
                {report.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-theme group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {report.title}
                </h3>
                <p className="text-sm text-theme-muted mt-1">{report.description}</p>
              </div>
              <Download className="w-4 h-4 text-theme-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>

      <div className="flex gap-4">
        <Link href="/reports" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Voltar para Relatórios
        </Link>
      </div>
    </div>
  );
}
