"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Package, 
  Save,
  X,
  Info,
  Boxes,
  FileText,
  Settings,
  HardHat,
  Factory,
  DollarSign,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { SelectWithAdd } from "@/components/ui/SelectWithAdd";
import { CategoryQuickForm } from "@/components/forms/CategoryQuickForm";

interface MaterialFormData {
  code: number;
  description: string;
  internalCode: string;
  unit: string;
  purchaseUnit: string;
  unitConversionFactor: number;
  categoryId: string;
  subCategoryId: string;
  stockLocationId: string;
  minQuantity: number;
  maxQuantity: number;
  minQuantityCalcType: string;
  maxMonthlyConsumption: number;
  adjustMaxConsumptionManual: boolean;
  avgDeliveryDays: number;
  ncm: string;
  ipiRate: number;
  icmsRate: number;
  location: string;
  isEpi: boolean;
  epiCaCode: string;
  isOfficeSupply: boolean;
  financialValidated: boolean;
  financialValidatedCc: boolean;
  requiresQualityCheck: boolean;
  requiresQualityInspection: boolean;
  requiresMaterialCertificate: boolean;
  requiresControlSheets: boolean;
  requiresReturn: boolean;
  requiresFiscalEntry: boolean;
  requiredBrand: string;
  requiredBrandReason: string;
  writeOffCode: string;
  costCenterFrm: string;
  costCenterFnd: string;
  financialAccount: string;
  weight: number;
  weightUnit: string;
  barcode: string;
  manufacturer: string;
  manufacturerCode: string;
  notes: string;
  isShared: boolean;
}

