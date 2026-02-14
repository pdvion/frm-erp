import type { PrismaClient, TaskEntityType, TaskPriority } from "@prisma/client";
import type { Prisma } from "@prisma/client";

type AdmissionStatus =
  | "DRAFT"
  | "DOCUMENTS"
  | "EXAM"
  | "APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED";

interface AdmissionContext {
  admissionId: string;
  candidateName: string;
  companyId: string;
  recruiterId: string | null;
  managerId?: string | null;
  userId: string;
}

interface TransitionResult {
  notifications: Array<{ userId: string; title: string; type: string }>;
  tasks: Array<{ title: string; targetUserId?: string | null }>;
}

export class AdmissionNotificationService {
  constructor(private prisma: PrismaClient | Prisma.TransactionClient) {}

  async onStatusChange(
    ctx: AdmissionContext,
    fromStatus: AdmissionStatus | null,
    toStatus: AdmissionStatus
  ): Promise<TransitionResult> {
    const result: TransitionResult = { notifications: [], tasks: [] };

    switch (toStatus) {
      case "DRAFT":
        await this.onProcessCreated(ctx, result);
        break;
      case "DOCUMENTS":
        await this.onDocumentsPhase(ctx, result);
        break;
      case "EXAM":
        await this.onExamPhase(ctx, result);
        break;
      case "APPROVAL":
        await this.onApprovalPhase(ctx, result);
        break;
      case "APPROVED":
        await this.onApproved(ctx, result);
        break;
      case "REJECTED":
        await this.onRejected(ctx, result);
        break;
      case "COMPLETED":
        await this.onCompleted(ctx, result);
        break;
      case "CANCELLED":
        await this.onCancelled(ctx, result);
        break;
    }

    return result;
  }

  async onDocumentUploaded(
    ctx: AdmissionContext,
    documentName: string
  ): Promise<TransitionResult> {
    const result: TransitionResult = { notifications: [], tasks: [] };

    if (ctx.recruiterId) {
      await this.createNotification({
        userId: ctx.recruiterId,
        companyId: ctx.companyId,
        type: "info",
        category: "business",
        title: `Documento enviado: ${documentName}`,
        message: `${ctx.candidateName} enviou o documento "${documentName}" para verificação.`,
        link: `/hr/admission/${ctx.admissionId}`,
      });
      result.notifications.push({
        userId: ctx.recruiterId,
        title: `Documento enviado: ${documentName}`,
        type: "info",
      });

      await this.createTask({
        companyId: ctx.companyId,
        title: `Verificar documento "${documentName}" de ${ctx.candidateName}`,
        description: `O candidato ${ctx.candidateName} enviou o documento "${documentName}". Verifique e aprove ou rejeite.`,
        targetUserId: ctx.recruiterId,
        entityType: "ADMISSION",
        entityId: ctx.admissionId,
        priority: "NORMAL",
        createdById: ctx.userId,
        slaResolveHours: 24,
      });
      result.tasks.push({
        title: `Verificar documento "${documentName}"`,
        targetUserId: ctx.recruiterId,
      });
    }

    return result;
  }

  async onDocumentRejected(
    ctx: AdmissionContext,
    documentName: string,
    reason: string
  ): Promise<TransitionResult> {
    const result: TransitionResult = { notifications: [], tasks: [] };

    if (ctx.recruiterId) {
      await this.createNotification({
        userId: ctx.recruiterId,
        companyId: ctx.companyId,
        type: "warning",
        category: "business",
        title: `Documento rejeitado: ${documentName}`,
        message: `O documento "${documentName}" de ${ctx.candidateName} foi rejeitado. Motivo: ${reason}`,
        link: `/hr/admission/${ctx.admissionId}`,
      });
      result.notifications.push({
        userId: ctx.recruiterId,
        title: `Documento rejeitado: ${documentName}`,
        type: "warning",
      });
    }

    return result;
  }

