"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Search,
  Save,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

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
  
  // Novos campos VIO-640
  const [application, setApplication] = useState("");
  const [carrier, setCarrier] = useState("");
  const [operationNature, setOperationNature] = useState("");
  const [freightType, setFreightType] = useState("");
  const [fobFreightValue, setFobFreightValue] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [pickupKm, setPickupKm] = useState<number | undefined>(undefined);
  const [pickupValue, setPickupValue] = useState<number | undefined>(undefined);

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
      toast.success("Pedido de compra criado com sucesso!");
      router.push(`/purchase-orders/${data.id}`);
    },
    onError: (err) => {
      toast.error("Erro ao criar pedido de compra", { description: err.message });
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
      // Novos campos VIO-640
      application: application || undefined,
      carrier: carrier || undefined,
      operationNature: operationNature as "INDUSTRIALIZATION" | "RESALE" | "CONSUMPTION" | "SERVICES" | "RAW_MATERIAL" | "SECONDARY" | "PACKAGING" | "FIXED_ASSET" | undefined || undefined,
      freightType: freightType as "CIF" | "FOB" | "PICKUP" | undefined || undefined,
      fobFreightValue: fobFreightValue || 0,
      deliveryAddress: deliveryAddress || undefined,
      deliveryPhone: deliveryPhone || undefined,
      pickupKm: pickupKm,
      pickupValue: pickupValue,
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
    <div className="space-y-6">
      <PageHeader
        title="Novo Pedido de Compra"
        subtitle="Cadastre um novo pedido de compra"
        icon={<ShoppingCart className="w-6 h-6" />}
        backHref="/purchase-orders"
      />

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dados do Pedido */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fornecedor */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-medium text-theme mb-4">
                Fornecedor
              </h2>
              <div className="relative">
                <label htmlFor="supplier-search" className="sr-only">
                  Buscar fornecedor
                </label>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                <input
                  id="supplier-search"
                  type="text"
                  value={selectedSupplier ? selectedSupplier.companyName : supplierSearch}
                  onChange={(e) => {
                    setSupplierSearch(e.target.value);
                    setSelectedSupplier(null);
                  }}
                  placeholder="Buscar fornecedor..."
                  className="w-full pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-teal-500"
                  aria-label="Buscar fornecedor"
                />
                {suppliersData?.suppliers && supplierSearch && !selectedSupplier && (
                  <div className="absolute z-10 w-full mt-1 bg-theme-input border border-theme rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                        className="w-full px-4 py-2 text-left hover:bg-theme-hover"
                      >
                        <div className="font-medium text-theme">{supplier.companyName}</div>
                        <div className="text-sm text-theme-muted">
                          Código: {supplier.code}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Itens */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-theme">Itens</h2>
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
                <div className="mb-4 p-4 bg-theme-secondary rounded-lg">
                  <div className="relative">
                    <label htmlFor="material-search" className="sr-only">
                      Buscar material
                    </label>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                    <input
                      id="material-search"
                      type="text"
                      value={materialSearch}
                      onChange={(e) => setMaterialSearch(e.target.value)}
                      placeholder="Buscar material..."
                      className="w-full pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-teal-500"
                      autoFocus
                      aria-label="Buscar material"
                    />
                  </div>
                  {materialsData?.materials && materialSearch && (
                    <div className="mt-2 border border-theme rounded-lg max-h-40 overflow-y-auto">
                      {materialsData.materials.map((material) => (
                        <button
                          key={material.id}
                          type="button"
                          onClick={() => handleAddItem(material)}
                          className="w-full px-4 py-2 text-left hover:bg-theme-hover"
                        >
                          <div className="font-medium text-theme">{material.description}</div>
                          <div className="text-sm text-theme-muted">
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
                    className="mt-2 text-sm text-theme-muted hover:text-theme-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {items.length === 0 ? (
                <div className="text-center py-8 text-theme-muted">
                  Nenhum item adicionado
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-theme">
                        <th className="text-left py-2 text-sm font-medium text-theme-muted">
                          Material
                        </th>
                        <th className="text-right py-2 text-sm font-medium text-theme-muted w-24">
                          Qtd
                        </th>
                        <th className="text-right py-2 text-sm font-medium text-theme-muted w-32">
                          Preço Unit.
                        </th>
                        <th className="text-right py-2 text-sm font-medium text-theme-muted w-32">
                          Total
                        </th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.materialId} className="border-b border-theme">
                          <td className="py-3">
                            <div className="font-medium text-sm text-theme">
                              {item.materialDescription}
                            </div>
                            <div className="text-xs text-theme-muted">
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
                              className="w-full text-right px-2 py-1 bg-theme-input border border-theme-input rounded text-theme"
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
                              className="w-full text-right px-2 py-1 bg-theme-input border border-theme-input rounded text-theme"
                              min="0"
                              step="0.01"
                              aria-label={`Preço unitário de ${item.materialDescription}`}
                            />
                          </td>
                          <td className="py-3 text-right text-sm font-medium text-theme">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </td>
                          <td className="py-3">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.materialId)}
                              className="p-1 text-red-400 hover:text-red-300"
                              aria-label={`Remover ${item.materialDescription}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-theme">
                        <td colSpan={3} className="py-3 text-right font-medium text-theme">
                          Total:
                        </td>
                        <td className="py-3 text-right text-lg font-bold text-teal-400">
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
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-medium text-theme mb-4">
                Condições
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="delivery-date"
                    className="block text-sm font-medium text-theme-secondary mb-1"
                  >
                    Previsão de Entrega
                  </label>
                  <input
                    id="delivery-date"
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="payment-terms"
                    className="block text-sm font-medium text-theme-secondary mb-1"
                  >
                    Condição de Pagamento
                  </label>
                  <input
                    id="payment-terms"
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="Ex: 30/60/90 dias"
                    className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="delivery-terms"
                    className="block text-sm font-medium text-theme-secondary mb-1"
                  >
                    Condição de Entrega
                  </label>
                  <input
                    id="delivery-terms"
                    type="text"
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value)}
                    placeholder="Ex: CIF, FOB"
                    className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-theme-secondary mb-1"
                  >
                    Observações
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Frete e Entrega */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-medium text-theme mb-4">
                Frete e Entrega
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="freight-type"
                    className="block text-sm font-medium text-theme-secondary mb-1"
                  >
                    Tipo de Frete
                  </label>
                  <select
                    id="freight-type"
                    value={freightType}
                    onChange={(e) => setFreightType(e.target.value)}
                    className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Selecione</option>
                    <option value="CIF">CIF - Fornecedor</option>
                    <option value="FOB">FOB - Comprador</option>
                    <option value="PICKUP">FRM Retira</option>
                  </select>
                </div>
                {freightType === "FOB" && (
                  <div>
                    <label
                      htmlFor="fob-freight-value"
                      className="block text-sm font-medium text-theme-secondary mb-1"
                    >
                      Valor do Frete FOB
                    </label>
                    <input
                      id="fob-freight-value"
                      type="number"
                      value={fobFreightValue || ""}
                      onChange={(e) => setFobFreightValue(parseFloat(e.target.value) || 0)}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}
                <div>
                  <label
                    htmlFor="carrier"
                    className="block text-sm font-medium text-theme-secondary mb-1"
                  >
                    Transportadora
                  </label>
                  <input
                    id="carrier"
                    type="text"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="Nome da transportadora"
                    className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="delivery-address"
                    className="block text-sm font-medium text-theme-secondary mb-1"
                  >
                    Endereço de Entrega
                  </label>
                  <input
                    id="delivery-address"
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Endereço completo"
                    className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="delivery-phone"
                    className="block text-sm font-medium text-theme-secondary mb-1"
                  >
                    Telefone de Entrega
                  </label>
                  <input
                    id="delivery-phone"
                    type="text"
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                {freightType === "PICKUP" && (
                  <>
                    <div>
                      <label
                        htmlFor="pickup-km"
                        className="block text-sm font-medium text-theme-secondary mb-1"
                      >
                        Km para Retirada
                      </label>
                      <input
                        id="pickup-km"
                        type="number"
                        value={pickupKm ?? ""}
                        onChange={(e) => setPickupKm(e.target.value ? parseFloat(e.target.value) : undefined)}
                        step="0.1"
                        min="0"
                        className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="pickup-value"
                        className="block text-sm font-medium text-theme-secondary mb-1"
                      >
                        Valor da Retirada
                      </label>
                      <input
                        id="pickup-value"
                        type="number"
                        value={pickupValue ?? ""}
                        onChange={(e) => setPickupValue(e.target.value ? parseFloat(e.target.value) : undefined)}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label
                    htmlFor="operation-nature"
                    className="block text-sm font-medium text-theme-secondary mb-1"
                  >
                    Natureza da Operação
                  </label>
                  <select
                    id="operation-nature"
                    value={operationNature}
                    onChange={(e) => setOperationNature(e.target.value)}
                    className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Selecione</option>
                    <option value="INDUSTRIALIZATION">Industrialização</option>
                    <option value="RESALE">Revenda</option>
                    <option value="CONSUMPTION">Consumo</option>
                    <option value="SERVICES">Serviços</option>
                    <option value="RAW_MATERIAL">Matéria Prima</option>
                    <option value="SECONDARY">Secundário</option>
                    <option value="PACKAGING">Embalagem</option>
                    <option value="FIXED_ASSET">Ativo Imobilizado</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="application"
                    className="block text-sm font-medium text-theme-secondary mb-1"
                  >
                    Aplicação
                  </label>
                  <input
                    id="application"
                    type="text"
                    value={application}
                    onChange={(e) => setApplication(e.target.value)}
                    placeholder="Aplicação do material"
                    className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <Button
                type="submit"
                disabled={items.length === 0}
                isLoading={createMutation.isPending}
                leftIcon={<Save className="w-5 h-5" />}
                className="w-full"
              >
                Criar Pedido
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
