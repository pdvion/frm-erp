"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatNumber } from "@/lib/formatters";

import {
  Layers,
  ChevronLeft,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Calculator,
  Search,
  ChevronDown,
  Package,
  AlertTriangle,
} from "lucide-react";

export default function BomDetailPage() {
  const params = useParams();
  const materialId = params.id as string;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [showExplodeModal, setShowExplodeModal] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const { data, isLoading, refetch } = trpc.bom.getByProduct.useQuery({ materialId });

  const removeMutation = trpc.bom.removeItem.useMutation({
    onSuccess: () => refetch(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-theme-card border-b border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/engineering/bom" className="text-theme-muted hover:text-theme-secondary">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-theme flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  Estrutura de Produto
                </h1>
                {data?.parentMaterial && (
                  <p className="text-sm text-theme-muted">
                    {data.parentMaterial.code} - {data.parentMaterial.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              
              <button
                onClick={() => setShowCostModal(true)}
                className="flex items-center gap-2 px-3 py-2 border border-theme-input rounded-lg hover:bg-theme-hover"
              >
                <Calculator className="w-4 h-4" />
                Custo
              </button>
              <button
                onClick={() => setShowExplodeModal(true)}
                className="flex items-center gap-2 px-3 py-2 border border-theme-input rounded-lg hover:bg-theme-hover"
              >
                <ChevronDown className="w-4 h-4" />
                Explodir
              </button>
              <button
                onClick={() => setShowCopyModal(true)}
                className="flex items-center gap-2 px-3 py-2 border border-theme-input rounded-lg hover:bg-theme-hover"
              >
                <Copy className="w-4 h-4" />
                Copiar
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <div className="text-sm text-theme-muted">Total de Componentes</div>
            <div className="text-2xl font-bold text-theme">{data?.totalItems || 0}</div>
          </div>
          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <div className="text-sm text-theme-muted">Categoria</div>
            <div className="text-lg font-medium text-theme">
              {data?.parentMaterial?.category?.name || "Sem categoria"}
            </div>
          </div>
          <div className="bg-theme-card rounded-lg border border-theme p-4">
            <div className="text-sm text-theme-muted">Unidade</div>
            <div className="text-lg font-medium text-theme">
              {data?.parentMaterial?.unit || "UN"}
            </div>
          </div>
        </div>

        {/* Components Table */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          <div className="px-4 py-3 border-b border-theme bg-theme-tertiary">
            <h3 className="font-medium text-theme">Componentes</h3>
          </div>

          {!data?.items.length ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-theme mb-2">
                Nenhum componente cadastrado
              </h3>
              <p className="text-theme-muted mb-4">
                Adicione componentes para criar a estrutura do produto.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Adicionar Componente
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-theme-table">
                <thead className="bg-theme-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                      Seq
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                      Componente
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                      Quantidade
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                      Perda %
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                      Lead Time
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                      Custo Unit.
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {data.items.map((item) => (
                    <tr key={item.id} className="hover:bg-theme-hover">
                      <td className="px-6 py-4 text-sm text-theme-muted">
                        {item.sequence}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-theme">
                          {item.childMaterial.description}
                        </div>
                        <div className="text-sm text-theme-muted">
                          Cód: {item.childMaterial.code} • {item.childMaterial.category?.name || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-theme">
                          {formatNumber(item.quantity)}
                        </span>
                        <span className="text-theme-muted ml-1">{item.unit}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-theme-secondary">
                        {item.scrapPercentage > 0 ? `${item.scrapPercentage}%` : "-"}
                      </td>
                      <td className="px-6 py-4 text-right text-theme-secondary">
                        {item.leadTimeDays > 0 ? `${item.leadTimeDays} dias` : "-"}
                      </td>
                      <td className="px-6 py-4 text-right text-theme-secondary">
                        {item.childMaterial.lastPurchasePrice
                          ? formatCurrency(item.childMaterial.lastPurchasePrice)
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingItem(item.id)}
                            className="p-1.5 text-theme-secondary hover:bg-theme-hover rounded"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Remover este componente?")) {
                                removeMutation.mutate({ id: item.id });
                              }
                            }}
                            disabled={removeMutation.isPending}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Component Modal */}
      {showAddModal && (
        <AddComponentModal
          parentMaterialId={materialId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            refetch();
          }}
        />
      )}

      {/* Cost Modal */}
      {showCostModal && (
        <CostModal
          materialId={materialId}
          onClose={() => setShowCostModal(false)}
        />
      )}

      {/* Explode Modal */}
      {showExplodeModal && (
        <ExplodeModal
          materialId={materialId}
          onClose={() => setShowExplodeModal(false)}
        />
      )}

      {/* Copy Modal */}
      {showCopyModal && (
        <CopyBomModal
          sourceMaterialId={materialId}
          onClose={() => setShowCopyModal(false)}
          onSuccess={() => {
            setShowCopyModal(false);
          }}
        />
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <EditItemModal
          itemId={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={() => {
            setEditingItem(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function AddComponentModal({
  parentMaterialId,
  onClose,
  onSuccess,
}: {
  parentMaterialId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [search, setSearch] = useState("");
  const [childMaterialId, setChildMaterialId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("UN");
  const [scrapPercentage, setScrapPercentage] = useState("0");
  const [leadTimeDays, setLeadTimeDays] = useState("0");
  const [sequence, setSequence] = useState("0");
  const [notes, setNotes] = useState("");

  const { data: materials } = trpc.materials.list.useQuery({
    search: search || undefined,
    limit: 10,
  });

  const addMutation = trpc.bom.addItem.useMutation({
    onSuccess,
  });

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-component-title"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="bg-theme-card rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h3 id="add-component-title" className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-600" />
          Adicionar Componente
        </h3>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Componente</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar material..."
                className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {materials?.materials && materials.materials.length > 0 && search && (
              <div className="mt-1 border border-theme rounded-lg max-h-40 overflow-y-auto">
                {materials.materials
                  .filter((m) => m.id !== parentMaterialId)
                  .map((mat) => (
                    <button
                      key={mat.id}
                      onClick={() => {
                        setChildMaterialId(mat.id);
                        setSearch(mat.description);
                        setUnit(mat.unit);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-theme-hover text-sm"
                    >
                      <span className="font-medium">{mat.code}</span> - {mat.description}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Quantidade</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
                step="0.0001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Unidade</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Perda %</label>
              <input
                type="number"
                value={scrapPercentage}
                onChange={(e) => setScrapPercentage(e.target.value)}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Lead Time (dias)</label>
              <input
                type="number"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Sequência</label>
              <input
                type="number"
                value={sequence}
                onChange={(e) => setSequence(e.target.value)}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {addMutation.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {addMutation.error.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover"
          >
            Cancelar
          </button>
          <button
            onClick={() =>
              addMutation.mutate({
                parentMaterialId,
                childMaterialId,
                quantity: parseFloat(quantity) || 1,
                unit,
                scrapPercentage: parseFloat(scrapPercentage) || 0,
                leadTimeDays: parseInt(leadTimeDays) || 0,
                sequence: parseInt(sequence) || 0,
                notes: notes || undefined,
              })
            }
            disabled={!childMaterialId || addMutation.isPending}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {addMutation.isPending ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditItemModal({
  itemId,
  onClose,
  onSuccess,
}: {
  itemId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  // Buscar dados do item existente para inicializar o formulário
  const { data: itemData } = trpc.bom.getItem.useQuery({ id: itemId });

  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [scrapPercentage, setScrapPercentage] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [sequence, setSequence] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Inicializar com valores do item quando carregado
  useEffect(() => {
    if (itemData && !initialized) {
      setQuantity(itemData.quantity?.toString() ?? "1");
      setUnit(itemData.unit ?? "UN");
      setScrapPercentage(itemData.scrapPercentage?.toString() ?? "0");
      setLeadTimeDays(itemData.leadTimeDays?.toString() ?? "0");
      setSequence(itemData.sequence?.toString() ?? "0");
      setInitialized(true);
    }
  }, [itemData, initialized]);

  const updateMutation = trpc.bom.updateItem.useMutation({
    onSuccess,
  });

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-component-title"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="bg-theme-card rounded-lg p-6 w-full max-w-md mx-4">
        <h3 id="edit-component-title" className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
          <Edit2 className="w-5 h-5 text-indigo-600" />
          Editar Componente
        </h3>

        <div className="space-y-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Quantidade</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
                step="0.0001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Unidade</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Perda %</label>
              <input
                type="number"
                value={scrapPercentage}
                onChange={(e) => setScrapPercentage(e.target.value)}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Lead Time</label>
              <input
                type="number"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Sequência</label>
              <input
                type="number"
                value={sequence}
                onChange={(e) => setSequence(e.target.value)}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover"
          >
            Cancelar
          </button>
          <button
            onClick={() =>
              updateMutation.mutate({
                id: itemId,
                quantity: parseFloat(quantity) || undefined,
                unit: unit || undefined,
                scrapPercentage: parseFloat(scrapPercentage),
                leadTimeDays: parseInt(leadTimeDays),
                sequence: parseInt(sequence),
              })
            }
            disabled={updateMutation.isPending}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {updateMutation.isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CostModal({
  materialId,
  onClose,
}: {
  materialId: string;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = useState("1");

  const { data, isLoading } = trpc.bom.calculateCost.useQuery({
    materialId,
    quantity: parseFloat(quantity) || 1,
  });

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cost-modal-title"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="bg-theme-card rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 id="cost-modal-title" className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-indigo-600" />
          Cálculo de Custo
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-theme-secondary mb-1">Quantidade</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-32 px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
            min="1"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="text-sm text-indigo-600">Custo Total</div>
                <div className="text-2xl font-bold text-indigo-900">
                  {formatCurrency(data.totalCost)}
                </div>
              </div>
              <div className="bg-theme-tertiary rounded-lg p-4">
                <div className="text-sm text-theme-secondary">Custo Unitário</div>
                <div className="text-2xl font-bold text-theme">
                  {formatCurrency(data.unitCost)}
                </div>
              </div>
            </div>

            <div className="border border-theme rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-theme-table">
                <thead className="bg-theme-tertiary">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-theme-muted uppercase">
                      Material
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-theme-muted uppercase">
                      Qtd
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-theme-muted uppercase">
                      Custo Unit.
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-theme-muted uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {data.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm">
                        <span className="font-medium">{item.materialCode}</span> - {item.materialDescription}
                      </td>
                      <td className="px-4 py-2 text-sm text-right">{item.quantity.toFixed(4)}</td>
                      <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.unitCost)}</td>
                      <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(item.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function ExplodeModal({
  materialId,
  onClose,
}: {
  materialId: string;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = useState("1");
  const [maxLevels, setMaxLevels] = useState("5");
  const [viewMode, setViewMode] = useState<"detailed" | "summarized">("detailed");

  const { data, isLoading } = trpc.bom.explode.useQuery({
    materialId,
    quantity: parseFloat(quantity) || 1,
    maxLevels: parseInt(maxLevels) || 5,
  });

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="explode-modal-title"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="bg-theme-card rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 id="explode-modal-title" className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
          <ChevronDown className="w-5 h-5 text-indigo-600" />
          Explosão da Estrutura
        </h3>

        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Quantidade</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-32 px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Níveis</label>
            <input
              type="number"
              value={maxLevels}
              onChange={(e) => setMaxLevels(e.target.value)}
              className="w-20 px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
              min="1"
              max="10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Visualização</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as "detailed" | "summarized")}
              className="px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="detailed">Detalhada</option>
              <option value="summarized">Resumida</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-theme-tertiary rounded-lg p-3">
                <div className="text-sm text-theme-secondary">Total de Itens</div>
                <div className="text-xl font-bold text-theme">{data.totalComponents}</div>
              </div>
              <div className="bg-theme-tertiary rounded-lg p-3">
                <div className="text-sm text-theme-secondary">Componentes Únicos</div>
                <div className="text-xl font-bold text-theme">{data.uniqueComponents}</div>
              </div>
            </div>

            <div className="border border-theme rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-theme-table">
                <thead className="bg-theme-tertiary sticky top-0">
                  <tr>
                    {viewMode === "detailed" && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-theme-muted uppercase">
                        Nível
                      </th>
                    )}
                    <th className="px-4 py-2 text-left text-xs font-medium text-theme-muted uppercase">
                      Material
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-theme-muted uppercase">
                      Qtd/Un
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-theme-muted uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {(viewMode === "detailed" ? data.detailed : data.summarized).map((item, idx) => (
                    <tr key={idx}>
                      {viewMode === "detailed" && (
                        <td className="px-4 py-2 text-sm">
                          <span className="inline-flex items-center">
                            {"→".repeat(item.level)}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-2 text-sm">
                        <span className="font-medium">{item.materialCode}</span> - {item.materialDescription}
                        {item.hasChildren && (
                          <span className="ml-2 text-xs text-indigo-600">(tem filhos)</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-right">
                        {item.quantityPerUnit.toFixed(4)} {item.unit}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-medium">
                        {item.totalQuantity.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function CopyBomModal({
  sourceMaterialId,
  onClose,
  onSuccess,
}: {
  sourceMaterialId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [search, setSearch] = useState("");
  const [targetMaterialId, setTargetMaterialId] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(false);

  const { data: materials } = trpc.materials.list.useQuery({
    search: search || undefined,
    limit: 10,
  });

  const copyMutation = trpc.bom.copyBom.useMutation({
    onSuccess: () => {
      alert(`Estrutura copiada com sucesso!`);
      onSuccess();
    },
  });

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="copy-bom-title"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="bg-theme-card rounded-lg p-6 w-full max-w-lg mx-4">
        <h3 id="copy-bom-title" className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
          <Copy className="w-5 h-5 text-indigo-600" />
          Copiar Estrutura
        </h3>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              Material de Destino
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar material..."
                className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {materials?.materials && materials.materials.length > 0 && search && (
              <div className="mt-1 border border-theme rounded-lg max-h-40 overflow-y-auto">
                {materials.materials
                  .filter((m) => m.id !== sourceMaterialId)
                  .map((mat) => (
                    <button
                      key={mat.id}
                      onClick={() => {
                        setTargetMaterialId(mat.id);
                        setSearch(mat.description);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-theme-hover text-sm"
                    >
                      <span className="font-medium">{mat.code}</span> - {mat.description}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-theme-secondary">
              Substituir estrutura existente no destino
            </span>
          </label>
        </div>

        {copyMutation.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {copyMutation.error.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover"
          >
            Cancelar
          </button>
          <button
            onClick={() =>
              copyMutation.mutate({
                sourceMaterialId,
                targetMaterialId,
                replaceExisting,
              })
            }
            disabled={!targetMaterialId || copyMutation.isPending}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {copyMutation.isPending ? "Copiando..." : "Copiar"}
          </button>
        </div>
      </div>
    </div>
  );
}
