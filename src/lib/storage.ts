import { createClient } from "@/lib/supabase/client";

export const STORAGE_BUCKET = "assets";

export const STORAGE_PATHS = {
  landing: {
    hero: "landing/hero",
    features: "landing/features",
  },
  logos: "logos",
  general: "general",
} as const;

export type StoragePath = 
  | typeof STORAGE_PATHS.landing.hero
  | typeof STORAGE_PATHS.landing.features
  | typeof STORAGE_PATHS.logos
  | typeof STORAGE_PATHS.general;

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Gera um nome único para o arquivo
 */
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop()?.toLowerCase() || "jpg";
  return `${timestamp}-${random}.${extension}`;
}

/**
 * Faz upload de uma imagem para o Supabase Storage
 */
export async function uploadImage(
  file: File,
  path: StoragePath,
  customFileName?: string
): Promise<UploadResult> {
  const supabase = createClient();

  // Validar tipo de arquivo
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: "Tipo de arquivo não permitido. Use: JPG, PNG, WebP, GIF ou SVG.",
    };
  }

  // Validar tamanho (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      success: false,
      error: "Arquivo muito grande. Tamanho máximo: 5MB.",
    };
  }

  const fileName = customFileName || generateFileName(file.name);
  const filePath = `${path}/${fileName}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    console.error("Erro no upload:", error);
    return {
      success: false,
      error: error.message,
    };
  }

  // Gerar URL pública
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return {
    success: true,
    url: urlData.publicUrl,
    path: filePath,
  };
}

/**
 * Deleta uma imagem do Supabase Storage
 */
export async function deleteImage(filePath: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (error) {
    console.error("Erro ao deletar:", error);
    return {
      success: false,
      error: error.message,
    };
  }

  return { success: true };
}

/**
 * Lista arquivos em um diretório
 */
export async function listFiles(path: StoragePath): Promise<{ name: string; url: string }[]> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(path, {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (error || !data) {
    console.error("Erro ao listar arquivos:", error);
    return [];
  }

  return data
    .filter((file) => file.name !== ".emptyFolderPlaceholder")
    .map((file) => {
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(`${path}/${file.name}`);
      
      return {
        name: file.name,
        url: urlData.publicUrl,
      };
    });
}

/**
 * Gera URL pública para um arquivo
 */
export function getPublicUrl(filePath: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
