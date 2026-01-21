"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  FileText,
  ChevronLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Building2,
  Package,
  Send,
  Ban,
  FileEdit,
  DollarSign,
  Printer,
  Download,
  CreditCard,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Rascunho", color: "bg-theme-tertiary text-theme", icon: <Clock className="w-4 h-4" /> },
  AUTHORIZED: { label: "Autorizada", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-500", icon: <XCircle className="w-4 h-4" /> },
  DENIED: { label: "Denegada", color: "bg-orange-100 text-orange-800", icon: <AlertTriangle className="w-4 h-4" /> },
};

export default function BillingDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showReceivablesModal, setShowReceivablesModal] = useState(false);

  const { data: invoice, isLoading, refetch } = trpc.billing.byId.useQuery({ id });

  const authorizeMutation = trpc.billing.authorize.useMutation({
    onSuccess: () => refetch(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme mb-2">Nota fiscal não encontrada</h3>
          <Link href="/billing" className="text-indigo-600 hover:text-indigo-800">
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  const config = statusConfig[invoice.status] || statusConfig.DRAFT;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-theme-card border-b border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/billing" className="text-theme-muted hover:text-theme-secondary">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold text-theme flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                NFe {invoice.invoiceNumber}
              </h1>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.icon}
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CompanySwitcher />
              {invoice.status === "DRAFT" && (
                <button
                  onClick={() => authorizeMutation.mutate({ id })}
                  disabled={authorizeMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {authorizeMutation.isPending ? "Autorizando..." : "Autorizar NFe"}
                </button>
              )}
              {invoice.status === "AUTHORIZED" && (
                <>
                  <button
                    onClick={() => setShowReceivablesModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <CreditCard className="w-4 h-4" />
                    Gerar Títulos
                  </button>
                  <button
                    onClick={() => setShowCorrectionModal(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover"
                  >
                    <FileEdit className="w-4 h-4" />
                    Carta Correção
                  </button>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                  >
                    <Ban className="w-4 h-4" />
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Info */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-medium text-theme mb-4">Dados da Nota</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-theme-muted">Número</label>
                  <p className="font-medium text-theme">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-theme-muted">Série</label>
                  <p className="font-medium text-theme">{invoice.series}</p>
                </div>
                <div>
                  <label className="text-sm text-theme-muted">Modelo</label>
                  <p className="font-medium text-theme">{invoice.model}</p>
                </div>
                <div>
                  <label className="text-sm text-theme-muted">Emissão</label>
                  <p className="font-medium text-theme">{formatDateTime(invoice.issueDate)}</p>
                </div>
              </div>

              {invoice.accessKey && (
                <div className="mt-4 p-3 bg-theme-tertiary rounded-lg">
                  <label className="text-sm text-theme-muted">Chave de Acesso</label>
                  <p className="font-mono text-sm text-theme break-all">{invoice.accessKey}</p>
                </div>
              )}

              {invoice.protocolNumber && (
                <div className="mt-4">
                  <label className="text-sm text-theme-muted">Protocolo de Autorização</label>
                  <p className="font-medium text-theme">{invoice.protocolNumber}</p>
                  {invoice.authorizedAt && (
                    <p className="text-sm text-theme-muted">
                      Autorizada em {formatDateTime(invoice.authorizedAt)}
                    </p>
                  )}
                </div>
              )}

              {invoice.cancellationReason && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <label className="text-sm text-red-600 font-medium">Motivo do Cancelamento</label>
                  <p className="text-red-700">{invoice.cancellationReason}</p>
                  {invoice.cancelledAt && (
                    <p className="text-sm text-red-500">
                      Cancelada em {formatDateTime(invoice.cancelledAt)}
                    </p>
                  )}
                </div>
              )}

              {invoice.lastCorrection && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <label className="text-sm text-yellow-600 font-medium">
                    Carta de Correção #{invoice.correctionSeq}
                  </label>
                  <p className="text-yellow-700">{invoice.lastCorrection}</p>
                  {invoice.lastCorrectionAt && (
                    <p className="text-sm text-yellow-500">
                      Registrada em {formatDateTime(invoice.lastCorrectionAt)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Customer */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-theme-muted" />
                Cliente
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-theme-muted">Razão Social</label>
                  <p className="font-medium text-theme">{invoice.customer?.companyName}</p>
                </div>
                <div>
                  <label className="text-sm text-theme-muted">CNPJ/CPF</label>
                  <p className="font-medium text-theme">{invoice.customer?.cnpj || invoice.customer?.cpf}</p>
                </div>
                {invoice.customer?.email && (
                  <div>
                    <label className="text-sm text-theme-muted">Email</label>
                    <p className="font-medium text-theme">{invoice.customer.email}</p>
                  </div>
                )}
                {invoice.customer?.phone && (
                  <div>
                    <label className="text-sm text-theme-muted">Telefone</label>
                    <p className="font-medium text-theme">{invoice.customer.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
              <div className="p-6 border-b border-theme">
                <h2 className="text-lg font-medium text-theme flex items-center gap-2">
                  <Package className="w-5 h-5 text-theme-muted" />
                  Itens ({invoice.items?.length || 0})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        Qtd
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        Unitário
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {invoice.items?.map((item, index) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 text-sm text-theme">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-theme">
                            {item.material?.description || item.description}
                          </div>
                          <div className="text-sm text-theme-muted">
                            {item.material?.code && `Cód: ${item.material.code}`}
                            {item.ncm && ` | NCM: ${item.ncm}`}
                            {item.cfop && ` | CFOP: ${item.cfop}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-theme">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-6 py-4 text-right text-theme">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-theme">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Totals */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-theme-muted" />
                Valores
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-theme-muted">Subtotal</span>
                  <span className="font-medium text-theme">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discountValue > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Desconto</span>
                    <span>-{formatCurrency(invoice.discountValue)}</span>
                  </div>
                )}
                {invoice.shippingValue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Frete</span>
                    <span className="font-medium text-theme">{formatCurrency(invoice.shippingValue)}</span>
                  </div>
                )}
                <div className="border-t border-theme pt-3">
                  <div className="flex justify-between text-lg">
                    <span className="font-medium text-theme">Total</span>
                    <span className="font-bold text-theme">{formatCurrency(invoice.totalValue)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Taxes */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-medium text-theme mb-4">Impostos</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-theme-muted">Base ICMS</span>
                  <span className="text-theme">{formatCurrency(invoice.icmsBase || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Valor ICMS</span>
                  <span className="text-theme">{formatCurrency(invoice.icmsValue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Valor IPI</span>
                  <span className="text-theme">{formatCurrency(invoice.ipiValue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Valor PIS</span>
                  <span className="text-theme">{formatCurrency(invoice.pisValue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Valor COFINS</span>
                  <span className="text-theme">{formatCurrency(invoice.cofinsValue || 0)}</span>
                </div>
              </div>
            </div>

            {/* Sales Order */}
            {invoice.salesOrder && (
              <div className="bg-theme-card rounded-lg border border-theme p-6">
                <h2 className="text-lg font-medium text-theme mb-4">Pedido de Venda</h2>
                <Link
                  href={`/sales-orders/${invoice.salesOrder.id}`}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Pedido #{invoice.salesOrder.code}
                </Link>
              </div>
            )}

            {/* Receivables */}
            {invoice.receivables && invoice.receivables.length > 0 && (
              <div className="bg-theme-card rounded-lg border border-theme p-6">
                <h2 className="text-lg font-medium text-theme mb-4">Títulos a Receber</h2>
                <div className="space-y-2">
                  {invoice.receivables.map((rec) => (
                    <div key={rec.id} className="flex justify-between text-sm">
                      <span className="text-theme-secondary">{formatDate(rec.dueDate)}</span>
                      <span className="font-medium text-theme">{formatCurrency(rec.netValue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-medium text-theme mb-4">Ações</h2>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-4 py-2 border border-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover">
                  <Printer className="w-4 h-4" />
                  Imprimir DANFE
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2 border border-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover">
                  <Download className="w-4 h-4" />
                  Baixar XML
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Cancel Modal */}
      {showCancelModal && (
        <CancelModal
          invoiceId={id}
          onClose={() => setShowCancelModal(false)}
          onSuccess={() => {
            setShowCancelModal(false);
            refetch();
          }}
        />
      )}

      {/* Correction Modal */}
      {showCorrectionModal && (
        <CorrectionModal
          invoiceId={id}
          onClose={() => setShowCorrectionModal(false)}
          onSuccess={() => {
            setShowCorrectionModal(false);
            refetch();
          }}
        />
      )}

      {/* Receivables Modal */}
      {showReceivablesModal && (
        <ReceivablesModal
          invoiceId={id}
          totalValue={invoice.totalValue}
          onClose={() => setShowReceivablesModal(false)}
          onSuccess={() => {
            setShowReceivablesModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function CancelModal({ invoiceId, onClose, onSuccess }: { invoiceId: string; onClose: () => void; onSuccess: () => void }) {
  const [reason, setReason] = useState("");

  const cancelMutation = trpc.billing.cancel.useMutation({
    onSuccess,
  });

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="bg-theme-card rounded-lg p-6 w-full max-w-lg mx-4">
        <h3 id="cancel-modal-title" className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
          <Ban className="w-5 h-5 text-red-600" />
          Cancelar Nota Fiscal
        </h3>

        <p className="text-sm text-theme-muted mb-4">
          O cancelamento só é permitido em até 24 horas após a autorização.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-theme-secondary mb-2">
            Motivo do Cancelamento (mínimo 15 caracteres)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-red-500"
            placeholder="Descreva o motivo do cancelamento..."
          />
        </div>

        {cancelMutation.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {cancelMutation.error.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover"
          >
            Voltar
          </button>
          <button
            onClick={() => cancelMutation.mutate({ id: invoiceId, reason })}
            disabled={reason.length < 15 || cancelMutation.isPending}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {cancelMutation.isPending ? "Cancelando..." : "Confirmar Cancelamento"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CorrectionModal({ invoiceId, onClose, onSuccess }: { invoiceId: string; onClose: () => void; onSuccess: () => void }) {
  const [correction, setCorrection] = useState("");

  const correctionMutation = trpc.billing.correctionLetter.useMutation({
    onSuccess,
  });

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="correction-modal-title"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="bg-theme-card rounded-lg p-6 w-full max-w-lg mx-4">
        <h3 id="correction-modal-title" className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
          <FileEdit className="w-5 h-5 text-yellow-600" />
          Carta de Correção
        </h3>

        <p className="text-sm text-theme-muted mb-4">
          A carta de correção não pode alterar valores, quantidades ou dados do destinatário.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-theme-secondary mb-2">
            Texto da Correção (mínimo 15 caracteres)
          </label>
          <textarea
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-yellow-500"
            placeholder="Descreva a correção a ser feita..."
          />
        </div>

        {correctionMutation.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {correctionMutation.error.message}
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
            onClick={() => correctionMutation.mutate({ id: invoiceId, correction })}
            disabled={correction.length < 15 || correctionMutation.isPending}
            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            {correctionMutation.isPending ? "Enviando..." : "Enviar Correção"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceivablesModal({ invoiceId, totalValue, onClose, onSuccess }: { invoiceId: string; totalValue: number; onClose: () => void; onSuccess: () => void }) {
  const [installments, setInstallments] = useState(() => {
    const initialDate = new Date();
    initialDate.setDate(initialDate.getDate() + 30);
    return [{ dueDate: initialDate, value: totalValue }];
  });

  const generateMutation = trpc.billing.generateReceivables.useMutation({
    onSuccess,
  });

  const addInstallment = () => {
    const lastDate = installments[installments.length - 1]?.dueDate || new Date();
    const newDate = new Date(lastDate);
    newDate.setDate(newDate.getDate() + 30);
    
    const newValue = totalValue / (installments.length + 1);
    const newInstallments = installments.map((i) => ({ ...i, value: newValue }));
    newInstallments.push({ dueDate: newDate, value: newValue });
    setInstallments(newInstallments);
  };

  const removeInstallment = (index: number) => {
    if (installments.length > 1) {
      const newInstallments = installments.filter((_, i) => i !== index);
      const newValue = totalValue / newInstallments.length;
      setInstallments(newInstallments.map((i) => ({ ...i, value: newValue })));
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receivables-modal-title"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="bg-theme-card rounded-lg p-6 w-full max-w-lg mx-4">
        <h3 id="receivables-modal-title" className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          Gerar Títulos a Receber
        </h3>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-700">
            Valor total: <span className="font-bold">{formatCurrency(totalValue)}</span>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {installments.map((inst, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-theme-muted">Vencimento</label>
                <input
                  type="date"
                  value={inst.dueDate.toISOString().split("T")[0]}
                  onChange={(e) => {
                    const newInstallments = [...installments];
                    newInstallments[index].dueDate = new Date(e.target.value);
                    setInstallments(newInstallments);
                  }}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-theme-muted">Valor</label>
                <input
                  type="number"
                  value={inst.value.toFixed(2)}
                  onChange={(e) => {
                    const newInstallments = [...installments];
                    newInstallments[index].value = parseFloat(e.target.value) || 0;
                    setInstallments(newInstallments);
                  }}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg text-sm"
                />
              </div>
              {installments.length > 1 && (
                <button
                  onClick={() => removeInstallment(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg mt-4"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addInstallment}
          className="w-full mb-4 px-4 py-2 border border-dashed border-gray-300 text-theme-secondary rounded-lg hover:bg-theme-hover"
        >
          + Adicionar Parcela
        </button>

        {generateMutation.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {generateMutation.error.message}
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
            onClick={() => generateMutation.mutate({ invoiceId, installments })}
            disabled={generateMutation.isPending}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generateMutation.isPending ? "Gerando..." : "Gerar Títulos"}
          </button>
        </div>
      </div>
    </div>
  );
}
