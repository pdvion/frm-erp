import { prisma } from "@/lib/prisma";
import { notificationService } from "./notifications";

type TaskPriority = "URGENT" | "HIGH" | "NORMAL" | "LOW";
type TaskEntityType = "NFE" | "REQUISITION" | "PURCHASE_ORDER" | "QUOTE" | "PAYABLE" | "RECEIVABLE" | "PRODUCTION_ORDER" | "OTHER";

interface CreateTaskInput {
  companyId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  targetType: "user" | "department" | "group" | "permission";
  targetUserId?: string;
  targetDepartmentId?: string;
  targetGroupId?: string;
  targetPermission?: string;
  deadline?: Date;
  slaAcceptHours?: number;
  slaResolveHours?: number;
  entityType?: TaskEntityType;
  entityId?: string;
  createdById?: string;
}

interface AcceptTaskInput {
  taskId: string;
  userId: string;
}

interface CompleteTaskInput {
  taskId: string;
  userId: string;
  resolution?: string;
}

interface DelegateTaskInput {
  taskId: string;
  fromUserId: string;
  toUserId: string;
  comment?: string;
}

class TaskService {
  /**
   * Criar uma nova tarefa
   */
  async create(input: CreateTaskInput) {
    const task = await prisma.task.create({
      data: {
        companyId: input.companyId,
        title: input.title,
        description: input.description,
        priority: input.priority || "NORMAL",
        status: "PENDING",
        targetType: input.targetType,
        targetUserId: input.targetUserId,
        targetDepartmentId: input.targetDepartmentId,
        targetGroupId: input.targetGroupId,
        targetPermission: input.targetPermission,
        deadline: input.deadline,
        slaAcceptHours: input.slaAcceptHours || 24,
        slaResolveHours: input.slaResolveHours || 72,
        entityType: input.entityType,
        entityId: input.entityId,
        createdById: input.createdById,
      },
    });

    // Registrar no histórico
    await prisma.taskHistory.create({
      data: {
        taskId: task.id,
        userId: input.createdById,
        action: "created",
        newStatus: "PENDING",
        metadata: { targetType: input.targetType },
      },
    });

    // Notificar os destinatários
    await this.notifyTargets(task);

    return task;
  }

  /**
   * Notificar os destinatários da tarefa
   */
  private async notifyTargets(task: {
    id: string;
    title: string;
    targetType: string;
    targetUserId: string | null;
    targetDepartmentId: string | null;
    targetGroupId: string | null;
    targetPermission: string | null;
    companyId: string | null;
  }) {
    const notificationData = {
      type: "warning" as const,
      category: "business" as const,
      title: "Nova tarefa disponível",
      message: task.title,
      link: `/tasks/${task.id}`,
      metadata: { taskId: task.id },
    };

    switch (task.targetType) {
      case "user":
        if (task.targetUserId) {
          await notificationService.notifyUser({
            userId: task.targetUserId,
            ...notificationData,
          });
        }
        break;

      case "department":
        if (task.targetDepartmentId) {
          await this.notifyDepartment(task.targetDepartmentId, notificationData);
        }
        break;

      case "group":
        if (task.targetGroupId) {
          await this.notifyGroup(task.targetGroupId, notificationData);
        }
        break;

      case "permission":
        if (task.targetPermission && task.companyId) {
          await this.notifyByPermission(task.companyId, task.targetPermission, notificationData);
        }
        break;
    }
  }

  /**
   * Notificar todos os funcionários de um departamento
   */
  async notifyDepartment(
    departmentId: string,
    notification: {
      type: "info" | "success" | "warning" | "error";
      category: "system" | "business" | "error";
      title: string;
      message?: string;
      link?: string;
      metadata?: Record<string, string | number | boolean | null>;
    }
  ) {
    // Buscar funcionários do departamento
    const employees = await prisma.employee.findMany({
      where: {
        departmentId,
        status: "ACTIVE",
        userId: { not: null },
      },
      select: { userId: true },
    });

    // Criar notificação para cada funcionário
    const notifications = await Promise.all(
      employees
        .filter((e) => e.userId)
        .map((e) =>
          notificationService.notifyUser({
            userId: e.userId!,
            ...notification,
          })
        )
    );

    return notifications;
  }

