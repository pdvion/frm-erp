"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Wallet, Plus, ChevronRight, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import Link from "next/link";

type AccountType = "REVENUE" | "EXPENSE" | "INVESTMENT" | undefined;

export default function BudgetAccountsPage() {
  const [typeFilter, setTypeFilter] = useState<AccountType>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    code: "",
    name: "",
    description: "",
    type: "EXPENSE" as "REVENUE" | "EXPENSE" | "INVESTMENT",
    parentId: undefined as string | undefined,
  });

  const { data: accounts, isLoading, refetch } = trpc.budget.listAccounts.useQuery({
    type: typeFilter,
    isActive: true,
  });

  const createMutation = trpc.budget.createAccount.useMutation({
    onSuccess: () => {
      refetch();
      setShowModal(false);
      setNewAccount({ code: "", name: "", description: "", type: "EXPENSE", parentId: undefined });
    },
  });

  const typeColors: Record<string, string> = {
    REVENUE: "text-green-600 bg-green-100 dark:bg-green-900/30",
    EXPENSE: "text-red-600 bg-red-100 dark:bg-red-900/30",
    INVESTMENT: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  };

  const typeLabels: Record<string, string> = {
    REVENUE: "Receita",
    EXPENSE: "Despesa",
    INVESTMENT: "Investimento",
  };

  const typeIcons: Record<string, React.ReactNode> = {
    REVENUE: <TrendingUp className="w-4 h-4" />,
    EXPENSE: <TrendingDown className="w-4 h-4" />,
    INVESTMENT: <PiggyBank className="w-4 h-4" />,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas Orçamentárias"
        icon={<Wallet className="w-6 h-6" />}
        module="BUDGET"
        breadcrumbs={[
          { label: "Orçamento", href: "/budget" },
          { label: "Contas" },
        ]}
        actions={
          <Button
            onClick={() => setShowModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nova Conta
          </Button>
        }
      />

      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          variant={!typeFilter ? "primary" : "outline"}
          size="sm"
          onClick={() => setTypeFilter(undefined)}
        >
          Todas
        </Button>
        {(["REVENUE", "EXPENSE", "INVESTMENT"] as const).map((type) => (
          <Button
            key={type}
            variant={typeFilter === type ? "primary" : "outline"}
            size="sm"
            onClick={() => setTypeFilter(type)}
            leftIcon={typeIcons[type]}
          >
            {typeLabels[type]}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="bg-theme-card border border-theme rounded-lg p-8 text-center text-theme-muted">
          Carregando...
        </div>
      ) : (
        <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-theme-hover">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-theme">Código</th>
                <th className="text-left p-3 text-sm font-medium text-theme">Nome</th>
                <th className="text-left p-3 text-sm font-medium text-theme">Tipo</th>
                <th className="text-left p-3 text-sm font-medium text-theme">Pai</th>
                <th className="text-center p-3 text-sm font-medium text-theme">Filhos</th>
                <th className="text-center p-3 text-sm font-medium text-theme">Entradas</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {accounts?.map((account) => (
                <tr key={account.id} className="hover:bg-theme-hover">
                  <td className="p-3 font-mono text-sm text-theme">{account.code}</td>
                  <td className="p-3 text-theme">{account.name}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${typeColors[account.type]}`}>
                      {typeIcons[account.type]}
                      {typeLabels[account.type]}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-theme-muted">{account.parent?.name || "-"}</td>
                  <td className="p-3 text-center text-sm text-theme-muted">{account._count.children}</td>
                  <td className="p-3 text-center text-sm text-theme-muted">{account._count.entries}</td>
                  <td className="p-3">
                    <ChevronRight className="w-4 h-4 text-theme-muted" />
                  </td>
                </tr>
              ))}
              {accounts?.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-theme-muted">
                    Nenhuma conta encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de criação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card border border-theme rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-theme mb-4">Nova Conta Orçamentária</h3>
            <div className="space-y-4">
              <Input
                label="Código"
                value={newAccount.code}
                onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })}
                placeholder="Ex: 1.1.01"
              />
              <Input
                label="Nome"
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                placeholder="Nome da conta"
              />
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Tipo</label>
                <Select
                  value={newAccount.type}
                  onChange={(value) => setNewAccount({ ...newAccount, type: value as "REVENUE" | "EXPENSE" | "INVESTMENT" })}
                  options={[
                    { value: "REVENUE", label: "Receita" },
                    { value: "EXPENSE", label: "Despesa" },
                    { value: "INVESTMENT", label: "Investimento" },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Descrição</label>
                <Textarea
                  value={newAccount.description}
                  onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => createMutation.mutate(newAccount)}
                disabled={!newAccount.code || !newAccount.name}
                isLoading={createMutation.isPending}
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <Link href="/budget" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Voltar para Orçamento
        </Link>
      </div>
    </div>
  );
}