  async onExamResult(
    ctx: AdmissionContext,
    examResult: "FIT" | "UNFIT" | "FIT_RESTRICTIONS"
  ): Promise<TransitionResult> {
    const result: TransitionResult = { notifications: [], tasks: [] };

    if (examResult === "FIT" || examResult === "FIT_RESTRICTIONS") {
      if (ctx.managerId) {
        await this.createNotification({
          userId: ctx.managerId,
          companyId: ctx.companyId,
          type: "info",
          category: "business",
          title: `Exame admissional: ${ctx.candidateName} — ${examResult === "FIT" ? "Apto" : "Apto com restrições"}`,
          message: `O candidato ${ctx.candidateName} foi considerado ${examResult === "FIT" ? "apto" : "apto com restrições"} no exame admissional. Aguardando sua aprovação.`,
          link: `/hr/admission/${ctx.admissionId}`,
        });
        result.notifications.push({
          userId: ctx.managerId,
          title: `Aprovar admissão de ${ctx.candidateName}`,
          type: "info",
        });

        await this.createTask({
          companyId: ctx.companyId,
          title: `Aprovar admissão de ${ctx.candidateName}`,
          description: `O candidato ${ctx.candidateName} foi aprovado no exame admissional. Revise e aprove ou rejeite a admissão.`,
          targetUserId: ctx.managerId,
          entityType: "ADMISSION",
          entityId: ctx.admissionId,
          priority: "HIGH",
          createdById: ctx.userId,
          slaResolveHours: 48,
        });
        result.tasks.push({
          title: `Aprovar admissão de ${ctx.candidateName}`,
          targetUserId: ctx.managerId,
        });
      }
    } else {
      // UNFIT
      if (ctx.recruiterId) {
        await this.createNotification({
          userId: ctx.recruiterId,
          companyId: ctx.companyId,
          type: "error",
          category: "business",
          title: `Exame admissional: ${ctx.candidateName} — Inapto`,
          message: `O candidato ${ctx.candidateName} foi considerado inapto no exame admissional.`,
          link: `/hr/admission/${ctx.admissionId}`,
        });
        result.notifications.push({
          userId: ctx.recruiterId,
          title: `Tratar resultado inapto de ${ctx.candidateName}`,
          type: "error",
        });

        await this.createTask({
          companyId: ctx.companyId,
          title: `Tratar resultado inapto: ${ctx.candidateName}`,
          description: `O candidato ${ctx.candidateName} foi considerado inapto no exame admissional. Tome as providências necessárias.`,
          targetUserId: ctx.recruiterId,
          entityType: "ADMISSION",
          entityId: ctx.admissionId,
          priority: "HIGH",
          createdById: ctx.userId,
          slaResolveHours: 24,
        });
        result.tasks.push({
          title: `Tratar resultado inapto de ${ctx.candidateName}`,
          targetUserId: ctx.recruiterId,
        });
      }
    }

    return result;
  }

  // --- Private transition handlers ---

  private async onProcessCreated(
    ctx: AdmissionContext,
    result: TransitionResult
  ): Promise<void> {
    if (ctx.recruiterId) {
      await this.createNotification({
        userId: ctx.recruiterId,
        companyId: ctx.companyId,
        type: "info",
        category: "business",
        title: `Nova admissão criada: ${ctx.candidateName}`,
        message: `Processo de admissão para ${ctx.candidateName} foi criado. Acompanhe a coleta de documentos.`,
        link: `/hr/admission/${ctx.admissionId}`,
      });
      result.notifications.push({
        userId: ctx.recruiterId,
        title: `Nova admissão: ${ctx.candidateName}`,
        type: "info",
      });

      await this.createTask({
        companyId: ctx.companyId,
        title: `Acompanhar coleta de documentos: ${ctx.candidateName}`,
        description: `Processo de admissão criado para ${ctx.candidateName}. Acompanhe a coleta de documentos obrigatórios.`,
        targetUserId: ctx.recruiterId,
        entityType: "ADMISSION",
        entityId: ctx.admissionId,
        priority: "NORMAL",
        createdById: ctx.userId,
        slaResolveHours: 72,
      });
      result.tasks.push({
        title: `Acompanhar coleta de documentos: ${ctx.candidateName}`,
        targetUserId: ctx.recruiterId,
      });
    }
  }

