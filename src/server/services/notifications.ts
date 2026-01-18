import { prisma } from "@/lib/prisma";

export type NotificationType = "info" | "success" | "warning" | "error";
export type NotificationCategory = "system" | "business" | "error";

interface CreateNotificationInput {
  userId?: string;
  companyId?: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message?: string;
  link?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

interface NotifyUserInput {
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message?: string;
  link?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

interface NotifyCompanyInput {
  companyId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message?: string;
  link?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

interface NotifyErrorInput {
  userId?: string;
  companyId?: string;
  title: string;
  message: string;
  errorCode?: string;
  stack?: string;
}

class NotificationService {
  /**
   * Criar uma notificação genérica
   */
  async create(input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        companyId: input.companyId,
        type: input.type,
        category: input.category,
        title: input.title,
        message: input.message,
        link: input.link,
        metadata: input.metadata || {},
      },
    });
  }

  /**
   * Notificar um usuário específico
   */
  async notifyUser(input: NotifyUserInput) {
    return this.create({
      ...input,
    });
  }

  /**
   * Notificar todos os usuários de uma empresa
   */
  async notifyCompany(input: NotifyCompanyInput) {
    // Buscar todos os usuários ativos da empresa
    const userCompanies = await prisma.userCompany.findMany({
      where: {
        companyId: input.companyId,
        isActive: true,
      },
      select: { userId: true },
    });

    // Criar notificação para cada usuário
    const notifications = await Promise.all(
      userCompanies.map((uc) =>
        this.create({
          ...input,
          userId: uc.userId,
        })
      )
    );

    return notifications;
  }

  /**
   * Notificar sobre um erro crítico
   */
  async notifyError(input: NotifyErrorInput) {
    return this.create({
      userId: input.userId,
      companyId: input.companyId,
      type: "error",
      category: "error",
      title: input.title,
      message: input.message,
      metadata: {
        errorCode: input.errorCode || null,
        stack: input.stack || null,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Broadcast para todos os usuários (notificação global)
   */
  async broadcast(input: Omit<CreateNotificationInput, "userId" | "companyId">) {
    // Criar notificação sem userId/companyId (visível para todos)
    return this.create({
      ...input,
      userId: undefined,
      companyId: undefined,
    });
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Marcar todas as notificações do usuário como lidas
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Obter notificações não lidas do usuário
   */
  async getUnread(userId: string, limit = 10) {
    return prisma.notification.findMany({
      where: {
        OR: [
          { userId },
          { userId: null }, // Notificações globais
        ],
        isRead: false,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Contar notificações não lidas
   */
  async countUnread(userId: string) {
    return prisma.notification.count({
      where: {
        OR: [
          { userId },
          { userId: null },
        ],
        isRead: false,
      },
    });
  }

  /**
   * Obter histórico de notificações
   */
  async getHistory(userId: string, options?: { page?: number; limit?: number; category?: NotificationCategory }) {
    const { page = 1, limit = 20, category } = options || {};

    const where = {
      OR: [
        { userId },
        { userId: null },
      ],
      ...(category && { category }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      pages: Math.ceil(total / limit),
      page,
    };
  }

  /**
   * Excluir notificações antigas (limpeza)
   */
  async cleanup(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    });
  }
}

// Singleton
export const notificationService = new NotificationService();

// Funções de conveniência para eventos comuns
export const notifications = {
  // NFe recebida
  nfeReceived: (userId: string, nfeNumber: string, supplierName: string) =>
    notificationService.notifyUser({
      userId,
      type: "success",
      category: "business",
      title: "Nova NFe Recebida",
      message: `NFe ${nfeNumber} de ${supplierName} foi importada com sucesso.`,
      link: "/receiving",
    }),

  // Estoque baixo
  lowStock: (companyId: string, materialName: string, currentQty: number, minQty: number) =>
    notificationService.notifyCompany({
      companyId,
      type: "warning",
      category: "business",
      title: "Estoque Abaixo do Mínimo",
      message: `${materialName}: ${currentQty} unidades (mínimo: ${minQty})`,
      link: "/inventory",
    }),

  // Título vencendo
  payableDue: (userId: string, supplierName: string, value: number, dueDate: Date) =>
    notificationService.notifyUser({
      userId,
      type: "warning",
      category: "business",
      title: "Título Vencendo",
      message: `${supplierName}: R$ ${value.toFixed(2)} vence em ${dueDate.toLocaleDateString("pt-BR")}`,
      link: "/payables",
    }),

  // Requisição pendente
  requisitionPending: (userId: string, requisitionCode: number, requesterName: string) =>
    notificationService.notifyUser({
      userId,
      type: "info",
      category: "business",
      title: "Requisição Pendente de Aprovação",
      message: `Requisição #${requisitionCode} de ${requesterName} aguarda sua aprovação.`,
      link: "/requisitions",
    }),

  // Erro de sistema
  systemError: (title: string, message: string, errorCode?: string) =>
    notificationService.broadcast({
      type: "error",
      category: "error",
      title,
      message,
      metadata: { errorCode: errorCode || null },
    }),

  // Novo usuário
  newUser: (companyId: string, userName: string) =>
    notificationService.notifyCompany({
      companyId,
      type: "info",
      category: "system",
      title: "Novo Usuário Cadastrado",
      message: `${userName} foi adicionado ao sistema.`,
      link: "/settings/companies",
    }),
};
