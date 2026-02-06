"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  Save,
  X,
  Loader2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

const labelClass = "block text-sm font-medium text-theme-secondary mb-1";

interface CustomerFormData {
  code: string;
  type: "COMPANY" | "PERSON";
  companyName: string;
  tradeName: string;
  cnpj: string;
  cpf: string;
  stateRegistration: string;
  municipalRegistration: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  contactName: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  creditLimit: number;
  paymentTermDays: number;
  minInvoiceValue: number;
  defaultPaymentCondition: string;
  applySt: boolean;
  isShared: boolean;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  notes: string;
}

const STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CustomerFormData>({
    code: "",
    type: "COMPANY",
    companyName: "",
    tradeName: "",
    cnpj: "",
    cpf: "",
    stateRegistration: "",
    municipalRegistration: "",
    email: "",
    phone: "",
    mobile: "",
    website: "",
    contactName: "",
    addressStreet: "",
    addressNumber: "",
    addressComplement: "",
    addressNeighborhood: "",
    addressCity: "",
    addressState: "",
    addressZipCode: "",
    creditLimit: 0,
    paymentTermDays: 30,
    minInvoiceValue: 0,
    defaultPaymentCondition: "",
    applySt: false,
    isShared: false,
    status: "ACTIVE",
    notes: "",
  });

  const { data: customer, isLoading } = trpc.customers.byId.useQuery({ id: customerId });
  
  const updateMutation = trpc.customers.update.useMutation({
    onSuccess: () => {
      toast.success("Cliente atualizado com sucesso!");
      router.push("/customers");
    },
    onError: (err) => {
      toast.error("Erro ao atualizar cliente", { description: err.message });
      setError(err.message);
      setIsSubmitting(false);
    },
  });

  const customerFormData = useMemo(() => {
    if (!customer) return null;
    return {
      code: customer.code,
      type: (customer.type as "COMPANY" | "PERSON") || "COMPANY",
      companyName: customer.companyName,
      tradeName: customer.tradeName ?? "",
      cnpj: customer.cnpj ?? "",
      cpf: customer.cpf ?? "",
      stateRegistration: customer.stateRegistration ?? "",
      municipalRegistration: customer.municipalRegistration ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      mobile: customer.mobile ?? "",
      website: customer.website ?? "",
      contactName: customer.contactName ?? "",
      addressStreet: customer.addressStreet ?? "",
      addressNumber: customer.addressNumber ?? "",
      addressComplement: customer.addressComplement ?? "",
      addressNeighborhood: customer.addressNeighborhood ?? "",
      addressCity: customer.addressCity ?? "",
      addressState: customer.addressState ?? "",
      addressZipCode: customer.addressZipCode ?? "",
      creditLimit: customer.creditLimit ?? 0,
      paymentTermDays: customer.paymentTermDays ?? 30,
      minInvoiceValue: customer.minInvoiceValue ?? 0,
      defaultPaymentCondition: customer.defaultPaymentCondition ?? "",
      applySt: customer.applySt ?? false,
      isShared: customer.isShared ?? false,
      status: (customer.status as "ACTIVE" | "INACTIVE" | "BLOCKED") || "ACTIVE",
      notes: customer.notes ?? "",
    };
  }, [customer]);

  useEffect(() => {
    if (customerFormData) {
      setFormData(customerFormData);
    }
  }, [customerFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    updateMutation.mutate({
      id: customerId,
      type: formData.type,
      companyName: formData.companyName,
      tradeName: formData.tradeName || undefined,
      cnpj: formData.cnpj || undefined,
      cpf: formData.cpf || undefined,
      stateRegistration: formData.stateRegistration || undefined,
      municipalRegistration: formData.municipalRegistration || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      mobile: formData.mobile || undefined,
      website: formData.website || undefined,
      contactName: formData.contactName || undefined,
      addressStreet: formData.addressStreet || undefined,
      addressNumber: formData.addressNumber || undefined,
      addressComplement: formData.addressComplement || undefined,
      addressNeighborhood: formData.addressNeighborhood || undefined,
      addressCity: formData.addressCity || undefined,
      addressState: formData.addressState || undefined,
      addressZipCode: formData.addressZipCode || undefined,
      creditLimit: formData.creditLimit || undefined,
      paymentTermDays: formData.paymentTermDays || undefined,
      minInvoiceValue: formData.minInvoiceValue || undefined,
      defaultPaymentCondition: formData.defaultPaymentCondition || undefined,
      applySt: formData.applySt,
      isShared: formData.isShared,
      status: formData.status,
      notes: formData.notes || undefined,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" 
        ? (e.target as HTMLInputElement).checked 
        : type === "number" 
          ? parseFloat(value) || 0 
          : value,
    }));
  };

  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0,2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8)}`;
    return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8,12)}-${digits.slice(12)}`;
  };

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0,3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6)}`;
    return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  };

  const formatCEP = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0,5)}-${digits.slice(5)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-theme-secondary">Carregando cliente...</span>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-xl font-bold text-theme mb-2">Cliente não encontrado</h1>
          <Link href="/customers" className="text-blue-400 hover:underline">
            Voltar para listagem
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar Cliente"
        subtitle={`Código: ${customer.code}`}
        icon={<Building2 className="w-6 h-6" />}
        backHref="/customers"
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-theme-card rounded-xl border border-theme p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Identificação */}
        <h2 className="text-lg font-semibold text-theme mb-4">Identificação</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Input
            label="Código"
            value={formData.code}
            disabled
          />

          <div>
            <label htmlFor="type" className={labelClass}>Tipo</label>
            <Select
              value={formData.type}
              onChange={(value) => setFormData(prev => ({ ...prev, type: value as typeof formData.type }))}
              options={[
                { value: "COMPANY", label: "Pessoa Jurídica" },
                { value: "PERSON", label: "Pessoa Física" },
              ]}
            />
          </div>

          {formData.type === "COMPANY" ? (
            <Input
              label="CNPJ"
              id="cnpj"
              name="cnpj"
              value={formatCNPJ(formData.cnpj)}
              onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value.replace(/\D/g, "") }))}
              placeholder="00.000.000/0000-00"
            />
          ) : (
            <Input
              label="CPF"
              id="cpf"
              name="cpf"
              value={formatCPF(formData.cpf)}
              onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value.replace(/\D/g, "") }))}
              placeholder="000.000.000-00"
            />
          )}

          <div className="md:col-span-2">
            <Input
              label="Razão Social *"
              id="companyName"
              name="companyName"
              required
              value={formData.companyName}
              onChange={handleChange}
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Nome Fantasia"
              id="tradeName"
              name="tradeName"
              value={formData.tradeName}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Inscrição Estadual"
            id="stateRegistration"
            name="stateRegistration"
            value={formData.stateRegistration}
            onChange={handleChange}
          />

          <Input
            label="Inscrição Municipal"
            id="municipalRegistration"
            name="municipalRegistration"
            value={formData.municipalRegistration}
            onChange={handleChange}
          />

          <div>
            <label htmlFor="status" className={labelClass}>Status</label>
            <Select
              value={formData.status}
              onChange={(value) => setFormData(prev => ({ ...prev, status: value as typeof formData.status }))}
              options={[
                { value: "ACTIVE", label: "Ativo" },
                { value: "INACTIVE", label: "Inativo" },
                { value: "BLOCKED", label: "Bloqueado" },
              ]}
            />
          </div>
        </div>

        {/* Contato */}
        <h2 className="text-lg font-semibold text-theme mb-4">Contato</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Input
            label="E-mail"
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />

          <Input
            label="Nome do Contato"
            id="contactName"
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
          />

          <Input
            label="Telefone"
            id="phone"
            name="phone"
            value={formatPhone(formData.phone)}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, "") }))}
            placeholder="(00) 0000-0000"
          />

          <Input
            label="Celular"
            id="mobile"
            name="mobile"
            value={formatPhone(formData.mobile)}
            onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value.replace(/\D/g, "") }))}
            placeholder="(00) 00000-0000"
          />

          <Input
            label="Website"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://"
          />
        </div>

        {/* Endereço */}
        <h2 className="text-lg font-semibold text-theme mb-4">Endereço</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Input
            label="CEP"
            id="addressZipCode"
            name="addressZipCode"
            value={formatCEP(formData.addressZipCode)}
            onChange={(e) => setFormData(prev => ({ ...prev, addressZipCode: e.target.value.replace(/\D/g, "") }))}
            placeholder="00000-000"
          />

          <div className="md:col-span-2">
            <Input
              label="Logradouro"
              id="addressStreet"
              name="addressStreet"
              value={formData.addressStreet}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Número"
            id="addressNumber"
            name="addressNumber"
            value={formData.addressNumber}
            onChange={handleChange}
          />

          <Input
            label="Complemento"
            id="addressComplement"
            name="addressComplement"
            value={formData.addressComplement}
            onChange={handleChange}
          />

          <Input
            label="Bairro"
            id="addressNeighborhood"
            name="addressNeighborhood"
            value={formData.addressNeighborhood}
            onChange={handleChange}
          />

          <Input
            label="Cidade"
            id="addressCity"
            name="addressCity"
            value={formData.addressCity}
            onChange={handleChange}
          />

          <div>
            <label htmlFor="addressState" className={labelClass}>UF</label>
            <Select
              value={formData.addressState}
              onChange={(value) => setFormData(prev => ({ ...prev, addressState: value }))}
              placeholder="Selecione"
              options={[
                { value: "", label: "Selecione" },
                ...STATES.map(uf => ({ value: uf, label: uf })),
              ]}
            />
          </div>
        </div>

        {/* Dados Comerciais */}
        <h2 className="text-lg font-semibold text-theme mb-4">Dados Comerciais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Input
            label="Limite de Crédito"
            type="number"
            id="creditLimit"
            name="creditLimit"
            min="0"
            step="0.01"
            value={formData.creditLimit || ""}
            onChange={handleChange}
          />

          <Input
            label="Prazo de Pagamento (dias)"
            type="number"
            id="paymentTermDays"
            name="paymentTermDays"
            min="0"
            value={formData.paymentTermDays || ""}
            onChange={handleChange}
          />

          <Input
            label="Valor Mínimo Fatura"
            type="number"
            id="minInvoiceValue"
            name="minInvoiceValue"
            min="0"
            step="0.01"
            value={formData.minInvoiceValue || ""}
            onChange={handleChange}
          />

          <Input
            label="Condição de Pagamento Padrão"
            id="defaultPaymentCondition"
            name="defaultPaymentCondition"
            value={formData.defaultPaymentCondition}
            onChange={handleChange}
            placeholder="Ex: 30/60/90"
          />
        </div>

        {/* Flags */}
        <div className="flex flex-wrap gap-6 mb-6">
          <div className="flex items-center gap-2">
            <Input
              type="checkbox"
              id="applySt"
              name="applySt"
              checked={formData.applySt}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 bg-theme-input border-theme rounded focus:ring-blue-500"
            />
            <label htmlFor="applySt" className="text-sm font-medium text-theme-secondary">
              Aplicar Substituição Tributária
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="checkbox"
              id="isShared"
              name="isShared"
              checked={formData.isShared}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 bg-theme-input border-theme rounded focus:ring-blue-500"
            />
            <label htmlFor="isShared" className="text-sm font-medium text-theme-secondary">
              Compartilhar com outras empresas
            </label>
          </div>
        </div>

        {/* Observações */}
        <div className="mb-6">
          <label htmlFor="notes" className={labelClass}>Observações</label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-theme">
          <Button
            variant="outline"
            onClick={() => router.push("/customers")}
            leftIcon={<X className="w-4 h-4" />}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
