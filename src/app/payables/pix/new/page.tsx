"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  QrCode, 
  ArrowLeft,
  Send,
  User,
  Building2,
  Mail,
  Phone,
  Key,
  DollarSign,
  FileText,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";

type PixKeyType = "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP";

const keyTypeConfig: Record<PixKeyType, { label: string; icon: typeof User; placeholder: string; mask?: string }> = {
  CPF: { label: "CPF", icon: User, placeholder: "000.000.000-00" },
  CNPJ: { label: "CNPJ", icon: Building2, placeholder: "00.000.000/0000-00" },
  EMAIL: { label: "E-mail", icon: Mail, placeholder: "email@exemplo.com" },
  PHONE: { label: "Telefone", icon: Phone, placeholder: "+55 (00) 00000-0000" },
  EVP: { label: "Chave Aleatória", icon: Key, placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
};

export default function NewPixPage() {
  const router = useRouter();
  
  const [step, setStep] = useState<"key" | "confirm" | "success">("key");
  const [keyType, setKeyType] = useState<PixKeyType>("CPF");
  const [pixKey, setPixKey] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recipientData, setRecipientData] = useState<{
    name: string;
    document: string;
    bank: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const validateKeyMutation = trpc.payables.validatePixKey.useMutation({
    onSuccess: (data) => {
      if (data.valid) {
        setRecipientData({
          name: data.recipientName || "Nome não disponível",
          document: data.recipientDocument || "",
          bank: data.bankName || "Banco não identificado",
        });
        setStep("confirm");
        setError(null);
      } else {
        setError(data.error || "Chave PIX inválida");
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const sendPixMutation = trpc.payables.sendPix.useMutation({
    onSuccess: (data) => {
      setTransactionId(data.transactionId);
      setStep("success");
    },
    onError: (err) => {
      setError(err.message);
      setIsSending(false);
    },
  });

  const handleValidateKey = async () => {
    if (!pixKey || !value) {
      setError("Preencha a chave PIX e o valor");
      return;
    }

    const numericValue = parseFloat(value.replace(/[^\d,]/g, "").replace(",", "."));
    if (isNaN(numericValue) || numericValue <= 0) {
      setError("Valor inválido");
      return;
    }

    setIsValidating(true);
    setError(null);
    
    try {
      await validateKeyMutation.mutateAsync({
        keyType,
        pixKey: pixKey.replace(/\D/g, keyType === "EMAIL" ? "" : ""),
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSendPix = async () => {
    const numericValue = parseFloat(value.replace(/[^\d,]/g, "").replace(",", "."));
    
    setIsSending(true);
    setError(null);

    try {
      await sendPixMutation.mutateAsync({
        keyType,
        pixKey: pixKey.replace(/\D/g, keyType === "EMAIL" ? "" : ""),
        value: numericValue,
        description: description || undefined,
        recipientName: recipientData?.name,
        recipientDocument: recipientData?.document,
      });
    } catch {
      setIsSending(false);
    }
  };

  const formatCurrency = (val: string) => {
    const numeric = val.replace(/\D/g, "");
    const number = parseInt(numeric, 10) / 100;
    if (isNaN(number)) return "";
    return number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setValue(formatted);
  };

  const KeyIcon = keyTypeConfig[keyType].icon;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo PIX"
        icon={<QrCode className="w-6 h-6 text-purple-600" />}
        backHref="/payables/pix"
        actions={
          <Link
            href="/payables/pix"
            className="flex items-center gap-2 px-4 py-2 text-theme-secondary hover:text-theme"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
        }
      />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === "key" ? "bg-blue-600 text-white" : "bg-green-500 text-white"
            }`}>
              {step === "key" ? "1" : <CheckCircle className="w-5 h-5" />}
            </div>
            <div className={`w-16 h-1 ${step !== "key" ? "bg-green-500" : "bg-theme-tertiary"}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === "confirm" ? "bg-blue-600 text-white" : step === "success" ? "bg-green-500 text-white" : "bg-theme-tertiary text-theme-secondary"
            }`}>
              {step === "success" ? <CheckCircle className="w-5 h-5" /> : "2"}
            </div>
            <div className={`w-16 h-1 ${step === "success" ? "bg-green-500" : "bg-theme-tertiary"}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === "success" ? "bg-green-500 text-white" : "bg-theme-tertiary text-theme-secondary"
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Erro</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Step 1: Key Input */}
        {step === "key" && (
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h2 className="text-lg font-medium text-theme mb-6">Dados do PIX</h2>

            {/* Key Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Tipo de Chave
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(keyTypeConfig) as PixKeyType[]).map((type) => {
                  const config = keyTypeConfig[type];
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        setKeyType(type);
                        setPixKey("");
                      }}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                        keyType === type
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-theme hover:border-theme text-theme-secondary"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Key Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Chave PIX
              </label>
              <div className="relative">
                <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
                <input
                  type={keyType === "EMAIL" ? "email" : "text"}
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder={keyTypeConfig[keyType].placeholder}
                  className="w-full pl-10 pr-4 py-3 border border-theme-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Value Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Valor
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
                <input
                  type="text"
                  value={value}
                  onChange={handleValueChange}
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-3 border border-theme-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right text-lg font-medium"
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Descrição (opcional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-theme-muted" />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Pagamento fornecedor, Transferência..."
                  rows={2}
                  className="w-full pl-10 pr-4 py-3 border border-theme-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleValidateKey}
              disabled={!pixKey || !value}
              isLoading={isValidating}
              leftIcon={<Send className="w-5 h-5" />}
              className="w-full"
            >
              {isValidating ? "Validando chave..." : "Continuar"}
            </Button>
          </div>
        )}

        {/* Step 2: Confirmation */}
        {step === "confirm" && recipientData && (
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h2 className="text-lg font-medium text-theme mb-6">Confirmar PIX</h2>

            {/* Recipient Info */}
            <div className="bg-theme-tertiary rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-theme-muted mb-3">Destinatário</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-theme-secondary">Nome</span>
                  <span className="font-medium text-theme">{recipientData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-secondary">Documento</span>
                  <span className="font-mono text-theme">{recipientData.document}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-secondary">Banco</span>
                  <span className="text-theme">{recipientData.bank}</span>
                </div>
              </div>
            </div>

            {/* Transaction Info */}
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-purple-700 mb-3">Detalhes da Transação</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-purple-600">Chave PIX</span>
                  <span className="font-mono text-purple-900">{pixKey}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-600">Tipo</span>
                  <span className="text-purple-900">{keyTypeConfig[keyType].label}</span>
                </div>
                {description && (
                  <div className="flex justify-between">
                    <span className="text-purple-600">Descrição</span>
                    <span className="text-purple-900">{description}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-purple-200">
                  <span className="font-medium text-purple-700">Valor</span>
                  <span className="text-xl font-bold text-purple-900">R$ {value}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep("key")}
                className="flex-1 px-6 py-3 border border-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover transition-colors"
              >
                Voltar
              </button>
              <Button
                onClick={handleSendPix}
                isLoading={isSending}
                leftIcon={<Send className="w-5 h-5" />}
                className="flex-1"
              >
                {isSending ? "Enviando..." : "Confirmar PIX"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === "success" && (
          <div className="bg-theme-card rounded-xl border border-theme p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-medium text-theme mb-2">PIX Enviado!</h2>
            <p className="text-theme-secondary mb-6">
              Sua transação foi processada com sucesso.
            </p>

            <div className="bg-theme-tertiary rounded-lg p-4 mb-6">
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-theme-secondary">ID da Transação</span>
                  <span className="font-mono text-sm text-theme">{transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-secondary">Destinatário</span>
                  <span className="text-theme">{recipientData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-secondary">Valor</span>
                  <span className="font-bold text-theme">R$ {value}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push("/payables/pix")}
                className="flex-1 px-6 py-3 border border-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover transition-colors"
              >
                Ver Transações
              </button>
              <Button
                onClick={() => {
                  setStep("key");
                  setPixKey("");
                  setValue("");
                  setDescription("");
                  setRecipientData(null);
                  setTransactionId(null);
                }}
                className="flex-1"
              >
                Novo PIX
              </Button>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <QrCode className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Informações</h4>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• Transações PIX são processadas instantaneamente</li>
                <li>• Verifique os dados do destinatário antes de confirmar</li>
                <li>• O comprovante estará disponível após a conclusão</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
