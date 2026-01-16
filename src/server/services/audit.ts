import { prisma } from "@/lib/prisma";
import { AuditAction, Prisma } from "@prisma/client";

interface AuditContext {
  userId?: string;
  userEmail?: string;
  userName?: string;
  companyId?: string;
  companyName?: string;
  ipAddress?: string;
  userAgent?: string;
  requestPath?: string;
  requestMethod?: string;
}

interface AuditLogParams {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  entityCode?: string;
  description?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  context: AuditContext;
}

function getChangedFields(
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
): string[] {
  if (!oldValues || !newValues) return [];
  
  const changedFields: string[] = [];
  const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
  
  for (const key of allKeys) {
    if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
      changedFields.push(key);
    }
  }
  
  return changedFields;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  const { action, entityType, entityId, entityCode, description, oldValues, newValues, context } = params;
  
  const changedFields = getChangedFields(oldValues, newValues);
  
  try {
    await prisma.auditLog.create({
      data: {
        userId: context.userId,
        userEmail: context.userEmail,
        userName: context.userName,
        companyId: context.companyId,
        companyName: context.companyName,
        action,
        entityType,
        entityId,
        entityCode,
        description,
        oldValues: oldValues as Prisma.InputJsonValue ?? undefined,
        newValues: newValues as Prisma.InputJsonValue ?? undefined,
        changedFields,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        requestPath: context.requestPath,
        requestMethod: context.requestMethod,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export function generateDescription(
  action: AuditAction,
  entityType: string,
  entityCode?: string
): string {
  const actionLabels: Record<AuditAction, string> = {
    CREATE: "criou",
    UPDATE: "atualizou",
    DELETE: "excluiu",
    VIEW: "visualizou",
    LOGIN: "fez login",
    LOGOUT: "fez logout",
    EXPORT: "exportou",
    IMPORT: "importou",
  };

  const entityLabels: Record<string, string> = {
    Material: "material",
    Supplier: "fornecedor",
    Inventory: "estoque",
    InventoryMovement: "movimentação de estoque",
    Category: "categoria",
    Quote: "orçamento",
    User: "usuário",
    Company: "empresa",
  };

  const actionLabel = actionLabels[action] || action.toLowerCase();
  const entityLabel = entityLabels[entityType] || entityType.toLowerCase();
  
  if (entityCode) {
    return `${actionLabel} ${entityLabel} ${entityCode}`;
  }
  
  return `${actionLabel} ${entityLabel}`;
}

export async function auditCreate<T extends Record<string, unknown>>(
  entityType: string,
  entity: T,
  entityCode: string | undefined,
  context: AuditContext
): Promise<void> {
  await createAuditLog({
    action: "CREATE",
    entityType,
    entityId: (entity as { id?: string }).id,
    entityCode,
    description: generateDescription("CREATE", entityType, entityCode),
    newValues: entity,
    context,
  });
}

export async function auditUpdate<T extends Record<string, unknown>>(
  entityType: string,
  entityId: string,
  entityCode: string | undefined,
  oldValues: T,
  newValues: T,
  context: AuditContext
): Promise<void> {
  await createAuditLog({
    action: "UPDATE",
    entityType,
    entityId,
    entityCode,
    description: generateDescription("UPDATE", entityType, entityCode),
    oldValues,
    newValues,
    context,
  });
}

export async function auditDelete<T extends Record<string, unknown>>(
  entityType: string,
  entity: T,
  entityCode: string | undefined,
  context: AuditContext
): Promise<void> {
  await createAuditLog({
    action: "DELETE",
    entityType,
    entityId: (entity as { id?: string }).id,
    entityCode,
    description: generateDescription("DELETE", entityType, entityCode),
    oldValues: entity,
    context,
  });
}

export async function auditView(
  entityType: string,
  entityId: string,
  entityCode: string | undefined,
  context: AuditContext
): Promise<void> {
  await createAuditLog({
    action: "VIEW",
    entityType,
    entityId,
    entityCode,
    description: generateDescription("VIEW", entityType, entityCode),
    context,
  });
}

export async function auditExport(
  entityType: string,
  description: string,
  context: AuditContext
): Promise<void> {
  await createAuditLog({
    action: "EXPORT",
    entityType,
    description,
    context,
  });
}

export async function auditLogin(context: AuditContext): Promise<void> {
  await createAuditLog({
    action: "LOGIN",
    entityType: "User",
    entityId: context.userId,
    description: "fez login no sistema",
    context,
  });
}

export async function auditLogout(context: AuditContext): Promise<void> {
  await createAuditLog({
    action: "LOGOUT",
    entityType: "User",
    entityId: context.userId,
    description: "fez logout do sistema",
    context,
  });
}
