/**
 * Router tRPC para upload de mídia de produtos
 * VIO-887: Upload de Mídia - Imagens e Vídeos
 */

import { z } from "zod";
import { createTRPCRouter, tenantProcedure, uploadProcedure } from "../trpc";
import { createClient } from "@supabase/supabase-js";

const BUCKET_NAME = "products";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase credentials not configured");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

function generateFilePath(
  companyId: string,
  productId: string,
  type: "images" | "videos" | "attachments",
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${companyId}/${productId}/${type}/${timestamp}_${sanitizedName}`;
}

export const productMediaRouter = createTRPCRouter({
  getUploadUrl: uploadProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        fileName: z.string().min(1),
        fileType: z.string().min(1),
        mediaType: z.enum(["image", "video", "attachment"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = getSupabaseAdmin();
      const folder = input.mediaType === "image" ? "images" : input.mediaType === "video" ? "videos" : "attachments";
      const filePath = generateFilePath(ctx.companyId, input.productId, folder, input.fileName);

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUploadUrl(filePath);

      if (error) {
        throw new Error(`Failed to create upload URL: ${error.message}`);
      }

      return {
        signedUrl: data.signedUrl,
        path: filePath,
        token: data.token,
      };
    }),

  confirmImageUpload: tenantProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        path: z.string().min(1),
        fileName: z.string().min(1),
        alt: z.string().optional(),
        caption: z.string().optional(),
        width: z.number().int().optional(),
        height: z.number().int().optional(),
        sizeBytes: z.number().int().optional(),
        isPrimary: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = getSupabaseAdmin();

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(input.path);

      const lastImage = await ctx.prisma.productImage.findFirst({
        where: { productId: input.productId },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const nextOrder = (lastImage?.order ?? -1) + 1;

      if (input.isPrimary) {
        await ctx.prisma.productImage.updateMany({
          where: { productId: input.productId },
          data: { isPrimary: false },
        });
      }

      const image = await ctx.prisma.productImage.create({
        data: {
          productId: input.productId,
          url: urlData.publicUrl,
          thumbnailUrl: urlData.publicUrl,
          alt: input.alt ?? input.fileName,
          caption: input.caption,
          width: input.width,
          height: input.height,
          sizeBytes: input.sizeBytes,
          order: nextOrder,
          isPrimary: input.isPrimary ?? nextOrder === 0,
        },
      });

      return image;
    }),

  deleteImage: tenantProcedure
    .input(z.object({ imageId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const image = await ctx.prisma.productImage.findUnique({
        where: { id: input.imageId },
        include: { product: { select: { companyId: true } } },
      });

      if (!image || image.product.companyId !== ctx.companyId) {
        throw new Error("Image not found");
      }

      const supabase = getSupabaseAdmin();
      const urlPath = new URL(image.url).pathname;
      const storagePath = urlPath.split(`/${BUCKET_NAME}/`)[1];

      if (storagePath) {
        await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      }

      await ctx.prisma.productImage.delete({ where: { id: input.imageId } });

      return { success: true };
    }),

  reorderImages: tenantProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        imageIds: z.array(z.string().uuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates = input.imageIds.map((id, index) =>
        ctx.prisma.productImage.update({
          where: { id },
          data: { order: index },
        })
      );

      await ctx.prisma.$transaction(updates);

      return { success: true };
    }),

  setPrimaryImage: tenantProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        imageId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.$transaction([
        ctx.prisma.productImage.updateMany({
          where: { productId: input.productId },
          data: { isPrimary: false },
        }),
        ctx.prisma.productImage.update({
          where: { id: input.imageId },
          data: { isPrimary: true },
        }),
      ]);

      return { success: true };
    }),

  confirmVideoUpload: tenantProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        url: z.string().url(),
        thumbnailUrl: z.string().url().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(["training", "demo", "testimonial", "unboxing", "installation"]).optional(),
        duration: z.number().int().optional(),
        isExternal: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lastVideo = await ctx.prisma.productVideo.findFirst({
        where: { productId: input.productId },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const video = await ctx.prisma.productVideo.create({
        data: {
          productId: input.productId,
          url: input.url,
          thumbnailUrl: input.thumbnailUrl,
          title: input.title,
          description: input.description,
          type: input.type ?? "demo",
          duration: input.duration,
          order: (lastVideo?.order ?? -1) + 1,
        },
      });

      return video;
    }),

  deleteVideo: tenantProcedure
    .input(z.object({ videoId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const video = await ctx.prisma.productVideo.findUnique({
        where: { id: input.videoId },
        include: { product: { select: { companyId: true } } },
      });

      if (!video || video.product.companyId !== ctx.companyId) {
        throw new Error("Video not found");
      }

      if (!video.url.includes("youtube") && !video.url.includes("vimeo")) {
        const supabase = getSupabaseAdmin();
        const urlPath = new URL(video.url).pathname;
        const storagePath = urlPath.split(`/${BUCKET_NAME}/`)[1];

        if (storagePath) {
          await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
        }
      }

      await ctx.prisma.productVideo.delete({ where: { id: input.videoId } });

      return { success: true };
    }),

  confirmAttachmentUpload: tenantProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        path: z.string().min(1),
        fileName: z.string().min(1),
        fileType: z.string().min(1),
        sizeBytes: z.number().int().optional(),
        type: z.enum(["datasheet", "manual", "certificate", "brochure", "warranty"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = getSupabaseAdmin();

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(input.path);

      const lastAttachment = await ctx.prisma.productAttachment.findFirst({
        where: { productId: input.productId },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const attachment = await ctx.prisma.productAttachment.create({
        data: {
          productId: input.productId,
          url: urlData.publicUrl,
          fileName: input.fileName,
          fileType: input.fileType,
          sizeBytes: input.sizeBytes,
          type: input.type ?? "datasheet",
          order: (lastAttachment?.order ?? -1) + 1,
        },
      });

      return attachment;
    }),

  deleteAttachment: tenantProcedure
    .input(z.object({ attachmentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const attachment = await ctx.prisma.productAttachment.findUnique({
        where: { id: input.attachmentId },
        include: { product: { select: { companyId: true } } },
      });

      if (!attachment || attachment.product.companyId !== ctx.companyId) {
        throw new Error("Attachment not found");
      }

      const supabase = getSupabaseAdmin();
      const urlPath = new URL(attachment.url).pathname;
      const storagePath = urlPath.split(`/${BUCKET_NAME}/`)[1];

      if (storagePath) {
        await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      }

      await ctx.prisma.productAttachment.delete({ where: { id: input.attachmentId } });

      return { success: true };
    }),

  getProductMedia: tenantProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [images, videos, attachments] = await Promise.all([
        ctx.prisma.productImage.findMany({
          where: { productId: input.productId },
          orderBy: { order: "asc" },
        }),
        ctx.prisma.productVideo.findMany({
          where: { productId: input.productId },
          orderBy: { order: "asc" },
        }),
        ctx.prisma.productAttachment.findMany({
          where: { productId: input.productId },
          orderBy: { order: "asc" },
        }),
      ]);

      return { images, videos, attachments };
    }),
});
