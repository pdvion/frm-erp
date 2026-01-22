"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Landmark,
  ChevronLeft,
  Loader2,
  Plus,
  TrendingUp,
  TrendingDown,
  CreditCard,
  PiggyBank,
  Banknote,
  ArrowRightLeft,
  Calendar,
  Search,
  Download,
} from "lucide-react";

const accountTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  CHECKING: { label: "Conta Corrente", icon: <CreditCard className="w-5 h-5" />, color: "text-blue-600 bg-blue-100" },
  SAVINGS: { label: "Poupança", icon: <PiggyBank className="w-5 h-5" />, color: "text-green-600 bg-green-100" },
  INVESTMENT: { label: "Investimento", icon: <TrendingUp className="w-5 h-5" />, color: "text-purple-600 bg-purple-100" },
  CASH: { label: "Caixa", icon: <Banknote className="w-5 h-5" />, color: "text-yellow-600 bg-yellow-100" },
};

const transactionTypeLabels: Record<string, string> = {
  CREDIT: "Crédito",
  DEBIT: "Débito",
  TRANSFER_IN: "Transferência Entrada",
  TRANSFER_OUT: "Transferência Saída",
  FEE: "Tarifa",
  INTEREST: "Juros/Rendimento",
};

export default function AccountDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const { data: account, isLoading, refetch } = trpc.bankAccounts.byId.useQuery({ id });
  const { data: transactions } = trpc.bankAccounts.transactions.useQuery({
    accountId: id,
    limit: 50,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <div className="text-center">
          <Landmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme mb-2">Conta não encontrada</h3>
          <Link href="/treasury" className="text-indigo-600 hover:text-indigo-800">
            Voltar para tesouraria
          </Link>
        </div>
      </div>
    );
  }

  const config = accountTypeConfig[account.accountType] || accountTypeConfig.CHECKING;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-theme-card border-b border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/treasury" className="text-theme-muted hover:text-theme-secondary">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  {config.icon}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-theme">{account.name}</h1>
                  <p className="text-sm text-theme-muted">
                    {account.bankName} {account.agency && `• Ag ${account.agency}`} {account.accountNumber && `• CC ${account.accountNumber}`}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CompanySwitcher />
              <button
                onClick={() => setShowTransferModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Transferir
              </button>
              <button
                onClick={() => setShowTransactionModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Lançamento
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 mb-1">Saldo Atual</p>
              <p className="text-4xl font-bold">{formatCurrency(account.currentBalance)}</p>
            </div>
            <div className="text-right">
              <p className="text-indigo-100 mb-1">Saldo Inicial</p>
              <p className="text-xl font-medium">{formatCurrency(account.initialBalance)}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
              <input
                type="text"
                placeholder="Buscar por descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos os tipos</option>
              {Object.entries(transactionTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          <div className="px-4 py-3 border-b border-theme flex items-center justify-between">
            <h2 className="font-medium text-theme">Extrato</h2>
            <button className="text-sm text-theme-secondary hover:text-theme flex items-center gap-1">
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>

          {!transactions?.transactions.length ? (
            <div className="px-4 py-12 text-center text-theme-muted">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-theme-table">
              {transactions.transactions.map((tx) => {
                const isCredit = ["CREDIT", "TRANSFER_IN", "INTEREST"].includes(tx.type);

                return (
                  <div key={tx.id} className="px-4 py-3 flex items-center justify-between hover:bg-theme-hover">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${isCredit ? "bg-green-100" : "bg-red-100"}`}>
                        {isCredit ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-theme">{tx.description}</div>
                        <div className="text-sm text-theme-muted">
                          {formatDate(tx.transactionDate)}
                          {tx.documentNumber && ` • Doc: ${tx.documentNumber}`}
                          <span className="ml-2 px-2 py-0.5 bg-theme-tertiary rounded text-xs">
                            {transactionTypeLabels[tx.type] || tx.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${isCredit ? "text-green-600" : "text-red-600"}`}>
                        {isCredit ? "+" : "-"}{formatCurrency(tx.value)}
                      </div>
                      <div className="text-sm text-theme-muted">
                        Saldo: {formatCurrency(tx.balanceAfter)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Transfer Modal */}
      {showTransferModal && (
        <TransferModal
          fromAccountId={id}
          currentBalance={account.currentBalance}
          onClose={() => setShowTransferModal(false)}
          onSuccess={() => {
            setShowTransferModal(false);
            refetch();
          }}
        />
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <TransactionModal
          accountId={id}
          onClose={() => setShowTransactionModal(false)}
          onSuccess={() => {
            setShowTransactionModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function TransferModal({
  fromAccountId,
  currentBalance,
  onClose,
  onSuccess,
}: {
  fromAccountId: string;
  currentBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [toAccountId, setToAccountId] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");

  const { data: accounts } = trpc.bankAccounts.list.useQuery();
  const transferMutation = trpc.bankAccounts.transfer.useMutation({
    onSuccess,
  });

  const otherAccounts = accounts?.filter((a) => a.id !== fromAccountId) || [];

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-modal-title"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="bg-theme-card rounded-lg p-6 w-full max-w-md mx-4">
        <h3 id="transfer-modal-title" className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
          Transferência entre Contas
        </h3>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            Saldo disponível: <span className="font-bold">{formatCurrency(currentBalance)}</span>
          </p>
        </div>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Conta Destino</label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecione...</option>
              {otherAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.bankName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Valor</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Transferência entre contas"
            />
          </div>
        </div>

        {transferMutation.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {transferMutation.error.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover"
          >
            Cancelar
          </button>
          <button
            onClick={() =>
              transferMutation.mutate({
                fromAccountId,
                toAccountId,
                value: parseFloat(value) || 0,
                transferDate: new Date(),
                description: description || "Transferência entre contas",
              })
            }
            disabled={!toAccountId || !value || parseFloat(value) > currentBalance || transferMutation.isPending}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {transferMutation.isPending ? "Transferindo..." : "Transferir"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TransactionModal({
  accountId,
  onClose,
  onSuccess,
}: {
  accountId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [type, setType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0]);

  const transactionMutation = trpc.bankAccounts.createTransaction.useMutation({
    onSuccess,
  });

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-modal-title"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="bg-theme-card rounded-lg p-6 w-full max-w-md mx-4">
        <h3 id="transaction-modal-title" className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-600" />
          Novo Lançamento
        </h3>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Tipo</label>
            <div className="flex gap-2">
              <button
                onClick={() => setType("CREDIT")}
                className={`flex-1 py-2 rounded-lg border-2 ${
                  type === "CREDIT"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 text-theme-secondary"
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Crédito
              </button>
              <button
                onClick={() => setType("DEBIT")}
                className={`flex-1 py-2 rounded-lg border-2 ${
                  type === "DEBIT"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 text-theme-secondary"
                }`}
              >
                <TrendingDown className="w-4 h-4 inline mr-1" />
                Débito
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Valor</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Descrição do lançamento"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Data</label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Documento (opcional)</label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Número do documento"
            />
          </div>
        </div>

        {transactionMutation.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {transactionMutation.error.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover"
          >
            Cancelar
          </button>
          <button
            onClick={() =>
              transactionMutation.mutate({
                bankAccountId: accountId,
                type,
                value: parseFloat(value) || 0,
                description,
                documentNumber: documentNumber || undefined,
                transactionDate: new Date(transactionDate),
              })
            }
            disabled={!value || !description || transactionMutation.isPending}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {transactionMutation.isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
