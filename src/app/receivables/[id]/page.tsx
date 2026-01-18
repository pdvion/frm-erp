"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  DollarSign,
  ChevronLeft,
  CheckCircle,
  Loader2,
  Ban,
  CreditCard,
  Building2,
  History,
  Receipt,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: "Pendente", color: "text-yellow-800", bgColor: "bg-yellow-100" },
  PARTIAL: { label: "Parcialmente Recebido", color: "text-blue-800", bgColor: "bg-blue-100" },
  PAID: { label: "Recebido", color: "text-green-800", bgColor: "bg-green-100" },
  OVERDUE: { label: "Vencido", color: "text-red-800", bgColor: "bg-red-100" },
  CANCELLED: { label: "Cancelado", color: "text-gray-600", bgColor: "bg-gray-100" },
  WRITTEN_OFF: { label: "Baixado", color: "text-gray-600", bgColor: "bg-gray-100" },
};

export default function ReceivableDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentValue, setPaymentValue] = useState("");
  const [discountValue, setDiscountValue] = useState("0");
  const [interestValue, setInterestValue] = useState("0");
  const [fineValue, setFineValue] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const { data: receivable, isLoading, refetch } = trpc.receivables.byId.useQuery({ id });
  const { data: bankAccounts } = trpc.bankAccounts.list.useQuery();
  const [selectedBankAccount, setSelectedBankAccount] = useState("");

  const paymentMutation = trpc.receivables.registerPayment.useMutation({
    onSuccess: () => {
      setShowPaymentModal(false);
      resetPaymentForm();
      refetch();
    },
  });

  const cancelMutation = trpc.receivables.cancel.useMutation({
    onSuccess: () => {
      setShowCancelModal(false);
      setCancelReason("");
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
    setSelectedBankAccount("");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!receivable) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Título não encontrado</p>
      </div>
    );
  }

  const remaining = receivable.netValue - receivable.paidValue;
  const isOverdue = receivable.status === "PENDING" && new Date(receivable.dueDate) < new Date();
  const displayStatus = isOverdue ? "OVERDUE" : receivable.status;
  const config = statusConfig[displayStatus] || statusConfig.PENDING;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/receivables" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Título #{receivable.code}
                  {receivable.totalInstallments > 1 && (
                    <span className="text-gray-500 text-sm ml-2">
                      (Parcela {receivable.installmentNumber}/{receivable.totalInstallments})
                    </span>
                  )}
                </h1>
              </div>
            </div>
            <CompanySwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}>
                  {config.label}
                </span>
                {receivable.documentNumber && (
                  <span className="text-sm text-gray-500">
                    Doc: {receivable.documentNumber}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">{receivable.description}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <div className="text-xs text-gray-500">Emissão</div>
                  <div className="text-sm font-medium">{formatDate(receivable.issueDate)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Vencimento</div>
                  <div className={`text-sm font-medium ${isOverdue ? "text-red-600" : ""}`}>
                    {formatDate(receivable.dueDate)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Valor Original</div>
                  <div className="text-sm font-medium">{formatCurrency(receivable.originalValue)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Valor Líquido</div>
                  <div className="text-sm font-medium">{formatCurrency(receivable.netValue)}</div>
                </div>
              </div>
            </div>

            {/* Cliente */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Cliente</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Razão Social</div>
                  <div className="text-sm font-medium">{receivable.customer.companyName}</div>
                </div>
                {receivable.customer.tradeName && (
                  <div>
                    <div className="text-xs text-gray-500">Nome Fantasia</div>
                    <div className="text-sm font-medium">{receivable.customer.tradeName}</div>
                  </div>
                )}
                {receivable.customer.cnpj && (
                  <div>
                    <div className="text-xs text-gray-500">CNPJ</div>
                    <div className="text-sm font-medium">{receivable.customer.cnpj}</div>
                  </div>
                )}
                {receivable.customer.email && (
                  <div>
                    <div className="text-xs text-gray-500">Email</div>
                    <div className="text-sm font-medium">{receivable.customer.email}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Histórico de Recebimentos */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Histórico de Recebimentos</h3>
              </div>
              {receivable.payments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum recebimento registrado</p>
              ) : (
                <div className="space-y-3">
                  {receivable.payments.map((payment) => (
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
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resumo Financeiro */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Valor Original</span>
                  <span className="font-medium">{formatCurrency(receivable.originalValue)}</span>
                </div>
                {receivable.discountValue > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto</span>
                    <span>-{formatCurrency(receivable.discountValue)}</span>
                  </div>
                )}
                {receivable.interestValue > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Juros</span>
                    <span>+{formatCurrency(receivable.interestValue)}</span>
                  </div>
                )}
                {receivable.fineValue > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Multa</span>
                    <span>+{formatCurrency(receivable.fineValue)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between font-medium">
                  <span>Valor Líquido</span>
                  <span>{formatCurrency(receivable.netValue)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Recebido</span>
                  <span>{formatCurrency(receivable.paidValue)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Saldo</span>
                  <span className={remaining > 0 ? "text-red-600" : "text-green-600"}>
                    {formatCurrency(remaining)}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações */}
            {receivable.status !== "PAID" && receivable.status !== "CANCELLED" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ações</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setPaymentValue(remaining.toFixed(2));
                      setShowPaymentModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CreditCard className="w-4 h-4" />
                    Registrar Recebimento
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
                  {receivable.paidValue === 0 && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Ban className="w-4 h-4" />
                      Cancelar Título
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Recebimento */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Registrar Recebimento</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data do Recebimento
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Recebido
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentValue}
                  onChange={(e) => setPaymentValue(e.target.value)}
                  placeholder={remaining.toFixed(2)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Desconto</label>
                  <input
                    type="number"
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Juros</label>
                  <input
                    type="number"
                    step="0.01"
                    value={interestValue}
                    onChange={(e) => setInterestValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Multa</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fineValue}
                    onChange={(e) => setFineValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forma de Recebimento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Selecione...</option>
                  <option value="PIX">PIX</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              {bankAccounts && bankAccounts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conta Bancária
                  </label>
                  <select
                    value={selectedBankAccount}
                    onChange={(e) => setSelectedBankAccount(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Selecione...</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} - {account.bankName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  resetPaymentForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  paymentMutation.mutate({
                    receivableId: id,
                    paymentDate: new Date(paymentDate),
                    value: parseFloat(paymentValue) || remaining,
                    discountValue: parseFloat(discountValue) || 0,
                    interestValue: parseFloat(interestValue) || 0,
                    fineValue: parseFloat(fineValue) || 0,
                    paymentMethod: paymentMethod || undefined,
                    bankAccountId: selectedBankAccount || undefined,
                    notes: paymentNotes || undefined,
                  });
                }}
                disabled={paymentMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {paymentMutation.isPending ? "Processando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelamento */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cancelar Título</h3>
            <p className="text-gray-600 mb-4">
              Tem certeza que deseja cancelar este título? Esta ação não pode ser desfeita.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo do Cancelamento
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Informe o motivo..."
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  cancelMutation.mutate({ id, reason: cancelReason });
                }}
                disabled={!cancelReason || cancelMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {cancelMutation.isPending ? "Cancelando..." : "Confirmar Cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