  private async onDocumentsPhase(
    ctx: AdmissionContext,
    result: TransitionResult
  ): Promise<void> {
    if (ctx.recruiterId) {
      await this.createNotification({
        userId: ctx.recruiterId,
        companyId: ctx.companyId,
        type: "info",
        category: "business",
        title: `Admissão em fase de documentos: ${ctx.candidateName}`,
        message: `O processo de ${ctx.candidateName} avançou para a fase de coleta de documentos.`,
        link: `/hr/admission/${ctx.admissionId}`,
      });
      result.notifications.push({
        userId: ctx.recruiterId,
        title: `Fase documentos: ${ctx.candidateName}`,
        type: "info",
      });
    }
  }

  private async onExamPhase(
    ctx: AdmissionContext,
    result: TransitionResult
  ): Promise<void> {
    if (ctx.recruiterId) {
      await this.createNotification({
        userId: ctx.recruiterId,
        companyId: ctx.companyId,
        type: "info",
        category: "business",
        title: `Documentos verificados: ${ctx.candidateName}`,
        message: `Todos os documentos de ${ctx.candidateName} foram verificados. Agende o exame admissional.`,
        link: `/hr/admission/${ctx.admissionId}`,
      });
      result.notifications.push({
        userId: ctx.recruiterId,
        title: `Agendar exame: ${ctx.candidateName}`,
        type: "info",
      });

      await this.createTask({
        companyId: ctx.companyId,
        title: `Agendar exame admissional: ${ctx.candidateName}`,
        description: `Todos os documentos de ${ctx.candidateName} foram verificados. Agende o exame admissional.`,
        targetUserId: ctx.recruiterId,
        entityType: "ADMISSION",
        entityId: ctx.admissionId,
        priority: "HIGH",
        createdById: ctx.userId,
        slaResolveHours: 48,
      });
      result.tasks.push({
        title: `Agendar exame admissional: ${ctx.candidateName}`,
        targetUserId: ctx.recruiterId,
      });
    }
  }

  private async onApprovalPhase(
    ctx: AdmissionContext,
    result: TransitionResult
  ): Promise<void> {
    if (ctx.managerId) {
      await this.createNotification({
        userId: ctx.managerId,
        companyId: ctx.companyId,
        type: "info",
        category: "business",
        title: `Aprovação pendente: ${ctx.candidateName}`,
        message: `O processo de admissão de ${ctx.candidateName} aguarda sua aprovação.`,
        link: `/hr/admission/${ctx.admissionId}`,
      });
      result.notifications.push({
        userId: ctx.managerId,
        title: `Aprovação pendente: ${ctx.candidateName}`,
        type: "info",
      });

      await this.createTask({
        companyId: ctx.companyId,
        title: `Aprovar admissão: ${ctx.candidateName}`,
        description: `O processo de admissão de ${ctx.candidateName} aguarda sua aprovação. Revise os dados e aprove ou rejeite.`,
        targetUserId: ctx.managerId,
        entityType: "ADMISSION",
        entityId: ctx.admissionId,
        priority: "HIGH",
        createdById: ctx.userId,
        slaResolveHours: 48,
      });
      result.tasks.push({
        title: `Aprovar admissão: ${ctx.candidateName}`,
        targetUserId: ctx.managerId,
      });
    }
  }

  private async onApproved(
    ctx: AdmissionContext,
    result: TransitionResult
  ): Promise<void> {
    if (ctx.recruiterId) {
      await this.createNotification({
        userId: ctx.recruiterId,
        companyId: ctx.companyId,
        type: "success",
        category: "business",
        title: `Admissão aprovada: ${ctx.candidateName}`,
        message: `A admissão de ${ctx.candidateName} foi aprovada. Providencie a assinatura do contrato.`,
        link: `/hr/admission/${ctx.admissionId}`,
      });
      result.notifications.push({
        userId: ctx.recruiterId,
        title: `Admissão aprovada: ${ctx.candidateName}`,
        type: "success",
      });

      await this.createTask({
        companyId: ctx.companyId,
        title: `Providenciar contrato: ${ctx.candidateName}`,
        description: `A admissão de ${ctx.candidateName} foi aprovada. Providencie a assinatura do contrato de trabalho.`,
        targetUserId: ctx.recruiterId,
        entityType: "ADMISSION",
        entityId: ctx.admissionId,
        priority: "HIGH",
        createdById: ctx.userId,
        slaResolveHours: 48,
      });
      result.tasks.push({
        title: `Providenciar contrato: ${ctx.candidateName}`,
        targetUserId: ctx.recruiterId,
      });
    }
  }

