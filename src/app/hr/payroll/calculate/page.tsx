"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  ArrowLeft,
  Users,
  DollarSign,
  Clock,
  Moon,
  AlertTriangle,
  Shield,
  Calendar,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/Input";
import { NativeSelect } from "@/components/ui/NativeSelect";

export default function CalculatePayrollPage() {
  const router = useRouter();
  const [step, setStep] = useState<"config" | "processing" | "result">("config");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.getMonth() + 1;
  });
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [options, setOptions] = useState({
    includeOvertime: true,
    includeNightShift: true,
    includeInsalubrity: true,
    includeDangerousness: true,
    includeDSR: true,
    includeVacationAdvance: false,
    includeThirteenthAdvance: false,
  });
  const [result, setResult] = useState<{
    payrollId: string;
    totalGross: number;
    totalNet: number;
    totalDeductions: number;
    totalFGTS: number;
    employeeCount: number;
  } | null>(null);

  const createPayrollMutation = trpc.hr.createPayroll.useMutation();
  const calculateMutation = trpc.payroll.calculateAdvanced.useMutation();

  const { data: employees } = trpc.hr.listEmployees.useQuery({
    status: "ACTIVE",
    limit: 1000,
  });

  const handleCalculate = async () => {
    setStep("processing");

    try {
      // 1. Criar folha
      const payroll = await createPayrollMutation.mutateAsync({
        referenceMonth: selectedMonth,
        referenceYear: selectedYear,
      });

      // 2. Calcular
      const calcResult = await calculateMutation.mutateAsync({
        payrollId: payroll.id,
        options,
      });

      setResult(calcResult);
      setStep("result");
    } catch (error) {
      console.error("Erro ao calcular folha:", error);
      setStep("config");
    }
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calcular Folha de Pagamento"
        icon={<Calculator className="w-6 h-6 text-green-600" />}
        backHref="/hr/payroll"
        actions={
          step === "result" && (
            <Button
              onClick={() => router.push(`/hr/payroll/${result?.payrollId}`)}
              leftIcon={<CheckCircle className="w-5 h-5" />}
            >
              Ver Folha
            </Button>
          )
        }
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === "config" && (
          <div className="space-y-6">
            {/* Período */}
            <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Período de Referência
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Mês
                  </label>
                  <NativeSelect
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {monthNames.map((name, index) => (
                      <option key={index} value={index + 1}>
                        {name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Ano
                  </label>
                  <NativeSelect
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {[2024, 2025, 2026].map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>
            </div>

            {/* Funcionários */}
            <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Funcionários
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-blue-600">
                  {employees?.employees?.length || 0}
                </div>
                <div className="text-theme-secondary">
                  funcionários ativos serão incluídos no cálculo
                </div>
              </div>
            </div>

            {/* Opções de Cálculo */}
            <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Opções de Cálculo
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 border border-theme rounded-lg hover:bg-theme-hover cursor-pointer">
                  <Input
                    type="checkbox"
                    checked={options.includeOvertime}
                    onChange={(e) =>
                      setOptions({ ...options, includeOvertime: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <Clock className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="font-medium text-theme">Horas Extras</p>
                    <p className="text-sm text-theme-muted">50% e 100%</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-theme rounded-lg hover:bg-theme-hover cursor-pointer">
                  <Input
                    type="checkbox"
                    checked={options.includeNightShift}
                    onChange={(e) =>
                      setOptions({ ...options, includeNightShift: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <Moon className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-theme">Adicional Noturno</p>
                    <p className="text-sm text-theme-muted">20% + hora reduzida</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-theme rounded-lg hover:bg-theme-hover cursor-pointer">
                  <Input
                    type="checkbox"
                    checked={options.includeInsalubrity}
                    onChange={(e) =>
                      setOptions({ ...options, includeInsalubrity: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-theme">Insalubridade</p>
                    <p className="text-sm text-theme-muted">10%, 20% ou 40%</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-theme rounded-lg hover:bg-theme-hover cursor-pointer">
                  <Input
                    type="checkbox"
                    checked={options.includeDangerousness}
                    onChange={(e) =>
                      setOptions({ ...options, includeDangerousness: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <Shield className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-medium text-theme">Periculosidade</p>
                    <p className="text-sm text-theme-muted">30% sobre salário base</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-theme rounded-lg hover:bg-theme-hover cursor-pointer">
                  <Input
                    type="checkbox"
                    checked={options.includeDSR}
                    onChange={(e) =>
                      setOptions({ ...options, includeDSR: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-theme">DSR</p>
                    <p className="text-sm text-theme-muted">Descanso Semanal Remunerado</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Botão Calcular */}
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                leftIcon={<ArrowLeft className="w-5 h-5" />}
              >
                Voltar
              </Button>
              <Button
                onClick={handleCalculate}
                disabled={!employees?.employees?.length}
                leftIcon={<Calculator className="w-5 h-5" />}
                className="bg-green-600 hover:bg-green-700"
              >
                Calcular Folha
              </Button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-12 text-center">
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-6 animate-spin" />
            <h2 className="text-xl font-semibold text-theme mb-2">
              Calculando Folha de Pagamento
            </h2>
            <p className="text-theme-muted">
              Processando {employees?.employees?.length || 0} funcionários...
            </p>
            <div className="mt-6 space-y-2 text-sm text-theme-muted">
              <p>✓ Buscando dados do ponto eletrônico</p>
              <p>✓ Calculando horas extras e adicionais</p>
              <p>✓ Aplicando tabelas INSS e IRRF 2024</p>
              <p>✓ Gerando eventos da folha</p>
            </div>
          </div>
        )}

        {step === "result" && result && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-green-800 mb-2">
                Folha Calculada com Sucesso!
              </h2>
              <p className="text-green-700">
                {monthNames[selectedMonth - 1]} de {selectedYear}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-4">
                <div className="flex items-center gap-2 text-theme-muted mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Funcionários</span>
                </div>
                <p className="text-2xl font-bold text-theme">{result.employeeCount}</p>
              </div>

              <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-4">
                <div className="flex items-center gap-2 text-blue-500 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">Total Bruto</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(result.totalGross)}
                </p>
              </div>

              <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-4">
                <div className="flex items-center gap-2 text-red-500 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Descontos</span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(result.totalDeductions)}
                </p>
              </div>

              <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-4">
                <div className="flex items-center gap-2 text-green-500 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Total Líquido</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(result.totalNet)}
                </p>
              </div>
            </div>

            <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-6">
              <h3 className="text-lg font-semibold text-theme mb-4">Encargos</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-theme-muted">FGTS (8%)</p>
                  <p className="text-lg font-semibold text-theme">
                    {formatCurrency(result.totalFGTS)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-theme-muted">INSS Patronal (20%)</p>
                  <p className="text-lg font-semibold text-theme">
                    {formatCurrency(result.totalGross * 0.2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-theme-muted">RAT + Terceiros</p>
                  <p className="text-lg font-semibold text-theme">
                    {formatCurrency(result.totalGross * 0.088)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("config");
                  setResult(null);
                }}
              >
                Calcular Outra
              </Button>
              <Button
                onClick={() => router.push(`/hr/payroll/${result.payrollId}`)}
              >
                Ver Detalhes da Folha
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
