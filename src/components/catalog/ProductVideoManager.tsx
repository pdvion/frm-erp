"use client";

import { useState, useCallback } from "react";
import { Plus, X, Play, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ProductVideo {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  title: string;
  description?: string | null;
  type: string;
  duration?: number | null;
  order: number;
}

export interface ProductVideoManagerProps {
  productId: string;
  videos: ProductVideo[];
  onAdd: (video: { url: string; title: string; type?: string; description?: string }) => Promise<unknown>;
  onDelete: (videoId: string) => Promise<unknown>;
  isAdding?: boolean;
}

const VIDEO_TYPES = [
  { value: "demo", label: "Demonstração" },
  { value: "training", label: "Treinamento" },
  { value: "testimonial", label: "Depoimento" },
  { value: "unboxing", label: "Unboxing" },
  { value: "installation", label: "Instalação" },
];

function extractVideoId(url: string): { platform: "youtube" | "vimeo" | "other"; id: string | null } {
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return { platform: "youtube", id: youtubeMatch[1] };
  }

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return { platform: "vimeo", id: vimeoMatch[1] };
  }

  return { platform: "other", id: null };
}

function getVideoThumbnail(url: string): string | null {
  const { platform, id } = extractVideoId(url);

  if (platform === "youtube" && id) {
    return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
  }

  return null;
}

export function ProductVideoManager({
  videos,
  onAdd,
  onDelete,
  isAdding = false,
}: ProductVideoManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    url: "",
    title: "",
    type: "demo",
    description: "",
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.url || !formData.title) return;

      await onAdd({
        url: formData.url,
        title: formData.title,
        type: formData.type,
        description: formData.description || undefined,
      });

      setFormData({ url: "", title: "", type: "demo", description: "" });
      setShowAddForm(false);
    },
    [formData, onAdd]
  );

  const handleDelete = useCallback(
    async (videoId: string) => {
      setDeletingId(videoId);
      try {
        await onDelete(videoId);
      } finally {
        setDeletingId(null);
      }
    },
    [onDelete]
  );

  const handleUrlChange = useCallback((url: string) => {
    setFormData((prev) => ({ ...prev, url }));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-theme-secondary">
          Vídeos do Produto
        </h3>
        {!showAddForm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddForm(true)}
            leftIcon={<Plus size={16} />}
          >
            Adicionar Vídeo
          </Button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-4 border border-theme rounded-lg bg-theme-secondary space-y-3">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              URL do Vídeo *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500 bg-theme-input text-theme"
              required
            />
            <p className="text-xs text-theme-muted mt-1">
              Suporta YouTube, Vimeo ou URL direta
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Título do vídeo"
              className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500 bg-theme-input text-theme"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              Tipo
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500 bg-theme-input text-theme"
            >
              {VIDEO_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição opcional"
              rows={2}
              className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500 bg-theme-input text-theme"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isAdding || !formData.url || !formData.title}
              isLoading={isAdding}
            >
              Adicionar
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddForm(false);
                setFormData({ url: "", title: "", type: "demo", description: "" });
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {/* Video List */}
      {videos.length > 0 && (
        <div className="space-y-2">
          {videos.map((video) => {
            const thumbnail = video.thumbnailUrl || getVideoThumbnail(video.url);
            const { platform } = extractVideoId(video.url);

            return (
              <div
                key={video.id}
                className="flex items-center gap-3 p-3 border border-theme rounded-lg bg-theme-card"
              >
                {/* Thumbnail */}
                <div className="relative w-24 h-16 bg-theme-secondary rounded overflow-hidden flex-shrink-0">
                  {thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play size={24} className="text-theme-muted" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play size={20} className="text-white" fill="white" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-theme truncate">
                    {video.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-theme-muted">
                    <span className="capitalize">
                      {VIDEO_TYPES.find((t) => t.value === video.type)?.label || video.type}
                    </span>
                    {platform !== "other" && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{platform}</span>
                      </>
                    )}
                    {video.duration && (
                      <>
                        <span>•</span>
                        <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-theme-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded"
                    title="Abrir vídeo"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(video.id)}
                    disabled={deletingId === video.id}
                    className="text-theme-muted hover:text-red-600"
                    title="Excluir vídeo"
                  >
                    {deletingId === video.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <X size={16} />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {videos.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-theme-muted border-2 border-dashed border-theme rounded-lg">
          <Play size={32} className="mx-auto mb-2 text-theme-muted" />
          <p>Nenhum vídeo adicionado</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            Adicionar primeiro vídeo
          </Button>
        </div>
      )}
    </div>
  );
}
