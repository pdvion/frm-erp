import { Prisma, PrismaClient, AuditAction } from "@prisma/client";

/**
 * VIO-829: Prisma Extension para Auditoria Imutável (Audit Log 2.0)
 * 
 * Esta extensão captura automaticamente todas as mudanças em entidades
 * críticas, garantindo rastreabilidade total no nível do banco de dados.
 * 
 * Características:
 * - Captura automática de CREATE, UPDATE, DELETE
 * - Armazena valores antigos e novos
 * - Lista campos alterados
 * - Contexto do usuário e requisição
 * - Imutável (logs não podem ser alterados ou excluídos)
 * 
 * Uso:
 * ```ts
 * const auditedPrisma = createAuditedPrisma(prisma, {
 *   userId: ctx.tenant.userId,
 *   companyId: ctx.tenant.companyId,
 *   userEmail: ctx.supabaseUser?.email,
 * });
 * ```
 */

// Modelos que devem ser auditados
const AUDITED_MODELS = new Set([
  "Material",
  "Supplier",
  "Customer",
  "AccountsPayable",
  "AccountsReceivable",
  "PurchaseOrder",
  "SalesOrder",
  "SalesQuote",
  "ProductionOrder",
  "Inventory",
  "InventoryMovement",
  "ReceivedInvoice",
  "IssuedInvoice",
  "Employee",
  "PayrollEntry",
  "BankAccount",
  "Budget",
  "CostCenter",
  "FinancialCategory",
  "ApprovalLevel",
  "User",
  "Company",
  "Product",
  "ProductCategory",
  "GedDocument",
  "Workflow",
  "WorkflowDefinition",
]);

// Campos sensíveis que não devem ser logados
const SENSITIVE_FIELDS = new Set([
  "password",
  "passwordHash",
  "token",
  "apiKey",
  "secret",
  "certificate",
  "privateKey",
]);

export interface AuditContext {
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  ipAddress?: string;
  userAgent?: string;
  requestPath?: string;
  requestMethod?: string;
}

/**
 * Remove campos sensíveis dos valores para auditoria
 */
function sanitizeValues(values: Record<string, unknown> | null | undefined): Record<string, unknown> | undefined {
  if (!values) return undefined;
  
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (SENSITIVE_FIELDS.has(key)) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Calcula os campos que foram alterados
 */
function getChangedFields(
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
): string[] {
  if (!oldValues || !newValues) return [];
  
  const changedFields: string[] = [];
  const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
  
  for (const key of allKeys) {
    if (SENSITIVE_FIELDS.has(key)) continue;
    if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
      changedFields.push(key);
    }
  }
  
  return changedFields;
}

/**
 * Gera descrição legível da ação
 */
function generateDescription(
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

  const actionLabel = actionLabels[action] || action.toLowerCase();
  
  if (entityCode) {
    return `${actionLabel} ${entityType} ${entityCode}`;
  }
  
  return `${actionLabel} ${entityType}`;
}

/**
 * Extrai código identificador da entidade
 */
function getEntityCode(entity: Record<string, unknown>): string | undefined {
  return (entity.code as string) || 
         (entity.number as string) || 
         (entity.name as string) || 
         (entity.email as string) ||
         undefined;
}

/**
 * Cria um cliente Prisma com auditoria automática
 * 
 * @param prisma - Cliente Prisma base
 * @param context - Contexto de auditoria (usuário, empresa, etc.)
 * @returns Cliente Prisma com auditoria aplicada
 */
