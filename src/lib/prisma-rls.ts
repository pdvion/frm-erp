import { PrismaClient } from "@prisma/client";

/**
 * VIO-827: Prisma Extension para Row-Level Security (RLS)
 * 
 * Esta extensão injeta automaticamente o companyId em todas as queries,
 * garantindo isolamento de dados por tenant na camada de aplicação.
 * 
 * Funciona em conjunto com o RLS do Supabase (não conflita):
 * - Supabase RLS: Proteção no nível do banco de dados
 * - Prisma Extension: Proteção na camada de aplicação
 * 
 * Uso:
 * ```ts
 * const tenantPrisma = createTenantPrisma(prisma, companyId);
 * const materials = await tenantPrisma.material.findMany(); // Já filtrado por companyId
 * ```
 */

// Modelos que possuem campo companyId e devem ser filtrados
// Atualizado VIO-1071: 34 → 75 models (todos os business models com companyId)
// Excluídos intencionalmente: AuditLog, SystemSetting, Notification, NotificationGroup,
// UserCompany, UserCompanyPermission, UserGroup, Holiday, Embedding, AiUsageLog,
// CompanyOnboarding, SefazSyncLog, SefazManifestacaoLog, SefazPendingNfe, SefazSyncConfig,
// DdaSyncLog, Dashboard (system/infra models)
const TENANT_MODELS = new Set([
  // --- Cadastros ---
  "Material",
  "Supplier",
  "Customer",
  "Employee",
  "Product",
  "ProductCategory",
  // --- Financeiro ---
  "AccountsPayable",
  "AccountsReceivable",
  "BankAccount",
  "Budget",
  "BudgetAccount",
  "BudgetActual",
  "BudgetAlert",
  "BudgetVersion",
  "CollectionRule",
  "CostCenter",
  "FinancialCategory",
  "PaymentRequest",
  "ApprovalLevel",
  "ApprovalThreshold",
  "DdaBoleto",
  "DdaConfig",
  // --- Compras ---
  "PurchaseOrder",
  "MaterialRequisition",
  // --- Vendas ---
  "SalesOrder",
  "SalesQuote",
  "Lead",
  // --- Estoque ---
  "Inventory",
  "InventoryMovement",
  "Lot",
  "MaterialReceiving",
  "MaterialStandardCost",
  "PhysicalInventory",
  "PickingList",
  "StockReservation",
  "StockTransfer",
  // --- Produção ---
  "ProductionOrder",
  "ProductionCost",
  "MrpRun",
  "OeeTarget",
  // --- Fiscal ---
  "ReceivedInvoice",
  "IssuedInvoice",
  // --- RH/DP ---
  "PayrollEntry",
  "Payroll",
  "TimeClockEntry",
  "TimeClockAdjustment",
  "WorkSchedule",
  "Vacation",
  "Termination",
  "ThirteenthSalary",
  "TransportVoucher",
  "EmployeeBenefit",
  "EmployeeDependent",
  "EmployeeTraining",
  "HoursBank",
  "LeaveRecord",
  "SkillMatrix",
  "AdmissionProcess",
  // --- Qualidade ---
  "QualityInspection",
  "NonConformity",
  // --- Documentos ---
  "GedDocument",
  "GedCategory",
  "SavedReport",
  // --- Workflow ---
  "Workflow",
  "WorkflowDefinition",
  "WorkflowInstance",
  // --- Comex ---
  "ImportProcess",
  "ExchangeContract",
  // --- GPD ---
  "StrategicGoal",
  "GoalIndicator",
  "ActionPlan",
  "Kpi",
  "KpiValue",
  // --- Manutenção ---
  "MaintenanceOrder",
  // --- Tarefas ---
  "Task",
]);

// Modelos que possuem campo isShared E companyId nullable (realmente compartilháveis)
// Material, Supplier, Customer têm isShared no schema mas companyId NOT NULL,
// então na prática pertencem a uma empresa e usam filtro simples { companyId }
const SHARED_MODELS = new Set([
  "Category",         // finance.prisma: companyId? + isShared
  "ProductCategory",  // catalog.prisma: companyId? + isShared
  "ProductAttribute", // catalog.prisma: companyId? + isShared
  "Product",          // catalog.prisma: companyId? + isShared
  "Port",             // impex.prisma: companyId? + isShared
]);

// Modelos que possuem companyId nullable (String? no schema Prisma)
// Apenas estes podem receber { companyId: null } no filtro OR
const NULLABLE_COMPANY_MODELS = new Set([
  "SystemSetting",
  "AuditLog",
  "Notification",
  "AiUsageLog",
  "Task",
  "Category",       // FinancialCategory
  "Holiday",
  "User",
  "UserGroup",
  "ProductCategory",
  "ProductAttribute",
  "ProductSpecification",
  "Product",
  "Port",
]);

/**
 * Cria filtro de tenant para queries de leitura.
 * Inclui registros da empresa, registros sem dono (null) e compartilhados.
 */
