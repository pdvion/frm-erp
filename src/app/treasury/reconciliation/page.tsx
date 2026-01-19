"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  ChevronLeft,
  Loader2,
  CheckCircle,
  Circle,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Filter,
  Check,
  X,
  Building2,
  Calendar,
  FileText,
} from "lucide-react";

export default function ReconciliationPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [showReconciled, setShowReconciled] = useState(false);
  const [page, setPage] = useState(1);

  const { data: accounts, isLoading: loadingAccounts } = trpc.bankAccounts.list.useQuery();
  
  const { data: transactions, isLoading: loadingTransactions, refetch } = trpc.bankAccounts.transactions.useQuery(
    { accountId: selectedAccountId, page, limit: 50 },
    { enabled: !!selectedAccountId }
  );

  const utils = trpc.useUtils();
  
  const reconcileMutation = trpc.bankAccounts.reconcile.useMutation({
    onSuccess: () => {
      utils.bankAccounts.transactions.invalidate();
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const handleReconcile = async (transactionId: string, reconciled: boolean) => {
    await reconcileMutation.mutateAsync({ transactionId, reconciled });
  };

  const filteredTransactions = transactions?.transactions.filter(
    (t) => showReconciled || !t.reconciled
  ) || [];

  const pendingCount = transactions?.transactions.filter((t) => !t.reconciled).length || 0;
  const reconciledCount = transactions?.transactions.filter((t) => t.reconciled).length || 0;

  const selectedAccount = accounts?.find((a) => a.id === selectedAccountId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/treasury" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                Conciliação Bancária
              </h1>
            </div>
            <CompanySwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Seleção de Conta */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Conta Bancária:</span>
            </div>
            
            {loadingAccounts ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <select
                value={selectedAccountId}
                onChange={(e) => {
                  setSelectedAccountId(e.target.value);
                  setPage(1);
                }}
                className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione uma conta...</option>
                {accounts?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name} ({formatCurrency(Number(account.currentBalance))})
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showReconciled}
                  onChange={(e) => setShowReconciled(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Mostrar conciliados
              </label>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        {selectedAccountId && transactions && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Circle className="w-4 h-4" />
                <span className="text-sm">Pendentes</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Conciliados</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{reconciledCount}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Total Transações</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{transactions.total}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Building2 className="w-4 h-4" />
                <span className="text-sm">Saldo Atual</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {selectedAccount ? formatCurrency(Number(selectedAccount.currentBalance)) : "-"}
              </p>
            </div>
          </div>
        )}

        {/* Lista de Transações */}
        {!selectedAccountId ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma conta</h3>
            <p className="text-gray-500">Escolha uma conta bancária para iniciar a conciliação</p>
          </div>
        ) : loadingTransactions ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Carregando transações...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {showReconciled ? "Nenhuma transação encontrada" : "Todas as transações estão conciliadas!"}
            </h3>
            <p className="text-gray-500">
              {showReconciled 
                ? "Não há transações para esta conta" 
                : "Marque 'Mostrar conciliados' para ver todas as transações"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Descrição
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Valor
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Saldo
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => {
                    const isCredit = ["CREDIT", "TRANSFER_IN", "INTEREST"].includes(transaction.type);
                    
                    return (
                      <tr
                        key={transaction.id}
                        className={`hover:bg-gray-50 ${transaction.reconciled ? "bg-green-50/30" : ""}`}
                      >
                        <td className="px-4 py-3">
                          {transaction.reconciled ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300" />
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {formatDate(transaction.transactionDate)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{transaction.description}</div>
                          {transaction.documentNumber && (
                            <div className="text-xs text-gray-500">Doc: {transaction.documentNumber}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            isCredit 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {isCredit ? (
                              <ArrowUpCircle className="w-3 h-3" />
                            ) : (
                              <ArrowDownCircle className="w-3 h-3" />
                            )}
                            {transaction.type === "CREDIT" && "Crédito"}
                            {transaction.type === "DEBIT" && "Débito"}
                            {transaction.type === "TRANSFER_IN" && "Transf. Entrada"}
                            {transaction.type === "TRANSFER_OUT" && "Transf. Saída"}
                            {transaction.type === "FEE" && "Taxa"}
                            {transaction.type === "INTEREST" && "Juros"}
                            {transaction.type === "ADJUSTMENT" && "Ajuste"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className={`font-medium ${isCredit ? "text-green-600" : "text-red-600"}`}>
                            {isCredit ? "+" : "-"}{formatCurrency(Number(transaction.value))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {formatCurrency(Number(transaction.balanceAfter))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {transaction.reconciled ? (
                            <button
                              onClick={() => handleReconcile(transaction.id, false)}
                              disabled={reconcileMutation.isPending}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              title="Desfazer conciliação"
                            >
                              <X className="w-4 h-4" />
                              Desfazer
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReconcile(transaction.id, true)}
                              disabled={reconcileMutation.isPending}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                              title="Conciliar"
                            >
                              <Check className="w-4 h-4" />
                              Conciliar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {transactions && transactions.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Página {page} de {transactions.pages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === transactions.pages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
