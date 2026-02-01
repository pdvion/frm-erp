/**
 * NFe Queue Router
 * VIO-841: Fila assíncrona para emissão de NFe usando Supabase Queues (pgmq)
 */

import { z } from "zod";
import { createTRPCRouter, tenantProcedure, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { tenantFilter } from "../trpc";

// Status da NFe na fila
const NfeQueueStatus = z.enum(["pending", "processing", "completed", "failed", "retry"]);
type NfeQueueStatus = z.infer<typeof NfeQueueStatus>;

export const nfeQueueRouter = createTRPCRouter({
  /**
   * Enfileirar NFe para emissão assíncrona
   */
  enqueue: tenantProcedure
    .input(z.object({
      nfeId: z.string().uuid(),
      delaySeconds: z.number().int().min(0).default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar se NFe existe e pertence à empresa
      const nfe = await prisma.issuedInvoice.findFirst({
        where: {
          id: input.nfeId,
          ...tenantFilter(ctx.companyId),
        },
      });

      if (!nfe) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "NFe não encontrada",
        });
      }

      // Verificar se já não está na fila
      const existingJob = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM nfe_queue_jobs 
        WHERE nfe_id = ${input.nfeId}::uuid 
        AND status IN ('pending', 'processing', 'retry')
        LIMIT 1
      `;

      if (existingJob.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "NFe já está na fila de emissão",
        });
      }

      // Enfileirar usando função do banco
      const result = await prisma.$queryRaw<{ enqueue_nfe_emission: string }[]>`
        SELECT enqueue_nfe_emission(
          ${input.nfeId}::uuid,
          ${ctx.companyId}::uuid,
          ${input.delaySeconds}
        )
      `;

      const jobId = result[0]?.enqueue_nfe_emission;

      // Atualizar status da NFe para PENDING_TRANSMISSION
      await prisma.issuedInvoice.update({
        where: { id: input.nfeId },
        data: { 
          status: "PENDING_TRANSMISSION",
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        jobId,
        message: "NFe enfileirada para emissão",
      };
    }),

  /**
   * Consultar status do job de emissão
   */
  getJobStatus: tenantProcedure
    .input(z.object({
      jobId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      const job = await prisma.$queryRaw<{
        id: string;
        nfe_id: string;
        status: string;
        attempts: number;
        max_attempts: number;
        last_error: string | null;
        created_at: Date;
        updated_at: Date;
        completed_at: Date | null;
        next_retry_at: Date | null;
      }[]>`
        SELECT * FROM nfe_queue_jobs 
        WHERE id = ${input.jobId}::uuid 
        AND company_id = ${ctx.companyId}::uuid
      `;

      if (job.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job não encontrado",
        });
      }

      return {
        id: job[0].id,
        nfeId: job[0].nfe_id,
        status: job[0].status as NfeQueueStatus,
        attempts: job[0].attempts,
        maxAttempts: job[0].max_attempts,
        lastError: job[0].last_error,
        createdAt: job[0].created_at,
        updatedAt: job[0].updated_at,
        completedAt: job[0].completed_at,
        nextRetryAt: job[0].next_retry_at,
      };
    }),

  /**
   * Listar jobs de emissão da empresa
   */
  listJobs: tenantProcedure
    .input(z.object({
      status: NfeQueueStatus.optional(),
      limit: z.number().int().min(1).max(100).default(20),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      const jobs = await prisma.$queryRaw<{
        id: string;
        nfe_id: string;
        status: string;
        attempts: number;
        max_attempts: number;
        last_error: string | null;
        created_at: Date;
        updated_at: Date;
        completed_at: Date | null;
        next_retry_at: Date | null;
      }[]>`
        SELECT * FROM nfe_queue_jobs 
        WHERE company_id = ${ctx.companyId}::uuid
        ${input.status ? prisma.$queryRaw`AND status = ${input.status}` : prisma.$queryRaw``}
        ORDER BY created_at DESC
        LIMIT ${input.limit}
        OFFSET ${input.offset}
      `;

      const countResult = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count FROM nfe_queue_jobs 
        WHERE company_id = ${ctx.companyId}::uuid
        ${input.status ? prisma.$queryRaw`AND status = ${input.status}` : prisma.$queryRaw``}
      `;

      return {
        jobs: jobs.map((job) => ({
          id: job.id,
          nfeId: job.nfe_id,
          status: job.status as NfeQueueStatus,
          attempts: job.attempts,
          maxAttempts: job.max_attempts,
          lastError: job.last_error,
          createdAt: job.created_at,
          updatedAt: job.updated_at,
          completedAt: job.completed_at,
          nextRetryAt: job.next_retry_at,
        })),
        total: Number(countResult[0]?.count || 0),
      };
    }),

  /**
   * Cancelar job pendente
   */
  cancelJob: tenantProcedure
    .input(z.object({
      jobId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar se job existe e está pendente
      const job = await prisma.$queryRaw<{ id: string; status: string; nfe_id: string }[]>`
        SELECT id, status, nfe_id FROM nfe_queue_jobs 
        WHERE id = ${input.jobId}::uuid 
        AND company_id = ${ctx.companyId}::uuid
      `;

      if (job.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job não encontrado",
        });
      }

      if (job[0].status !== "pending" && job[0].status !== "retry") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Não é possível cancelar job com status '${job[0].status}'`,
        });
      }

      // Atualizar status do job
      await prisma.$executeRaw`
        UPDATE nfe_queue_jobs 
        SET status = 'failed', 
            last_error = 'Cancelado pelo usuário',
            updated_at = NOW()
        WHERE id = ${input.jobId}::uuid
      `;

      // Reverter status da NFe
      await prisma.issuedInvoice.update({
        where: { id: job[0].nfe_id },
        data: { 
          status: "DRAFT",
          updatedAt: new Date(),
        },
      });

      return { success: true };
    }),

  /**
   * Reprocessar job que falhou
   */
  retryJob: tenantProcedure
    .input(z.object({
      jobId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar se job existe e falhou
      const job = await prisma.$queryRaw<{ id: string; status: string; nfe_id: string }[]>`
        SELECT id, status, nfe_id FROM nfe_queue_jobs 
        WHERE id = ${input.jobId}::uuid 
        AND company_id = ${ctx.companyId}::uuid
      `;

      if (job.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job não encontrado",
        });
      }

      if (job[0].status !== "failed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Só é possível reprocessar jobs com status 'failed'`,
        });
      }

      // Criar novo job
      const result = await prisma.$queryRaw<{ enqueue_nfe_emission: string }[]>`
        SELECT enqueue_nfe_emission(
          ${job[0].nfe_id}::uuid,
          ${ctx.companyId}::uuid,
          0
        )
      `;

      // Atualizar status da NFe
      await prisma.issuedInvoice.update({
        where: { id: job[0].nfe_id },
        data: { 
          status: "PENDING_TRANSMISSION",
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        newJobId: result[0]?.enqueue_nfe_emission,
      };
    }),

  /**
   * Estatísticas da fila
   */
  getQueueStats: tenantProcedure
    .query(async ({ ctx }) => {
      const stats = await prisma.$queryRaw<{
        status: string;
        count: bigint;
      }[]>`
        SELECT status, COUNT(*) as count 
        FROM nfe_queue_jobs 
        WHERE company_id = ${ctx.companyId}::uuid
        GROUP BY status
      `;

      const statsMap: Record<string, number> = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        retry: 0,
      };

      stats.forEach((s) => {
        statsMap[s.status] = Number(s.count);
      });

      return {
        pending: statsMap.pending,
        processing: statsMap.processing,
        completed: statsMap.completed,
        failed: statsMap.failed,
        retry: statsMap.retry,
        total: Object.values(statsMap).reduce((a, b) => a + b, 0),
      };
    }),

  /**
   * Endpoint para worker processar a fila (chamado por cron/edge function)
   * Este endpoint deve ser protegido por API key em produção
   */
  processQueue: publicProcedure
    .input(z.object({
      apiKey: z.string(),
      batchSize: z.number().int().min(1).max(10).default(5),
    }))
    .mutation(async ({ input }) => {
      // Validar API key (em produção, usar variável de ambiente)
      const expectedKey = process.env.NFE_QUEUE_API_KEY || "dev-queue-key";
      if (input.apiKey !== expectedKey) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "API key inválida",
        });
      }

      // Ler mensagens da fila
      const messages = await prisma.$queryRaw<{
        msg_id: bigint;
        message: {
          job_id: string;
          nfe_id: string;
          company_id: string;
          enqueued_at: string;
        };
      }[]>`
        SELECT * FROM pgmq.read('nfe_emission', 60, ${input.batchSize})
      `;

      const results: { jobId: string; success: boolean; error?: string }[] = [];

      for (const msg of messages) {
        const { job_id, nfe_id } = msg.message;

        try {
          // Marcar job como processing
          await prisma.$executeRaw`
            UPDATE nfe_queue_jobs 
            SET status = 'processing', updated_at = NOW()
            WHERE id = ${job_id}::uuid
          `;

          // Aqui seria a chamada real para SEFAZ
          // Por enquanto, simular processamento
          const sefazResult = await simulateSefazEmission(nfe_id);

          if (sefazResult.success) {
            // Atualizar NFe com protocolo
            await prisma.issuedInvoice.update({
              where: { id: nfe_id },
              data: {
                status: "AUTHORIZED",
                protocolNumber: sefazResult.protocol,
                authorizedAt: new Date(),
                updatedAt: new Date(),
              },
            });

            // Marcar job como completo
            await prisma.$executeRaw`
              SELECT complete_nfe_job(${job_id}::uuid, true, NULL)
            `;

            // Deletar mensagem da fila
            await prisma.$executeRaw`
              SELECT pgmq.delete('nfe_emission', ${msg.msg_id})
            `;

            results.push({ jobId: job_id, success: true });
          } else {
            throw new Error(sefazResult.error || "Erro desconhecido na SEFAZ");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

          // Marcar job como falha (com retry automático se aplicável)
          await prisma.$executeRaw`
            SELECT complete_nfe_job(${job_id}::uuid, false, ${errorMessage})
          `;

          // Deletar mensagem da fila original (retry vai para outra fila)
          await prisma.$executeRaw`
            SELECT pgmq.delete('nfe_emission', ${msg.msg_id})
          `;

          results.push({ jobId: job_id, success: false, error: errorMessage });
        }
      }

      return {
        processed: results.length,
        results,
      };
    }),
});

/**
 * Simula emissão na SEFAZ (substituir por integração real)
 */
async function simulateSefazEmission(nfeId: string): Promise<{
  success: boolean;
  protocol?: string;
  error?: string;
}> {
  // Simular delay de rede baseado no ID para consistência
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Simular 90% de sucesso (usar nfeId para seed)
  const seed = nfeId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const success = seed % 10 !== 0;

  if (success) {
    return {
      success: true,
      protocol: `${Date.now()}${nfeId.substring(0, 6)}`.toUpperCase(),
    };
  } else {
    return {
      success: false,
      error: "SEFAZ indisponível - timeout na conexão",
    };
  }
}
