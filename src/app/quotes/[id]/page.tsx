"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Loader2,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
  Package,
  Calendar,
  CreditCard,
  Truck,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Rascunho", color: "text-zinc-300", bgColor: "bg-zinc-700", icon: <FileText className="w-4 h-4" /> },
  PENDING: { label: "Pendente", color: "text-yellow-400", bgColor: "bg-yellow-900/30", icon: <Clock className="w-4 h-4" /> },
  SENT: { label: "Enviada", color: "text-blue-400", bgColor: "bg-blue-900/30", icon: <Send className="w-4 h-4" /> },
  RECEIVED: { label: "Recebida", color: "text-purple-400", bgColor: "bg-purple-900/30", icon: <FileText className="w-4 h-4" /> },
  APPROVED: { label: "Aprovada", color: "text-green-400", bgColor: "bg-green-900/30", icon: <CheckCircle className="w-4 h-4" /> },
  REJECTED: { label: "Rejeitada", color: "text-red-400", bgColor: "bg-red-900/30", icon: <XCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelada", color: "text-zinc-500", bgColor: "bg-zinc-800", icon: <XCircle className="w-4 h-4" /> },
};

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data: quote, isLoading, error, refetch } = trpc.quotes.byId.useQuery({ id });
  const utils = trpc.useUtils();

  const approveMutation = trpc.quotes.approve.useMutation({
    onSuccess: () => {
      refetch();
      utils.quotes.list.invalidate();
    },
  });

  const rejectMutation = trpc.quotes.reject.useMutation({
    onSuccess: () => {
      setShowRejectModal(false);
      refetch();
      utils.quotes.list.invalidate();
    },
  });

  const deleteMutation = trpc.quotes.delete.useMutation({
    onSuccess: () => {
      router.push("/quotes");
    },
  });

  const updateMutation = trpc.quotes.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });


  const handleStatusChange = (newStatus: string) => {
    updateMutation.mutate({
      id,
      status: newStatus as "DRAFT" | "PENDING" | "SENT" | "RECEIVED" | "APPROVED" | "REJECTED" | "CANCELLED",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <div>
            <h3 className="font-medium text-theme">Erro ao carregar cotação</h3>
            <p className="text-red-400 text-sm">
              {error?.message || "Cotação não encontrada"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const config = statusConfig[quote.status];
  const canEdit = ["DRAFT", "PENDING"].includes(quote.status);
  const canApprove = ["RECEIVED", "PENDING"].includes(quote.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Cotação #${quote.code.toString().padStart(6, "0")}`}
        icon={<FileText className="w-6 h-6" />}
        backHref="/quotes"
        badge={{ label: config.label, color: config.color, bgColor: config.bgColor }}
      >
        {canEdit && (
          <Link
            href={`/quotes/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 border border-theme text-theme-secondary rounded-lg hover:bg-theme-hover"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Link>
        )}
        {canApprove && (
          <>
            <button
              onClick={() => approveMutation.mutate({ id })}
              disabled={approveMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Aprovar
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <XCircle className="w-4 h-4" />
              Rejeitar
            </button>
          </>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier Info */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h2 className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-theme-muted" />
              Fornecedor
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-theme-muted">Razão Social</div>
                <div className="font-medium text-theme">
                  {quote.supplier.companyName}
                </div>
              </div>
              {quote.supplier.tradeName && (
                <div>
                  <div className="text-sm text-theme-muted">Nome Fantasia</div>
                  <div className="font-medium text-theme">
                    {quote.supplier.tradeName}
                  </div>
                </div>
              )}
              {quote.supplier.cnpj && (
                <div>
                  <div className="text-sm text-theme-muted">CNPJ</div>
                  <div className="font-medium text-theme">
                    {quote.supplier.cnpj}
                  </div>
                </div>
              )}
              {quote.supplier.phone && (
                <div className="flex items-center gap-2 text-theme-secondary">
                  <Phone className="w-4 h-4 text-theme-muted" />
                  <span>{quote.supplier.phone}</span>
                </div>
              )}
              {quote.supplier.email && (
                <div className="flex items-center gap-2 text-theme-secondary">
                  <Mail className="w-4 h-4 text-theme-muted" />
                  <span>{quote.supplier.email}</span>
                </div>
              )}
              {quote.supplier.city && (
                <div className="flex items-center gap-2 text-theme-secondary">
                  <MapPin className="w-4 h-4 text-theme-muted" />
                  <span>
                    {quote.supplier.city}
                    {quote.supplier.state && ` - ${quote.supplier.state}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-theme flex items-center gap-2">
                <Package className="w-5 h-5 text-theme-muted" />
                Itens ({quote.items.length})
              </h2>
              {canEdit && (
                <button className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300">
                  <Plus className="w-4 h-4" />
                  Adicionar Item
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-theme-table">
                <thead className="bg-theme-table-header">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                      Material
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                      Quantidade
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                      Preço Unit.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                      Total
                    </th>
                    {canEdit && <th className="px-4 py-3 w-12"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {quote.items.map((item) => (
                    <tr key={item.id} className="hover:bg-theme-table-hover">
                      <td className="px-4 py-4">
                        <div className="font-medium text-theme">
                          {item.material.code} - {item.material.description}
                        </div>
                        <div className="text-sm text-theme-muted">
                          {item.material.category?.name || "Sem categoria"} •{" "}
                          {item.material.unit}
                        </div>
                        {item.notes && (
                          <div className="text-sm text-theme-muted mt-1">
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-theme">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 text-right text-theme">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-theme">
                        {formatCurrency(item.totalPrice || item.quantity * item.unitPrice)}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-4">
                          <button className="p-1 text-red-400 hover:bg-red-900/20 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-theme-table-header">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right font-medium text-theme">
                      Subtotal:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-theme">
                      {formatCurrency(quote.totalValue)}
                    </td>
                    {canEdit && <td></td>}
                  </tr>
                  {quote.freightValue > 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-sm text-theme-secondary">
                        Frete:
                      </td>
                      <td className="px-4 py-2 text-right text-theme">
                        {formatCurrency(quote.freightValue)}
                      </td>
                      {canEdit && <td></td>}
                    </tr>
                  )}
                  {quote.discountPercent > 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-sm text-theme-secondary">
                        Desconto ({quote.discountPercent}%):
                      </td>
                      <td className="px-4 py-2 text-right text-green-400">
                        -{formatCurrency(quote.totalValue * (quote.discountPercent / 100))}
                      </td>
                      {canEdit && <td></td>}
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-medium text-theme mb-3">
                Observações
              </h2>
              <p className="text-theme-secondary whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Actions */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h3 className="font-medium text-theme mb-4">Status</h3>
            {canEdit ? (
              <select
                value={quote.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updateMutation.isPending}
                className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-blue-500"
              >
                <option value="DRAFT">Rascunho</option>
                <option value="PENDING">Pendente</option>
                <option value="SENT">Enviada</option>
                <option value="RECEIVED">Recebida</option>
              </select>
            ) : (
              <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${config.color}`}>
                {config.icon}
                {config.label}
              </span>
            )}
          </div>

          {/* Dates */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h3 className="font-medium text-theme mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-theme-muted" />
              Datas
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-muted">Solicitação:</span>
                <span className="font-medium text-theme">{formatDate(quote.requestDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Resposta:</span>
                <span className="font-medium text-theme">{formatDate(quote.responseDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Válida até:</span>
                <span className="font-medium text-theme">{formatDate(quote.validUntil)}</span>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h3 className="font-medium text-theme mb-4">Condições</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CreditCard className="w-4 h-4 text-theme-muted mt-0.5" />
                <div>
                  <div className="text-theme-muted">Pagamento</div>
                  <div className="font-medium text-theme">{quote.paymentTerms || "-"}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-theme-muted mt-0.5" />
                <div>
                  <div className="text-theme-muted">Entrega</div>
                  <div className="font-medium text-theme">{quote.deliveryTerms || "-"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Delete */}
          {canEdit && (
            <button
              onClick={() => {
                if (confirm("Tem certeza que deseja excluir esta cotação?")) {
                  deleteMutation.mutate({ id });
                }
              }}
              disabled={deleteMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-800 text-red-400 rounded-lg hover:bg-red-900/20 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Cotação
            </button>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-quote-title"
          onKeyDown={(e) => e.key === "Escape" && setShowRejectModal(false)}
        >
          <div className="bg-theme-card border border-theme rounded-lg p-6 w-full max-w-md mx-4">
            <h3 id="reject-quote-title" className="text-lg font-medium text-theme mb-4">
              Rejeitar Cotação
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-secondary mb-1">
                Motivo da rejeição (opcional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-red-500"
                placeholder="Informe o motivo..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-theme text-theme-secondary rounded-lg hover:bg-theme-hover"
              >
                Cancelar
              </button>
              <button
                onClick={() => rejectMutation.mutate({ id, reason: rejectReason || undefined })}
                disabled={rejectMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {rejectMutation.isPending ? "Rejeitando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
