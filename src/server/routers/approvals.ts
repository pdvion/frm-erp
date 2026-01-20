import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const approvalsRouter = createTRPCRouter({
  // ==========================================================================
  // NÍVEIS DE ALÇADA
  // ==========================================================================

  // Listar níveis de alçada
  listLevels: tenantProcedure
    .input(
      z.object({
        includeInactive: z.boolean().default(false),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { includeInactive } = input || {};

      return ctx.prisma.approvalLevel.findMany({
        where: {
          companyId: ctx.companyId,
          ...(!includeInactive && { isActive: true }),
        },
        include: {
          approvers: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { sequence: "asc" },
          },
          _count: { select: { paymentRequests: true } },
        },
        orderBy: { sequence: "asc" },
      });
    }),

  // Buscar nível por ID
  getLevelById: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const level = await ctx.prisma.approvalLevel.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          approvers: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { sequence: "asc" },
          },
        },
      });

      if (!level) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nível de alçada não encontrado" });
      }

      return level;
    }),

  // Criar nível de alçada
  createLevel: tenantProcedure
    .input(
      z.object({
        code: z.string().min(1).max(50),
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        minValue: z.number().min(0).default(0),
        maxValue: z.number().optional(),
        requiresAllApprovers: z.boolean().default(false),
        approvers: z.array(
          z.object({
            userId: z.string().uuid(),
            canApprove: z.boolean().default(true),
            canReject: z.boolean().default(true),
          })
        ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar código único
      const existing = await ctx.prisma.approvalLevel.findFirst({
        where: { code: input.code, companyId: ctx.companyId },
      });

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Código já existe" });
      }

      // Obter próxima sequência
      const maxSeq = await ctx.prisma.approvalLevel.aggregate({
        where: { companyId: ctx.companyId },
        _max: { sequence: true },
      });

      const { approvers, ...data } = input;

      return ctx.prisma.approvalLevel.create({
        data: {
          ...data,
          companyId: ctx.companyId,
          sequence: (maxSeq._max.sequence || 0) + 1,
          approvers: {
            create: approvers.map((a, idx) => ({
              userId: a.userId,
              canApprove: a.canApprove,
              canReject: a.canReject,
              sequence: idx + 1,
            })),
          },
        },
        include: {
          approvers: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
    }),

  // Atualizar nível de alçada
  updateLevel: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        minValue: z.number().min(0).optional(),
        maxValue: z.number().nullable().optional(),
        requiresAllApprovers: z.boolean().optional(),
        isActive: z.boolean().optional(),
        approvers: z.array(
          z.object({
            userId: z.string().uuid(),
            canApprove: z.boolean().default(true),
            canReject: z.boolean().default(true),
          })
        ).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, approvers, ...data } = input;

      const level = await ctx.prisma.approvalLevel.findFirst({
        where: { id, companyId: ctx.companyId },
      });

      if (!level) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nível de alçada não encontrado" });
      }

      // Se approvers foi fornecido, substituir todos
      if (approvers) {
        await ctx.prisma.approvalLevelApprover.deleteMany({
          where: { levelId: id },
        });

        await ctx.prisma.approvalLevelApprover.createMany({
          data: approvers.map((a, idx) => ({
            levelId: id,
            userId: a.userId,
            canApprove: a.canApprove,
            canReject: a.canReject,
            sequence: idx + 1,
          })),
        });
      }

      return ctx.prisma.approvalLevel.update({
        where: { id },
        data,
        include: {
          approvers: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
    }),

  // Deletar nível de alçada
  deleteLevel: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const level = await ctx.prisma.approvalLevel.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: { _count: { select: { paymentRequests: true } } },
      });

      if (!level) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nível de alçada não encontrado" });
      }

      if (level._count.paymentRequests > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível excluir nível com solicitações vinculadas",
        });
      }

      return ctx.prisma.approvalLevel.delete({ where: { id: input.id } });
    }),

  // ==========================================================================
  // SOLICITAÇÕES DE PAGAMENTO
  // ==========================================================================

  // Listar solicitações de pagamento
  listRequests: tenantProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED", "PAID"]).optional(),
        urgency: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
        search: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { status, urgency, search, dateFrom, dateTo, page = 1, limit = 20 } = input || {};

      const where: Prisma.PaymentRequestWhereInput = {
        companyId: ctx.companyId,
        ...(status && { status }),
        ...(urgency && { urgency }),
        ...(search && {
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            { justification: { contains: search, mode: "insensitive" as const } },
            { payable: { supplier: { companyName: { contains: search, mode: "insensitive" as const } } } },
          ],
        }),
        ...(dateFrom && { requestedAt: { gte: dateFrom } }),
        ...(dateTo && { requestedAt: { lte: dateTo } }),
      };

      const [requests, total] = await Promise.all([
        ctx.prisma.paymentRequest.findMany({
          where,
          include: {
            payable: {
              include: {
                supplier: { select: { id: true, companyName: true, tradeName: true } },
              },
            },
            currentLevel: { select: { id: true, name: true } },
            requester: { select: { id: true, name: true } },
            _count: { select: { approvals: true } },
          },
          orderBy: [{ urgency: "desc" }, { requestedAt: "desc" }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.paymentRequest.count({ where }),
      ]);

      return {
        requests,
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  // Buscar solicitação por ID
  getRequestById: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const request = await ctx.prisma.paymentRequest.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          payable: {
            include: {
              supplier: true,
            },
          },
          currentLevel: {
            include: {
              approvers: {
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
          requester: { select: { id: true, name: true, email: true } },
          approvals: {
            include: {
              level: { select: { id: true, name: true } },
              approver: { select: { id: true, name: true } },
              delegate: { select: { id: true, name: true } },
            },
            orderBy: { actionAt: "desc" },
          },
        },
      });

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Solicitação não encontrada" });
      }

      return request;
    }),

  // Criar solicitação de pagamento
  createRequest: tenantProcedure
    .input(
      z.object({
        payableId: z.string().uuid(),
        justification: z.string().optional(),
        urgency: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Buscar título
      const payable = await ctx.prisma.accountsPayable.findFirst({
        where: { id: input.payableId, ...tenantFilter(ctx.companyId, false) },
      });

      if (!payable) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Título não encontrado" });
      }

      if (payable.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Título não está pendente" });
      }

      // Verificar se já existe solicitação pendente
      const existingRequest = await ctx.prisma.paymentRequest.findFirst({
        where: {
          payableId: input.payableId,
          status: "PENDING",
        },
      });

      if (existingRequest) {
        throw new TRPCError({ code: "CONFLICT", message: "Já existe solicitação pendente para este título" });
      }

      // Encontrar nível de alçada apropriado
      const level = await ctx.prisma.approvalLevel.findFirst({
        where: {
          companyId: ctx.companyId,
          isActive: true,
          minValue: { lte: payable.netValue },
          OR: [
            { maxValue: null },
            { maxValue: { gte: payable.netValue } },
          ],
        },
        orderBy: { sequence: "asc" },
      });

      if (!level) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nenhum nível de alçada configurado para este valor",
        });
      }

      // Gerar código sequencial
      const lastRequest = await ctx.prisma.paymentRequest.findFirst({
        where: { companyId: ctx.companyId },
        orderBy: { code: "desc" },
        select: { code: true },
      });

      const nextNumber = lastRequest
        ? parseInt(lastRequest.code.replace("SP", "")) + 1
        : 1;
      const code = `SP${nextNumber.toString().padStart(6, "0")}`;

      return ctx.prisma.paymentRequest.create({
        data: {
          companyId: ctx.companyId,
          code,
          payableId: input.payableId,
          amount: payable.netValue,
          dueDate: payable.dueDate,
          currentLevelId: level.id,
          requestedBy: ctx.tenant.userId!,
          justification: input.justification,
          urgency: input.urgency,
        },
        include: {
          payable: {
            include: {
              supplier: { select: { id: true, companyName: true } },
            },
          },
          currentLevel: { select: { id: true, name: true } },
        },
      });
    }),

  // Aprovar solicitação
  approve: tenantProcedure
    .input(
      z.object({
        requestId: z.string().uuid(),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.prisma.paymentRequest.findFirst({
        where: { id: input.requestId, companyId: ctx.companyId },
        include: {
          currentLevel: {
            include: {
              approvers: true,
            },
          },
          approvals: true,
        },
      });

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Solicitação não encontrada" });
      }

      if (request.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Solicitação não está pendente" });
      }

      if (!request.currentLevel) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nível de aprovação não definido" });
      }

      // Verificar se usuário é aprovador do nível atual
      const isApprover = request.currentLevel.approvers.some(
        (a) => a.userId === ctx.tenant.userId && a.canApprove
      );

      if (!isApprover) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem permissão para aprovar" });
      }

      // Registrar aprovação
      await ctx.prisma.paymentApproval.create({
        data: {
          requestId: input.requestId,
          levelId: request.currentLevel.id,
          approverId: ctx.tenant.userId!,
          action: "APPROVED",
          comments: input.comments,
        },
      });

      // Verificar se precisa de mais aprovações no nível atual
      const approvalsInLevel = request.approvals.filter(
        (a) => a.levelId === request.currentLevelId && a.action === "APPROVED"
      ).length + 1;

      const requiredApprovals = request.currentLevel.requiresAllApprovers
        ? request.currentLevel.approvers.filter((a) => a.canApprove).length
        : 1;

      if (approvalsInLevel >= requiredApprovals) {
        // Buscar próximo nível
        const nextLevel = await ctx.prisma.approvalLevel.findFirst({
          where: {
            companyId: ctx.companyId,
            isActive: true,
            sequence: { gt: request.currentLevel.sequence },
            minValue: { lte: request.amount },
            OR: [
              { maxValue: null },
              { maxValue: { gte: request.amount } },
            ],
          },
          orderBy: { sequence: "asc" },
        });

        if (nextLevel) {
          // Avançar para próximo nível
          return ctx.prisma.paymentRequest.update({
            where: { id: input.requestId },
            data: { currentLevelId: nextLevel.id },
          });
        } else {
          // Aprovação completa
          return ctx.prisma.paymentRequest.update({
            where: { id: input.requestId },
            data: {
              status: "APPROVED",
              completedAt: new Date(),
            },
          });
        }
      }

      return request;
    }),

  // Rejeitar solicitação
  reject: tenantProcedure
    .input(
      z.object({
        requestId: z.string().uuid(),
        comments: z.string().min(1, "Motivo da rejeição é obrigatório"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.prisma.paymentRequest.findFirst({
        where: { id: input.requestId, companyId: ctx.companyId },
        include: {
          currentLevel: {
            include: {
              approvers: true,
            },
          },
        },
      });

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Solicitação não encontrada" });
      }

      if (request.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Solicitação não está pendente" });
      }

      if (!request.currentLevel) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nível de aprovação não definido" });
      }

      // Verificar se usuário pode rejeitar
      const canReject = request.currentLevel.approvers.some(
        (a) => a.userId === ctx.tenant.userId && a.canReject
      );

      if (!canReject) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem permissão para rejeitar" });
      }

      // Registrar rejeição
      await ctx.prisma.paymentApproval.create({
        data: {
          requestId: input.requestId,
          levelId: request.currentLevel.id,
          approverId: ctx.tenant.userId!,
          action: "REJECTED",
          comments: input.comments,
        },
      });

      return ctx.prisma.paymentRequest.update({
        where: { id: input.requestId },
        data: {
          status: "REJECTED",
          completedAt: new Date(),
        },
      });
    }),

  // Cancelar solicitação
  cancelRequest: tenantProcedure
    .input(
      z.object({
        requestId: z.string().uuid(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.prisma.paymentRequest.findFirst({
        where: { id: input.requestId, companyId: ctx.companyId },
      });

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Solicitação não encontrada" });
      }

      if (request.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Solicitação não está pendente" });
      }

      // Apenas o solicitante pode cancelar
      if (request.requestedBy !== ctx.tenant.userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas o solicitante pode cancelar" });
      }

      return ctx.prisma.paymentRequest.update({
        where: { id: input.requestId },
        data: {
          status: "CANCELLED",
          completedAt: new Date(),
          notes: input.reason
            ? `${request.notes || ""}\n[CANCELADO] ${input.reason}`.trim()
            : request.notes,
        },
      });
    }),

  // Minhas pendências de aprovação
  getMyPendingApprovals: tenantProcedure.query(async ({ ctx }) => {
    // Buscar níveis onde o usuário é aprovador
    const myLevels = await ctx.prisma.approvalLevelApprover.findMany({
      where: {
        userId: ctx.tenant.userId!,
        canApprove: true,
        level: { companyId: ctx.companyId, isActive: true },
      },
      select: { levelId: true },
    });

    const levelIds = myLevels.map((l) => l.levelId);

    if (levelIds.length === 0) {
      return [];
    }

    return ctx.prisma.paymentRequest.findMany({
      where: {
        companyId: ctx.companyId,
        status: "PENDING",
        currentLevelId: { in: levelIds },
      },
      include: {
        payable: {
          include: {
            supplier: { select: { id: true, companyName: true, tradeName: true } },
          },
        },
        currentLevel: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true } },
      },
      orderBy: [{ urgency: "desc" }, { dueDate: "asc" }],
    });
  }),

  // Dashboard de aprovações
  getDashboard: tenantProcedure.query(async ({ ctx }) => {
    const [statusCounts, urgencyCounts, myPending, recentApprovals] = await Promise.all([
      // Contagem por status
      ctx.prisma.paymentRequest.groupBy({
        by: ["status"],
        where: { companyId: ctx.companyId },
        _count: true,
        _sum: { amount: true },
      }),
      // Contagem por urgência (apenas pendentes)
      ctx.prisma.paymentRequest.groupBy({
        by: ["urgency"],
        where: { companyId: ctx.companyId, status: "PENDING" },
        _count: true,
      }),
      // Minhas pendências
      ctx.prisma.approvalLevelApprover.findMany({
        where: {
          userId: ctx.tenant.userId!,
          canApprove: true,
          level: { companyId: ctx.companyId, isActive: true },
        },
        select: { levelId: true },
      }).then(async (levels) => {
        if (levels.length === 0) return 0;
        return ctx.prisma.paymentRequest.count({
          where: {
            companyId: ctx.companyId,
            status: "PENDING",
            currentLevelId: { in: levels.map((l) => l.levelId) },
          },
        });
      }),
      // Aprovações recentes
      ctx.prisma.paymentApproval.findMany({
        where: {
          request: { companyId: ctx.companyId },
        },
        include: {
          request: {
            include: {
              payable: {
                include: {
                  supplier: { select: { companyName: true } },
                },
              },
            },
          },
          approver: { select: { name: true } },
          level: { select: { name: true } },
        },
        orderBy: { actionAt: "desc" },
        take: 10,
      }),
    ]);

    const statusMap = statusCounts.reduce(
      (acc, item) => ({
        ...acc,
        [item.status]: { count: item._count, total: item._sum.amount || 0 },
      }),
      {
        PENDING: { count: 0, total: 0 },
        APPROVED: { count: 0, total: 0 },
        REJECTED: { count: 0, total: 0 },
        CANCELLED: { count: 0, total: 0 },
        PAID: { count: 0, total: 0 },
      }
    );

    const urgencyMap = urgencyCounts.reduce(
      (acc, item) => ({ ...acc, [item.urgency]: item._count }),
      { LOW: 0, NORMAL: 0, HIGH: 0, URGENT: 0 }
    );

    return {
      status: statusMap,
      urgency: urgencyMap,
      myPendingCount: myPending,
      recentApprovals,
    };
  }),
});
