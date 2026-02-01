"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { FileText, Plus, Edit2, Trash2, Check, X, Info } from "lucide-react";

interface IncotermFormData {
  code: string;
  name: string;
  description: string;
}

export default function IncotermsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<IncotermFormData>({
    code: "",
    name: "",
    description: "",
  });

  const utils = trpc.useUtils();

  const { data: incoterms, isLoading } = trpc.impex.listIncoterms.useQuery({});

  const createMutation = trpc.impex.createIncoterm.useMutation({
    onSuccess: () => {
      utils.impex.listIncoterms.invalidate();
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = trpc.impex.updateIncoterm.useMutation({
    onSuccess: () => {
      utils.impex.listIncoterms.invalidate();
      setShowModal(false);
      resetForm();
    },
  });

  const deleteMutation = trpc.impex.deleteIncoterm.useMutation({
    onSuccess: () => {
      utils.impex.listIncoterms.invalidate();
    },
  });

  const resetForm = () => {
    setFormData({ code: "", name: "", description: "" });
    setEditingId(null);
  };

  const openEdit = (incoterm: NonNullable<typeof incoterms>[number]) => {
    setFormData({
      code: incoterm.code,
      name: incoterm.name,
      description: incoterm.description || "",
    });
    setEditingId(incoterm.id);
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
        title="Incoterms"
        icon={<FileText className="w-6 h-6" />}
        module="PURCHASES"
        breadcrumbs={[
          { label: "ImpEx", href: "/impex" },
          { label: "Incoterms" },
        ]}
        actions={
          <Button
            onClick={() => { resetForm(); setShowModal(true); }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Novo Incoterm
          </Button>
        }
      />

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">Incoterms 2020</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Os Incoterms (International Commercial Terms) são termos padronizados pela Câmara de Comércio Internacional 
              que definem as responsabilidades de compradores e vendedores em transações internacionais.
            </p>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-theme-muted">Carregando...</div>
        ) : !incoterms?.length ? (
          <div className="px-4 py-8 text-center text-theme-muted">Nenhum incoterm encontrado</div>
        ) : (
          <div className="divide-y divide-theme">
            {incoterms.map((incoterm) => (
              <div key={incoterm.id} className="hover:bg-theme-secondary">
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 font-mono font-bold rounded">
                      {incoterm.code}
                    </span>
                    <div>
                      <h4 className="font-medium text-theme">{incoterm.name}</h4>
                      {incoterm.description && (
                        <button
                          onClick={() => setExpandedId(expandedId === incoterm.id ? null : incoterm.id)}
                          className="text-sm text-blue-600 hover:underline mt-1"
                        >
                          {expandedId === incoterm.id ? "Ocultar detalhes" : "Ver detalhes"}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {incoterm.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                        <Check className="w-3 h-3" /> Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                        <X className="w-3 h-3" /> Inativo
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(incoterm)}
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </Button>
                      {!incoterm.isShared && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Excluir este incoterm?")) {
                              deleteMutation.mutate({ id: incoterm.id });
                            }
                          }}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {expandedId === incoterm.id && incoterm.description && (
                  <div className="px-4 pb-4">
                    <div className="p-4 bg-theme-secondary rounded-lg text-sm text-theme">
                      {incoterm.description}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card border border-theme rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-theme mb-4">
              {editingId ? "Editar Incoterm" : "Novo Incoterm"}
            </h3>
            <div className="space-y-4">
              <Input
                label="Código *"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Ex: FOB"
                maxLength={10}
              />
              <Input
                label="Nome *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Free On Board"
              />
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Descrição</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Descrição detalhada das responsabilidades..."
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
