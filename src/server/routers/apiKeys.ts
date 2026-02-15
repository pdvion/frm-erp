import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { generateApiKey } from "@/lib/api-auth";
import { ApiKeyPermission } from "@prisma/client";

const permissionEnum = z.nativeEnum(ApiKeyPermission);

export const apiKeysRouter = createTRPCRouter({
  list: tenantProcedure.query(async ({ ctx }) => {
    const keys = await ctx.prisma.apiKey.findMany({
      where: { companyId: ctx.companyId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return { keys };
  }),

  create: tenantProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        permissions: z.array(permissionEnum).min(1).default(["ALL"]),
        expiresAt: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.prisma.apiKey.count({
        where: { companyId: ctx.companyId, isActive: true },
      });
      if (count >= 20) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Limite de 20 chaves ativas por empresa atingido",
        });
      }

      const { key, keyHash, keyPrefix } = generateApiKey();

      const apiKey = await ctx.prisma.apiKey.create({
        data: {
          companyId: ctx.companyId,
          name: input.name,
          keyHash,
          keyPrefix,
          permissions: input.permissions,
          expiresAt: input.expiresAt,
        },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          permissions: true,
          expiresAt: true,
          createdAt: true,
        },
      });

      // Return plaintext key ONLY on creation
      return { ...apiKey, key };
    }),

  revoke: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.apiKey.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chave não encontrada" });
      }

      await ctx.prisma.apiKey.update({
        where: { id: input.id },
        data: { isActive: false },
      });

      return { success: true };
    }),

  rotate: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.apiKey.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chave não encontrada" });
      }

      const { key, keyHash, keyPrefix } = generateApiKey();

      const [, newKey] = await ctx.prisma.$transaction([
        // Revoke old key
        ctx.prisma.apiKey.update({
          where: { id: input.id },
          data: { isActive: false },
        }),
        // Create new key with same permissions
        ctx.prisma.apiKey.create({
          data: {
            companyId: ctx.companyId,
            name: input.name || existing.name,
            keyHash,
            keyPrefix,
            permissions: existing.permissions,
            expiresAt: existing.expiresAt,
          },
          select: {
            id: true,
            name: true,
            keyPrefix: true,
            permissions: true,
            expiresAt: true,
            createdAt: true,
          },
        }),
      ]);

      return { ...newKey, key };
    }),
});
