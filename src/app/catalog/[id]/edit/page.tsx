"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Trash2, Globe, GlobeLock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { RichTextEditor } from "@/components/editor";
import { ProductImageUpload } from "@/components/catalog/ProductImageUpload";
import { ProductVideoManager } from "@/components/catalog/ProductVideoManager";
import { ProductAttachmentManager } from "@/components/catalog/ProductAttachmentManager";

type TabId = "general" | "media" | "pricing" | "seo";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    shortDescription: "",
    description: "",
    categoryId: "",
    listPrice: "",
    salePrice: "",
    costPrice: "",
    slug: "",
    metaTitle: "",
    metaDescription: "",
    tags: "",
    status: "draft",
  });

  const { data: product, isLoading } = trpc.productCatalog.getProduct.useQuery({
    id: productId,
  });

  const { data: categories } = trpc.productCatalog.listCategories.useQuery();
  const { data: media, refetch: refetchMedia } = trpc.productMedia.getProductMedia.useQuery({
    productId,
  });

  const utils = trpc.useUtils();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        code: product.code,
        shortDescription: product.shortDescription || "",
        description: product.description || "",
        categoryId: product.categoryId || "",
        listPrice: product.listPrice?.toString() || "",
        salePrice: product.salePrice?.toString() || "",
        costPrice: "",
        slug: product.slug,
        metaTitle: product.metaTitle || "",
        metaDescription: product.metaDescription || "",
        tags: product.tags?.join(", ") || "",
        status: product.status,
      });
    }
  }, [product]);

  const updateMutation = trpc.productCatalog.updateProduct.useMutation({
    onSuccess: () => {
      utils.productCatalog.getProduct.invalidate({ id: productId });
      utils.productCatalog.listProducts.invalidate();
    },
  });

  const publishMutation = trpc.productCatalog.publishProduct.useMutation({
    onSuccess: () => {
      utils.productCatalog.getProduct.invalidate({ id: productId });
      utils.productCatalog.listProducts.invalidate();
    },
  });


  const deleteMutation = trpc.productCatalog.deleteProduct.useMutation({
    onSuccess: () => {
      router.push("/catalog");
    },
  });

  // Media mutations
  const getUploadUrlMutation = trpc.productMedia.getUploadUrl.useMutation();
  const confirmImageMutation = trpc.productMedia.confirmImageUpload.useMutation({
    onSuccess: () => refetchMedia(),
  });
  const deleteImageMutation = trpc.productMedia.deleteImage.useMutation({
    onSuccess: () => refetchMedia(),
  });
  const reorderImagesMutation = trpc.productMedia.reorderImages.useMutation({
    onSuccess: () => refetchMedia(),
  });
  const setPrimaryImageMutation = trpc.productMedia.setPrimaryImage.useMutation({
    onSuccess: () => refetchMedia(),
  });
  const confirmVideoMutation = trpc.productMedia.confirmVideoUpload.useMutation({
    onSuccess: () => refetchMedia(),
  });
  const deleteVideoMutation = trpc.productMedia.deleteVideo.useMutation({
    onSuccess: () => refetchMedia(),
  });
  const confirmAttachmentMutation = trpc.productMedia.confirmAttachmentUpload.useMutation({
    onSuccess: () => refetchMedia(),
  });
  const deleteAttachmentMutation = trpc.productMedia.deleteAttachment.useMutation({
    onSuccess: () => refetchMedia(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: productId,
      name: formData.name,
      code: formData.code || undefined,
      shortDescription: formData.shortDescription || undefined,
      description: formData.description || undefined,
      categoryId: formData.categoryId || undefined,
      listPrice: formData.listPrice ? parseFloat(formData.listPrice) : undefined,
      salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
      slug: formData.slug || undefined,
      metaTitle: formData.metaTitle || undefined,
      metaDescription: formData.metaDescription || undefined,
      tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : undefined,
      status: formData.status as "draft" | "active" | "inactive" | "discontinued",
    });
  };

  const handleImageUpload = async (file: File) => {
    const { signedUrl, path } = await getUploadUrlMutation.mutateAsync({
      productId,
      fileName: file.name,
      fileType: file.type,
      mediaType: "image",
    });

    await fetch(signedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    await confirmImageMutation.mutateAsync({
      productId,
      path,
      fileName: file.name,
      sizeBytes: file.size,
    });
  };

  const handleAttachmentUpload = async (file: File, type: string) => {
    const { signedUrl, path } = await getUploadUrlMutation.mutateAsync({
      productId,
      fileName: file.name,
      fileType: file.type,
      mediaType: "attachment",
    });

    await fetch(signedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    await confirmAttachmentMutation.mutateAsync({
      productId,
      path,
      fileName: file.name,
      fileType: file.type,
      sizeBytes: file.size,
      type: type as "datasheet" | "manual" | "certificate" | "brochure" | "warranty",
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 text-center py-12">
        <h2 className="text-xl font-medium mb-2">Produto não encontrado</h2>
        <button onClick={() => router.push("/catalog")} className="text-blue-600">
          Voltar ao catálogo
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "general" as const, label: "Geral" },
    { id: "media" as const, label: "Mídia" },
    { id: "pricing" as const, label: "Preços" },
    { id: "seo" as const, label: "SEO" },
  ];

  const images = media?.images ?? [];
  const videos = media?.videos ?? [];
  const attachments = media?.attachments ?? [];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Editar: ${product.name}`}
        subtitle={`Código: ${product.code}`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/catalog/${productId}`)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ArrowLeft size={20} />
              Voltar
            </button>
            {product.isPublished ? (
              <button
                onClick={() => publishMutation.mutate({ id: productId, publish: false })}
                disabled={publishMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50"
              >
                <GlobeLock size={20} />
                Despublicar
              </button>
            ) : (
              <button
                onClick={() => publishMutation.mutate({ id: productId, publish: true })}
                disabled={publishMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50"
              >
                <Globe size={20} />
                Publicar
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? (
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="discontinued">Descontinuado</option>
                  </select>
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
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                  placeholder="tag1, tag2, tag3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                />
              </div>

              <div className="bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800 p-4">
                <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">Zona de Perigo</h4>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Tem certeza que deseja excluir este produto?")) {
                      deleteMutation.mutate({ id: productId });
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  <Trash2 size={16} />
                  Excluir Produto
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Media Tab */}
        {activeTab === "media" && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <ProductImageUpload
                productId={productId}
                images={images.map((img) => ({
                  id: img.id,
                  url: img.url,
                  thumbnailUrl: img.thumbnailUrl,
                  alt: img.alt,
                  caption: img.caption,
                  order: img.order,
                  isPrimary: img.isPrimary,
                }))}
                onUpload={handleImageUpload}
                onDelete={(imageId) => deleteImageMutation.mutateAsync({ imageId })}
                onReorder={(imageIds) => reorderImagesMutation.mutateAsync({ productId, imageIds })}
                onSetPrimary={(imageId) => setPrimaryImageMutation.mutateAsync({ productId, imageId })}
                isUploading={getUploadUrlMutation.isPending || confirmImageMutation.isPending}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <ProductVideoManager
                productId={productId}
                videos={videos.map((v) => ({
                  id: v.id,
                  url: v.url,
                  thumbnailUrl: v.thumbnailUrl,
                  title: v.title,
                  description: v.description,
                  type: v.type,
                  duration: v.duration,
                  order: v.order,
                }))}
                onAdd={(video) =>
                  confirmVideoMutation.mutateAsync({
                    productId,
                    url: video.url,
                    title: video.title,
                    type: video.type as "training" | "demo" | "testimonial" | "unboxing" | "installation",
                    description: video.description,
                  })
                }
                onDelete={(videoId) => deleteVideoMutation.mutateAsync({ videoId })}
                isAdding={confirmVideoMutation.isPending}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <ProductAttachmentManager
                productId={productId}
                attachments={attachments.map((a) => ({
                  id: a.id,
                  url: a.url,
                  fileName: a.fileName,
                  fileType: a.fileType,
                  sizeBytes: a.sizeBytes,
                  type: a.type,
                  order: a.order,
                }))}
                onUpload={handleAttachmentUpload}
                onDelete={(attachmentId) => deleteAttachmentMutation.mutateAsync({ attachmentId })}
                isUploading={getUploadUrlMutation.isPending || confirmAttachmentMutation.isPending}
              />
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
            </div>
          </div>
        )}

        {/* SEO Tab */}
        {activeTab === "seo" && (
          <div className="max-w-2xl">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">SEO</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL Amigável (Slug)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  />
                  <button
                    type="button"
                    onClick={generateSlug}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                  >
                    Gerar
                  </button>
                </div>
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
              </div>
            </div>
          </div>
        )}

        {updateMutation.isError && (
          <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            Erro ao salvar: {updateMutation.error.message}
          </div>
        )}

        {updateMutation.isSuccess && (
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
            Produto salvo com sucesso!
          </div>
        )}
      </form>
    </div>
  );
}
