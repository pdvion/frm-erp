"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import {
  ArrowLeft,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
  Package,
  Building2,
  Calendar,
  Hash,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { SupplierReturnStatus, ReturnReason } from "@prisma/client";

const statusConfig: Record<SupplierReturnStatus, { label: string; color: string }> = {
  DRAFT: { label: "Rascunho", color: "bg-theme-tertiary text-theme" },
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "Aprovada", color: "bg-blue-100 text-blue-800" },
  INVOICED: { label: "Faturada", color: "bg-purple-100 text-purple-800" },
  COMPLETED: { label: "Concluída", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-800" },
};

const reasonLabels: Record<ReturnReason, string> = {
  QUALITY_ISSUE: "Problema de Qualidade",
  WRONG_PRODUCT: "Produto Errado",
  WRONG_QUANTITY: "Quantidade Errada",
  DAMAGED: "Avariado/Danificado",
  EXPIRED: "Vencido",
  NOT_ORDERED: "Não Solicitado",
  PRICE_DIFFERENCE: "Diferença de Preço",
  OTHER: "Outro Motivo",
};

export default function SupplierReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: supplierReturn, isLoading, error } = trpc.supplierReturns.getById.useQuery({ id });
  const utils = trpc.useUtils();

  const submitMutation = trpc.supplierReturns.submit.useMutation({
    onSuccess: () => utils.supplierReturns.getById.invalidate({ id }),
  });

  const approveMutation = trpc.supplierReturns.approve.useMutation({
    onSuccess: () => utils.supplierReturns.getById.invalidate({ id }),
  });

  const completeMutation = trpc.supplierReturns.complete.useMutation({
    onSuccess: () => utils.supplierReturns.getById.invalidate({ id }),
  });

  const cancelMutation = trpc.supplierReturns.cancel.useMutation({
    onSuccess: () => utils.supplierReturns.getById.invalidate({ id }),
  });

  const handleSubmit = async () => {
    if (confirm("Enviar devolução para aprovação?")) {
      await submitMutation.mutateAsync({ id });
    }
  };

  const handleApprove = async () => {
    if (confirm("Aprovar esta devolução? O estoque será baixado automaticamente.")) {
      await approveMutation.mutateAsync({ id });
    }
  };

  const handleComplete = async () => {
    if (confirm("Concluir esta devolução? Um crédito será gerado no contas a pagar.")) {
      await completeMutation.mutateAsync({ id });
    }
  };

  const handleCancel = async () => {
    const reason = prompt("Informe o motivo do cancelamento:");
    if (reason) {
      await cancelMutation.mutateAsync({ id, reason });
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !supplierReturn) {
    return (
      <ProtectedRoute>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-theme-muted">Devolução não encontrada</p>
          <Link href="/supplier-returns" className="text-indigo-600 hover:underline mt-2 inline-block">
            Voltar para lista
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  const isPending = submitMutation.isPending || approveMutation.isPending || completeMutation.isPending || cancelMutation.isPending;

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <PageHeader
          title={`Devolução #${supplierReturn.returnNumber}`}
          subtitle={supplierReturn.supplier.companyName}
          icon={<RotateCcw className="w-6 h-6" />}
          backHref="/supplier-returns"
          module="inventory"
          actions={
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[supplierReturn.status].color}`}>
                {statusConfig[supplierReturn.status].label}
              </span>
              {supplierReturn.status === "DRAFT" && (
                <>
                  <Link
                    href={`/supplier-returns/${id}/edit`}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-theme rounded-lg hover:bg-theme-hover"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Link>
                  <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    Enviar para Aprovação
                  </button>
                </>
              )}
              {supplierReturn.status === "PENDING" && (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprovar
                  </button>
                </>
              )}
              {supplierReturn.status === "APPROVED" && (
                <Link
                  href={`/supplier-returns/${id}/invoice`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <FileText className="w-4 h-4" />
                  Registrar NFe Devolução
              </Link>
            )}
            {supplierReturn.status === "INVOICED" && (
              <button
                onClick={handleComplete}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Concluir
              </button>
            )}
            </div>
          }
        />

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-theme-card rounded-xl border border-theme p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Fornecedor</p>
                <p className="font-medium text-theme">{supplierReturn.supplier.companyName}</p>
                <p className="text-xs text-theme-muted">{supplierReturn.supplier.cnpj}</p>
              </div>
            </div>
          </div>

          <div className="bg-theme-card rounded-xl border border-theme p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Data</p>
                <p className="font-medium text-theme">{formatDate(supplierReturn.returnDate)}</p>
              </div>
            </div>
          </div>

          <div className="bg-theme-card rounded-xl border border-theme p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Hash className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">NFe Origem</p>
                {supplierReturn.receivedInvoice ? (
                  <p className="font-medium text-theme">
                    NF {supplierReturn.receivedInvoice.invoiceNumber}/{supplierReturn.receivedInvoice.series}
                  </p>
                ) : (
                  <p className="text-theme-muted">-</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-theme-card rounded-xl border border-theme p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Package className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-theme-muted">Valor Total</p>
                <p className="font-bold text-lg text-theme">{formatCurrency(supplierReturn.totalValue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* NFe Devolução */}
        {supplierReturn.returnInvoiceNumber && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">NFe de Devolução Emitida</p>
                <p className="text-sm text-purple-700">
                  Número: {supplierReturn.returnInvoiceNumber}
                  {supplierReturn.returnInvoiceKey && (
                    <span className="ml-2">| Chave: {supplierReturn.returnInvoiceKey}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Info */}
        {supplierReturn.status === "CANCELLED" && supplierReturn.cancellationReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Devolução Cancelada</p>
                <p className="text-sm text-red-700">Motivo: {supplierReturn.cancellationReason}</p>
                {supplierReturn.cancelledAt && (
                  <p className="text-xs text-red-600 mt-1">
                    Cancelada em: {formatDate(supplierReturn.cancelledAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-theme-card rounded-xl border border-theme overflow-hidden">
          <div className="px-6 py-4 border-b border-theme">
            <h2 className="text-lg font-semibold text-theme">Itens da Devolução</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-theme-hover">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">Material</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">Qtd</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-theme-muted">Preço Unit.</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-theme-muted">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">Motivo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">Local</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {supplierReturn.items.map((item) => (
                  <tr key={item.id} className="hover:bg-theme-hover">
                    <td className="px-4 py-3">
                      <div className="font-medium text-theme">
                        {item.material.code} - {item.material.description}
                      </div>
                      <div className="text-xs text-theme-muted">{item.material.unit}</div>
                    </td>
                    <td className="px-4 py-3 text-center text-theme">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-theme">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-medium text-theme">{formatCurrency(item.totalPrice)}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-theme">{reasonLabels[item.reason]}</span>
                      {item.reasonNotes && (
                        <p className="text-xs text-theme-muted mt-1">{item.reasonNotes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-theme-secondary">
                      {item.stockLocation?.name || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-theme-hover">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right font-medium text-theme">Total:</td>
                  <td className="px-4 py-3 text-right font-bold text-lg text-theme">
                    {formatCurrency(supplierReturn.totalValue)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Notes */}
        {supplierReturn.notes && (
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h2 className="text-lg font-semibold text-theme mb-2">Observações</h2>
            <p className="text-theme-secondary whitespace-pre-wrap">{supplierReturn.notes}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-theme-card rounded-xl border border-theme p-6">
          <h2 className="text-lg font-semibold text-theme mb-4">Histórico</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-theme-tertiary"></div>
              <div>
                <p className="text-sm text-theme">Devolução criada</p>
                <p className="text-xs text-theme-muted">{formatDate(supplierReturn.createdAt)}</p>
              </div>
            </div>
            {supplierReturn.approvedAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                <div>
                  <p className="text-sm text-theme">Aprovada</p>
                  <p className="text-xs text-theme-muted">{formatDate(supplierReturn.approvedAt)}</p>
                </div>
              </div>
            )}
            {supplierReturn.invoicedAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-purple-500"></div>
                <div>
                  <p className="text-sm text-theme">NFe de devolução emitida</p>
                  <p className="text-xs text-theme-muted">{formatDate(supplierReturn.invoicedAt)}</p>
                </div>
              </div>
            )}
            {supplierReturn.completedAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-sm text-theme">Concluída</p>
                  <p className="text-xs text-theme-muted">{formatDate(supplierReturn.completedAt)}</p>
                </div>
              </div>
            )}
            {supplierReturn.cancelledAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-red-500"></div>
                <div>
                  <p className="text-sm text-theme">Cancelada</p>
                  <p className="text-xs text-theme-muted">{formatDate(supplierReturn.cancelledAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
