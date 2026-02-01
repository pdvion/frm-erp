"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Building2,
  Save,
  ArrowLeft,
  CreditCard,
  Wallet,
  PiggyBank,
  TrendingUp,
  Banknote,
} from "lucide-react";

const accountTypes = [
  { value: "CHECKING", label: "Conta Corrente", icon: CreditCard, description: "Conta para movimentações diárias" },
  { value: "SAVINGS", label: "Poupança", icon: PiggyBank, description: "Conta de poupança" },
  { value: "INVESTMENT", label: "Investimento", icon: TrendingUp, description: "Conta de investimentos" },
  { value: "CASH", label: "Caixa", icon: Wallet, description: "Caixa físico da empresa" },
] as const;

type AccountType = typeof accountTypes[number]["value"];

const banks = [
  { code: "001", name: "Banco do Brasil" },
  { code: "033", name: "Santander" },
  { code: "104", name: "Caixa Econômica" },
  { code: "237", name: "Bradesco" },
  { code: "341", name: "Itaú" },
  { code: "756", name: "Sicoob" },
  { code: "260", name: "Nubank" },
  { code: "077", name: "Inter" },
  { code: "212", name: "Banco Original" },
  { code: "336", name: "C6 Bank" },
];

export default function NewBankAccountPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    code: "",
    name: "",
    bankCode: "",
    bankName: "",
    agency: "",
    agencyDigit: "",
    accountNumber: "",
    accountDigit: "",
    accountType: "CHECKING" as AccountType,
    initialBalance: "",
    creditLimit: "",
    isDefault: false,
    notes: "",
  });

  const createMutation = trpc.bankAccounts.create.useMutation({
    onSuccess: () => {
      router.push("/settings/bank-accounts");
    },
  });

  const handleBankChange = (code: string) => {
    const bank = banks.find((b) => b.code === code);
    setForm({
      ...form,
      bankCode: code,
      bankName: bank?.name || "",
    });
  };

  const formatMoney = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    const cents = parseInt(numbers, 10);
    return (cents / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseMoney = (value: string) => {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      code: form.code,
      name: form.name,
      bankCode: form.bankCode || undefined,
      bankName: form.bankName || undefined,
      agency: form.agency || undefined,
      agencyDigit: form.agencyDigit || undefined,
      accountNumber: form.accountNumber || undefined,
      accountDigit: form.accountDigit || undefined,
      accountType: form.accountType,
      initialBalance: parseMoney(form.initialBalance),
      creditLimit: form.creditLimit ? parseMoney(form.creditLimit) : undefined,
      isDefault: form.isDefault,
      notes: form.notes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Conta Bancária"
        subtitle="Cadastrar nova conta bancária ou caixa"
        icon={<Building2 className="w-6 h-6" />}
        module="TREASURY"
        backHref="/settings/bank-accounts"
        backLabel="Voltar"
      />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Dados Básicos */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">Identificação</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Código *"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="Ex: CC-001"
              required
            />

            <Input
              label="Nome da Conta *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Conta Principal BB"
              required
            />
          </div>
        </div>

        {/* Tipo de Conta */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">Tipo de Conta</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {accountTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = form.accountType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm({ ...form, accountType: type.value })}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-theme hover:border-blue-300 hover:bg-theme-secondary"
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${isSelected ? "text-blue-600" : "text-theme-muted"}`} />
                  <div className={`font-medium text-sm ${isSelected ? "text-blue-600" : "text-theme"}`}>
                    {type.label}
                  </div>
                  <div className="text-xs text-theme-muted mt-1">{type.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dados Bancários */}
        {form.accountType !== "CASH" && (
          <div className="bg-theme-card border border-theme rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Banknote className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-theme">Dados Bancários</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-theme mb-1">
                  Banco
                </label>
                <select
                  value={form.bankCode}
                  onChange={(e) => handleBankChange(e.target.value)}
                  className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione o banco</option>
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.code} - {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Agência
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.agency}
                    onChange={(e) => setForm({ ...form, agency: e.target.value.replace(/\D/g, "") })}
                    placeholder="0000"
                    maxLength={4}
                    className="flex-1 px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={form.agencyDigit}
                    onChange={(e) => setForm({ ...form, agencyDigit: e.target.value })}
                    placeholder="DV"
                    maxLength={1}
                    className="w-16 px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Conta
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.accountNumber}
                    onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, "") })}
                    placeholder="00000000"
                    className="flex-1 px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={form.accountDigit}
                    onChange={(e) => setForm({ ...form, accountDigit: e.target.value })}
                    placeholder="DV"
                    maxLength={1}
                    className="w-16 px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Saldos */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">Saldos</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Saldo Inicial
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted">
                  R$
                </span>
                <input
                  type="text"
                  value={form.initialBalance}
                  onChange={(e) => setForm({ ...form, initialBalance: formatMoney(e.target.value) })}
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <p className="text-xs text-theme-muted mt-1">
                Saldo atual da conta na data de cadastro
              </p>
            </div>

            {form.accountType === "CHECKING" && (
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Limite de Crédito
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted">
                    R$
                  </span>
                  <input
                    type="text"
                    value={form.creditLimit}
                    onChange={(e) => setForm({ ...form, creditLimit: formatMoney(e.target.value) })}
                    placeholder="0,00"
                    className="w-full pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="text-xs text-theme-muted mt-1">
                  Limite de cheque especial (opcional)
                </p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-theme-input text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-theme">
                  Definir como conta padrão para novos lançamentos
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">Observações</h3>

          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Observações adicionais sobre a conta..."
            rows={3}
            className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        {/* Erro */}
        {createMutation.error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
            {createMutation.error.message}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-4">
          <Link href="/settings/bank-accounts">
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
            disabled={!form.code || !form.name}
            isLoading={createMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Salvar Conta
          </Button>
        </div>
      </form>
    </div>
  );
}
