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
const TENANT_MODELS = new Set([
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
  "Lead",
  "Task",
  "Workflow",
  "WorkflowDefinition",
  "GedDocument",
  "Employee",
  "PayrollEntry",
  "TimeClockEntry",
  "WorkSchedule",
  "Budget",
  "CostCenter",
  "FinancialCategory",
  "BankAccount",
  "PaymentRequest",
  "ApprovalLevel",
  "QualityInspection",
  "MaintenanceOrder",
  "ImportProcess",
  "ExchangeContract",
  "Product",
  "ProductCategory",
]);

// Modelos que possuem campo isShared
const SHARED_MODELS = new Set([
  "Material",
  "Supplier",
  "Customer",
  "FinancialCategory",
  "CostCenter",
  "ProductCategory",
]);

/**
 * Cria filtro de tenant para queries
 */
function buildTenantFilter(model: string, companyId: string) {
  const hasShared = SHARED_MODELS.has(model);
  
  if (hasShared) {
    return {
      OR: [
        { companyId },
        { companyId: null },
        { isShared: true },
      ],
    };
  }
  
  return {
    OR: [
      { companyId },
      { companyId: null },
    ],
  };
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
            args.where = { ...args.where, ...filter } as typeof args.where;
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const filter = buildTenantFilter(model, companyId);
            args.where = { ...args.where, ...filter } as typeof args.where;
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
            args.where = { ...args.where, ...filter } as typeof args.where;
          }
          return query(args);
        },
        async aggregate({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const filter = buildTenantFilter(model, companyId);
            args.where = { ...args.where, ...filter } as typeof args.where;
          }
          return query(args);
        },
        async groupBy({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const filter = buildTenantFilter(model, companyId);
            args.where = { ...args.where, ...filter } as typeof args.where;
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
            const filter = buildTenantFilter(model, companyId);
            args.where = { ...args.where, ...filter } as typeof args.where;
          }
          return query(args);
        },
        async updateMany({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const filter = buildTenantFilter(model, companyId);
            args.where = { ...args.where, ...filter } as typeof args.where;
          }
          return query(args);
        },
        async delete({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const filter = buildTenantFilter(model, companyId);
            args.where = { ...args.where, ...filter } as typeof args.where;
          }
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const filter = buildTenantFilter(model, companyId);
            args.where = { ...args.where, ...filter } as typeof args.where;
          }
          return query(args);
        },
        async upsert({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            const filter = buildTenantFilter(model, companyId);
            args.where = { ...args.where, ...filter } as typeof args.where;
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
