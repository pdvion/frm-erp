"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  User,
  Building,
  Calendar,
  DollarSign,
  Printer,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";

interface PayslipPageProps {
  params: Promise<{ id: string; itemId: string }>;
}

export default function PayslipPage({ params }: PayslipPageProps) {
  const { id, itemId } = use(params);
  const router = useRouter();

  const { data: payslip, isLoading } = trpc.payroll.getPayslip.useQuery({
    payrollItemId: itemId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!payslip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <FileText className="w-16 h-16 text-theme-muted mb-4" />
        <p className="text-theme-muted">Holerite não encontrado</p>
        <LinkButton href={`/hr/payroll/${id}`} variant="ghost" className="mt-4">
          Voltar para Folha
        </LinkButton>
      </div>
    );
  }

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demonstrativo de Pagamento"
        icon={<FileText className="w-6 h-6 text-blue-600" />}
        backHref={`/hr/payroll/${id}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" leftIcon={<Printer className="w-4 h-4" />}>
              Imprimir
            </Button>
            <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
              PDF
            </Button>
          </div>
        }
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho do Holerite */}
        <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-theme">
                DEMONSTRATIVO DE PAGAMENTO
              </h2>
              <p className="text-theme-muted">
                {monthNames[payslip.period.month - 1]} de {payslip.period.year}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-theme-muted">Matrícula</p>
              <p className="text-lg font-bold text-theme">#{payslip.employee.code}</p>
            </div>
          </div>

          {/* Dados do Funcionário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-theme-hover rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-theme-muted">Nome</p>
                  <p className="font-semibold text-theme">{payslip.employee.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-theme-muted">Departamento / Cargo</p>
                  <p className="font-medium text-theme">
                    {payslip.employee.department || "-"} / {payslip.employee.position || "-"}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-theme-muted">Data de Admissão</p>
                  <p className="font-medium text-theme">
                    {payslip.employee.hireDate
                      ? formatDate(new Date(payslip.employee.hireDate))
                      : "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-theme-muted">Salário Base</p>
                  <p className="font-medium text-theme">
                    {formatCurrency(payslip.summary.baseSalary)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo de Horas */}
        <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-6 mb-6">
          <h3 className="text-lg font-semibold text-theme mb-4">Resumo de Horas</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {payslip.summary.workedDays}
              </p>
              <p className="text-sm text-blue-700">Dias Trabalhados</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {payslip.summary.workedHours.toFixed(1)}h
              </p>
              <p className="text-sm text-green-700">Horas Normais</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">
                {payslip.summary.overtimeHours.toFixed(1)}h
              </p>
              <p className="text-sm text-orange-700">Horas Extras</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {payslip.summary.nightHours.toFixed(1)}h
              </p>
              <p className="text-sm text-purple-700">Horas Noturnas</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {payslip.summary.absenceDays}
              </p>
              <p className="text-sm text-red-700">Faltas</p>
            </div>
          </div>
        </div>

        {/* Proventos e Descontos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Proventos */}
          <div className="bg-theme-card rounded-xl shadow-sm border border-theme overflow-hidden">
            <div className="p-4 bg-green-50 border-b border-green-100">
              <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Proventos
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {payslip.earnings.map((event) => (
                <div key={event.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-theme">{event.description}</p>
                    <p className="text-sm text-theme-muted">Cód: {event.code}</p>
                  </div>
                  <div className="text-right">
                    {event.reference && (
                      <p className="text-sm text-theme-muted">{event.reference}</p>
                    )}
                    <p className="font-semibold text-green-600">
                      {formatCurrency(event.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-green-50 border-t border-green-100 flex justify-between items-center">
              <p className="font-semibold text-green-800">Total Proventos</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(payslip.totals.grossSalary)}
              </p>
            </div>
          </div>

          {/* Descontos */}
          <div className="bg-theme-card rounded-xl shadow-sm border border-theme overflow-hidden">
            <div className="p-4 bg-red-50 border-b border-red-100">
              <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Descontos
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {payslip.deductions.map((event) => (
                <div key={event.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-theme">{event.description}</p>
                    <p className="text-sm text-theme-muted">Cód: {event.code}</p>
                  </div>
                  <div className="text-right">
                    {event.reference && (
                      <p className="text-sm text-theme-muted">{event.reference}</p>
                    )}
                    <p className="font-semibold text-red-600">
                      {formatCurrency(event.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-red-50 border-t border-red-100 flex justify-between items-center">
              <p className="font-semibold text-red-800">Total Descontos</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(payslip.totals.totalDeductions)}
              </p>
            </div>
          </div>
        </div>

        {/* Totais */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-blue-100 text-sm">Salário Bruto</p>
              <p className="text-2xl font-bold">
                {formatCurrency(payslip.totals.grossSalary)}
              </p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Total Descontos</p>
              <p className="text-2xl font-bold">
                {formatCurrency(payslip.totals.totalDeductions)}
              </p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">FGTS do Mês</p>
              <p className="text-2xl font-bold">
                {formatCurrency(payslip.totals.fgts)}
              </p>
            </div>
            <div className="bg-theme-card/20 rounded-lg p-3">
              <p className="text-blue-100 text-sm">Salário Líquido</p>
              <p className="text-3xl font-bold">
                {formatCurrency(payslip.totals.netSalary)}
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-6 text-center text-sm text-theme-muted">
          <p>Este documento é um demonstrativo de pagamento e não possui valor fiscal.</p>
          <p>Gerado em {formatDate(new Date())} pelo FRM ERP</p>
        </div>
      </main>
    </div>
  );
}
