"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  Save,
  X,
  Loader2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";

const inputClass = "w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-green-500 focus:border-green-500";
const labelClass = "block text-sm font-medium text-theme-secondary mb-1";

interface SupplierFormData {
  code: number;
  companyName: string;
  tradeName: string;
  cnpj: string;
  cpf: string;
  ie: string;
  im: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  contactName: string;
  paymentTerms: string;
  notes: string;
  isShared: boolean;
  // Categorias
  cat01Embalagens: boolean;
  cat02Tintas: boolean;
  cat03OleosGraxas: boolean;
  cat04Dispositivos: boolean;
  cat05Acessorios: boolean;
  cat06Manutencao: boolean;
  cat07Servicos: boolean;
  cat08Escritorio: boolean;
  // Tipo de atividade
  isWholesaler: boolean;
  isRetailer: boolean;
  isIndustry: boolean;
  isService: boolean;
  cnae: string;
  // IQF
  certificationType: string;
  iqfPercent: number;
  iqfStatus: string;
  // Outros
  taxRegime: string;
  hasFinancialContract: boolean;
}

const STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function NewSupplierPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<SupplierFormData>({
    code: 0,
    companyName: "",
    tradeName: "",
    cnpj: "",
    cpf: "",
    ie: "",
    im: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    mobile: "",
    email: "",
    website: "",
    contactName: "",
    paymentTerms: "",
    notes: "",
    isShared: false,
    // Categorias
    cat01Embalagens: false,
    cat02Tintas: false,
    cat03OleosGraxas: false,
    cat04Dispositivos: false,
    cat05Acessorios: false,
    cat06Manutencao: false,
    cat07Servicos: false,
    cat08Escritorio: false,
    // Tipo de atividade
    isWholesaler: false,
    isRetailer: false,
    isIndustry: false,
    isService: false,
    cnae: "",
    // IQF
    certificationType: "",
    iqfPercent: 0,
    iqfStatus: "",
    // Outros
    taxRegime: "",
    hasFinancialContract: false,
  });

  const createMutation = trpc.suppliers.create.useMutation({
    onSuccess: () => {
      router.push("/suppliers");
    },
    onError: (err) => {
      setError(err.message);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    createMutation.mutate({
      code: formData.code,
      companyName: formData.companyName,
      tradeName: formData.tradeName || undefined,
      cnpj: formData.cnpj || undefined,
      cpf: formData.cpf || undefined,
      ie: formData.ie || undefined,
      im: formData.im || undefined,
      address: formData.address || undefined,
      number: formData.number || undefined,
      complement: formData.complement || undefined,
      neighborhood: formData.neighborhood || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      zipCode: formData.zipCode || undefined,
      phone: formData.phone || undefined,
      mobile: formData.mobile || undefined,
      email: formData.email || undefined,
      website: formData.website || undefined,
      contactName: formData.contactName || undefined,
      paymentTerms: formData.paymentTerms || undefined,
      notes: formData.notes || undefined,
      isShared: formData.isShared,
      // Categorias
      cat01Embalagens: formData.cat01Embalagens,
      cat02Tintas: formData.cat02Tintas,
      cat03OleosGraxas: formData.cat03OleosGraxas,
      cat04Dispositivos: formData.cat04Dispositivos,
      cat05Acessorios: formData.cat05Acessorios,
      cat06Manutencao: formData.cat06Manutencao,
      cat07Servicos: formData.cat07Servicos,
      cat08Escritorio: formData.cat08Escritorio,
      // Tipo de atividade
      isWholesaler: formData.isWholesaler,
      isRetailer: formData.isRetailer,
      isIndustry: formData.isIndustry,
      isService: formData.isService,
      cnae: formData.cnae || undefined,
      // IQF
      certificationType: formData.certificationType as "UNDEFINED" | "ISO_RBS" | "INITIAL_EVAL" | "STRATEGIC" | undefined || undefined,
      iqfPercent: formData.iqfPercent || undefined,
      iqfStatus: formData.iqfStatus as "NEW" | "APPROVED" | "REJECTED" | undefined || undefined,
      // Outros
      taxRegime: formData.taxRegime || undefined,
      hasFinancialContract: formData.hasFinancialContract,
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Fornecedor"
        subtitle="CP11 - Cadastro de Fornecedores"
        icon={<Users className="w-6 h-6" />}
        backHref="/suppliers"
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-theme-card rounded-xl border border-theme p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Dados Básicos */}
        <h2 className="text-lg font-semibold text-theme mb-4">Dados Básicos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label htmlFor="code" className={labelClass}>Código *</label>
            <input
              type="number"
              id="code"
              name="code"
              required
              value={formData.code || ""}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

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
            <label htmlFor="ie" className={labelClass}>Inscrição Estadual</label>
            <input
              type="text"
              id="ie"
              name="ie"
              value={formData.ie}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="im" className={labelClass}>Inscrição Municipal</label>
            <input
              type="text"
              id="im"
              name="im"
              value={formData.im}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        {/* Endereço */}
        <h2 className="text-lg font-semibold text-theme mb-4">Endereço</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div>
            <label htmlFor="zipCode" className={labelClass}>CEP</label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formatCEP(formData.zipCode)}
              onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value.replace(/\D/g, "") }))}
              placeholder="00000-000"
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="address" className={labelClass}>Endereço</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="number" className={labelClass}>Número</label>
            <input
              type="text"
              id="number"
              name="number"
              value={formData.number}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="complement" className={labelClass}>Complemento</label>
            <input
              type="text"
              id="complement"
              name="complement"
              value={formData.complement}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="neighborhood" className={labelClass}>Bairro</label>
            <input
              type="text"
              id="neighborhood"
              name="neighborhood"
              value={formData.neighborhood}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="city" className={labelClass}>Cidade</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="state" className={labelClass}>UF</label>
            <select
              id="state"
              name="state"
              value={formData.state}
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

        {/* Contato */}
        <h2 className="text-lg font-semibold text-theme mb-4">Contato</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
            <label htmlFor="paymentTerms" className={labelClass}>Condições de Pagamento</label>
            <input
              type="text"
              id="paymentTerms"
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={handleChange}
              placeholder="Ex: 30/60/90 dias"
              className={inputClass}
            />
          </div>
        </div>

        {/* Categorias */}
        <h2 className="text-lg font-semibold text-theme mb-4">Categorias de Fornecimento</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { id: "cat01Embalagens", label: "Embalagens" },
            { id: "cat02Tintas", label: "Tintas" },
            { id: "cat03OleosGraxas", label: "Óleos/Graxas" },
            { id: "cat04Dispositivos", label: "Dispositivos" },
            { id: "cat05Acessorios", label: "Acessórios" },
            { id: "cat06Manutencao", label: "Manutenção" },
            { id: "cat07Servicos", label: "Serviços" },
            { id: "cat08Escritorio", label: "Escritório" },
          ].map(cat => (
            <div key={cat.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={cat.id}
                name={cat.id}
                checked={formData[cat.id as keyof SupplierFormData] as boolean}
                onChange={handleChange}
                className="w-4 h-4 text-green-600 bg-theme-input border-theme rounded focus:ring-green-500"
              />
              <label htmlFor={cat.id} className="text-sm text-theme-secondary">{cat.label}</label>
            </div>
          ))}
        </div>

        {/* Tipo de Atividade */}
        <h2 className="text-lg font-semibold text-theme mb-4">Tipo de Atividade</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { id: "isWholesaler", label: "Atacadista" },
            { id: "isRetailer", label: "Varejista" },
            { id: "isIndustry", label: "Indústria" },
            { id: "isService", label: "Serviço" },
          ].map(tipo => (
            <div key={tipo.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={tipo.id}
                name={tipo.id}
                checked={formData[tipo.id as keyof SupplierFormData] as boolean}
                onChange={handleChange}
                className="w-4 h-4 text-green-600 bg-theme-input border-theme rounded focus:ring-green-500"
              />
              <label htmlFor={tipo.id} className="text-sm text-theme-secondary">{tipo.label}</label>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label htmlFor="cnae" className={labelClass}>CNAE</label>
            <input
              type="text"
              id="cnae"
              name="cnae"
              value={formData.cnae}
              onChange={handleChange}
              placeholder="0000-0/00"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="taxRegime" className={labelClass}>Regime Tributário</label>
            <input
              type="text"
              id="taxRegime"
              name="taxRegime"
              value={formData.taxRegime}
              onChange={handleChange}
              placeholder="Ex: Simples Nacional"
              className={inputClass}
            />
          </div>
        </div>

        {/* IQF - Índice de Qualidade */}
        <h2 className="text-lg font-semibold text-theme mb-4">Qualidade (IQF)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label htmlFor="certificationType" className={labelClass}>Tipo de Certificação</label>
            <select
              id="certificationType"
              name="certificationType"
              value={formData.certificationType}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Selecione</option>
              <option value="UNDEFINED">Indefinido</option>
              <option value="ISO_RBS">ISO/RBS</option>
              <option value="INITIAL_EVAL">Avaliação Inicial</option>
              <option value="STRATEGIC">Estratégico</option>
            </select>
          </div>
          <div>
            <label htmlFor="iqfPercent" className={labelClass}>IQF (%)</label>
            <input
              type="number"
              id="iqfPercent"
              name="iqfPercent"
              value={formData.iqfPercent || ""}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.1"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="iqfStatus" className={labelClass}>Status IQF</label>
            <select
              id="iqfStatus"
              name="iqfStatus"
              value={formData.iqfStatus}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Selecione</option>
              <option value="NEW">Novo</option>
              <option value="APPROVED">Aprovado</option>
              <option value="REJECTED">Reprovado</option>
            </select>
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

        {/* Compartilhado */}
        <div className="flex items-center gap-2 mb-6">
          <input
            type="checkbox"
            id="isShared"
            name="isShared"
            checked={formData.isShared}
            onChange={handleChange}
            className="w-4 h-4 text-green-600 bg-theme-input border-theme rounded focus:ring-green-500"
          />
          <label htmlFor="isShared" className="text-sm font-medium text-theme-secondary">
            Compartilhar com outras empresas
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-theme">
          <Link
            href="/suppliers"
            className="flex items-center gap-2 px-4 py-2 border border-theme text-theme-secondary rounded-lg hover:bg-theme-hover transition-colors"
          >
            <X className="w-4 h-4" />
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}
