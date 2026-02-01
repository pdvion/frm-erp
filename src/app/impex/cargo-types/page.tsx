"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
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
          <Button
            onClick={() => { resetForm(); setShowModal(true); }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Novo Tipo
          </Button>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(ct)}
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </Button>
                      {!ct.isShared && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Excluir este tipo de carga?")) {
                              deleteMutation.mutate({ id: ct.id });
                            }
                          }}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
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
              <Input
                label="Código *"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Ex: FCL"
              />
              <Input
                label="Nome *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Full Container Load"
              />
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Descrição</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => { setShowModal(false); resetForm(); }}
              >
                Cancelar
              </Button>
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
