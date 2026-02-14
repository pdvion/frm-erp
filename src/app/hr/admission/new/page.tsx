"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { PageCard } from "@/components/ui/PageCard";
import { Alert } from "@/components/ui/Alert";

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}


export default function NewAdmissionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    candidateCpf: "",
    positionId: "",
    departmentId: "",
    proposedSalary: "",
    proposedStartDate: "",
    notes: "",
  });

  const { data: departments } = trpc.hr.listDepartments.useQuery(
    undefined,
    { staleTime: 60_000 }
  );

  const { data: positions } = trpc.hr.listPositions.useQuery(
    undefined,
    { staleTime: 60_000 }
  );

  const createMutation = trpc.admission.create.useMutation({
    onSuccess: (data) => {
      toast.success("Processo de admissão criado com sucesso!");
      router.push(`/hr/admission/${data.id}`);
    },
    onError: (err) => {
      toast.error("Erro ao criar processo", { description: err.message });
      setError(err.message);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.candidateName.trim()) {
      setError("Nome do candidato é obrigatório");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const salaryValue = form.proposedSalary ? Number(form.proposedSalary) : undefined;

    createMutation.mutate({
      candidateName: form.candidateName.trim(),
      candidateEmail: form.candidateEmail.trim() || undefined,
      candidatePhone: form.candidatePhone.replace(/\D/g, "") || undefined,
      candidateCpf: form.candidateCpf.replace(/\D/g, "") || undefined,
      positionId: form.positionId || undefined,
      departmentId: form.departmentId || undefined,
      proposedSalary: salaryValue,
      proposedStartDate: form.proposedStartDate || undefined,
      notes: form.notes.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Admissão"
        subtitle="Criar novo processo de admissão digital"
        icon={<UserPlus className="w-6 h-6" />}
        backHref="/hr/admission"
        module="hr"
      />

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Dados do Candidato */}
        <PageCard title="Dados do Candidato" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Nome Completo *"
                name="candidateName"
                value={form.candidateName}
                onChange={(e) => setForm((p) => ({ ...p, candidateName: e.target.value }))}
                placeholder="Nome completo do candidato"
                required
              />
            </div>
            <Input
              label="E-mail"
              name="candidateEmail"
              type="email"
              value={form.candidateEmail}
              onChange={(e) => setForm((p) => ({ ...p, candidateEmail: e.target.value }))}
              placeholder="email@exemplo.com"
            />
            <Input
              label="Telefone"
              name="candidatePhone"
              value={form.candidatePhone}
              onChange={(e) => setForm((p) => ({ ...p, candidatePhone: formatPhone(e.target.value) }))}
              placeholder="(00) 00000-0000"
            />
            <Input
              label="CPF"
              name="candidateCpf"
              value={form.candidateCpf}
              onChange={(e) => setForm((p) => ({ ...p, candidateCpf: formatCPF(e.target.value) }))}
              placeholder="000.000.000-00"
            />
          </div>
        </PageCard>

        {/* Dados da Vaga */}
        <PageCard title="Dados da Vaga" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Departamento</label>
              <Select
                value={form.departmentId}
                onChange={(val) => setForm((p) => ({ ...p, departmentId: val }))}
                placeholder="Selecione..."
                options={departments?.map((dept: { id: string; name: string }) => ({
                  value: dept.id,
                  label: dept.name,
                })) ?? []}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Cargo</label>
              <Select
                value={form.positionId}
                onChange={(val) => setForm((p) => ({ ...p, positionId: val }))}
                placeholder="Selecione..."
                options={positions?.map((pos: { id: string; name: string }) => ({
                  value: pos.id,
                  label: pos.name,
                })) ?? []}
              />
            </div>
            <Input
              label="Salário Proposto"
              name="proposedSalary"
              type="number"
              step="0.01"
              value={form.proposedSalary}
              onChange={(e) => setForm((p) => ({ ...p, proposedSalary: e.target.value }))}
              placeholder="Ex: 4500.00"
            />
            <Input
              label="Data Prevista de Início"
              name="proposedStartDate"
              type="date"
              value={form.proposedStartDate}
              onChange={(e) => setForm((p) => ({ ...p, proposedStartDate: e.target.value }))}
            />
          </div>
        </PageCard>

        {/* Observações */}
        <PageCard title="Observações" className="mb-6">
          <Textarea
            name="notes"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Observações sobre o processo de admissão..."
            rows={4}
          />
        </PageCard>

        {/* Ações */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/hr/admission")}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Criar Processo
          </Button>
        </div>
      </form>
    </div>
  );
}