export function createAuditedPrisma(prisma: PrismaClient, context: AuditContext) {
  return prisma.$extends({
    name: "audit-log",
    query: {
      $allModels: {
        async create({ model, args, query }) {
          const result = await query(args);
          
          if (AUDITED_MODELS.has(model)) {
            const entity = result as Record<string, unknown>;
            const sanitizedNew = sanitizeValues(entity);
            
            // Criar log de auditoria de forma assíncrona (não bloqueia a operação)
            prisma.auditLog.create({
              data: {
                userId: context.userId ?? undefined,
                userEmail: context.userEmail ?? undefined,
                userName: context.userName ?? undefined,
                companyId: context.companyId ?? undefined,
                companyName: context.companyName ?? undefined,
                action: "CREATE",
                entityType: model,
                entityId: entity.id as string,
                entityCode: getEntityCode(entity),
                description: generateDescription("CREATE", model, getEntityCode(entity)),
                newValues: sanitizedNew as Prisma.InputJsonValue,
                changedFields: Object.keys(sanitizedNew || {}),
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
                requestPath: context.requestPath,
                requestMethod: context.requestMethod,
              },
            }).catch((err) => {
              console.error("[Audit] Failed to create audit log:", err);
            });
          }
          
          return result;
        },
        
        async update({ model, args, query }) {
          let oldEntity: Record<string, unknown> | null = null;
          
          // Buscar valores antigos antes da atualização
          if (AUDITED_MODELS.has(model)) {
            try {
              // @ts-expect-error - Acesso dinâmico ao modelo
              oldEntity = await prisma[model.charAt(0).toLowerCase() + model.slice(1)].findUnique({
                where: args.where,
              });
            } catch {
              // Ignorar erro se não conseguir buscar valores antigos
            }
          }
          
          const result = await query(args);
          
          if (AUDITED_MODELS.has(model) && result) {
            const newEntity = result as Record<string, unknown>;
            const sanitizedOld = sanitizeValues(oldEntity);
            const sanitizedNew = sanitizeValues(newEntity);
            const changedFields = getChangedFields(sanitizedOld, sanitizedNew);
            
            // Só criar log se houve mudanças reais
            if (changedFields.length > 0) {
              prisma.auditLog.create({
                data: {
                  userId: context.userId ?? undefined,
                  userEmail: context.userEmail ?? undefined,
                  userName: context.userName ?? undefined,
                  companyId: context.companyId ?? undefined,
                  companyName: context.companyName ?? undefined,
                  action: "UPDATE",
                  entityType: model,
                  entityId: newEntity.id as string,
                  entityCode: getEntityCode(newEntity),
                  description: generateDescription("UPDATE", model, getEntityCode(newEntity)),
                  oldValues: sanitizedOld as Prisma.InputJsonValue,
                  newValues: sanitizedNew as Prisma.InputJsonValue,
                  changedFields,
                  ipAddress: context.ipAddress,
                  userAgent: context.userAgent,
                  requestPath: context.requestPath,
                  requestMethod: context.requestMethod,
                },
              }).catch((err) => {
                console.error("[Audit] Failed to create audit log:", err);
              });
            }
          }
          
          return result;
        },
        
        async delete({ model, args, query }) {
          let oldEntity: Record<string, unknown> | null = null;
          
          // Buscar valores antes da exclusão
          if (AUDITED_MODELS.has(model)) {
            try {
              // @ts-expect-error - Acesso dinâmico ao modelo
              oldEntity = await prisma[model.charAt(0).toLowerCase() + model.slice(1)].findUnique({
                where: args.where,
              });
            } catch {
              // Ignorar erro se não conseguir buscar valores antigos
            }
          }
          
          const result = await query(args);
          
          if (AUDITED_MODELS.has(model) && oldEntity) {
            const sanitizedOld = sanitizeValues(oldEntity);
            
            prisma.auditLog.create({
              data: {
                userId: context.userId ?? undefined,
                userEmail: context.userEmail ?? undefined,
                userName: context.userName ?? undefined,
                companyId: context.companyId ?? undefined,
                companyName: context.companyName ?? undefined,
                action: "DELETE",
                entityType: model,
                entityId: oldEntity.id as string,
                entityCode: getEntityCode(oldEntity),
                description: generateDescription("DELETE", model, getEntityCode(oldEntity)),
                oldValues: sanitizedOld as Prisma.InputJsonValue,
                changedFields: Object.keys(sanitizedOld || {}),
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
                requestPath: context.requestPath,
                requestMethod: context.requestMethod,
              },
            }).catch((err) => {
              console.error("[Audit] Failed to create audit log:", err);
            });
          }
          
          return result;
        },
      },
    },
  });
}

/**
 * Tipo do cliente Prisma com auditoria aplicada
 */
export type AuditedPrismaClient = ReturnType<typeof createAuditedPrisma>;
