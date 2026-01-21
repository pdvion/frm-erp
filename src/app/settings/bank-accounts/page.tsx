"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Building2,
  ChevronLeft,
  Loader2,
  Plus,
  Pencil,
  CheckCircle,
  XCircle,
  Star,
  Wallet,
  PiggyBank,
  TrendingUp,
  Banknote,
} from "lucide-react";

const accountTypeConfig = {
  CHECKING: { label: "Conta Corrente", icon: Wallet, color: "text-blue-600" },
  SAVINGS: { label: "Poupança", icon: PiggyBank, color: "text-green-600" },
  INVESTMENT: { label: "Investimento", icon: TrendingUp, color: "text-purple-600" },
  CASH: { label: "Caixa", icon: Banknote, color: "text-yellow-600" },
};

export default function BankAccountsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    bankCode: "",
    bankName: "",
    agency: "",
    agencyDigit: "",
    accountNumber: "",
    accountDigit: "",
    accountType: "CHECKING" as "CHECKING" | "SAVINGS" | "INVESTMENT" | "CASH",
    initialBalance: 0,
    creditLimit: 0,
    isDefault: false,
    notes: "",
  });

  const { data: accounts, isLoading, refetch } = trpc.bankAccounts.list.useQuery({ includeInactive: true });

  const createMutation = trpc.bankAccounts.create.useMutation({
    onSuccess: () => {
      resetForm();
      refetch();
    },
  });

  const updateMutation = trpc.bankAccounts.update.useMutation({
    onSuccess: () => {
      resetForm();
      refetch();
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      code: "",
      name: "",
      bankCode: "",
      bankName: "",
      agency: "",
      agencyDigit: "",
      accountNumber: "",
      accountDigit: "",
      accountType: "CHECKING",
      initialBalance: 0,
      creditLimit: 0,
      isDefault: false,
      notes: "",
    });
  };

  const handleEdit = (account: NonNullable<typeof accounts>[number]) => {
    setEditingId(account.id);
    setFormData({
      code: account.code,
      name: account.name,
      bankCode: account.bankCode || "",
      bankName: account.bankName || "",
      agency: account.agency || "",
      agencyDigit: account.agencyDigit || "",
      accountNumber: account.accountNumber || "",
      accountDigit: account.accountDigit || "",
      accountType: account.accountType,
      initialBalance: account.initialBalance,
      creditLimit: account.creditLimit || 0,
      isDefault: account.isDefault,
      notes: account.notes || "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    updateMutation.mutate({ id, isActive: !isActive });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-theme-card border-b border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/settings" className="text-theme-muted hover:text-theme-secondary">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold text-theme flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Contas Bancárias
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Nova Conta
              </button>
              <CompanySwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Formulário */}
        {showForm && (
          <div className="bg-theme-card rounded-lg border border-theme p-6 mb-6">
            <h2 className="text-lg font-medium text-theme mb-4">
              {editingId ? "Editar Conta Bancária" : "Nova Conta Bancária"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">Código *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="001"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-theme-secondary mb-1">Nome *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Banco do Brasil - CC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">Tipo</label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value as typeof formData.accountType })}
                    className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CHECKING">Conta Corrente</option>
                    <option value="SAVINGS">Poupança</option>
                    <option value="INVESTMENT">Investimento</option>
                    <option value="CASH">Caixa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">Cód. Banco</label>
                  <input
                    type="text"
                    value={formData.bankCode}
                    onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                    className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="001"
                    maxLength={3}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-theme-secondary mb-1">Nome do Banco</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Banco do Brasil S.A."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">Agência</label>
                  <input
                    type="text"
                    value={formData.agency}
                    onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                    className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="1234"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">Dígito Ag.</label>
                  <input
                    type="text"
                    value={formData.agencyDigit}
                    onChange={(e) => setFormData({ ...formData, agencyDigit: e.target.value })}
                    className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="X"
                    maxLength={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">Conta</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="12345678"
                    maxLength={12}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">Dígito Conta</label>
                  <input
                    type="text"
                    value={formData.accountDigit}
                    onChange={(e) => setFormData({ ...formData, accountDigit: e.target.value })}
                    className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="X"
                    maxLength={1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">Saldo Inicial</label>
                  <input
                    type="number"
                    value={formData.initialBalance}
                    onChange={(e) => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">Limite de Crédito</label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-sm text-theme-secondary">Conta Padrão</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-theme-input rounded-lg hover:bg-theme-hover"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista */}
        {accounts?.length === 0 ? (
          <div className="bg-theme-card rounded-lg border border-theme p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-theme-muted mb-4">Nenhuma conta bancária cadastrada</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Criar Primeira Conta
            </button>
          </div>
        ) : (
          <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
            <table className="w-full">
              <thead className="bg-theme-tertiary">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-theme-muted">Código</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-theme-muted">Nome</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-theme-muted">Banco</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-theme-muted">Tipo</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-theme-muted">Saldo Atual</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-theme-muted">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-theme-muted">Ações</th>
                </tr>
              </thead>
              <tbody>
                {accounts?.map((account) => {
                  const typeConfig = accountTypeConfig[account.accountType];
                  const TypeIcon = typeConfig.icon;
                  return (
                    <tr key={account.id} className="border-t border-gray-100 hover:bg-theme-hover">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm bg-theme-tertiary px-2 py-1 rounded">{account.code}</span>
                          {account.isDefault && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{account.name}</div>
                        {account.notes && <div className="text-xs text-theme-muted">{account.notes}</div>}
                      </td>
                      <td className="py-3 px-4">
                        {account.bankName ? (
                          <div>
                            <div className="text-sm">{account.bankName}</div>
                            <div className="text-xs text-theme-muted">
                              Ag: {account.agency}{account.agencyDigit ? `-${account.agencyDigit}` : ""} | 
                              Conta: {account.accountNumber}{account.accountDigit ? `-${account.accountDigit}` : ""}
                            </div>
                          </div>
                        ) : (
                          <span className="text-theme-muted">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className={`inline-flex items-center gap-1 text-sm ${typeConfig.color}`}>
                          <TypeIcon className="w-4 h-4" />
                          {typeConfig.label}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-medium ${account.currentBalance < 0 ? "text-red-600" : "text-theme"}`}>
                          {formatCurrency(account.currentBalance)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(account.id, account.isActive)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                            account.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-theme-tertiary text-theme-secondary"
                          }`}
                        >
                          {account.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Ativa
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Inativa
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleEdit(account)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
