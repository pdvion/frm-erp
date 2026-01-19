"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  ChevronLeft, 
  Plus, 
  Search,
  Users,
  Edit,
  Trash2,
  FolderTree
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";

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

  const resetForm = () => {
    setFormData({ code: "", name: "", description: "", parentId: "" });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      code: formData.code,
      name: formData.name,
      description: formData.description || undefined,
      parentId: formData.parentId || undefined,
    });
  };

  const filteredDepartments = departments?.filter(
    (dept) =>
      dept.name.toLowerCase().includes(search.toLowerCase()) ||
      dept.code.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Departamentos"
        icon={<Building2 className="w-6 h-6 text-purple-600" />}
        backHref="/hr"
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--frm-primary)] text-white rounded-lg hover:bg-[var(--frm-dark)] transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Departamento</span>
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome ou código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Mostrar inativos</span>
            </label>
          </div>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum departamento encontrado</h3>
            <p className="text-gray-500 mb-4">Crie o primeiro departamento da empresa</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--frm-primary)] text-white rounded-lg hover:bg-[var(--frm-dark)]"
            >
              <Plus className="w-5 h-5" />
              Novo Departamento
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDepartments.map((dept) => (
              <div
                key={dept.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                      <p className="text-sm text-gray-500">{dept.code}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {dept.description && (
                  <p className="text-sm text-gray-600 mb-4">{dept.description}</p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{dept._count.employees} funcionário(s)</span>
                  </div>
                  {dept.parent && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div 
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="form-title"
            >
              <h2 id="form-title" className="text-xl font-semibold mb-6">
                {editingId ? "Editar Departamento" : "Novo Departamento"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento Pai
                  </label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Nenhum (raiz)</option>
                    {departments?.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 px-4 py-2 bg-[var(--frm-primary)] text-white rounded-lg hover:bg-[var(--frm-dark)] disabled:opacity-50"
                  >
                    {createMutation.isPending ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
