"use client";

import { Suspense, useState } from "react";
import {
  FolderOpen,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  FileText,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";

interface CategoryChild {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { documents: number; children: number };
  children: CategoryChild[];
}

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
  parentId: string | null;
}

function ChildCategoryItem({
  child,
  level,
  onEdit,
  onDelete,
}: {
  child: CategoryChild;
  level: number;
  onEdit: (child: CategoryChild) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 hover:bg-theme-secondary transition-colors border-l-2 border-theme ml-6"
      style={{ paddingLeft: `${level * 24 + 12}px` }}
    >
      <div className="w-6" />

      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: child.color || "#6B7280" }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-theme truncate">{child.name}</span>
          {!child.isActive && (
            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">
              Inativa
            </span>
          )}
        </div>
        {child.description && (
          <p className="text-sm text-theme-muted truncate">{child.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(child)}
          className="p-2 text-theme-muted hover:text-blue-500 transition-colors"
          title="Editar"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(child.id)}
          className="p-2 text-theme-muted hover:text-red-500 transition-colors"
          title="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CategoryItem({
  category,
  onEdit,
  onEditChild,
  onDelete,
  expandedIds,
  toggleExpand,
}: {
  category: Category;
  onEdit: (cat: Category) => void;
  onEditChild: (child: CategoryChild) => void;
  onDelete: (id: string) => void;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedIds.has(category.id);

  return (
    <>
      <div className="flex items-center gap-3 p-3 hover:bg-theme-secondary transition-colors">
        {hasChildren ? (
          <button
            onClick={() => toggleExpand(category.id)}
            className="p-1 hover:bg-theme-secondary rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-theme-muted" />
            ) : (
              <ChevronRight className="w-4 h-4 text-theme-muted" />
            )}
          </button>
        ) : (
          <div className="w-6" />
        )}

        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: category.color || "#6B7280" }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-theme truncate">{category.name}</span>
            {!category.isActive && (
              <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">
                Inativa
              </span>
            )}
          </div>
          {category.description && (
            <p className="text-sm text-theme-muted truncate">{category.description}</p>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-theme-muted">
          <span className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            {category._count.documents}
          </span>
          {hasChildren && (
            <span className="flex items-center gap-1">
              <FolderOpen className="w-4 h-4" />
              {category._count.children}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-theme-muted hover:text-blue-500 transition-colors"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(category.id)}
            disabled={category._count.documents > 0 || category._count.children > 0}
            className="p-2 text-theme-muted hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              category._count.documents > 0
                ? "Categoria possui documentos"
                : category._count.children > 0
                ? "Categoria possui subcategorias"
                : "Excluir"
            }
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {category.children.map((child) => (
            <ChildCategoryItem
              key={child.id}
              child={child}
              level={1}
              onEdit={onEditChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </>
  );
}

function CategoryModal({
  category,
  categories,
  onClose,
  onSave,
  isLoading,
}: {
  category: Category | null;
  categories: Category[];
  onClose: () => void;
  onSave: (data: CategoryFormData, id?: string) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || "",
    description: category?.description || "",
    color: category?.color || "#3B82F6",
    icon: category?.icon || "folder",
    parentId: category?.parentId || null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, category?.id);
  };

  const flatCategories = categories.flatMap((cat) => [
    cat,
    ...cat.children.map((c) => ({ ...c, name: `  └ ${c.name}` })),
  ]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-theme-card border border-theme rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-theme">
          <h2 className="text-lg font-semibold text-theme">
            {category ? "Editar Categoria" : "Nova Categoria"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-theme-muted hover:text-theme rounded-lg hover:bg-theme-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
              placeholder="Ex: Contratos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme mb-1">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme resize-none"
              placeholder="Descrição opcional"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Cor
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-10 h-10 rounded border border-theme cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Categoria Pai
              </label>
              <select
                value={formData.parentId || ""}
                onChange={(e) =>
                  setFormData({ ...formData, parentId: e.target.value || null })
                }
                className="w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
              >
                <option value="">Nenhuma (raiz)</option>
                {flatCategories
                  .filter((c) => c.id !== category?.id)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-theme-muted hover:text-theme transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoriesContent() {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: categories, isLoading, refetch } = trpc.documents.listCategories.useQuery({
    includeInactive: true,
  });

  const createMutation = trpc.documents.createCategory.useMutation({
    onSuccess: () => {
      refetch();
      setShowModal(false);
      setEditingCategory(null);
    },
  });

  const updateMutation = trpc.documents.updateCategory.useMutation({
    onSuccess: () => {
      refetch();
      setShowModal(false);
      setEditingCategory(null);
    },
  });

  const deleteMutation = trpc.documents.deleteCategory.useMutation({
    onSuccess: () => refetch(),
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta categoria?")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const handleSave = async (data: CategoryFormData, id?: string) => {
    if (id) {
      await updateMutation.mutateAsync({
        id,
        name: data.name,
        description: data.description || undefined,
        color: data.color || undefined,
        icon: data.icon || undefined,
        parentId: data.parentId,
      });
    } else {
      await createMutation.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        color: data.color || undefined,
        icon: data.icon || undefined,
        parentId: data.parentId || undefined,
      });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleNewCategory = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias de Documentos"
        icon={<FolderOpen className="w-6 h-6" />}
        module="DOCUMENTS"
        breadcrumbs={[
          { label: "Documentos", href: "/documents" },
          { label: "Categorias" },
        ]}
        actions={
          <button
            onClick={handleNewCategory}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nova Categoria</span>
          </button>
        }
      />

      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-theme-muted">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            Carregando categorias...
          </div>
        ) : !categories || categories.length === 0 ? (
          <div className="p-8 text-center text-theme-muted">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">Nenhuma categoria cadastrada</p>
            <button
              onClick={handleNewCategory}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Criar primeira categoria
            </button>
          </div>
        ) : (
          <div className="divide-y divide-theme">
            {categories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                onEdit={handleEdit}
                onEditChild={(child) => {
                  setEditingCategory({
                    ...child,
                    _count: { documents: 0, children: 0 },
                    children: [],
                  });
                  setShowModal(true);
                }}
                onDelete={handleDelete}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
              />
            ))}
          </div>
        )}
      </div>

      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <h3 className="font-medium text-theme mb-2">Dicas</h3>
        <ul className="text-sm text-theme-muted space-y-1">
          <li>• Organize documentos em categorias para facilitar a busca</li>
          <li>• Crie subcategorias para uma organização mais detalhada</li>
          <li>• Categorias com documentos ou subcategorias não podem ser excluídas</li>
          <li>• Use cores diferentes para identificar visualmente cada categoria</li>
        </ul>
      </div>

      {showModal && (
        <CategoryModal
          category={editingCategory}
          categories={categories ?? []}
          onClose={() => {
            setShowModal(false);
            setEditingCategory(null);
          }}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <CategoriesContent />
    </Suspense>
  );
}
