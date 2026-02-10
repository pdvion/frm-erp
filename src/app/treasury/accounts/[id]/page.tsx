"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/formatters";

import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Landmark,
  Loader2,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Calendar,
  Search,
  Download,
} from "lucide-react";
import { NativeSelect } from "@/components/ui/NativeSelect";

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
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <div className="text-center">
          <Landmark className="w-12 h-12 text-theme-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme mb-2">Conta não encontrada</h3>
          <Link href="/treasury" className="text-blue-600 hover:text-indigo-800">
            Voltar para tesouraria
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={account.name}
        subtitle={`${account.bankName}${account.agency ? ` • Ag ${account.agency}` : ""}${account.accountNumber ? ` • CC ${account.accountNumber}` : ""}`}
        icon={<Landmark className="w-6 h-6" />}
        backHref="/treasury"
        module="treasury"
        actions={
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowTransferModal(true)}
              variant="outline"
              leftIcon={<ArrowRightLeft className="w-4 h-4" />}
            >
              Transferir
            </Button>
            <Button
              onClick={() => setShowTransactionModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Lançamento
            </Button>
          </div>
        }
      />

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
              <Input
                type="text"
                placeholder="Buscar por descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <NativeSelect
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os tipos</option>
              {Object.entries(transactionTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </NativeSelect>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          <div className="px-4 py-3 border-b border-theme flex items-center justify-between">
            <h2 className="font-medium text-theme">Extrato</h2>
            <Button variant="ghost" size="sm" leftIcon={<Download className="w-4 h-4" />}>
              Exportar
            </Button>
          </div>

          {!transactions?.transactions.length ? (
            <div className="px-4 py-12 text-center text-theme-muted">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-theme-muted" />
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
          currentBalance={Number(account.currentBalance)}
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
          <ArrowRightLeft className="w-5 h-5 text-blue-600" />
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
            <NativeSelect
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione...</option>
              {otherAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.bankName}
                </option>
              ))}
            </NativeSelect>
          </div>

          <Input
            label="Valor"
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0.00"
            step={0.01}
          />

          <Input
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Transferência entre contas"
          />
        </div>

        {transferMutation.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {transferMutation.error.message}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
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
            isLoading={transferMutation.isPending}
            className="flex-1"
          >
            Transferir
          </Button>
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
          <Plus className="w-5 h-5 text-blue-600" />
          Novo Lançamento
        </h3>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">Tipo</label>
            <div className="flex gap-2">
              <Button
                variant={type === "CREDIT" ? "primary" : "outline"}
                onClick={() => setType("CREDIT")}
                leftIcon={<TrendingUp className="w-4 h-4" />}
                className={`flex-1 ${
                  type === "CREDIT"
                    ? "bg-green-600 hover:bg-green-700 border-green-500"
                    : ""
                }`}
              >
                Crédito
              </Button>
              <Button
                variant={type === "DEBIT" ? "primary" : "outline"}
                onClick={() => setType("DEBIT")}
                leftIcon={<TrendingDown className="w-4 h-4" />}
                className={`flex-1 ${
                  type === "DEBIT"
                    ? "bg-red-600 hover:bg-red-700 border-red-500"
                    : ""
                }`}
              >
                Débito
              </Button>
            </div>
          </div>

          <Input
            label="Valor"
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0.00"
            step={0.01}
          />

          <Input
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição do lançamento"
          />

          <Input
            label="Data"
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
          />

          <Input
            label="Documento (opcional)"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            placeholder="Número do documento"
          />
        </div>

        {transactionMutation.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {transactionMutation.error.message}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
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
            isLoading={transactionMutation.isPending}
            className="flex-1"
          >
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}
