"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowDownCircle, 
  ChevronLeft, 
  Save,
  X,
  Loader2,
  Search
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/inventory" className="text-gray-400 hover:text-gray-600">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <ArrowDownCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Entrada de Estoque</h1>
                <p className="text-sm text-gray-500">Registrar entrada de materiais</p>
              </div>
            </div>
            <CompanySwitcher />
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Material Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <button
                    type="button"
                    onClick={() => setSelectedMaterial(null)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    placeholder="Buscar material por código ou descrição..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {materialsData && materialsData.materials.length > 0 && materialSearch.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {materialsData.materials.map((material) => (
                        <button
                          key={material.id}
                          type="button"
                          onClick={() => selectMaterial(material)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                        >
                          <span className="font-medium">{material.code}</span>
                          <span className="text-gray-600">-</span>
                          <span className="truncate">{material.description}</span>
                          <span className="text-sm text-gray-400 ml-auto">{material.unit}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tipo de Estoque */}
            <div>
              <label htmlFor="inventoryType" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Estoque
              </label>
              <select
                id="inventoryType"
                name="inventoryType"
                value={formData.inventoryType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="RAW_MATERIAL">Matéria Prima</option>
                <option value="SEMI_FINISHED">Semi-Acabado</option>
                <option value="FINISHED">Acabado</option>
                <option value="CRITICAL">Crítico</option>
              </select>
            </div>

            {/* Fornecedor */}
            <div>
              <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 mb-1">
                Fornecedor
              </label>
              <select
                id="supplierId"
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Selecione um fornecedor</option>
                {suppliersData?.suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.code} - {supplier.companyName}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantidade */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Custo Unitário */}
            <div>
              <label htmlFor="unitCost" className="block text-sm font-medium text-gray-700 mb-1">
                Custo Unitário (R$)
              </label>
              <input
                type="number"
                id="unitCost"
                name="unitCost"
                min="0"
                step="0.01"
                value={formData.unitCost || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Custo Total (calculado) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custo Total
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalCost)}
              </div>
            </div>

            {/* Tipo de Documento */}
            <div>
              <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Documento
              </label>
              <select
                id="documentType"
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="NF">Nota Fiscal</option>
                <option value="NF-E">NF-e</option>
                <option value="DANFE">DANFE</option>
                <option value="RECIBO">Recibo</option>
                <option value="OUTROS">Outros</option>
              </select>
            </div>

            {/* Número do Documento */}
            <div>
              <label htmlFor="documentNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Número do Documento
              </label>
              <input
                type="text"
                id="documentNumber"
                name="documentNumber"
                value={formData.documentNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Observações */}
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <Link
              href="/inventory"
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !selectedMaterial}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Registrar Entrada
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
