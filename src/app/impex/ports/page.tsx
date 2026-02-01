"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Anchor, Plus, Search, Edit2, Trash2, Ship, Plane, Truck } from "lucide-react";

type PortType = "MARITIME" | "AIRPORT" | "BORDER";

interface PortFormData {
  code: string;
  name: string;
  country: string;
  type: PortType;
  isShared: boolean;
}

export default function PortsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<PortType | "ALL">("ALL");
  const [countryFilter, setCountryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PortFormData>({
    code: "",
    name: "",
    country: "BR",
    type: "MARITIME",
    isShared: false,
  });

  const utils = trpc.useUtils();

  const { data: ports, isLoading } = trpc.impex.listPorts.useQuery({
    search: search || undefined,
    type: typeFilter !== "ALL" ? typeFilter : undefined,
    country: countryFilter || undefined,
  });

  const createMutation = trpc.impex.createPort.useMutation({
    onSuccess: () => {
      utils.impex.listPorts.invalidate();
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = trpc.impex.updatePort.useMutation({
    onSuccess: () => {
      utils.impex.listPorts.invalidate();
      setShowModal(false);
      resetForm();
    },
  });

  const deleteMutation = trpc.impex.deletePort.useMutation({
    onSuccess: () => {
      utils.impex.listPorts.invalidate();
    },
  });

  const resetForm = () => {
    setFormData({ code: "", name: "", country: "BR", type: "MARITIME", isShared: false });
    setEditingId(null);
  };

  const openEdit = (port: typeof ports extends (infer T)[] | undefined ? T : never) => {
    if (!port) return;
    setFormData({
      code: port.code,
      name: port.name,
      country: port.country,
      type: port.type,
      isShared: port.isShared,
    });
    setEditingId(port.id);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getTypeIcon = (type: PortType) => {
    switch (type) {
      case "MARITIME": return <Ship className="w-4 h-4" />;
      case "AIRPORT": return <Plane className="w-4 h-4" />;
      case "BORDER": return <Truck className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: PortType) => {
    switch (type) {
      case "MARITIME": return "Marítimo";
      case "AIRPORT": return "Aeroporto";
      case "BORDER": return "Fronteira";
    }
  };

  const countries = [...new Set(ports?.map(p => p.country) || [])].sort();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portos e Aeroportos"
        icon={<Anchor className="w-6 h-6" />}
        module="PURCHASES"
        breadcrumbs={[
          { label: "ImpEx", href: "/impex" },
          { label: "Portos" },
        ]}
        actions={
          <Button
            onClick={() => { resetForm(); setShowModal(true); }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Novo Porto
          </Button>
        }
      />

      {/* Filtros */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted z-10" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código ou nome..."
              className="pl-10"
            />
          </div>
          <Select
            value={typeFilter}
            onChange={(value) => setTypeFilter(value as PortType | "ALL")}
            options={[
              { value: "ALL", label: "Todos os tipos" },
              { value: "MARITIME", label: "Marítimo" },
              { value: "AIRPORT", label: "Aeroporto" },
              { value: "BORDER", label: "Fronteira" },
            ]}
          />
          <Select
            value={countryFilter}
            onChange={setCountryFilter}
            placeholder="Todos os países"
            options={countries.map(c => ({ value: c, label: c }))}
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-theme-secondary">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">Código</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">Nome</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">País</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">Tipo</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-theme-muted">Carregando...</td>
              </tr>
            ) : !ports?.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-theme-muted">Nenhum porto encontrado</td>
              </tr>
            ) : (
              ports.map((port) => (
                <tr key={port.id} className="hover:bg-theme-secondary">
                  <td className="px-4 py-3 font-mono font-medium text-theme">{port.code}</td>
                  <td className="px-4 py-3 text-theme">{port.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-theme-secondary rounded text-sm text-theme">{port.country}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                      {getTypeIcon(port.type)}
                      {getTypeLabel(port.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(port)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!port.isShared && (
                        <button
                          onClick={() => {
                            if (confirm("Excluir este porto?")) {
                              deleteMutation.mutate({ id: port.id });
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card border border-theme rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-theme mb-4">
              {editingId ? "Editar Porto" : "Novo Porto"}
            </h3>
            <div className="space-y-4">
              <Input
                label="Código *"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Ex: BRSSZ"
              />
              <Input
                label="Nome *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Porto de Santos"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="País *"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                  placeholder="BR"
                  maxLength={2}
                />
                <div>
                  <label className="block text-sm font-medium text-theme mb-1">Tipo *</label>
                  <Select
                    value={formData.type}
                    onChange={(value) => setFormData({ ...formData, type: value as PortType })}
                    options={[
                      { value: "MARITIME", label: "Marítimo" },
                      { value: "AIRPORT", label: "Aeroporto" },
                      { value: "BORDER", label: "Fronteira" },
                    ]}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2 border border-theme rounded-lg text-theme hover:bg-theme-secondary"
              >
                Cancelar
              </button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.code || !formData.name}
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
