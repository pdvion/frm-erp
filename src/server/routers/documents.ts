/**
 * VIO-706: GED - Gestão Eletrônica de Documentos
 * Router tRPC para gerenciamento de documentos
 */

import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";

// =============================================================================
// SCHEMAS
// =============================================================================

const documentCreateSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  fileName: z.string().min(1, "Nome do arquivo é obrigatório"),
  fileType: z.string().min(1, "Tipo do arquivo é obrigatório"),
  fileSize: z.number().int().positive("Tamanho deve ser positivo"),
  fileUrl: z.string().url("URL inválida"),
  filePath: z.string().min(1, "Caminho é obrigatório"),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  entityType: z.enum([
    "SUPPLIER", "CUSTOMER", "EMPLOYEE", "CONTRACT",
    "PURCHASE_ORDER", "SALES_ORDER", "INVOICE",
    "MATERIAL", "PROJECT", "GENERAL"
  ]).optional(),
  entityId: z.string().uuid().optional(),
  isShared: z.boolean().default(false),
  requiresSignature: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const documentUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
  entityType: z.enum([
    "SUPPLIER", "CUSTOMER", "EMPLOYEE", "CONTRACT",
    "PURCHASE_ORDER", "SALES_ORDER", "INVOICE",
    "MATERIAL", "PROJECT", "GENERAL"
  ]).nullable().optional(),
  entityId: z.string().uuid().nullable().optional(),
  isShared: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const categoryCreateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().uuid().optional(),
  isShared: z.boolean().default(false),
});

const categoryUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

// =============================================================================
// ROUTER
// =============================================================================

