"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { ShoppingCart, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/formatters";

interface SaleItem {
  materialId: string;
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  total: number;
}

export default function NewSalePage() {
  const router = useRouter();
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; code: string; companyName: string } | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [notes, setNotes] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");

  const { data: customers } = trpc.customers.list.useQuery(
    { search: customerSearch, limit: 10 },
    { enabled: customerSearch.length >= 2 }
  );

  const { data: materialsData } = trpc.materials.list.useQuery(
    { search: materialSearch, limit: 10 },
    { enabled: materialSearch.length >= 2 }
  );

  const createQuoteMutation = trpc.sales.createQuote.useMutation();
  const convertToOrderMutation = trpc.sales.convertQuoteToOrder.useMutation({
    onSuccess: (order) => {
      router.push(`/sales/orders/${order.id}`);
    },
  });

  const addMaterial = (material: { id: string; code: number; description: string; lastPurchasePrice: number | null }) => {
    if (items.find((i) => i.materialId === material.id)) return;
    
    const unitPrice = material.lastPurchasePrice || 0;
    setItems([
      ...items,
      {
        materialId: material.id,
        code: String(material.code),
        description: material.description,
        quantity: 1,
        unitPrice,
        discountPercent: 0,
        total: unitPrice,
      },
    ]);
    setMaterialSearch("");
  };

  const updateItem = (index: number, field: "quantity" | "unitPrice" | "discountPercent", value: number) => {
    const newItems = [...items];
    const item = newItems[index];
    item[field] = value;
    item.total = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const isSubmitting = createQuoteMutation.isPending || convertToOrderMutation.isPending;

  const handleSubmit = async () => {
    if (!selectedCustomer || items.length === 0) return;

    try {
      const quote = await createQuoteMutation.mutateAsync({
        customerId: selectedCustomer.id,
        notes,
        items: items.map((item) => ({
          materialId: item.materialId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
        })),
      });

      await convertToOrderMutation.mutateAsync({
        quoteId: quote.id,
      });
    } catch (error) {
      console.error("Erro ao criar venda:", error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Venda"
        icon={<ShoppingCart className="w-6 h-6" />}
        module="SALES"
        breadcrumbs={[
          { label: "Vendas", href: "/sales" },
          { label: "Nova" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente */}
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <h3 className="font-semibold text-theme mb-3">Cliente</h3>
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 bg-theme-hover rounded-lg">
                <div>
                  <p className="font-medium text-theme">{selectedCustomer.companyName}</p>
                  <p className="text-sm text-theme-muted">Código: {selectedCustomer.code}</p>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="w-full pl-10 pr-4 py-2 border border-theme rounded-lg bg-theme-card text-theme"
                />
                {customers && customers.customers.length > 0 && customerSearch.length >= 2 && (
                  <div className="absolute z-10 w-full mt-1 bg-theme-card border border-theme rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {customers.customers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => { setSelectedCustomer(customer); setCustomerSearch(""); }}
                        className="w-full text-left px-4 py-2 hover:bg-theme-hover text-theme"
                      >
                        <p className="font-medium">{customer.companyName}</p>
                        <p className="text-xs text-theme-muted">{customer.code}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Itens */}
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <h3 className="font-semibold text-theme mb-3">Itens</h3>
            
            {/* Busca de materiais */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <input
                type="text"
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                placeholder="Buscar produto para adicionar..."
                className="w-full pl-10 pr-4 py-2 border border-theme rounded-lg bg-theme-card text-theme"
              />
              {materialsData && materialsData.materials.length > 0 && materialSearch.length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-theme-card border border-theme rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {materialsData.materials.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => addMaterial(material)}
                      className="w-full text-left px-4 py-2 hover:bg-theme-hover text-theme"
                    >
                      <p className="font-medium">{material.description}</p>
                      <p className="text-xs text-theme-muted">
                        Código: {material.code} | Preço: {formatCurrency(material.lastPurchasePrice || 0)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lista de itens */}
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.materialId} className="flex items-center gap-2 p-2 bg-theme-hover rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-theme truncate">{item.description}</p>
                    <p className="text-xs text-theme-muted">Código: {item.code}</p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                    className="w-16 px-2 py-1 text-sm border border-theme rounded bg-theme-card text-theme text-center"
                    title="Quantidade"
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))}
                    className="w-24 px-2 py-1 text-sm border border-theme rounded bg-theme-card text-theme text-right"
                    title="Preço unitário"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={item.discountPercent}
                    onChange={(e) => updateItem(index, "discountPercent", Number(e.target.value))}
                    className="w-16 px-2 py-1 text-sm border border-theme rounded bg-theme-card text-theme text-center"
                    title="Desconto %"
                    placeholder="%"
                  />
                  <span className="w-24 text-right text-sm font-medium text-theme">{formatCurrency(item.total)}</span>
                  <button onClick={() => removeItem(index)} className="p-1 text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {items.length === 0 && <p className="text-center text-theme-muted py-4">Busque produtos acima para adicionar</p>}
            </div>
          </div>

          {/* Observações */}
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <h3 className="font-semibold text-theme mb-3">Observações</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-card text-theme"
              rows={3}
            />
          </div>
        </div>

        {/* Resumo */}
        <div className="space-y-6">
          <div className="bg-theme-card border border-theme rounded-lg p-4 sticky top-4">
            <h3 className="font-semibold text-theme mb-4">Resumo</h3>
            <div className="border-t border-theme pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-theme-muted">Itens</span>
                <span className="text-theme">{items.length}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span className="text-theme">Total</span>
                <span className="text-theme">{formatCurrency(subtotal)}</span>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <button
                onClick={handleSubmit}
                disabled={!selectedCustomer || items.length === 0 || isSubmitting}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Processando..." : "Finalizar Venda"}
              </button>
              <Link href="/sales" className="block w-full px-4 py-2 text-center border border-theme rounded-lg text-theme hover:bg-theme-hover">
                Cancelar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
