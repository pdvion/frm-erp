"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Receipt, Search, Plus, Trash2 } from "lucide-react";
import { LinkButton } from "@/components/ui/LinkButton";
import { formatCurrency } from "@/lib/formatters";
import { Textarea } from "@/components/ui/Textarea";

interface InvoiceItem {
  id: string;
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function NewBillingPage() {
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; code: string; companyName: string } | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");

  const { data: customers } = trpc.customers.list.useQuery(
    { search: customerSearch, limit: 10 },
    { enabled: customerSearch.length >= 2 }
  );

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      code: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    const item = newItems[index];
    if (field === "quantity" || field === "unitPrice") {
      item[field] = Number(value);
      item.total = item.quantity * item.unitPrice;
    } else if (field === "code" || field === "description") {
      item[field] = String(value);
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Fatura"
        icon={<Receipt className="w-6 h-6" />}
        module="BILLING"
        breadcrumbs={[
          { label: "Faturamento", href: "/billing" },
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
                <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)} className="text-red-600 hover:text-red-700 p-1">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted z-10" />
                <Input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="pl-10"
                />
                {customers && customers.customers.length > 0 && customerSearch.length >= 2 && (
                  <div className="absolute z-10 w-full mt-1 bg-theme-card border border-theme rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {customers.customers.map((customer) => (
                      <Button
                        key={customer.id}
                        variant="ghost"
                        onClick={() => { setSelectedCustomer(customer); setCustomerSearch(""); }}
                        className="w-full text-left px-4 py-2 hover:bg-theme-hover text-theme justify-start h-auto rounded-none"
                      >
                        <div>
                          <p className="font-medium">{customer.companyName}</p>
                          <p className="text-xs text-theme-muted">{customer.code}</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Itens */}
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-theme">Itens da Fatura</h3>
              <Button onClick={addItem} size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-theme-hover rounded-lg">
                  <Input
                    value={item.code}
                    onChange={(e) => updateItem(index, "code", e.target.value)}
                    placeholder="Código"
                    className="w-24 text-sm"
                  />
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    placeholder="Descrição"
                    className="flex-1 text-sm"
                  />
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    className="w-16 text-sm text-center"
                  />
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                    placeholder="Preço"
                    className="w-24 text-sm text-right"
                  />
                  <span className="w-24 text-right text-sm font-medium text-theme">{formatCurrency(item.total)}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeItem(index)} className="p-1 text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {items.length === 0 && <p className="text-center text-theme-muted py-4">Nenhum item adicionado</p>}
            </div>
          </div>

          {/* Observações */}
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <h3 className="font-semibold text-theme mb-3">Observações</h3>
            <Textarea
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
            <div className="space-y-3 mb-4">
              <Input
                label="Vencimento"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
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
              <Button
                disabled={!selectedCustomer || items.length === 0 || !dueDate}
                className="w-full"
              >
                Emitir Fatura
              </Button>
              <LinkButton href="/billing" variant="outline" className="w-full">
                Cancelar
              </LinkButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
