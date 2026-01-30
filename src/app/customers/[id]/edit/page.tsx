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

const inputClass = "w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
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
          <div>
            <label className={labelClass}>Código</label>
            <input
              type="text"
              value={formData.code}
              disabled
              className="w-full px-3 py-2 bg-theme-secondary border border-theme rounded-lg text-theme-muted cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="type" className={labelClass}>Tipo</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="COMPANY">Pessoa Jurídica</option>
              <option value="PERSON">Pessoa Física</option>
            </select>
          </div>

          {formData.type === "COMPANY" ? (
            <div>
              <label htmlFor="cnpj" className={labelClass}>CNPJ</label>
              <input
                type="text"
                id="cnpj"
                name="cnpj"
                value={formatCNPJ(formData.cnpj)}
                onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value.replace(/\D/g, "") }))}
                placeholder="00.000.000/0000-00"
                className={inputClass}
              />
            </div>
          ) : (
            <div>
              <label htmlFor="cpf" className={labelClass}>CPF</label>
              <input
                type="text"
                id="cpf"
                name="cpf"
                value={formatCPF(formData.cpf)}
                onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value.replace(/\D/g, "") }))}
                placeholder="000.000.000-00"
                className={inputClass}
              />
            </div>
          )}

          <div className="md:col-span-2">
            <label htmlFor="companyName" className={labelClass}>Razão Social *</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              required
              value={formData.companyName}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="tradeName" className={labelClass}>Nome Fantasia</label>
            <input
              type="text"
              id="tradeName"
              name="tradeName"
              value={formData.tradeName}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="stateRegistration" className={labelClass}>Inscrição Estadual</label>
            <input
              type="text"
              id="stateRegistration"
              name="stateRegistration"
              value={formData.stateRegistration}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="municipalRegistration" className={labelClass}>Inscrição Municipal</label>
            <input
              type="text"
              id="municipalRegistration"
              name="municipalRegistration"
              value={formData.municipalRegistration}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="status" className={labelClass}>Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="BLOCKED">Bloqueado</option>
            </select>
          </div>
        </div>

        {/* Contato */}
        <h2 className="text-lg font-semibold text-theme mb-4">Contato</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label htmlFor="email" className={labelClass}>E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="contactName" className={labelClass}>Nome do Contato</label>
            <input
              type="text"
              id="contactName"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="phone" className={labelClass}>Telefone</label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formatPhone(formData.phone)}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, "") }))}
              placeholder="(00) 0000-0000"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="mobile" className={labelClass}>Celular</label>
            <input
              type="text"
              id="mobile"
              name="mobile"
              value={formatPhone(formData.mobile)}
              onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value.replace(/\D/g, "") }))}
              placeholder="(00) 00000-0000"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="website" className={labelClass}>Website</label>
            <input
              type="text"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://"
              className={inputClass}
            />
          </div>
        </div>

        {/* Endereço */}
        <h2 className="text-lg font-semibold text-theme mb-4">Endereço</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div>
            <label htmlFor="addressZipCode" className={labelClass}>CEP</label>
            <input
              type="text"
              id="addressZipCode"
              name="addressZipCode"
              value={formatCEP(formData.addressZipCode)}
              onChange={(e) => setFormData(prev => ({ ...prev, addressZipCode: e.target.value.replace(/\D/g, "") }))}
              placeholder="00000-000"
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="addressStreet" className={labelClass}>Logradouro</label>
            <input
              type="text"
              id="addressStreet"
              name="addressStreet"
              value={formData.addressStreet}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="addressNumber" className={labelClass}>Número</label>
            <input
              type="text"
              id="addressNumber"
              name="addressNumber"
              value={formData.addressNumber}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="addressComplement" className={labelClass}>Complemento</label>
            <input
              type="text"
              id="addressComplement"
              name="addressComplement"
              value={formData.addressComplement}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="addressNeighborhood" className={labelClass}>Bairro</label>
            <input
              type="text"
              id="addressNeighborhood"
              name="addressNeighborhood"
              value={formData.addressNeighborhood}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="addressCity" className={labelClass}>Cidade</label>
            <input
              type="text"
              id="addressCity"
              name="addressCity"
              value={formData.addressCity}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="addressState" className={labelClass}>UF</label>
            <select
              id="addressState"
              name="addressState"
              value={formData.addressState}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Selecione</option>
              {STATES.map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dados Comerciais */}
        <h2 className="text-lg font-semibold text-theme mb-4">Dados Comerciais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="creditLimit" className={labelClass}>Limite de Crédito</label>
            <input
              type="number"
              id="creditLimit"
              name="creditLimit"
              min="0"
              step="0.01"
              value={formData.creditLimit || ""}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="paymentTermDays" className={labelClass}>Prazo de Pagamento (dias)</label>
            <input
              type="number"
              id="paymentTermDays"
              name="paymentTermDays"
              min="0"
              value={formData.paymentTermDays || ""}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="minInvoiceValue" className={labelClass}>Valor Mínimo Fatura</label>
            <input
              type="number"
              id="minInvoiceValue"
              name="minInvoiceValue"
              min="0"
              step="0.01"
              value={formData.minInvoiceValue || ""}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="defaultPaymentCondition" className={labelClass}>Condição de Pagamento Padrão</label>
            <input
              type="text"
              id="defaultPaymentCondition"
              name="defaultPaymentCondition"
              value={formData.defaultPaymentCondition}
              onChange={handleChange}
              placeholder="Ex: 30/60/90"
              className={inputClass}
            />
          </div>
        </div>

        {/* Flags */}
        <div className="flex flex-wrap gap-6 mb-6">
          <div className="flex items-center gap-2">
            <input
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
            <input
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
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-theme">
          <Link
            href="/customers"
            className="flex items-center gap-2 px-4 py-2 border border-theme text-theme-secondary rounded-lg hover:bg-theme-hover transition-colors"
          >
            <X className="w-4 h-4" />
            Cancelar
          </Link>
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