  /**
   * Notificar todos os membros de um grupo
   */
  async notifyGroup(
    groupId: string,
    notification: {
      type: "info" | "success" | "warning" | "error";
      category: "system" | "business" | "error";
      title: string;
      message?: string;
      link?: string;
      metadata?: Record<string, string | number | boolean | null>;
    }
  ) {
    // Buscar membros do grupo
    const members = await prisma.notificationGroupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });

    // Criar notificação para cada membro
    const notifications = await Promise.all(
      members.map((m) =>
        notificationService.notifyUser({
          userId: m.userId,
          ...notification,
        })
      )
    );

    return notifications;
  }

  /**
   * Notificar usuários com determinada permissão
   */
  async notifyByPermission(
    companyId: string,
    permission: string,
    notification: {
      type: "info" | "success" | "warning" | "error";
      category: "system" | "business" | "error";
      title: string;
      message?: string;
      link?: string;
      metadata?: Record<string, string | number | boolean | null>;
    }
  ) {
    const [moduleName, permLevel] = permission.split(".") as [string, string];

    // Buscar usuários com a permissão
    const userPermissions = await prisma.userCompanyPermission.findMany({
      where: {
        companyId,
        module: moduleName as never,
        permission: { in: permLevel === "FULL" ? ["FULL"] : ["FULL", "EDIT", "VIEW"] },
      },
      select: { userId: true },
    });

    // Criar notificação para cada usuário
    const notifications = await Promise.all(
      userPermissions.map((up) =>
        notificationService.notifyUser({
          userId: up.userId,
          ...notification,
        })
      )
    );

    return notifications;
  }

  /**
   * Aceitar uma tarefa
   */
  async accept(input: AcceptTaskInput) {
    const task = await prisma.task.findUnique({
      where: { id: input.taskId },
    });

    if (!task) {
      throw new Error("Tarefa não encontrada");
    }

    if (task.status !== "PENDING") {
      throw new Error("Tarefa já foi aceita ou não está disponível");
    }

    // Atualizar tarefa
    const updatedTask = await prisma.task.update({
      where: { id: input.taskId },
      data: {
        status: "ACCEPTED",
        ownerId: input.userId,
        acceptedAt: new Date(),
      },
    });

    // Registrar no histórico
    await prisma.taskHistory.create({
      data: {
        taskId: input.taskId,
        userId: input.userId,
        action: "accepted",
        oldStatus: "PENDING",
        newStatus: "ACCEPTED",
        newOwnerId: input.userId,
      },
    });

    return updatedTask;
  }

  /**
   * Iniciar trabalho em uma tarefa
   */
  async start(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error("Tarefa não encontrada");
    }

    if (task.ownerId !== userId) {
      throw new Error("Apenas o proprietário pode iniciar a tarefa");
    }

    if (task.status !== "ACCEPTED") {
      throw new Error("Tarefa precisa estar aceita para iniciar");
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: "IN_PROGRESS" },
    });

    await prisma.taskHistory.create({
      data: {
        taskId,
        userId,
        action: "started",
        oldStatus: "ACCEPTED",
        newStatus: "IN_PROGRESS",
      },
    });

    return updatedTask;
  }

  /**
   * Completar uma tarefa
   */
  async complete(input: CompleteTaskInput) {
    const task = await prisma.task.findUnique({
      where: { id: input.taskId },
    });

    if (!task) {
      throw new Error("Tarefa não encontrada");
    }

    if (task.ownerId !== input.userId) {
      throw new Error("Apenas o proprietário pode completar a tarefa");
    }

    const updatedTask = await prisma.task.update({
      where: { id: input.taskId },
      data: {
        status: "COMPLETED",
        resolution: input.resolution,
        completedAt: new Date(),
      },
    });

    await prisma.taskHistory.create({
      data: {
        taskId: input.taskId,
        userId: input.userId,
        action: "completed",
        oldStatus: task.status,
        newStatus: "COMPLETED",
        comment: input.resolution,
      },
    });

    return updatedTask;
  }

  /**
   * Delegar tarefa para outro usuário
   */
  async delegate(input: DelegateTaskInput) {
    const task = await prisma.task.findUnique({
      where: { id: input.taskId },
    });

    if (!task) {
      throw new Error("Tarefa não encontrada");
    }

    if (task.ownerId !== input.fromUserId) {
      throw new Error("Apenas o proprietário pode delegar a tarefa");
    }

    const updatedTask = await prisma.task.update({
      where: { id: input.taskId },
      data: { ownerId: input.toUserId },
    });

    await prisma.taskHistory.create({
      data: {
        taskId: input.taskId,
        userId: input.fromUserId,
        action: "delegated",
        oldOwnerId: input.fromUserId,
        newOwnerId: input.toUserId,
        comment: input.comment,
      },
    });

    // Notificar novo proprietário
    await notificationService.notifyUser({
      userId: input.toUserId,
      type: "info",
      category: "business",
      title: "Tarefa delegada para você",
      message: task.title,
      link: `/tasks/${task.id}`,
    });

    return updatedTask;
  }

  /**
   * Cancelar uma tarefa
   */
  async cancel(taskId: string, userId: string, reason?: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error("Tarefa não encontrada");
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: "CANCELLED" },
    });

    await prisma.taskHistory.create({
      data: {
        taskId,
        userId,
        action: "cancelled",
        oldStatus: task.status,
        newStatus: "CANCELLED",
        comment: reason,
      },
    });

    return updatedTask;
  }

  /**
   * Adicionar comentário a uma tarefa
   */
  async addComment(taskId: string, userId: string, comment: string) {
    return prisma.taskHistory.create({
      data: {
        taskId,
        userId,
        action: "comment",
        comment,
      },
    });
  }

  /**
   * Calcular métricas de SLA
   */
  async calculateSlaMetrics(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { history: true },
    });

    if (!task) return null;

    const createdAt = task.createdAt;
    const acceptedAt = task.acceptedAt;
    const completedAt = task.completedAt;

    const timeToAccept = acceptedAt && createdAt
      ? (acceptedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
      : null;

    const timeToComplete = completedAt && acceptedAt
      ? (completedAt.getTime() - acceptedAt.getTime()) / (1000 * 60 * 60)
      : null;

    const slaAcceptMet = timeToAccept !== null && task.slaAcceptHours !== null && timeToAccept <= task.slaAcceptHours;
    const slaResolveMet = timeToComplete !== null && task.slaResolveHours !== null && timeToComplete <= task.slaResolveHours;

    return {
      timeToAcceptHours: timeToAccept,
      timeToCompleteHours: timeToComplete,
      slaAcceptMet,
      slaResolveMet,
      slaAcceptHours: task.slaAcceptHours,
      slaResolveHours: task.slaResolveHours,
    };
  }
}

export const taskService = new TaskService();