  private async onRejected(
    ctx: AdmissionContext,
    result: TransitionResult
  ): Promise<void> {
    if (ctx.recruiterId) {
      await this.createNotification({
        userId: ctx.recruiterId,
        companyId: ctx.companyId,
        type: "error",
        category: "business",
        title: `Admissão rejeitada: ${ctx.candidateName}`,
        message: `A admissão de ${ctx.candidateName} foi rejeitada pelo gestor.`,
        link: `/hr/admission/${ctx.admissionId}`,
      });
      result.notifications.push({
        userId: ctx.recruiterId,
        title: `Admissão rejeitada: ${ctx.candidateName}`,
        type: "error",
      });
    }
  }

  private async onCompleted(
    ctx: AdmissionContext,
    result: TransitionResult
  ): Promise<void> {
    if (ctx.recruiterId) {
      await this.createNotification({
        userId: ctx.recruiterId,
        companyId: ctx.companyId,
        type: "success",
        category: "business",
        title: `Admissão concluída: ${ctx.candidateName}`,
        message: `O processo de admissão de ${ctx.candidateName} foi concluído. Funcionário cadastrado no sistema.`,
        link: `/hr/admission/${ctx.admissionId}`,
      });
      result.notifications.push({
        userId: ctx.recruiterId,
        title: `Admissão concluída: ${ctx.candidateName}`,
        type: "success",
      });

      await this.createTask({
        companyId: ctx.companyId,
        title: `Criar acessos para ${ctx.candidateName}`,
        description: `A admissão de ${ctx.candidateName} foi concluída. Crie os acessos necessários (email, sistema, crachá).`,
        targetUserId: ctx.recruiterId,
        entityType: "ADMISSION",
        entityId: ctx.admissionId,
        priority: "NORMAL",
        createdById: ctx.userId,
        slaResolveHours: 48,
      });
      result.tasks.push({
        title: `Criar acessos para ${ctx.candidateName}`,
        targetUserId: ctx.recruiterId,
      });
    }
  }

  private async onCancelled(
    ctx: AdmissionContext,
    result: TransitionResult
  ): Promise<void> {
    if (ctx.recruiterId) {
      await this.createNotification({
        userId: ctx.recruiterId,
        companyId: ctx.companyId,
        type: "warning",
        category: "business",
        title: `Admissão cancelada: ${ctx.candidateName}`,
        message: `O processo de admissão de ${ctx.candidateName} foi cancelado.`,
        link: `/hr/admission/${ctx.admissionId}`,
      });
      result.notifications.push({
        userId: ctx.recruiterId,
        title: `Admissão cancelada: ${ctx.candidateName}`,
        type: "warning",
      });
    }
  }

  // --- Helpers ---

  private async createNotification(input: {
    userId: string;
    companyId: string;
    type: string;
    category: string;
    title: string;
    message: string;
    link: string;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        companyId: input.companyId,
        type: input.type,
        category: input.category,
        title: input.title,
        message: input.message,
        link: input.link,
        metadata: {},
      },
    });
  }

  private async createTask(input: {
    companyId: string;
    title: string;
    description: string;
    targetUserId: string;
    entityType: TaskEntityType;
    entityId: string;
    priority: TaskPriority;
    createdById: string;
    slaResolveHours: number;
  }) {
    return this.prisma.task.create({
      data: {
        companyId: input.companyId,
        title: input.title,
        description: input.description,
        targetType: "USER",
        targetUserId: input.targetUserId,
        entityType: input.entityType,
        entityId: input.entityId,
        priority: input.priority,
        status: "PENDING",
        createdById: input.createdById,
        slaResolveHours: input.slaResolveHours,
      },
    });
  }
}
