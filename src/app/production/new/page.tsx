"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Factory,
  ChevronLeft,
  Loader2,
  Plus,
  Trash2,
  Search,
  X,
  Package,
} from "lucide-react";

export default function NewProductionOrderPage() {
  const router = useRouter();

  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState(3);
  const [salesOrderNumber, setSalesOrderNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");

  const [materials, setMaterials] = useState<Array<{
    materialId: string;
    materialCode: number;
    materialDescription: string;
    requiredQty: number;
  }>>([]);

  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [showMaterialSearch, setShowMaterialSearch] = useState(false);
  const [materialSearch, setMaterialSearch] = useState("");

  const { data: productsData, isLoading: loadingProducts } = trpc.materials.list.useQuery(
    { search: productSearch, limit: 20 },
    { enabled: productSearch.length >= 2 }
  );

  const { data: materialsData, isLoading: loadingMaterials } = trpc.materials.list.useQuery(
    { search: materialSearch, limit: 20 },
    { enabled: materialSearch.length >= 2 }
  );

  const createMutation = trpc.production.create.useMutation({
    onSuccess: (data) => {
      router.push(`/production/${data.id}`);
    },
  });

  const selectProduct = (product: { id: string; code: number; description: string }) => {
    setProductId(product.id);
    setProductName(`${product.code} - ${product.description}`);
    setShowProductSearch(false);
    setProductSearch("");
  };

  const addMaterial = (material: { id: string; code: number; description: string }) => {
    if (materials.some((m) => m.materialId === material.id)) {
      alert("Material já adicionado");
      return;
    }

    setMaterials([
      ...materials,
      {
        materialId: material.id,
        materialCode: material.code,
        materialDescription: material.description,
        requiredQty: 1,
      },
    ]);
    setShowMaterialSearch(false);
    setMaterialSearch("");
  };

  const removeMaterial = (materialId: string) => {
    setMaterials(materials.filter((m) => m.materialId !== materialId));
  };

  const updateMaterialQty = (materialId: string, qty: number) => {
    setMaterials(materials.map((m) => 
      m.materialId === materialId ? { ...m, requiredQty: qty } : m
    ));
  };

  const handleSubmit = () => {
    if (!productId) {
      alert("Selecione um produto");
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert("Informe uma quantidade válida");
      return;
    }

    createMutation.mutate({
      productId,
      quantity: qty,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority,
      salesOrderNumber: salesOrderNumber || undefined,
      customerName: customerName || undefined,
      notes: notes || undefined,
      materials: materials.length > 0 ? materials.map((m) => ({
        materialId: m.materialId,
        requiredQty: m.requiredQty,
      })) : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/production" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Factory className="w-6 h-6 text-indigo-600" />
                <h1 className="text-xl font-semibold text-gray-900">Nova Ordem de Produção</h1>
              </div>
            </div>
            <CompanySwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Produto */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-4">Produto a Fabricar</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produto *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={productName}
                    readOnly
                    placeholder="Selecione um produto..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={() => setShowProductSearch(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    min={0.01}
                    step={0.01}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Entrega
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-4">Informações Adicionais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Pedido de Venda
                </label>
                <input
                  type="text"
                  value={salesOrderNumber}
                  onChange={(e) => setSalesOrderNumber(e.target.value)}
                  placeholder="Ex: PV-12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Materiais */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Materiais Necessários</h3>
              <button
                onClick={() => setShowMaterialSearch(true)}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Adicionar Material
              </button>
            </div>

            {materials.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhum material adicionado</p>
                <p className="text-sm">Materiais podem ser adicionados depois</p>
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
                        Quantidade
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Ação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {materials.map((mat) => (
                      <tr key={mat.materialId}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{mat.materialDescription}</div>
                          <div className="text-sm text-gray-500">Cód: {mat.materialCode}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={mat.requiredQty}
                            onChange={(e) => updateMaterialQty(mat.materialId, Number(e.target.value))}
                            min={0.01}
                            step={0.01}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeMaterial(mat.materialId)}
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
              href="/production"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || !productId}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Criar OP
            </button>
          </div>

          {createMutation.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {createMutation.error.message}
            </div>
          )}
        </div>
      </main>

      {/* Product Search Modal */}
      {showProductSearch && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-search-title"
          onKeyDown={(e) => e.key === "Escape" && setShowProductSearch(false)}
        >
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 id="product-search-title" className="font-medium text-gray-900">Selecionar Produto</h3>
              <button
                onClick={() => {
                  setShowProductSearch(false);
                  setProductSearch("");
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
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Digite para buscar (mín. 2 caracteres)..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : productSearch.length < 2 ? (
                <div className="text-center py-8 text-gray-500">
                  Digite pelo menos 2 caracteres
                </div>
              ) : !productsData?.materials.length ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum produto encontrado
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {productsData.materials.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => selectProduct(product)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <div className="font-medium text-gray-900">{product.description}</div>
                      <div className="text-sm text-gray-500">Cód: {product.code} | {product.unit}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Material Search Modal */}
      {showMaterialSearch && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="material-search-title"
          onKeyDown={(e) => e.key === "Escape" && setShowMaterialSearch(false)}
        >
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 id="material-search-title" className="font-medium text-gray-900">Adicionar Material</h3>
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
                  Digite pelo menos 2 caracteres
                </div>
              ) : !materialsData?.materials.length ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum material encontrado
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {materialsData.materials.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => addMaterial(material)}
                      disabled={materials.some((m) => m.materialId === material.id)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50"
                    >
                      <div className="font-medium text-gray-900">{material.description}</div>
                      <div className="text-sm text-gray-500">
                        Cód: {material.code} | {material.unit}
                        {materials.some((m) => m.materialId === material.id) && (
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
