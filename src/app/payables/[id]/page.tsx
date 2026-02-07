"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  DollarSign,
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
  CANCELLED: { label: "Cancelado", color: "text-theme-secondary", bgColor: "bg-theme-tertiary" },
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
      <div className="space-y-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!payable) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <div className="text-center">
          <DollarSign className="w-12 h-12 text-theme-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme mb-2">Título não encontrado</h3>
          <Link href="/payables" className="text-blue-600 hover:text-indigo-800">
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
      toast.warning("Informe um valor válido");
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
    <div className="space-y-6">
      <PageHeader
        title={`Título #${payable.code}`}
        subtitle={payable.description}
        icon={<DollarSign className="w-6 h-6" />}
        backHref="/payables"
        module="finance"
        actions={
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}>
              {config.label}
            </span>
            {canPay && (
              <Button
                variant="outline"
                onClick={() => {
                  setRescheduleDate(new Date(payable.dueDate).toISOString().split("T")[0]);
                  setShowRescheduleModal(true);
                }}
                leftIcon={<Calendar className="w-4 h-4" />}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                Reprogramar
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(true)}
                leftIcon={<Ban className="w-4 h-4" />}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Cancelar
              </Button>
            )}
            {canPay && (
              <Button
                onClick={() => {
                  setPaymentValue(balance.toFixed(2));
                  setShowPaymentModal(true);
                }}
                leftIcon={<CreditCard className="w-4 h-4" />}
                className="bg-green-600 hover:bg-green-700"
              >
                Registrar Pagamento
              </Button>
            )}
          </div>
        }
      />

      <div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados do Título */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h3 className="text-lg font-medium text-theme mb-4">Dados do Título</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-theme-muted">Descrição</label>
                  <p className="font-medium text-theme">{payable.description}</p>
                </div>
                <div>
                  <label className="text-sm text-theme-muted">Tipo</label>
                  <p className="font-medium text-theme">{payable.documentType}</p>
                </div>
                <div>
                  <label className="text-sm text-theme-muted">Documento</label>
                  <p className="font-medium text-theme">{payable.documentNumber || "-"}</p>
                </div>
                <div>
                  <label className="text-sm text-theme-muted">Parcela</label>
                  <p className="font-medium text-theme">
                    {payable.installmentNumber}/{payable.totalInstallments}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-theme-muted">Emissão</label>
                  <p className="font-medium text-theme">{formatDate(payable.issueDate)}</p>
                </div>
                <div>
                  <label className="text-sm text-theme-muted">Vencimento</label>
                  <p className={`font-medium ${isOverdue ? "text-red-600" : "text-theme"}`}>
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
                <div className="mt-4 pt-4 border-t border-theme">
                  <label className="text-sm text-theme-muted">Observações</label>
                  <p className="text-theme-secondary whitespace-pre-wrap">{payable.notes}</p>
                </div>
              )}

              {payable.barcode && (
                <div className="mt-4 pt-4 border-t border-theme">
                  <label className="text-sm text-theme-muted">Código de Barras</label>
                  <p className="font-mono text-sm text-theme bg-theme-tertiary p-2 rounded">
                    {payable.barcode}
                  </p>
                </div>
              )}
            </div>

            {/* Retenções de Impostos - VIO-650 */}
            {payable.hasWithholding && (
              <div className="bg-theme-card rounded-lg border border-theme p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="w-5 h-5 text-theme-muted" />
                  <h3 className="text-lg font-medium text-theme">Retenções de Impostos</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Number(payable.withholdingIr || 0) > 0 && (
                    <div>
                      <label className="text-sm text-theme-muted">IR</label>
                      <p className="font-medium text-theme">{formatCurrency(Number(payable.withholdingIr))}</p>
                    </div>
                  )}
                  {Number(payable.withholdingIss || 0) > 0 && (
                    <div>
                      <label className="text-sm text-theme-muted">ISS</label>
                      <p className="font-medium text-theme">{formatCurrency(Number(payable.withholdingIss))}</p>
                    </div>
                  )}
                  {Number(payable.withholdingInss || 0) > 0 && (
                    <div>
                      <label className="text-sm text-theme-muted">INSS</label>
                      <p className="font-medium text-theme">{formatCurrency(Number(payable.withholdingInss))}</p>
                    </div>
                  )}
                  {Number(payable.withholdingPis || 0) > 0 && (
                    <div>
                      <label className="text-sm text-theme-muted">PIS</label>
                      <p className="font-medium text-theme">{formatCurrency(Number(payable.withholdingPis))}</p>
                    </div>
                  )}
                  {Number(payable.withholdingCofins || 0) > 0 && (
                    <div>
                      <label className="text-sm text-theme-muted">COFINS</label>
                      <p className="font-medium text-theme">{formatCurrency(Number(payable.withholdingCofins))}</p>
                    </div>
                  )}
                  {Number(payable.withholdingCsll || 0) > 0 && (
                    <div>
                      <label className="text-sm text-theme-muted">CSLL</label>
                      <p className="font-medium text-theme">{formatCurrency(Number(payable.withholdingCsll))}</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-theme">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-theme-muted">Total de Retenções</span>
                    <span className="font-bold text-theme">
                      {formatCurrency(
                        (payable.withholdingIr || 0) +
                        (payable.withholdingIss || 0) +
                        (payable.withholdingInss || 0) +
                        (payable.withholdingPis || 0) +
                        (payable.withholdingCofins || 0) +
                        (payable.withholdingCsll || 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Fornecedor */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-theme-muted" />
                <h3 className="text-lg font-medium text-theme">Fornecedor</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-theme-muted">Razão Social</label>
                  <p className="font-medium text-theme">{payable.supplier.companyName}</p>
                </div>
                <div>
                  <label className="text-sm text-theme-muted">Nome Fantasia</label>
                  <p className="font-medium text-theme">{payable.supplier.tradeName || "-"}</p>
                </div>
                <div>
                  <label className="text-sm text-theme-muted">CNPJ</label>
                  <p className="font-medium text-theme">{payable.supplier.cnpj || "-"}</p>
                </div>
                <div>
                  <label className="text-sm text-theme-muted">Código</label>
                  <p className="font-medium text-theme">{payable.supplier.code}</p>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href={`/suppliers/${payable.supplier.id}`}
                  className="text-blue-600 hover:text-indigo-800 text-sm"
                >
                  Ver cadastro do fornecedor →
                </Link>
              </div>
            </div>

            {/* NFe Vinculada */}
            {payable.invoice && (
              <div className="bg-theme-card rounded-lg border border-theme p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-theme-muted" />
                  <h3 className="text-lg font-medium text-theme">NFe de Origem</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-theme-muted">Número</label>
                    <p className="font-medium text-theme">{payable.invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm text-theme-muted">Chave de Acesso</label>
                    <p className="font-mono text-xs text-theme">{payable.invoice.accessKey}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/invoices/${payable.invoice.id}`}
                    className="text-blue-600 hover:text-indigo-800 text-sm"
                  >
                    Ver detalhes da NFe →
                  </Link>
                </div>
              </div>
            )}

            {/* Histórico de Pagamentos */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-theme-muted" />
                <h3 className="text-lg font-medium text-theme">Histórico de Pagamentos</h3>
              </div>
              {payable.payments.length === 0 ? (
                <p className="text-theme-muted text-center py-4">Nenhum pagamento registrado</p>
              ) : (
                <div className="space-y-3">
                  {payable.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-theme-tertiary rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-theme">
                          {formatCurrency(payment.value)}
                        </div>
                        <div className="text-sm text-theme-muted">
                          {formatDate(payment.paymentDate)}
                          {payment.paymentMethod && ` • ${payment.paymentMethod}`}
                        </div>
                        {(payment.discountValue > 0 || payment.interestValue > 0 || payment.fineValue > 0) && (
                          <div className="text-xs text-theme-muted mt-1">
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
                          <div className="text-xs text-theme-muted mt-1">{payment.notes}</div>
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
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h3 className="text-lg font-medium text-theme mb-4">Valores</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-theme-muted">Valor Original</span>
                  <span className="font-medium text-theme">{formatCurrency(payable.originalValue)}</span>
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
                <div className="flex justify-between pt-3 border-t border-theme">
                  <span className="font-medium text-theme">Valor Líquido</span>
                  <span className="font-bold text-theme">{formatCurrency(payable.netValue)}</span>
                </div>
                {payable.paidValue > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Valor Pago</span>
                    <span>-{formatCurrency(payable.paidValue)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-theme">
                  <span className="font-bold text-theme">Saldo Devedor</span>
                  <span className={`font-bold text-xl ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatCurrency(balance)}
                  </span>
                </div>
              </div>

              {payable.status === "PAID" && payable.paidAt && (
                <div className="mt-4 pt-4 border-t border-theme">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Pago em {formatDateTime(payable.paidAt)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Ações Rápidas */}
            {canPay && (
              <div className="bg-theme-card rounded-lg border border-theme p-6">
                <h3 className="text-lg font-medium text-theme mb-4">Ações Rápidas</h3>
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      setPaymentValue(balance.toFixed(2));
                      setShowPaymentModal(true);
                    }}
                    leftIcon={<CreditCard className="w-4 h-4" />}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Baixa Total ({formatCurrency(balance)})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPaymentValue("");
                      setShowPaymentModal(true);
                    }}
                    leftIcon={<Receipt className="w-4 h-4" />}
                    className="w-full"
                  >
                    Baixa Parcial
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-modal-title"
          onKeyDown={(e) => e.key === "Escape" && setShowPaymentModal(false)}
        >
          <div className="bg-theme-card rounded-lg p-6 w-full max-w-md">
            <h3 id="payment-modal-title" className="text-lg font-medium text-theme mb-4">Registrar Pagamento</h3>
            
            <div className="space-y-4">
              <Input
                label="Data do Pagamento"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />

              <div>
                <Input
                  label="Valor do Pagamento *"
                  type="number"
                  step="0.01"
                  value={paymentValue}
                  onChange={(e) => setPaymentValue(e.target.value)}
                  placeholder={balance.toFixed(2)}
                />
                <p className="text-xs text-theme-muted mt-1">Saldo: {formatCurrency(balance)}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Input
                  label="Desconto"
                  type="number"
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
                <Input
                  label="Juros"
                  type="number"
                  step="0.01"
                  value={interestValue}
                  onChange={(e) => setInterestValue(e.target.value)}
                />
                <Input
                  label="Multa"
                  type="number"
                  step="0.01"
                  value={fineValue}
                  onChange={(e) => setFineValue(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Forma de Pagamento
                </label>
                <Select
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  placeholder="Selecione..."
                  options={[
                    { value: "Boleto", label: "Boleto" },
                    { value: "Transferência", label: "Transferência" },
                    { value: "PIX", label: "PIX" },
                    { value: "Cartão", label: "Cartão" },
                    { value: "Dinheiro", label: "Dinheiro" },
                    { value: "Cheque", label: "Cheque" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Observações
                </label>
                <Textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            {paymentMutation.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {paymentMutation.error.message}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentModal(false);
                  resetPaymentForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePayment}
                isLoading={paymentMutation.isPending}
                leftIcon={<CheckCircle className="w-4 h-4" />}
                className="bg-green-600 hover:bg-green-700"
              >
                Confirmar Pagamento
              </Button>
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
          <div className="bg-theme-card rounded-lg p-6 w-full max-w-md">
            <h3 id="reschedule-modal-title" className="text-lg font-medium text-theme mb-4">Reprogramar Vencimento</h3>
            
            <div className="space-y-4">
              <Input
                label="Nova Data de Vencimento *"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Motivo da Reprogramação *
                </label>
                <Textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  rows={3}
                  placeholder="Informe o motivo da reprogramação..."
                />
              </div>
            </div>

            {rescheduleMutation.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {rescheduleMutation.error.message}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRescheduleModal(false);
                  setRescheduleDate("");
                  setRescheduleReason("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!rescheduleDate || !rescheduleReason.trim()) {
                    toast.warning("Preencha todos os campos obrigatórios");
                    return;
                  }
                  rescheduleMutation.mutate({
                    payableId: id,
                    newDueDate: new Date(rescheduleDate),
                    reason: rescheduleReason,
                  });
                }}
                isLoading={rescheduleMutation.isPending}
                leftIcon={<Calendar className="w-4 h-4" />}
              >
                Confirmar Reprogramação
              </Button>
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
          <div className="bg-theme-card rounded-lg p-6 w-full max-w-md">
            <h3 id="cancel-payable-title" className="text-lg font-medium text-theme mb-4">Cancelar Título</h3>
            
            <p className="text-theme-secondary mb-4">
              Tem certeza que deseja cancelar este título? Esta ação não pode ser desfeita.
            </p>

            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">
                Motivo do Cancelamento *
              </label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Informe o motivo do cancelamento..."
              />
            </div>

            {cancelMutation.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {cancelMutation.error.message}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
              >
                Voltar
              </Button>
              <Button
                onClick={() => {
                  if (!cancelReason.trim()) {
                    toast.warning("Informe o motivo do cancelamento");
                    return;
                  }
                  cancelMutation.mutate({ id, reason: cancelReason });
                }}
                isLoading={cancelMutation.isPending}
                leftIcon={<Ban className="w-4 h-4" />}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirmar Cancelamento
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
