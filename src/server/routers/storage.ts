import { z } from "zod";
import { createTRPCRouter, tenantProcedure, uploadProcedure } from "../trpc";
import { createClient } from "@supabase/supabase-js";
import { TRPCError } from "@trpc/server";

const STORAGE_BUCKET = "assets";

// Cliente Supabase para server-side (com service role para bypass RLS se necessário)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export const storageRouter = createTRPCRouter({
  // Gerar URL assinada para upload direto do cliente
  getUploadUrl: uploadProcedure
    .input(z.object({
      fileName: z.string(),
      path: z.string(), // ex: "landing/hero"
      contentType: z.string(),
    }))
    .mutation(async ({ input }) => {
      const supabase = getSupabaseAdmin();
      
      // Validar tipo de arquivo
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
      if (!allowedTypes.includes(input.contentType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tipo de arquivo não permitido. Use: JPG, PNG, WebP, GIF ou SVG.",
        });
      }

      // Gerar nome único
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const extension = input.fileName.split(".").pop()?.toLowerCase() || "jpg";
      const uniqueFileName = `${timestamp}-${random}.${extension}`;
      const filePath = `${input.path}/${uniqueFileName}`;

      // Criar URL assinada para upload
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUploadUrl(filePath);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao gerar URL de upload: ${error.message}`,
        });
      }

      // Gerar URL pública
      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      return {
        signedUrl: data.signedUrl,
        token: data.token,
        path: filePath,
        publicUrl: publicUrlData.publicUrl,
      };
    }),

  // Confirmar upload e retornar URL pública
  confirmUpload: tenantProcedure
    .input(z.object({
      path: z.string(),
    }))
    .mutation(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      // Verificar se o arquivo existe
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(input.path.split("/").slice(0, -1).join("/"), {
          search: input.path.split("/").pop(),
        });

      if (error || !data || data.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Arquivo não encontrado",
        });
      }

      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(input.path);

      return {
        url: publicUrlData.publicUrl,
        path: input.path,
      };
    }),

  // Deletar arquivo
  delete: tenantProcedure
    .input(z.object({
      path: z.string(),
    }))
    .mutation(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([input.path]);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao deletar arquivo: ${error.message}`,
        });
      }

      return { success: true };
    }),

  // Listar arquivos em um diretório
  list: tenantProcedure
    .input(z.object({
      path: z.string(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(input.path, {
          limit: input.limit,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao listar arquivos: ${error.message}`,
        });
      }

      return (data || [])
        .filter((file) => file.name !== ".emptyFolderPlaceholder")
        .map((file) => {
          const filePath = `${input.path}/${file.name}`;
          const { data: publicUrlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath);

          return {
            name: file.name,
            path: filePath,
            url: publicUrlData.publicUrl,
            size: file.metadata?.size,
            createdAt: file.created_at,
          };
        });
    }),

  // Obter URL pública de um arquivo
  getPublicUrl: tenantProcedure
    .input(z.object({
      path: z.string(),
    }))
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(input.path);

      return { url: data.publicUrl };
    }),
});
