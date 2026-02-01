"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import {
  PackagePlus,
  Search,
  Plus,
  Trash2,
  Package,
  Save,
  AlertCircle,
} from "lucide-react";

type PickingType = "REQUISITION" | "SALES_ORDER" | "PRODUCTION_ORDER" | "TRANSFER";
type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

interface PickingItem {
  materialId: string;
  materialCode: string;
  materialDescription: string;
  locationId?: string;
  locationCode?: string;
  requestedQty: number;
  lotNumber?: string;
}

export default function NewPickingPage() {
  const router = useRouter();
  const [type, setType] = useState<PickingType>("REQUISITION");
  const [priority, setPriority] = useState<Priority>("NORMAL");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PickingItem[]>([]);
  const [materialSearch, setMaterialSearch] = useState("");
  const [error, setError] = useState("");

  const { data: materials } = trpc.materials.list.useQuery({
    search: materialSearch || undefined,
    status: "ACTIVE",
    limit: 10,
  });

  const createMutation = trpc.picking.create.useMutation({
    onSuccess: (data) => {
      router.push(`/picking/${data.id}`);
    },
    onError: (err) => setError(err.message),
  });

  const handleAddItem = (material: { id: string; code: string; description: string }) => {
    if (items.some((i) => i.materialId === material.id)) {
      setError("Material já adicionado à lista");
      return;
    }

    setItems([
      ...items,
      {
        materialId: material.id,
        materialCode: material.code,
        materialDescription: material.description,
        requestedQty: 1,
      },
    ]);
    setMaterialSearch("");
    setError("");
  };

  const handleRemoveItem = (materialId: string) => {
    setItems(items.filter((i) => i.materialId !== materialId));
  };

  const handleUpdateQty = (materialId: string, qty: number) => {
    setItems(
      items.map((i) =>
        i.materialId === materialId ? { ...i, requestedQty: Math.max(1, qty) } : i
      )
    );
  };

  const handleSubmit = () => {
    setError("");

    if (items.length === 0) {
      setError("Adicione pelo menos um item à lista de separação");
      return;
    }

    createMutation.mutate({
      type,
      priority,
      notes: notes || undefined,
      items: items.map((i) => ({
        materialId: i.materialId,
        locationId: i.locationId,
        requestedQty: i.requestedQty,
        lotNumber: i.lotNumber,
      })),
    });
  };

  const typeOptions: { value: PickingType; label: string }[] = [
    { value: "REQUISITION", label: "Requisição" },
    { value: "SALES_ORDER", label: "Pedido de Venda" },
    { value: "PRODUCTION_ORDER", label: "Ordem de Produção" },
    { value: "TRANSFER", label: "Transferência" },
  ];

  const priorityOptions: { value: Priority; label: string }[] = [
    { value: "LOW", label: "Baixa" },
    { value: "NORMAL", label: "Normal" },
    { value: "HIGH", label: "Alta" },
    { value: "URGENT", label: "Urgente" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Separação"
        icon={<PackagePlus className="w-6 h-6" />}
        module="INVENTORY"
        breadcrumbs={[
          { label: "Estoque", href: "/inventory" },
          { label: "Picking", href: "/picking" },
          { label: "Nova" },
        ]}
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Dados Gerais */}
      <div className="bg-theme-card border border-theme rounded-lg p-6">
        <h2 className="text-lg font-semibold text-theme mb-4">Dados Gerais</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme mb-1">
              Tipo *
            </label>
            <Select
              value={type}
              onChange={(value) => setType(value as PickingType)}
              options={typeOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme mb-1">
              Prioridade
            </label>
            <Select
              value={priority}
              onChange={(value) => setPriority(value as Priority)}
              options={priorityOptions}
            />
          </div>

          <Input
            label="Observações"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações opcionais..."
          />
        </div>
      </div>

      {/* Adicionar Itens */}
      <div className="bg-theme-card border border-theme rounded-lg p-6">
        <h2 className="text-lg font-semibold text-theme mb-4">Adicionar Itens</h2>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
          <input
            type="text"
            value={materialSearch}
            onChange={(e) => setMaterialSearch(e.target.value)}
            placeholder="Buscar material por código ou descrição..."
            className="w-full pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
          />
        </div>

        {materials?.materials && materials.materials.length > 0 && materialSearch && (
          <div className="mt-2 max-h-48 overflow-auto border border-theme rounded-lg bg-theme-card">
            {materials.materials.map((mat) => (
              <button
                key={mat.id}
                type="button"
                onClick={() => handleAddItem({ id: mat.id, code: String(mat.code), description: mat.description })}
                className="w-full px-4 py-3 text-left hover:bg-theme-secondary flex items-center justify-between border-b border-theme last:border-b-0"
              >
                <div>
                  <p className="font-medium text-theme">{mat.code}</p>
                  <p className="text-sm text-theme-muted">{mat.description}</p>
                </div>
                <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Itens */}
      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        <div className="p-4 border-b border-theme">
          <h2 className="text-lg font-semibold text-theme">
            Itens da Separação ({items.length})
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 mx-auto text-theme-muted mb-3" />
            <p className="text-theme-muted">Nenhum item adicionado</p>
            <p className="text-sm text-theme-muted mt-1">
              Use a busca acima para adicionar materiais
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-theme-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                    Material
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">
                    Quantidade
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {items.map((item) => (
                  <tr key={item.materialId} className="hover:bg-theme-secondary">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-theme-muted" />
                        <div>
                          <p className="font-medium text-theme">{item.materialCode}</p>
                          <p className="text-sm text-theme-muted">
                            {item.materialDescription}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          min={1}
                          value={item.requestedQty}
                          onChange={(e) =>
                            handleUpdateQty(item.materialId, parseInt(e.target.value) || 1)
                          }
                          className="w-24 px-3 py-1.5 text-center bg-theme-input border border-theme-input rounded-lg text-theme"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRemoveItem(item.materialId)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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

      {/* Ações */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/picking")}
        >
          ← Cancelar e voltar
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={items.length === 0}
          isLoading={createMutation.isPending}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Criar Separação
        </Button>
      </div>
    </div>
  );
}
