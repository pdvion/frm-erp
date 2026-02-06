"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/formatters";

import { PageHeader } from "@/components/PageHeader";
import {
  Loader2,
  CheckCircle,
  Circle,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Check,
  X,
  Building2,
  Calendar,
  FileText,
  Upload,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { NativeSelect } from "@/components/ui/NativeSelect";

export default function ReconciliationPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [showReconciled, setShowReconciled] = useState(false);
  const [page, setPage] = useState(1);

  const { data: accounts, isLoading: loadingAccounts } = trpc.bankAccounts.list.useQuery();
  
  const { data: transactions, isLoading: loadingTransactions } = trpc.bankAccounts.transactions.useQuery(
    { accountId: selectedAccountId, page, limit: 50 },
    { enabled: !!selectedAccountId }
  );

  const utils = trpc.useUtils();
  
  const reconcileMutation = trpc.bankAccounts.reconcile.useMutation({
    onSuccess: () => {
      utils.bankAccounts.transactions.invalidate();
    },
  });

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
    <div className="space-y-6">
      <PageHeader
        title="Conciliação Bancária"
        icon={<RefreshCw className="w-6 h-6" />}
        backHref="/treasury"
        module="treasury"
        actions={
          <Link
            href="/treasury/import-ofx"
            className="flex items-center gap-2 px-3 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 text-sm"
          >
            <Upload className="w-4 h-4" />
            Importar OFX
          </Link>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Seleção de Conta */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-theme-muted" />
              <span className="text-sm font-medium text-theme-secondary">Conta Bancária:</span>
            </div>
            
            {loadingAccounts ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <NativeSelect
                value={selectedAccountId}
                onChange={(e) => {
                  setSelectedAccountId(e.target.value);
                  setPage(1);
                }}
                className="flex-1 max-w-md px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione uma conta...</option>
                {accounts?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name} ({formatCurrency(Number(account.currentBalance))})
                  </option>
                ))}
              </NativeSelect>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <label className="flex items-center gap-2 text-sm text-theme-secondary cursor-pointer">
                <Input
                  type="checkbox"
                  checked={showReconciled}
                  onChange={(e) => setShowReconciled(e.target.checked)}
                  className="rounded border-theme text-blue-600 focus:ring-blue-500"
                />
                Mostrar conciliados
              </label>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        {selectedAccountId && transactions && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-1">
                <Circle className="w-4 h-4" />
                <span className="text-sm">Pendentes</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Conciliados</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{reconciledCount}</p>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Total Transações</span>
              </div>
              <p className="text-2xl font-bold text-theme">{transactions.total}</p>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-1">
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
          <div className="bg-theme-card rounded-lg border border-theme p-8 text-center">
            <Building2 className="w-12 h-12 text-theme-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-theme mb-2">Selecione uma conta</h3>
            <p className="text-theme-muted">Escolha uma conta bancária para iniciar a conciliação</p>
          </div>
        ) : loadingTransactions ? (
          <div className="bg-theme-card rounded-lg border border-theme p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-theme-secondary">Carregando transações...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-theme-card rounded-lg border border-theme p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-theme mb-2">
              {showReconciled ? "Nenhuma transação encontrada" : "Todas as transações estão conciliadas!"}
            </h3>
            <p className="text-theme-muted">
              {showReconciled 
                ? "Não há transações para esta conta" 
                : "Marque 'Mostrar conciliados' para ver todas as transações"}
            </p>
          </div>
        ) : (
          <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-theme-table-header border-b border-theme">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase w-10">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                      Descrição
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                      Valor
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                      Saldo
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase w-24">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {filteredTransactions.map((transaction) => {
                    const isCredit = ["CREDIT", "TRANSFER_IN", "INTEREST"].includes(transaction.type);
                    
                    return (
                      <tr
                        key={transaction.id}
                        className={`hover:bg-theme-hover ${transaction.reconciled ? "bg-green-50/30" : ""}`}
                      >
                        <td className="px-4 py-3">
                          {transaction.reconciled ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-theme-muted" />
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-theme-muted" />
                            <span className="text-sm text-theme">
                              {formatDate(transaction.transactionDate)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-theme">{transaction.description}</div>
                          {transaction.documentNumber && (
                            <div className="text-xs text-theme-muted">Doc: {transaction.documentNumber}</div>
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
                          <span className="text-sm text-theme">
                            {formatCurrency(Number(transaction.balanceAfter))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {transaction.reconciled ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReconcile(transaction.id, false)}
                              disabled={reconcileMutation.isPending}
                              className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
                              title="Desfazer conciliação"
                              leftIcon={<X className="w-4 h-4" />}
                            >
                              Desfazer
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReconcile(transaction.id, true)}
                              disabled={reconcileMutation.isPending}
                              className="text-xs text-green-600 hover:text-green-800 hover:bg-green-50"
                              title="Conciliar"
                              leftIcon={<Check className="w-4 h-4" />}
                            >
                              Conciliar
                            </Button>
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
              <div className="px-4 py-3 border-t border-theme flex items-center justify-between">
                <div className="text-sm text-theme-secondary">
                  Página {page} de {transactions.pages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === transactions.pages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
