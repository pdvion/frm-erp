"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Users,
  ChevronLeft,
  Save,
  Loader2,
  User,
  Building2,
  Calendar,
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
  
  // Buscar escalas de trabalho
  const { data: workSchedules } = trpc.hr.listWorkSchedules.useQuery({});

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
        cpf: formData.cpf.replace(/\D/g, ""),
        rg: formData.rg || undefined,
        birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        mobile: formData.mobile || undefined,
        address: formData.address || undefined,
        addressNumber: formData.addressNumber || undefined,
        addressComplement: formData.addressComplement || undefined,
        neighborhood: formData.neighborhood || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode?.replace(/\D/g, "") || undefined,
        contractType: formData.contractType as "CLT" | "PJ" | "TEMPORARY" | "INTERN" | "APPRENTICE",
        admissionDate: new Date(formData.admissionDate),
        departmentId: formData.departmentId || undefined,
        positionId: formData.positionId || undefined,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        workScheduleId: formData.workScheduleId || undefined,
        pis: formData.pis || undefined,
        ctps: formData.ctps || undefined,
        ctpsSeries: formData.ctpsSeries || undefined,
        voterRegistration: formData.voterRegistration || undefined,
        militaryService: formData.militaryService || undefined,
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
      <header className="bg-theme-card border-b border-theme sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/hr/employees" className="text-theme-muted hover:text-theme-secondary">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-semibold text-theme">Novo Funcionário</h1>
              </div>
            </div>
            <CompanySwitcher />
          </div>
        </div>
      </header>

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
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  CPF *
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  required
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  RG
                </label>
                <input
                  type="text"
                  name="rg"
                  value={formData.rg}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
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
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  E-mail
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(00) 0000-0000"
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Celular
                </label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-theme">Endereço</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="00000-000"
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Número
                </label>
                <input
                  type="text"
                  name="addressNumber"
                  value={formData.addressNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  name="addressComplement"
                  value={formData.addressComplement}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                />
              </div>
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
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data de Admissão *
                </label>
                <input
                  type="date"
                  name="admissionDate"
                  value={formData.admissionDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                />
              </div>
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
                  {departments?.items?.map((dept) => (
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
                  {positions?.items?.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  <CreditCard className="w-4 h-4 inline mr-1" />
                  Salário
                </label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                />
              </div>
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
                  {workSchedules?.items?.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.name}
                    </option>
                  ))}
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
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  PIS/PASEP
                </label>
                <input
                  type="text"
                  name="pis"
                  value={formData.pis}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  CTPS
                </label>
                <input
                  type="text"
                  name="ctps"
                  value={formData.ctps}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Série CTPS
                </label>
                <input
                  type="text"
                  name="ctpsSeries"
                  value={formData.ctpsSeries}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Título de Eleitor
                </label>
                <input
                  type="text"
                  name="voterRegistration"
                  value={formData.voterRegistration}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Certificado Reservista
                </label>
                <input
                  type="text"
                  name="militaryService"
                  value={formData.militaryService}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg"
                />
              </div>
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
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
