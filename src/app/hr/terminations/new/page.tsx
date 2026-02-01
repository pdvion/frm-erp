"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  UserMinus,
  Save,
  ArrowLeft,
  AlertTriangle,
  Calendar,
  User,
  FileText,
} from "lucide-react";

const terminationTypes = [
  { value: "RESIGNATION", label: "Pedido de Demissão", description: "Iniciativa do funcionário" },
  { value: "DISMISSAL_NO_CAUSE", label: "Demissão Sem Justa Causa", description: "Iniciativa do empregador" },
  { value: "DISMISSAL_WITH_CAUSE", label: "Demissão Por Justa Causa", description: "Falta grave do funcionário" },
  { value: "MUTUAL_AGREEMENT", label: "Acordo Mútuo", description: "Rescisão consensual" },
  { value: "CONTRACT_END", label: "Término de Contrato", description: "Fim do contrato determinado" },
  { value: "RETIREMENT", label: "Aposentadoria", description: "Aposentadoria do funcionário" },
  { value: "DEATH", label: "Falecimento", description: "Óbito do funcionário" },
] as const;

type TerminationType = typeof terminationTypes[number]["value"];

export default function NewTerminationPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    employeeId: "",
    type: "RESIGNATION" as TerminationType,
    terminationDate: "",
    lastWorkDay: "",
    noticeDate: "",
    noticePeriodWorked: false,
    noticePeriodIndemnity: false,
    reason: "",
    notes: "",
  });

  const { data: employees, isLoading: loadingEmployees } = trpc.hr.listEmployees.useQuery({
    status: "ACTIVE",
    limit: 500,
  });

  const createMutation = trpc.terminations.create.useMutation({
    onSuccess: () => {
      router.push("/hr/terminations");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      employeeId: form.employeeId,
      type: form.type,
      terminationDate: new Date(form.terminationDate),
      lastWorkDay: form.lastWorkDay ? new Date(form.lastWorkDay) : undefined,
      noticeDate: form.noticeDate ? new Date(form.noticeDate) : undefined,
      noticePeriodWorked: form.noticePeriodWorked,
      noticePeriodIndemnity: form.noticePeriodIndemnity,
      reason: form.reason || undefined,
      notes: form.notes || undefined,
    });
  };

  const selectedEmployee = employees?.employees.find((e) => e.id === form.employeeId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Rescisão"
        subtitle="Registrar rescisão de contrato de trabalho"
        icon={<UserMinus className="w-6 h-6" />}
        module="HR"
        backHref="/hr/terminations"
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
            <Select
              value={form.employeeId}
              onChange={(value) => setForm({ ...form, employeeId: value })}
              placeholder={loadingEmployees ? "Carregando..." : "Selecione um funcionário"}
              disabled={loadingEmployees}
              options={[
                { value: "", label: loadingEmployees ? "Carregando..." : "Selecione um funcionário" },
                ...(employees?.employees.map((emp) => ({
                  value: emp.id,
                  label: `${emp.code} - ${emp.name}`,
                })) || []),
              ]}
            />
          </div>

          {selectedEmployee && (
            <div className="mt-4 p-4 bg-theme-secondary rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-theme-muted">Cargo:</span>
                  <span className="ml-2 text-theme">{typeof selectedEmployee.position === "string" ? selectedEmployee.position : selectedEmployee.position?.name || "-"}</span>
                </div>
                <div>
                  <span className="text-theme-muted">Departamento:</span>
                  <span className="ml-2 text-theme">{selectedEmployee.department?.name || "-"}</span>
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

        {/* Tipo de Rescisão */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">Tipo de Rescisão</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {terminationTypes.map((type) => {
              const isSelected = form.type === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: type.value })}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-theme hover:border-blue-300 hover:bg-theme-secondary"
                  }`}
                >
                  <div className={`font-medium ${isSelected ? "text-blue-600" : "text-theme"}`}>
                    {type.label}
                  </div>
                  <div className="text-xs text-theme-muted mt-1">{type.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Datas */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-theme">Datas</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Data da Rescisão *"
              type="date"
              value={form.terminationDate}
              onChange={(e) => setForm({ ...form, terminationDate: e.target.value })}
              required
            />

            <Input
              label="Último Dia Trabalhado"
              type="date"
              value={form.lastWorkDay}
              onChange={(e) => setForm({ ...form, lastWorkDay: e.target.value })}
            />

            <Input
              label="Data do Aviso"
              type="date"
              value={form.noticeDate}
              onChange={(e) => setForm({ ...form, noticeDate: e.target.value })}
            />
          </div>

          <div className="mt-4 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.noticePeriodWorked}
                onChange={(e) => setForm({ ...form, noticePeriodWorked: e.target.checked })}
                className="w-4 h-4 rounded border-theme-input text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-theme">Aviso prévio trabalhado</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.noticePeriodIndemnity}
                onChange={(e) => setForm({ ...form, noticePeriodIndemnity: e.target.checked })}
                className="w-4 h-4 rounded border-theme-input text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-theme">Aviso prévio indenizado</span>
            </label>
          </div>
        </div>

        {/* Motivo e Observações */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-theme">Detalhes</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Motivo da Rescisão
              </label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Descreva o motivo da rescisão..."
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Observações
              </label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Observações adicionais..."
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Aviso */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium">Atenção</p>
              <p className="mt-1">
                Após criar a rescisão, será necessário calcular os valores devidos (TRCT) 
                antes de efetuar o pagamento.
              </p>
            </div>
          </div>
        </div>

        {/* Erro */}
        {createMutation.error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
            {createMutation.error.message}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-4">
          <Link href="/hr/terminations">
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
            disabled={!form.employeeId || !form.terminationDate}
            isLoading={createMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Criar Rescisão
          </Button>
        </div>
      </form>
    </div>
  );
}
