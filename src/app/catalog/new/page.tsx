"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { RichTextEditor } from "@/components/editor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

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
            <Button
              variant="outline"
              onClick={() => router.back()}
              leftIcon={<ArrowLeft size={20} />}
            >
              Voltar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name}
              isLoading={createMutation.isPending}
              leftIcon={<Save size={20} />}
            >
              Salvar
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="border-b border-theme">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 rounded-none border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-theme-muted hover:text-theme-secondary"
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Tab */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-4">
                <h3 className="font-medium text-theme">
                  Informações Básicas
                </h3>

                <Input
                  label="Nome do Produto *"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Código/SKU"
                    value={formData.code}
                    onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                  />
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary mb-1">
                      Categoria
                    </label>
                    <Select
                      value={formData.categoryId}
                      onChange={(value) => setFormData((prev) => ({ ...prev, categoryId: value }))}
                      placeholder="Selecione..."
                      options={[
                        { value: "", label: "Selecione..." },
                        ...(categories?.map((cat) => ({
                          value: cat.id,
                          label: cat.name,
                        })) || []),
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Descrição Curta
                  </label>
                  <Textarea
                    value={formData.shortDescription}
                    onChange={(e) => setFormData((prev) => ({ ...prev, shortDescription: e.target.value }))}
                    rows={2}
                    maxLength={255}
                  />
                  <p className="text-xs text-theme-muted mt-1">
                    {formData.shortDescription.length}/255 caracteres
                  </p>
                </div>
              </div>

              <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-4">
                <h3 className="font-medium text-theme">
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
              <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-4">
                <h3 className="font-medium text-theme">Tags</h3>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                  placeholder="tag1, tag2, tag3"
                  hint="Separe as tags por vírgula"
                />
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
            <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-4">
              <h3 className="font-medium text-theme">Preços</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Preço de Custo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costPrice}
                      onChange={(e) => setFormData((prev) => ({ ...prev, costPrice: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-blue-500 bg-theme-card text-theme"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Preço de Tabela
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.listPrice}
                      onChange={(e) => setFormData((prev) => ({ ...prev, listPrice: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-blue-500 bg-theme-card text-theme"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Preço Promocional
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.salePrice}
                      onChange={(e) => setFormData((prev) => ({ ...prev, salePrice: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-blue-500 bg-theme-card text-theme"
                    />
                  </div>
                </div>
              </div>

              {formData.listPrice && formData.costPrice && (
                <div className="pt-4 border-t border-theme">
                  <div className="text-sm text-theme-muted">
                    Margem:{" "}
                    <span className="font-medium text-theme">
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
            <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-4">
              <h3 className="font-medium text-theme">
                Otimização para Buscadores (SEO)
              </h3>

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  URL Amigável (Slug)
                </label>
                <div className="flex gap-2">
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="meu-produto"
                    className="flex-1"
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
                <p className="text-xs text-theme-muted mt-1">
                  URL: /catalog/{formData.slug || "slug-do-produto"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Título SEO
                </label>
                <Input
                  value={formData.metaTitle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))}
                  maxLength={60}
                />
                <p className="text-xs text-theme-muted mt-1">
                  {formData.metaTitle.length}/60 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Descrição SEO
                </label>
                <Textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))}
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-theme-muted mt-1">
                  {formData.metaDescription.length}/160 caracteres
                </p>
              </div>

              {/* Preview */}
              <div className="pt-4 border-t border-theme">
                <p className="text-xs font-medium text-theme-muted mb-2">Preview no Google:</p>
                <div className="p-3 bg-theme-tertiary rounded-lg">
                  <div className="text-blue-600 text-lg truncate">
                    {formData.metaTitle || formData.name || "Título do Produto"}
                  </div>
                  <div className="text-green-700 text-sm">
                    seusite.com.br/catalog/{formData.slug || "produto"}
                  </div>
                  <div className="text-theme-muted text-sm line-clamp-2">
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
