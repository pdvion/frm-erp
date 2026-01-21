"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { SelectWithAdd } from "@/components/ui/SelectWithAdd";
import { SupplierQuickForm } from "@/components/forms/SupplierQuickForm";
import {
  FileText,
  Save,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Search,
  Package,
} from "lucide-react";

interface QuoteItem {
  materialId: string;
  materialCode: number;
  materialDescription: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  deliveryDays?: number;
  notes?: string;
}

export default function NewQuotePage() {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Material search
  const [materialSearch, setMaterialSearch] = useState("");
  const [showMaterialSearch, setShowMaterialSearch] = useState(false);

  const { data: suppliers } = trpc.suppliers.list.useQuery({ limit: 100 });
  const { data: materials } = trpc.materials.list.useQuery(
    { search: materialSearch, limit: 20 },
    { enabled: materialSearch.length >= 2 }
  );

  const createMutation = trpc.quotes.create.useMutation({
    onSuccess: (quote) => {
      router.push(`/quotes/${quote.id}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleAddMaterial = (material: {
    id: string;
    code: number;
    description: string;
    unit: string;
  }) => {
    if (items.some((item) => item.materialId === material.id)) {
      setError("Material já adicionado à cotação");
      return;
    }

    setItems([
      ...items,
      {
        materialId: material.id,
        materialCode: material.code,
        materialDescription: material.description,
        unit: material.unit,
        quantity: 1,
        unitPrice: 0,
      },
    ]);
    setMaterialSearch("");
    setShowMaterialSearch(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof QuoteItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError("Selecione um fornecedor");
      return;
    }

    if (items.length === 0) {
      setError("Adicione pelo menos um item à cotação");
      return;
    }

    createMutation.mutate({
      supplierId,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      paymentTerms: paymentTerms || undefined,
      deliveryTerms: deliveryTerms || undefined,
      notes: notes || undefined,
      items: items.map((item) => ({
        materialId: item.materialId,
        quantity: item.quantity,
        unitPrice: item.unitPrice || undefined,
        deliveryDays: item.deliveryDays,
        notes: item.notes,
      })),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Cotação"
        subtitle="Cadastre uma nova cotação de fornecedor"
        icon={<FileText className="w-6 h-6" />}
        backHref="/quotes"
      />

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quote Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier Selection */}
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              <h2 className="text-lg font-medium text-white mb-4">
                Fornecedor
              </h2>
                <SelectWithAdd
                  id="supplierId"
                  name="supplierId"
                  label="Fornecedor"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  options={suppliers?.suppliers.map((supplier) => ({
                    value: supplier.id,
                    label: `${supplier.code} - ${supplier.tradeName || supplier.companyName}`,
                  })) || []}
                  placeholder="Selecione um fornecedor"
                  required
                  drawerTitle="Novo Fornecedor"
                  drawerDescription="Cadastre um novo fornecedor rapidamente"
                  drawerSize="lg"
                  FormComponent={SupplierQuickForm}
                />
              </div>

            {/* Items */}
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-white">
                  Itens da Cotação
                </h2>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMaterialSearch(!showMaterialSearch)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Item
                  </button>

                  {showMaterialSearch && (
                    <div className="absolute right-0 top-full mt-2 w-96 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 z-10">
                      <div className="p-3 border-b border-zinc-700">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                          <input
                            type="text"
                            placeholder="Buscar material..."
                            value={materialSearch}
                            onChange={(e) => setMaterialSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {materials?.materials.length === 0 ? (
                          <div className="p-4 text-center text-zinc-500 text-sm">
                            {materialSearch.length < 2
                              ? "Digite pelo menos 2 caracteres"
                              : "Nenhum material encontrado"}
                          </div>
                        ) : (
                          materials?.materials.map((material) => (
                            <button
                              key={material.id}
                              type="button"
                              onClick={() => handleAddMaterial(material)}
                              className="w-full px-4 py-3 text-left hover:bg-zinc-700 flex items-center gap-3 border-b border-zinc-700 last:border-0"
                            >
                              <Package className="w-5 h-5 text-zinc-500" />
                              <div>
                                <div className="font-medium text-white">
                                  {material.code} - {material.description}
                                </div>
                                <div className="text-sm text-zinc-500">
                                  Unidade: {material.unit}
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
                  <p>Nenhum item adicionado</p>
                  <p className="text-sm">
                    Clique em &quot;Adicionar Item&quot; para começar
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-800">
                    <thead className="bg-zinc-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                          Material
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase w-24">
                          Qtd
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase w-32">
                          Preço Unit.
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase w-32">
                          Total
                        </th>
                        <th className="px-4 py-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {items.map((item, index) => (
                        <tr key={item.materialId}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">
                              {item.materialCode} - {item.materialDescription}
                            </div>
                            <div className="text-sm text-zinc-500">
                              {item.unit}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "quantity",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "unitPrice",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-white">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-1 text-red-400 hover:bg-red-900/20 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-zinc-800/50">
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-3 text-right font-medium text-white"
                        >
                          Total:
                        </td>
                        <td className="px-4 py-3 font-bold text-white">
                          {formatCurrency(calculateTotal())}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              <h2 className="text-lg font-medium text-white mb-4">
                Informações Adicionais
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Válida até
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Condições de Pagamento
                  </label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="Ex: 30/60/90 dias"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Condições de Entrega
                  </label>
                  <input
                    type="text"
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value)}
                    placeholder="Ex: CIF, FOB"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-900/20 rounded-lg border border-blue-800 p-6">
              <h3 className="font-medium text-blue-400 mb-3">Resumo</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-400/70">Itens:</span>
                  <span className="font-medium text-white">
                    {items.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-400/70">Total:</span>
                  <span className="font-bold text-white">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Criar Cotação
                  </>
                )}
              </button>
              <Link
                href="/quotes"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 font-medium"
              >
                Cancelar
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
