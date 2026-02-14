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
  AlertTriangle,
  Loader2,
  Plus,
  Search,
} from "lucide-react";

const categoryLabels: Record<string, string> = {
  MECHANICAL: "Mecânica",
  ELECTRICAL: "Elétrica",
  ELECTRONIC: "Eletrônica",
  HYDRAULIC: "Hidráulica",
  PNEUMATIC: "Pneumática",
  SOFTWARE: "Software",
  OTHER: "Outra",
};

const severityConfig: Record<number, { label: string; variant: "error" | "warning" | "info" | "default" }> = {
  1: { label: "1 — Crítica", variant: "error" },
  2: { label: "2 — Alta", variant: "error" },
  3: { label: "3 — Média", variant: "warning" },
  4: { label: "4 — Baixa", variant: "info" },
  5: { label: "5 — Mínima", variant: "default" },
};

const categoryOptions = [
  { value: "ALL", label: "Todas as categorias" },
  { value: "MECHANICAL", label: "Mecânica" },
  { value: "ELECTRICAL", label: "Elétrica" },
  { value: "ELECTRONIC", label: "Eletrônica" },
  { value: "HYDRAULIC", label: "Hidráulica" },
  { value: "PNEUMATIC", label: "Pneumática" },
  { value: "SOFTWARE", label: "Software" },
  { value: "OTHER", label: "Outra" },
];

export default function FailureCodesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("OTHER");
  const [formSeverity, setFormSeverity] = useState("3");

  const utils = trpc.useUtils();

  const { data: failureCodes, isLoading, isError, error } = trpc.maintenance.listFailureCodes.useQuery({
    category: categoryFilter !== "ALL" ? (categoryFilter as "MECHANICAL" | "ELECTRICAL" | "ELECTRONIC" | "HYDRAULIC" | "PNEUMATIC" | "SOFTWARE" | "OTHER") : undefined,
  });

  const createMutation = trpc.maintenance.createFailureCode.useMutation({
    onSuccess: () => {
      utils.maintenance.listFailureCodes.invalidate();
      resetForm();
    },
    onError: (err) => {
      alert(`Erro ao criar código de falha: ${err.message}`);
    },
  });

  const resetForm = () => {
    setShowCreate(false);
    setFormCode("");
    setFormName("");
    setFormDescription("");
    setFormCategory("OTHER");
    setFormSeverity("3");
  };

  const handleCreate = () => {
    if (!formCode.trim() || !formName.trim()) return;
    createMutation.mutate({
      code: formCode.trim(),
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      category: formCategory as "MECHANICAL" | "ELECTRICAL" | "ELECTRONIC" | "HYDRAULIC" | "PNEUMATIC" | "SOFTWARE" | "OTHER",
      severity: Number(formSeverity),
    });
  };

  const filtered = (failureCodes ?? []).filter((fc: { name: string; code: string }) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return fc.name.toLowerCase().includes(s) || fc.code.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Códigos de Falha"
        icon={<AlertTriangle className="w-6 h-6" />}
        backHref="/maintenance"
        module="producao"
        actions={
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Código
          </Button>
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
              value={categoryFilter}
              onChange={(v) => setCategoryFilter(v)}
              options={categoryOptions}
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
            <Alert variant="error" title="Erro ao carregar códigos de falha">{error.message}</Alert>
          </div>
        ) : !filtered.length ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 mx-auto text-theme-muted mb-4" />
            <p className="text-theme-muted mb-4">Nenhum código de falha encontrado</p>
            <Button variant="primary" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Código
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-theme-table-header border-b border-theme">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Descrição</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Categoria</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Severidade</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-table">
                {filtered.map((fc: {
                  id: string;
                  code: string;
                  name: string;
                  description?: string | null;
                  category: string;
                  severity: number;
                  isActive: boolean;
                }) => {
                  const sev = severityConfig[fc.severity] ?? severityConfig[3];
                  return (
                    <tr key={fc.id} className="hover:bg-theme-table-hover transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono font-medium text-theme">{fc.code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-theme">{fc.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-theme-muted">{fc.description ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline">{categoryLabels[fc.category] ?? fc.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={sev.variant}>{sev.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={fc.isActive ? "success" : "default"}>
                          {fc.isActive ? "Ativo" : "Inativo"}
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
      <Modal isOpen={showCreate} onClose={resetForm} title="Novo Código de Falha">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Código *</label>
              <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="FC-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Categoria *</label>
              <Select
                value={formCategory}
                onChange={(v) => setFormCategory(v)}
                options={categoryOptions.filter((o) => o.value !== "ALL")}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Nome *</label>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome da falha" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Descrição</label>
            <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Descrição detalhada" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Severidade</label>
            <Select
              value={formSeverity}
              onChange={(v) => setFormSeverity(v)}
              options={[
                { value: "1", label: "1 — Crítica" },
                { value: "2", label: "2 — Alta" },
                { value: "3", label: "3 — Média" },
                { value: "4", label: "4 — Baixa" },
                { value: "5", label: "5 — Mínima" },
              ]}
            />
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
            Criar Código
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
