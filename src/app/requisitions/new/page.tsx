"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Package,
  ChevronLeft,
  Loader2,
  Plus,
  Trash2,
  Search,
  X,
} from "lucide-react";

export default function NewRequisitionPage() {
  const router = useRouter();

  const [type, setType] = useState<"PRODUCTION" | "MAINTENANCE" | "ADMINISTRATIVE" | "PROJECT" | "OTHER">("PRODUCTION");
  const [costCenter, setCostCenter] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [priority, setPriority] = useState(3);
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<Array<{
    materialId: string;
    materialCode: number;
    materialDescription: string;
    unit: string;
    requestedQty: number;
    notes: string;
  }>>([]);

  const [showMaterialSearch, setShowMaterialSearch] = useState(false);
  const [materialSearch, setMaterialSearch] = useState("");

  const { data: materials, isLoading: loadingMaterials } = trpc.materials.list.useQuery(
    { search: materialSearch, limit: 20 },
    { enabled: materialSearch.length >= 2 }
  );

  const createMutation = trpc.requisitions.create.useMutation({
    onSuccess: (data) => {
      router.push(`/requisitions/${data.id}`);
    },
  });

  const addItem = (material: {
    id: string;
    code: number;
    description: string;
    unit: string;
  }) => {
    if (items.some((i) => i.materialId === material.id)) {
      alert("Material já adicionado");
      return;
    }

    setItems([
      ...items,
      {
        materialId: material.id,
        materialCode: material.code,
        materialDescription: material.description,
        unit: material.unit,
        requestedQty: 1,
        notes: "",
      },
    ]);
    setShowMaterialSearch(false);
    setMaterialSearch("");
  };

  const removeItem = (materialId: string) => {
    setItems(items.filter((i) => i.materialId !== materialId));
  };

  const updateItemQty = (materialId: string, qty: number) => {
    setItems(items.map((i) => 
      i.materialId === materialId ? { ...i, requestedQty: qty } : i
    ));
  };

  const handleSubmit = () => {
    if (items.length === 0) {
      alert("Adicione pelo menos um item");
      return;
    }

    createMutation.mutate({
      type,
      costCenter: costCenter || undefined,
      projectCode: projectCode || undefined,
      orderNumber: orderNumber || undefined,
      department: department || undefined,
      priority,
      notes: notes || undefined,
      items: items.map((i) => ({
        materialId: i.materialId,
        requestedQty: i.requestedQty,
        notes: i.notes || undefined,
      })),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/requisitions" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Package className="w-6 h-6 text-indigo-600" />
                <h1 className="text-xl font-semibold text-gray-900">Nova Requisição</h1>
              </div>
            </div>
            <CompanySwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-4">Dados da Requisição</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as typeof type)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PRODUCTION">Produção</option>
                  <option value="MAINTENANCE">Manutenção</option>
                  <option value="ADMINISTRATIVE">Administrativo</option>
                  <option value="PROJECT">Projeto</option>
                  <option value="OTHER">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridade
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1}>Urgente</option>
                  <option value={2}>Alta</option>
                  <option value={3}>Normal</option>
                  <option value={4}>Baixa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número OP/OS
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Ex: OP-12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Centro de Custo
                </label>
                <input
                  type="text"
                  value={costCenter}
                  onChange={(e) => setCostCenter(e.target.value)}
                  placeholder="Ex: CC-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Ex: Produção"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código do Projeto
                </label>
                <input
                  type="text"
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value)}
                  placeholder="Ex: PRJ-2024-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Observações adicionais..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Itens</h3>
              <button
                onClick={() => setShowMaterialSearch(true)}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Adicionar Material
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhum item adicionado</p>
                <p className="text-sm">Clique em &quot;Adicionar Material&quot; para começar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Material
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Unidade
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Quantidade
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Ação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.materialId}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{item.materialDescription}</div>
                          <div className="text-sm text-gray-500">Cód: {item.materialCode}</div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">
                          {item.unit}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={item.requestedQty}
                            onChange={(e) => updateItemQty(item.materialId, Number(e.target.value))}
                            min={0.01}
                            step={0.01}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeItem(item.materialId)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link
              href="/requisitions"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || items.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Criar Requisição
            </button>
          </div>

          {createMutation.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {createMutation.error.message}
            </div>
          )}
        </div>
      </main>

      {/* Material Search Modal */}
      {showMaterialSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Buscar Material</h3>
              <button
                onClick={() => {
                  setShowMaterialSearch(false);
                  setMaterialSearch("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  placeholder="Digite para buscar (mín. 2 caracteres)..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loadingMaterials ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : materialSearch.length < 2 ? (
                <div className="text-center py-8 text-gray-500">
                  Digite pelo menos 2 caracteres para buscar
                </div>
              ) : !materials?.materials.length ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum material encontrado
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {materials.materials.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => addItem(material)}
                      disabled={items.some((i) => i.materialId === material.id)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium text-gray-900">{material.description}</div>
                      <div className="text-sm text-gray-500">
                        Cód: {material.code} | {material.unit}
                        {items.some((i) => i.materialId === material.id) && (
                          <span className="ml-2 text-indigo-600">(já adicionado)</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
