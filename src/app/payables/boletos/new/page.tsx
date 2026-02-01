"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/formatters";
import {
  FileBarChart,
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Copy,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

const banks = [
  { code: "001", name: "Banco do Brasil" },
  { code: "033", name: "Santander" },
  { code: "104", name: "Caixa Econômica" },
  { code: "237", name: "Bradesco" },
  { code: "341", name: "Itaú" },
  { code: "756", name: "Sicoob" },
] as const;

type BankCode = typeof banks[number]["code"];

export default function NewBoletoPage() {
  const [form, setForm] = useState({
    bankCode: "001" as BankCode,
    valor: "",
    dataVencimento: "",
    nossoNumero: "",
    agencia: "",
    conta: "",
    convenio: "",
    carteira: "",
    codigoCedente: "",
  });
  const [result, setResult] = useState<{
    codigoBarras: string;
    linhaDigitavel: string;
    valor: number;
    dataVencimento: Date;
  } | null>(null);
  const [copied, setCopied] = useState<"barras" | "linha" | null>(null);

  const generateMutation = trpc.payables.generateBarcode.useMutation({
    onSuccess: (data) => {
      setResult({
        codigoBarras: data.codigoBarras,
        linhaDigitavel: data.linhaDigitavel,
        valor: data.valor,
        dataVencimento: data.dataVencimento,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    generateMutation.mutate({
      bankCode: form.bankCode,
      valor: parseFloat(form.valor.replace(/\./g, "").replace(",", ".")) || 0,
      dataVencimento: new Date(form.dataVencimento),
      nossoNumero: form.nossoNumero,
      agencia: form.agencia,
      conta: form.conta,
      convenio: form.convenio || undefined,
      carteira: form.carteira || undefined,
      codigoCedente: form.codigoCedente || undefined,
    });
  };

  const handleCopy = async (text: string, type: "barras" | "linha") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback para navegadores sem suporte
    }
  };

  const formatValor = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    const cents = parseInt(numbers, 10);
    return (cents / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerar Boleto"
        subtitle="Gerar código de barras e linha digitável"
        icon={<FileBarChart className="w-6 h-6" />}
        module="FINANCE"
        backHref="/payables/boletos"
        backLabel="Voltar"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Banco */}
          <div className="bg-theme-card border border-theme rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-theme">Dados Bancários</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-theme mb-1">
                  Banco *
                </label>
                <select
                  value={form.bankCode}
                  onChange={(e) => setForm({ ...form, bankCode: e.target.value as BankCode })}
                  className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.code} - {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Agência *"
                value={form.agencia}
                onChange={(e) => setForm({ ...form, agencia: e.target.value.replace(/\D/g, "") })}
                placeholder="0000"
                maxLength={4}
                required
              />

              <Input
                label="Conta *"
                value={form.conta}
                onChange={(e) => setForm({ ...form, conta: e.target.value.replace(/\D/g, "") })}
                placeholder="00000000"
                required
              />

              <Input
                label="Convênio"
                value={form.convenio}
                onChange={(e) => setForm({ ...form, convenio: e.target.value })}
                placeholder="000000"
              />

              <Input
                label="Carteira"
                value={form.carteira}
                onChange={(e) => setForm({ ...form, carteira: e.target.value })}
                placeholder="17"
              />
            </div>
          </div>

          {/* Dados do Boleto */}
          <div className="bg-theme-card border border-theme rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-theme">Dados do Boleto</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Valor *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted">
                    R$
                  </span>
                  <input
                    type="text"
                    value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: formatValor(e.target.value) })}
                    placeholder="0,00"
                    className="w-full pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Data de Vencimento *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                  <input
                    type="date"
                    value={form.dataVencimento}
                    onChange={(e) => setForm({ ...form, dataVencimento: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Nosso Número *"
                  value={form.nossoNumero}
                  onChange={(e) => setForm({ ...form, nossoNumero: e.target.value.replace(/\D/g, "") })}
                  placeholder="00000000000"
                  required
                />
                <p className="text-xs text-theme-muted mt-1">
                  Número de identificação do boleto no banco
                </p>
              </div>
            </div>
          </div>

          {/* Erro */}
          {generateMutation.error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertTriangle className="w-5 h-5" />
                {generateMutation.error.message}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-4">
            <Link href="/payables/boletos">
              <Button
                type="button"
                variant="secondary"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={!form.valor || !form.dataVencimento || !form.nossoNumero}
              isLoading={generateMutation.isPending}
              leftIcon={<FileBarChart className="w-4 h-4" />}
            >
              Gerar Boleto
            </Button>
          </div>
        </form>

        {/* Resultado */}
        <div className="space-y-6">
          {result ? (
            <div className="bg-theme-card border border-theme rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-theme">Boleto Gerado</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-theme mb-1">
                    Valor
                  </label>
                  <div className="text-2xl font-bold text-theme">
                    {formatCurrency(result.valor)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme mb-1">
                    Vencimento
                  </label>
                  <div className="text-theme">
                    {new Date(result.dataVencimento).toLocaleDateString("pt-BR")}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme mb-2">
                    Código de Barras
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-theme-secondary rounded-lg text-sm font-mono text-theme break-all">
                      {result.codigoBarras}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(result.codigoBarras, "barras")}
                      className="p-2 border border-theme rounded-lg hover:bg-theme-secondary"
                      title="Copiar"
                    >
                      {copied === "barras" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-theme-muted" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme mb-2">
                    Linha Digitável
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-theme-secondary rounded-lg text-sm font-mono text-theme break-all">
                      {result.linhaDigitavel}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(result.linhaDigitavel, "linha")}
                      className="p-2 border border-theme rounded-lg hover:bg-theme-secondary"
                      title="Copiar"
                    >
                      {copied === "linha" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-theme-muted" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-theme-card border border-theme rounded-lg p-6">
              <div className="text-center py-8 text-theme-muted">
                <FileBarChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Preencha os dados e clique em &quot;Gerar Boleto&quot;</p>
                <p className="text-sm mt-2">
                  O código de barras e linha digitável serão exibidos aqui
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
