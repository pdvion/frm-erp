"use client";

import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import {
  Upload,
  FileText,
  Trash2,
  Download,
  Loader2,
  Paperclip,
  X,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

interface TaskAttachmentsProps {
  taskId: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TaskAttachments({ taskId }: TaskAttachmentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const { data: attachments, isLoading } = trpc.tasks.listAttachments.useQuery({ taskId });

  const getUploadUrlMutation = trpc.tasks.getUploadUrl.useMutation();
  const addAttachmentMutation = trpc.tasks.addAttachment.useMutation({
    onSuccess: () => {
      utils.tasks.listAttachments.invalidate({ taskId });
    },
  });
  const removeAttachmentMutation = trpc.tasks.removeAttachment.useMutation({
    onSuccess: () => {
      utils.tasks.listAttachments.invalidate({ taskId });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Validar arquivo
        if (!ALLOWED_TYPES.includes(file.type)) {
          setUploadError(`Tipo de arquivo não permitido: ${file.name}`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          setUploadError(`Arquivo muito grande (máx. 10MB): ${file.name}`);
          continue;
        }

        // Obter URL de upload
        const uploadInfo = await getUploadUrlMutation.mutateAsync({
          taskId,
          fileName: file.name,
          contentType: file.type,
        });

        // Upload para Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(uploadInfo.bucket)
          .upload(uploadInfo.filePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          setUploadError(`Erro ao fazer upload: ${uploadError.message}`);
          continue;
        }

        // Registrar anexo no banco
        await addAttachmentMutation.mutateAsync({
          taskId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl: uploadInfo.publicUrl,
        });
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erro ao fazer upload");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async (attachmentId: string) => {
    if (!confirm("Remover este anexo?")) return;
    removeAttachmentMutation.mutate({ attachmentId });
  };

  return (
    <div className="bg-theme-card rounded-lg border border-theme p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-theme flex items-center gap-2">
          <Paperclip className="w-5 h-5" />
          Anexos
          {attachments && attachments.length > 0 && (
            <span className="text-sm font-normal text-theme-muted">
              ({attachments.length})
            </span>
          )}
        </h3>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_TYPES.join(",")}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            leftIcon={isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          >
            {isUploading ? "Enviando..." : "Anexar"}
          </Button>
        </div>
      </div>

      {uploadError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-red-700">{uploadError}</span>
          <button onClick={() => setUploadError(null)}>
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-theme-muted" />
        </div>
      ) : !attachments || attachments.length === 0 ? (
        <div className="text-center py-8 text-theme-muted">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum anexo</p>
          <p className="text-xs mt-1">Clique em &quot;Anexar&quot; para adicionar arquivos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-theme-tertiary rounded-lg"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-5 h-5 text-theme-muted flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-theme truncate">
                    {attachment.fileName}
                  </p>
                  <p className="text-xs text-theme-muted">
                    {formatFileSize(attachment.fileSize)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={attachment.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-theme-muted hover:text-blue-600 transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleRemove(attachment.id)}
                  disabled={removeAttachmentMutation.isPending}
                  className="p-2 text-theme-muted hover:text-red-600 transition-colors disabled:opacity-50"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
