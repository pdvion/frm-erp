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
  
  // Novos campos VIO-650
  const [requestType, setRequestType] = useState("");
  const [executionType, setExecutionType] = useState("");
  const [deliveryType, setDeliveryType] = useState("");
  const [plannedStart, setPlannedStart] = useState("");
  const [plannedEnd, setPlannedEnd] = useState("");

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
      // Novos campos VIO-650
      requestType: requestType as "SALES" | "STOCK" | "EXPORT" | "NORMAL" | "REWORK" | undefined || undefined,
      executionType: executionType as "MANUFACTURE" | "ALTER" | undefined || undefined,
      deliveryType: deliveryType as "ASSEMBLED" | "LOOSE" | undefined || undefined,
      plannedStart: plannedStart ? new Date(plannedStart) : undefined,
      plannedEnd: plannedEnd ? new Date(plannedEnd) : undefined,
      materials: materials.length > 0 ? materials.map((m) => ({
        materialId: m.materialId,
        requiredQty: m.requiredQty,
      })) : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-theme-card border-b border-theme sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/production" className="text-theme-muted hover:text-theme-secondary">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Factory className="w-6 h-6 text-indigo-600" />
                <h1 className="text-xl font-semibold text-theme">Nova Ordem de Produção</h1>
              </div>
            </div>
            <CompanySwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Produto */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h3 className="font-medium text-theme mb-4">Produto a Fabricar</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Produto *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={productName}
                    readOnly
                    placeholder="Selecione um produto..."
                    className="flex-1 px-3 py-2 border border-theme-input rounded-lg bg-theme-tertiary"
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
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    min={0.01}
                    step={0.01}
                    className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Data de Entrega
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h3 className="font-medium text-theme mb-4">Informações Adicionais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Prioridade
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1}>Urgente</option>
                  <option value={2}>Alta</option>
                  <option value={3}>Normal</option>
                  <option value={4}>Baixa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Pedido de Venda
                </label>
                <input
                  type="text"
                  value={salesOrderNumber}
                  onChange={(e) => setSalesOrderNumber(e.target.value)}
                  placeholder="Ex: PV-12345"
                  className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Cliente
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Observações
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Tipos e Planejamento - VIO-650 */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h3 className="font-medium text-theme mb-4">Tipos e Planejamento</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Tipo de Solicitação
                </label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Selecione</option>
                  <option value="SALES">Venda</option>
                  <option value="STOCK">Estoque</option>
                  <option value="EXPORT">Exportação</option>
                  <option value="NORMAL">Normal</option>
                  <option value="REWORK">Retrabalho</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Tipo de Execução
                </label>
                <select
                  value={executionType}
                  onChange={(e) => setExecutionType(e.target.value)}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Selecione</option>
                  <option value="MANUFACTURE">Fabricação</option>
                  <option value="ALTER">Alteração</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Tipo de Entrega
                </label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value)}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Selecione</option>
                  <option value="ASSEMBLED">Montado</option>
                  <option value="LOOSE">Solto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Início Planejado
                </label>
                <input
                  type="date"
                  value={plannedStart}
                  onChange={(e) => setPlannedStart(e.target.value)}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Término Planejado
                </label>
                <input
                  type="date"
                  value={plannedEnd}
                  onChange={(e) => setPlannedEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Materiais */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-theme">Materiais Necessários</h3>
              <button
                onClick={() => setShowMaterialSearch(true)}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Adicionar Material
              </button>
            </div>

            {materials.length === 0 ? (
              <div className="text-center py-8 text-theme-muted">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhum material adicionado</p>
                <p className="text-sm">Materiais podem ser adicionados depois</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Material
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Quantidade
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                        Ação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {materials.map((mat) => (
                      <tr key={mat.materialId}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-theme">{mat.materialDescription}</div>
                          <div className="text-sm text-theme-muted">Cód: {mat.materialCode}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={mat.requiredQty}
                            onChange={(e) => updateMaterialQty(mat.materialId, Number(e.target.value))}
                            min={0.01}
                            step={0.01}
                            className="w-24 px-2 py-1 border border-theme-input rounded text-center"
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
              className="px-6 py-2 border border-theme-input rounded-lg text-theme-secondary hover:bg-theme-hover"
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
          <div className="bg-theme-card rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-theme flex items-center justify-between">
              <h3 id="product-search-title" className="font-medium text-theme">Selecionar Produto</h3>
              <button
                onClick={() => {
                  setShowProductSearch(false);
                  setProductSearch("");
                }}
                className="text-theme-muted hover:text-theme-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-theme">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-muted w-5 h-5" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Digite para buscar (mín. 2 caracteres)..."
                  className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                <div className="text-center py-8 text-theme-muted">
                  Digite pelo menos 2 caracteres
                </div>
              ) : !productsData?.materials.length ? (
                <div className="text-center py-8 text-theme-muted">
                  Nenhum produto encontrado
                </div>
              ) : (
                <div className="divide-y divide-theme-table">
                  {productsData.materials.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => selectProduct(product)}
                      className="w-full px-4 py-3 text-left hover:bg-theme-hover"
                    >
                      <div className="font-medium text-theme">{product.description}</div>
                      <div className="text-sm text-theme-muted">Cód: {product.code} | {product.unit}</div>
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
          <div className="bg-theme-card rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-theme flex items-center justify-between">
              <h3 id="material-search-title" className="font-medium text-theme">Adicionar Material</h3>
              <button
                onClick={() => {
                  setShowMaterialSearch(false);
                  setMaterialSearch("");
                }}
                className="text-theme-muted hover:text-theme-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-theme">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-muted w-5 h-5" />
                <input
                  type="text"
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  placeholder="Digite para buscar (mín. 2 caracteres)..."
                  className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                <div className="text-center py-8 text-theme-muted">
                  Digite pelo menos 2 caracteres
                </div>
              ) : !materialsData?.materials.length ? (
                <div className="text-center py-8 text-theme-muted">
                  Nenhum material encontrado
                </div>
              ) : (
                <div className="divide-y divide-theme-table">
                  {materialsData.materials.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => addMaterial(material)}
                      disabled={materials.some((m) => m.materialId === material.id)}
                      className="w-full px-4 py-3 text-left hover:bg-theme-hover disabled:opacity-50"
                    >
                      <div className="font-medium text-theme">{material.description}</div>
                      <div className="text-sm text-theme-muted">
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
