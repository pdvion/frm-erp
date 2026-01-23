import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const collectionRulesRouter = createTRPCRouter({
  // Listar réguas de cobrança
  list: tenantProcedure
    .input(
      z
        .object({
          isActive: z.boolean().optional(),
          search: z.string().optional(),
          page: z.number().default(1),
          limit: z.number().default(20),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const { isActive, search, page = 1, limit = 20 } = input || {};

      const where: Prisma.CollectionRuleWhereInput = {
        ...tenantFilter(ctx.companyId, false),
      };

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ];
      }

      const [rules, total] = await Promise.all([
        ctx.prisma.collectionRule.findMany({
          where,
          include: {
            steps: {
              orderBy: { stepOrder: "asc" },
            },
            _count: { select: { actions: true } },
          },
          orderBy: { name: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.collectionRule.count({ where }),
      ]);

      return { rules, total, pages: Math.ceil(total / limit) };
    }),

  // Buscar régua por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const rule = await ctx.prisma.collectionRule.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId, false) },
        include: {
          steps: {
            orderBy: { stepOrder: "asc" },
          },
        },
      });

      if (!rule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Régua de cobrança não encontrada",
        });
      }

      return rule;
    }),

  // Criar régua de cobrança
  create: tenantProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        isActive: z.boolean().default(true),
        isDefault: z.boolean().default(false),
        steps: z
          .array(
            z.object({
              stepOrder: z.number(),
              name: z.string().min(1),
              daysOffset: z.number(), // Negativo = antes, Positivo = depois
              actionType: z.enum([
                "EMAIL",
                "SMS",
                "WHATSAPP",
                "PHONE",
                "LETTER",
                "NEGATIVATION",
                "PROTEST",
              ]),
              templateSubject: z.string().optional(),
              templateBody: z.string().optional(),
              isActive: z.boolean().default(true),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { steps, isDefault, ...ruleData } = input;

      // Se for default, remover default das outras
      if (isDefault) {
        await ctx.prisma.collectionRule.updateMany({
          where: { ...tenantFilter(ctx.companyId, false), isDefault: true },
          data: { isDefault: false },
        });
      }

      const rule = await ctx.prisma.collectionRule.create({
        data: {
          ...ruleData,
          isDefault,
          companyId: ctx.companyId,
          createdBy: ctx.tenant.userId,
          steps: steps
            ? {
                create: steps.map((step) => ({
                  ...step,
                })),
              }
            : undefined,
        },
        include: {
          steps: {
            orderBy: { stepOrder: "asc" },
          },
        },
      });

      return rule;
    }),

  // Atualizar régua de cobrança
  update: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, isDefault, ...data } = input;

      const existing = await ctx.prisma.collectionRule.findFirst({
        where: { id, ...tenantFilter(ctx.companyId, false) },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Régua de cobrança não encontrada",
        });
      }

      // Se for default, remover default das outras
      if (isDefault) {
        await ctx.prisma.collectionRule.updateMany({
          where: {
            ...tenantFilter(ctx.companyId, false),
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }

      return ctx.prisma.collectionRule.update({
        where: { id },
        data: { ...data, isDefault },
        include: {
          steps: {
            orderBy: { stepOrder: "asc" },
          },
        },
      });
    }),

  // Excluir régua de cobrança
  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.collectionRule.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId, false) },
        include: { _count: { select: { actions: true } } },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Régua de cobrança não encontrada",
        });
      }

      if (existing._count.actions > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Régua possui ações de cobrança vinculadas e não pode ser excluída",
        });
      }

      return ctx.prisma.collectionRule.delete({
        where: { id: input.id },
      });
    }),

  // Adicionar etapa à régua
  addStep: tenantProcedure
    .input(
      z.object({
        ruleId: z.string(),
        stepOrder: z.number(),
        name: z.string().min(1),
        daysOffset: z.number(),
        actionType: z.enum([
          "EMAIL",
          "SMS",
          "WHATSAPP",
          "PHONE",
          "LETTER",
          "NEGATIVATION",
          "PROTEST",
        ]),
        templateSubject: z.string().optional(),
        templateBody: z.string().optional(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { ruleId, ...stepData } = input;

      const rule = await ctx.prisma.collectionRule.findFirst({
        where: { id: ruleId, ...tenantFilter(ctx.companyId, false) },
      });

      if (!rule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Régua de cobrança não encontrada",
        });
      }

      return ctx.prisma.collectionRuleStep.create({
        data: {
          ...stepData,
          collectionRuleId: ruleId,
        },
      });
    }),

  // Atualizar etapa
  updateStep: tenantProcedure
    .input(
      z.object({
        stepId: z.string(),
        name: z.string().min(1).optional(),
        daysOffset: z.number().optional(),
        actionType: z
          .enum([
            "EMAIL",
            "SMS",
            "WHATSAPP",
            "PHONE",
            "LETTER",
            "NEGATIVATION",
            "PROTEST",
          ])
          .optional(),
        templateSubject: z.string().optional(),
        templateBody: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { stepId, ...data } = input;

      const step = await ctx.prisma.collectionRuleStep.findFirst({
        where: { id: stepId },
        include: { collectionRule: true },
      });

      if (!step) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Etapa não encontrada",
        });
      }

      // Verificar permissão
      const rule = await ctx.prisma.collectionRule.findFirst({
        where: {
          id: step.collectionRuleId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!rule) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para editar esta etapa",
        });
      }

      return ctx.prisma.collectionRuleStep.update({
        where: { id: stepId },
        data,
      });
    }),

  // Excluir etapa
  deleteStep: tenantProcedure
    .input(z.object({ stepId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const step = await ctx.prisma.collectionRuleStep.findFirst({
        where: { id: input.stepId },
        include: { collectionRule: true, _count: { select: { actions: true } } },
      });

      if (!step) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Etapa não encontrada",
        });
      }

      // Verificar permissão
      const rule = await ctx.prisma.collectionRule.findFirst({
        where: {
          id: step.collectionRuleId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!rule) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para excluir esta etapa",
        });
      }

      if (step._count.actions > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Etapa possui ações vinculadas e não pode ser excluída",
        });
      }

      return ctx.prisma.collectionRuleStep.delete({
        where: { id: input.stepId },
      });
    }),

  // Registrar ação de cobrança
  registerAction: tenantProcedure
    .input(
      z.object({
        receivableId: z.string(),
        collectionRuleId: z.string().optional(),
        stepId: z.string().optional(),
        actionType: z.enum([
          "EMAIL",
          "SMS",
          "WHATSAPP",
          "PHONE",
          "LETTER",
          "NEGATIVATION",
          "PROTEST",
        ]),
        contactInfo: z.string().optional(),
        messageContent: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar se o título existe e pertence ao tenant
      const receivable = await ctx.prisma.accountsReceivable.findFirst({
        where: {
          id: input.receivableId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!receivable) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Título não encontrado",
        });
      }

      return ctx.prisma.collectionAction.create({
        data: {
          ...input,
          status: "PENDING",
          createdBy: ctx.tenant.userId,
        },
      });
    }),

  // Atualizar status da ação
  updateActionStatus: tenantProcedure
    .input(
      z.object({
        actionId: z.string(),
        status: z.enum(["PENDING", "SENT", "DELIVERED", "FAILED", "RESPONDED"]),
        responseContent: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { actionId, status, responseContent, notes } = input;

      const action = await ctx.prisma.collectionAction.findFirst({
        where: { id: actionId },
        include: { receivable: true },
      });

      if (!action) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ação não encontrada",
        });
      }

      // Verificar permissão
      const receivable = await ctx.prisma.accountsReceivable.findFirst({
        where: {
          id: action.receivableId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!receivable) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para atualizar esta ação",
        });
      }

      return ctx.prisma.collectionAction.update({
        where: { id: actionId },
        data: {
          status,
          responseContent,
          responseDate: status === "RESPONDED" ? new Date() : undefined,
          notes: notes ? `${action.notes || ""}\n${notes}`.trim() : undefined,
        },
      });
    }),

  // Listar ações de cobrança de um título
  listActions: tenantProcedure
    .input(
      z.object({
        receivableId: z.string(),
        status: z
          .enum(["PENDING", "SENT", "DELIVERED", "FAILED", "RESPONDED", "ALL"])
          .optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { receivableId, status } = input;

      // Verificar permissão
      const receivable = await ctx.prisma.accountsReceivable.findFirst({
        where: {
          id: receivableId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!receivable) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Título não encontrado",
        });
      }

      const where: Prisma.CollectionActionWhereInput = {
        receivableId,
      };

      if (status && status !== "ALL") {
        where.status = status;
      }

      return ctx.prisma.collectionAction.findMany({
        where,
        include: {
          collectionRule: { select: { id: true, name: true } },
          step: { select: { id: true, name: true, stepOrder: true } },
        },
        orderBy: { actionDate: "desc" },
      });
    }),

  // Dashboard de cobrança
  dashboard: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Títulos vencidos por faixa de dias
    const overdueReceivables = await ctx.prisma.accountsReceivable.findMany({
      where: {
        ...tenantFilter(ctx.companyId, false),
        status: { in: ["PENDING", "PARTIAL"] },
        dueDate: { lt: today },
      },
      select: { id: true, dueDate: true, netValue: true, paidValue: true },
    });

    const aging = {
      days1to7: { count: 0, value: 0 },
      days8to15: { count: 0, value: 0 },
      days16to30: { count: 0, value: 0 },
      days31to60: { count: 0, value: 0 },
      over60: { count: 0, value: 0 },
    };

    for (const r of overdueReceivables) {
      const remaining = r.netValue - r.paidValue;
      const daysOverdue = Math.floor(
        (today.getTime() - new Date(r.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysOverdue <= 7) {
        aging.days1to7.count++;
        aging.days1to7.value += remaining;
      } else if (daysOverdue <= 15) {
        aging.days8to15.count++;
        aging.days8to15.value += remaining;
      } else if (daysOverdue <= 30) {
        aging.days16to30.count++;
        aging.days16to30.value += remaining;
      } else if (daysOverdue <= 60) {
        aging.days31to60.count++;
        aging.days31to60.value += remaining;
      } else {
        aging.over60.count++;
        aging.over60.value += remaining;
      }
    }

    // Ações pendentes
    const pendingActions = await ctx.prisma.collectionAction.count({
      where: {
        receivable: tenantFilter(ctx.companyId, false),
        status: "PENDING",
      },
    });

    // Ações do mês
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const actionsThisMonth = await ctx.prisma.collectionAction.groupBy({
      by: ["status"],
      where: {
        receivable: tenantFilter(ctx.companyId, false),
        actionDate: { gte: startOfMonth },
      },
      _count: true,
    });

    return {
      aging,
      pendingActions,
      actionsThisMonth: actionsThisMonth.map((a) => ({
        status: a.status,
        count: a._count,
      })),
      totalOverdue: {
        count: overdueReceivables.length,
        value: overdueReceivables.reduce(
          (sum, r) => sum + (r.netValue - r.paidValue),
          0
        ),
      },
    };
  }),

  // Títulos pendentes de cobrança (sem ação recente)
  pendingCollection: tenantProcedure
    .input(
      z
        .object({
          daysWithoutAction: z.number().default(7),
          minDaysOverdue: z.number().default(1),
          page: z.number().default(1),
          limit: z.number().default(20),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const {
        daysWithoutAction = 7,
        minDaysOverdue = 1,
        page = 1,
        limit = 20,
      } = input || {};

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const maxDueDate = new Date(today);
      maxDueDate.setDate(maxDueDate.getDate() - minDaysOverdue);

      const minActionDate = new Date(today);
      minActionDate.setDate(minActionDate.getDate() - daysWithoutAction);

      // Buscar títulos vencidos
      const receivables = await ctx.prisma.accountsReceivable.findMany({
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: { in: ["PENDING", "PARTIAL"] },
          dueDate: { lt: maxDueDate },
        },
        include: {
          customer: { select: { id: true, companyName: true, tradeName: true } },
          collectionActions: {
            where: { actionDate: { gte: minActionDate } },
            orderBy: { actionDate: "desc" },
            take: 1,
          },
        },
        orderBy: { dueDate: "asc" },
      });

      // Filtrar apenas os que não têm ação recente
      const pendingReceivables = receivables.filter(
        (r) => r.collectionActions.length === 0
      );

      const total = pendingReceivables.length;
      const paged = pendingReceivables.slice((page - 1) * limit, page * limit);

      return {
        receivables: paged.map((r) => ({
          ...r,
          daysOverdue: Math.floor(
            (today.getTime() - new Date(r.dueDate).getTime()) / (1000 * 60 * 60 * 24)
          ),
          remainingValue: r.netValue - r.paidValue,
        })),
        total,
        pages: Math.ceil(total / limit),
      };
    }),
});
