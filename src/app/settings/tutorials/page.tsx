"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Check,
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
        orderIndex: tutorial.orderIndex ?? 0,
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
    <div className="space-y-6">
      <PageHeader
        title="Tutoriais"
        subtitle="Gerenciar tutoriais do sistema"
        icon={<BookOpen className="w-6 h-6" />}
        backHref="/settings"
        module="settings"
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/docs"
              target="_blank"
              className="flex items-center gap-2 text-theme-secondary hover:text-blue-600"
            >
              <ExternalLink className="w-4 h-4" />
              Ver Documentação
            </Link>
            <Button
              onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Novo Tutorial
            </Button>
          </div>
        }
      />

      <div>
        {/* Formulário */}
        {showForm && (
          <div className="bg-theme-card rounded-lg border border-theme p-6 mb-6">
            <h2 className="text-lg font-semibold text-theme mb-4">
              {editingId ? "Editar Tutorial" : "Novo Tutorial"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Título *"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      title: e.target.value,
                      slug: editingId ? formData.slug : generateSlug(e.target.value),
                    });
                  }}
                  required
                />
                <Input
                  label="Slug (URL) *"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="font-mono text-sm"
                  required
                />
                <div className="md:col-span-2">
                  <Input
                    label="Descrição"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Breve descrição do tutorial"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Módulo
                  </label>
                  <Select
                    value={formData.module}
                    onChange={(value) => setFormData({ ...formData, module: value })}
                    options={moduleOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Categoria
                  </label>
                  <Select
                    value={formData.category}
                    onChange={(value) => setFormData({ ...formData, category: value })}
                    options={categoryOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Ícone
                  </label>
                  <Select
                    value={formData.icon}
                    onChange={(value) => setFormData({ ...formData, icon: value })}
                    options={iconOptions.map((icon) => ({ value: icon, label: icon }))}
                  />
                </div>
                <Input
                  label="Ordem"
                  type="number"
                  value={formData.orderIndex}
                  onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Conteúdo (Markdown) *
                  </label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="font-mono text-sm"
                    rows={15}
                    required
                    placeholder="# Título&#10;&#10;## Seção 1&#10;&#10;Conteúdo em Markdown..."
                  />
                  <p className="text-xs text-theme-muted mt-1">
                    Suporta: # Títulos, **negrito**, *itálico*, `código`, listas, tabelas
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-theme">
                <label className="flex items-center gap-2">
                  <Input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="rounded border-theme"
                  />
                  <span className="text-sm text-theme-secondary">Publicado</span>
                </label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    isLoading={createMutation.isPending || updateMutation.isPending}
                    leftIcon={<Check className="w-4 h-4" />}
                  >
                    {editingId ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Busca */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted z-10" />
            <Input
              placeholder="Buscar por título, descrição ou módulo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : !filteredTutorials?.length ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-theme-muted mb-4" />
              <p className="text-theme-muted">Nenhum tutorial encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-theme-table">
                <thead className="bg-theme-tertiary">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Ordem</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Título</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Slug</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Módulo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Categoria</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {filteredTutorials.map((tutorial) => (
                    <tr key={tutorial.id} className="hover:bg-theme-hover">
                      <td className="px-4 py-3 text-sm text-theme-muted">
                        {tutorial.orderIndex}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-theme">{tutorial.title}</p>
                          {tutorial.description && (
                            <p className="text-sm text-theme-muted truncate max-w-xs">
                              {tutorial.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-theme-muted">
                        {tutorial.slug}
                      </td>
                      <td className="px-4 py-3 text-sm text-theme-muted">
                        {tutorial.module || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-theme-muted">
                        {tutorial.category || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/docs/${tutorial.slug}`}
                            target="_blank"
                            className="p-1 text-theme-muted hover:text-blue-600"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Button
                            onClick={() => handleEdit(tutorial.id)}
                            className="p-1 text-theme-muted hover:text-blue-600"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(tutorial.id)}
                            className="p-1 text-theme-muted hover:text-red-600"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
