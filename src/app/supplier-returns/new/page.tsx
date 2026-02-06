"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Loader2, Plus, Trash2, Search, Package, AlertCircle, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import type { ReturnReason } from "@prisma/client";
import { NativeSelect } from "@/components/ui/NativeSelect";

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
        <PageHeader
          title="Nova Devolução"
          subtitle="Registre uma devolução a fornecedor"
          icon={<RotateCcw className="h-6 w-6" />}
          backHref="/supplier-returns"
          module="inventory"
        />

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Básicos */}
          <div className="bg-theme-card border-theme rounded-xl border p-6">
            <h2 className="text-theme mb-4 text-lg font-semibold">Dados da Devolução</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="text-theme mb-1 block text-sm font-medium">Fornecedor *</label>
                <Select
                  value={supplierId}
                  onChange={(value) => {
                    setSupplierId(value);
                    setReceivedInvoiceId("");
                  }}
                  placeholder="Selecione..."
                  options={[
                    { value: "", label: "Selecione..." },
                    ...(suppliersData?.suppliers.map((s) => ({ value: s.id, label: `${s.code} - ${s.companyName}` })) || []),
                  ]}
                />
              </div>

              <div>
                <label className="text-theme mb-1 block text-sm font-medium">NFe de Origem</label>
                <Select
                  value={receivedInvoiceId}
                  onChange={(value) => setReceivedInvoiceId(value)}
                  disabled={!supplierId}
                  placeholder="Nenhuma (manual)"
                  options={[
                    { value: "", label: "Nenhuma (manual)" },
                    ...(invoicesData?.invoices.map((inv) => ({ value: inv.id, label: `NF ${inv.invoiceNumber}/${inv.series} - ${formatCurrency(inv.totalInvoice)}` })) || []),
                  ]}
                />
              </div>

              <Input
                label="Data da Devolução *"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                required
              />

              <div className="md:col-span-2 lg:col-span-3">
                <label className="text-theme mb-1 block text-sm font-medium">Observações</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Observações gerais sobre a devolução..."
                />
              </div>
            </div>
          </div>

          {/* Itens */}
          <div className="bg-theme-card border-theme rounded-xl border p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-theme text-lg font-semibold">Itens da Devolução</h2>
              <Button
                type="button"
                size="sm"
                onClick={() => setShowMaterialSearch(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Adicionar Item
              </Button>
            </div>

            {/* Material Search Modal */}
            {showMaterialSearch && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-theme-card border-theme mx-4 w-full max-w-lg rounded-xl border p-6">
                  <h3 className="text-theme mb-4 text-lg font-semibold">Buscar Material</h3>
                  <div className="relative mb-4">
                    <Search className="text-theme-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      type="text"
                      value={searchMaterial}
                      onChange={(e) => setSearchMaterial(e.target.value)}
                      placeholder="Digite código ou descrição..."
                      autoFocus
                      className="border-theme bg-theme-card text-theme w-full rounded-lg border py-2 pr-4 pl-10"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {loadingMaterials ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      </div>
                    ) : materialsData?.materials.length ? (
                      <div className="space-y-2">
                        {materialsData.materials.map((m) => (
                          <Button
                            key={m.id}
                            type="button"
                            variant="ghost"
                            onClick={() => addItem(m)}
                            className="hover:bg-theme-hover flex w-full items-center gap-3 rounded-lg p-3 text-left justify-start h-auto"
                          >
                            <Package className="text-theme-muted h-5 w-5" />
                            <div className="flex-1">
                              <div className="text-theme font-medium">
                                {m.code} - {m.description}
                              </div>
                              <div className="text-theme-muted text-sm">
                                {m.unit} | Último preço: {formatCurrency(m.lastPurchasePrice || 0)}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    ) : searchMaterial.length >= 2 ? (
                      <p className="text-theme-muted py-8 text-center">
                        Nenhum material encontrado
                      </p>
                    ) : (
                      <p className="text-theme-muted py-8 text-center">
                        Digite pelo menos 2 caracteres
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowMaterialSearch(false);
                        setSearchMaterial("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Items Table */}
            {items.length === 0 ? (
              <div className="text-theme-muted py-8 text-center">
                <Package className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p>Nenhum item adicionado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-theme-hover">
                    <tr>
                      <th className="text-theme-muted px-3 py-2 text-left text-sm font-medium">
                        Material
                      </th>
                      <th className="text-theme-muted px-3 py-2 text-center text-sm font-medium">
                        Qtd
                      </th>
                      <th className="text-theme-muted px-3 py-2 text-right text-sm font-medium">
                        Preço Unit.
                      </th>
                      <th className="text-theme-muted px-3 py-2 text-right text-sm font-medium">
                        Total
                      </th>
                      <th className="text-theme-muted px-3 py-2 text-left text-sm font-medium">
                        Motivo
                      </th>
                      <th className="text-theme-muted px-3 py-2 text-left text-sm font-medium">
                        Local
                      </th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-theme divide-y">
                    {items.map((item, index) => (
                      <tr key={item.materialId}>
                        <td className="px-3 py-2">
                          <div className="text-theme text-sm font-medium">
                            {item.materialCode} - {item.materialDescription}
                          </div>
                          <div className="text-theme-muted text-xs">{item.materialUnit}</div>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                            }
                            min="0.001"
                            step="0.001"
                            className="border-theme w-20 rounded border px-2 py-1 text-center text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)
                            }
                            min="0"
                            step="0.01"
                            className="border-theme w-24 rounded border px-2 py-1 text-right text-sm"
                          />
                        </td>
                        <td className="text-theme px-3 py-2 text-right text-sm font-medium">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </td>
                        <td className="px-3 py-2">
                          <NativeSelect
                            value={item.reason}
                            onChange={(e) =>
                              updateItem(index, "reason", e.target.value as ReturnReason)
                            }
                            className="border-theme w-full rounded border px-2 py-1 text-sm"
                          >
                            {reasons?.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </NativeSelect>
                        </td>
                        <td className="px-3 py-2">
                          <NativeSelect
                            value={item.stockLocationId || ""}
                            onChange={(e) => updateItem(index, "stockLocationId", e.target.value)}
                            className="border-theme w-full rounded border px-2 py-1 text-sm"
                          >
                            <option value="">-</option>
                            {stockLocations?.map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.code}
                              </option>
                            ))}
                          </NativeSelect>
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="rounded p-1 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-theme-hover">
                    <tr>
                      <td colSpan={3} className="text-theme px-3 py-2 text-right font-medium">
                        Total:
                      </td>
                      <td className="text-theme px-3 py-2 text-right font-bold">
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
            <Button
              variant="outline"
              onClick={() => router.push("/supplier-returns")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Salvar Devolução
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
