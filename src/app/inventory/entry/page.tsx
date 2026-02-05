"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowDownCircle, 
  Save,
  X,
  Search
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { trpc } from "@/lib/trpc";
import { SelectWithAdd } from "@/components/ui/SelectWithAdd";
import { SupplierQuickForm } from "@/components/forms/SupplierQuickForm";

interface MovementFormData {
  materialId: string;
  inventoryType: "RAW_MATERIAL" | "SEMI_FINISHED" | "FINISHED" | "CRITICAL" | "DEAD" | "SCRAP";
  quantity: number;
  unitCost: number;
  documentType: string;
  documentNumber: string;
  supplierId: string;
  notes: string;
}

export default function InventoryEntryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [materialSearch, setMaterialSearch] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<{ id: string; code: number; description: string; unit: string } | null>(null);
  
  const [formData, setFormData] = useState<MovementFormData>({
    materialId: "",
    inventoryType: "RAW_MATERIAL",
    quantity: 0,
    unitCost: 0,
    documentType: "NF",
    documentNumber: "",
    supplierId: "",
    notes: "",
  });

  const { data: materialsData } = trpc.materials.list.useQuery({
    search: materialSearch || undefined,
    limit: 10,
  }, {
    enabled: materialSearch.length >= 2,
  });

  const { data: suppliersData } = trpc.suppliers.list.useQuery({
    limit: 100,
  });

  const createMovementMutation = trpc.inventory.createMovement.useMutation({
    onSuccess: () => {
      router.push("/inventory");
    },
    onError: (err) => {
      setError(err.message);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedMaterial) {
      setError("Selecione um material");
      return;
    }

    setIsSubmitting(true);

    createMovementMutation.mutate({
      materialId: selectedMaterial.id,
      inventoryType: formData.inventoryType,
      movementType: "ENTRY",
      quantity: formData.quantity,
      unitCost: formData.unitCost,
      documentType: formData.documentType || undefined,
      documentNumber: formData.documentNumber || undefined,
      supplierId: formData.supplierId || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const selectMaterial = (material: { id: string; code: number; description: string; unit: string }) => {
    setSelectedMaterial(material);
    setMaterialSearch("");
  };

  const totalCost = formData.quantity * formData.unitCost;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entrada de Estoque"
        subtitle="Registrar entrada de materiais"
        icon={<ArrowDownCircle className="w-6 h-6" />}
        backHref="/inventory"
        module="inventory"
      />

      <div>
        <form onSubmit={handleSubmit} className="bg-theme-card rounded-xl border border-theme p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Material Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-theme-secondary mb-1">
                Material *
              </label>
              {selectedMaterial ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <span className="font-medium text-green-800">{selectedMaterial.code}</span>
                    <span className="mx-2 text-green-600">-</span>
                    <span className="text-green-800">{selectedMaterial.description}</span>
                    <span className="ml-2 text-sm text-green-600">({selectedMaterial.unit})</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMaterial(null)}
                    className="text-green-600 hover:text-green-800 p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
                  <input
                    type="text"
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    placeholder="Buscar material por código ou descrição..."
                    className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {materialsData && materialsData.materials.length > 0 && materialSearch.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-theme-card border border-theme rounded-lg shadow-lg max-h-60 overflow-auto">
                      {materialsData.materials.map((material) => (
                        <Button
                          key={material.id}
                          type="button"
                          variant="ghost"
                          onClick={() => selectMaterial(material)}
                          className="w-full px-4 py-2 text-left hover:bg-theme-hover flex items-center gap-2 justify-start h-auto rounded-none"
                        >
                          <span className="font-medium">{material.code}</span>
                          <span className="text-theme-secondary">-</span>
                          <span className="truncate">{material.description}</span>
                          <span className="text-sm text-theme-muted ml-auto">{material.unit}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tipo de Estoque */}
            <div>
              <label htmlFor="inventoryType" className="block text-sm font-medium text-theme-secondary mb-1">
                Tipo de Estoque
              </label>
              <Select
                value={formData.inventoryType}
                onChange={(value) => setFormData(prev => ({ ...prev, inventoryType: value as MovementFormData["inventoryType"] }))}
                options={[
                  { value: "RAW_MATERIAL", label: "Matéria Prima" },
                  { value: "SEMI_FINISHED", label: "Semi-Acabado" },
                  { value: "FINISHED", label: "Acabado" },
                  { value: "CRITICAL", label: "Crítico" },
                ]}
              />
            </div>

            {/* Fornecedor */}
            <SelectWithAdd
              id="supplierId"
              name="supplierId"
              label="Fornecedor"
              value={formData.supplierId}
              onChange={handleChange}
              options={suppliersData?.suppliers.map((supplier) => ({
                value: supplier.id,
                label: `${supplier.code} - ${supplier.companyName}`,
              })) || []}
              placeholder="Selecione um fornecedor"
              drawerTitle="Novo Fornecedor"
              drawerDescription="Cadastre um novo fornecedor rapidamente"
              drawerSize="lg"
              FormComponent={SupplierQuickForm}
            />

            {/* Quantidade */}
            <Input
              label="Quantidade *"
              type="number"
              id="quantity"
              name="quantity"
              required
              min={0.01}
              step={0.01}
              value={formData.quantity || ""}
              onChange={handleChange}
            />

            {/* Custo Unitário */}
            <Input
              label="Custo Unitário (R$)"
              type="number"
              id="unitCost"
              name="unitCost"
              min={0}
              step={0.01}
              value={formData.unitCost || ""}
              onChange={handleChange}
            />

            {/* Custo Total (calculado) */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">
                Custo Total
              </label>
              <div className="px-3 py-2 bg-theme-tertiary border border-theme-input rounded-lg text-theme-secondary font-medium">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalCost)}
              </div>
            </div>

            {/* Tipo de Documento */}
            <div>
              <label htmlFor="documentType" className="block text-sm font-medium text-theme-secondary mb-1">
                Tipo de Documento
              </label>
              <Select
                value={formData.documentType}
                onChange={(value) => setFormData(prev => ({ ...prev, documentType: value }))}
                options={[
                  { value: "NF", label: "Nota Fiscal" },
                  { value: "NF-E", label: "NF-e" },
                  { value: "DANFE", label: "DANFE" },
                  { value: "RECIBO", label: "Recibo" },
                  { value: "OUTROS", label: "Outros" },
                ]}
              />
            </div>

            {/* Número do Documento */}
            <Input
              label="Número do Documento"
              id="documentNumber"
              name="documentNumber"
              value={formData.documentNumber}
              onChange={handleChange}
            />

            {/* Observações */}
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-theme-secondary mb-1">
                Observações
              </label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-theme">
            <Button
              variant="outline"
              onClick={() => router.push("/inventory")}
              leftIcon={<X className="w-4 h-4" />}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!selectedMaterial}
              isLoading={isSubmitting}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Registrar Entrada
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
