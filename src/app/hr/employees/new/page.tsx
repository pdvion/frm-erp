"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import {
  Users,
  Save,
  User,
  Building2,
  CreditCard,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

const contractTypes = [
  { value: "CLT", label: "CLT" },
  { value: "PJ", label: "PJ" },
  { value: "TEMPORARY", label: "Temporário" },
  { value: "INTERN", label: "Estagiário" },
  { value: "APPRENTICE", label: "Aprendiz" },
];

export default function NewEmployeePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    rg: "",
    birthDate: "",
    email: "",
    phone: "",
    mobile: "",
    address: "",
    addressNumber: "",
    addressComplement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    contractType: "CLT",
    admissionDate: new Date().toISOString().split("T")[0],
    departmentId: "",
    positionId: "",
    salary: "",
    workScheduleId: "",
    pis: "",
    ctps: "",
    ctpsSeries: "",
    voterRegistration: "",
    militaryService: "",
  });

  // Buscar departamentos
  const { data: departments } = trpc.hr.listDepartments.useQuery({});
  
  // Buscar cargos
  const { data: positions } = trpc.hr.listPositions.useQuery({});
  
  // Escalas de trabalho - TODO: implementar listWorkSchedules no router HR

  const createEmployee = trpc.hr.createEmployee.useMutation({
    onSuccess: () => {
      router.push("/hr/employees");
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
      await createEmployee.mutateAsync({
        name: formData.name,
        cpf: formData.cpf.replace(/\D/g, "") || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        mobile: formData.mobile || undefined,
        contractType: formData.contractType as "CLT" | "PJ" | "TEMPORARY" | "INTERN" | "APPRENTICE",
        hireDate: new Date(formData.admissionDate),
        departmentId: formData.departmentId || undefined,
        positionId: formData.positionId || undefined,
        salary: formData.salary ? parseFloat(formData.salary) : 0,
      });
    } catch {
      // Error handled by onError
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Funcionário"
        icon={<Users className="w-6 h-6" />}
        backHref="/hr/employees"
        module="hr"
      />

      <main className="max-w-4xl mx-auto">
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
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
                label="CPF *"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                required
                placeholder="000.000.000-00"
              />
              <Input
                label="RG"
                name="rg"
                value={formData.rg}
                onChange={handleChange}
              />
              <Input
                label="Data de Nascimento"
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
              />
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
                leftIcon={<Mail className="w-4 h-4" />}
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

          {/* Endereço */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-theme">Endereço</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="CEP"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="00000-000"
              />
              <div className="md:col-span-2">
                <Input
                  label="Endereço"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              <Input
                label="Número"
                name="addressNumber"
                value={formData.addressNumber}
                onChange={handleChange}
              />
              <Input
                label="Complemento"
                name="addressComplement"
                value={formData.addressComplement}
                onChange={handleChange}
              />
              <Input
                label="Bairro"
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleChange}
              />
              <Input
                label="Cidade"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Estado
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                >
                  <option value="">Selecione</option>
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </select>
              </div>
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
                  Tipo de Contrato *
                </label>
                <select
                  name="contractType"
                  value={formData.contractType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                >
                  {contractTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Data de Admissão *"
                type="date"
                name="admissionDate"
                value={formData.admissionDate}
                onChange={handleChange}
                required
              />
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Departamento
                </label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                >
                  <option value="">Selecione</option>
                  {(departments as { id: string; name: string }[] | undefined)?.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Cargo
                </label>
                <select
                  name="positionId"
                  value={formData.positionId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                >
                  <option value="">Selecione</option>
                  {(positions as { id: string; name: string }[] | undefined)?.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.name}
                    </option>
                  ))}
                </select>
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
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Escala de Trabalho
                </label>
                <select
                  name="workScheduleId"
                  value={formData.workScheduleId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                >
                  <option value="">Selecione</option>
                  {/* TODO: implementar listWorkSchedules */}
                </select>
              </div>
            </div>
          </div>

          {/* Documentos */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-theme">Documentos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="PIS/PASEP"
                name="pis"
                value={formData.pis}
                onChange={handleChange}
              />
              <Input
                label="CTPS"
                name="ctps"
                value={formData.ctps}
                onChange={handleChange}
              />
              <Input
                label="Série CTPS"
                name="ctpsSeries"
                value={formData.ctpsSeries}
                onChange={handleChange}
              />
              <Input
                label="Título de Eleitor"
                name="voterRegistration"
                value={formData.voterRegistration}
                onChange={handleChange}
              />
              <Input
                label="Certificado Reservista"
                name="militaryService"
                value={formData.militaryService}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4">
            <Link
              href="/hr/employees"
              className="px-6 py-2 border border-theme rounded-lg text-theme-secondary hover:bg-theme-tertiary"
            >
              Cancelar
            </Link>
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
