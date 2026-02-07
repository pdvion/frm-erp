import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { Prisma } from "@prisma/client";
import {
  generateWorkflowFromPrompt,
  refineWorkflow,
  PROMPT_SUGGESTIONS,
  type GeneratedWorkflow,
} from "@/lib/ai/workflowGenerator";
import { getOpenAIKey } from "@/server/services/getAIApiKey";

export const workflowRouter = createTRPCRouter({
  // ============================================================================
  // DEFINIÇÕES DE WORKFLOW
  // ============================================================================

  listDefinitions: tenantProcedure
    .input(
      z.object({
        category: z.enum(["PURCHASE", "PAYMENT", "HR", "PRODUCTION", "SALES", "GENERAL"]).optional(),
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.workflowDefinition.findMany({
        where: {
          companyId: ctx.companyId,
          ...(input?.category && { category: input.category }),
          ...(input?.isActive !== undefined && { isActive: input.isActive }),
        },
        include: {
          creator: { select: { id: true, name: true } },
          _count: { select: { steps: true, instances: true } },
        },
        orderBy: { name: "asc" },
      });
    }),

  getDefinition: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.workflowDefinition.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          creator: { select: { id: true, name: true } },
          steps: {
            include: {
              escalationUser: { select: { id: true, name: true } },
              transitionsFrom: {
                include: { toStep: { select: { id: true, code: true, name: true } } },
              },
            },
            orderBy: { sequence: "asc" },
          },
          transitions: true,
        },
      });
    }),

  createDefinition: tenantProcedure
    .input(
      z.object({
        code: z.string().min(1).max(50),
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(["PURCHASE", "PAYMENT", "HR", "PRODUCTION", "SALES", "GENERAL"]),
        triggerType: z.enum(["MANUAL", "AUTOMATIC", "SCHEDULED"]),
        triggerConfig: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.workflowDefinition.create({
        data: {
          ...input,
          triggerConfig: input.triggerConfig as Prisma.InputJsonValue ?? {},
          companyId: ctx.companyId,
          createdBy: ctx.tenant.userId,
        },
      });
    }),

  updateDefinition: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        triggerType: z.enum(["MANUAL", "AUTOMATIC", "SCHEDULED"]).optional(),
        triggerConfig: z.record(z.string(), z.unknown()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, triggerConfig, ...data } = input;
      return ctx.prisma.workflowDefinition.update({
        where: { id },
        data: {
          ...data,
          ...(triggerConfig && { triggerConfig: triggerConfig as Prisma.InputJsonValue }),
        },
      });
    }),

  // ============================================================================
  // ETAPAS DO WORKFLOW
  // ============================================================================

  addStep: tenantProcedure
    .input(
      z.object({
        definitionId: z.string().uuid(),
        code: z.string().min(1).max(50),
        name: z.string().min(1),
        type: z.enum(["START", "APPROVAL", "TASK", "DECISION", "NOTIFICATION", "END"]),
        assigneeType: z.enum(["USER", "ROLE", "DEPARTMENT", "DYNAMIC"]).optional(),
        assigneeId: z.string().uuid().optional(),
        assigneeExpression: z.string().optional(),
        slaHours: z.number().optional(),
        escalationUserId: z.string().uuid().optional(),
        config: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const maxSequence = await ctx.prisma.workflowStep.aggregate({
        where: { definitionId: input.definitionId },
        _max: { sequence: true },
      });

      const { config, ...data } = input;

      return ctx.prisma.workflowStep.create({
        data: {
          ...data,
          config: config as Prisma.InputJsonValue ?? {},
          sequence: (maxSequence._max.sequence || 0) + 1,
        },
      });
    }),

  updateStep: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        assigneeType: z.enum(["USER", "ROLE", "DEPARTMENT", "DYNAMIC"]).optional(),
        assigneeId: z.string().uuid().nullable().optional(),
        assigneeExpression: z.string().optional(),
        slaHours: z.number().nullable().optional(),
        escalationUserId: z.string().uuid().nullable().optional(),
        config: z.record(z.string(), z.unknown()).optional(),
        isRequired: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, config, ...data } = input;
      return ctx.prisma.workflowStep.update({
        where: { id },
        data: {
          ...data,
          ...(config && { config: config as Prisma.InputJsonValue }),
        },
      });
    }),

  deleteStep: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.workflowStep.delete({
        where: { id: input.id },
      });
    }),

  reorderSteps: tenantProcedure
    .input(
      z.object({
        definitionId: z.string().uuid(),
        stepIds: z.array(z.string().uuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates = input.stepIds.map((id, index) =>
        ctx.prisma.workflowStep.update({
          where: { id },
          data: { sequence: index },
        })
      );
      await ctx.prisma.$transaction(updates);
      return { success: true };
    }),

  // ============================================================================
  // TRANSIÇÕES
  // ============================================================================

  addTransition: tenantProcedure
    .input(
      z.object({
        definitionId: z.string().uuid(),
        fromStepId: z.string().uuid(),
        toStepId: z.string().uuid(),
        conditionType: z.enum(["ALWAYS", "APPROVED", "REJECTED", "EXPRESSION"]).optional(),
        condition: z.string().optional(),
        label: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.workflowTransition.create({
        data: input,
      });
    }),

  deleteTransition: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.workflowTransition.delete({
        where: { id: input.id },
      });
    }),

  // ============================================================================
  // INSTÂNCIAS (EXECUÇÕES)
  // ============================================================================

  listInstances: tenantProcedure
    .input(
      z.object({
        definitionId: z.string().uuid().optional(),
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED", "REJECTED"]).optional(),
        entityType: z.string().optional(),
        entityId: z.string().uuid().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.workflowInstance.findMany({
        where: {
          companyId: ctx.companyId,
          ...(input?.definitionId && { definitionId: input.definitionId }),
          ...(input?.status && { status: input.status }),
          ...(input?.entityType && { entityType: input.entityType }),
          ...(input?.entityId && { entityId: input.entityId }),
        },
        include: {
          definition: { select: { id: true, code: true, name: true, category: true } },
          currentStep: { select: { id: true, code: true, name: true, type: true } },
          starter: { select: { id: true, name: true } },
        },
        orderBy: { startedAt: "desc" },
      });
    }),

  getInstance: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.workflowInstance.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          definition: {
            include: {
              steps: { orderBy: { sequence: "asc" } },
            },
          },
          currentStep: true,
          starter: { select: { id: true, name: true, email: true } },
          canceller: { select: { id: true, name: true } },
          stepHistory: {
            include: {
              step: { select: { id: true, code: true, name: true, type: true } },
              assignee: { select: { id: true, name: true } },
              completer: { select: { id: true, name: true } },
            },
            orderBy: { startedAt: "asc" },
          },
        },
      });
    }),

  startWorkflow: tenantProcedure
    .input(
      z.object({
        definitionId: z.string().uuid(),
        entityType: z.string().optional(),
        entityId: z.string().uuid().optional(),
        data: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const definition = await ctx.prisma.workflowDefinition.findFirst({
        where: { id: input.definitionId, companyId: ctx.companyId, isActive: true },
        include: {
          steps: { where: { type: "START" }, orderBy: { sequence: "asc" }, take: 1 },
        },
      });

      if (!definition) throw new TRPCError({ code: "NOT_FOUND", message: "Workflow não encontrado ou inativo" });

      const startStep = definition.steps[0];
      if (!startStep) throw new TRPCError({ code: "BAD_REQUEST", message: "Workflow não possui etapa inicial" });

      const lastInstance = await ctx.prisma.workflowInstance.findFirst({
        where: { companyId: ctx.companyId },
        orderBy: { code: "desc" },
      });

      const nextCode = lastInstance
        ? `WF${String(parseInt(lastInstance.code.replace("WF", "")) + 1).padStart(6, "0")}`
        : "WF000001";

      const instance = await ctx.prisma.workflowInstance.create({
        data: {
          definitionId: input.definitionId,
          companyId: ctx.companyId,
          code: nextCode,
          status: "IN_PROGRESS",
          currentStepId: startStep.id,
          entityType: input.entityType,
          entityId: input.entityId,
          data: input.data as Prisma.InputJsonValue ?? {},
          startedBy: ctx.tenant.userId,
        },
      });

      await ctx.prisma.workflowStepHistory.create({
        data: {
          instanceId: instance.id,
          stepId: startStep.id,
          status: "COMPLETED",
          action: "COMPLETED",
          completedBy: ctx.tenant.userId,
          completedAt: new Date(),
        },
      });

      const nextTransition = await ctx.prisma.workflowTransition.findFirst({
        where: { fromStepId: startStep.id },
        include: { toStep: true },
      });

      if (nextTransition) {
        await ctx.prisma.workflowInstance.update({
          where: { id: instance.id },
          data: { currentStepId: nextTransition.toStepId },
        });

        await ctx.prisma.workflowStepHistory.create({
          data: {
            instanceId: instance.id,
            stepId: nextTransition.toStepId,
            status: "PENDING",
            assignedTo: nextTransition.toStep.assigneeId,
            dueAt: nextTransition.toStep.slaHours
              ? new Date(Date.now() + nextTransition.toStep.slaHours * 60 * 60 * 1000)
              : undefined,
          },
        });
      }

      return instance;
    }),

  executeStep: tenantProcedure
    .input(
      z.object({
        instanceId: z.string().uuid(),
        action: z.enum(["APPROVED", "REJECTED", "COMPLETED", "DELEGATED"]),
        comments: z.string().optional(),
        delegateTo: z.string().uuid().optional(),
        data: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.workflowInstance.findFirst({
        where: { id: input.instanceId, companyId: ctx.companyId },
        include: {
          currentStep: {
            include: {
              transitionsFrom: { include: { toStep: true } },
            },
          },
        },
      });

      if (!instance) throw new TRPCError({ code: "NOT_FOUND", message: "Instância não encontrada" });
      if (!instance.currentStep) throw new TRPCError({ code: "BAD_REQUEST", message: "Workflow sem etapa atual" });
      if (instance.status !== "IN_PROGRESS") throw new TRPCError({ code: "BAD_REQUEST", message: "Workflow não está em andamento" });

      const currentHistory = await ctx.prisma.workflowStepHistory.findFirst({
        where: { instanceId: instance.id, stepId: instance.currentStepId!, status: "PENDING" },
      });

      if (currentHistory) {
        await ctx.prisma.workflowStepHistory.update({
          where: { id: currentHistory.id },
          data: {
            status: "COMPLETED",
            action: input.action,
            completedBy: ctx.tenant.userId,
            completedAt: new Date(),
            comments: input.comments,
            data: input.data as Prisma.InputJsonValue ?? {},
          },
        });
      }

      if (input.action === "DELEGATED" && input.delegateTo) {
        await ctx.prisma.workflowStepHistory.create({
          data: {
            instanceId: instance.id,
            stepId: instance.currentStepId!,
            status: "PENDING",
            assignedTo: input.delegateTo,
          },
        });
        return { success: true, status: "DELEGATED" };
      }

      let nextTransition = instance.currentStep.transitionsFrom.find((t) => {
        if (t.conditionType === "ALWAYS") return true;
        if (t.conditionType === "APPROVED" && input.action === "APPROVED") return true;
        if (t.conditionType === "REJECTED" && input.action === "REJECTED") return true;
        return false;
      });

      if (!nextTransition) {
        nextTransition = instance.currentStep.transitionsFrom[0];
      }

      if (nextTransition) {
        const nextStep = nextTransition.toStep;

        if (nextStep.type === "END") {
          await ctx.prisma.workflowInstance.update({
            where: { id: instance.id },
            data: {
              status: input.action === "REJECTED" ? "REJECTED" : "COMPLETED",
              currentStepId: nextStep.id,
              completedAt: new Date(),
            },
          });

          await ctx.prisma.workflowStepHistory.create({
            data: {
              instanceId: instance.id,
              stepId: nextStep.id,
              status: "COMPLETED",
              action: "COMPLETED",
              completedBy: ctx.tenant.userId,
              completedAt: new Date(),
            },
          });

          return { success: true, status: input.action === "REJECTED" ? "REJECTED" : "COMPLETED" };
        }

        await ctx.prisma.workflowInstance.update({
          where: { id: instance.id },
          data: { currentStepId: nextStep.id },
        });

        await ctx.prisma.workflowStepHistory.create({
          data: {
            instanceId: instance.id,
            stepId: nextStep.id,
            status: "PENDING",
            assignedTo: nextStep.assigneeId,
            dueAt: nextStep.slaHours
              ? new Date(Date.now() + nextStep.slaHours * 60 * 60 * 1000)
              : undefined,
          },
        });

        return { success: true, status: "IN_PROGRESS", nextStep: nextStep.name };
      }

      return { success: true, status: "NO_TRANSITION" };
    }),

  cancelWorkflow: tenantProcedure
    .input(
      z.object({
        instanceId: z.string().uuid(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.workflowInstance.update({
        where: { id: input.instanceId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelledBy: ctx.tenant.userId,
          cancellationReason: input.reason,
        },
      });
    }),

  // ============================================================================
  // MINHAS TAREFAS
  // ============================================================================

  getMyPendingTasks: tenantProcedure.query(async ({ ctx }) => {
    return ctx.prisma.workflowStepHistory.findMany({
      where: {
        assignedTo: ctx.tenant.userId,
        status: "PENDING",
      },
      include: {
        instance: {
          include: {
            definition: { select: { id: true, code: true, name: true, category: true } },
          },
        },
        step: { select: { id: true, code: true, name: true, type: true } },
      },
      orderBy: [{ dueAt: "asc" }, { startedAt: "asc" }],
    });
  }),

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  getDashboard: tenantProcedure.query(async ({ ctx }) => {
    const [definitions, instancesByStatus, myPendingTasks, recentInstances] = await Promise.all([
      ctx.prisma.workflowDefinition.count({
        where: { companyId: ctx.companyId, isActive: true },
      }),
      ctx.prisma.workflowInstance.groupBy({
        by: ["status"],
        where: { companyId: ctx.companyId },
        _count: true,
      }),
      ctx.prisma.workflowStepHistory.count({
        where: { assignedTo: ctx.tenant.userId, status: "PENDING" },
      }),
      ctx.prisma.workflowInstance.findMany({
        where: { companyId: ctx.companyId },
        include: {
          definition: { select: { name: true, category: true } },
          currentStep: { select: { name: true, type: true } },
          starter: { select: { name: true } },
        },
        orderBy: { startedAt: "desc" },
        take: 10,
      }),
    ]);

    const statusCounts = instancesByStatus.reduce(
      (acc, item) => ({ ...acc, [item.status]: item._count }),
      {} as Record<string, number>
    );

    return {
      activeDefinitions: definitions,
      instances: {
        total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
        pending: statusCounts.PENDING || 0,
        inProgress: statusCounts.IN_PROGRESS || 0,
        completed: statusCounts.COMPLETED || 0,
        cancelled: statusCounts.CANCELLED || 0,
        rejected: statusCounts.REJECTED || 0,
      },
      myPendingTasks,
      recentInstances,
    };
  }),

  // ============================================================================
  // BPMN ENGINE - VIO-817
  // ============================================================================

  completeTask: tenantProcedure
    .input(z.object({
      instanceId: z.string().uuid(),
      data: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.workflowInstance.findFirst({
        where: { id: input.instanceId, companyId: ctx.companyId },
        include: {
          currentStep: {
            include: { transitionsFrom: { include: { toStep: true } } },
          },
        },
      });

      if (!instance) throw new TRPCError({ code: "NOT_FOUND", message: "Instância não encontrada" });
      if (!instance.currentStep) throw new TRPCError({ code: "BAD_REQUEST", message: "Workflow sem etapa atual" });
      if (instance.status !== "IN_PROGRESS") throw new TRPCError({ code: "BAD_REQUEST", message: "Workflow não está em andamento" });

      const currentContext = instance.data as Record<string, unknown> || {};
      const newContext = { ...currentContext, ...input.data };

      await ctx.prisma.workflowStepHistory.updateMany({
        where: { instanceId: instance.id, stepId: instance.currentStepId!, status: "PENDING" },
        data: {
          status: "COMPLETED",
          action: "COMPLETED",
          completedBy: ctx.tenant.userId,
          completedAt: new Date(),
          data: input.data as Prisma.InputJsonValue ?? {},
        },
      });

      const nextTransition = instance.currentStep.transitionsFrom.find((t) => 
        t.conditionType === "ALWAYS" || !t.condition
      ) || instance.currentStep.transitionsFrom[0];

      if (nextTransition?.toStep.type === "END") {
        return ctx.prisma.workflowInstance.update({
          where: { id: instance.id },
          data: {
            status: "COMPLETED",
            currentStepId: nextTransition.toStepId,
            data: newContext as Prisma.InputJsonValue,
            completedAt: new Date(),
          },
        });
      }

      if (nextTransition) {
        await ctx.prisma.workflowStepHistory.create({
          data: {
            instanceId: instance.id,
            stepId: nextTransition.toStepId,
            status: "PENDING",
            assignedTo: nextTransition.toStep.assigneeId,
            dueAt: nextTransition.toStep.slaHours
              ? new Date(Date.now() + nextTransition.toStep.slaHours * 60 * 60 * 1000)
              : undefined,
          },
        });

        return ctx.prisma.workflowInstance.update({
          where: { id: instance.id },
          data: {
            currentStepId: nextTransition.toStepId,
            data: newContext as Prisma.InputJsonValue,
          },
        });
      }

      return instance;
    }),

  approveTask: tenantProcedure
    .input(z.object({
      instanceId: z.string().uuid(),
      comments: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.workflowInstance.findFirst({
        where: { id: input.instanceId, companyId: ctx.companyId },
        include: {
          currentStep: {
            include: { transitionsFrom: { include: { toStep: true } } },
          },
        },
      });

      if (!instance) throw new TRPCError({ code: "NOT_FOUND", message: "Instância não encontrada" });
      if (!instance.currentStep) throw new TRPCError({ code: "BAD_REQUEST", message: "Workflow sem etapa atual" });
      if (instance.currentStep.type !== "APPROVAL") throw new TRPCError({ code: "BAD_REQUEST", message: "Etapa atual não é de aprovação" });

      await ctx.prisma.workflowStepHistory.updateMany({
        where: { instanceId: instance.id, stepId: instance.currentStepId!, status: "PENDING" },
        data: {
          status: "COMPLETED",
          action: "APPROVED",
          completedBy: ctx.tenant.userId,
          completedAt: new Date(),
          comments: input.comments,
        },
      });

      const approveTransition = instance.currentStep.transitionsFrom.find((t) => 
        t.label?.toLowerCase().includes("aprov") || t.conditionType === "ALWAYS"
      ) || instance.currentStep.transitionsFrom[0];

      if (approveTransition?.toStep.type === "END") {
        return ctx.prisma.workflowInstance.update({
          where: { id: instance.id },
          data: { status: "COMPLETED", currentStepId: approveTransition.toStepId, completedAt: new Date() },
        });
      }

      if (approveTransition) {
        await ctx.prisma.workflowStepHistory.create({
          data: {
            instanceId: instance.id,
            stepId: approveTransition.toStepId,
            status: "PENDING",
            assignedTo: approveTransition.toStep.assigneeId,
          },
        });

        return ctx.prisma.workflowInstance.update({
          where: { id: instance.id },
          data: { currentStepId: approveTransition.toStepId },
        });
      }

      return instance;
    }),

  rejectTask: tenantProcedure
    .input(z.object({
      instanceId: z.string().uuid(),
      reason: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.workflowInstance.findFirst({
        where: { id: input.instanceId, companyId: ctx.companyId },
        include: { currentStep: true },
      });

      if (!instance) throw new TRPCError({ code: "NOT_FOUND", message: "Instância não encontrada" });
      if (!instance.currentStep) throw new TRPCError({ code: "BAD_REQUEST", message: "Workflow sem etapa atual" });

      await ctx.prisma.workflowStepHistory.updateMany({
        where: { instanceId: instance.id, stepId: instance.currentStepId!, status: "PENDING" },
        data: {
          status: "COMPLETED",
          action: "REJECTED",
          completedBy: ctx.tenant.userId,
          completedAt: new Date(),
          comments: input.reason,
        },
      });

      return ctx.prisma.workflowInstance.update({
        where: { id: instance.id },
        data: { status: "REJECTED", completedAt: new Date() },
      });
    }),

  delegateTask: tenantProcedure
    .input(z.object({
      instanceId: z.string().uuid(),
      toUserId: z.string().uuid(),
      comments: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.workflowInstance.findFirst({
        where: { id: input.instanceId, companyId: ctx.companyId },
        include: { currentStep: true },
      });

      if (!instance) throw new TRPCError({ code: "NOT_FOUND", message: "Instância não encontrada" });
      if (!instance.currentStep) throw new TRPCError({ code: "BAD_REQUEST", message: "Workflow sem etapa atual" });

      await ctx.prisma.workflowStepHistory.updateMany({
        where: { instanceId: instance.id, stepId: instance.currentStepId!, status: "PENDING" },
        data: {
          status: "COMPLETED",
          action: "DELEGATED",
          completedBy: ctx.tenant.userId,
          completedAt: new Date(),
          comments: input.comments,
        },
      });

      await ctx.prisma.workflowStepHistory.create({
        data: {
          instanceId: instance.id,
          stepId: instance.currentStepId!,
          status: "PENDING",
          assignedTo: input.toUserId,
        },
      });

      return instance;
    }),

  saveCanvasLayout: tenantProcedure
    .input(z.object({
      definitionId: z.string().uuid(),
      canvasLayout: z.record(z.string(), z.unknown()),
      nodes: z.array(z.object({
        id: z.string(),
        positionX: z.number(),
        positionY: z.number(),
        width: z.number().optional(),
        height: z.number().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.workflowDefinition.update({
        where: { id: input.definitionId },
        data: { triggerConfig: input.canvasLayout as Prisma.InputJsonValue }, // TODO: Use canvasLayout when Prisma is synced
      });

      for (const node of input.nodes) {
        await ctx.prisma.workflowStep.update({
          where: { id: node.id },
          data: {
            sequence: Math.round(node.positionX), // TODO: Use positionX/Y when Prisma is synced
          },
        });
      }

      return { success: true };
    }),

  // ============================================================================
  // GERAÇÃO DE WORKFLOW COM IA
  // ============================================================================

  generateFromAI: tenantProcedure
    .input(
      z.object({
        prompt: z.string().min(10).max(2000),
        currentWorkflow: z
          .object({
            name: z.string(),
            description: z.string(),
            category: z.enum(["PURCHASE", "PAYMENT", "HR", "PRODUCTION", "SALES", "GENERAL"]),
            steps: z.array(z.any()),
            transitions: z.array(z.any()),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const apiKey = await getOpenAIKey(ctx.prisma, ctx.companyId);

      if (!apiKey) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Token de IA não configurado. Configure em Configurações > IA." });
      }

      try {
        let workflow: GeneratedWorkflow;

        if (input.currentWorkflow) {
          // Refine existing workflow
          workflow = await refineWorkflow(
            input.currentWorkflow as GeneratedWorkflow,
            input.prompt,
            apiKey
          );
        } else {
          // Generate new workflow
          workflow = await generateWorkflowFromPrompt(input.prompt, apiKey);
        }

        return workflow;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Falha ao gerar workflow: ${message}` });
      }
    }),

  getAIPromptSuggestions: tenantProcedure.query(() => {
    return PROMPT_SUGGESTIONS;
  }),
});
