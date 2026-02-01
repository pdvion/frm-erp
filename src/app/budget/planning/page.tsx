"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Calendar, Calculator } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/formatters";

export default function BudgetPlanningPage() {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [distributeForm, setDistributeForm] = useState({
    accountId: "",
    annualAmount: 0,
    distribution: "LINEAR" as "LINEAR" | "SEASONAL",
  });

  const { data: versions } = trpc.budget.listVersions.useQuery({ status: "DRAFT" });
  const { data: accounts } = trpc.budget.listAccounts.useQuery({ isActive: true });
  const { data: entries, refetch } = trpc.budget.getEntries.useQuery(
    { versionId: selectedVersion! },
    { enabled: !!selectedVersion }
  );

  const distributeMutation = trpc.budget.distributeAnnualBudget.useMutation({
    onSuccess: () => {
      refetch();
      setShowDistributeModal(false);
      setDistributeForm({ accountId: "", annualAmount: 0, distribution: "LINEAR" });
    },
  });

  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  // Agrupar entradas por conta
  const entriesByAccount = entries?.reduce((acc, entry) => {
    if (!acc[entry.accountId]) {
      acc[entry.accountId] = {
        account: entry.account,
        months: {} as Record<number, number>,
        total: 0,
      };
    }
    acc[entry.accountId].months[entry.month] = entry.amount;
    acc[entry.accountId].total += entry.amount;
    return acc;
  }, {} as Record<string, { account: typeof entries[0]["account"]; months: Record<number, number>; total: number }>);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planejamento Orçamentário"
        icon={<Calendar className="w-6 h-6" />}
        module="BUDGET"
        breadcrumbs={[
          { label: "Orçamento", href: "/budget" },
          { label: "Planejamento" },
        ]}
        actions={
          selectedVersion && (
            <Button
              onClick={() => setShowDistributeModal(true)}
              leftIcon={<Calculator className="w-4 h-4" />}
            >
              Distribuir Valor
            </Button>
          )
        }
      />

      {/* Seleção de versão */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <label className="block text-sm font-medium text-theme mb-2">Versão do Orçamento</label>
        <div className="max-w-md">
          <Select
            value={selectedVersion || ""}
            onChange={(value) => setSelectedVersion(value || null)}
            placeholder="Selecione uma versão..."
            options={versions?.map((v) => ({ value: v.id, label: `${v.name} (${v.year}) - ${v.type}` })) || []}
          />
        </div>
      </div>

      {selectedVersion && entriesByAccount && (
        <div className="bg-theme-card border border-theme rounded-lg overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-theme-hover">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-theme sticky left-0 bg-theme-hover">Conta</th>
                {months.map((m) => (
                  <th key={m} className="text-right p-3 text-sm font-medium text-theme w-24">{m}</th>
                ))}
                <th className="text-right p-3 text-sm font-medium text-theme w-28">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {Object.values(entriesByAccount).map((row) => (
                <tr key={row.account.id} className="hover:bg-theme-hover">
                  <td className="p-3 text-sm text-theme sticky left-0 bg-theme-card">
                    <span className="font-mono text-xs text-theme-muted mr-2">{row.account.code}</span>
                    {row.account.name}
                  </td>
                  {months.map((_, idx) => (
                    <td key={idx} className="p-3 text-right text-sm text-theme">
                      {row.months[idx + 1] ? formatCurrency(row.months[idx + 1]) : "-"}
                    </td>
                  ))}
                  <td className="p-3 text-right text-sm font-semibold text-theme">
                    {formatCurrency(row.total)}
                  </td>
                </tr>
              ))}
              {Object.keys(entriesByAccount).length === 0 && (
                <tr>
                  <td colSpan={14} className="p-8 text-center text-theme-muted">
                    Nenhuma entrada orçamentária. Use Distribuir Valor para começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!selectedVersion && (
        <div className="bg-theme-card border border-theme rounded-lg p-8 text-center text-theme-muted">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Selecione uma versão de orçamento para começar o planejamento</p>
        </div>
      )}

      {/* Modal de distribuição */}
      {showDistributeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card border border-theme rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-theme mb-4">Distribuir Valor Anual</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Conta</label>
                <Select
                  value={distributeForm.accountId}
                  onChange={(value) => setDistributeForm({ ...distributeForm, accountId: value })}
                  placeholder="Selecione..."
                  options={accounts?.map((a) => ({ value: a.id, label: `${a.code} - ${a.name}` })) || []}
                />
              </div>
              <Input
                label="Valor Anual"
                type="number"
                value={distributeForm.annualAmount}
                onChange={(e) => setDistributeForm({ ...distributeForm, annualAmount: Number(e.target.value) })}
              />
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Distribuição</label>
                <Select
                  value={distributeForm.distribution}
                  onChange={(value) => setDistributeForm({ ...distributeForm, distribution: value as "LINEAR" | "SEASONAL" })}
                  options={[
                    { value: "LINEAR", label: "Linear (igual por mês)" },
                    { value: "SEASONAL", label: "Sazonal" },
                  ]}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowDistributeModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => distributeMutation.mutate({
                  versionId: selectedVersion!,
                  accountId: distributeForm.accountId,
                  annualAmount: distributeForm.annualAmount,
                  distribution: distributeForm.distribution,
                })}
                disabled={!distributeForm.accountId || !distributeForm.annualAmount}
                isLoading={distributeMutation.isPending}
              >
                Distribuir
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
