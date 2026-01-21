/**
 * Serviço de Integração de Workflows
 * 
 * Este módulo fornece funções utilitárias para integrar workflows
 * com os processos de negócio existentes no sistema.
 * 
 * Uso:
 * - Iniciar workflow automaticamente quando uma entidade é criada/atualizada
 * - Verificar se existe workflow pendente para uma entidade
 * - Atualizar status da entidade quando workflow é concluído
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Tipos de entidade que podem ter workflows
export type WorkflowEntityType = 
  | "PURCHASE_ORDER"
  | "REQUISITION"
  | "PAYABLE"
  | "QUOTE"
  | "PRODUCTION_ORDER"
  | "VACATION_REQUEST"
  | "TIMECLOCK_ADJUSTMENT";

// Categorias de workflow por tipo de entidade
const ENTITY_CATEGORY_MAP: Record<WorkflowEntityType, string> = {
  PURCHASE_ORDER: "PURCHASE",
  REQUISITION: "PURCHASE",
  PAYABLE: "PAYMENT",
  QUOTE: "PURCHASE",
  PRODUCTION_ORDER: "PRODUCTION",
  VACATION_REQUEST: "HR",
  TIMECLOCK_ADJUSTMENT: "HR",
};

interface StartWorkflowOptions {
  companyId: string;
  entityType: WorkflowEntityType;
  entityId: string;
  startedBy: string;
  data?: Record<string, unknown>;
  workflowCode?: string; // Código específico do workflow, se não fornecido usa o padrão da categoria
}

interface WorkflowResult {
  success: boolean;
  instanceId?: string;
  instanceCode?: string;
  error?: string;
}

/**
 * Inicia um workflow para uma entidade
 */
