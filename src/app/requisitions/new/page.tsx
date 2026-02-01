"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Package,
  Loader2,
  Plus,
  Trash2,
  Search,
  X,
} from "lucide-react";

export default function NewRequisitionPage() {
  const router = useRouter();

  const [type, setType] = useState<"PRODUCTION" | "MAINTENANCE" | "ADMINISTRATIVE" | "PROJECT" | "OTHER">("PRODUCTION");
  const [costCenter, setCostCenter] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [priority, setPriority] = useState(3);
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<Array<{
    materialId: string;
    materialCode: number;
    materialDescription: string;
    unit: string;
    requestedQty: number;
    notes: string;
  }>>([]);

  const [showMaterialSearch, setShowMaterialSearch] = useState(false);
  const [materialSearch, setMaterialSearch] = useState("");

  const { data: materials, isLoading: loadingMaterials } = trpc.materials.list.useQuery(
    { search: materialSearch, limit: 20 },
    { enabled: materialSearch.length >= 2 }
  );

  const createMutation = trpc.requisitions.create.useMutation({
    onSuccess: (data) => {
      router.push(`/requisitions/${data.id}`);
    },
  });

  const addItem = (material: {
    id: string;
    code: number;
    description: string;
    unit: string;
  }) => {
    if (items.some((i) => i.materialId === material.id)) {
      alert("Material já adicionado");
      return;
    }

    setItems([
      ...items,
      {
        materialId: material.id,
        materialCode: material.code,
        materialDescription: material.description,
        unit: material.unit,
        requestedQty: 1,
        notes: "",
      },
    ]);
    setShowMaterialSearch(false);
    setMaterialSearch("");
  };

  const removeItem = (materialId: string) => {
    setItems(items.filter((i) => i.materialId !== materialId));
  };

  const updateItemQty = (materialId: string, qty: number) => {
    setItems(items.map((i) => 
      i.materialId === materialId ? { ...i, requestedQty: qty } : i
    ));
  };

  const handleSubmit = () => {
    if (items.length === 0) {
      alert("Adicione pelo menos um item");
      return;
    }

    createMutation.mutate({
      type,
      costCenter: costCenter || undefined,
      projectCode: projectCode || undefined,
      orderNumber: orderNumber || undefined,
      department: department || undefined,
      priority,
      notes: notes || undefined,
      items: items.map((i) => ({
        materialId: i.materialId,
        requestedQty: i.requestedQty,
        notes: i.notes || undefined,
      })),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Requisição"
        icon={<Package className="w-6 h-6" />}
        backHref="/requisitions"
        module="requisitions"
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Form */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h3 className="font-medium text-theme mb-4">Dados da Requisição</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Tipo *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as typeof type)}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PRODUCTION">Produção</option>
                  <option value="MAINTENANCE">Manutenção</option>
                  <option value="ADMINISTRATIVE">Administrativo</option>
                  <option value="PROJECT">Projeto</option>
                  <option value="OTHER">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Prioridade
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Urgente</option>
                  <option value={2}>Alta</option>
                  <option value={3}>Normal</option>
                  <option value={4}>Baixa</option>
                </select>
              </div>

              <Input
                label="Número OP/OS"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Ex: OP-12345"
              />

              <Input
                label="Centro de Custo"
                value={costCenter}
                onChange={(e) => setCostCenter(e.target.value)}
                placeholder="Ex: CC-001"
              />

              <Input
                label="Departamento"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ex: Produção"
              />

              <Input
                label="Código do Projeto"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                placeholder="Ex: PRJ-2024-001"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-theme-secondary mb-1">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Observações adicionais..."
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Items */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-theme">Itens</h3>
              <Button
                onClick={() => setShowMaterialSearch(true)}
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Adicionar Material
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-theme-muted">
                <Package className="w-12 h-12 mx-auto mb-2 text-theme-muted" />
                <p>Nenhum item adicionado</p>
                <p className="text-sm">Clique em &quot;Adicionar Material&quot; para começar</p>
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
                        Unidade
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
                    {items.map((item) => (
                      <tr key={item.materialId}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-theme">{item.materialDescription}</div>
                          <div className="text-sm text-theme-muted">Cód: {item.materialCode}</div>
                        </td>
                        <td className="px-4 py-3 text-center text-theme-secondary">
                          {item.unit}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={item.requestedQty}
                            onChange={(e) => updateItemQty(item.materialId, Number(e.target.value))}
                            min={0.01}
                            step={0.01}
                            className="w-24 px-2 py-1 border border-theme-input rounded text-center"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeItem(item.materialId)}
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
              href="/requisitions"
              className="px-6 py-2 border border-theme-input rounded-lg text-theme-secondary hover:bg-theme-hover"
            >
              Cancelar
            </Link>
            <Button
              onClick={handleSubmit}
              disabled={items.length === 0}
              isLoading={createMutation.isPending}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Criar Requisição
            </Button>
          </div>

          {createMutation.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {createMutation.error.message}
            </div>
          )}
        </div>
      </main>

      {/* Material Search Modal */}
      {showMaterialSearch && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="material-search-req-title"
          onKeyDown={(e) => e.key === "Escape" && setShowMaterialSearch(false)}
        >
          <div className="bg-theme-card rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-theme flex items-center justify-between">
              <h3 id="material-search-req-title" className="font-medium text-theme">Buscar Material</h3>
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
                  className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loadingMaterials ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : materialSearch.length < 2 ? (
                <div className="text-center py-8 text-theme-muted">
                  Digite pelo menos 2 caracteres para buscar
                </div>
              ) : !materials?.materials.length ? (
                <div className="text-center py-8 text-theme-muted">
                  Nenhum material encontrado
                </div>
              ) : (
                <div className="divide-y divide-theme-table">
                  {materials.materials.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => addItem(material)}
                      disabled={items.some((i) => i.materialId === material.id)}
                      className="w-full px-4 py-3 text-left hover:bg-theme-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium text-theme">{material.description}</div>
                      <div className="text-sm text-theme-muted">
                        Cód: {material.code} | {material.unit}
                        {items.some((i) => i.materialId === material.id) && (
                          <span className="ml-2 text-blue-600">(já adicionado)</span>
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
