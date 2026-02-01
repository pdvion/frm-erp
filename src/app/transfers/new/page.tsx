"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ArrowLeftRight, ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/LinkButton";
import { formatCurrency } from "@/lib/formatters";

export default function NewTransferPage() {
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: accounts = [] } = trpc.bankAccounts.list.useQuery({});

  const sourceAccount = accounts.find((a) => a.id === sourceAccountId);
  const destinationAccount = accounts.find((a) => a.id === destinationAccountId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Transferência"
        icon={<ArrowLeftRight className="w-6 h-6" />}
        module="TREASURY"
        breadcrumbs={[
          { label: "Tesouraria", href: "/treasury" },
          { label: "Transferências", href: "/transfers" },
          { label: "Nova" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="space-y-6">
          <div className="bg-theme-card border border-theme rounded-lg p-4">
            <h3 className="font-semibold text-theme mb-4">Dados da Transferência</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Conta de Origem</label>
                <Select
                  value={sourceAccountId}
                  onChange={setSourceAccountId}
                  placeholder="Selecione..."
                  options={accounts.filter((a) => a.id !== destinationAccountId).map((account) => ({
                    value: account.id,
                    label: `${account.name} - ${account.bankName} (${formatCurrency(account.currentBalance)})`
                  }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme mb-1">Conta de Destino</label>
                <Select
                  value={destinationAccountId}
                  onChange={setDestinationAccountId}
                  placeholder="Selecione..."
                  options={accounts.filter((a) => a.id !== sourceAccountId).map((account) => ({
                    value: account.id,
                    label: `${account.name} - ${account.bankName} (${formatCurrency(account.currentBalance)})`
                  }))}
                />
              </div>

              <Input
                label="Valor"
                type="number"
                min={0.01}
                step={0.01}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />

              <Input
                label="Data"
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-theme mb-1">Descrição</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              disabled={!sourceAccountId || !destinationAccountId || amount <= 0}
              className="flex-1"
            >
              Realizar Transferência
            </Button>
            <LinkButton href="/transfers" variant="outline">
              Cancelar
            </LinkButton>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="font-semibold text-theme mb-6 text-center">Resumo da Transferência</h3>
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-xs text-theme-muted mb-1">Origem</p>
              <p className="font-semibold text-theme">{sourceAccount?.name || "---"}</p>
              <p className="text-xs text-theme-muted">{sourceAccount?.bankName || ""}</p>
              {sourceAccount && (
                <p className="text-sm text-red-600 mt-2">- {formatCurrency(amount)}</p>
              )}
            </div>
            
            <ArrowRight className="w-6 h-6 text-theme-muted flex-shrink-0" />
            
            <div className="flex-1 text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-theme-muted mb-1">Destino</p>
              <p className="font-semibold text-theme">{destinationAccount?.name || "---"}</p>
              <p className="text-xs text-theme-muted">{destinationAccount?.bankName || ""}</p>
              {destinationAccount && (
                <p className="text-sm text-green-600 mt-2">+ {formatCurrency(amount)}</p>
              )}
            </div>
          </div>

          {amount > 0 && (
            <div className="mt-6 text-center">
              <p className="text-2xl font-bold text-theme">{formatCurrency(amount)}</p>
              <p className="text-sm text-theme-muted">Valor da transferência</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
