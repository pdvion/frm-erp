"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  X,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Package,
  FileText,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-theme-card rounded-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-theme">
                Conferir NFe {invoiceNumber}
              </h2>
              <p className="text-sm text-theme-muted">
                Compare com o pedido de compra
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-theme-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
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
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
                            {po.itemsCount} itens • {formatCurrency(po.totalValue)}
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
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-600">OK</p>
                      <p className="text-2xl font-bold text-green-700">
                        {comparison.summary.okItems}
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <p className="text-sm text-yellow-600">Divergentes</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {comparison.summary.divergentItems}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600">Diferença Valor</p>
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
                    <table className="min-w-full divide-y divide-gray-200">
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
                      <tbody className="divide-y divide-gray-200">
                        {comparison.divergences.map((item) => (
                          <tr
                            key={item.invoiceItemId}
                            className={
                              item.status !== "OK" ? "bg-yellow-50" : ""
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
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <ul className="space-y-2">
                          {comparison.missingInInvoice.map((item) => (
                            <li key={item.purchaseOrderItemId} className="text-sm">
                              <span className="font-medium">
                                {item.materialDescription}
                              </span>
                              <span className="text-theme-muted ml-2">
                                ({item.quantity} x {formatCurrency(item.unitPrice)})
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

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-theme-secondary flex items-center justify-between">
          <div>
            {selectedPO && (
              <button
                onClick={() => setSelectedPO(null)}
                className="text-sm text-theme-secondary hover:text-theme"
              >
                ← Voltar para seleção
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-theme-secondary hover:bg-theme-tertiary rounded-lg transition-colors"
            >
              Cancelar
            </button>
            {selectedPO && comparison && (
              <button
                onClick={handleApplyAll}
                disabled={applyMutation.isPending || linkMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {(applyMutation.isPending || linkMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Confirmar Conferência
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
