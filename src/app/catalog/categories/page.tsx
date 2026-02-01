"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  FolderTree,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  parentId: string;
}

const initialFormData: CategoryFormData = {
  name: "",
  slug: "",
  description: "",
  parentId: "",
};

export default function CategoriesPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: categories, isLoading } = trpc.productCatalog.listCategories.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.productCatalog.createCategory.useMutation({
    onSuccess: () => {
      utils.productCatalog.listCategories.invalidate();
      setShowForm(false);
      setFormData(initialFormData);
    },
  });

  const updateMutation = trpc.productCatalog.updateCategory.useMutation({
    onSuccess: () => {
      utils.productCatalog.listCategories.invalidate();
      setEditingId(null);
      setFormData(initialFormData);
    },
  });

  const deleteMutation = trpc.productCatalog.deleteCategory.useMutation({
    onSuccess: () => {
      utils.productCatalog.listCategories.invalidate();
      setDeletingId(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        name: formData.name,
        slug: formData.slug || undefined,
        description: formData.description || undefined,
        parentId: formData.parentId || undefined,
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        slug: formData.slug || undefined,
        description: formData.description || undefined,
        parentId: formData.parentId || undefined,
      });
    }
  };

  const handleEdit = (category: { id: string; name: string; slug: string; description?: string | null; parentId?: string | null }) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      parentId: category.parentId || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta categoria?")) {
      setDeletingId(id);
      deleteMutation.mutate({ id });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData((prev) => ({ ...prev, slug }));
  };

  const rootCategories = categories?.filter((c) => !c.parentId) ?? [];
  const getChildren = (parentId: string) =>
    categories?.filter((c) => c.parentId === parentId) ?? [];

  const renderCategory = (category: NonNullable<typeof categories>[0], level = 0) => {
    const children = getChildren(category.id);
    const isDeleting = deletingId === category.id;

    return (
      <div key={category.id}>
        <div
          className={`flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-750 border-b border-gray-100 dark:border-gray-700 ${
            level > 0 ? "bg-gray-50/50 dark:bg-gray-800/50" : ""
          }`}
          style={{ paddingLeft: `${12 + level * 24}px` }}
        >
          <div className="flex items-center gap-3">
            <FolderTree size={18} className="text-gray-400" />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {category.name}
              </div>
              <div className="text-xs text-gray-500">/{category.slug}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 mr-2">
              {category._count?.products ?? 0} produtos
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(category)}
              title="Editar"
            >
              <Pencil size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(category.id)}
              disabled={isDeleting}
              isLoading={isDeleting}
              title="Excluir"
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
        {children.map((child) => renderCategory(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Categorias do Catálogo"
        subtitle="Organize seus produtos em categorias hierárquicas"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/catalog")}
              leftIcon={<ArrowLeft size={20} />}
            >
              Voltar
            </Button>
            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                leftIcon={<Plus size={20} />}
              >
                Nova Categoria
              </Button>
            )}
          </div>
        }
      />

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
            {editingId ? "Editar Categoria" : "Nova Categoria"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="categoria-slug"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateSlug}
                    disabled={!formData.name}
                  >
                    Gerar
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoria Pai
              </label>
              <select
                value={formData.parentId}
                onChange={(e) => setFormData((prev) => ({ ...prev, parentId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              >
                <option value="">Nenhuma (categoria raiz)</option>
                {categories
                  ?.filter((c) => c.id !== editingId)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending || !formData.name}
                isLoading={createMutation.isPending || updateMutation.isPending}
                leftIcon={<Save size={18} />}
              >
                {editingId ? "Salvar" : "Criar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                leftIcon={<X size={18} />}
              >
                Cancelar
              </Button>
            </div>

            {(createMutation.isError || updateMutation.isError) && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                Erro: {createMutation.error?.message || updateMutation.error?.message}
              </div>
            )}
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-blue-600" />
          </div>
        ) : categories?.length === 0 ? (
          <div className="text-center py-12">
            <FolderTree size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Nenhuma categoria
            </h3>
            <p className="text-gray-500 mb-4">
              Crie categorias para organizar seus produtos
            </p>
            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                leftIcon={<Plus size={20} />}
              >
                Criar Categoria
              </Button>
            )}
          </div>
        ) : (
          <div>{rootCategories.map((cat) => renderCategory(cat))}</div>
        )}
      </div>
    </div>
  );
}
