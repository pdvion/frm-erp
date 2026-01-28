"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowUpCircle, 
  Save,
  X,
  Loader2,
  Search
} from "lucide-react";
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
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-500/10 rounded-lg">
          <ArrowUpCircle className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-theme">Saída de Estoque</h1>
          <p className="text-sm text-theme-muted">Registrar saída de materiais</p>
        </div>
      </div>

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
                  <button
                    type="button"
                    onClick={() => setSelectedMaterial(null)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
                  <input
                    type="text"
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    placeholder="Buscar material por código ou descrição..."
                    className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  {materialsData && materialsData.materials.length > 0 && materialSearch.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-theme-card border border-theme rounded-lg shadow-lg max-h-60 overflow-auto">
                      {materialsData.materials.map((material) => (
                        <button
                          key={material.id}
                          type="button"
                          onClick={() => selectMaterial(material)}
                          className="w-full px-4 py-2 text-left hover:bg-theme-hover flex items-center gap-2"
                        >
                          <span className="font-medium">{material.code}</span>
                          <span className="text-theme-secondary">-</span>
                          <span className="truncate">{material.description}</span>
                          <span className="text-sm text-theme-muted ml-auto">{material.unit}</span>
                        </button>
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
              <select
                id="inventoryType"
                name="inventoryType"
                value={formData.inventoryType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="RAW_MATERIAL">Matéria Prima</option>
                <option value="SEMI_FINISHED">Semi-Acabado</option>
                <option value="FINISHED">Acabado</option>
                <option value="CRITICAL">Crítico</option>
              </select>
            </div>

            {/* Quantidade */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-theme-secondary mb-1">
                Quantidade *
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                required
                min="0.01"
                step="0.01"
                value={formData.quantity || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Tipo de Documento */}
            <div>
              <label htmlFor="documentType" className="block text-sm font-medium text-theme-secondary mb-1">
                Tipo de Documento
              </label>
              <select
                id="documentType"
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="OS">Ordem de Serviço</option>
                <option value="OP">Ordem de Produção</option>
                <option value="REQ">Requisição</option>
                <option value="NF">Nota Fiscal</option>
                <option value="OUTROS">Outros</option>
              </select>
            </div>

            {/* Número do Documento */}
            <div>
              <label htmlFor="documentNumber" className="block text-sm font-medium text-theme-secondary mb-1">
                Número do Documento
              </label>
              <input
                type="text"
                id="documentNumber"
                name="documentNumber"
                value={formData.documentNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Observações */}
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-theme-secondary mb-1">
                Observações
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-theme">
            <Link
              href="/inventory"
              className="flex items-center gap-2 px-4 py-2 border border-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !selectedMaterial}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Registrar Saída
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
