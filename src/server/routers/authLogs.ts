import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const authLogsRouter = createTRPCRouter({
  // Listar logs de autenticação do Supabase
  list: tenantProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
        eventType: z.string().optional(),
        userId: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      // Verificar permissão de admin
      if (!ctx.tenant.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não identificado" });
      }
      const permission = await ctx.prisma.userCompanyPermission.findFirst({
        where: { userId: ctx.tenant.userId, companyId: ctx.companyId, module: "SETTINGS", permission: "FULL" },
      });
      if (!permission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
      }

      const page = input?.page ?? 1;
      const limit = input?.limit ?? 50;
      const offset = (page - 1) * limit;

      // Buscar IDs dos usuários da empresa para filtrar logs por tenant
      const companyUsers = await ctx.prisma.userCompany.findMany({
        where: { companyId: ctx.companyId },
        select: { userId: true },
      });
      const userIds = companyUsers.map((u: { userId: string }) => u.userId);

      // Query ao schema auth do Supabase, filtrada por usuários do tenant
      const logs = await ctx.prisma.$queryRawUnsafe<Array<{
        id: string;
        payload: Record<string, unknown>;
        ip_address: string | null;
        created_at: Date;
      }>>(
        `SELECT id, payload, ip_address, created_at 
         FROM auth.audit_log_entries 
         WHERE payload->>'actor_id' = ANY($3::text[])
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`,
        limit,
        offset,
        userIds
      );

      const countResult = await ctx.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM auth.audit_log_entries WHERE payload->>'actor_id' = ANY($1::text[])`,
        userIds
      );
      const total = Number(countResult[0]?.count ?? 0);

      return {
        logs: logs.map((log) => ({
          id: log.id,
          eventType: (log.payload as { action?: string })?.action ?? "unknown",
          userId: (log.payload as { actor_id?: string })?.actor_id ?? null,
          email: (log.payload as { actor_username?: string })?.actor_username ?? null,
          ipAddress: log.ip_address,
          createdAt: log.created_at,
          payload: log.payload,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Estatísticas de eventos de auth
  stats: tenantProcedure.query(async ({ ctx }) => {
    // Verificar permissão de admin
    if (!ctx.tenant.userId) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não identificado" });
    }
    const permission = await ctx.prisma.userCompanyPermission.findFirst({
      where: { userId: ctx.tenant.userId, companyId: ctx.companyId, module: "SETTINGS", permission: "FULL" },
    });
    if (!permission) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
    }

    // Buscar IDs dos usuários da empresa
    const companyUsers = await ctx.prisma.userCompany.findMany({
      where: { companyId: ctx.companyId },
      select: { userId: true },
    });
    const userIds = companyUsers.map((u: { userId: string }) => u.userId);

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total de eventos nas últimas 24h (filtrado por tenant)
    const last24hResult = await ctx.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM auth.audit_log_entries WHERE created_at >= $1 AND payload->>'actor_id' = ANY($2::text[])`,
      last24h,
      userIds
    );

    // Total de eventos nos últimos 7 dias (filtrado por tenant)
    const last7dResult = await ctx.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM auth.audit_log_entries WHERE created_at >= $1 AND payload->>'actor_id' = ANY($2::text[])`,
      last7d,
      userIds
    );

    // Eventos por tipo (últimos 7 dias, filtrado por tenant)
    const byTypeResult = await ctx.prisma.$queryRawUnsafe<Array<{ action: string; count: bigint }>>(
      `SELECT payload->>'action' as action, COUNT(*) as count 
       FROM auth.audit_log_entries 
       WHERE created_at >= $1 AND payload->>'actor_id' = ANY($2::text[])
       GROUP BY payload->>'action' 
       ORDER BY count DESC 
       LIMIT 10`,
      last7d,
      userIds
    );

    return {
      last24h: Number(last24hResult[0]?.count ?? 0),
      last7d: Number(last7dResult[0]?.count ?? 0),
      byType: byTypeResult.map((r) => ({
        type: r.action ?? "unknown",
        count: Number(r.count),
      })),
    };
  }),
});
