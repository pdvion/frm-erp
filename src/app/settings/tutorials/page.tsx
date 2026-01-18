"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  ChevronLeft,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Check,
  X,
  Search,
  ExternalLink,
} from "lucide-react";

const moduleOptions = [
  { value: "", label: "Nenhum" },
  { value: "MATERIALS", label: "Materiais" },
  { value: "SUPPLIERS", label: "Fornecedores" },
  { value: "QUOTES", label: "Orçamentos" },
  { value: "RECEIVING", label: "Entrada de Materiais" },
  { value: "MATERIAL_OUT", label: "Saída de Materiais" },
  { value: "INVENTORY", label: "Estoque" },
  { value: "REPORTS", label: "Relatórios" },
  { value: "SETTINGS", label: "Configurações" },
];

const categoryOptions = [
  { value: "getting-started", label: "Primeiros Passos" },
  { value: "how-to", label: "Como Fazer" },
  { value: "reference", label: "Referência" },
];

const iconOptions = [
  "BookOpen", "Package", "Truck", "Warehouse", "Boxes", "Rocket",
  "FileText", "Settings", "Building2", "Users", "DollarSign", "BarChart",
];

export default function TutorialsAdminPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: tutorials, isLoading, refetch } = trpc.tutorials.listAll.useQuery();

  const createMutation = trpc.tutorials.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowForm(false);
      resetForm();
    },
  });

  const updateMutation = trpc.tutorials.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditingId(null);
      setShowForm(false);
      resetForm();
    },
  });

  const deleteMutation = trpc.tutorials.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    description: "",
    content: "",
    module: "",
    category: "how-to",
    icon: "FileText",
    orderIndex: 0,
    isPublished: true,
  });

  const resetForm = () => {
    setFormData({
      slug: "",
      title: "",
      description: "",
      content: "",
      module: "",
      category: "how-to",
      icon: "FileText",
      orderIndex: 0,
      isPublished: true,
    });
  };

  const handleEdit = async (id: string) => {
    const tutorial = tutorials?.find((t) => t.id === id);
    if (tutorial) {
      // Buscar conteúdo completo
      setEditingId(id);
      setFormData({
        slug: tutorial.slug,
        title: tutorial.title,
        description: tutorial.description || "",
        content: "", // Será preenchido ao abrir o form
        module: tutorial.module || "",
        category: tutorial.category || "how-to",
        icon: tutorial.icon || "FileText",
        orderIndex: tutorial.orderIndex,
        isPublished: true,
      });
      setShowForm(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData,
        module: formData.module || undefined,
      });
    } else {
      createMutation.mutate({
        ...formData,
        module: formData.module || undefined,
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este tutorial?")) {
      deleteMutation.mutate({ id });
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const filteredTutorials = tutorials?.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.module?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/settings" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Tutoriais</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/docs"
                target="_blank"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
              >
                <ExternalLink className="w-4 h-4" />
                Ver Documentação
              </Link>
              <CompanySwitcher />
              <button
                onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Novo Tutorial
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Formulário */}
        {showForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? "Editar Tutorial" : "Novo Tutorial"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        title: e.target.value,
                        slug: editingId ? formData.slug : generateSlug(e.target.value),
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug (URL) *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                    required
                    pattern="[a-z0-9-]+"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Breve descrição do tutorial"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Módulo
                  </label>
                  <select
                    value={formData.module}
                    onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {moduleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ícone
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {iconOptions.map((icon) => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordem
                  </label>
                  <input
                    type="number"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conteúdo (Markdown) *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                    rows={15}
                    required
                    placeholder="# Título&#10;&#10;## Seção 1&#10;&#10;Conteúdo em Markdown..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Suporta: # Títulos, **negrito**, *itálico*, `código`, listas, tabelas
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Publicado</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {editingId ? "Salvar" : "Criar"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Busca */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, descrição ou módulo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 outline-none"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : !filteredTutorials?.length ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhum tutorial encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordem</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Módulo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTutorials.map((tutorial) => (
                    <tr key={tutorial.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {tutorial.orderIndex}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{tutorial.title}</p>
                          {tutorial.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {tutorial.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-500">
                        {tutorial.slug}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {tutorial.module || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {tutorial.category || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/docs/${tutorial.slug}`}
                            target="_blank"
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleEdit(tutorial.id)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tutorial.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
