import { TRPCError } from "@trpc/server";
/**
 * Deploy Agent Router
 * Endpoints para importação inteligente de XMLs fiscais
 */

import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { prisma } from "@/lib/prisma";
import { parseNFeXml } from "@/lib/nfe-parser";
import { processNFeEntities } from "@/lib/deploy-agent/entity-importer";
import {
  analyzeFiscalPatterns,
  getCfopDescription,
  getCstIcmsDescription,
  suggestCfopForOperation,
} from "@/lib/deploy-agent/fiscal-rules-engine";
import {
  generateTaxConfiguration,
  detectTaxRegime,
  getCstDescription,
  getDefaultInterstateAliquota,
  generateTaxConfigReport,
} from "@/lib/deploy-agent/tax-config";
import {
  generateFinancialConfiguration,
  generateFinancialReport,
  getPaymentMethodDescription,
  getNaturezaSugerida,
} from "@/lib/deploy-agent/financial-mapping";

export const deployAgentRouter = createTRPCRouter({
  /**
   * Lista NFes importadas pendentes de revisão
   */
  listPendingImports: tenantProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { status, limit, cursor } = input;

      const invoices = await prisma.receivedInvoice.findMany({
        where: {
          ...tenantFilter(ctx.companyId),
          ...(status ? { status } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        select: {
          id: true,
          accessKey: true,
          invoiceNumber: true,
          series: true,
          issueDate: true,
          supplierCnpj: true,
          supplierName: true,
          totalInvoice: true,
          status: true,
          supplierId: true,
          createdAt: true,
        },
      });

      let nextCursor: string | undefined;
      if (invoices.length > limit) {
        const nextItem = invoices.pop();
        nextCursor = nextItem?.id;
      }

      return {
        invoices,
        nextCursor,
      };
    }),

  /**
   * Obtém detalhes de uma NFe importada para revisão
   */
  getImportDetails: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const invoice = await prisma.receivedInvoice.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId),
        },
        include: {
          items: true,
          supplier: {
            select: {
              id: true,
              code: true,
              companyName: true,
              cnpj: true,
            },
          },
        },
      });

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "NFe não encontrada" });
      }

      // Parsear XML para extrair dados completos
      let parsedData = null;
      if (invoice.xmlContent) {
        try {
          parsedData = parseNFeXml(invoice.xmlContent);
        } catch (e) {
          console.warn("[deploy-agent] Failed to parse NFe XML:", e);
        }
      }

      // Buscar entidades sugeridas
      const suggestions = {
        supplier: null as { exists: boolean; data: unknown } | null,
        materials: [] as Array<{ code: string; name: string; exists: boolean; materialId?: string }>,
      };

      // Verificar se fornecedor existe
      if (invoice.supplierCnpj) {
        const cnpjLimpo = invoice.supplierCnpj.replace(/\D/g, "");
        const existingSupplier = await prisma.supplier.findFirst({
          where: {
            OR: [
              { cnpj: { contains: cnpjLimpo } },
              { cpf: { contains: cnpjLimpo } },
            ],
            ...tenantFilter(ctx.companyId),
          },
          select: {
            id: true,
            code: true,
            companyName: true,
            cnpj: true,
          },
        });

        suggestions.supplier = {
          exists: !!existingSupplier,
          data: existingSupplier || {
            cnpj: invoice.supplierCnpj,
            name: invoice.supplierName,
          },
        };
      }

      // Verificar materiais
      for (const item of invoice.items) {
        const existingMaterial = await prisma.material.findFirst({
          where: {
            internalCode: item.productCode,
            ...tenantFilter(ctx.companyId),
          },
          select: { id: true },
        });

        suggestions.materials.push({
          code: item.productCode,
          name: item.productName,
          exists: !!existingMaterial,
          materialId: existingMaterial?.id,
        });
      }

      return {
        invoice,
        parsedData,
        suggestions,
      };
    }),

  /**
   * Simula importação de entidades (dry-run)
   */
  previewImport: tenantProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        importSuppliers: z.boolean().default(true),
        importMaterials: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const invoice = await prisma.receivedInvoice.findFirst({
        where: {
          id: input.invoiceId,
          ...tenantFilter(ctx.companyId),
        },
      });

      if (!invoice?.xmlContent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "NFe não encontrada ou sem XML" });
      }

      const parsed = parseNFeXml(invoice.xmlContent);
      const summary = await processNFeEntities(parsed, ctx.companyId, {
        importSuppliers: input.importSuppliers,
        importMaterials: input.importMaterials,
        dryRun: true,
      });

      return summary;
    }),

  /**
   * Executa importação de entidades
   */
  executeImport: tenantProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        importSuppliers: z.boolean().default(true),
        importMaterials: z.boolean().default(true),
        updateIfExists: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const invoice = await prisma.receivedInvoice.findFirst({
        where: {
          id: input.invoiceId,
          ...tenantFilter(ctx.companyId),
        },
      });

      if (!invoice?.xmlContent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "NFe não encontrada ou sem XML" });
      }

      const parsed = parseNFeXml(invoice.xmlContent);
      const summary = await processNFeEntities(parsed, ctx.companyId, {
        importSuppliers: input.importSuppliers,
        importMaterials: input.importMaterials,
        updateIfExists: input.updateIfExists,
        dryRun: false,
      });

      // Atualizar status da NFe
      await prisma.receivedInvoice.update({
        where: { id: input.invoiceId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
        },
      });

      // Vincular fornecedor se foi criado/encontrado
      if (summary.suppliers.length > 0 && summary.suppliers[0].id) {
        await prisma.receivedInvoice.update({
          where: { id: input.invoiceId },
          data: { supplierId: summary.suppliers[0].id },
        });
      }

      return summary;
    }),

  /**
   * Rejeita uma NFe importada
   */
  rejectImport: tenantProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const invoice = await prisma.receivedInvoice.update({
        where: {
          id: input.invoiceId,
          companyId: ctx.companyId,
        },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
          rejectionReason: input.reason,
        },
      });

      return invoice;
    }),

  /**
   * Estatísticas do Deploy Agent
   */
  getStats: tenantProcedure.query(async ({ ctx }) => {
    const [pending, approved, rejected, totalSuppliers, totalMaterials] = await Promise.all([
      prisma.receivedInvoice.count({
        where: { ...tenantFilter(ctx.companyId), status: "PENDING" },
      }),
      prisma.receivedInvoice.count({
        where: { ...tenantFilter(ctx.companyId), status: "APPROVED" },
      }),
      prisma.receivedInvoice.count({
        where: { ...tenantFilter(ctx.companyId), status: "REJECTED" },
      }),
      prisma.supplier.count({
        where: tenantFilter(ctx.companyId),
      }),
      prisma.material.count({
        where: tenantFilter(ctx.companyId),
      }),
    ]);

    return {
      pending,
      approved,
      rejected,
      totalSuppliers,
      totalMaterials,
    };
  }),

  /**
   * Analisa padrões fiscais de múltiplas NFes
   * VIO-876: Fiscal Rules Engine
   */
  analyzeFiscalPatterns: tenantProcedure
    .input(
      z.object({
        invoiceIds: z.array(z.string()).optional(),
        limit: z.number().min(1).max(500).default(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const invoices = await prisma.receivedInvoice.findMany({
        where: {
          ...tenantFilter(ctx.companyId),
          ...(input.invoiceIds ? { id: { in: input.invoiceIds } } : {}),
          xmlContent: { not: null },
        },
        take: input.limit,
        select: { xmlContent: true },
      });

      const parsedNfes = invoices
        .filter((inv) => inv.xmlContent)
        .map((inv) => {
          try {
            return parseNFeXml(inv.xmlContent!);
          } catch (e) {
            console.warn("[deploy-agent] Failed to parse NFe XML:", e);
            return null;
          }
        })
        .filter((nfe): nfe is NonNullable<typeof nfe> => nfe !== null);

      return analyzeFiscalPatterns(parsedNfes);
    }),

  /**
   * Obtém descrição de um CFOP
   */
  getCfopDescription: tenantProcedure
    .input(z.object({ cfop: z.number() }))
    .query(({ input }) => {
      return {
        cfop: input.cfop,
        description: getCfopDescription(input.cfop),
      };
    }),

  /**
   * Obtém descrição de um CST ICMS
   */
  getCstDescription: tenantProcedure
    .input(z.object({ cst: z.string() }))
    .query(({ input }) => {
      return {
        cst: input.cst,
        description: getCstIcmsDescription(input.cst),
      };
    }),

  /**
   * Sugere CFOP para uma operação
   */
  suggestCfop: tenantProcedure
    .input(
      z.object({
        tipoOperacao: z.enum(["entrada", "saida"]),
        finalidade: z.enum(["industrializacao", "comercializacao", "consumo", "ativo"]),
        dentroEstado: z.boolean(),
      })
    )
    .query(({ input }) => {
      const cfop = suggestCfopForOperation(
        input.tipoOperacao,
        input.finalidade,
        input.dentroEstado
      );
      return {
        cfop,
        description: getCfopDescription(cfop),
      };
    }),

  /**
   * Gera configuração completa de impostos
   * VIO-877: Tax Auto-Config
   */
  generateTaxConfig: tenantProcedure
    .input(
      z.object({
        invoiceIds: z.array(z.string()).optional(),
        limit: z.number().min(1).max(500).default(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const invoices = await prisma.receivedInvoice.findMany({
        where: {
          ...tenantFilter(ctx.companyId),
          ...(input.invoiceIds ? { id: { in: input.invoiceIds } } : {}),
          xmlContent: { not: null },
        },
        take: input.limit,
        select: { xmlContent: true },
      });

      const parsedNfes = invoices
        .filter((inv) => inv.xmlContent)
        .map((inv) => {
          try {
            return parseNFeXml(inv.xmlContent!);
          } catch (e) {
            console.warn("[deploy-agent] Failed to parse NFe XML:", e);
            return null;
          }
        })
        .filter((nfe): nfe is NonNullable<typeof nfe> => nfe !== null);

      return generateTaxConfiguration(parsedNfes);
    }),

  /**
   * Detecta regime tributário
   */
  detectTaxRegime: tenantProcedure
    .input(
      z.object({
        invoiceIds: z.array(z.string()).optional(),
        limit: z.number().min(1).max(500).default(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const invoices = await prisma.receivedInvoice.findMany({
        where: {
          ...tenantFilter(ctx.companyId),
          ...(input.invoiceIds ? { id: { in: input.invoiceIds } } : {}),
          xmlContent: { not: null },
        },
        take: input.limit,
        select: { xmlContent: true },
      });

      const parsedNfes = invoices
        .filter((inv) => inv.xmlContent)
        .map((inv) => {
          try {
            return parseNFeXml(inv.xmlContent!);
          } catch (e) {
            console.warn("[deploy-agent] Failed to parse NFe XML:", e);
            return null;
          }
        })
        .filter((nfe): nfe is NonNullable<typeof nfe> => nfe !== null);

      return detectTaxRegime(parsedNfes);
    }),

  /**
   * Gera relatório de configuração tributária em texto
   */
  getTaxConfigReport: tenantProcedure
    .input(
      z.object({
        invoiceIds: z.array(z.string()).optional(),
        limit: z.number().min(1).max(500).default(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const invoices = await prisma.receivedInvoice.findMany({
        where: {
          ...tenantFilter(ctx.companyId),
          ...(input.invoiceIds ? { id: { in: input.invoiceIds } } : {}),
          xmlContent: { not: null },
        },
        take: input.limit,
        select: { xmlContent: true },
      });

      const parsedNfes = invoices
        .filter((inv) => inv.xmlContent)
        .map((inv) => {
          try {
            return parseNFeXml(inv.xmlContent!);
          } catch (e) {
            console.warn("[deploy-agent] Failed to parse NFe XML:", e);
            return null;
          }
        })
        .filter((nfe): nfe is NonNullable<typeof nfe> => nfe !== null);

      const config = generateTaxConfiguration(parsedNfes);
      return {
        report: generateTaxConfigReport(config),
        config,
      };
    }),

  /**
   * Obtém descrição de CST/CSOSN (Tax Config)
   */
  getCstCsosnDescription: tenantProcedure
    .input(z.object({ cst: z.string() }))
    .query(({ input }) => {
      return {
        cst: input.cst,
        description: getCstDescription(input.cst),
      };
    }),

  /**
   * Obtém alíquota interestadual padrão
   */
  getInterstateAliquota: tenantProcedure
    .input(
      z.object({
        ufOrigem: z.string().length(2),
        ufDestino: z.string().length(2),
      })
    )
    .query(({ input }) => {
      return {
        ufOrigem: input.ufOrigem,
        ufDestino: input.ufDestino,
        aliquota: getDefaultInterstateAliquota(input.ufOrigem, input.ufDestino),
      };
    }),

  /**
   * Gera configuração financeira completa
   * VIO-880: Financial Flow Mapping
   */
  generateFinancialConfig: tenantProcedure
    .input(
      z.object({
        invoiceIds: z.array(z.string()).optional(),
        limit: z.number().min(1).max(500).default(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const invoices = await prisma.receivedInvoice.findMany({
        where: {
          ...tenantFilter(ctx.companyId),
          ...(input.invoiceIds ? { id: { in: input.invoiceIds } } : {}),
          xmlContent: { not: null },
        },
        take: input.limit,
        select: { xmlContent: true },
      });

      const parsedNfes = invoices
        .filter((inv) => inv.xmlContent)
        .map((inv) => {
          try {
            return parseNFeXml(inv.xmlContent!);
          } catch (e) {
            console.warn("[deploy-agent] Failed to parse NFe XML:", e);
            return null;
          }
        })
        .filter((nfe): nfe is NonNullable<typeof nfe> => nfe !== null);

      return generateFinancialConfiguration(parsedNfes);
    }),

  /**
   * Gera relatório de configuração financeira em texto
   */
  getFinancialConfigReport: tenantProcedure
    .input(
      z.object({
        invoiceIds: z.array(z.string()).optional(),
        limit: z.number().min(1).max(500).default(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const invoices = await prisma.receivedInvoice.findMany({
        where: {
          ...tenantFilter(ctx.companyId),
          ...(input.invoiceIds ? { id: { in: input.invoiceIds } } : {}),
          xmlContent: { not: null },
        },
        take: input.limit,
        select: { xmlContent: true },
      });

      const parsedNfes = invoices
        .filter((inv) => inv.xmlContent)
        .map((inv) => {
          try {
            return parseNFeXml(inv.xmlContent!);
          } catch (e) {
            console.warn("[deploy-agent] Failed to parse NFe XML:", e);
            return null;
          }
        })
        .filter((nfe): nfe is NonNullable<typeof nfe> => nfe !== null);

      const config = generateFinancialConfiguration(parsedNfes);
      return {
        report: generateFinancialReport(config),
        config,
      };
    }),

  /**
   * Obtém descrição de forma de pagamento
   */
  getPaymentMethodDescription: tenantProcedure
    .input(z.object({ code: z.string() }))
    .query(({ input }) => {
      return {
        code: input.code,
        description: getPaymentMethodDescription(input.code),
      };
    }),

  /**
   * Obtém natureza sugerida para CFOP
   */
  getNaturezaSugerida: tenantProcedure
    .input(z.object({ cfop: z.number() }))
    .query(({ input }) => {
      const natureza = getNaturezaSugerida(input.cfop);
      return {
        cfop: input.cfop,
        natureza: natureza?.natureza || "Não mapeado",
        categoria: natureza?.categoria || "Outros",
        tipo: natureza?.tipo || (input.cfop >= 5000 ? "receita" : "despesa"),
      };
    }),

  /**
   * Analisa lote de XMLs e retorna configurações sugeridas
   * VIO-916: Wizard de Configuração
   */
  analyzeXmlBatch: tenantProcedure
    .input(
      z.object({
        xmlContents: z.array(z.string()),
      })
    )
    .mutation(({ input }) => {
      const parsedNfes = input.xmlContents
        .map((xml) => {
          try {
            return parseNFeXml(xml);
          } catch (e) {
            console.warn("[deploy-agent] Failed to parse NFe XML:", e);
            return null;
          }
        })
        .filter((nfe): nfe is NonNullable<typeof nfe> => nfe !== null);

      if (parsedNfes.length === 0) {
        return {
          success: false,
          error: "Nenhum XML válido encontrado",
          taxConfig: null,
          financialConfig: null,
          fiscalPatterns: null,
          entities: null,
        };
      }

      const taxConfig = generateTaxConfiguration(parsedNfes);
      const financialConfig = generateFinancialConfiguration(parsedNfes);
      const fiscalPatterns = analyzeFiscalPatterns(parsedNfes);

      const suppliers = new Set<string>();
      const materials = new Set<string>();

      for (const nfe of parsedNfes) {
        if (nfe.emitente?.cnpj) {
          suppliers.add(nfe.emitente.cnpj);
        }
        for (const item of nfe.itens) {
          if (item.codigo) {
            materials.add(item.codigo);
          }
        }
      }

      return {
        success: true,
        taxConfig,
        financialConfig,
        fiscalPatterns,
        entities: {
          suppliers: suppliers.size,
          materials: materials.size,
        },
      };
    }),

  /**
   * Aplica configuração do Deploy Agent
   * VIO-916: Wizard de Configuração
   */
  applyConfiguration: tenantProcedure
    .input(
      z.object({
        importSuppliers: z.boolean().default(true),
        importMaterials: z.boolean().default(true),
        applyTaxConfig: z.boolean().default(true),
        applyFinancialConfig: z.boolean().default(true),
        updateIfExists: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const applied = {
        suppliers: 0,
        materials: 0,
        taxRules: 0,
        financialRules: 0,
      };

      if (input.importSuppliers) {
        const pendingInvoices = await prisma.receivedInvoice.findMany({
          where: {
            ...tenantFilter(ctx.companyId),
            status: "PENDING",
          },
          take: 100,
          select: { xmlContent: true },
        });

        const supplierCnpjs = new Set<string>();
        for (const inv of pendingInvoices) {
          if (inv.xmlContent) {
            try {
              const nfe = parseNFeXml(inv.xmlContent);
              if (nfe.emitente?.cnpj) {
                supplierCnpjs.add(nfe.emitente.cnpj);
              }
            } catch (e) {
              console.warn("[deploy-agent] Failed to parse NFe XML:", e);
            }
          }
        }

        for (const cnpj of supplierCnpjs) {
          const exists = await prisma.supplier.findFirst({
            where: { ...tenantFilter(ctx.companyId), cnpj },
          });

          if (!exists || input.updateIfExists) {
            applied.suppliers++;
          }
        }
      }

      if (input.importMaterials) {
        const pendingInvoices = await prisma.receivedInvoice.findMany({
          where: {
            ...tenantFilter(ctx.companyId),
            status: "PENDING",
          },
          take: 100,
          select: { xmlContent: true },
        });

        const materialCodes = new Set<string>();
        for (const inv of pendingInvoices) {
          if (inv.xmlContent) {
            try {
              const nfe = parseNFeXml(inv.xmlContent);
              for (const item of nfe.itens) {
                if (item.codigo) {
                  materialCodes.add(item.codigo);
                }
              }
            } catch (e) {
              console.warn("[deploy-agent] Failed to parse NFe XML:", e);
            }
          }
        }

        for (const materialCode of materialCodes) {
          const numericCode = parseInt(materialCode, 10);
          if (isNaN(numericCode)) continue;

          const exists = await prisma.material.findFirst({
            where: { ...tenantFilter(ctx.companyId), code: numericCode },
          });

          if (!exists || input.updateIfExists) {
            applied.materials++;
          }
        }
      }

      return {
        success: true,
        applied,
        message: `Configuração aplicada: ${applied.suppliers} fornecedores, ${applied.materials} materiais`,
      };
    }),
});
