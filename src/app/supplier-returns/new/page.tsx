"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Loader2,
  Package,
  AlertCircle,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import type { ReturnReason } from "@prisma/client";

interface ReturnItem {
  materialId: string;
  materialCode: number;
  materialDescription: string;
  materialUnit: string;
  receivedInvoiceItemId?: string;
  quantity: number;
  unitPrice: number;
  reason: ReturnReason;
  reasonNotes?: string;
  stockLocationId?: string;
}

export default function NewSupplierReturnPage() {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState("");
  const [receivedInvoiceId, setReceivedInvoiceId] = useState("");
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [searchMaterial, setSearchMaterial] = useState("");
  const [showMaterialSearch, setShowMaterialSearch] = useState(false);
  const [error, setError] = useState("");

  const { data: suppliersData } = trpc.suppliers.list.useQuery({ limit: 1000 });
  const { data: reasons } = trpc.supplierReturns.getReasons.useQuery();
  const { data: stockLocations } = trpc.stockLocations.list.useQuery({});

  const { data: invoicesData } = trpc.receivedInvoices.list.useQuery(
    { supplierId, limit: 100 },
    { enabled: !!supplierId }
  );

  const { data: materialsData, isLoading: loadingMaterials } = trpc.materials.list.useQuery(
    { search: searchMaterial, limit: 50 },
    { enabled: searchMaterial.length >= 2 }
  );

  const createMutation = trpc.supplierReturns.create.useMutation({
    onSuccess: (result) => {
      router.push(`/supplier-returns/${result.id}`);
    },
    onError: (error: { message: string }) => {
      setError(error.message);
    },
  });

  const addItem = (material: {
    id: string;
    code: number;
    description: string;
    unit: string;
    lastPurchasePrice?: number | null;
  }) => {
    if (items.some((i) => i.materialId === material.id)) {
      setError("Material já adicionado");
      return;
    }

    setItems([
      ...items,
      {
        materialId: material.id,
        materialCode: material.code,
        materialDescription: material.description,
        materialUnit: material.unit,
        quantity: 1,
        unitPrice: material.lastPurchasePrice || 0,
        reason: "OTHER",
      },
    ]);
    setShowMaterialSearch(false);
    setSearchMaterial("");
    setError("");
  };

  const updateItem = (index: number, field: keyof ReturnItem, value: string | number) => {
    const newItems = [...items];
    (newItems[index] as unknown as Record<string, string | number>)[field] = value;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!supplierId) {
      setError("Selecione um fornecedor");
      return;
    }

    if (items.length === 0) {
      setError("Adicione pelo menos um item");
      return;
    }

    await createMutation.mutateAsync({
      supplierId,
      receivedInvoiceId: receivedInvoiceId || undefined,
      returnDate: new Date(returnDate),
      notes: notes || undefined,
      items: items.map((item) => ({
        materialId: item.materialId,
        receivedInvoiceItemId: item.receivedInvoiceItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        reason: item.reason,
        reasonNotes: item.reasonNotes,
        stockLocationId: item.stockLocationId,
      })),
    });
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/supplier-returns"
            className="p-2 hover:bg-theme-hover rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-theme-muted" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-theme">Nova Devolução</h1>
            <p className="text-theme-muted">Registre uma devolução a fornecedor</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Básicos */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h2 className="text-lg font-semibold text-theme mb-4">Dados da Devolução</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Fornecedor *
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => {
                    setSupplierId(e.target.value);
                    setReceivedInvoiceId("");
                  }}
                  required
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-card text-theme"
                >
                  <option value="">Selecione...</option>
                  {suppliersData?.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  NFe de Origem
                </label>
                <select
                  value={receivedInvoiceId}
                  onChange={(e) => setReceivedInvoiceId(e.target.value)}
                  disabled={!supplierId}
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-card text-theme disabled:opacity-50"
                >
                  <option value="">Nenhuma (manual)</option>
                  {invoicesData?.invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      NF {inv.invoiceNumber}/{inv.series} - {formatCurrency(inv.totalInvoice)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Data da Devolução *
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-card text-theme"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-theme mb-1">
                  Observações
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-card text-theme"
                  placeholder="Observações gerais sobre a devolução..."
                />
              </div>
            </div>
          </div>

          {/* Itens */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-theme">Itens da Devolução</h2>
              <button
                type="button"
                onClick={() => setShowMaterialSearch(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Adicionar Item
              </button>
            </div>

            {/* Material Search Modal */}
            {showMaterialSearch && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-theme-card rounded-xl border border-theme p-6 w-full max-w-lg mx-4">
                  <h3 className="text-lg font-semibold text-theme mb-4">Buscar Material</h3>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                    <input
                      type="text"
                      value={searchMaterial}
                      onChange={(e) => setSearchMaterial(e.target.value)}
                      placeholder="Digite código ou descrição..."
                      autoFocus
                      className="w-full pl-10 pr-4 py-2 border border-theme rounded-lg bg-theme-card text-theme"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {loadingMaterials ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                      </div>
                    ) : materialsData?.materials.length ? (
                      <div className="space-y-2">
                        {materialsData.materials.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => addItem(m)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-theme-hover rounded-lg text-left"
                          >
                            <Package className="w-5 h-5 text-theme-muted" />
                            <div className="flex-1">
                              <div className="font-medium text-theme">
                                {m.code} - {m.description}
                              </div>
                              <div className="text-sm text-theme-muted">
                                {m.unit} | Último preço: {formatCurrency(m.lastPurchasePrice || 0)}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : searchMaterial.length >= 2 ? (
                      <p className="text-center text-theme-muted py-8">
                        Nenhum material encontrado
                      </p>
                    ) : (
                      <p className="text-center text-theme-muted py-8">
                        Digite pelo menos 2 caracteres
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMaterialSearch(false);
                        setSearchMaterial("");
                      }}
                      className="px-4 py-2 text-theme-muted hover:text-theme"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Items Table */}
            {items.length === 0 ? (
              <div className="text-center py-8 text-theme-muted">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum item adicionado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-theme-hover">
                    <tr>
                      <th className="px-3 py-2 text-left text-sm font-medium text-theme-muted">
                        Material
                      </th>
                      <th className="px-3 py-2 text-center text-sm font-medium text-theme-muted">
                        Qtd
                      </th>
                      <th className="px-3 py-2 text-right text-sm font-medium text-theme-muted">
                        Preço Unit.
                      </th>
                      <th className="px-3 py-2 text-right text-sm font-medium text-theme-muted">
                        Total
                      </th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-theme-muted">
                        Motivo
                      </th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-theme-muted">
                        Local
                      </th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {items.map((item, index) => (
                      <tr key={item.materialId}>
                        <td className="px-3 py-2">
                          <div className="text-sm font-medium text-theme">
                            {item.materialCode} - {item.materialDescription}
                          </div>
                          <div className="text-xs text-theme-muted">{item.materialUnit}</div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                            }
                            min="0.001"
                            step="0.001"
                            className="w-20 px-2 py-1 border border-theme rounded text-center text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)
                            }
                            min="0"
                            step="0.01"
                            className="w-24 px-2 py-1 border border-theme rounded text-right text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-medium text-theme">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.reason}
                            onChange={(e) =>
                              updateItem(index, "reason", e.target.value as ReturnReason)
                            }
                            className="w-full px-2 py-1 border border-theme rounded text-sm"
                          >
                            {reasons?.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.stockLocationId || ""}
                            onChange={(e) =>
                              updateItem(index, "stockLocationId", e.target.value)
                            }
                            className="w-full px-2 py-1 border border-theme rounded text-sm"
                          >
                            <option value="">-</option>
                            {stockLocations?.map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.code}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-theme-hover">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right font-medium text-theme">
                        Total:
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-theme">
                        {formatCurrency(totalValue)}
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/supplier-returns"
              className="px-4 py-2 text-theme-muted hover:text-theme"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar Devolução
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
