"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  Calculator,
  Loader2,
  Calendar,
  Eye,
  DollarSign,
  TrendingUp,
  FileText,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Rascunho", color: "bg-gray-100 text-gray-800", icon: <Clock className="w-4 h-4" /> },
  PROCESSED: { label: "Processada", color: "bg-blue-100 text-blue-800", icon: <Calculator className="w-4 h-4" /> },
  APPROVED: { label: "Aprovada", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  PAID: { label: "Paga", color: "bg-purple-100 text-purple-800", icon: <DollarSign className="w-4 h-4" /> },
};

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function PayrollPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [showNewModal, setShowNewModal] = useState(false);

  const { data, isLoading, refetch } = trpc.hr.listPayrolls.useQuery({ year });

  const calculateMutation = trpc.hr.calculatePayroll.useMutation({
    onSuccess: () => refetch(),
  });

  const approveMutation = trpc.hr.approvePayroll.useMutation({
    onSuccess: () => refetch(),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const totalGross = data?.reduce((sum, p) => sum + p.totalGross, 0) || 0;
  const totalNet = data?.reduce((sum, p) => sum + p.totalNet, 0) || 0;
  const totalEmployees = data?.reduce((sum, p) => sum + p.employeeCount, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Folha de Pagamento
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <CompanySwitcher />
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Nova Folha
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Year Selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setYear(year - 1)}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">{year}</h2>
            <button
              onClick={() => setYear(year + 1)}
              disabled={year >= currentYear}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-medium text-gray-600">Folhas no Ano</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{data?.length || 0}</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Total Funcionários</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalEmployees}</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Total Bruto</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalGross)}</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Total Líquido</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalNet)}</div>
          </div>
        </div>

        {/* Payroll Grid */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
              {months.map((month, index) => {
                const payroll = data?.find((p) => p.referenceMonth === index + 1);
                const config = payroll ? statusConfig[payroll.status] || statusConfig.DRAFT : null;

                return (
                  <div
                    key={month}
                    className={`p-4 rounded-lg border-2 ${
                      payroll ? "border-gray-200 bg-white" : "border-dashed border-gray-300 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{month}</span>
                      </div>
                      {config && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                          {config.icon}
                          {config.label}
                        </span>
                      )}
                    </div>

                    {payroll ? (
                      <>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Funcionários</span>
                            <span className="font-medium text-gray-900">{payroll.employeeCount}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Bruto</span>
                            <span className="font-medium text-gray-900">{formatCurrency(payroll.totalGross)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Líquido</span>
                            <span className="font-medium text-green-600">{formatCurrency(payroll.totalNet)}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link
                            href={`/payroll/${payroll.id}`}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200"
                          >
                            <Eye className="w-4 h-4" />
                            Ver
                          </Link>
                          {payroll.status === "DRAFT" && (
                            <button
                              onClick={() => calculateMutation.mutate({ payrollId: payroll.id })}
                              disabled={calculateMutation.isPending}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                            >
                              <Calculator className="w-4 h-4" />
                              Calcular
                            </button>
                          )}
                          {payroll.status === "PROCESSED" && (
                            <button
                              onClick={() => approveMutation.mutate({ payrollId: payroll.id })}
                              disabled={approveMutation.isPending}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg border border-green-200"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Aprovar
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-2">Sem folha</p>
                        <button
                          onClick={() => setShowNewModal(true)}
                          className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          + Criar folha
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* New Payroll Modal */}
      {showNewModal && (
        <NewPayrollModal
          year={year}
          existingMonths={data?.map((p) => p.referenceMonth) || []}
          onClose={() => setShowNewModal(false)}
          onSuccess={() => {
            setShowNewModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function NewPayrollModal({
  year,
  existingMonths,
  onClose,
  onSuccess,
}: {
  year: number;
  existingMonths: number[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const createMutation = trpc.hr.createPayroll.useMutation({
    onSuccess,
  });

  const availableMonths = months
    .map((name, index) => ({ name, value: index + 1 }))
    .filter((m) => !existingMonths.includes(m.value));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-600" />
          Nova Folha de Pagamento
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mês de Referência
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {availableMonths.map((m) => (
              <option key={m.value} value={m.value}>
                {m.name} / {year}
              </option>
            ))}
          </select>
        </div>

        {availableMonths.length === 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
            Todas as folhas do ano já foram criadas.
          </div>
        )}

        {createMutation.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {createMutation.error.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => createMutation.mutate({ referenceMonth: month, referenceYear: year })}
            disabled={availableMonths.length === 0 || createMutation.isPending}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {createMutation.isPending ? "Criando..." : "Criar Folha"}
          </button>
        </div>
      </div>
    </div>
  );
}
