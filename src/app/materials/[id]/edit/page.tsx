"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { 
  Package, 
  Save,
  X,
  Loader2,
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
  minQuantity: number;
  maxQuantity: number;
  minQuantityCalcType: string;
  avgDeliveryDays: number;
  ncm: string;
  ipiRate: number;
  icmsRate: number;
  location: string;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
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
  weight: number;
  weightUnit: string;
  barcode: string;
  manufacturer: string;
  manufacturerCode: string;
  notes: string;
  isShared: boolean;
}

export default function EditMaterialPage() {
  const router = useRouter();
  const params = useParams();
  const materialId = params.id as string;
  
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
    minQuantity: 0,
    maxQuantity: 0,
    minQuantityCalcType: "MANUAL",
    avgDeliveryDays: 0,
    ncm: "",
    ipiRate: 0,
    icmsRate: 0,
    location: "",
    status: "ACTIVE",
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
    weight: 0,
    weightUnit: "KG",
    barcode: "",
    manufacturer: "",
    manufacturerCode: "",
    notes: "",
    isShared: false,
  });

  const { data: material, isLoading } = trpc.materials.byId.useQuery({ id: materialId });
  const { data: categories } = trpc.materials.listCategories.useQuery();
  
  const updateMutation = trpc.materials.update.useMutation({
    onSuccess: () => {
      router.push("/materials");
    },
    onError: (err) => {
      setError(err.message);
      setIsSubmitting(false);
    },
  });

  useEffect(() => {
    if (material) {
      setFormData({
        code: material.code,
        description: material.description,
        internalCode: material.internalCode ?? "",
        unit: material.unit,
        purchaseUnit: material.purchaseUnit ?? "",
        unitConversionFactor: material.unitConversionFactor ?? 1,
        categoryId: material.categoryId ?? "",
        minQuantity: material.minQuantity ?? 0,
        maxQuantity: material.maxQuantity ?? 0,
        minQuantityCalcType: material.minQuantityCalcType ?? "MANUAL",
        avgDeliveryDays: material.avgDeliveryDays ?? 0,
        ncm: material.ncm ?? "",
        ipiRate: material.ipiRate ?? 0,
        icmsRate: material.icmsRate ?? 0,
        location: material.location ?? "",
        status: material.status,
        isEpi: material.isEpi ?? false,
        epiCaCode: material.epiCaCode ?? "",
        isOfficeSupply: material.isOfficeSupply ?? false,
        financialValidated: material.financialValidated ?? false,
        financialValidatedCc: material.financialValidatedCc ?? false,
        requiresQualityCheck: material.requiresQualityCheck ?? false,
        requiresQualityInspection: material.requiresQualityInspection ?? false,
        requiresMaterialCertificate: material.requiresMaterialCertificate ?? false,
        requiresControlSheets: material.requiresControlSheets ?? false,
        requiresReturn: material.requiresReturn ?? false,
        requiresFiscalEntry: material.requiresFiscalEntry ?? false,
        requiredBrand: material.requiredBrand ?? "",
        requiredBrandReason: material.requiredBrandReason ?? "",
        weight: material.weight ?? 0,
        weightUnit: material.weightUnit ?? "KG",
        barcode: material.barcode ?? "",
        manufacturer: material.manufacturer ?? "",
        manufacturerCode: material.manufacturerCode ?? "",
        notes: material.notes ?? "",
        isShared: material.isShared ?? false,
      });
    }
  }, [material]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    updateMutation.mutate({
      id: materialId,
      description: formData.description,
      internalCode: formData.internalCode || undefined,
      unit: formData.unit,
      purchaseUnit: formData.purchaseUnit || undefined,
      unitConversionFactor: formData.unitConversionFactor || 1,
      categoryId: formData.categoryId || undefined,
      minQuantity: formData.minQuantity || undefined,
      maxQuantity: formData.maxQuantity || undefined,
      minQuantityCalcType: formData.minQuantityCalcType as "MANUAL" | "CMM" | "PEAK_12M",
      avgDeliveryDays: formData.avgDeliveryDays || undefined,
      ncm: formData.ncm || undefined,
      ipiRate: formData.ipiRate || undefined,
      icmsRate: formData.icmsRate || undefined,
      location: formData.location || undefined,
      status: formData.status,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-theme-secondary">Carregando material...</span>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-xl font-bold text-theme mb-2">Material não encontrado</h1>
          <Link href="/materials" className="text-blue-400 hover:underline">
            Voltar para listagem
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar Material"
        subtitle={`Código: ${material.code}`}
        icon={<Package className="w-6 h-6" />}
        backHref="/materials"
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
                label="Código"
                type="number"
                value={formData.code}
                disabled
              />
              <Input
                label="Código Interno"
                id="internalCode"
                name="internalCode"
                value={formData.internalCode}
                onChange={handleChange}
              />
              <Input
                label="Código de Barras"
                id="barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
              />
              <div className="sm:col-span-2 lg:col-span-3">
                <Input
                  label="Descrição *"
                  id="description"
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
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
                id="location"
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
                id="minQuantity"
                name="minQuantity"
                step="0.01"
                value={formData.minQuantity || ""}
                onChange={handleChange}
              />
              <Input
                label="Qtd. Máxima"
                type="number"
                id="maxQuantity"
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
                label="Tempo Médio Entrega (dias)"
                type="number"
                id="avgDeliveryDays"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Input
                label="NCM"
                id="ncm"
                name="ncm"
                value={formData.ncm}
                onChange={handleChange}
                placeholder="00000000"
                maxLength={8}
              />
              <Input
                label="% IPI"
                type="number"
                id="ipiRate"
                name="ipiRate"
                step="0.01"
                value={formData.ipiRate || ""}
                onChange={handleChange}
              />
              <Input
                label="% ICMS"
                type="number"
                id="icmsRate"
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
                    id="requiredBrand"
                    name="requiredBrand"
                    value={formData.requiredBrand}
                    onChange={handleChange}
                  />
                  <Input
                    label="Motivo"
                    id="requiredBrandReason"
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
                id="manufacturer"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
              />
              <Input
                label="Código Fabricante"
                id="manufacturerCode"
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
          >
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
