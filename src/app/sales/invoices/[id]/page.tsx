"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  FileText,
  Loader2,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Send,
  Ban,
  Edit3,
  Box,
  CreditCard,
  Key,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Rascunho", color: "bg-theme-tertiary text-theme", icon: <Clock className="w-4 h-4" /> },
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: <AlertCircle className="w-4 h-4" /> },
  AUTHORIZED: { label: "Autorizada", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
  DENIED: { label: "Rejeitada", color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
};

export default function IssuedInvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: invoice, isLoading, refetch } = trpc.issuedInvoices.byId.useQuery({ id });
  const utils = trpc.useUtils();

  const authorizeMutation = trpc.issuedInvoices.authorize.useMutation({
    onSuccess: () => {
      refetch();
      utils.issuedInvoices.list.invalidate();
    },
  });

  const cancelMutation = trpc.issuedInvoices.cancel.useMutation({
    onSuccess: () => {
      refetch();
      utils.issuedInvoices.list.invalidate();
    },
  });

  const correctionMutation = trpc.issuedInvoices.correction.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleAuthorize = () => {
    if (confirm("Enviar NF para autorização na SEFAZ?")) {
      authorizeMutation.mutate({ id });
    }
  };

  const handleCancel = () => {
    const reason = prompt("Motivo do cancelamento (mínimo 15 caracteres):");
    if (reason && reason.length >= 15) {
      cancelMutation.mutate({ id, reason });
    } else if (reason) {
      alert("Motivo deve ter pelo menos 15 caracteres");
    }
  };

  const handleCorrection = () => {
    const text = prompt("Texto da carta de correção (mínimo 15 caracteres):");
    if (text && text.length >= 15) {
      correctionMutation.mutate({ id, correctionText: text });
    } else if (text) {
      alert("Correção deve ter pelo menos 15 caracteres");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-theme-muted mb-4">Nota fiscal não encontrada</p>
        <Link href="/sales/invoices" className="text-blue-600 hover:underline">
          Voltar para lista
        </Link>
      </div>
    );
  }

  const config = statusConfig[invoice.status] || statusConfig.DRAFT;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`NF ${invoice.invoiceNumber}`}
        icon={<FileText className="w-6 h-6" />}
        backHref="/sales/invoices"
        module="sales"
        badge={{ label: config.label, color: config.color.split(" ")[1], bgColor: config.color.split(" ")[0] }}
        actions={
          <div className="flex items-center gap-2">
            {invoice.status === "DRAFT" && (
              <Button
                onClick={handleAuthorize}
                isLoading={authorizeMutation.isPending}
                variant="success"
                leftIcon={<Send className="w-4 h-4" />}
              >
                Autorizar
              </Button>
            )}
            {invoice.status === "AUTHORIZED" && (
              <Button
                onClick={handleCorrection}
                isLoading={correctionMutation.isPending}
                className="bg-yellow-600 hover:bg-yellow-700"
                leftIcon={<Edit3 className="w-4 h-4" />}
              >
                Carta Correção
              </Button>
            )}
            {["DRAFT", "AUTHORIZED"].includes(invoice.status) && (
              <Button
                onClick={handleCancel}
                isLoading={cancelMutation.isPending}
                variant="danger"
                leftIcon={<Ban className="w-4 h-4" />}
              >
                Cancelar
              </Button>
            )}
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cliente */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-theme-muted" />
                Destinatário
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-theme-muted">Razão Social</label>
                  <p className="text-theme font-medium">{invoice.customer.companyName}</p>
                </div>
                <div>
                  <label className="text-sm text-theme-muted">Código</label>
                  <p className="text-theme">{invoice.customer.code}</p>
                </div>
                {invoice.customer.cnpj && (
                  <div>
                    <label className="text-sm text-theme-muted">CNPJ</label>
                    <p className="text-theme">{invoice.customer.cnpj}</p>
                  </div>
                )}
                {invoice.customer.email && (
                  <div>
                    <label className="text-sm text-theme-muted">Email</label>
                    <p className="text-theme">{invoice.customer.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Itens */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                <Box className="w-5 h-5 text-theme-muted" />
                Itens ({invoice.items.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-theme-muted uppercase">
                        Produto
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-theme-muted uppercase">
                        NCM
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-theme-muted uppercase">
                        CFOP
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-theme-muted uppercase">
                        Qtd
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-theme-muted uppercase">
                        Preço
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-theme-muted uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {invoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          <div className="font-medium text-theme">{item.material.description}</div>
                          <div className="text-xs text-theme-muted">Cód: {item.material.code}</div>
                        </td>
                        <td className="px-3 py-2 text-center text-sm text-theme-muted font-mono">
                          {item.ncm || "-"}
                        </td>
                        <td className="px-3 py-2 text-center text-sm text-theme-muted font-mono">
                          {item.cfop || "-"}
                        </td>
                        <td className="px-3 py-2 text-right text-theme">
                          {Number(item.quantity)} {item.unit}
                        </td>
                        <td className="px-3 py-2 text-right text-theme">
                          {formatCurrency(Number(item.unitPrice))}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-theme">
                          {formatCurrency(Number(item.totalPrice))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Parcelas */}
            {invoice.receivables.length > 0 && (
              <div className="bg-theme-card rounded-lg border border-theme p-6">
                <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-theme-muted" />
                  Parcelas ({invoice.receivables.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-theme-table">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-theme-muted uppercase">
                          Parcela
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-theme-muted uppercase">
                          Vencimento
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-theme-muted uppercase">
                          Valor
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-theme-muted uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-table">
                      {invoice.receivables.map((rec) => (
                        <tr key={rec.id}>
                          <td className="px-3 py-2 text-theme">{rec.installmentNumber}</td>
                          <td className="px-3 py-2 text-center text-theme">
                            {formatDate(rec.dueDate)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-theme">
                            {formatCurrency(rec.netValue)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              rec.status === "PAID" ? "bg-green-100 text-green-800" :
                                rec.status === "OVERDUE" ? "bg-red-100 text-red-800" :
                                  "bg-yellow-100 text-yellow-800"
                            }`}>
                              {rec.status === "PAID" ? "Pago" : rec.status === "OVERDUE" ? "Vencido" : "Pendente"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Observações */}
            {invoice.notes && (
              <div className="bg-theme-card rounded-lg border border-theme p-6">
                <h2 className="text-lg font-semibold text-theme mb-4">Observações</h2>
                <p className="text-theme whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Totais */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4">Totais</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-theme-muted">Subtotal</span>
                  <span className="text-theme">{formatCurrency(Number(invoice.subtotal))}</span>
                </div>
                {Number(invoice.discountValue) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Desconto</span>
                    <span>-{formatCurrency(Number(invoice.discountValue))}</span>
                  </div>
                )}
                {Number(invoice.shippingValue) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Frete</span>
                    <span className="text-theme">{formatCurrency(Number(invoice.shippingValue))}</span>
                  </div>
                )}
                {Number(invoice.icmsValue ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-theme-muted">ICMS</span>
                    <span className="text-theme">{formatCurrency(Number(invoice.icmsValue ?? 0))}</span>
                  </div>
                )}
                {Number(invoice.ipiValue ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-theme-muted">IPI</span>
                    <span className="text-theme">{formatCurrency(Number(invoice.ipiValue ?? 0))}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-theme font-semibold text-lg">
                  <span className="text-theme">Total</span>
                  <span className="text-blue-600">{formatCurrency(Number(invoice.totalValue))}</span>
                </div>
              </div>
            </div>

            {/* Dados Fiscais */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-theme-muted" />
                Dados Fiscais
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-theme-muted">Série</span>
                  <span className="text-theme">{invoice.series}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Modelo</span>
                  <span className="text-theme">{invoice.model}</span>
                </div>
                {invoice.accessKey && (
                  <div>
                    <span className="text-theme-muted block mb-1">Chave de Acesso</span>
                    <span className="text-theme font-mono text-xs break-all">{invoice.accessKey}</span>
                  </div>
                )}
                {invoice.protocolNumber && (
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Protocolo</span>
                    <span className="text-theme font-mono">{invoice.protocolNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pedido Vinculado */}
            {invoice.salesOrder && (
              <div className="bg-theme-card rounded-lg border border-theme p-6">
                <h2 className="text-lg font-semibold text-theme mb-4">Pedido Vinculado</h2>
                <Link
                  href={`/sales/orders/${invoice.salesOrder.id}`}
                  className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100"
                >
                  <Box className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Pedido #{invoice.salesOrder.code}</p>
                    <p className="text-sm text-green-600">{invoice.salesOrder.status}</p>
                  </div>
                </Link>
              </div>
            )}

            {/* Datas */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-theme-muted" />
                Histórico
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-theme-muted">Emissão</span>
                  <span className="text-theme">{formatDateTime(invoice.issueDate)}</span>
                </div>
                {invoice.authorizedAt && (
                  <div className="flex justify-between text-green-600">
                    <span>Autorizada em</span>
                    <span>{formatDateTime(invoice.authorizedAt)}</span>
                  </div>
                )}
                {invoice.cancelledAt && (
                  <div className="flex justify-between text-red-600">
                    <span>Cancelada em</span>
                    <span>{formatDateTime(invoice.cancelledAt)}</span>
                  </div>
                )}
                {invoice.lastCorrectionAt && (
                  <div className="flex justify-between text-yellow-600">
                    <span>Última correção</span>
                    <span>{formatDateTime(invoice.lastCorrectionAt)}</span>
                  </div>
                )}
              </div>
              {invoice.cancellationReason && (
                <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
                  <strong>Motivo cancelamento:</strong> {invoice.cancellationReason}
                </div>
              )}
              {invoice.lastCorrection && (
                <div className="mt-3 p-2 bg-yellow-50 rounded text-sm text-yellow-700">
                  <strong>Correção #{invoice.correctionSeq}:</strong> {invoice.lastCorrection}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
