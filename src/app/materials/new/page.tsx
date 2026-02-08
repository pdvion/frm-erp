"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { SelectWithAdd } from "@/components/ui/SelectWithAdd";
import { Checkbox } from "@/components/ui/Checkbox";
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
          <div className="m-6 p-4 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
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
              <Button
                key={tab.id}
                type="button"
                variant="ghost"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 rounded-none whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-theme-muted hover:text-theme"
                }`}
                leftIcon={<tab.icon className="w-4 h-4" />}
              >
                {tab.label}
              </Button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Dados Básicos */}
          {activeTab === "basic" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Input
                label="Código *"
                type="number"
                name="code"
                required
                value={formData.code || ""}
                onChange={handleChange}
                data-testid="input-code"
              />
              <Input
                label="Código Interno"
                name="internalCode"
                value={formData.internalCode}
                onChange={handleChange}
              />
              <Input
                label="Código de Barras"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
              />
              <div className="sm:col-span-2 lg:col-span-3">
                <Input
                  label="Descrição *"
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  data-testid="input-description"
                />
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
                <Select
                  value={formData.unit}
                  onChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                  options={[
                    { value: "UN", label: "UN - Unidade" },
                    { value: "KG", label: "KG - Quilograma" },
                    { value: "M", label: "M - Metro" },
                    { value: "M2", label: "M² - Metro Quadrado" },
                    { value: "M3", label: "M³ - Metro Cúbico" },
                    { value: "L", label: "L - Litro" },
                    { value: "PC", label: "PC - Peça" },
                    { value: "CX", label: "CX - Caixa" },
                    { value: "PCT", label: "PCT - Pacote" },
                    { value: "ROL", label: "ROL - Rolo" },
                  ]}
                />
              </div>
              <div>
                <label htmlFor="purchaseUnit" className={labelClass}>Unidade Compra</label>
                <Select
                  value={formData.purchaseUnit}
                  onChange={(value) => setFormData(prev => ({ ...prev, purchaseUnit: value }))}
                  placeholder="Mesma do estoque"
                  options={[
                    { value: "", label: "Mesma do estoque" },
                    { value: "UN", label: "UN - Unidade" },
                    { value: "KG", label: "KG - Quilograma" },
                    { value: "M", label: "M - Metro" },
                    { value: "CX", label: "CX - Caixa" },
                    { value: "PCT", label: "PCT - Pacote" },
                    { value: "ROL", label: "ROL - Rolo" },
                  ]}
                />
              </div>
              {formData.purchaseUnit && formData.purchaseUnit !== formData.unit && (
                <Input
                  label="Fator Conversão"
                  type="number"
                  id="unitConversionFactor"
                  name="unitConversionFactor"
                  step="0.0001"
                  value={formData.unitConversionFactor}
                  onChange={handleChange}
                  placeholder="1 CX = X UN"
                />
              )}
              <Input
                label="Localização"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ex: Prateleira A-01"
              />
              <div className="sm:col-span-2 lg:col-span-3">
                <label htmlFor="notes" className={labelClass}>Observações</label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Tab: Estoque */}
          {activeTab === "stock" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Input
                label="Qtd. Mínima"
                type="number"
                name="minQuantity"
                step="0.01"
                value={formData.minQuantity || ""}
                onChange={handleChange}
              />
              <Input
                label="Qtd. Máxima"
                type="number"
                name="maxQuantity"
                step="0.01"
                value={formData.maxQuantity || ""}
                onChange={handleChange}
              />
              <div>
                <label htmlFor="minQuantityCalcType" className={labelClass}>Cálculo Qtd. Mínima</label>
                <Select
                  value={formData.minQuantityCalcType}
                  onChange={(value) => setFormData(prev => ({ ...prev, minQuantityCalcType: value }))}
                  options={[
                    { value: "MANUAL", label: "Manual" },
                    { value: "CMM", label: "Consumo Médio Mensal" },
                    { value: "PEAK_12M", label: "Pico 12 Meses" },
                  ]}
                />
              </div>
              <Input
                label="Consumo Máximo Mensal"
                type="number"
                name="maxMonthlyConsumption"
                step="0.01"
                value={formData.maxMonthlyConsumption || ""}
                onChange={handleChange}
              />
              <div className="pt-6">
                <Checkbox
                  label="Ajustar consumo máximo manualmente"
                  checked={formData.adjustMaxConsumptionManual}
                  onChange={(checked) => setFormData(prev => ({ ...prev, adjustMaxConsumptionManual: checked }))}
                />
              </div>
              <Input
                label="Tempo Médio Entrega (dias)"
                type="number"
                name="avgDeliveryDays"
                step="1"
                value={formData.avgDeliveryDays || ""}
                onChange={handleChange}
              />
              <div>
                <label htmlFor="weight" className={labelClass}>Peso</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    id="weight"
                    name="weight"
                    step="0.001"
                    value={formData.weight || ""}
                    onChange={handleChange}
                  />
                  <Select
                    value={formData.weightUnit}
                    onChange={(value) => setFormData(prev => ({ ...prev, weightUnit: value }))}
                    options={[
                      { value: "KG", label: "KG" },
                      { value: "G", label: "G" },
                      { value: "T", label: "T" },
                    ]}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Fiscal */}
          {activeTab === "fiscal" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Input
                  label="NCM"
                  name="ncm"
                  value={formData.ncm}
                  onChange={handleChange}
                  placeholder="00000000"
                  maxLength={8}
                />
                <Input
                  label="% IPI"
                  type="number"
                  name="ipiRate"
                  step="0.01"
                  value={formData.ipiRate || ""}
                  onChange={handleChange}
                />
                <Input
                  label="% ICMS"
                  type="number"
                  name="icmsRate"
                  step="0.01"
                  value={formData.icmsRate || ""}
                  onChange={handleChange}
                />
                <div className="pt-6">
                  <Checkbox
                    label="Requer entrada fiscal"
                    checked={formData.requiresFiscalEntry}
                    onChange={(checked) => setFormData(prev => ({ ...prev, requiresFiscalEntry: checked }))}
                  />
                </div>
              </div>
              <div className="border-t border-theme pt-4">
                <h3 className="text-sm font-semibold text-theme flex items-center gap-2 mb-4">
                  <DollarSign className="w-4 h-4" /> Financeiro
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Input
                    label="Código de Baixa"
                    name="writeOffCode"
                    value={formData.writeOffCode}
                    onChange={handleChange}
                  />
                  <Input
                    label="Centro Custo FRM"
                    name="costCenterFrm"
                    value={formData.costCenterFrm}
                    onChange={handleChange}
                  />
                  <Input
                    label="Centro Custo FND"
                    name="costCenterFnd"
                    value={formData.costCenterFnd}
                    onChange={handleChange}
                  />
                  <Input
                    label="Conta Financeira"
                    name="financialAccount"
                    value={formData.financialAccount}
                    onChange={handleChange}
                  />
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
                    <Checkbox
                      label="Requer IQF (Índice de Qualidade)"
                      checked={formData.requiresQualityCheck}
                      onChange={(checked) => setFormData(prev => ({ ...prev, requiresQualityCheck: checked }))}
                    />
                    <Checkbox
                      label="Requer inspeção de qualidade"
                      checked={formData.requiresQualityInspection}
                      onChange={(checked) => setFormData(prev => ({ ...prev, requiresQualityInspection: checked }))}
                    />
                    <Checkbox
                      label="Requer certificado de material"
                      checked={formData.requiresMaterialCertificate}
                      onChange={(checked) => setFormData(prev => ({ ...prev, requiresMaterialCertificate: checked }))}
                    />
                    <Checkbox
                      label="Requer controle de fichas"
                      checked={formData.requiresControlSheets}
                      onChange={(checked) => setFormData(prev => ({ ...prev, requiresControlSheets: checked }))}
                    />
                    <Checkbox
                      label="Requer devolução"
                      checked={formData.requiresReturn}
                      onChange={(checked) => setFormData(prev => ({ ...prev, requiresReturn: checked }))}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-theme flex items-center gap-2">
                    <HardHat className="w-4 h-4" /> Classificação
                  </h3>
                  <div className="space-y-2">
                    <Checkbox
                      label="Material é EPI"
                      checked={formData.isEpi}
                      onChange={(checked) => setFormData(prev => ({ ...prev, isEpi: checked }))}
                    />
                    {formData.isEpi && (
                      <div className="ml-6">
                        <Input
                          label="Código CA (EPI)"
                          id="epiCaCode"
                          name="epiCaCode"
                          value={formData.epiCaCode}
                          onChange={handleChange}
                          placeholder="Ex: 12345"
                        />
                      </div>
                    )}
                    <Checkbox
                      label="Material de escritório"
                      checked={formData.isOfficeSupply}
                      onChange={(checked) => setFormData(prev => ({ ...prev, isOfficeSupply: checked }))}
                    />
                    <Checkbox
                      label="Validado pelo Financeiro"
                      checked={formData.financialValidated}
                      onChange={(checked) => setFormData(prev => ({ ...prev, financialValidated: checked }))}
                    />
                    <Checkbox
                      label="Validado pelo Financeiro (Centro de Custo)"
                      checked={formData.financialValidatedCc}
                      onChange={(checked) => setFormData(prev => ({ ...prev, financialValidatedCc: checked }))}
                    />
                    <Checkbox
                      label="Compartilhar com outras empresas"
                      checked={formData.isShared}
                      onChange={(checked) => setFormData(prev => ({ ...prev, isShared: checked }))}
                    />
                  </div>
                </div>
              </div>
              <div className="border-t border-theme pt-4">
                <h3 className="text-sm font-semibold text-theme mb-3">Marca Obrigatória</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Marca"
                    name="requiredBrand"
                    value={formData.requiredBrand}
                    onChange={handleChange}
                  />
                  <Input
                    label="Motivo"
                    name="requiredBrandReason"
                    value={formData.requiredBrandReason}
                    onChange={handleChange}
                  />
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
              <Input
                label="Fabricante"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
              />
              <Input
                label="Código Fabricante"
                name="manufacturerCode"
                value={formData.manufacturerCode}
                onChange={handleChange}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 p-6 border-t border-theme">
          <Button
            variant="outline"
            onClick={() => router.push("/materials")}
            leftIcon={<X className="w-4 h-4" />}
          >
            Cancelar
          </Button>
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
