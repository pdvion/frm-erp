"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import {
  FileText,
  Loader2,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  Eye,
  Copy,
  ArrowRight,
  Box,
  Target,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Rascunho", color: "bg-theme-tertiary text-theme", icon: <Clock className="w-4 h-4" /> },
  SENT: { label: "Enviado", color: "bg-blue-100 text-blue-800", icon: <Send className="w-4 h-4" /> },
  VIEWED: { label: "Visualizado", color: "bg-purple-100 text-purple-800", icon: <Eye className="w-4 h-4" /> },
  ACCEPTED: { label: "Aceito", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  REJECTED: { label: "Rejeitado", color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
  EXPIRED: { label: "Expirado", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  CONVERTED: { label: "Convertido", color: "bg-indigo-100 text-indigo-800", icon: <ArrowRight className="w-4 h-4" /> },
};

export default function SalesQuoteDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: quote, isLoading, refetch } = trpc.salesQuotes.byId.useQuery({ id });
  const utils = trpc.useUtils();

  const sendMutation = trpc.salesQuotes.send.useMutation({
    onSuccess: () => {
      refetch();
      utils.salesQuotes.list.invalidate();
    },
  });

  const acceptMutation = trpc.salesQuotes.accept.useMutation({
    onSuccess: () => {
      refetch();
      utils.salesQuotes.list.invalidate();
    },
  });

  const rejectMutation = trpc.salesQuotes.reject.useMutation({
    onSuccess: () => {
      refetch();
      utils.salesQuotes.list.invalidate();
    },
  });

  const convertMutation = trpc.salesQuotes.convertToOrder.useMutation({
    onSuccess: (order) => {
      refetch();
      utils.salesQuotes.list.invalidate();
      utils.salesOrders.list.invalidate();
      alert(`Pedido #${order.code} criado com sucesso!`);
    },
  });

  const duplicateMutation = trpc.salesQuotes.duplicate.useMutation({
    onSuccess: (newQuote) => {
      utils.salesQuotes.list.invalidate();
      alert(`Orçamento #${newQuote.code} criado como cópia!`);
    },
  });

  const handleSend = () => {
    if (confirm("Enviar orçamento ao cliente?")) {
      sendMutation.mutate({ id });
    }
  };

  const handleAccept = () => {
    if (confirm("Marcar orçamento como aceito?")) {
      acceptMutation.mutate({ id });
    }
  };

  const handleReject = () => {
    const reason = prompt("Motivo da rejeição (opcional):");
    rejectMutation.mutate({ id, reason: reason || undefined });
  };

  const handleConvert = () => {
    if (confirm("Converter orçamento em pedido de venda?")) {
      convertMutation.mutate({ id });
    }
  };

  const handleDuplicate = () => {
    if (confirm("Criar cópia deste orçamento?")) {
      duplicateMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-theme-muted mb-4">Orçamento não encontrado</p>
        <Link href="/sales/quotes" className="text-blue-600 hover:underline">
          Voltar para lista
        </Link>
      </div>
    );
  }

  const config = statusConfig[quote.status] || statusConfig.DRAFT;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Orçamento #${quote.code}`}
        icon={<FileText className="w-6 h-6" />}
        backHref="/sales/quotes"
        module="sales"
        badge={{ label: config.label, color: config.color.split(" ")[1], bgColor: config.color.split(" ")[0] }}
        actions={
          <div className="flex items-center gap-2">
            {quote.status === "DRAFT" && (
              <button
                onClick={handleSend}
                disabled={sendMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Enviar
              </button>
            )}
            {["SENT", "VIEWED"].includes(quote.status) && (
              <>
                <button
                  onClick={handleAccept}
                  disabled={acceptMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aceitar
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Rejeitar
                </button>
              </>
            )}
            {quote.status === "ACCEPTED" && !quote.convertedToOrderId && (
              <button
                onClick={handleConvert}
                disabled={convertMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <ArrowRight className="w-4 h-4" />
                Converter em Pedido
              </button>
            )}
            <button
              onClick={handleDuplicate}
              disabled={duplicateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 border border-theme rounded-lg hover:bg-theme-hover disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              Duplicar
            </button>
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
                Cliente
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-theme-muted">Razão Social</label>
                  <p className="text-theme font-medium">{quote.customer.companyName}</p>
                </div>
                <div>
                  <label className="text-sm text-theme-muted">Código</label>
                  <p className="text-theme">{quote.customer.code}</p>
                </div>
                {quote.customer.cnpj && (
                  <div>
                    <label className="text-sm text-theme-muted">CNPJ</label>
                    <p className="text-theme">{quote.customer.cnpj}</p>
                  </div>
                )}
                {quote.customer.email && (
                  <div>
                    <label className="text-sm text-theme-muted">Email</label>
                    <p className="text-theme">{quote.customer.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Itens */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                <Box className="w-5 h-5 text-theme-muted" />
                Itens ({quote.items.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-theme-table">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-theme-muted uppercase">
                        Produto
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-theme-muted uppercase">
                        Qtd
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-theme-muted uppercase">
                        Preço Unit.
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-theme-muted uppercase">
                        Desc.
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-theme-muted uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {quote.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          <div className="font-medium text-theme">{item.material.description}</div>
                          <div className="text-xs text-theme-muted">Cód: {item.material.code}</div>
                        </td>
                        <td className="px-3 py-2 text-right text-theme">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-3 py-2 text-right text-theme">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right text-theme-muted">
                          {item.discountPercent > 0 ? `${item.discountPercent}%` : "-"}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-theme">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Observações */}
            {(quote.notes || quote.internalNotes) && (
              <div className="bg-theme-card rounded-lg border border-theme p-6">
                <h2 className="text-lg font-semibold text-theme mb-4">Observações</h2>
                {quote.notes && (
                  <div className="mb-4">
                    <label className="text-sm text-theme-muted">Observações</label>
                    <p className="text-theme whitespace-pre-wrap">{quote.notes}</p>
                  </div>
                )}
                {quote.internalNotes && (
                  <div>
                    <label className="text-sm text-theme-muted">Observações Internas</label>
                    <p className="text-theme whitespace-pre-wrap">{quote.internalNotes}</p>
                  </div>
                )}
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
                  <span className="text-theme">{formatCurrency(quote.subtotal)}</span>
                </div>
                {quote.discountPercent > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Desconto ({quote.discountPercent}%)</span>
                    <span>-{formatCurrency(quote.subtotal * quote.discountPercent / 100)}</span>
                  </div>
                )}
                {quote.discountValue > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Desconto</span>
                    <span>-{formatCurrency(quote.discountValue)}</span>
                  </div>
                )}
                {quote.shippingValue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Frete</span>
                    <span className="text-theme">{formatCurrency(quote.shippingValue)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-theme font-semibold text-lg">
                  <span className="text-theme">Total</span>
                  <span className="text-blue-600">{formatCurrency(quote.totalValue)}</span>
                </div>
              </div>
            </div>

            {/* Condições */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4">Condições</h2>
              <div className="space-y-3 text-sm">
                {quote.validUntil && (
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Validade</span>
                    <span className="text-theme">{formatDate(quote.validUntil)}</span>
                  </div>
                )}
                {quote.deliveryDays && (
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Prazo Entrega</span>
                    <span className="text-theme">{quote.deliveryDays} dias</span>
                  </div>
                )}
                {quote.paymentTerms && (
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Pagamento</span>
                    <span className="text-theme">{quote.paymentTerms}</span>
                  </div>
                )}
                {quote.shippingMethod && (
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Frete</span>
                    <span className="text-theme">{quote.shippingMethod}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Lead Vinculado */}
            {quote.lead && (
              <div className="bg-theme-card rounded-lg border border-theme p-6">
                <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-theme-muted" />
                  Lead Vinculado
                </h2>
                <Link
                  href={`/sales/leads/${quote.lead.id}`}
                  className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg hover:bg-orange-100"
                >
                  <Target className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">Lead #{quote.lead.code}</p>
                    <p className="text-sm text-orange-600">{quote.lead.companyName}</p>
                  </div>
                </Link>
              </div>
            )}

            {/* Pedido Convertido */}
            {quote.convertedToOrder && (
              <div className="bg-theme-card rounded-lg border border-theme p-6">
                <h2 className="text-lg font-semibold text-theme mb-4">Pedido Gerado</h2>
                <Link
                  href={`/sales/orders/${quote.convertedToOrder.id}`}
                  className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100"
                >
                  <Box className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Pedido #{quote.convertedToOrder.code}</p>
                    <p className="text-sm text-green-600">{quote.convertedToOrder.status}</p>
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
                  <span className="text-theme-muted">Criado em</span>
                  <span className="text-theme">{formatDateTime(quote.createdAt)}</span>
                </div>
                {quote.sentAt && (
                  <div className="flex justify-between text-blue-600">
                    <span>Enviado em</span>
                    <span>{formatDateTime(quote.sentAt)}</span>
                  </div>
                )}
                {quote.viewedAt && (
                  <div className="flex justify-between text-purple-600">
                    <span>Visualizado em</span>
                    <span>{formatDateTime(quote.viewedAt)}</span>
                  </div>
                )}
                {quote.acceptedAt && (
                  <div className="flex justify-between text-green-600">
                    <span>Aceito em</span>
                    <span>{formatDateTime(quote.acceptedAt)}</span>
                  </div>
                )}
                {quote.rejectedAt && (
                  <div className="flex justify-between text-red-600">
                    <span>Rejeitado em</span>
                    <span>{formatDateTime(quote.rejectedAt)}</span>
                  </div>
                )}
              </div>
              {quote.rejectionReason && (
                <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
                  <strong>Motivo:</strong> {quote.rejectionReason}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
