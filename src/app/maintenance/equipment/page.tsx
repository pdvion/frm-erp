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
  Cpu,
  Search,
  Loader2,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Activity,
} from "lucide-react";

const criticalityConfig: Record<string, { label: string; variant: "error" | "warning" | "info" }> = {
  A: { label: "A — Crítico", variant: "error" },
  B: { label: "B — Importante", variant: "warning" },
  C: { label: "C — Normal", variant: "info" },
};

const statusOptions = [
  { value: "ALL", label: "Todos" },
  { value: "ACTIVE", label: "Ativos" },
  { value: "INACTIVE", label: "Inativos" },
];

const criticalityOptions = [
  { value: "ALL", label: "Todas as criticidades" },
  { value: "A", label: "A — Crítico" },
  { value: "B", label: "B — Importante" },
  { value: "C", label: "C — Normal" },
];

export default function EquipmentPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [criticalityFilter, setCriticalityFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formCriticality, setFormCriticality] = useState("B");

  const utils = trpc.useUtils();

  const { data, isLoading, isError, error } = trpc.maintenance.listEquipment.useQuery({
    search: search || undefined,
    isActive: activeFilter !== "ALL" ? activeFilter === "ACTIVE" : undefined,
    criticality: criticalityFilter !== "ALL" ? (criticalityFilter as "A" | "B" | "C") : undefined,
    page,
    limit: 20,
  });

  const createMutation = trpc.maintenance.createEquipment.useMutation({
    onSuccess: () => {
      utils.maintenance.listEquipment.invalidate();
      resetForm();
    },
    onError: (err) => {
      alert(`Erro ao criar equipamento: ${err.message}`);
    },
  });

  const resetForm = () => {
    setShowCreate(false);
    setFormCode("");
    setFormName("");
    setFormDescription("");
    setFormLocation("");
    setFormCriticality("B");
  };

  const handleCreate = () => {
    if (!formCode.trim() || !formName.trim()) return;
    createMutation.mutate({
      code: formCode.trim(),
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      location: formLocation.trim() || undefined,
      criticality: formCriticality as "A" | "B" | "C",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipamentos"
        icon={<Cpu className="w-6 h-6" />}
        backHref="/maintenance"
        module="producao"
        actions={
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Equipamento
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
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              value={activeFilter}
              onChange={(v) => { setActiveFilter(v); setPage(1); }}
              options={statusOptions}
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              value={criticalityFilter}
              onChange={(v) => { setCriticalityFilter(v); setPage(1); }}
              options={criticalityOptions}
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
            <Alert variant="error" title="Erro ao carregar equipamentos">{error.message}</Alert>
          </div>
        ) : !data?.items?.length ? (
          <div className="text-center py-12">
            <Cpu className="w-12 h-12 mx-auto text-theme-muted mb-4" />
            <p className="text-theme-muted mb-4">Nenhum equipamento encontrado</p>
            <Button variant="primary" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Equipamento
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-theme-table-header border-b border-theme">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Equipamento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Localização</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Criticidade</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {data.items.map((eq: {
                    id: string;
                    code: string;
                    name: string;
                    description?: string | null;
                    location?: string | null;
                    criticality: string;
                    isActive: boolean;
                  }) => {
                    const crit = criticalityConfig[eq.criticality] ?? criticalityConfig.C;
                    return (
                      <tr key={eq.id} className="hover:bg-theme-table-hover transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono text-theme">{eq.code}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-theme">{eq.name}</div>
                          {eq.description && (
                            <div className="text-xs text-theme-muted line-clamp-1">{eq.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {eq.location ? (
                            <div className="flex items-center gap-1 text-sm text-theme-secondary">
                              <MapPin className="w-3 h-3 text-theme-muted" />
                              {eq.location}
                            </div>
                          ) : (
                            <span className="text-sm text-theme-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={crit.variant}>{crit.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={eq.isActive ? "success" : "default"}>
                            {eq.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                <div className="text-sm text-theme-muted">
                  Página {page} de {data.pagination.totalPages} ({data.pagination.total} equipamentos)
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setPage(page - 1)} disabled={page === 1}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setPage(page + 1)} disabled={page === data.pagination.totalPages}>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={resetForm} title="Novo Equipamento">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Código *</label>
              <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="EQ-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Criticidade *</label>
              <Select
                value={formCriticality}
                onChange={(v) => setFormCriticality(v)}
                options={[
                  { value: "A", label: "A — Crítico" },
                  { value: "B", label: "B — Importante" },
                  { value: "C", label: "C — Normal" },
                ]}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Nome *</label>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome do equipamento" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Descrição</label>
            <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Descrição do equipamento" />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Localização</label>
            <Input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="Ex: Galpão A, Linha 1" />
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
            Criar Equipamento
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