export default function NewMaterialPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<"basic" | "stock" | "fiscal" | "quality" | "extra">("basic");
  
  const [formData, setFormData] = useState<MaterialFormData>({
    code: 0,
    description: "",
    internalCode: "",
    unit: "UN",
    purchaseUnit: "",
    unitConversionFactor: 1,
    categoryId: "",
    subCategoryId: "",
    stockLocationId: "",
    minQuantity: 0,
    maxQuantity: 0,
    minQuantityCalcType: "MANUAL",
    maxMonthlyConsumption: 0,
    adjustMaxConsumptionManual: false,
    avgDeliveryDays: 0,
    ncm: "",
    ipiRate: 0,
    icmsRate: 0,
    location: "",
    isEpi: false,
    epiCaCode: "",
    isOfficeSupply: false,
    financialValidated: false,
    financialValidatedCc: false,
    requiresQualityCheck: false,
    requiresQualityInspection: false,
    requiresMaterialCertificate: false,
    requiresControlSheets: false,
    requiresReturn: false,
    requiresFiscalEntry: false,
    requiredBrand: "",
    requiredBrandReason: "",
    writeOffCode: "",
    costCenterFrm: "",
    costCenterFnd: "",
    financialAccount: "",
    weight: 0,
    weightUnit: "KG",
    barcode: "",
    manufacturer: "",
    manufacturerCode: "",
    notes: "",
    isShared: false,
  });

  const { data: categories } = trpc.materials.listCategories.useQuery();
  const createMutation = trpc.materials.create.useMutation({
    onSuccess: () => {
      router.push("/materials");
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
      description: formData.description,
      internalCode: formData.internalCode || undefined,
      unit: formData.unit,
      purchaseUnit: formData.purchaseUnit || undefined,
      unitConversionFactor: formData.unitConversionFactor || 1,
      categoryId: formData.categoryId || undefined,
      subCategoryId: formData.subCategoryId || undefined,
      stockLocationId: formData.stockLocationId || undefined,
      minQuantity: formData.minQuantity || undefined,
      maxQuantity: formData.maxQuantity || undefined,
      minQuantityCalcType: formData.minQuantityCalcType as "MANUAL" | "CMM" | "PEAK_12M",
      maxMonthlyConsumption: formData.maxMonthlyConsumption || undefined,
      adjustMaxConsumptionManual: formData.adjustMaxConsumptionManual,
      avgDeliveryDays: formData.avgDeliveryDays || undefined,
      ncm: formData.ncm || undefined,
      ipiRate: formData.ipiRate || undefined,
      icmsRate: formData.icmsRate || undefined,
      location: formData.location || undefined,
      isEpi: formData.isEpi,
      epiCaCode: formData.epiCaCode || undefined,
      isOfficeSupply: formData.isOfficeSupply,
      financialValidated: formData.financialValidated,
      financialValidatedCc: formData.financialValidatedCc,
      requiresQualityCheck: formData.requiresQualityCheck,
      requiresQualityInspection: formData.requiresQualityInspection,
      requiresMaterialCertificate: formData.requiresMaterialCertificate,
      requiresControlSheets: formData.requiresControlSheets,
      requiresReturn: formData.requiresReturn,
      requiresFiscalEntry: formData.requiresFiscalEntry,
      requiredBrand: formData.requiredBrand || undefined,
      requiredBrandReason: formData.requiredBrandReason || undefined,
      writeOffCode: formData.writeOffCode || undefined,
      costCenterFrm: formData.costCenterFrm || undefined,
      costCenterFnd: formData.costCenterFnd || undefined,
      financialAccount: formData.financialAccount || undefined,
      weight: formData.weight || undefined,
      weightUnit: formData.weightUnit || "KG",
      barcode: formData.barcode || undefined,
      manufacturer: formData.manufacturer || undefined,
      manufacturerCode: formData.manufacturerCode || undefined,
      notes: formData.notes || undefined,
      isShared: formData.isShared,
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

  const inputClass = "w-full px-3 py-2 min-h-[44px] bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelClass = "block text-sm font-medium text-theme-secondary mb-1";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Material"
        subtitle="CP10 - Cadastro de Materiais"
        icon={<Package className="w-6 h-6" />}
        backHref="/materials"
        breadcrumbs={[
          { label: "Compras", href: "/purchase-orders" },
          { label: "Materiais", href: "/materials" },
          { label: "Novo" },
        ]}
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-theme-card rounded-xl border border-theme">
        {error && (
          <div className="m-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-theme">
          <nav className="flex overflow-x-auto px-4" aria-label="Tabs">
            {[
              { id: "basic", label: "Dados Básicos", icon: Info },
              { id: "stock", label: "Estoque", icon: Boxes },
              { id: "fiscal", label: "Fiscal", icon: DollarSign },
              { id: "quality", label: "Qualidade", icon: FileText },
              { id: "extra", label: "Extras", icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-theme-muted hover:text-theme hover:border-theme"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Dados Básicos */}
          {activeTab === "basic" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label htmlFor="code" className={labelClass}>Código *</label>
                <input type="number" id="code" name="code" required value={formData.code || ""} onChange={handleChange} className={inputClass} data-testid="input-code" />
              </div>
              <div>
                <label htmlFor="internalCode" className={labelClass}>Código Interno</label>
                <input type="text" id="internalCode" name="internalCode" value={formData.internalCode} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="barcode" className={labelClass}>Código de Barras</label>
                <input type="text" id="barcode" name="barcode" value={formData.barcode} onChange={handleChange} className={inputClass} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label htmlFor="description" className={labelClass}>Descrição *</label>
                <input type="text" id="description" name="description" required value={formData.description} onChange={handleChange} className={inputClass} data-testid="input-description" />
              </div>
              <SelectWithAdd
                id="categoryId"
                name="categoryId"
                label="Categoria"
                value={formData.categoryId}
                onChange={handleChange}
                options={categories?.map((cat) => ({ value: cat.id, label: cat.name })) || []}
                placeholder="Selecione uma categoria"
                drawerTitle="Nova Categoria"
                drawerDescription="Cadastre uma nova categoria para materiais"
                drawerSize="sm"
                FormComponent={CategoryQuickForm}
              />
              <div>
                <label htmlFor="unit" className={labelClass}>Unidade Estoque *</label>
                <select id="unit" name="unit" required value={formData.unit} onChange={handleChange} className={inputClass} data-testid="select-unit">
                  <option value="UN">UN - Unidade</option>
                  <option value="KG">KG - Quilograma</option>
                  <option value="M">M - Metro</option>
                  <option value="M2">M² - Metro Quadrado</option>
                  <option value="M3">M³ - Metro Cúbico</option>
                  <option value="L">L - Litro</option>
                  <option value="PC">PC - Peça</option>
                  <option value="CX">CX - Caixa</option>
                  <option value="PCT">PCT - Pacote</option>
                  <option value="ROL">ROL - Rolo</option>
                </select>
              </div>
              <div>
                <label htmlFor="purchaseUnit" className={labelClass}>Unidade Compra</label>
                <select id="purchaseUnit" name="purchaseUnit" value={formData.purchaseUnit} onChange={handleChange} className={inputClass}>
                  <option value="">Mesma do estoque</option>
                  <option value="UN">UN - Unidade</option>
                  <option value="KG">KG - Quilograma</option>
                  <option value="M">M - Metro</option>
                  <option value="CX">CX - Caixa</option>
                  <option value="PCT">PCT - Pacote</option>
                  <option value="ROL">ROL - Rolo</option>
                </select>
              </div>
              {formData.purchaseUnit && formData.purchaseUnit !== formData.unit && (
                <div>
                  <label htmlFor="unitConversionFactor" className={labelClass}>Fator Conversão</label>
                  <input type="number" id="unitConversionFactor" name="unitConversionFactor" step="0.0001" value={formData.unitConversionFactor} onChange={handleChange} className={inputClass} placeholder="1 CX = X UN" />
                </div>
              )}
              <div>
                <label htmlFor="location" className={labelClass}>Localização</label>
                <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} placeholder="Ex: Prateleira A-01" className={inputClass} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label htmlFor="notes" className={labelClass}>Observações</label>
                <textarea id="notes" name="notes" rows={3} value={formData.notes} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          )}

          {/* Tab: Estoque */}
          {activeTab === "stock" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label htmlFor="minQuantity" className={labelClass}>Qtd. Mínima</label>
                <input type="number" id="minQuantity" name="minQuantity" step="0.01" value={formData.minQuantity || ""} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="maxQuantity" className={labelClass}>Qtd. Máxima</label>
                <input type="number" id="maxQuantity" name="maxQuantity" step="0.01" value={formData.maxQuantity || ""} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="minQuantityCalcType" className={labelClass}>Cálculo Qtd. Mínima</label>
                <select id="minQuantityCalcType" name="minQuantityCalcType" value={formData.minQuantityCalcType} onChange={handleChange} className={inputClass}>
                  <option value="MANUAL">Manual</option>
                  <option value="CMM">Consumo Médio Mensal</option>
                  <option value="PEAK_12M">Pico 12 Meses</option>
                </select>
              </div>
              <div>
                <label htmlFor="maxMonthlyConsumption" className={labelClass}>Consumo Máximo Mensal</label>
                <input type="number" id="maxMonthlyConsumption" name="maxMonthlyConsumption" step="0.01" value={formData.maxMonthlyConsumption || ""} onChange={handleChange} className={inputClass} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="adjustMaxConsumptionManual" name="adjustMaxConsumptionManual" checked={formData.adjustMaxConsumptionManual} onChange={handleChange} className="w-4 h-4 text-blue-600 bg-theme-input border-theme rounded focus:ring-blue-500" />
                <label htmlFor="adjustMaxConsumptionManual" className="text-sm font-medium text-theme-secondary">Ajustar consumo máximo manualmente</label>
              </div>
              <div>
                <label htmlFor="avgDeliveryDays" className={labelClass}>Tempo Médio Entrega (dias)</label>
                <input type="number" id="avgDeliveryDays" name="avgDeliveryDays" step="1" value={formData.avgDeliveryDays || ""} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="weight" className={labelClass}>Peso</label>
                <div className="flex gap-2">
                  <input type="number" id="weight" name="weight" step="0.001" value={formData.weight || ""} onChange={handleChange} className={inputClass} />
                  <select id="weightUnit" name="weightUnit" value={formData.weightUnit} onChange={handleChange} className="w-24 px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme">
                    <option value="KG">KG</option>
                    <option value="G">G</option>
                    <option value="T">T</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Fiscal */}
          {activeTab === "fiscal" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="ncm" className={labelClass}>NCM</label>
                  <input type="text" id="ncm" name="ncm" value={formData.ncm} onChange={handleChange} placeholder="00000000" maxLength={8} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="ipiRate" className={labelClass}>% IPI</label>
                  <input type="number" id="ipiRate" name="ipiRate" step="0.01" value={formData.ipiRate || ""} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="icmsRate" className={labelClass}>% ICMS</label>
                  <input type="number" id="icmsRate" name="icmsRate" step="0.01" value={formData.icmsRate || ""} onChange={handleChange} className={inputClass} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="requiresFiscalEntry" name="requiresFiscalEntry" checked={formData.requiresFiscalEntry} onChange={handleChange} className="w-4 h-4 text-blue-600 bg-theme-input border-theme rounded focus:ring-blue-500" />
                  <label htmlFor="requiresFiscalEntry" className="text-sm font-medium text-theme-secondary">Requer entrada fiscal</label>
                </div>
              </div>
              <div className="border-t border-theme pt-4">
                <h3 className="text-sm font-semibold text-theme flex items-center gap-2 mb-4">
                  <DollarSign className="w-4 h-4" /> Financeiro
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="writeOffCode" className={labelClass}>Código de Baixa</label>
                    <input type="text" id="writeOffCode" name="writeOffCode" value={formData.writeOffCode} onChange={handleChange} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="costCenterFrm" className={labelClass}>Centro Custo FRM</label>
                    <input type="text" id="costCenterFrm" name="costCenterFrm" value={formData.costCenterFrm} onChange={handleChange} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="costCenterFnd" className={labelClass}>Centro Custo FND</label>
                    <input type="text" id="costCenterFnd" name="costCenterFnd" value={formData.costCenterFnd} onChange={handleChange} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="financialAccount" className={labelClass}>Conta Financeira</label>
                    <input type="text" id="financialAccount" name="financialAccount" value={formData.financialAccount} onChange={handleChange} className={inputClass} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Qualidade */}
          {activeTab === "quality" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-theme flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Requisitos de Qualidade
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="requiresQualityCheck" checked={formData.requiresQualityCheck} onChange={handleChange} className="w-4 h-4 text-blue-600 bg-theme-input border-theme rounded focus:ring-blue-500" />
                      <span className="text-sm text-theme-secondary">Requer IQF (Índice de Qualidade)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="requiresQualityInspection" checked={formData.requiresQualityInspection} onChange={handleChange} className="w-4 h-4 text-blue-600 bg-theme-input border-theme rounded focus:ring-blue-500" />
                      <span className="text-sm text-theme-secondary">Requer inspeção de qualidade</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="requiresMaterialCertificate" checked={formData.requiresMaterialCertificate} onChange={handleChange} className="w-4 h-4 text-blue-600 bg-theme-input border-theme rounded focus:ring-blue-500" />
                      <span className="text-sm text-theme-secondary">Requer certificado de material</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="requiresControlSheets" checked={formData.requiresControlSheets} onChange={handleChange} className="w-4 h-4 text-blue-600 bg-theme-input border-theme rounded focus:ring-blue-500" />
                      <span className="text-sm text-theme-secondary">Requer controle de fichas</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="requiresReturn" checked={formData.requiresReturn} onChange={handleChange} className="w-4 h-4 text-blue-600 bg-theme-input border-theme rounded focus:ring-blue-500" />
                      <span className="text-sm text-theme-secondary">Requer devolução</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-theme flex items-center gap-2">
                    <HardHat className="w-4 h-4" /> Classificação
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="isEpi" checked={formData.isEpi} onChange={handleChange} className="w-4 h-4 text-orange-600 bg-theme-input border-theme rounded focus:ring-orange-500" />
                      <span className="text-sm text-theme-secondary">Material é EPI</span>
                    </label>
                    {formData.isEpi && (
                      <div className="ml-6">
                        <label htmlFor="epiCaCode" className="block text-xs font-medium text-theme-muted mb-1">Código CA (EPI)</label>
                        <input type="text" id="epiCaCode" name="epiCaCode" value={formData.epiCaCode} onChange={handleChange} placeholder="Ex: 12345" className="w-full px-3 py-1.5 text-sm bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                      </div>
                    )}
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="isOfficeSupply" checked={formData.isOfficeSupply} onChange={handleChange} className="w-4 h-4 text-blue-600 bg-theme-input border-theme rounded focus:ring-blue-500" />
                      <span className="text-sm text-theme-secondary">Material de escritório</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="financialValidated" checked={formData.financialValidated} onChange={handleChange} className="w-4 h-4 text-green-600 bg-theme-input border-theme rounded focus:ring-green-500" />
                      <span className="text-sm text-theme-secondary">Validado pelo Financeiro</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="financialValidatedCc" checked={formData.financialValidatedCc} onChange={handleChange} className="w-4 h-4 text-green-600 bg-theme-input border-theme rounded focus:ring-green-500" />
                      <span className="text-sm text-theme-secondary">Validado pelo Financeiro (Centro de Custo)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="isShared" checked={formData.isShared} onChange={handleChange} className="w-4 h-4 text-purple-600 bg-theme-input border-theme rounded focus:ring-purple-500" />
                      <span className="text-sm text-theme-secondary">Compartilhar com outras empresas</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="border-t border-theme pt-4">
                <h3 className="text-sm font-semibold text-theme mb-3">Marca Obrigatória</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="requiredBrand" className={labelClass}>Marca</label>
                    <input type="text" id="requiredBrand" name="requiredBrand" value={formData.requiredBrand} onChange={handleChange} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="requiredBrandReason" className={labelClass}>Motivo</label>
                    <input type="text" id="requiredBrandReason" name="requiredBrandReason" value={formData.requiredBrandReason} onChange={handleChange} className={inputClass} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Extras */}
          {activeTab === "extra" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="sm:col-span-2 lg:col-span-3">
                <h3 className="text-sm font-semibold text-theme flex items-center gap-2 mb-4">
                  <Factory className="w-4 h-4" /> Fabricante
                </h3>
              </div>
              <div>
                <label htmlFor="manufacturer" className={labelClass}>Fabricante</label>
                <input type="text" id="manufacturer" name="manufacturer" value={formData.manufacturer} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="manufacturerCode" className={labelClass}>Código Fabricante</label>
                <input type="text" id="manufacturerCode" name="manufacturerCode" value={formData.manufacturerCode} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 p-6 border-t border-theme">
          <Link
            href="/materials"
            className="flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] border border-theme text-theme-secondary rounded-lg hover:bg-theme-hover transition-colors"
          >
            <X className="w-4 h-4" />
            Cancelar
          </Link>
          <Button
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
            data-testid="submit-btn"
          >
            Salvar
          </Button>
        </div>
      </form>
    </div>
  );
}
