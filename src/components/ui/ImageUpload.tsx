"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, Camera, Loader2, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface ImageUploadProps {
  /** URL da imagem atual */
  value?: string | null;
  /** Callback quando imagem é alterada */
  onChange: (url: string | null) => void;
  /** Callback para upload de arquivo (retorna URL) */
  onUpload?: (file: File) => Promise<string>;
  /** Formato do container */
  shape?: "square" | "circle" | "rectangle";
  /** Aspect ratio para shape="rectangle" (ex: 16/9) */
  aspectRatio?: number;
  /** Tamanho do container */
  size?: "sm" | "md" | "lg" | "xl";
  /** Mostrar preview da imagem */
  showPreview?: boolean;
  /** Permitir zoom na imagem */
  allowZoom?: boolean;
  /** Tipos de imagem aceitos */
  accept?: string;
  /** Tamanho máximo em bytes (padrão: 5MB) */
  maxSize?: number;
  /** Desabilitar upload */
  disabled?: boolean;
  /** Classe CSS adicional */
  className?: string;
  /** Placeholder quando não há imagem */
  placeholder?: React.ReactNode;
  /** Alt text para a imagem */
  alt?: string;
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
  xl: "w-48 h-48",
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function ImageUpload({
  value,
  onChange,
  onUpload,
  shape = "square",
  aspectRatio,
  size = "lg",
  showPreview = true,
  allowZoom = false,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  disabled = false,
  className,
  placeholder,
  alt = "Imagem",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showZoom, setShowZoom] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize) {
      return `Imagem muito grande (máx. ${formatFileSize(maxSize)})`;
    }
    const acceptedTypes = accept.split(",").map((t) => t.trim());
    if (!acceptedTypes.some((type) => file.type === type || type === "image/*")) {
      return "Formato de imagem não suportado";
    }
    return null;
  }, [accept, maxSize]);

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    if (onUpload) {
      setIsUploading(true);
      try {
        const url = await onUpload(file);
        onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro no upload");
      } finally {
        setIsUploading(false);
      }
    } else {
      // Preview local sem upload
      const reader = new FileReader();
      reader.onload = (e) => {
        onChange(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onChange, onUpload, validateFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [disabled, handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
    e.target.value = "";
  }, [handleFile]);

  const openFileDialog = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setError(null);
  }, [onChange]);

  const containerClasses = cn(
    "relative overflow-hidden transition-all cursor-pointer group",
    shape === "circle" && "rounded-full",
    shape === "square" && "rounded-lg",
    shape === "rectangle" && "rounded-lg",
    !aspectRatio && sizeClasses[size],
    isDragging && "ring-2 ring-[var(--frm-primary)] ring-offset-2",
    disabled && "opacity-50 cursor-not-allowed",
    className
  );

  const containerStyle: React.CSSProperties = aspectRatio
    ? { aspectRatio: aspectRatio.toString(), width: "100%" }
    : {};

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={containerClasses}
        style={containerStyle}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />

        {value && showPreview ? (
          <>
            <img
              src={value}
              alt={alt}
              className="w-full h-full object-cover"
            />
            {/* Overlay com ações */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {allowZoom && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowZoom(true);
                  }}
                  className="text-white hover:bg-white/20"
                >
                  <ZoomIn className="w-5 h-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </>
        ) : (
          <div
            className={cn(
              "w-full h-full flex flex-col items-center justify-center border-2 border-dashed",
              shape === "circle" ? "rounded-full" : "rounded-lg",
              isDragging
                ? "border-[var(--frm-primary)] bg-[var(--frm-primary)]/5"
                : "border-theme-input bg-theme-secondary"
            )}
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-[var(--frm-primary)] animate-spin" />
            ) : placeholder ? (
              placeholder
            ) : (
              <>
                {shape === "circle" ? (
                  <Camera className="w-6 h-6 text-theme-muted" />
                ) : (
                  <Upload className="w-6 h-6 text-theme-muted" />
                )}
                <span className="text-xs text-theme-muted mt-1">Upload</span>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Modal de Zoom */}
      {showZoom && value && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowZoom(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={value}
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowZoom(false)}
              className="absolute top-2 right-2 text-white bg-black/50 hover:bg-black/70"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
