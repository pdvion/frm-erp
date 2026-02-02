"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

import {
  Users,
  Save,
  User,
  Building2,
  Phone,
  ArrowLeft,
  Loader2,
} from "lucide-react";

const contractTypes = [
  { value: "CLT", label: "CLT" },
  { value: "PJ", label: "PJ" },
  { value: "TEMPORARY", label: "Temporário" },
  { value: "INTERN", label: "Estagiário" },
  { value: "APPRENTICE", label: "Aprendiz" },
];

const statusOptions = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "VACATION", label: "Férias" },
  { value: "LEAVE", label: "Afastado" },
  { value: "SUSPENDED", label: "Suspenso" },
  { value: "TERMINATED", label: "Desligado" },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditEmployeePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    mobile: "",
    contractType: "CLT",
    departmentId: "",
    positionId: "",
    salary: "",
    status: "ACTIVE",
  });

  const { data: employee, isLoading } = trpc.hr.getEmployee.useQuery({ id });
  const { data: departments } = trpc.hr.listDepartments.useQuery({});
  const { data: positions } = trpc.hr.listPositions.useQuery({});

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || "",
        cpf: employee.cpf || "",
        email: employee.email || "",
        phone: employee.phone || "",
        mobile: employee.mobile || "",
        contractType: employee.contractType || "CLT",
        departmentId: employee.departmentId || "",
        positionId: employee.positionId || "",
        salary: employee.salary?.toString() || "",
        status: employee.status || "ACTIVE",
      });
    }
  }, [employee]);

  const updateEmployee = trpc.hr.updateEmployee.useMutation({
    onSuccess: () => {
      router.push(`/hr/employees/${id}`);
    },
    onError: (err) => {
      setError(err.message);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await updateEmployee.mutateAsync({
        id,
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        mobile: formData.mobile || undefined,
        departmentId: formData.departmentId || undefined,
        positionId: formData.positionId || undefined,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        status: formData.status as "ACTIVE" | "VACATION" | "LEAVE" | "SUSPENDED" | "TERMINATED",
      });
    } catch {
      // Error handled by onError
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Funcionário não encontrado"
          icon={<Users className="w-6 h-6" />}
          module="hr"
        />
        <div className="bg-theme-card rounded-lg border border-theme p-8 text-center">
          <Users className="w-12 h-12 mx-auto text-theme-muted mb-4" />
          <p className="text-theme-muted mb-4">O funcionário solicitado não foi encontrado.</p>
          <Link
            href="/hr/employees"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar: ${employee.name}`}
        subtitle={`#${employee.code}${employee.company ? ` • ${employee.company.tradeName || employee.company.name}` : ""}`}
        icon={<Users className="w-6 h-6" />}
        module="hr"
        actions={
          <Link
            href={`/hr/employees/${id}`}
            className="flex items-center gap-2 px-4 py-2 text-theme-secondary hover:text-theme border border-theme rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        }
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dados Pessoais */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-theme">Dados Pessoais</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Nome Completo *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <Input
                label="CPF"
                name="cpf"
                value={formData.cpf}
                disabled
              />
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  options={statusOptions}
                />
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-theme">Contato</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="E-mail"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
              <Input
                label="Telefone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(00) 0000-0000"
              />
              <Input
                label="Celular"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          {/* Dados Profissionais */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-theme">Dados Profissionais</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Tipo de Contrato
                </label>
                <Select
                  value={formData.contractType}
                  onChange={() => {}}
                  disabled
                  options={contractTypes}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Departamento
                </label>
                <Select
                  value={formData.departmentId}
                  onChange={(value) => setFormData(prev => ({ ...prev, departmentId: value }))}
                  placeholder="Selecione"
                  options={[
                    { value: "", label: "Selecione" },
                    ...((departments as { id: string; name: string }[] | undefined)?.map((dept) => ({
                      value: dept.id,
                      label: dept.name,
                    })) || []),
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Cargo
                </label>
                <Select
                  value={formData.positionId}
                  onChange={(value) => setFormData(prev => ({ ...prev, positionId: value }))}
                  placeholder="Selecione"
                  options={[
                    { value: "", label: "Selecione" },
                    ...((positions as { id: string; name: string }[] | undefined)?.map((pos) => ({
                      value: pos.id,
                      label: pos.name,
                    })) || []),
                  ]}
                />
              </div>
              <Input
                label="Salário"
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/hr/employees/${id}`)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Salvar
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