export async function startWorkflowForEntity(options: StartWorkflowOptions): Promise<WorkflowResult> {
  const { companyId, entityType, entityId, startedBy, data, workflowCode } = options;
  const category = ENTITY_CATEGORY_MAP[entityType];

  try {
    // Buscar definição de workflow ativa para a categoria
    const definition = await prisma.workflowDefinition.findFirst({
      where: {
        companyId,
        isActive: true,
        ...(workflowCode 
          ? { code: workflowCode } 
          : { category: category as "PURCHASE" | "PAYMENT" | "HR" | "PRODUCTION" | "SALES" | "GENERAL" }),
      },
      include: {
        steps: { where: { type: "START" }, orderBy: { sequence: "asc" }, take: 1 },
      },
    });

    if (!definition) {
      // Não há workflow configurado - não é erro, apenas não inicia
      return { success: true, error: "NO_WORKFLOW_CONFIGURED" };
    }

    const startStep = definition.steps[0];
    if (!startStep) {
      return { success: false, error: "Workflow não possui etapa inicial" };
    }

    // Verificar se já existe instância ativa para esta entidade
    const existingInstance = await prisma.workflowInstance.findFirst({
      where: {
        companyId,
        entityType,
        entityId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
    });

    if (existingInstance) {
      return { 
        success: true, 
        instanceId: existingInstance.id, 
        instanceCode: existingInstance.code,
        error: "WORKFLOW_ALREADY_EXISTS" 
      };
    }

    // Gerar código da instância
    const lastInstance = await prisma.workflowInstance.findFirst({
      where: { companyId },
      orderBy: { code: "desc" },
    });

    const nextCode = lastInstance
      ? `WF${String(parseInt(lastInstance.code.replace("WF", "")) + 1).padStart(6, "0")}`
      : "WF000001";

    // Criar instância do workflow
    const instance = await prisma.workflowInstance.create({
      data: {
        definitionId: definition.id,
        companyId,
        code: nextCode,
        status: "IN_PROGRESS",
        currentStepId: startStep.id,
        entityType,
        entityId,
        data: (data ?? {}) as Prisma.InputJsonValue,
        startedBy,
      },
    });

    // Registrar histórico da etapa inicial
    await prisma.workflowStepHistory.create({
      data: {
        instanceId: instance.id,
        stepId: startStep.id,
        status: "COMPLETED",
        action: "COMPLETED",
        completedBy: startedBy,
        completedAt: new Date(),
      },
    });

    // Avançar para próxima etapa
    const nextTransition = await prisma.workflowTransition.findFirst({
      where: { fromStepId: startStep.id },
      include: { toStep: true },
    });

    if (nextTransition) {
      await prisma.workflowInstance.update({
        where: { id: instance.id },
        data: { currentStepId: nextTransition.toStepId },
      });

      await prisma.workflowStepHistory.create({
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

    return { success: true, instanceId: instance.id, instanceCode: instance.code };
  } catch (error) {
    console.error("Erro ao iniciar workflow:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Verifica se existe workflow pendente para uma entidade
 */
export async function hasActiveWorkflow(
  companyId: string,
  entityType: WorkflowEntityType,
  entityId: string
): Promise<{ hasWorkflow: boolean; instanceId?: string; status?: string }> {
  const instance = await prisma.workflowInstance.findFirst({
    where: {
      companyId,
      entityType,
      entityId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    select: { id: true, status: true },
  });

  return {
    hasWorkflow: !!instance,
    instanceId: instance?.id,
    status: instance?.status,
  };
}

/**
 * Obtém o status do workflow de uma entidade
 */
export async function getWorkflowStatus(
  companyId: string,
  entityType: WorkflowEntityType,
  entityId: string
): Promise<{
  hasWorkflow: boolean;
  instance?: {
    id: string;
    code: string;
    status: string;
    currentStep?: string;
    startedAt: Date;
  };
}> {
  const instance = await prisma.workflowInstance.findFirst({
    where: { companyId, entityType, entityId },
    include: {
      currentStep: { select: { name: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  if (!instance) {
    return { hasWorkflow: false };
  }

  return {
    hasWorkflow: true,
    instance: {
      id: instance.id,
      code: instance.code,
      status: instance.status,
      currentStep: instance.currentStep?.name,
      startedAt: instance.startedAt,
    },
  };
}

/**
 * Callback para quando um workflow é concluído
 * Atualiza o status da entidade relacionada
 */
export async function onWorkflowCompleted(
  instanceId: string,
  action: "APPROVED" | "REJECTED"
): Promise<void> {
  const instance = await prisma.workflowInstance.findUnique({
    where: { id: instanceId },
    select: { entityType: true, entityId: true, companyId: true },
  });

  if (!instance || !instance.entityType || !instance.entityId) return;

  // Atualizar status da entidade baseado no tipo
  switch (instance.entityType as WorkflowEntityType) {
    case "PURCHASE_ORDER":
      await prisma.purchaseOrder.update({
        where: { id: instance.entityId },
        data: { 
          status: action === "APPROVED" ? "APPROVED" : "CANCELLED" 
        },
      });
      break;

    case "REQUISITION":
      await prisma.materialRequisition.update({
        where: { id: instance.entityId },
        data: { 
          status: action === "APPROVED" ? "APPROVED" : "CANCELLED" 
        },
      });
      break;

    case "PAYABLE":
      // Para contas a pagar, aprovado significa liberado para pagamento
      // O campo approvedAt não existe no modelo, então apenas logamos
      console.log(`Workflow ${action} para conta a pagar ${instance.entityId}`);
      break;

    case "QUOTE":
      await prisma.quote.update({
        where: { id: instance.entityId },
        data: { 
          status: action === "APPROVED" ? "APPROVED" : "REJECTED" 
        },
      });
      break;

    case "TIMECLOCK_ADJUSTMENT":
      await prisma.timeClockAdjustment.update({
        where: { id: instance.entityId },
        data: { 
          status: action === "APPROVED" ? "APPROVED" : "REJECTED",
          reviewedAt: new Date(),
        },
      });
      break;

    default:
      console.warn(`Tipo de entidade não suportado para callback: ${instance.entityType}`);
  }
}

/**
 * Obtém workflows pendentes de aprovação para um usuário
 */
export async function getPendingApprovalsForUser(
  userId: string,
  companyId: string
): Promise<Array<{
  instanceId: string;
  instanceCode: string;
  workflowName: string;
  entityType: string;
  entityId: string;
  stepName: string;
  dueAt?: Date;
  startedAt: Date;
}>> {
  const pendingSteps = await prisma.workflowStepHistory.findMany({
    where: {
      assignedTo: userId,
      status: "PENDING",
      instance: { companyId },
    },
    include: {
      instance: {
        include: {
          definition: { select: { name: true } },
        },
      },
      step: { select: { name: true } },
    },
    orderBy: [{ dueAt: "asc" }, { startedAt: "asc" }],
  });

  return pendingSteps.map((step) => ({
    instanceId: step.instance.id,
    instanceCode: step.instance.code,
    workflowName: step.instance.definition.name,
    entityType: step.instance.entityType || "",
    entityId: step.instance.entityId || "",
    stepName: step.step.name,
    dueAt: step.dueAt ?? undefined,
    startedAt: step.startedAt,
  }));
}

/**
 * Verifica se um valor requer aprovação baseado em alçadas
 * Retorna true se existe um workflow configurado para a categoria
 */
export async function requiresApproval(
  companyId: string,
  entityType: WorkflowEntityType,
  value: number
): Promise<{ required: boolean; workflowCode?: string }> {
  const category = ENTITY_CATEGORY_MAP[entityType];

  // Buscar alçada de aprovação baseada no valor
  const approvalLevel = await prisma.approvalLevel.findFirst({
    where: {
      companyId,
      minValue: { lte: value },
      OR: [
        { maxValue: { gte: value } },
        { maxValue: null },
      ],
      isActive: true,
    },
    orderBy: { minValue: "desc" },
  });

  // Se não há alçada configurada para o valor, não requer aprovação
  if (!approvalLevel) {
    return { required: false };
  }

  // Buscar workflow associado à categoria
  const workflow = await prisma.workflowDefinition.findFirst({
    where: {
      companyId,
      category: category as "PURCHASE" | "PAYMENT" | "HR" | "PRODUCTION" | "SALES" | "GENERAL",
      isActive: true,
    },
    select: { code: true },
  });

  return {
    required: !!workflow,
    workflowCode: workflow?.code,
  };
}
