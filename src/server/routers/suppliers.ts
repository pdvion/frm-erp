import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { auditCreate, auditUpdate, auditDelete } from "../services/audit";

export const suppliersRouter = createTRPCRouter({
  // Listar todos os fornecedores (com filtro de tenant)
  list: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search, status, page = 1, limit = 20 } = input ?? {};
      
      const where = {
        ...tenantFilter(ctx.companyId, false),
        ...(search && {
          OR: [
            { companyName: { contains: search, mode: "insensitive" as const } },
            { tradeName: { contains: search, mode: "insensitive" as const } },
            { cnpj: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(status && { status }),
      };

      const [suppliers, total] = await Promise.all([
        ctx.prisma.supplier.findMany({
          where,
          orderBy: { companyName: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.supplier.count({ where }),
      ]);

      return {
        suppliers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Buscar fornecedor por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      console.log("[suppliers.byId] Debug:", { id: input.id, companyId: ctx.companyId });
      const result = await ctx.prisma.supplier.findFirst({
        where: { 
          id: input.id,
          ...tenantFilter(ctx.companyId, true),
        },
        include: {
          supplierMaterials: {
            include: { material: true },
          },
          quotes: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });
      console.log("[suppliers.byId] Result:", { found: !!result, id: result?.id });
      return result;
    }),

  // Buscar fornecedor por ID ou código (para URLs amigáveis)
  byIdOrCode: tenantProcedure
    .input(z.object({ idOrCode: z.string() }))
    .query(async ({ ctx, input }) => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.idOrCode);
      const isNumeric = /^\d+$/.test(input.idOrCode);
      
      const include = {
        supplierMaterials: { include: { material: true } },
        quotes: { orderBy: { createdAt: "desc" as const }, take: 10 },
      };
      
      if (isUuid) {
        return ctx.prisma.supplier.findFirst({
          where: { id: input.idOrCode, ...tenantFilter(ctx.companyId, false) },
          include,
        });
      }
      
      if (isNumeric) {
        return ctx.prisma.supplier.findFirst({
          where: { code: parseInt(input.idOrCode), ...tenantFilter(ctx.companyId, false) },
          include,
        });
      }
      
      return null;
    }),

  // Criar fornecedor
  create: tenantProcedure
    .input(
      z.object({
        code: z.number(),
        companyName: z.string().min(1),
        tradeName: z.string().optional(),
        cnpj: z.string().optional(),
        cpf: z.string().optional(),
        ie: z.string().optional(),
        im: z.string().optional(),
        address: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        phone: z.string().optional(),
        mobile: z.string().optional(),
        email: z.string().email().optional(),
        website: z.string().optional(),
        contactName: z.string().optional(),
        paymentTerms: z.string().optional(),
        notes: z.string().optional(),
        isShared: z.boolean().default(false),
        // Categorias
        cat01Embalagens: z.boolean().default(false),
        cat02Tintas: z.boolean().default(false),
        cat03OleosGraxas: z.boolean().default(false),
        cat04Dispositivos: z.boolean().default(false),
        cat05Acessorios: z.boolean().default(false),
        cat06Manutencao: z.boolean().default(false),
        cat07Servicos: z.boolean().default(false),
        cat08Escritorio: z.boolean().default(false),
        // Tipo de atividade
        isWholesaler: z.boolean().default(false),
        isRetailer: z.boolean().default(false),
        isIndustry: z.boolean().default(false),
        isService: z.boolean().default(false),
        cnae: z.string().optional(),
        // IQF
        certificationType: z.enum(["UNDEFINED", "ISO_RBS", "INITIAL_EVAL", "STRATEGIC"]).optional(),
        certificationExpiryDate: z.date().optional(),
        certificationFileName: z.string().optional(),
        overallQualityPercent: z.number().optional(),
        iqfPercent: z.number().optional(),
        iqfStatus: z.enum(["NEW", "APPROVED", "REJECTED"]).optional(),
        // Outros
        taxRegime: z.string().optional(),
        hasFinancialContract: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supplier = await ctx.prisma.supplier.create({
        data: {
          ...input,
          companyId: ctx.companyId,
        },
      });

      await auditCreate("Supplier", supplier, String(supplier.code), {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return supplier;
    }),

  // Atualizar fornecedor
  update: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        companyName: z.string().optional(),
        tradeName: z.string().optional(),
        cnpj: z.string().optional(),
        cpf: z.string().optional(),
        ie: z.string().optional(),
        im: z.string().optional(),
        address: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        phone: z.string().optional(),
        mobile: z.string().optional(),
        email: z.string().email().optional(),
        website: z.string().optional(),
        contactName: z.string().optional(),
        paymentTerms: z.string().optional(),
        notes: z.string().optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
        qualityIndex: z.number().optional(),
        isShared: z.boolean().optional(),
        // Categorias
        cat01Embalagens: z.boolean().optional(),
        cat02Tintas: z.boolean().optional(),
        cat03OleosGraxas: z.boolean().optional(),
        cat04Dispositivos: z.boolean().optional(),
        cat05Acessorios: z.boolean().optional(),
        cat06Manutencao: z.boolean().optional(),
        cat07Servicos: z.boolean().optional(),
        cat08Escritorio: z.boolean().optional(),
        // Tipo de atividade
        isWholesaler: z.boolean().optional(),
        isRetailer: z.boolean().optional(),
        isIndustry: z.boolean().optional(),
        isService: z.boolean().optional(),
        cnae: z.string().optional(),
        // IQF
        certificationType: z.enum(["UNDEFINED", "ISO_RBS", "INITIAL_EVAL", "STRATEGIC"]).optional(),
        certificationExpiryDate: z.date().optional(),
        certificationFileName: z.string().optional(),
        overallQualityPercent: z.number().optional(),
        iqfPercent: z.number().optional(),
        iqfStatus: z.enum(["NEW", "APPROVED", "REJECTED"]).optional(),
        // Outros
        taxRegime: z.string().optional(),
        hasFinancialContract: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      // Verificar se o fornecedor pertence ao tenant
      const existing = await ctx.prisma.supplier.findFirst({
        where: { id, ...tenantFilter(ctx.companyId, false) },
      });
      
      if (!existing) {
        throw new Error("Fornecedor não encontrado ou sem permissão");
      }
      
      const supplier = await ctx.prisma.supplier.update({
        where: { id },
        data,
      });

      await auditUpdate("Supplier", id, String(supplier.code), existing, supplier, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return supplier;
    }),

  // Deletar fornecedor
  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se o fornecedor pertence ao tenant
      const existing = await ctx.prisma.supplier.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId, false) },
      });
      
      if (!existing) {
        throw new Error("Fornecedor não encontrado ou sem permissão");
      }
      
      const deleted = await ctx.prisma.supplier.delete({
        where: { id: input.id },
      });

      await auditDelete("Supplier", existing, String(existing.code), {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return deleted;
    }),
});
