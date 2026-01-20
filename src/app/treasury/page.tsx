"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Landmark,
  ChevronLeft,
  Loader2,
  Plus,
  Eye,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  PiggyBank,
  Banknote,
  RefreshCw,
} from "lucide-react";

const accountTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  CHECKING: { label: "Conta Corrente", icon: <CreditCard className="w-4 h-4" />, color: "text-blue-600" },
  SAVINGS: { label: "Poupança", icon: <PiggyBank className="w-4 h-4" />, color: "text-green-600" },
  INVESTMENT: { label: "Investimento", icon: <TrendingUp className="w-4 h-4" />, color: "text-purple-600" },
  CASH: { label: "Caixa", icon: <Banknote className="w-4 h-4" />, color: "text-yellow-600" },
};

export default function TreasuryPage() {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const { data: balance, isLoading } = trpc.bankAccounts.balance.useQuery();
  const { data: accounts } = trpc.bankAccounts.list.useQuery();
  const { data: transactions } = trpc.bankAccounts.transactions.useQuery(
    { accountId: selectedAccount || "", limit: 20 },
    { enabled: !!selectedAccount }
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Landmark className="w-6 h-6 text-indigo-600" />
                <h1 className="text-xl font-semibold text-gray-900">Tesouraria</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CompanySwitcher />
              <Link
                href="/treasury/reconciliation"
                className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50"
              >
                <RefreshCw className="w-4 h-4" />
                Conciliação
              </Link>
              <Link
                href="/treasury/accounts/new"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Nova Conta
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            {/* Saldo Total */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 mb-8 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-5 h-5" />
                <span className="text-indigo-100">Saldo Total</span>
              </div>
              <div className="text-4xl font-bold">
                {formatCurrency(balance?.total || 0)}
              </div>
              <div className="text-indigo-200 mt-1">
                {balance?.accounts.length || 0} contas ativas
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lista de Contas */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h2 className="font-medium text-gray-900">Contas Bancárias</h2>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {accounts?.map((account) => {
                      const config = accountTypeConfig[account.accountType] || accountTypeConfig.CHECKING;
                      const isSelected = selectedAccount === account.id;

                      return (
                        <button
                          key={account.id}
                          onClick={() => setSelectedAccount(account.id)}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 ${
                            isSelected ? "bg-indigo-50 border-l-4 border-indigo-600" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={config.color}>{config.icon}</div>
                              <div>
                                <div className="font-medium text-gray-900">{account.name}</div>
                                <div className="text-xs text-gray-500">
                                  {account.bankName} {account.agency && `• Ag ${account.agency}`}
                                </div>
                              </div>
                            </div>
                            <div className={`text-sm font-medium ${account.currentBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(account.currentBalance)}
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {!accounts?.length && (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <Landmark className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>Nenhuma conta cadastrada</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Extrato */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="font-medium text-gray-900">
                      {selectedAccount ? "Extrato" : "Selecione uma conta"}
                    </h2>
                    {selectedAccount && (
                      <Link
                        href={`/treasury/accounts/${selectedAccount}`}
                        className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Ver detalhes
                      </Link>
                    )}
                  </div>

                  {!selectedAccount ? (
                    <div className="px-4 py-12 text-center text-gray-500">
                      <Landmark className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Selecione uma conta para ver o extrato</p>
                    </div>
                  ) : !transactions?.transactions.length ? (
                    <div className="px-4 py-12 text-center text-gray-500">
                      <p>Nenhuma transação encontrada</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {transactions.transactions.map((tx) => {
                        const isCredit = ["CREDIT", "TRANSFER_IN", "INTEREST"].includes(tx.type);

                        return (
                          <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${isCredit ? "bg-green-100" : "bg-red-100"}`}>
                                {isCredit ? (
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-600" />
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{tx.description}</div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(tx.transactionDate)}
                                  {tx.documentNumber && ` • ${tx.documentNumber}`}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-medium ${isCredit ? "text-green-600" : "text-red-600"}`}>
                                {isCredit ? "+" : "-"}{formatCurrency(tx.value)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Saldo: {formatCurrency(tx.balanceAfter)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
