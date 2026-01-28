"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Package, Plus, Edit2, Trash2, Check, X } from "lucide-react";

interface CargoTypeFormData {
  code: string;
  name: string;
  description: string;
}

export default function CargoTypesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CargoTypeFormData>({
    code: "",
    name: "",
    description: "",
  });

  const utils = trpc.useUtils();

  const { data: cargoTypes, isLoading } = trpc.impex.listCargoTypes.useQuery({});

  const createMutation = trpc.impex.createCargoType.useMutation({
    onSuccess: () => {
      utils.impex.listCargoTypes.invalidate();
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = trpc.impex.updateCargoType.useMutation({
    onSuccess: () => {
      utils.impex.listCargoTypes.invalidate();
      setShowModal(false);
      resetForm();
    },
  });

  const deleteMutation = trpc.impex.deleteCargoType.useMutation({
    onSuccess: () => {
      utils.impex.listCargoTypes.invalidate();
    },
  });

  const resetForm = () => {
    setFormData({ code: "", name: "", description: "" });
    setEditingId(null);
  };

  const openEdit = (cargoType: NonNullable<typeof cargoTypes>[number]) => {
    setFormData({
      code: cargoType.code,
      name: cargoType.name,
      description: cargoType.description || "",
    });
    setEditingId(cargoType.id);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData,
        description: formData.description || undefined,
      });
    } else {
      createMutation.mutate({
        ...formData,
        description: formData.description || undefined,
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tipos de Carga"
        icon={<Package className="w-6 h-6" />}
        module="PURCHASES"
        breadcrumbs={[
          { label: "ImpEx", href: "/impex" },
          { label: "Tipos de Carga" },
        ]}
        actions={
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Novo Tipo
          </button>
        }
      />

      {/* Tabela */}
      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-theme-secondary">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">Código</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">Nome</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">Descrição</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">Status</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-theme-muted">Carregando...</td>
              </tr>
            ) : !cargoTypes?.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-theme-muted">Nenhum tipo de carga encontrado</td>
              </tr>
            ) : (
              cargoTypes.map((ct) => (
                <tr key={ct.id} className="hover:bg-theme-secondary">
                  <td className="px-4 py-3 font-mono font-medium text-theme">{ct.code}</td>
                  <td className="px-4 py-3 text-theme">{ct.name}</td>
                  <td className="px-4 py-3 text-sm text-theme-muted">{ct.description || "-"}</td>
                  <td className="px-4 py-3 text-center">
                    {ct.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                        <Check className="w-3 h-3" /> Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                        <X className="w-3 h-3" /> Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(ct)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!ct.isShared && (
                        <button
                          onClick={() => {
                            if (confirm("Excluir este tipo de carga?")) {
                              deleteMutation.mutate({ id: ct.id });
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
              {editingId ? "Editar Tipo de Carga" : "Novo Tipo de Carga"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Código *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: FCL"
                  className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Full Container Load"
                  className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2 border border-theme rounded-lg text-theme hover:bg-theme-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.code || !formData.name || createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
