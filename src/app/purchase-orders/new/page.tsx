"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  ShoppingCart,
  ChevronLeft,
  Plus,
  Trash2,
  Search,
  Loader2,
  Save,
  AlertTriangle,
} from "lucide-react";

interface OrderItem {
  materialId: string;
  materialCode: number;
  materialDescription: string;
  quantity: number;
  unitPrice: number;
  deliveryDays?: number;
  notes?: string;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  // Estado do supplier gerenciado via selectedSupplier
  const [supplierSearch, setSupplierSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<{
    id: string;
    code: number;
    companyName: string;
  } | null>(null);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Material search
  const [materialSearch, setMaterialSearch] = useState("");
  const [showMaterialSearch, setShowMaterialSearch] = useState(false);

  // Queries
  const { data: suppliersData } = trpc.suppliers.list.useQuery(
    { search: supplierSearch, limit: 10 },
    { enabled: supplierSearch.length >= 2 }
  );

  const { data: materialsData } = trpc.materials.list.useQuery(
    { search: materialSearch, limit: 10 },
    { enabled: materialSearch.length >= 2 }
  );

  // Mutation
  const createMutation = trpc.purchaseOrders.create.useMutation({
    onSuccess: (data) => {
      router.push(`/purchase-orders/${data.id}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleAddItem = (material: {
    id: string;
    code: number;
    description: string;
    lastPurchasePrice: number | null;
  }) => {
    // Verificar se já existe
    if (items.some((item) => item.materialId === material.id)) {
      setError("Este material já foi adicionado");
      return;
    }

    setItems([
      ...items,
      {
        materialId: material.id,
        materialCode: material.code,
        materialDescription: material.description,
        quantity: 1,
        unitPrice: material.lastPurchasePrice ?? 0,
      },
    ]);
    setMaterialSearch("");
    setShowMaterialSearch(false);
  };

  const handleRemoveItem = (materialId: string) => {
    setItems(items.filter((item) => item.materialId !== materialId));
  };

  const handleUpdateItem = (
    materialId: string,
    field: keyof OrderItem,
    value: number | string
  ) => {
    setItems(
      items.map((item) =>
        item.materialId === materialId ? { ...item, [field]: value } : item
      )
    );
  };

  const totalValue = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedSupplier) {
      setError("Selecione um fornecedor");
      return;
    }

    if (items.length === 0) {
      setError("Adicione pelo menos um item");
      return;
    }

    createMutation.mutate({
      supplierId: selectedSupplier.id,
      expectedDeliveryDate: expectedDeliveryDate
        ? new Date(expectedDeliveryDate)
        : undefined,
      paymentTerms: paymentTerms || undefined,
      deliveryTerms: deliveryTerms || undefined,
      notes: notes || undefined,
      items: items.map((item) => ({
        materialId: item.materialId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        deliveryDays: item.deliveryDays,
        notes: item.notes,
      })),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/purchase-orders"
                className="text-gray-500 hover:text-gray-700"
                aria-label="Voltar para pedidos de compra"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-teal-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Novo Pedido de Compra
                </h1>
              </div>
            </div>
            <CompanySwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dados do Pedido */}
            <div className="lg:col-span-2 space-y-6">
              {/* Fornecedor */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Fornecedor
                </h2>
                <div className="relative">
                  <label htmlFor="supplier-search" className="sr-only">
                    Buscar fornecedor
                  </label>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="supplier-search"
                    type="text"
                    value={selectedSupplier ? selectedSupplier.companyName : supplierSearch}
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      setSelectedSupplier(null);
                    }}
                    placeholder="Buscar fornecedor..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    aria-label="Buscar fornecedor"
                  />
                  {suppliersData?.suppliers && supplierSearch && !selectedSupplier && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {suppliersData.suppliers.map((supplier) => (
                        <button
                          key={supplier.id}
                          type="button"
                          onClick={() => {
                            setSelectedSupplier({
                              id: supplier.id,
                              code: supplier.code,
                              companyName: supplier.companyName,
                            });
                            setSupplierSearch("");
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50"
                        >
                          <div className="font-medium">{supplier.companyName}</div>
                          <div className="text-sm text-gray-500">
                            Código: {supplier.code}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Itens */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Itens</h2>
                  <button
                    type="button"
                    onClick={() => setShowMaterialSearch(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Item
                  </button>
                </div>

                {showMaterialSearch && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="relative">
                      <label htmlFor="material-search" className="sr-only">
                        Buscar material
                      </label>
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="material-search"
                        type="text"
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                        placeholder="Buscar material..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        autoFocus
                        aria-label="Buscar material"
                      />
                    </div>
                    {materialsData?.materials && materialSearch && (
                      <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                        {materialsData.materials.map((material) => (
                          <button
                            key={material.id}
                            type="button"
                            onClick={() => handleAddItem(material)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100"
                          >
                            <div className="font-medium">{material.description}</div>
                            <div className="text-sm text-gray-500">
                              Código: {material.code} | Último preço:{" "}
                              {formatCurrency(material.lastPurchasePrice ?? 0)}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowMaterialSearch(false);
                        setMaterialSearch("");
                      }}
                      className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum item adicionado
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 text-sm font-medium text-gray-500">
                            Material
                          </th>
                          <th className="text-right py-2 text-sm font-medium text-gray-500 w-24">
                            Qtd
                          </th>
                          <th className="text-right py-2 text-sm font-medium text-gray-500 w-32">
                            Preço Unit.
                          </th>
                          <th className="text-right py-2 text-sm font-medium text-gray-500 w-32">
                            Total
                          </th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.materialId} className="border-b border-gray-100">
                            <td className="py-3">
                              <div className="font-medium text-sm">
                                {item.materialDescription}
                              </div>
                              <div className="text-xs text-gray-500">
                                Código: {item.materialCode}
                              </div>
                            </td>
                            <td className="py-3">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    item.materialId,
                                    "quantity",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full text-right px-2 py-1 border border-gray-300 rounded"
                                min="0.01"
                                step="0.01"
                                aria-label={`Quantidade de ${item.materialDescription}`}
                              />
                            </td>
                            <td className="py-3">
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    item.materialId,
                                    "unitPrice",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full text-right px-2 py-1 border border-gray-300 rounded"
                                min="0"
                                step="0.01"
                                aria-label={`Preço unitário de ${item.materialDescription}`}
                              />
                            </td>
                            <td className="py-3 text-right text-sm font-medium">
                              {formatCurrency(item.quantity * item.unitPrice)}
                            </td>
                            <td className="py-3">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.materialId)}
                                className="p-1 text-red-500 hover:text-red-700"
                                aria-label={`Remover ${item.materialDescription}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-200">
                          <td colSpan={3} className="py-3 text-right font-medium">
                            Total:
                          </td>
                          <td className="py-3 text-right text-lg font-bold text-teal-600">
                            {formatCurrency(totalValue)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Condições */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Condições
                </h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="delivery-date"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Previsão de Entrega
                    </label>
                    <input
                      id="delivery-date"
                      type="date"
                      value={expectedDeliveryDate}
                      onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="payment-terms"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Condição de Pagamento
                    </label>
                    <input
                      id="payment-terms"
                      type="text"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="Ex: 30/60/90 dias"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="delivery-terms"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Condição de Entrega
                    </label>
                    <input
                      id="delivery-terms"
                      type="text"
                      value={deliveryTerms}
                      onChange={(e) => setDeliveryTerms(e.target.value)}
                      placeholder="Ex: CIF, FOB"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="notes"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Observações
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <button
                  type="submit"
                  disabled={createMutation.isPending || items.length === 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Criar Pedido
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
