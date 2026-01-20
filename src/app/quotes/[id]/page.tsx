"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  ChevronLeft,
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

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Rascunho", color: "bg-gray-100 text-gray-800", icon: <FileText className="w-4 h-4" /> },
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  SENT: { label: "Enviada", color: "bg-blue-100 text-blue-800", icon: <Send className="w-4 h-4" /> },
  RECEIVED: { label: "Recebida", color: "bg-purple-100 text-purple-800", icon: <FileText className="w-4 h-4" /> },
  APPROVED: { label: "Aprovada", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
  REJECTED: { label: "Rejeitada", color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Cancelada", color: "bg-gray-100 text-gray-500", icon: <XCircle className="w-4 h-4" /> },
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="font-medium text-red-900">Erro ao carregar cotação</h3>
            <p className="text-red-700 text-sm">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/quotes" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Cotação #{quote.code.toString().padStart(6, "0")}
                </h1>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                  {config.icon}
                  {config.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CompanySwitcher />
              {canEdit && (
                <Link
                  href={`/quotes/${id}/edit`}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
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
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gray-400" />
                Fornecedor
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Razão Social</div>
                  <div className="font-medium text-gray-900">
                    {quote.supplier.companyName}
                  </div>
                </div>
                {quote.supplier.tradeName && (
                  <div>
                    <div className="text-sm text-gray-500">Nome Fantasia</div>
                    <div className="font-medium text-gray-900">
                      {quote.supplier.tradeName}
                    </div>
                  </div>
                )}
                {quote.supplier.cnpj && (
                  <div>
                    <div className="text-sm text-gray-500">CNPJ</div>
                    <div className="font-medium text-gray-900">
                      {quote.supplier.cnpj}
                    </div>
                  </div>
                )}
                {quote.supplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{quote.supplier.phone}</span>
                  </div>
                )}
                {quote.supplier.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{quote.supplier.email}</span>
                  </div>
                )}
                {quote.supplier.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>
                      {quote.supplier.city}
                      {quote.supplier.state && ` - ${quote.supplier.state}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-400" />
                  Itens ({quote.items.length})
                </h2>
                {canEdit && (
                  <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                    <Plus className="w-4 h-4" />
                    Adicionar Item
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Material
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Quantidade
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Preço Unit.
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                      {canEdit && <th className="px-4 py-3 w-12"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {quote.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">
                            {item.material.code} - {item.material.description}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.material.category?.name || "Sem categoria"} •{" "}
                            {item.material.unit}
                          </div>
                          {item.notes && (
                            <div className="text-sm text-gray-400 mt-1">
                              {item.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-900">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-gray-900">
                          {formatCurrency(item.totalPrice || item.quantity * item.unitPrice)}
                        </td>
                        {canEdit && (
                          <td className="px-4 py-4">
                            <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-medium text-gray-900">
                        Subtotal:
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {formatCurrency(quote.totalValue)}
                      </td>
                      {canEdit && <td></td>}
                    </tr>
                    {quote.freightValue > 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right text-sm text-gray-500">
                          Frete:
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900">
                          {formatCurrency(quote.freightValue)}
                        </td>
                        {canEdit && <td></td>}
                      </tr>
                    )}
                    {quote.discountPercent > 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right text-sm text-gray-500">
                          Desconto ({quote.discountPercent}%):
                        </td>
                        <td className="px-4 py-2 text-right text-green-600">
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
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-3">
                  Observações
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Status</h3>
              {canEdit ? (
                <select
                  value={quote.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updateMutation.isPending}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                Datas
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Solicitação:</span>
                  <span className="font-medium">{formatDate(quote.requestDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Resposta:</span>
                  <span className="font-medium">{formatDate(quote.responseDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Válida até:</span>
                  <span className="font-medium">{formatDate(quote.validUntil)}</span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Condições</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-gray-500">Pagamento</div>
                    <div className="font-medium">{quote.paymentTerms || "-"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Truck className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-gray-500">Entrega</div>
                    <div className="font-medium">{quote.deliveryTerms || "-"}</div>
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Cotação
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Reject Modal */}
      {showRejectModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-quote-title"
          onKeyDown={(e) => e.key === "Escape" && setShowRejectModal(false)}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 id="reject-quote-title" className="text-lg font-medium text-gray-900 mb-4">
              Rejeitar Cotação
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo da rejeição (opcional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Informe o motivo..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
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
