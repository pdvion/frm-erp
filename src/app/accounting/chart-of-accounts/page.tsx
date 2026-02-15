"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import {
  List,
  Search,
  Loader2,
  Plus,
  FolderTree,
  Sparkles,
} from "lucide-react";

const typeLabels: Record<string, string> = {
  ASSET: "Ativo",
  LIABILITY: "Passivo",
  EQUITY: "Patrimônio Líquido",
  REVENUE: "Receita",
  EXPENSE: "Despesa",
};

const typeVariants: Record<string, "info" | "error" | "purple" | "success" | "warning"> = {
  ASSET: "info",
  LIABILITY: "error",
  EQUITY: "purple",
  REVENUE: "success",
  EXPENSE: "warning",
};

const natureLabels: Record<string, string> = {
  DEBIT: "Devedora",
  CREDIT: "Credora",
};

const typeOptions = [
  { value: "ALL", label: "Todos os tipos" },
  { value: "ASSET", label: "Ativo" },
  { value: "LIABILITY", label: "Passivo" },
  { value: "EQUITY", label: "Patrimônio Líquido" },
  { value: "REVENUE", label: "Receita" },
  { value: "EXPENSE", label: "Despesa" },
];

const analyticalOptions = [
  { value: "ALL", label: "Todas" },
  { value: "true", label: "Analíticas" },
  { value: "false", label: "Sintéticas" },
];

export default function ChartOfAccountsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [analyticalFilter, setAnalyticalFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("ASSET");
  const [formNature, setFormNature] = useState("DEBIT");
  const [formIsAnalytical, setFormIsAnalytical] = useState("true");
  const [formDescription, setFormDescription] = useState("");

  const utils = trpc.useUtils();

  const { data: accounts, isLoading, isError, error } = trpc.accounting.listAccounts.useQuery({
    search: search || undefined,
    type: typeFilter !== "ALL" ? (typeFilter as "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE") : undefined,
    isAnalytical: analyticalFilter !== "ALL" ? analyticalFilter === "true" : undefined,
  });

  const createMutation = trpc.accounting.createAccount.useMutation({
    onSuccess: () => {
      utils.accounting.listAccounts.invalidate();
      resetForm();
    },
    onError: (err) => {
      alert(`Erro ao criar conta: ${err.message}`);
    },
  });

  const seedMutation = trpc.accounting.seedDefaultAccounts.useMutation({
    onSuccess: (result) => {
      utils.accounting.listAccounts.invalidate();
      alert(`Plano de contas padrão gerado: ${result.accountsCreated} contas criadas.`);
    },
    onError: (err) => {
      alert(`Erro ao gerar plano padrão: ${err.message}`);
    },
  });

  const resetForm = () => {
    setShowCreate(false);
    setFormCode("");
    setFormName("");
    setFormType("ASSET");
    setFormNature("DEBIT");
    setFormIsAnalytical("true");
    setFormDescription("");
  };

  const handleCreate = () => {
    if (!formCode.trim() || !formName.trim()) return;
    createMutation.mutate({
      code: formCode.trim(),
      name: formName.trim(),
      type: formType as "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE",
      nature: formNature as "DEBIT" | "CREDIT",
      isAnalytical: formIsAnalytical === "true",
      description: formDescription.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plano de Contas"
        icon={<List className="w-6 h-6" />}
        backHref="/accounting"
        module="financeiro"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => seedMutation.mutate()}
              isLoading={seedMutation.isPending}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Plano Padrão
            </Button>
            <Button variant="primary" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-theme-card rounded-lg border border-theme p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <Input
              placeholder="Buscar por código ou nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              value={typeFilter}
              onChange={(v) => setTypeFilter(v)}
              options={typeOptions}
            />
          </div>
          <div className="w-full md:w-40">
            <Select
              value={analyticalFilter}
              onChange={(v) => setAnalyticalFilter(v)}
              options={analyticalOptions}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : isError ? (
          <div className="p-6">
            <Alert variant="error" title="Erro ao carregar contas">{error.message}</Alert>
          </div>
        ) : !accounts?.length ? (
          <div className="text-center py-12">
            <FolderTree className="w-12 h-12 mx-auto text-theme-muted mb-4" />
            <p className="text-theme-muted mb-4">Nenhuma conta cadastrada</p>
            <Button
              variant="primary"
              onClick={() => seedMutation.mutate()}
              isLoading={seedMutation.isPending}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Plano de Contas Padrão
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-theme-table-header border-b border-theme">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Conta</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Tipo</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Natureza</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Nível</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Filhas</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Lançamentos</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-table">
                {accounts.map((acc) => {
                  const indent = (acc.code.split(".").length - 1) * 16;
                  return (
                    <tr key={acc.id} className="hover:bg-theme-table-hover transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono font-medium text-theme" style={{ paddingLeft: `${indent}px` }}>
                          {acc.code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-theme" style={{ paddingLeft: `${indent}px` }}>
                          {acc.name}
                        </div>
                        {acc.parent && (
                          <div className="text-xs text-theme-muted" style={{ paddingLeft: `${indent}px` }}>
                            ↳ {acc.parent.code} - {acc.parent.name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={typeVariants[acc.type] ?? "default"}>
                          {typeLabels[acc.type] ?? acc.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-theme-secondary">
                          {natureLabels[acc.nature] ?? acc.nature}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={acc.isAnalytical ? "default" : "outline"}>
                          {acc.isAnalytical ? "Analítica" : "Sintética"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-theme-muted">
                        {acc._count.children > 0 ? acc._count.children : "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-theme-muted">
                        {acc._count.entryItems > 0 ? acc._count.entryItems : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={acc.isActive ? "success" : "default"}>
                          {acc.isActive ? "Ativa" : "Inativa"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={resetForm} title="Nova Conta Contábil">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Código *</label>
              <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="1.1.01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Tipo *</label>
              <Select
                value={formType}
                onChange={(v) => {
                  setFormType(v);
                  setFormNature(v === "ASSET" || v === "EXPENSE" ? "DEBIT" : "CREDIT");
                }}
                options={typeOptions.filter((o) => o.value !== "ALL")}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Nome *</label>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome da conta" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Natureza</label>
              <Select
                value={formNature}
                onChange={(v) => setFormNature(v)}
                options={[
                  { value: "DEBIT", label: "Devedora" },
                  { value: "CREDIT", label: "Credora" },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Nível</label>
              <Select
                value={formIsAnalytical}
                onChange={(v) => setFormIsAnalytical(v)}
                options={[
                  { value: "true", label: "Analítica (aceita lançamentos)" },
                  { value: "false", label: "Sintética (agrupadora)" },
                ]}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Descrição</label>
            <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Descrição opcional" />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={resetForm}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            isLoading={createMutation.isPending}
            disabled={!formCode.trim() || !formName.trim()}
          >
            Criar Conta
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
