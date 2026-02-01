"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Palmtree,
  Save,
  ArrowLeft,
  Calendar,
  User,
  DollarSign,
  Info,
} from "lucide-react";

export default function NewVacationPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    employeeId: "",
    acquisitionStart: "",
    acquisitionEnd: "",
    startDate: "",
    endDate: "",
    totalDays: 30,
    soldDays: 0,
    isCollective: false,
    notes: "",
  });

  const { data: employees, isLoading: loadingEmployees } = trpc.hr.listEmployees.useQuery({
    status: "ACTIVE",
    limit: 500,
  });

  const createMutation = trpc.vacations.create.useMutation({
    onSuccess: () => {
      router.push("/hr/vacations");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      employeeId: form.employeeId,
      acquisitionStart: new Date(form.acquisitionStart),
      acquisitionEnd: new Date(form.acquisitionEnd),
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      totalDays: form.totalDays,
      soldDays: form.soldDays,
      isCollective: form.isCollective,
      notes: form.notes || undefined,
    });
  };

  const selectedEmployee = employees?.employees.find((e) => e.id === form.employeeId);
  const enjoyedDays = form.totalDays - form.soldDays;

  // Calcular data fim automaticamente
  const handleStartDateChange = (startDate: string) => {
    if (startDate && form.totalDays) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + enjoyedDays - 1);
      setForm({
        ...form,
        startDate,
        endDate: end.toISOString().split("T")[0],
      });
    } else {
      setForm({ ...form, startDate });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Solicitação de Férias"
        subtitle="Programar férias de funcionário"
        icon={<Palmtree className="w-6 h-6" />}
        module="HR"
        backHref="/hr/vacations"
        backLabel="Voltar"
      />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Funcionário */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-theme">Funcionário</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme mb-1">
              Selecione o Funcionário *
            </label>
            <select
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loadingEmployees}
            >
              <option value="">
                {loadingEmployees ? "Carregando..." : "Selecione um funcionário"}
              </option>
              {employees?.employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.code} - {emp.name}
                </option>
              ))}
            </select>
          </div>

          {selectedEmployee && (
            <div className="mt-4 p-4 bg-theme-secondary rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-theme-muted">Cargo:</span>
                  <span className="ml-2 text-theme">{typeof selectedEmployee.position === "string" ? selectedEmployee.position : selectedEmployee.position?.name || "-"}</span>
                </div>
                <div>
                  <span className="text-theme-muted">Admissão:</span>
                  <span className="ml-2 text-theme">
                    {new Date(selectedEmployee.hireDate).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Período Aquisitivo */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-theme">Período Aquisitivo</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Início do Período Aquisitivo *"
              type="date"
              value={form.acquisitionStart}
              onChange={(e) => setForm({ ...form, acquisitionStart: e.target.value })}
              required
            />

            <Input
              label="Fim do Período Aquisitivo *"
              type="date"
              value={form.acquisitionEnd}
              onChange={(e) => setForm({ ...form, acquisitionEnd: e.target.value })}
              required
            />
          </div>

          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200">
              <Info className="w-4 h-4 mt-0.5" />
              <span>
                O período aquisitivo é o período de 12 meses de trabalho que dá direito às férias.
              </span>
            </div>
          </div>
        </div>

        {/* Período de Gozo */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palmtree className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-theme">Período de Gozo</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Data de Início *"
              type="date"
              value={form.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              required
            />

            <Input
              label="Data de Término *"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Total de Dias
              </label>
              <select
                value={form.totalDays}
                onChange={(e) => setForm({ ...form, totalDays: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={30}>30 dias</option>
                <option value={20}>20 dias</option>
                <option value={15}>15 dias</option>
                <option value={10}>10 dias</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Dias Vendidos (Abono)
              </label>
              <select
                value={form.soldDays}
                onChange={(e) => setForm({ ...form, soldDays: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={0}>Nenhum</option>
                <option value={10}>10 dias (máximo permitido)</option>
              </select>
              <p className="text-xs text-theme-muted mt-1">
                O funcionário pode vender até 1/3 das férias
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isCollective}
                onChange={(e) => setForm({ ...form, isCollective: e.target.checked })}
                className="w-4 h-4 rounded border-theme-input text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-theme">Férias coletivas</span>
            </label>
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-theme">Resumo</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-theme-secondary rounded-lg text-center">
              <div className="text-2xl font-bold text-theme">{form.totalDays}</div>
              <div className="text-xs text-theme-muted">Dias de Direito</div>
            </div>
            <div className="p-3 bg-theme-secondary rounded-lg text-center">
              <div className="text-2xl font-bold text-theme">{form.soldDays}</div>
              <div className="text-xs text-theme-muted">Dias Vendidos</div>
            </div>
            <div className="p-3 bg-theme-secondary rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{enjoyedDays}</div>
              <div className="text-xs text-theme-muted">Dias de Gozo</div>
            </div>
            <div className="p-3 bg-theme-secondary rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">+1/3</div>
              <div className="text-xs text-theme-muted">Adicional</div>
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">Observações</h3>

          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Observações adicionais..."
            rows={3}
            className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        {/* Erro */}
        {createMutation.error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
            {createMutation.error.message}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-4">
          <Link href="/hr/vacations">
            <Button
              type="button"
              variant="secondary"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={!form.employeeId || !form.startDate || !form.endDate}
            isLoading={createMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Programar Férias
          </Button>
        </div>
      </form>
    </div>
  );
}
