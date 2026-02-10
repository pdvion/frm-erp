import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter, uploadProcedure } from "../trpc";
import { taskService } from "../services/tasks";
import { syncEntityEmbedding } from "../services/embeddingSync";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

type TaskPriority = "URGENT" | "HIGH" | "NORMAL" | "LOW";
type TaskEntityType = "NFE" | "REQUISITION" | "PURCHASE_ORDER" | "QUOTE" | "PAYABLE" | "RECEIVABLE" | "PRODUCTION_ORDER" | "OTHER";

export const tasksRouter = createTRPCRouter({
  // Listar tarefas
  list: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["PENDING", "ACCEPTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED", "ALL"]).optional(),
        priority: z.enum(["URGENT", "HIGH", "NORMAL", "LOW"]).optional(),
        ownerId: z.string().optional(),
        targetType: z.enum(["user", "department", "group", "permission"]).optional(),
        myTasks: z.boolean().optional(), // Tarefas onde sou proprietário
        availableTasks: z.boolean().optional(), // Tarefas disponíveis para aceitar
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const { search, status, priority, ownerId, targetType, myTasks, availableTasks, page, limit } = input;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {
        ...tenantFilter(ctx.companyId, false),
      };

      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ];
      }

      if (status && status !== "ALL") {
        where.status = status;
      }

      if (priority) {
        where.priority = priority;
      }

      if (ownerId) {
        where.ownerId = ownerId;
      }

      if (targetType) {
        where.targetType = targetType;
      }

      if (myTasks && ctx.tenant.userId) {
        where.ownerId = ctx.tenant.userId;
      }

      if (availableTasks && ctx.tenant.userId) {
        // Buscar grupos do usuário
        const userGroups = await ctx.prisma.userGroupMember.findMany({
          where: { userId: ctx.tenant.userId },
          select: { groupId: true },
        });
        
        const userGroupIds = userGroups.map(g => g.groupId);
        const userPermissions = Array.from(ctx.tenant.permissions.keys());
        
        where.status = "PENDING";
        where.OR = [
          { targetUserId: ctx.tenant.userId },
          // Filtrar por grupos do usuário
          ...(userGroupIds.length > 0 ? [{ targetType: "group", targetGroupId: { in: userGroupIds } }] : []),
          // Filtrar por permissões do usuário
          ...(userPermissions.length > 0 ? [{ targetType: "permission", targetPermission: { in: userPermissions } }] : []),
        ];
      }

      const [tasks, total] = await Promise.all([
        ctx.prisma.task.findMany({
          where,
          include: {
            owner: { select: { id: true, name: true, email: true } },
            targetUser: { select: { id: true, name: true, email: true } },
            targetDepartment: { select: { id: true, name: true } },
            targetGroup: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true } },
            _count: { select: { history: true } },
          },
          orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
          skip,
          take: limit,
        }),
        ctx.prisma.task.count({ where }),
      ]);

      return {
        tasks,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    }),

  // Buscar tarefa por ID
  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const task = await ctx.prisma.task.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId, false),
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          targetUser: { select: { id: true, name: true, email: true } },
          targetDepartment: { select: { id: true, name: true } },
          targetGroup: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          history: {
            include: {
              user: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tarefa não encontrada" });
      }

      // Calcular métricas de SLA
      const slaMetrics = await taskService.calculateSlaMetrics(task.id);

      return { ...task, slaMetrics };
    }),

  // Criar tarefa
  create: tenantProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.enum(["URGENT", "HIGH", "NORMAL", "LOW"]).optional(),
        targetType: z.enum(["user", "department", "group", "permission"]),
        targetUserId: z.string().optional(),
        targetDepartmentId: z.string().optional(),
        targetGroupId: z.string().optional(),
        targetPermission: z.string().optional(),
        deadline: z.date().optional(),
        slaAcceptHours: z.number().optional(),
        slaResolveHours: z.number().optional(),
        entityType: z.enum(["NFE", "REQUISITION", "PURCHASE_ORDER", "QUOTE", "PAYABLE", "RECEIVABLE", "PRODUCTION_ORDER", "OTHER"]).optional(),
        entityId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const task = await taskService.create({
        companyId: ctx.companyId!,
        ...input,
        priority: input.priority as TaskPriority | undefined,
        entityType: input.entityType as TaskEntityType | undefined,
        createdById: ctx.tenant.userId ?? undefined,
      });
      syncEntityEmbedding({ prisma: ctx.prisma, companyId: ctx.companyId! }, "task", task.id, "create");
      return task;
    }),

  // Aceitar tarefa
  accept: tenantProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.tenant.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      }
      return taskService.accept({
        taskId: input.taskId,
        userId: ctx.tenant.userId,
      });
    }),

  // Iniciar tarefa
  start: tenantProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.tenant.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      }
      return taskService.start(input.taskId, ctx.tenant.userId);
    }),

  // Completar tarefa
  complete: tenantProcedure
    .input(
      z.object({
        taskId: z.string(),
        resolution: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.tenant.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      }
      const task = await taskService.complete({
        taskId: input.taskId,
        userId: ctx.tenant.userId,
        resolution: input.resolution,
      });
      syncEntityEmbedding({ prisma: ctx.prisma, companyId: ctx.companyId! }, "task", task.id, "update");
      return task;
    }),

  // Delegar tarefa
  delegate: tenantProcedure
    .input(
      z.object({
        taskId: z.string(),
        toUserId: z.string(),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.tenant.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      }
      return taskService.delegate({
        taskId: input.taskId,
        fromUserId: ctx.tenant.userId,
        toUserId: input.toUserId,
        comment: input.comment,
      });
    }),

  // Cancelar tarefa
  cancel: tenantProcedure
    .input(
      z.object({
        taskId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.tenant.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      }
      return taskService.cancel(input.taskId, ctx.tenant.userId, input.reason);
    }),

  // Adicionar comentário
  addComment: tenantProcedure
    .input(
      z.object({
        taskId: z.string(),
        comment: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.tenant.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      }
      return taskService.addComment(input.taskId, ctx.tenant.userId, input.comment);
    }),

  // Atualizar status da tarefa (para Kanban drag-and-drop)
  updateStatus: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PENDING", "ACCEPTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.tenant.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      }
      
      const task = await ctx.prisma.task.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tarefa não encontrada" });
      }

      return ctx.prisma.task.update({
        where: { id: input.id },
        data: {
          status: input.status,
          updatedAt: new Date(),
        },
      });
    }),

  // Estatísticas
  stats: tenantProcedure.query(async ({ ctx }) => {
    const [byStatus, byPriority, overdue, myPending] = await Promise.all([
      ctx.prisma.task.groupBy({
        by: ["status"],
        where: tenantFilter(ctx.companyId, false),
        _count: true,
      }),
      ctx.prisma.task.groupBy({
        by: ["priority"],
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: { notIn: ["COMPLETED", "CANCELLED"] },
        },
        _count: true,
      }),
      ctx.prisma.task.count({
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: { notIn: ["COMPLETED", "CANCELLED"] },
          deadline: { lt: new Date() },
        },
      }),
      ctx.tenant.userId
        ? ctx.prisma.task.count({
          where: {
            ...tenantFilter(ctx.companyId, false),
            ownerId: ctx.tenant.userId,
            status: { notIn: ["COMPLETED", "CANCELLED"] },
          },
        })
        : 0,
    ]);

    return {
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count })),
      overdue,
      myPending,
    };
  }),

  // Dashboard de tarefas por departamento
  departmentDashboard: tenantProcedure.query(async ({ ctx }) => {
    const departments = await ctx.prisma.department.findMany({
      where: tenantFilter(ctx.companyId, false),
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            tasks: {
              where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
            },
          },
        },
      },
    });

    return departments.map((d) => ({
      id: d.id,
      name: d.name,
      pendingTasks: d._count.tasks,
    }));
  }),

  // Listar anexos de uma tarefa
  listAttachments: tenantProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input, ctx }) => {
      const task = await ctx.prisma.task.findFirst({
        where: {
          id: input.taskId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tarefa não encontrada" });
      }

      return ctx.prisma.taskAttachment.findMany({
        where: { taskId: input.taskId },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Adicionar anexo a uma tarefa
  addAttachment: tenantProcedure
    .input(
      z.object({
        taskId: z.string(),
        fileName: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
        fileUrl: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.tenant.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      }

      const task = await ctx.prisma.task.findFirst({
        where: {
          id: input.taskId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tarefa não encontrada" });
      }

      return ctx.prisma.taskAttachment.create({
        data: {
          taskId: input.taskId,
          fileName: input.fileName,
          fileType: input.fileType,
          fileSize: input.fileSize,
          fileUrl: input.fileUrl,
          description: input.description,
          uploadedBy: ctx.tenant.userId,
        },
      });
    }),

  // Remover anexo de uma tarefa
  removeAttachment: tenantProcedure
    .input(z.object({ attachmentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.tenant.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      }

      const attachment = await ctx.prisma.taskAttachment.findFirst({
        where: { id: input.attachmentId },
        include: {
          task: {
            select: { companyId: true },
          },
        },
      });

      if (!attachment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Anexo não encontrado" });
      }

      // Verificar se pertence à mesma empresa
      if (attachment.task.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Anexo não encontrado" });
      }

      return ctx.prisma.taskAttachment.delete({
        where: { id: input.attachmentId },
      });
    }),

  // Obter URL de upload para Supabase Storage
  getUploadUrl: uploadProcedure
    .input(
      z.object({
        taskId: z.string(),
        fileName: z.string(),
        contentType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.tenant.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
      }

      const task = await ctx.prisma.task.findFirst({
        where: {
          id: input.taskId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tarefa não encontrada" });
      }

      // Gerar path único para o arquivo
      const timestamp = Date.now();
      const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `tasks/${input.taskId}/${timestamp}-${sanitizedFileName}`;

      const supabase = getSupabaseAdmin();

      // Criar URL assinada para upload (bypass RLS)
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUploadUrl(filePath);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao gerar URL de upload: ${error.message}`,
        });
      }

      // Gerar URL pública
      const { data: publicUrlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      return {
        filePath,
        bucket: "documents",
        signedUrl: data.signedUrl,
        token: data.token,
        publicUrl: publicUrlData.publicUrl,
      };
    }),
});
