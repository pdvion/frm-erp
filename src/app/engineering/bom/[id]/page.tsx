"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatNumber } from "@/lib/formatters";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { useRouteBreadcrumbs } from "@/hooks/useRouteBreadcrumbs";
import {
  Layers,
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
  const breadcrumbs = useRouteBreadcrumbs();

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
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estrutura de Produto"
        subtitle={data?.parentMaterial ? `${data.parentMaterial.code} - ${data.parentMaterial.description}` : undefined}
        icon={<Layers className="w-6 h-6" />}
        backHref="/engineering/bom"
        module="engineering"
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCostModal(true)}
              leftIcon={<Calculator className="w-4 h-4" />}
            >
              Custo
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowExplodeModal(true)}
              leftIcon={<ChevronDown className="w-4 h-4" />}
            >
              Explodir
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCopyModal(true)}
              leftIcon={<Copy className="w-4 h-4" />}
            >
              Copiar
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Adicionar
            </Button>
          </div>
        }
      />

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
              <Package className="w-12 h-12 text-theme-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-theme mb-2">
                Nenhum componente cadastrado
              </h3>
              <p className="text-theme-muted mb-4">
                Adicione componentes para criar a estrutura do produto.
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Adicionar Componente
              </Button>
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
                        {Number(item.scrapPercentage) > 0 ? `${Number(item.scrapPercentage)}%` : "-"}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingItem(item.id)}
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Remover este componente?")) {
                                removeMutation.mutate({ id: item.id });
                              }
                            }}
                            disabled={removeMutation.isPending}
                            className="text-red-600 hover:bg-red-50"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
      <AddComponentModal
        isOpen={showAddModal}
        parentMaterialId={materialId}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          refetch();
        }}
      />

      {/* Cost Modal */}
      <CostModal
        isOpen={showCostModal}
        materialId={materialId}
        onClose={() => setShowCostModal(false)}
      />

      {/* Explode Modal */}
      <ExplodeModal
        isOpen={showExplodeModal}
        materialId={materialId}
        onClose={() => setShowExplodeModal(false)}
      />

      {/* Copy Modal */}
      <CopyBomModal
        isOpen={showCopyModal}
        sourceMaterialId={materialId}
        onClose={() => setShowCopyModal(false)}
        onSuccess={() => {
          setShowCopyModal(false);
        }}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        isOpen={!!editingItem}
        itemId={editingItem ?? ""}
        onClose={() => setEditingItem(null)}
        onSuccess={() => {
          setEditingItem(null);
          refetch();
        }}
      />
    </div>
  );
}

function AddComponentModal({
  isOpen,
  parentMaterialId,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adicionar Componente"
      size="md"
    >
      <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Componente</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted z-10" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar material..."
                className="pl-10"
              />
            </div>
            {materials?.materials && materials.materials.length > 0 && search && (
              <div className="mt-1 border border-theme rounded-lg max-h-40 overflow-y-auto">
                {materials.materials
                  .filter((m) => m.id !== parentMaterialId)
                  .map((mat) => (
                    <Button
                      key={mat.id}
                      variant="ghost"
                      onClick={() => {
                        setChildMaterialId(mat.id);
                        setSearch(mat.description);
                        setUnit(mat.unit);
                      }}
                      className="w-full justify-start text-left text-sm"
                    >
                      <span className="font-medium">{mat.code}</span> - {mat.description}
                    </Button>
                  ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantidade"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              step="0.0001"
            />
            <Input
              label="Unidade"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Perda %"
              type="number"
              value={scrapPercentage}
              onChange={(e) => setScrapPercentage(e.target.value)}
              min="0"
              max="100"
            />
            <Input
              label="Lead Time (dias)"
              type="number"
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(e.target.value)}
              min="0"
            />
            <Input
              label="Sequência"
              type="number"
              value={sequence}
              onChange={(e) => setSequence(e.target.value)}
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Observações</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {addMutation.error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {addMutation.error.message}
            </div>
          )}

          <ModalFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
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
              isLoading={addMutation.isPending}
            >
              Adicionar
            </Button>
          </ModalFooter>
        </div>
    </Modal>
  );
}

function EditItemModal({
  isOpen,
  itemId,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Componente"
      size="sm"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantidade"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              step="0.0001"
            />
            <Input
              label="Unidade"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Perda %"
            type="number"
            value={scrapPercentage}
            onChange={(e) => setScrapPercentage(e.target.value)}
            min="0"
            max="100"
          />
          <Input
            label="Lead Time"
            type="number"
            value={leadTimeDays}
            onChange={(e) => setLeadTimeDays(e.target.value)}
            min="0"
          />
          <Input
            label="Sequência"
            type="number"
            value={sequence}
            onChange={(e) => setSequence(e.target.value)}
            min="0"
          />
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
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
            isLoading={updateMutation.isPending}
          >
            Salvar
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}

function CostModal({
  isOpen,
  materialId,
  onClose,
}: {
  isOpen: boolean;
  materialId: string;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = useState("1");

  const { data, isLoading } = trpc.bom.calculateCost.useQuery({
    materialId,
    quantity: parseFloat(quantity) || 1,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cálculo de Custo"
      size="lg"
    >
      <div className="space-y-4">
        <div className="w-32">
          <Input
            label="Quantidade"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="text-sm text-blue-600">Custo Total</div>
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

        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}

function ExplodeModal({
  isOpen,
  materialId,
  onClose,
}: {
  isOpen: boolean;
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Explosão da Estrutura"
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="w-32">
            <Input
              label="Quantidade"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
            />
          </div>
          <div className="w-20">
            <Input
              label="Níveis"
              type="number"
              value={maxLevels}
              onChange={(e) => setMaxLevels(e.target.value)}
              min="1"
              max="10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Visualização</label>
            <Select
              value={viewMode}
              onChange={(value) => setViewMode(value as "detailed" | "summarized")}
              options={[
                { value: "detailed", label: "Detalhada" },
                { value: "summarized", label: "Resumida" },
              ]}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
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
                          <span className="ml-2 text-xs text-blue-600">(tem filhos)</span>
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

        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}

function CopyBomModal({
  isOpen,
  sourceMaterialId,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
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
      toast.success("Estrutura copiada com sucesso!");
      onSuccess();
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Copiar Estrutura"
      size="md"
    >
      <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              Material de Destino
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted z-10" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar material..."
                className="pl-10"
              />
            </div>
            {materials?.materials && materials.materials.length > 0 && search && (
              <div className="mt-1 border border-theme rounded-lg max-h-40 overflow-y-auto">
                {materials.materials
                  .filter((m) => m.id !== sourceMaterialId)
                  .map((mat) => (
                    <Button
                      key={mat.id}
                      variant="ghost"
                      onClick={() => {
                        setTargetMaterialId(mat.id);
                        setSearch(mat.description);
                      }}
                      className="w-full justify-start text-left text-sm"
                    >
                      <span className="font-medium">{mat.code}</span> - {mat.description}
                    </Button>
                  ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2">
            <Input
              type="checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              className="rounded border-theme text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-theme-secondary">
              Substituir estrutura existente no destino
            </span>
          </label>

          {copyMutation.error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {copyMutation.error.message}
            </div>
          )}

          <ModalFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                copyMutation.mutate({
                  sourceMaterialId,
                  targetMaterialId,
                  replaceExisting,
                })
              }
              disabled={!targetMaterialId || copyMutation.isPending}
              isLoading={copyMutation.isPending}
            >
              Copiar
            </Button>
          </ModalFooter>
        </div>
    </Modal>
  );
}
