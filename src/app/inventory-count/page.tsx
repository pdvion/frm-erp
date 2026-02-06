"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { ClipboardList, Search, Check, Save } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";

interface CountItem {
  inventoryId: string;
  materialId: string;
  materialCode: number;
  materialDescription: string;
  systemQty: number;
  countedQty: number | null;
  difference: number;
  status: "pending" | "counted" | "adjusted";
}

export default function InventoryCountPage() {
  const [search, setSearch] = useState("");
  const [countItems, setCountItems] = useState<CountItem[]>([]);
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);

  const { data: inventoryData, isLoading } = trpc.inventory.list.useQuery({
    search: search || undefined,
    limit: 100,
  });

  const adjustmentMutation = trpc.inventory.createMovement.useMutation({
    onSuccess: () => {
      // Marcar item como ajustado
    },
  });

  const startCount = () => {
    if (!inventoryData?.inventory) return;
    
    const items: CountItem[] = inventoryData.inventory.map((inv) => ({
      inventoryId: inv.id,
      materialId: inv.materialId,
      materialCode: inv.material.code,
      materialDescription: inv.material.description,
      systemQty: inv.quantity,
      countedQty: null,
      difference: 0,
      status: "pending" as const,
    }));
    
    setCountItems(items);
  };

  const updateCount = (inventoryId: string, countedQty: number) => {
    setCountItems((items) =>
      items.map((item) =>
        item.inventoryId === inventoryId
          ? {
            ...item,
            countedQty,
            difference: countedQty - item.systemQty,
            status: "counted" as const,
          }
          : item
      )
    );
  };

  const applyAdjustment = (item: CountItem) => {
    if (item.countedQty === null || item.difference === 0) return;

    adjustmentMutation.mutate({
      materialId: item.materialId,
      movementType: "ADJUSTMENT",
      quantity: Math.abs(item.difference),
      notes: `Ajuste de inventário - Contagem física: ${item.countedQty}, Sistema: ${item.systemQty}`,
    });

    setCountItems((items) =>
      items.map((i) =>
        i.inventoryId === item.inventoryId ? { ...i, status: "adjusted" as const } : i
      )
    );
  };

  const filteredItems = showOnlyDifferences
    ? countItems.filter((item) => item.difference !== 0 && item.status === "counted")
    : countItems;

  const countedCount = countItems.filter((i) => i.status !== "pending").length;
  const withDifference = countItems.filter((i) => i.difference !== 0 && i.status === "counted").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contagem de Estoque"
        module="INVENTORY"
        icon={<ClipboardList className="w-6 h-6" />}
        breadcrumbs={[
          { label: "Estoque", href: "/inventory" },
          { label: "Contagem" },
        ]}
      />

      {countItems.length === 0 ? (
        <>
          {/* Busca e Início */}
          <div className="bg-theme-card border border-theme rounded-lg p-6">
            <h3 className="font-semibold text-theme mb-4">Iniciar Nova Contagem</h3>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar por material (opcional)..."
                  className="w-full pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-theme-muted">
                  {isLoading ? "Carregando..." : `${inventoryData?.inventory.length || 0} itens encontrados`}
                </p>
                <Button
                  onClick={startCount}
                  disabled={isLoading || !inventoryData?.inventory.length}
                  leftIcon={<ClipboardList className="w-4 h-4" />}
                >
                  Iniciar Contagem
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de Estoque */}
          <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-theme-table-header border-b border-theme">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Material</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Qtd Sistema</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-table">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-theme-muted">Carregando...</td>
                  </tr>
                ) : inventoryData?.inventory.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-theme-muted">Nenhum item em estoque</td>
                  </tr>
                ) : (
                  inventoryData?.inventory.map((inv) => (
                    <tr key={inv.id} className="hover:bg-theme-table-hover">
                      <td className="px-4 py-3 text-sm font-mono text-theme">{inv.material.code}</td>
                      <td className="px-4 py-3 text-sm text-theme">{inv.material.description}</td>
                      <td className="px-4 py-3 text-sm text-right text-theme">{inv.quantity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          {/* Resumo da Contagem */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-theme-card border border-theme rounded-lg p-4">
              <p className="text-sm text-theme-muted">Total de Itens</p>
              <p className="text-2xl font-bold text-theme">{countItems.length}</p>
            </div>
            <div className="bg-theme-card border border-theme rounded-lg p-4">
              <p className="text-sm text-theme-muted">Contados</p>
              <p className="text-2xl font-bold text-green-600">{countedCount}</p>
            </div>
            <div className="bg-theme-card border border-theme rounded-lg p-4">
              <p className="text-sm text-theme-muted">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">{countItems.length - countedCount}</p>
            </div>
            <div className="bg-theme-card border border-theme rounded-lg p-4">
              <p className="text-sm text-theme-muted">Com Diferença</p>
              <p className="text-2xl font-bold text-red-600">{withDifference}</p>
            </div>
          </div>

          {/* Filtro */}
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <label className="flex items-center gap-2 text-sm text-theme cursor-pointer">
              <Input
                type="checkbox"
                checked={showOnlyDifferences}
                onChange={(e) => setShowOnlyDifferences(e.target.checked)}
                className="rounded"
              />
              Mostrar apenas itens com diferença
            </label>
          </div>

          {/* Tabela de Contagem */}
          <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-theme-table-header border-b border-theme">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Material</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Sistema</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Contagem</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Diferença</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-table">
                {filteredItems.map((item) => (
                  <tr key={item.inventoryId} className="hover:bg-theme-table-hover">
                    <td className="px-4 py-3 text-sm font-mono text-theme">{item.materialCode}</td>
                    <td className="px-4 py-3 text-sm text-theme">{item.materialDescription}</td>
                    <td className="px-4 py-3 text-sm text-right text-theme">{item.systemQty}</td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min={0}
                        value={item.countedQty ?? ""}
                        onChange={(e) => updateCount(item.inventoryId, Number(e.target.value))}
                        disabled={item.status === "adjusted"}
                        className="w-24 mx-auto block px-3 py-1.5 text-center bg-theme-input border border-theme-input rounded-lg text-theme disabled:opacity-50"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.countedQty !== null && (
                        <span className={`font-medium ${
                          item.difference === 0 ? "text-green-600" :
                            item.difference > 0 ? "text-blue-600" : "text-red-600"
                        }`}>
                          {item.difference > 0 ? "+" : ""}{item.difference}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.status === "adjusted" ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <Check className="w-4 h-4" /> Ajustado
                        </span>
                      ) : item.difference !== 0 && item.countedQty !== null ? (
                        <Button
                          size="sm"
                          onClick={() => applyAdjustment(item)}
                          isLoading={adjustmentMutation.isPending}
                          leftIcon={<Save className="w-3 h-3" />}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Ajustar
                        </Button>
                      ) : item.countedQty !== null ? (
                        <span className="text-green-600"><Check className="w-4 h-4 inline" /></span>
                      ) : (
                        <span className="text-theme-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ações */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCountItems([])}
            >
              Cancelar Contagem
            </Button>
            <Link href="/inventory">
              <Button>Finalizar e Voltar</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
