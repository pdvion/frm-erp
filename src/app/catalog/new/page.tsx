"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { RichTextEditor } from "@/components/editor";

export default function NewProductPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"general" | "pricing" | "seo">("general");
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    shortDescription: "",
    description: "",
    specifications: "",
    categoryId: "",
    listPrice: "",
    salePrice: "",
    costPrice: "",
    slug: "",
    metaTitle: "",
    metaDescription: "",
    tags: "",
  });

  const { data: categories } = trpc.productCatalog.listCategories.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.productCatalog.createProduct.useMutation({
    onSuccess: (product) => {
      utils.productCatalog.listProducts.invalidate();
      router.push(`/catalog/${product.id}/edit`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formData.name,
      code: formData.code || `PROD-${Date.now()}`,
      shortDescription: formData.shortDescription || undefined,
      description: formData.description || undefined,
      specifications: formData.specifications ? JSON.parse(formData.specifications) : undefined,
      categoryId: formData.categoryId || undefined,
      listPrice: formData.listPrice ? parseFloat(formData.listPrice) : undefined,
      salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
      slug: formData.slug || undefined,
      metaTitle: formData.metaTitle || undefined,
      metaDescription: formData.metaDescription || undefined,
      tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : undefined,
    });
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

  const tabs = [
    { id: "general", label: "Geral" },
    { id: "pricing", label: "Preços" },
    { id: "seo", label: "SEO" },
  ] as const;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Novo Produto"
        subtitle="Crie um novo produto para o catálogo"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ArrowLeft size={20} />
              Voltar
            </button>
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || !formData.name}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Save size={20} />
              )}
              Salvar
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Tab */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Informações Básicas
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Código/SKU
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Categoria
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    >
                      <option value="">Selecione...</option>
                      {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrição Curta
                  </label>
                  <textarea
                    value={formData.shortDescription}
                    onChange={(e) => setFormData((prev) => ({ ...prev, shortDescription: e.target.value }))}
                    rows={2}
                    maxLength={255}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.shortDescription.length}/255 caracteres
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Descrição Completa
                </h3>
                <RichTextEditor
                  content={formData.description}
                  onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
                  placeholder="Descreva o produto em detalhes..."
                  minHeight="300px"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Tags</h3>
                <div>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                    placeholder="tag1, tag2, tag3"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separe as tags por vírgula</p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Dica:</strong> Após salvar, você poderá adicionar imagens, vídeos e anexos na aba de edição.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === "pricing" && (
          <div className="max-w-2xl">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Preços</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preço de Custo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costPrice}
                      onChange={(e) => setFormData((prev) => ({ ...prev, costPrice: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preço de Tabela
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.listPrice}
                      onChange={(e) => setFormData((prev) => ({ ...prev, listPrice: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preço Promocional
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.salePrice}
                      onChange={(e) => setFormData((prev) => ({ ...prev, salePrice: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>

              {formData.listPrice && formData.costPrice && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500">
                    Margem:{" "}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {(
                        ((parseFloat(formData.listPrice) - parseFloat(formData.costPrice)) /
                          parseFloat(formData.costPrice)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SEO Tab */}
        {activeTab === "seo" && (
          <div className="max-w-2xl">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Otimização para Buscadores (SEO)
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL Amigável (Slug)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="meu-produto"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  />
                  <button
                    type="button"
                    onClick={generateSlug}
                    disabled={!formData.name}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm disabled:opacity-50"
                  >
                    Gerar
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  URL: /catalog/{formData.slug || "slug-do-produto"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título SEO
                </label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))}
                  maxLength={60}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.metaTitle.length}/60 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição SEO
                </label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))}
                  rows={3}
                  maxLength={160}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.metaDescription.length}/160 caracteres
                </p>
              </div>

              {/* Preview */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 mb-2">Preview no Google:</p>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-blue-600 text-lg truncate">
                    {formData.metaTitle || formData.name || "Título do Produto"}
                  </div>
                  <div className="text-green-700 text-sm">
                    seusite.com.br/catalog/{formData.slug || "produto"}
                  </div>
                  <div className="text-gray-600 text-sm line-clamp-2">
                    {formData.metaDescription || formData.shortDescription || "Descrição do produto..."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {createMutation.isError && (
          <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            Erro ao criar produto: {createMutation.error.message}
          </div>
        )}
      </form>
    </div>
  );
}
