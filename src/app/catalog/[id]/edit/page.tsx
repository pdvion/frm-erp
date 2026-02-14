"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Trash2, Globe, GlobeLock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
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
    status: "DRAFT",
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
        status: product.status ?? "DRAFT",
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
      status: formData.status as "DRAFT" | "ACTIVE" | "INACTIVE" | "DISCONTINUED",
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
      type: type as "DATASHEET" | "MANUAL" | "CERTIFICATE" | "BROCHURE" | "WARRANTY",
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
        <Button variant="ghost" onClick={() => router.push("/catalog")}>
          Voltar ao catálogo
        </Button>
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
            <Button
              variant="outline"
              onClick={() => router.push(`/catalog/${productId}`)}
              leftIcon={<ArrowLeft size={20} />}
            >
              Voltar
            </Button>
            {product.isPublished ? (
              <Button
                variant="outline"
                onClick={() => publishMutation.mutate({ id: productId, publish: false })}
                disabled={publishMutation.isPending}
                leftIcon={<GlobeLock size={20} />}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                Despublicar
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => publishMutation.mutate({ id: productId, publish: true })}
                disabled={publishMutation.isPending}
                leftIcon={<Globe size={20} />}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                Publicar
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
              isLoading={updateMutation.isPending}
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Status
                  </label>
                  <Select
                    value={formData.status}
                    onChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                    options={[
                      { value: "DRAFT", label: "Rascunho" },
                      { value: "ACTIVE", label: "Ativo" },
                      { value: "INACTIVE", label: "Inativo" },
                      { value: "DISCONTINUED", label: "Descontinuado" },
                    ]}
                  />
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
                />
              </div>

              <div className="bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800 p-4">
                <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">Zona de Perigo</h4>
                <Button
                  variant="danger"
                  size="sm"
                  type="button"
                  onClick={() => {
                    if (confirm("Tem certeza que deseja excluir este produto?")) {
                      deleteMutation.mutate({ id: productId });
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  isLoading={deleteMutation.isPending}
                  leftIcon={<Trash2 size={16} />}
                >
                  Excluir Produto
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Media Tab */}
        {activeTab === "media" && (
          <div className="space-y-8">
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <ProductImageUpload
                productId={productId}
                images={images.map((img) => ({
                  id: img.id,
                  url: img.url,
                  thumbnailUrl: img.thumbnailUrl ?? undefined,
                  alt: img.alt ?? undefined,
                  caption: img.caption ?? undefined,
                  order: img.order ?? 0,
                  isPrimary: img.isPrimary ?? false,
                }))}
                onUpload={handleImageUpload}
                onDelete={(imageId) => deleteImageMutation.mutateAsync({ imageId })}
                onReorder={(imageIds) => reorderImagesMutation.mutateAsync({ productId, imageIds })}
                onSetPrimary={(imageId) => setPrimaryImageMutation.mutateAsync({ productId, imageId })}
                isUploading={getUploadUrlMutation.isPending || confirmImageMutation.isPending}
              />
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <ProductVideoManager
                productId={productId}
                videos={videos.map((v) => ({
                  id: v.id,
                  url: v.url,
                  thumbnailUrl: v.thumbnailUrl ?? undefined,
                  title: v.title,
                  description: v.description ?? undefined,
                  type: v.type ?? "DEMO",
                  duration: v.duration ?? undefined,
                  order: v.order ?? 0,
                }))}
                onAdd={(video) =>
                  confirmVideoMutation.mutateAsync({
                    productId,
                    url: video.url,
                    title: video.title,
                    type: video.type as "TRAINING" | "DEMO" | "TESTIMONIAL" | "UNBOXING" | "INSTALLATION",
                    description: video.description,
                  })
                }
                onDelete={(videoId) => deleteVideoMutation.mutateAsync({ videoId })}
                isAdding={confirmVideoMutation.isPending}
              />
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <ProductAttachmentManager
                productId={productId}
                attachments={attachments.map((a) => ({
                  id: a.id,
                  url: a.url,
                  fileName: a.fileName,
                  fileType: a.fileType,
                  sizeBytes: a.sizeBytes ?? undefined,
                  type: a.type ?? "other",
                  order: a.order ?? 0,
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
            <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-4">
              <h3 className="font-medium text-theme">Preços</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Preço de Custo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted z-10">R$</span>
                    <Input
                      type="number"
                      step={0.01}
                      min={0}
                      value={formData.costPrice}
                      onChange={(e) => setFormData((prev) => ({ ...prev, costPrice: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Preço de Tabela
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted z-10">R$</span>
                    <Input
                      type="number"
                      step={0.01}
                      min={0}
                      value={formData.listPrice}
                      onChange={(e) => setFormData((prev) => ({ ...prev, listPrice: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Preço Promocional
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted z-10">R$</span>
                    <Input
                      type="number"
                      step={0.01}
                      min={0}
                      value={formData.salePrice}
                      onChange={(e) => setFormData((prev) => ({ ...prev, salePrice: e.target.value }))}
                      className="pl-10"
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
            <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-4">
              <h3 className="font-medium text-theme">SEO</h3>

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  URL Amigável (Slug)
                </label>
                <div className="flex gap-2">
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateSlug}
                  >
                    Gerar
                  </Button>
                </div>
              </div>

              <Input
                label="Título SEO"
                value={formData.metaTitle}
                onChange={(e) => setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))}
                maxLength={60}
              />

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
