import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const authLogsRouter = createTRPCRouter({
  // Listar logs de autenticação do Supabase
  list: publicProcedure
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
    .query(async ({ input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 50;
      const offset = (page - 1) * limit;

      // Query direta ao schema auth do Supabase
      // Nota: Prisma não tem acesso direto ao schema auth, então usamos raw query
      const logs = await prisma.$queryRawUnsafe<Array<{
        id: string;
        payload: Record<string, unknown>;
        ip_address: string | null;
        created_at: Date;
      }>>(
        `SELECT id, payload, ip_address, created_at 
         FROM auth.audit_log_entries 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`,
        limit,
        offset
      );

      const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM auth.audit_log_entries`
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
  stats: publicProcedure.query(async () => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total de eventos nas últimas 24h
    const last24hResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM auth.audit_log_entries WHERE created_at >= $1`,
      last24h
    );

    // Total de eventos nos últimos 7 dias
    const last7dResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM auth.audit_log_entries WHERE created_at >= $1`,
      last7d
    );

    // Eventos por tipo (últimos 7 dias)
    const byTypeResult = await prisma.$queryRawUnsafe<Array<{ action: string; count: bigint }>>(
      `SELECT payload->>'action' as action, COUNT(*) as count 
       FROM auth.audit_log_entries 
       WHERE created_at >= $1 
       GROUP BY payload->>'action' 
       ORDER BY count DESC 
       LIMIT 10`,
      last7d
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
