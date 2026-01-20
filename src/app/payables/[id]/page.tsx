"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  DollarSign,
  ChevronLeft,
  CheckCircle,
  Loader2,
  Ban,
  CreditCard,
  FileText,
  Building2,
  History,
  Receipt,
  Calendar,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: "Pendente", color: "text-yellow-800", bgColor: "bg-yellow-100" },
  PARTIAL: { label: "Parcialmente Pago", color: "text-blue-800", bgColor: "bg-blue-100" },
  PAID: { label: "Pago", color: "text-green-800", bgColor: "bg-green-100" },
  OVERDUE: { label: "Vencido", color: "text-red-800", bgColor: "bg-red-100" },
  CANCELLED: { label: "Cancelado", color: "text-gray-600", bgColor: "bg-gray-100" },
};

export default function PayableDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");

  // Form de pagamento
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentValue, setPaymentValue] = useState("");
  const [discountValue, setDiscountValue] = useState("0");
  const [interestValue, setInterestValue] = useState("0");
  const [fineValue, setFineValue] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const { data: payable, isLoading, refetch } = trpc.payables.byId.useQuery({ id });

  const paymentMutation = trpc.payables.registerPayment.useMutation({
    onSuccess: () => {
      setShowPaymentModal(false);
      resetPaymentForm();
      refetch();
    },
  });

  const cancelMutation = trpc.payables.cancel.useMutation({
    onSuccess: () => {
      setShowCancelModal(false);
      refetch();
    },
  });

  const rescheduleMutation = trpc.payables.reschedule.useMutation({
    onSuccess: () => {
      setShowRescheduleModal(false);
      setRescheduleDate("");
      setRescheduleReason("");
      refetch();
    },
  });

  const resetPaymentForm = () => {
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentValue("");
    setDiscountValue("0");
    setInterestValue("0");
    setFineValue("0");
    setPaymentMethod("");
    setPaymentNotes("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!payable) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Título não encontrado</h3>
          <Link href="/payables" className="text-indigo-600 hover:text-indigo-800">
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = payable.status === "PENDING" && new Date(payable.dueDate) < today;
  const displayStatus = isOverdue ? "OVERDUE" : payable.status;
  const config = statusConfig[displayStatus];
  const balance = payable.netValue - payable.paidValue;
  const canPay = payable.status !== "PAID" && payable.status !== "CANCELLED";
  const canCancel = payable.status !== "PAID" && payable.status !== "CANCELLED" && payable.paidValue === 0;

  const handlePayment = () => {
    const value = parseFloat(paymentValue);
    if (isNaN(value) || value <= 0) {
      alert("Informe um valor válido");
      return;
    }

    paymentMutation.mutate({
      payableId: id,
      paymentDate: new Date(paymentDate),
      value,
      discountValue: parseFloat(discountValue) || 0,
      interestValue: parseFloat(interestValue) || 0,
      fineValue: parseFloat(fineValue) || 0,
      paymentMethod: paymentMethod || undefined,
      notes: paymentNotes || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/payables" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-indigo-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Título #{payable.code}
                </h1>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}>
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <CompanySwitcher />
              {canPay && (
                <button
                  onClick={() => {
                    setRescheduleDate(new Date(payable.dueDate).toISOString().split("T")[0]);
                    setShowRescheduleModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50"
                >
                  <Calendar className="w-4 h-4" />
                  Reprogramar
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                >
                  <Ban className="w-4 h-4" />
                  Cancelar
                </button>
              )}
              {canPay && (
                <button
                  onClick={() => {
                    setPaymentValue(balance.toFixed(2));
                    setShowPaymentModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CreditCard className="w-4 h-4" />
                  Registrar Pagamento
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados do Título */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Dados do Título</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Descrição</label>
                  <p className="font-medium text-gray-900">{payable.description}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Tipo</label>
                  <p className="font-medium text-gray-900">{payable.documentType}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Documento</label>
                  <p className="font-medium text-gray-900">{payable.documentNumber || "-"}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Parcela</label>
                  <p className="font-medium text-gray-900">
                    {payable.installmentNumber}/{payable.totalInstallments}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Emissão</label>
                  <p className="font-medium text-gray-900">{formatDate(payable.issueDate)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Vencimento</label>
                  <p className={`font-medium ${isOverdue ? "text-red-600" : "text-gray-900"}`}>
                    {formatDate(payable.dueDate)}
                    {isOverdue && (
                      <span className="ml-2 text-sm text-red-500">
                        ({Math.floor((today.getTime() - new Date(payable.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias atraso)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {payable.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="text-sm text-gray-500">Observações</label>
                  <p className="text-gray-700 whitespace-pre-wrap">{payable.notes}</p>
                </div>
              )}

              {payable.barcode && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="text-sm text-gray-500">Código de Barras</label>
                  <p className="font-mono text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {payable.barcode}
                  </p>
                </div>
              )}
            </div>

            {/* Fornecedor */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Fornecedor</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Razão Social</label>
                  <p className="font-medium text-gray-900">{payable.supplier.companyName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Nome Fantasia</label>
                  <p className="font-medium text-gray-900">{payable.supplier.tradeName || "-"}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">CNPJ</label>
                  <p className="font-medium text-gray-900">{payable.supplier.cnpj || "-"}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Código</label>
                  <p className="font-medium text-gray-900">{payable.supplier.code}</p>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href={`/suppliers/${payable.supplier.id}`}
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  Ver cadastro do fornecedor →
                </Link>
              </div>
            </div>

            {/* NFe Vinculada */}
            {payable.invoice && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">NFe de Origem</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Número</label>
                    <p className="font-medium text-gray-900">{payable.invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Chave de Acesso</label>
                    <p className="font-mono text-xs text-gray-900">{payable.invoice.accessKey}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/invoices/${payable.invoice.id}`}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    Ver detalhes da NFe →
                  </Link>
                </div>
              </div>
            )}

            {/* Histórico de Pagamentos */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Histórico de Pagamentos</h3>
              </div>
              {payable.payments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum pagamento registrado</p>
              ) : (
                <div className="space-y-3">
                  {payable.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {formatCurrency(payment.value)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(payment.paymentDate)}
                          {payment.paymentMethod && ` • ${payment.paymentMethod}`}
                        </div>
                        {(payment.discountValue > 0 || payment.interestValue > 0 || payment.fineValue > 0) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {payment.discountValue > 0 && (
                              <span className="text-green-600 mr-2">
                                Desc: {formatCurrency(payment.discountValue)}
                              </span>
                            )}
                            {payment.interestValue > 0 && (
                              <span className="text-red-600 mr-2">
                                Juros: {formatCurrency(payment.interestValue)}
                              </span>
                            )}
                            {payment.fineValue > 0 && (
                              <span className="text-red-600">
                                Multa: {formatCurrency(payment.fineValue)}
                              </span>
                            )}
                          </div>
                        )}
                        {payment.notes && (
                          <div className="text-xs text-gray-500 mt-1">{payment.notes}</div>
                        )}
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Valores */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Valores</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Valor Original</span>
                  <span className="font-medium text-gray-900">{formatCurrency(payable.originalValue)}</span>
                </div>
                {payable.discountValue > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto</span>
                    <span>-{formatCurrency(payable.discountValue)}</span>
                  </div>
                )}
                {payable.interestValue > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Juros</span>
                    <span>+{formatCurrency(payable.interestValue)}</span>
                  </div>
                )}
                {payable.fineValue > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Multa</span>
                    <span>+{formatCurrency(payable.fineValue)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="font-medium text-gray-900">Valor Líquido</span>
                  <span className="font-bold text-gray-900">{formatCurrency(payable.netValue)}</span>
                </div>
                {payable.paidValue > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Valor Pago</span>
                    <span>-{formatCurrency(payable.paidValue)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Saldo Devedor</span>
                  <span className={`font-bold text-xl ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatCurrency(balance)}
                  </span>
                </div>
              </div>

              {payable.status === "PAID" && payable.paidAt && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Pago em {formatDateTime(payable.paidAt)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Ações Rápidas */}
            {canPay && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setPaymentValue(balance.toFixed(2));
                      setShowPaymentModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CreditCard className="w-4 h-4" />
                    Baixa Total ({formatCurrency(balance)})
                  </button>
                  <button
                    onClick={() => {
                      setPaymentValue("");
                      setShowPaymentModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <Receipt className="w-4 h-4" />
                    Baixa Parcial
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-modal-title"
          onKeyDown={(e) => e.key === "Escape" && setShowPaymentModal(false)}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 id="payment-modal-title" className="text-lg font-medium text-gray-900 mb-4">Registrar Pagamento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data do Pagamento
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor do Pagamento *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentValue}
                  onChange={(e) => setPaymentValue(e.target.value)}
                  placeholder={balance.toFixed(2)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Saldo: {formatCurrency(balance)}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desconto</label>
                  <input
                    type="number"
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Juros</label>
                  <input
                    type="number"
                    step="0.01"
                    value={interestValue}
                    onChange={(e) => setInterestValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Multa</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fineValue}
                    onChange={(e) => setFineValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Selecione...</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Transferência">Transferência</option>
                  <option value="PIX">PIX</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {paymentMutation.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {paymentMutation.error.message}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  resetPaymentForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handlePayment}
                disabled={paymentMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {paymentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reschedule-modal-title"
          onKeyDown={(e) => e.key === "Escape" && setShowRescheduleModal(false)}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 id="reschedule-modal-title" className="text-lg font-medium text-gray-900 mb-4">Reprogramar Vencimento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Data de Vencimento *
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo da Reprogramação *
                </label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  rows={3}
                  placeholder="Informe o motivo da reprogramação..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {rescheduleMutation.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {rescheduleMutation.error.message}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setRescheduleDate("");
                  setRescheduleReason("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!rescheduleDate || !rescheduleReason.trim()) {
                    alert("Preencha todos os campos obrigatórios");
                    return;
                  }
                  rescheduleMutation.mutate({
                    payableId: id,
                    newDueDate: new Date(rescheduleDate),
                    reason: rescheduleReason,
                  });
                }}
                disabled={rescheduleMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {rescheduleMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
                Confirmar Reprogramação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-payable-title"
          onKeyDown={(e) => e.key === "Escape" && setShowCancelModal(false)}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 id="cancel-payable-title" className="text-lg font-medium text-gray-900 mb-4">Cancelar Título</h3>
            
            <p className="text-gray-600 mb-4">
              Tem certeza que deseja cancelar este título? Esta ação não pode ser desfeita.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo do Cancelamento *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Informe o motivo do cancelamento..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {cancelMutation.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {cancelMutation.error.message}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  if (!cancelReason.trim()) {
                    alert("Informe o motivo do cancelamento");
                    return;
                  }
                  cancelMutation.mutate({ id, reason: cancelReason });
                }}
                disabled={cancelMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Ban className="w-4 h-4" />
                )}
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
