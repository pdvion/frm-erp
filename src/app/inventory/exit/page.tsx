"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowUpCircle, 
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

interface MovementFormData {
  materialId: string;
  inventoryType: "RAW_MATERIAL" | "SEMI_FINISHED" | "FINISHED" | "CRITICAL" | "DEAD" | "SCRAP";
  quantity: number;
  documentType: string;
  documentNumber: string;
  notes: string;
}

export default function InventoryExitPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [materialSearch, setMaterialSearch] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<{ id: string; code: number; description: string; unit: string } | null>(null);
  
  const [formData, setFormData] = useState<MovementFormData>({
    materialId: "",
    inventoryType: "RAW_MATERIAL",
    quantity: 0,
    documentType: "OS",
    documentNumber: "",
    notes: "",
  });

  const { data: materialsData } = trpc.materials.list.useQuery({
    search: materialSearch || undefined,
    limit: 10,
  }, {
    enabled: materialSearch.length >= 2,
  });

  // Buscar inventário do material selecionado para obter o custo
  const { data: inventoryData } = trpc.inventory.byMaterialId.useQuery(
    { materialId: selectedMaterial?.id ?? "" },
    { enabled: !!selectedMaterial?.id }
  );

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

    // Usar o custo unitário do inventário existente para saídas (COGS correto)
    // inventoryData é um array, pegar o primeiro item do tipo selecionado ou o primeiro disponível
    const inventoryItem = inventoryData?.find(inv => inv.inventoryType === formData.inventoryType) ?? inventoryData?.[0];
    const unitCost = (inventoryItem as { unitCost?: number } | undefined)?.unitCost ?? 0;

    setIsSubmitting(true);

    createMovementMutation.mutate({
      materialId: selectedMaterial.id,
      inventoryType: formData.inventoryType,
      movementType: "EXIT",
      quantity: formData.quantity,
      unitCost, // Usar custo do inventário, não zero
      documentType: formData.documentType || undefined,
      documentNumber: formData.documentNumber || undefined,
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saída de Estoque"
        subtitle="Registrar saída de materiais"
        icon={<ArrowUpCircle className="w-6 h-6" />}
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
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div>
                    <span className="font-medium text-red-800">{selectedMaterial.code}</span>
                    <span className="mx-2 text-red-600">-</span>
                    <span className="text-red-800">{selectedMaterial.description}</span>
                    <span className="ml-2 text-sm text-red-600">({selectedMaterial.unit})</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMaterial(null)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
                  <Input
                    type="text"
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    placeholder="Buscar material por código ou descrição..."
                    className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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

            {/* Tipo de Documento */}
            <div>
              <label htmlFor="documentType" className="block text-sm font-medium text-theme-secondary mb-1">
                Tipo de Documento
              </label>
              <Select
                value={formData.documentType}
                onChange={(value) => setFormData(prev => ({ ...prev, documentType: value }))}
                options={[
                  { value: "OS", label: "Ordem de Serviço" },
                  { value: "OP", label: "Ordem de Produção" },
                  { value: "REQ", label: "Requisição" },
                  { value: "NF", label: "Nota Fiscal" },
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
              Registrar Saída
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
