"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal, ModalFooter } from "@/components/ui/Modal";

interface CompareInvoiceModalProps {
  invoiceId: string;
  invoiceNumber: number;
  onClose: () => void;
  onCompared: () => void;
}

export function CompareInvoiceModal({
  invoiceId,
  invoiceNumber,
  onClose,
  onCompared,
}: CompareInvoiceModalProps) {
  const [selectedPO, setSelectedPO] = useState<string | null>(null);

  // Buscar pedidos de compra disponíveis
  const { data: purchaseOrders, isLoading: loadingPOs } =
    trpc.nfe.findPurchaseOrders.useQuery({ invoiceId });

  // Comparar com pedido selecionado
  const { data: comparison, isLoading: loadingComparison } =
    trpc.nfe.compareWithPurchaseOrder.useQuery(
      { invoiceId, purchaseOrderId: selectedPO! },
      { enabled: !!selectedPO }
    );

  // Aplicar divergências
  const applyMutation = trpc.nfe.applyDivergences.useMutation({
    onSuccess: () => {
      onCompared();
      onClose();
    },
  });

  // Vincular NFe ao pedido
  const linkMutation = trpc.nfe.linkToPurchaseOrder.useMutation();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return "-";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const handleApplyAll = async () => {
    if (!comparison) return;

    // Vincular NFe ao pedido
    if (selectedPO) {
      await linkMutation.mutateAsync({
        invoiceId,
        purchaseOrderId: selectedPO,
      });
    }

    // Aplicar status aos itens
    const items = comparison.divergences.map((d) => ({
      itemId: d.invoiceItemId,
      status: d.status === "OK" ? "MATCHED" as const : "DIVERGENT" as const,
      divergenceNote:
        d.status !== "OK"
          ? `Qtd: ${d.invoiceQty} vs ${d.purchaseOrderQty || 0} | Preço: ${formatCurrency(d.invoicePrice)} vs ${formatCurrency(d.purchaseOrderPrice || 0)}`
          : undefined,
    }));

    await applyMutation.mutateAsync({ invoiceId, items });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OK":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "QTY_DIVERGENT":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "PRICE_DIVERGENT":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case "BOTH_DIVERGENT":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "NOT_IN_PO":
        return <XCircle className="w-4 h-4 text-theme-muted" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "OK":
        return "OK";
      case "QTY_DIVERGENT":
        return "Qtd divergente";
      case "PRICE_DIVERGENT":
        return "Preço divergente";
      case "BOTH_DIVERGENT":
        return "Qtd e preço divergentes";
      case "NOT_IN_PO":
        return "Não está no pedido";
      default:
        return status;
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Conferir NFe ${invoiceNumber}`}
      description="Compare com o pedido de compra"
      size="xl"
    >
        <div>
          {/* Seleção de Pedido */}
          {!selectedPO && (
            <div className="p-6">
              <h3 className="font-medium text-theme mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-theme-muted" />
                Selecione o Pedido de Compra
              </h3>

              {loadingPOs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-theme-muted" />
                </div>
              ) : purchaseOrders?.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-theme-muted mx-auto mb-3" />
                  <p className="text-theme-muted">
                    Nenhum pedido de compra encontrado para este fornecedor
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {purchaseOrders?.map((po) => (
                    <button
                      key={po.id}
                      onClick={() => setSelectedPO(po.id)}
                      className="w-full flex items-center justify-between p-4 border border-theme rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-theme-tertiary rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-theme-muted" />
                        </div>
                        <div>
                          <p className="font-medium text-theme">
                            Pedido #{po.code}
                          </p>
                          <p className="text-sm text-theme-muted">
                            {po.itemsCount} itens • {formatCurrency(Number(po.totalValue))}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-theme-muted" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comparação */}
          {selectedPO && (
            <div className="p-6">
              {loadingComparison ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-theme-muted" />
                </div>
              ) : comparison ? (
                <>
                  {/* Resumo */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-theme-secondary rounded-lg p-4">
                      <p className="text-sm text-theme-muted">Total Itens</p>
                      <p className="text-2xl font-bold text-theme">
                        {comparison.summary.totalItems}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <p className="text-sm text-green-600 dark:text-green-400">OK</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {comparison.summary.okItems}
                      </p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">Divergentes</p>
                      <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                        {comparison.summary.divergentItems}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <p className="text-sm text-blue-600 dark:text-blue-400">Diferença Valor</p>
                      <p className={`text-xl font-bold ${
                        comparison.summary.totalValueDivergence > 0
                          ? "text-red-600"
                          : comparison.summary.totalValueDivergence < 0
                            ? "text-green-600"
                            : "text-theme-secondary"
                      }`}>
                        {formatCurrency(comparison.summary.totalValueDivergence)}
                      </p>
                    </div>
                  </div>

                  {/* Tabela de Comparação */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-theme-table">
                      <thead className="bg-theme-secondary">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                            Material
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                            Qtd NFe
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                            Qtd Pedido
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                            Preço NFe
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                            Preço Pedido
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme-table">
                        {comparison.divergences.map((item) => (
                          <tr
                            key={item.invoiceItemId}
                            className={
                              item.status !== "OK" ? "bg-yellow-50 dark:bg-yellow-900/20" : ""
                            }
                          >
                            <td className="px-4 py-3">
                              <p className="font-medium text-theme text-sm">
                                {item.materialDescription}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-medium">
                                {item.invoiceQty}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-medium">
                                  {item.purchaseOrderQty ?? "-"}
                                </span>
                                {item.qtyDivergence !== null && item.qtyDivergence !== 0 && (
                                  <span className={`text-xs flex items-center ${
                                    item.qtyDivergence > 0 ? "text-red-600" : "text-green-600"
                                  }`}>
                                    {item.qtyDivergence > 0 ? (
                                      <TrendingUp className="w-3 h-3" />
                                    ) : item.qtyDivergence < 0 ? (
                                      <TrendingDown className="w-3 h-3" />
                                    ) : (
                                      <Minus className="w-3 h-3" />
                                    )}
                                    {formatPercent(item.qtyDivergencePercent)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-medium">
                                {formatCurrency(item.invoicePrice)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-medium">
                                  {item.purchaseOrderPrice !== null
                                    ? formatCurrency(item.purchaseOrderPrice)
                                    : "-"}
                                </span>
                                {item.priceDivergence !== null && Math.abs(item.priceDivergencePercent || 0) > 1 && (
                                  <span className={`text-xs flex items-center ${
                                    item.priceDivergence > 0 ? "text-red-600" : "text-green-600"
                                  }`}>
                                    {item.priceDivergence > 0 ? (
                                      <TrendingUp className="w-3 h-3" />
                                    ) : (
                                      <TrendingDown className="w-3 h-3" />
                                    )}
                                    {formatPercent(item.priceDivergencePercent)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {getStatusIcon(item.status)}
                                <span className="text-xs">
                                  {getStatusLabel(item.status)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Itens faltantes no pedido */}
                  {comparison.missingInInvoice.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-theme mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        Itens do pedido não encontrados na NFe
                      </h4>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <ul className="space-y-2">
                          {comparison.missingInInvoice.map((item) => (
                            <li key={item.purchaseOrderItemId} className="text-sm">
                              <span className="font-medium">
                                {item.materialDescription}
                              </span>
                              <span className="text-theme-muted ml-2">
                                ({Number(item.quantity)} x {formatCurrency(Number(item.unitPrice))})
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>

        <ModalFooter>
          <div className="flex items-center justify-between w-full">
            <div>
              {selectedPO && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPO(null)}
                >
                  ← Voltar para seleção
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={onClose}
              >
                Cancelar
              </Button>
              {selectedPO && comparison && (
                <Button
                  variant="primary"
                  onClick={handleApplyAll}
                  disabled={applyMutation.isPending || linkMutation.isPending}
                  isLoading={applyMutation.isPending || linkMutation.isPending}
                  leftIcon={<CheckCircle className="w-4 h-4" />}
                >
                  Confirmar Conferência
                </Button>
              )}
            </div>
          </div>
        </ModalFooter>
    </Modal>
  );
}
