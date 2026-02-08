"use client";

import { useState, useCallback } from "react";
import { Upload, X, Star, GripVertical, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductImage {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  alt?: string | null;
  caption?: string | null;
  order: number;
  isPrimary: boolean;
}

export interface ProductImageUploadProps {
  productId: string;
  images: ProductImage[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (imageId: string) => Promise<unknown>;
  onReorder: (imageIds: string[]) => Promise<unknown>;
  onSetPrimary: (imageId: string) => Promise<unknown>;
  isUploading?: boolean;
  maxImages?: number;
  acceptedFormats?: string[];
}

export function ProductImageUpload({
  productId,
  images,
  onUpload,
  onDelete,
  onReorder,
  onSetPrimary,
  isUploading = false,
  maxImages = 10,
  acceptedFormats = ["image/jpeg", "image/png", "image/webp", "image/avif"],
}: ProductImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        acceptedFormats.includes(file.type)
      );

      for (const file of files.slice(0, maxImages - images.length)) {
        await onUpload(file);
      }
    },
    [acceptedFormats, images.length, maxImages, onUpload]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);

      for (const file of files.slice(0, maxImages - images.length)) {
        await onUpload(file);
      }

      e.target.value = "";
    },
    [images.length, maxImages, onUpload]
  );

  const handleDelete = useCallback(
    async (imageId: string) => {
      setDeletingId(imageId);
      try {
        await onDelete(imageId);
      } finally {
        setDeletingId(null);
      }
    },
    [onDelete]
  );

  const handleSetPrimary = useCallback(
    async (imageId: string) => {
      setSettingPrimaryId(imageId);
      try {
        await onSetPrimary(imageId);
      } finally {
        setSettingPrimaryId(null);
      }
    },
    [onSetPrimary]
  );

  const handleImageDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleImageDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index) return;

      const newOrder = [...images];
      const [removed] = newOrder.splice(draggedIndex, 1);
      newOrder.splice(index, 0, removed);

      setDraggedIndex(index);
      onReorder(newOrder.map((img) => img.id));
    },
    [draggedIndex, images, onReorder]
  );

  const handleImageDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const canUploadMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-theme-secondary">
          Imagens do Produto
        </h3>
        <span className="text-xs text-theme-muted">
          {images.length}/{maxImages} imagens
        </span>
      </div>

      {/* Upload Area */}
      {canUploadMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : "border-theme hover:border-gray-400 dark:hover:border-gray-500"
          )}
        >
          <input
            type="file"
            id={`image-upload-${productId}`}
            accept={acceptedFormats.join(",")}
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          <label
            htmlFor={`image-upload-${productId}`}
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-theme-muted" />
            )}
            <span className="text-sm text-theme-muted">
              {isUploading
                ? "Enviando..."
                : "Arraste imagens ou clique para selecionar"}
            </span>
            <span className="text-xs text-theme-muted">
              JPG, PNG, WebP ou AVIF (máx. 5MB cada)
            </span>
          </label>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => handleImageDragStart(index)}
              onDragOver={(e) => handleImageDragOver(e, index)}
              onDragEnd={handleImageDragEnd}
              className={cn(
                "relative group aspect-square rounded-lg overflow-hidden border-2 transition-all",
                image.isPrimary
                  ? "border-yellow-400 ring-2 ring-yellow-200"
                  : "border-theme",
                draggedIndex === index && "opacity-50"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.thumbnailUrl || image.url}
                alt={image.alt || "Imagem do produto"}
                className="w-full h-full object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {/* Drag Handle */}
                <button
                  type="button"
                  className="p-1.5 bg-white/90 rounded-full text-gray-700 hover:bg-white cursor-grab"
                  title="Arrastar para reordenar"
                >
                  <GripVertical size={16} />
                </button>

                {/* Set Primary */}
                {!image.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(image.id)}
                    disabled={settingPrimaryId === image.id}
                    className="p-1.5 bg-white/90 rounded-full text-gray-700 hover:bg-yellow-100 hover:text-yellow-600"
                    title="Definir como principal"
                  >
                    {settingPrimaryId === image.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Star size={16} />
                    )}
                  </button>
                )}

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(image.id)}
                  disabled={deletingId === image.id}
                  className="p-1.5 bg-white/90 rounded-full text-gray-700 hover:bg-red-100 hover:text-red-600"
                  title="Excluir imagem"
                >
                  {deletingId === image.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <X size={16} />
                  )}
                </button>
              </div>

              {/* Primary Badge */}
              {image.isPrimary && (
                <div className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Star size={10} fill="currentColor" />
                  Principal
                </div>
              )}

              {/* Order Badge */}
              <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !canUploadMore && (
        <div className="text-center py-8 text-theme-muted">
          Nenhuma imagem adicionada
        </div>
      )}
    </div>
  );
}