export const documentsRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // UPLOAD
  // ---------------------------------------------------------------------------

  getUploadUrl: tenantProcedure
    .input(z.object({
      fileName: z.string().min(1),
      fileType: z.string().min(1),
      fileSize: z.number().int().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getSupabaseAdmin } = await import("@/lib/supabase");
      
      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const extension = input.fileName.split(".").pop()?.toLowerCase() || "bin";
      const uniqueName = `${timestamp}-${random}.${extension}`;
      
      // Path no storage: documents/{companyId}/{uniqueName}
      const filePath = `documents/${ctx.companyId}/${uniqueName}`;
      
      const supabase = getSupabaseAdmin();
      
      // Criar signed URL para upload
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUploadUrl(filePath);
      
      if (error || !data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error?.message || "Erro ao gerar URL de upload",
        });
      }
      
      // Gerar URL pública
      const { data: publicUrlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);
      
      return {
        uploadUrl: data.signedUrl,
        filePath,
        publicUrl: publicUrlData.publicUrl,
        token: data.token,
      };
    }),

  // ---------------------------------------------------------------------------
  // DOCUMENTOS
  // ---------------------------------------------------------------------------

  list: tenantProcedure
    .input(z.object({
      search: z.string().optional(),
      categoryId: z.string().uuid().optional(),
      entityType: z.enum([
        "SUPPLIER", "CUSTOMER", "EMPLOYEE", "CONTRACT",
        "PURCHASE_ORDER", "SALES_ORDER", "INVOICE",
        "MATERIAL", "PROJECT", "GENERAL"
      ]).optional(),
      entityId: z.string().uuid().optional(),
      status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "DELETED"]).optional(),
      tags: z.array(z.string()).optional(),
      page: z.number().int().positive().default(1),
      pageSize: z.number().int().positive().max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { search, categoryId, entityType, entityId, status, tags, page, pageSize } = input;

      const where: Prisma.GedDocumentWhereInput = {
        ...tenantFilter(ctx.companyId, true),
        status: status ?? { not: "DELETED" },
        isLatestVersion: true,
        ...(categoryId && { categoryId }),
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
        ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { fileName: { contains: search, mode: "insensitive" as const } },
            { tags: { hasSome: [search] } },
          ],
        }),
      };

      const [documents, total] = await Promise.all([
        ctx.prisma.gedDocument.findMany({
          where,
          include: {
            category: true,
            _count: { select: { versions: true, accessLogs: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.prisma.gedDocument.count({ where }),
      ]);

      return {
        documents,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  byId: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.prisma.gedDocument.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId, true),
        },
        include: {
          category: true,
          versions: {
            orderBy: { version: "desc" },
            take: 10,
          },
          accessLogs: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      });

      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Documento não encontrado",
        });
      }

      // Registrar acesso
      await ctx.prisma.gedAccessLog.create({
        data: {
          documentId: document.id,
          userId: ctx.tenant.userId,
          action: "VIEW",
        },
      });

      return document;
    }),

  create: tenantProcedure
    .input(documentCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.prisma.gedDocument.create({
        data: {
          ...input,
          companyId: ctx.companyId,
          createdBy: ctx.tenant.userId,
          metadata: input.metadata as Prisma.InputJsonValue ?? undefined,
        },
        include: { category: true },
      });

      // Registrar acesso
      await ctx.prisma.gedAccessLog.create({
        data: {
          documentId: document.id,
          userId: ctx.tenant.userId,
          action: "CREATE",
        },
      });

      return document;
    }),

  update: tenantProcedure
    .input(documentUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.prisma.gedDocument.findFirst({
        where: { id, ...tenantFilter(ctx.companyId, false) },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Documento não encontrado",
        });
      }

      const document = await ctx.prisma.gedDocument.update({
        where: { id },
        data: {
          ...data,
          metadata: data.metadata as Prisma.InputJsonValue ?? undefined,
        },
        include: { category: true },
      });

      // Registrar acesso
      await ctx.prisma.gedAccessLog.create({
        data: {
          documentId: document.id,
          userId: ctx.tenant.userId,
          action: "EDIT",
        },
      });

      return document;
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.gedDocument.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId, false) },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Documento não encontrado",
        });
      }

      // Soft delete
      const document = await ctx.prisma.gedDocument.update({
        where: { id: input.id },
        data: {
          status: "DELETED",
          deletedAt: new Date(),
        },
      });

      // Registrar acesso
      await ctx.prisma.gedAccessLog.create({
        data: {
          documentId: document.id,
          userId: ctx.tenant.userId,
          action: "DELETE",
        },
      });

      return document;
    }),

  // Upload de nova versão
  uploadVersion: tenantProcedure
    .input(z.object({
      parentId: z.string().uuid(),
      fileName: z.string().min(1),
      fileType: z.string().min(1),
      fileSize: z.number().int().positive(),
      fileUrl: z.string().url(),
      filePath: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const parent = await ctx.prisma.gedDocument.findFirst({
        where: { id: input.parentId, ...tenantFilter(ctx.companyId, false) },
      });

      if (!parent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Documento original não encontrado",
        });
      }

      // Marcar versão anterior como não mais atual
      await ctx.prisma.gedDocument.update({
        where: { id: parent.id },
        data: { isLatestVersion: false },
      });

      // Criar nova versão
      const newVersion = await ctx.prisma.gedDocument.create({
        data: {
          title: parent.title,
          description: parent.description,
          fileName: input.fileName,
          fileType: input.fileType,
          fileSize: input.fileSize,
          fileUrl: input.fileUrl,
          filePath: input.filePath,
          categoryId: parent.categoryId,
          tags: parent.tags,
          entityType: parent.entityType,
          entityId: parent.entityId,
          version: parent.version + 1,
          parentId: parent.parentId ?? parent.id,
          isLatestVersion: true,
          status: "ACTIVE",
          isShared: parent.isShared,
          companyId: ctx.companyId,
          createdBy: ctx.tenant.userId,
        },
        include: { category: true },
      });

      // Registrar acesso
      await ctx.prisma.gedAccessLog.create({
        data: {
          documentId: newVersion.id,
          userId: ctx.tenant.userId,
          action: "CREATE",
        },
      });

      return newVersion;
    }),

  // Registrar download
  logDownload: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.gedAccessLog.create({
        data: {
          documentId: input.id,
          userId: ctx.tenant.userId,
          action: "DOWNLOAD",
        },
      });

      return { success: true };
    }),

  // ---------------------------------------------------------------------------
  // CATEGORIAS
  // ---------------------------------------------------------------------------

  listCategories: tenantProcedure
    .input(z.object({
      includeInactive: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.GedCategoryWhereInput = {
        ...tenantFilter(ctx.companyId, true),
        ...(input.includeInactive ? {} : { isActive: true }),
      };

      const categories = await ctx.prisma.gedCategory.findMany({
        where,
        include: {
          _count: { select: { documents: true, children: true } },
          children: {
            where: input.includeInactive ? {} : { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      });

      // Organizar em árvore (apenas raízes)
      const roots = categories.filter((c) => !c.parentId);
      return roots;
    }),

  createCategory: tenantProcedure
    .input(categoryCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Verificar se já existe categoria com mesmo nome
      const existing = await ctx.prisma.gedCategory.findFirst({
        where: {
          name: input.name,
          companyId: ctx.companyId,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe uma categoria com este nome",
        });
      }

      const category = await ctx.prisma.gedCategory.create({
        data: {
          ...input,
          companyId: ctx.companyId,
        },
      });

      return category;
    }),

  updateCategory: tenantProcedure
    .input(categoryUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.prisma.gedCategory.findFirst({
        where: { id, ...tenantFilter(ctx.companyId, false) },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Categoria não encontrada",
        });
      }

      // Verificar nome duplicado se estiver alterando
      if (data.name && data.name !== existing.name) {
        const duplicate = await ctx.prisma.gedCategory.findFirst({
          where: {
            name: data.name,
            companyId: ctx.companyId,
            id: { not: id },
          },
        });

        if (duplicate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe uma categoria com este nome",
          });
        }
      }

      const category = await ctx.prisma.gedCategory.update({
        where: { id },
        data,
      });

      return category;
    }),

  deleteCategory: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.gedCategory.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId, false) },
        include: { _count: { select: { documents: true, children: true } } },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Categoria não encontrada",
        });
      }

      if (existing._count.documents > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Categoria possui ${existing._count.documents} documento(s) vinculado(s)`,
        });
      }

      if (existing._count.children > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Categoria possui ${existing._count.children} subcategoria(s)`,
        });
      }

      await ctx.prisma.gedCategory.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // ---------------------------------------------------------------------------
  // ESTATÍSTICAS
  // ---------------------------------------------------------------------------

  stats: tenantProcedure.query(async ({ ctx }) => {
    const [
      totalDocuments,
      totalCategories,
      totalSize,
      byStatus,
      byEntityType,
      recentUploads,
    ] = await Promise.all([
      ctx.prisma.gedDocument.count({
        where: { ...tenantFilter(ctx.companyId, true), status: { not: "DELETED" } },
      }),
      ctx.prisma.gedCategory.count({
        where: { ...tenantFilter(ctx.companyId, true), isActive: true },
      }),
      ctx.prisma.gedDocument.aggregate({
        where: { ...tenantFilter(ctx.companyId, true), status: { not: "DELETED" } },
        _sum: { fileSize: true },
      }),
      ctx.prisma.gedDocument.groupBy({
        by: ["status"],
        where: tenantFilter(ctx.companyId, true),
        _count: true,
      }),
      ctx.prisma.gedDocument.groupBy({
        by: ["entityType"],
        where: { ...tenantFilter(ctx.companyId, true), status: { not: "DELETED" }, entityType: { not: null } },
        _count: true,
      }),
      ctx.prisma.gedDocument.findMany({
        where: { ...tenantFilter(ctx.companyId, true), status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, fileName: true, createdAt: true },
      }),
    ]);

    return {
      totalDocuments,
      totalCategories,
      totalSizeBytes: totalSize._sum.fileSize ?? 0,
      totalSizeMB: Math.round((totalSize._sum.fileSize ?? 0) / 1024 / 1024 * 100) / 100,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byEntityType: byEntityType.map((e) => ({ entityType: e.entityType, count: e._count })),
      recentUploads,
    };
  }),
});
