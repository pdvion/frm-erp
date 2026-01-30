"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import {
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

export default function SupplierReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !supplierReturn) {
    return (
      <ProtectedRoute>
        <div className="py-12 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-theme-muted">Devolução não encontrada</p>
          <Link
            href="/supplier-returns"
            className="mt-2 inline-block text-blue-600 hover:underline"
          >
            Voltar para lista
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  const isPending =
    submitMutation.isPending ||
    approveMutation.isPending ||
    completeMutation.isPending ||
    cancelMutation.isPending;

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <PageHeader
          title={`Devolução #${supplierReturn.returnNumber}`}
          subtitle={supplierReturn.supplier.companyName}
          icon={<RotateCcw className="h-6 w-6" />}
          backHref="/supplier-returns"
          module="inventory"
          actions={
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${statusConfig[supplierReturn.status].color}`}
              >
                {statusConfig[supplierReturn.status].label}
              </span>
              {supplierReturn.status === "DRAFT" && (
                <>
                  <Link
                    href={`/supplier-returns/${id}/edit`}
                    className="border-theme hover:bg-theme-hover inline-flex items-center gap-2 rounded-lg border px-4 py-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Link>
                  <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Enviar para Aprovação
                  </button>
                </>
              )}
              {supplierReturn.status === "PENDING" && (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Aprovar
                  </button>
                </>
              )}
              {supplierReturn.status === "APPROVED" && (
                <Link
                  href={`/supplier-returns/${id}/invoice`}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  <FileText className="h-4 w-4" />
                  Registrar NFe Devolução
                </Link>
              )}
              {supplierReturn.status === "INVOICED" && (
                <button
                  onClick={handleComplete}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Concluir
                </button>
              )}
            </div>
          }
        />

        {/* Info Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-theme-card border-theme rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-theme-muted text-sm">Fornecedor</p>
                <p className="text-theme font-medium">{supplierReturn.supplier.companyName}</p>
                <p className="text-theme-muted text-xs">{supplierReturn.supplier.cnpj}</p>
              </div>
            </div>
          </div>

          <div className="bg-theme-card border-theme rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-theme-muted text-sm">Data</p>
                <p className="text-theme font-medium">{formatDate(supplierReturn.returnDate)}</p>
              </div>
            </div>
          </div>

          <div className="bg-theme-card border-theme rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Hash className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-theme-muted text-sm">NFe Origem</p>
                {supplierReturn.receivedInvoice ? (
                  <p className="text-theme font-medium">
                    NF {supplierReturn.receivedInvoice.invoiceNumber}/
                    {supplierReturn.receivedInvoice.series}
                  </p>
                ) : (
                  <p className="text-theme-muted">-</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-theme-card border-theme rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 p-2">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-theme-muted text-sm">Valor Total</p>
                <p className="text-theme text-lg font-bold">
                  {formatCurrency(supplierReturn.totalValue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* NFe Devolução */}
        {supplierReturn.returnInvoiceNumber && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-purple-600" />
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
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Devolução Cancelada</p>
                <p className="text-sm text-red-700">Motivo: {supplierReturn.cancellationReason}</p>
                {supplierReturn.cancelledAt && (
                  <p className="mt-1 text-xs text-red-600">
                    Cancelada em: {formatDate(supplierReturn.cancelledAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-theme-card border-theme overflow-hidden rounded-xl border">
          <div className="border-theme border-b px-6 py-4">
            <h2 className="text-theme text-lg font-semibold">Itens da Devolução</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-theme-hover">
                <tr>
                  <th className="text-theme-muted px-4 py-3 text-left text-sm font-medium">
                    Material
                  </th>
                  <th className="text-theme-muted px-4 py-3 text-center text-sm font-medium">
                    Qtd
                  </th>
                  <th className="text-theme-muted px-4 py-3 text-right text-sm font-medium">
                    Preço Unit.
                  </th>
                  <th className="text-theme-muted px-4 py-3 text-right text-sm font-medium">
                    Total
                  </th>
                  <th className="text-theme-muted px-4 py-3 text-left text-sm font-medium">
                    Motivo
                  </th>
                  <th className="text-theme-muted px-4 py-3 text-left text-sm font-medium">
                    Local
                  </th>
                </tr>
              </thead>
              <tbody className="divide-theme divide-y">
                {supplierReturn.items.map((item) => (
                  <tr key={item.id} className="hover:bg-theme-hover">
                    <td className="px-4 py-3">
                      <div className="text-theme font-medium">
                        {item.material.code} - {item.material.description}
                      </div>
                      <div className="text-theme-muted text-xs">{item.material.unit}</div>
                    </td>
                    <td className="text-theme px-4 py-3 text-center">{item.quantity}</td>
                    <td className="text-theme px-4 py-3 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="text-theme px-4 py-3 text-right font-medium">
                      {formatCurrency(item.totalPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-theme text-sm">{reasonLabels[item.reason]}</span>
                      {item.reasonNotes && (
                        <p className="text-theme-muted mt-1 text-xs">{item.reasonNotes}</p>
                      )}
                    </td>
                    <td className="text-theme-secondary px-4 py-3 text-sm">
                      {item.stockLocation?.name || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-theme-hover">
                <tr>
                  <td colSpan={3} className="text-theme px-4 py-3 text-right font-medium">
                    Total:
                  </td>
                  <td className="text-theme px-4 py-3 text-right text-lg font-bold">
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
          <div className="bg-theme-card border-theme rounded-xl border p-6">
            <h2 className="text-theme mb-2 text-lg font-semibold">Observações</h2>
            <p className="text-theme-secondary whitespace-pre-wrap">{supplierReturn.notes}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-theme-card border-theme rounded-xl border p-6">
          <h2 className="text-theme mb-4 text-lg font-semibold">Histórico</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-theme-tertiary mt-2 h-2 w-2 rounded-full"></div>
              <div>
                <p className="text-theme text-sm">Devolução criada</p>
                <p className="text-theme-muted text-xs">{formatDate(supplierReturn.createdAt)}</p>
              </div>
            </div>
            {supplierReturn.approvedAt && (
              <div className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 rounded-full bg-blue-500"></div>
                <div>
                  <p className="text-theme text-sm">Aprovada</p>
                  <p className="text-theme-muted text-xs">
                    {formatDate(supplierReturn.approvedAt)}
                  </p>
                </div>
              </div>
            )}
            {supplierReturn.invoicedAt && (
              <div className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 rounded-full bg-purple-500"></div>
                <div>
                  <p className="text-theme text-sm">NFe de devolução emitida</p>
                  <p className="text-theme-muted text-xs">
                    {formatDate(supplierReturn.invoicedAt)}
                  </p>
                </div>
              </div>
            )}
            {supplierReturn.completedAt && (
              <div className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-theme text-sm">Concluída</p>
                  <p className="text-theme-muted text-xs">
                    {formatDate(supplierReturn.completedAt)}
                  </p>
                </div>
              </div>
            )}
            {supplierReturn.cancelledAt && (
              <div className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 rounded-full bg-red-500"></div>
                <div>
                  <p className="text-theme text-sm">Cancelada</p>
                  <p className="text-theme-muted text-xs">
                    {formatDate(supplierReturn.cancelledAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
