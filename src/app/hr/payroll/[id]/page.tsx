"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  Download,
  Printer,
  Loader2,
  Building,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";

interface PayrollDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PayrollDetailPage({ params }: PayrollDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: payroll, isLoading } = trpc.hr.getPayroll.useQuery({ id });
  const { data: chargesSummary } = trpc.payroll.getChargesSummary.useQuery(
    { payrollId: id },
    { enabled: !!id }
  );

  const approveMutation = trpc.hr.approvePayroll.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });

  const markAsPaidMutation = trpc.payroll.markAsPaid.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!payroll) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <FileText className="w-16 h-16 text-theme-muted mb-4" />
        <p className="text-theme-muted">Folha não encontrada</p>
        <button
          onClick={() => router.push("/hr/payroll")}
          className="mt-4 text-blue-600 hover:underline"
        >
          Voltar para lista
        </button>
      </div>
    );
  }

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const statusColors: Record<string, string> = {
    DRAFT: "bg-theme-tertiary text-theme",
    CALCULATED: "bg-blue-100 text-blue-800",
    PROCESSED: "bg-blue-100 text-blue-800",
    APPROVED: "bg-green-100 text-green-800",
    PAID: "bg-emerald-100 text-emerald-800",
  };

  const statusLabels: Record<string, string> = {
    DRAFT: "Rascunho",
    CALCULATED: "Calculada",
    PROCESSED: "Processada",
    APPROVED: "Aprovada",
    PAID: "Paga",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Folha ${monthNames[payroll.referenceMonth - 1]} ${payroll.referenceYear}`}
        icon={<FileText className="w-6 h-6 text-blue-600" />}
        backHref="/hr/payroll"
        actions={
          <div className="flex items-center gap-2">
            {payroll.status === "CALCULATED" && (
              <button
                onClick={() => approveMutation.mutate({ payrollId: id })}
                disabled={approveMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {approveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Aprovar
              </button>
            )}
            {payroll.status === "APPROVED" && (
              <button
                onClick={() => markAsPaidMutation.mutate({ payrollId: id })}
                disabled={markAsPaidMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {markAsPaidMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <DollarSign className="w-4 h-4" />
                )}
                Marcar como Paga
              </button>
            )}
            <button className="flex items-center gap-2 px-4 py-2 border border-theme text-theme-secondary rounded-lg hover:bg-theme-hover">
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-theme text-theme-secondary rounded-lg hover:bg-theme-hover">
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status e Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-4">
            <div className="flex items-center gap-2 text-theme-muted mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Status</span>
            </div>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[payroll.status] || "bg-theme-tertiary text-theme"
              }`}
            >
              {statusLabels[payroll.status] || payroll.status}
            </span>
          </div>

          <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-4">
            <div className="flex items-center gap-2 text-theme-muted mb-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">Funcionários</span>
            </div>
            <p className="text-2xl font-bold text-theme">{payroll.employeeCount}</p>
          </div>

          <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-4">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Total Bruto</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(payroll.totalGross)}
            </p>
          </div>

          <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-4">
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm">Descontos</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(payroll.totalDeductions)}
            </p>
          </div>

          <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-4">
            <div className="flex items-center gap-2 text-green-500 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Total Líquido</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(payroll.totalNet)}
            </p>
          </div>
        </div>

        {/* Encargos */}
        {chargesSummary && (
          <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-6 mb-6">
            <h3 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-600" />
              Encargos e Provisões
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-theme-muted">FGTS (8%)</p>
                <p className="text-lg font-semibold text-theme">
                  {formatCurrency(chargesSummary.charges.fgts)}
                </p>
              </div>
              <div>
                <p className="text-sm text-theme-muted">INSS Patronal (20%)</p>
                <p className="text-lg font-semibold text-theme">
                  {formatCurrency(chargesSummary.charges.inssPatronal)}
                </p>
              </div>
              <div>
                <p className="text-sm text-theme-muted">RAT + Terceiros</p>
                <p className="text-lg font-semibold text-theme">
                  {formatCurrency(chargesSummary.charges.rat + chargesSummary.charges.terceiros)}
                </p>
              </div>
              <div>
                <p className="text-sm text-theme-muted">Total Encargos</p>
                <p className="text-lg font-semibold text-purple-600">
                  {formatCurrency(chargesSummary.charges.totalEncargos)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-theme grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-theme-muted">Provisão Férias</p>
                <p className="text-lg font-semibold text-theme">
                  {formatCurrency(chargesSummary.provisions.ferias)}
                </p>
              </div>
              <div>
                <p className="text-sm text-theme-muted">Provisão 13º</p>
                <p className="text-lg font-semibold text-theme">
                  {formatCurrency(chargesSummary.provisions.thirteenth)}
                </p>
              </div>
              <div>
                <p className="text-sm text-theme-muted font-medium">Custo Total</p>
                <p className="text-xl font-bold text-purple-600">
                  {formatCurrency(chargesSummary.totalCost)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Funcionários */}
        <div className="bg-theme-card rounded-xl shadow-sm border border-theme overflow-hidden">
          <div className="p-4 border-b border-theme">
            <h3 className="text-lg font-semibold text-theme flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Funcionários ({payroll.items?.length || 0})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-theme-hover">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Funcionário
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Salário Base
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Bruto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                    INSS
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                    IRRF
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Descontos
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Líquido
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payroll.items?.map((item) => (
                  <tr key={item.id} className="hover:bg-theme-hover">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-theme">{item.employee.name}</p>
                        <p className="text-sm text-theme-muted">
                          #{item.employee.code}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-theme">
                      {formatCurrency(item.baseSalary)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-blue-600">
                      {formatCurrency(item.grossSalary)}
                    </td>
                    <td className="px-4 py-3 text-right text-theme-muted">
                      {formatCurrency(item.inss)}
                    </td>
                    <td className="px-4 py-3 text-right text-theme-muted">
                      {formatCurrency(item.irrf)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600">
                      {formatCurrency(item.totalDeductions)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">
                      {formatCurrency(item.netSalary)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          router.push(`/hr/payroll/${id}/payslip/${item.id}`)
                        }
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Ver Holerite
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-theme-hover font-semibold">
                <tr>
                  <td className="px-4 py-3 text-theme">Total</td>
                  <td className="px-4 py-3 text-right text-theme">-</td>
                  <td className="px-4 py-3 text-right text-blue-600">
                    {formatCurrency(payroll.totalGross)}
                  </td>
                  <td className="px-4 py-3 text-right text-theme-muted">
                    {formatCurrency(
                      payroll.items?.reduce((sum, i) => sum + i.inss, 0) || 0
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-theme-muted">
                    {formatCurrency(
                      payroll.items?.reduce((sum, i) => sum + i.irrf, 0) || 0
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600">
                    {formatCurrency(payroll.totalDeductions)}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {formatCurrency(payroll.totalNet)}
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