function buildTenantFilter(model: string, companyId: string) {
  const hasShared = SHARED_MODELS.has(model);
  const hasNullableCompany = NULLABLE_COMPANY_MODELS.has(model);
  
  if (hasShared && hasNullableCompany) {
    // Modelo com companyId nullable E isShared: inclui null + shared
    return {
      OR: [
        { companyId },
        { companyId: null },
        { isShared: true },
      ],
    };
  }
  
  if (hasShared) {
    // Modelo com isShared mas companyId NOT NULL: não inclui null
    return {
      OR: [
        { companyId },
        { isShared: true },
      ],
    };
  }
  
  if (hasNullableCompany) {
    // Modelo com companyId nullable sem isShared: inclui null
    return {
      OR: [
        { companyId },
        { companyId: null },
      ],
    };
  }
  
  // Modelo com companyId NOT NULL: filtro simples
  return { companyId };
}

/**
 * Cria filtro de tenant para operações de escrita (update/delete).
 * NÃO inclui companyId:null para evitar mutação de registros de sistema.
 */
function buildTenantWriteFilter(_model: string, companyId: string) {
  return { companyId };
}

/**
 * Compõe o filtro de tenant com o where existente usando AND,
 * preservando condições OR do usuário.
 */
function composeTenantWhere(existingWhere: Record<string, unknown> | undefined, filter: Record<string, unknown>) {
  if (!existingWhere || Object.keys(existingWhere).length === 0) {
    return filter;
  }
  return { AND: [existingWhere, filter] };
}

/**
 * Cria um cliente Prisma com filtro automático de tenant
 * 
 * @param prisma - Cliente Prisma base
 * @param companyId - ID da empresa ativa
 * @returns Cliente Prisma com RLS aplicado
 */
export function createTenantPrisma(prisma: PrismaClient, companyId: string | null) {
  if (!companyId) {
    // Se não há companyId, retorna o prisma original
    // Isso permite que endpoints públicos funcionem normalmente
    return prisma;
  }

  // Guard: se $extends não está disponível (ex: mock em testes), retorna original
  if (typeof prisma.$extends !== "function") {
    return prisma;
  }

  return prisma.$extends({
    name: "tenant-rls",
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const filter = buildTenantFilter(model, companyId);
            args.where = composeTenantWhere(args.where as Record<string, unknown>, filter) as typeof args.where;
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const filter = buildTenantFilter(model, companyId);
            args.where = composeTenantWhere(args.where as Record<string, unknown>, filter) as typeof args.where;
          }
          return query(args);
        },
        async findUnique({ model, args, query }) {
          // findUnique não pode ter OR, então fazemos a verificação após a query
          const result = await query(args);
          if (result && TENANT_MODELS.has(model)) {
            const record = result as { companyId?: string | null; isShared?: boolean };
            if (record.companyId && record.companyId !== companyId && !record.isShared) {
              return null; // Bloqueia acesso a registros de outras empresas
            }
          }
          return result;
        },
        async count({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const filter = buildTenantFilter(model, companyId);
            args.where = composeTenantWhere(args.where as Record<string, unknown>, filter) as typeof args.where;
          }
          return query(args);
        },
        async aggregate({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const filter = buildTenantFilter(model, companyId);
            args.where = composeTenantWhere(args.where as Record<string, unknown>, filter) as typeof args.where;
          }
          return query(args);
        },
        async groupBy({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const filter = buildTenantFilter(model, companyId);
            args.where = composeTenantWhere(args.where as Record<string, unknown>, filter) as typeof args.where;
          }
          return query(args);
        },
        async create({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            // Injeta companyId automaticamente na criação se não fornecido
            const data = args.data as Record<string, unknown>;
            if (!data.companyId) {
              args.data = { ...data, companyId } as typeof args.data;
            }
          }
          return query(args);
        },
        async createMany({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const dataArray = Array.isArray(args.data) ? args.data : [args.data];
            args.data = dataArray.map((item) => {
              const data = item as Record<string, unknown>;
              if (!data.companyId) {
                return { ...data, companyId };
              }
              return data;
            }) as typeof args.data;
          }
          return query(args);
        },
        async update({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const filter = buildTenantWriteFilter(model, companyId);
            args.where = composeTenantWhere(args.where as Record<string, unknown>, filter) as typeof args.where;
          }
          return query(args);
        },
        async updateMany({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const filter = buildTenantWriteFilter(model, companyId);
            args.where = composeTenantWhere(args.where as Record<string, unknown>, filter) as typeof args.where;
          }
          return query(args);
        },
        async delete({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const filter = buildTenantWriteFilter(model, companyId);
            args.where = composeTenantWhere(args.where as Record<string, unknown>, filter) as typeof args.where;
          }
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const filter = buildTenantWriteFilter(model, companyId);
            args.where = composeTenantWhere(args.where as Record<string, unknown>, filter) as typeof args.where;
          }
          return query(args);
        },
        async upsert({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const filter = buildTenantWriteFilter(model, companyId);
            args.where = composeTenantWhere(args.where as Record<string, unknown>, filter) as typeof args.where;
            // Injeta companyId na criação
            const createData = args.create as Record<string, unknown>;
            if (!createData.companyId) {
              args.create = { ...createData, companyId } as typeof args.create;
            }
          }
          return query(args);
        },
      },
    },
  });
}

/**
 * Tipo do cliente Prisma com RLS aplicado
 */
export type TenantPrismaClient = ReturnType<typeof createTenantPrisma>;
