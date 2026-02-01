"use client";

import { useState } from "react";
import { 
  Building2, 
  Plus, 
  Search,
  Users,
  Edit,
  Trash2,
  FolderTree
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

export default function DepartmentsPage() {
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    parentId: "",
  });

  const { data: departments, isLoading, refetch } = trpc.hr.listDepartments.useQuery({
    includeInactive: showInactive,
  });

  const createMutation = trpc.hr.createDepartment.useMutation({
    onSuccess: () => {
      refetch();
      setShowForm(false);
      resetForm();
    },
  });

  const updateMutation = trpc.hr.updateDepartment.useMutation({
    onSuccess: () => {
      refetch();
      setShowForm(false);
      resetForm();
    },
  });

  const deleteMutation = trpc.hr.deleteDepartment.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const resetForm = () => {
    setFormData({ code: "", name: "", description: "", parentId: "" });
    setEditingId(null);
  };

  const handleEdit = (dept: { id: string; code: string; name: string; description: string | null; parentId: string | null }) => {
    setFormData({
      code: dept.code,
      name: dept.name,
      description: dept.description || "",
      parentId: dept.parentId || "",
    });
    setEditingId(dept.id);
    setShowForm(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Deseja excluir o departamento "${name}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        parentId: formData.parentId || undefined,
      });
    } else {
      createMutation.mutate({
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        parentId: formData.parentId || undefined,
      });
    }
  };

  const filteredDepartments = departments?.filter(
    (dept) =>
      dept.name.toLowerCase().includes(search.toLowerCase()) ||
      dept.code.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departamentos"
        icon={<Building2 className="w-6 h-6 text-purple-600" />}
        backHref="/hr"
        actions={
          <Button
            onClick={() => setShowForm(true)}
            leftIcon={<Plus className="w-5 h-5" />}
          >
            Novo Departamento
          </Button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-muted w-5 h-5 z-10" />
              <Input
                placeholder="Buscar por nome ou código..."
                aria-label="Buscar departamentos"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-theme"
              />
              <span className="text-sm text-theme-secondary">Mostrar inativos</span>
            </label>
          </div>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="bg-theme-card rounded-xl shadow-sm border border-theme p-12 text-center">
            <FolderTree className="w-12 h-12 text-theme-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-theme mb-2">Nenhum departamento encontrado</h3>
            <p className="text-theme-muted mb-4">Crie o primeiro departamento da empresa</p>
            <Button
              onClick={() => setShowForm(true)}
              leftIcon={<Plus className="w-5 h-5" />}
            >
              Novo Departamento
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDepartments.map((dept) => (
              <div
                key={dept.id}
                className="bg-theme-card rounded-xl shadow-sm border border-theme p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-theme">{dept.name}</h3>
                      <p className="text-sm text-theme-muted">{dept.code}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(dept)}
                      className="p-1.5 text-theme-muted hover:text-blue-600"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(dept.id, dept.name)}
                      disabled={dept._count.employees > 0}
                      className="p-1.5 text-theme-muted hover:text-red-600"
                      title={dept._count.employees > 0 ? "Não é possível excluir departamento com funcionários" : "Excluir"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {dept.description && (
                  <p className="text-sm text-theme-secondary mb-4">{dept.description}</p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-theme">
                  <div className="flex items-center gap-2 text-sm text-theme-muted">
                    <Users className="w-4 h-4" />
                    <span>{dept._count.employees} funcionário(s)</span>
                  </div>
                  {dept.parent && (
                    <span className="text-xs bg-theme-tertiary text-theme-secondary px-2 py-1 rounded">
                      {dept.parent.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Formulário */}
        {showForm && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setShowForm(false);
                resetForm();
              }
            }}
          >
            <div 
              className="bg-theme-card rounded-xl shadow-xl max-w-md w-full p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="form-title"
            >
              <h2 id="form-title" className="text-xl font-semibold mb-6">
                {editingId ? "Editar Departamento" : "Novo Departamento"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Código *"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />

                <Input
                  label="Nome *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Descrição
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Departamento Pai
                  </label>
                  <Select
                    value={formData.parentId}
                    onChange={(value) => setFormData({ ...formData, parentId: value })}
                    placeholder="Nenhum (raiz)"
                    options={[
                      { value: "", label: "Nenhum (raiz)" },
                      ...(departments?.map((dept) => ({
                        value: dept.id,
                        label: dept.name,
                      })) || []),
                    ]}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    isLoading={createMutation.isPending}
                    className="flex-1"
                  >
                    Salvar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
