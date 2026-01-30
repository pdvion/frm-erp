"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";

import { LinkMaterialModal } from "@/components/LinkMaterialModal";
import { CompareInvoiceModal } from "@/components/CompareInvoiceModal";
import { PageHeader } from "@/components/PageHeader";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Building2,
  Package,
  Truck,
  DollarSign,
  Link2,
  Unlink,
  RefreshCw,
  FileCheck,
  Ban,
  UserPlus,
  Wand2,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  VALIDATED: { label: "Validado", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-4 h-4" /> },
  APPROVED: { label: "Aprovado", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  REJECTED: { label: "Rejeitado", color: "bg-red-100 text-red-500", icon: <XCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelado", color: "bg-theme-tertiary text-theme-muted", icon: <XCircle className="w-4 h-4" /> },
};

const matchStatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", color: "bg-theme-tertiary text-theme-secondary", icon: <Clock className="w-4 h-4" /> },
  MATCHED: { label: "Vinculado", color: "bg-green-100 text-green-700", icon: <Link2 className="w-4 h-4" /> },
  DIVERGENT: { label: "Divergente", color: "bg-yellow-100 text-yellow-700", icon: <AlertTriangle className="w-4 h-4" /> },
  NOT_FOUND: { label: "Não encontrado", color: "bg-red-100 text-red-600", icon: <Unlink className="w-4 h-4" /> },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [linkingItem, setLinkingItem] = useState<{
    id: string;
    name: string;
    code: string;
  } | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const { data: invoice, isLoading, refetch } = trpc.receivedInvoices.byId.useQuery({ id });

  // Mutations para validação de fornecedor
  const findSupplierMutation = trpc.nfe.findOrCreateSupplier.useMutation({
    onSuccess: () => refetch(),
  });

  const autoLinkMutation = trpc.nfe.autoLinkItems.useMutation({
    onSuccess: () => refetch(),
  });

  const approveMutation = trpc.receivedInvoices.approve.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const rejectMutation = trpc.receivedInvoices.reject.useMutation({
    onSuccess: () => {
      setShowRejectModal(false);
      refetch();
    },
  });

  const generatePayablesMutation = trpc.nfe.generatePayables.useMutation({
    onSuccess: (data) => {
      alert(`${data.created} título(s) gerado(s) no valor total de R$ ${data.total.toFixed(2)}`);
      refetch();
    },
    onError: (error) => {
      alert(`Erro: ${error.message}`);
    },
  });


  if (isLoading) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-theme-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme mb-2">NFe não encontrada</h3>
          <Link href="/invoices" className="text-blue-600 hover:text-indigo-800">
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  const config = statusConfig[invoice.status];
  const canApprove = invoice.status === "PENDING" || invoice.status === "VALIDATED";
  const allItemsLinked = invoice.items.every((item) => item.materialId);

  const pendingItems = invoice.items.filter((i) => i.matchStatus === "PENDING").length;
  const matchedItems = invoice.items.filter((i) => i.matchStatus === "MATCHED").length;
  const divergentItems = invoice.items.filter((i) => i.matchStatus === "DIVERGENT").length;
  const notFoundItems = invoice.items.filter((i) => i.matchStatus === "NOT_FOUND").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`NFe ${invoice.invoiceNumber}`}
        subtitle={invoice.supplier?.companyName || "Fornecedor não identificado"}
        icon={<FileText className="w-6 h-6" />}
        backHref="/invoices"
        module="fiscal"
        actions={
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
            {config.icon}
            {config.label}
          </span>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Fornecedor */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-theme">Fornecedor</h3>
              {!invoice.supplier && canApprove && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                  Não vinculado
                </span>
              )}
            </div>
            <div className="space-y-2">
              <p className="font-medium text-theme">
                {invoice.supplier?.companyName || invoice.supplierName}
              </p>
              <p className="text-sm text-theme-muted">CNPJ: {invoice.supplierCnpj}</p>
              {invoice.supplier ? (
                <Link
                  href={`/suppliers/${invoice.supplier.id}`}
                  className="text-sm text-blue-600 hover:text-indigo-800"
                >
                  Ver cadastro →
                </Link>
              ) : canApprove && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => findSupplierMutation.mutate({ invoiceId: id, createIfNotFound: false })}
                    disabled={findSupplierMutation.isPending}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                  >
                    {findSupplierMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    Buscar
                  </button>
                  <button
                    onClick={() => findSupplierMutation.mutate({ invoiceId: id, createIfNotFound: true })}
                    disabled={findSupplierMutation.isPending}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50"
                  >
                    <UserPlus className="w-3 h-3" />
                    Criar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Dados da Nota */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-medium text-theme">Dados da Nota</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-muted">Número:</span>
                <span className="font-medium">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Série:</span>
                <span className="font-medium">{invoice.series}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Emissão:</span>
                <span className="font-medium">{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-theme-muted font-mono break-all">
                  {invoice.accessKey}
                </p>
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-medium text-theme">Valores</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-muted">Produtos:</span>
                <span className="font-medium">{formatCurrency(invoice.totalProducts)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Frete:</span>
                <span className="font-medium">{formatCurrency(invoice.freightValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">ICMS:</span>
                <span className="font-medium">{formatCurrency(invoice.icmsValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">IPI:</span>
                <span className="font-medium">{formatCurrency(invoice.ipiValue)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-theme font-medium">Total:</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(invoice.totalInvoice)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Match Status Summary */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-theme-muted" />
                <span className="font-medium">{invoice.items.length} itens</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  {matchedItems} vinculados
                </span>
                {divergentItems > 0 && (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <AlertTriangle className="w-4 h-4" />
                    {divergentItems} divergentes
                  </span>
                )}
                {notFoundItems > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <Unlink className="w-4 h-4" />
                    {notFoundItems} não encontrados
                  </span>
                )}
                {pendingItems > 0 && (
                  <span className="flex items-center gap-1 text-theme-muted">
                    <Clock className="w-4 h-4" />
                    {pendingItems} pendentes
                  </span>
                )}
              </div>
            </div>
            {canApprove && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => autoLinkMutation.mutate({ invoiceId: id })}
                  disabled={autoLinkMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                >
                  {autoLinkMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  Auto-vincular
                </button>
                {invoice.supplierId && (
                  <button
                    onClick={() => setShowCompareModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
                  >
                    <FileCheck className="w-4 h-4" />
                    Conferir com Pedido
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-theme">
            <h3 className="font-medium text-theme">Itens da Nota</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-theme-table">
              <thead className="bg-theme-tertiary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                    Produto NFe
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                    Material Vinculado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                    Qtd
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                    Preço Unit.
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-table">
                {invoice.items.map((item) => {
                  const matchConfig = matchStatusConfig[item.matchStatus];
                  return (
                    <tr key={item.id} className="hover:bg-theme-hover">
                      <td className="px-4 py-3 text-sm text-theme-muted">
                        {item.itemNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-theme">{item.productName}</div>
                        <div className="text-sm text-theme-muted">
                          Cód: {item.productCode} | NCM: {item.ncm || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {item.material ? (
                          <div>
                            <div className="font-medium text-theme">
                              {item.material.description}
                            </div>
                            <div className="text-sm text-theme-muted">
                              Cód: {item.material.code} | {item.material.unit}
                            </div>
                          </div>
                        ) : (
                          <span className="text-theme-muted italic">Não vinculado</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium">{item.quantity}</span>
                        <span className="text-theme-muted ml-1">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(item.totalPrice)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${matchConfig.color}`}>
                            {matchConfig.icon}
                            {matchConfig.label}
                          </span>
                          {item.divergenceNote && (
                            <span className="text-xs text-yellow-600 max-w-[200px] truncate" title={item.divergenceNote}>
                              {item.divergenceNote}
                            </span>
                          )}
                          {canApprove && !item.materialId && (
                            <button
                              onClick={() => setLinkingItem({
                                id: item.id,
                                name: item.productName,
                                code: item.productCode,
                              })}
                              className="mt-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              Vincular
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        {canApprove && (
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-theme mb-1">Ações</h3>
                <p className="text-sm text-theme-muted">
                  {allItemsLinked
                    ? "Todos os itens estão vinculados. Você pode aprovar a entrada."
                    : `${invoice.items.length - matchedItems} item(ns) precisam ser vinculados antes de aprovar.`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                >
                  <Ban className="w-4 h-4" />
                  Rejeitar
                </button>
                <button
                  onClick={() => approveMutation.mutate({ id })}
                  disabled={!allItemsLinked || approveMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileCheck className="w-4 h-4" />
                  )}
                  Aprovar e Dar Entrada
                </button>
              </div>
            </div>

            {approveMutation.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{approveMutation.error.message}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Approved Info */}
        {invoice.status === "APPROVED" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="font-medium text-green-900">NFe Aprovada</h3>
              </div>
              <button
                onClick={() => generatePayablesMutation.mutate({ invoiceId: id })}
                disabled={generatePayablesMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {generatePayablesMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <DollarSign className="w-4 h-4" />
                )}
                Gerar Títulos a Pagar
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700">Aprovado em:</span>
                <span className="ml-2 font-medium">{formatDateTime(invoice.approvedAt)}</span>
              </div>
              <div>
                <span className="text-green-700">Recebido em:</span>
                <span className="ml-2 font-medium">{formatDateTime(invoice.receivedAt)}</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-green-700">
              ✓ Entrada no estoque realizada automaticamente
            </p>
            {generatePayablesMutation.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{generatePayablesMutation.error.message}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rejected Info */}
        {invoice.status === "REJECTED" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
              <h3 className="font-medium text-red-900">NFe Rejeitada</h3>
            </div>
            <div className="text-sm">
              <div className="mb-2">
                <span className="text-red-700">Rejeitado em:</span>
                <span className="ml-2 font-medium">{formatDateTime(invoice.rejectedAt)}</span>
              </div>
              {invoice.rejectionReason && (
                <div>
                  <span className="text-red-700">Motivo:</span>
                  <p className="mt-1 p-3 bg-theme-card rounded border border-red-200">
                    {invoice.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Purchase Order Link */}
        {invoice.purchaseOrder && (
          <div className="mt-6 bg-theme-card rounded-lg border border-theme p-6">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="w-5 h-5 text-teal-600" />
              <h3 className="font-medium text-theme">Pedido de Compra Vinculado</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-theme">
                  Pedido #{invoice.purchaseOrder.code}
                </p>
                <p className="text-sm text-theme-muted">
                  {invoice.purchaseOrder.items?.length || 0} itens
                </p>
              </div>
              <Link
                href={`/purchase-orders/${invoice.purchaseOrder.id}`}
                className="px-4 py-2 text-sm text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg"
              >
                Ver pedido →
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Link Material Modal */}
      {linkingItem && (
        <LinkMaterialModal
          itemId={linkingItem.id}
          itemName={linkingItem.name}
          itemCode={linkingItem.code}
          onClose={() => setLinkingItem(null)}
          onLinked={() => refetch()}
        />
      )}

      {/* Compare Invoice Modal */}
      {showCompareModal && invoice && (
        <CompareInvoiceModal
          invoiceId={id}
          invoiceNumber={invoice.invoiceNumber}
          onClose={() => setShowCompareModal(false)}
          onCompared={() => refetch()}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-nfe-title"
          onKeyDown={(e) => e.key === "Escape" && setShowRejectModal(false)}
        >
          <div className="bg-theme-card rounded-lg p-6 w-full max-w-md mx-4">
            <h3 id="reject-nfe-title" className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-600" />
              Rejeitar NFe
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Motivo da rejeição *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Descreva o motivo da rejeição..."
              />
            </div>

            {rejectMutation.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {rejectMutation.error.message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="flex-1 px-4 py-2 border border-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover"
              >
                Cancelar
              </button>
              <button
                onClick={() => rejectMutation.mutate({ id, reason: rejectReason })}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {rejectMutation.isPending ? "Rejeitando..." : "Confirmar Rejeição"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
