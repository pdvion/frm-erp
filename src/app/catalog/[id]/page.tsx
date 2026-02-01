"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Globe,
  GlobeLock,
  Package,
  Tag,
  Calendar,
  Loader2,
  Play,
  FileText,
  Download,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { RichTextViewer } from "@/components/editor";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const { data: product, isLoading } = trpc.productCatalog.getProduct.useQuery({
    id: productId,
  });

  const { data: media } = trpc.productMedia.getProductMedia.useQuery({
    productId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Package size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
            Produto não encontrado
          </h2>
          <button
            onClick={() => router.push("/catalog")}
            className="text-blue-600 hover:text-blue-700"
          >
            Voltar ao catálogo
          </button>
        </div>
      </div>
    );
  }

  const images = media?.images ?? [];
  const videos = media?.videos ?? [];
  const attachments = media?.attachments ?? [];
  const primaryImage = images.find((img) => img.isPrimary) ?? images[0];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={product.name}
        subtitle={product.shortDescription || undefined}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/catalog")}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ArrowLeft size={20} />
              Voltar
            </button>
            <button
              onClick={() => router.push(`/catalog/${productId}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Pencil size={20} />
              Editar
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="aspect-video bg-gray-100 dark:bg-gray-700">
              {primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primaryImage.url}
                  alt={primaryImage.alt || product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={64} className="text-gray-400" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="p-4 flex gap-2 overflow-x-auto">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className={`w-16 h-16 flex-shrink-0 rounded border-2 overflow-hidden ${
                      img.id === primaryImage?.id
                        ? "border-blue-500"
                        : "border-gray-200 dark:border-gray-600"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.thumbnailUrl || img.url}
                      alt={img.alt || ""}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                Descrição
              </h3>
              <RichTextViewer content={product.description} />
            </div>
          )}

          {/* Videos */}
          {videos.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                Vídeos ({videos.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {videos.map((video) => (
                  <a
                    key={video.id}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750"
                  >
                    <div className="w-16 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      {video.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Play size={20} className="text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {video.title}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {video.type}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                Anexos ({attachments.length})
              </h3>
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    download={attachment.fileName}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750"
                  >
                    <FileText size={20} className="text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {attachment.fileName}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {attachment.type}
                      </div>
                    </div>
                    <Download size={16} className="text-gray-400" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${
                  product.status === "active"
                    ? "bg-green-100 text-green-700"
                    : product.status === "draft"
                    ? "bg-gray-100 text-gray-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {product.status === "active"
                  ? "Ativo"
                  : product.status === "draft"
                  ? "Rascunho"
                  : product.status}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Publicado</span>
              <span className="flex items-center gap-1">
                {product.isPublished ? (
                  <>
                    <Globe size={16} className="text-green-600" />
                    <span className="text-green-600 text-sm">Sim</span>
                  </>
                ) : (
                  <>
                    <GlobeLock size={16} className="text-gray-400" />
                    <span className="text-gray-400 text-sm">Não</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Código</span>
              <span className="text-sm font-mono">{product.code}</span>
            </div>

            {product.category && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Categoria</span>
                <span className="text-sm">{product.category.name}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Criado em</span>
              <span className="text-sm">
                {new Date(product.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Preços</h3>

            
            {product.listPrice && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Tabela</span>
                <span className="text-lg font-bold">R$ {product.listPrice.toFixed(2)}</span>
              </div>
            )}

            {product.salePrice && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Promocional</span>
                <span className="text-lg font-bold text-green-600">
                  R$ {product.salePrice.toFixed(2)}
                </span>
              </div>
            )}

            {!product.listPrice && !product.salePrice && (
              <p className="text-sm text-gray-400">Nenhum preço definido</p>
            )}
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm"
                  >
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
