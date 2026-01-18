import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { parseNFeXml, validateNFeXml, type NFeParsed } from "@/lib/nfe-parser";
import { tenantFilter } from "../trpc";

export const nfeRouter = createTRPCRouter({
  // Importar XML de NFe
  import: tenantProcedure
    .input(z.object({
      xmlContent: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validar XML
      const validation = validateNFeXml(input.xmlContent);
      if (!validation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validation.error || "XML inválido",
        });
      }

      // Parsear XML
      let parsed: NFeParsed;
      try {
        parsed = parseNFeXml(input.xmlContent);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Erro ao processar XML",
        });
      }

      // Verificar se já existe
      const existing = await prisma.receivedInvoice.findUnique({
        where: { accessKey: parsed.chaveAcesso },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `NFe já importada (Nota ${existing.invoiceNumber})`,
        });
      }

      // Buscar fornecedor pelo CNPJ
      const cnpjLimpo = parsed.emitente.cnpj.replace(/\D/g, "");
      const supplier = await prisma.supplier.findFirst({
        where: {
          cnpj: {
            contains: cnpjLimpo,
          },
        },
      });

      // Criar NFe e itens
      const invoice = await prisma.receivedInvoice.create({
        data: {
          accessKey: parsed.chaveAcesso,
          invoiceNumber: parsed.numero,
          series: parsed.serie,
          issueDate: parsed.dataEmissao,
          supplierId: supplier?.id,
          supplierCnpj: parsed.emitente.cnpj,
          supplierName: parsed.emitente.razaoSocial,
          totalProducts: parsed.totais.valorProdutos,
          totalInvoice: parsed.totais.valorNota,
          freightValue: parsed.totais.valorFrete,
          discountValue: parsed.totais.valorDesconto,
          icmsBase: parsed.totais.baseCalculoIcms,
          icmsValue: parsed.totais.valorIcms,
          ipiValue: parsed.totais.valorIpi,
          pisValue: parsed.totais.valorPis,
          cofinsValue: parsed.totais.valorCofins,
          xmlContent: input.xmlContent,
          companyId: ctx.companyId,
          items: {
            create: parsed.itens.map((item) => ({
              itemNumber: item.numero,
              productCode: item.codigo,
              productName: item.descricao,
              ncm: item.ncm,
              cfop: item.cfop,
              quantity: item.quantidade,
              unit: item.unidade,
              unitPrice: item.valorUnitario,
              totalPrice: item.valorTotal,
              icmsRate: item.icms.aliquota,
              icmsValue: item.icms.valor,
              ipiRate: item.ipi.aliquota,
              ipiValue: item.ipi.valor,
            })),
          },
        },
        include: {
          items: true,
          supplier: true,
        },
      });

      return {
        invoice,
        parsed,
        supplierFound: !!supplier,
        itemsCount: parsed.itens.length,
      };
    }),

  // Importar múltiplos XMLs
  importBatch: tenantProcedure
    .input(z.object({
      xmlContents: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      const results: Array<{
        success: boolean;
        invoiceNumber?: number;
        accessKey?: string;
        error?: string;
      }> = [];

      for (const xmlContent of input.xmlContents) {
        try {
          const validation = validateNFeXml(xmlContent);
          if (!validation.valid) {
            results.push({ success: false, error: validation.error });
            continue;
          }

          const parsed = parseNFeXml(xmlContent);

          // Verificar duplicata
          const existing = await prisma.receivedInvoice.findUnique({
            where: { accessKey: parsed.chaveAcesso },
          });

          if (existing) {
            results.push({
              success: false,
              invoiceNumber: parsed.numero,
              accessKey: parsed.chaveAcesso,
              error: "NFe já importada",
            });
            continue;
          }

          // Buscar fornecedor
          const cnpjLimpo = parsed.emitente.cnpj.replace(/\D/g, "");
          const supplier = await prisma.supplier.findFirst({
            where: { cnpj: { contains: cnpjLimpo } },
          });

          // Criar NFe
          await prisma.receivedInvoice.create({
            data: {
              accessKey: parsed.chaveAcesso,
              invoiceNumber: parsed.numero,
              series: parsed.serie,
              issueDate: parsed.dataEmissao,
              supplierId: supplier?.id,
              supplierCnpj: parsed.emitente.cnpj,
              supplierName: parsed.emitente.razaoSocial,
              totalProducts: parsed.totais.valorProdutos,
              totalInvoice: parsed.totais.valorNota,
              freightValue: parsed.totais.valorFrete,
              discountValue: parsed.totais.valorDesconto,
              icmsBase: parsed.totais.baseCalculoIcms,
              icmsValue: parsed.totais.valorIcms,
              ipiValue: parsed.totais.valorIpi,
              pisValue: parsed.totais.valorPis,
              cofinsValue: parsed.totais.valorCofins,
              xmlContent: xmlContent,
              companyId: ctx.companyId,
              items: {
                create: parsed.itens.map((item) => ({
                  itemNumber: item.numero,
                  productCode: item.codigo,
                  productName: item.descricao,
                  ncm: item.ncm,
                  cfop: item.cfop,
                  quantity: item.quantidade,
                  unit: item.unidade,
                  unitPrice: item.valorUnitario,
                  totalPrice: item.valorTotal,
                  icmsRate: item.icms.aliquota,
                  icmsValue: item.icms.valor,
                  ipiRate: item.ipi.aliquota,
                  ipiValue: item.ipi.valor,
                })),
              },
            },
          });

          results.push({
            success: true,
            invoiceNumber: parsed.numero,
            accessKey: parsed.chaveAcesso,
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : "Erro desconhecido",
          });
        }
      }

      return {
        total: input.xmlContents.length,
        success: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };
    }),

  // Listar NFes recebidas
  list: tenantProcedure
    .input(z.object({
      status: z.enum(["PENDING", "VALIDATED", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
      supplierId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const where = {
        ...tenantFilter(ctx.companyId),
        ...(input.status && { status: input.status }),
        ...(input.supplierId && { supplierId: input.supplierId }),
        ...(input.startDate && { issueDate: { gte: input.startDate } }),
        ...(input.endDate && { issueDate: { lte: input.endDate } }),
        ...(input.search && {
          OR: [
            { invoiceNumber: { equals: parseInt(input.search) || 0 } },
            { supplierName: { contains: input.search, mode: "insensitive" as const } },
            { accessKey: { contains: input.search } },
          ],
        }),
      };

      const [invoices, total] = await Promise.all([
        prisma.receivedInvoice.findMany({
          where,
          include: {
            supplier: {
              select: { id: true, companyName: true, tradeName: true },
            },
            _count: { select: { items: true } },
          },
          orderBy: { issueDate: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        prisma.receivedInvoice.count({ where }),
      ]);

      return {
        invoices,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  // Buscar NFe por ID
  getById: tenantProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const invoice = await prisma.receivedInvoice.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId),
        },
        include: {
          supplier: true,
          purchaseOrder: {
            include: {
              items: {
                include: { material: true },
              },
            },
          },
          items: {
            include: {
              material: true,
              purchaseOrderItem: true,
            },
            orderBy: { itemNumber: "asc" },
          },
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "NFe não encontrada",
        });
      }

      return invoice;
    }),

  // Vincular item da NFe a um material
  linkItemToMaterial: tenantProcedure
    .input(z.object({
      itemId: z.string(),
      materialId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const item = await prisma.receivedInvoiceItem.update({
        where: { id: input.itemId },
        data: {
          materialId: input.materialId,
          matchStatus: "MATCHED",
        },
        include: { material: true },
      });

      return item;
    }),

  // Vincular NFe a um pedido de compra
  linkToPurchaseOrder: tenantProcedure
    .input(z.object({
      invoiceId: z.string(),
      purchaseOrderId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const invoice = await prisma.receivedInvoice.update({
        where: { id: input.invoiceId },
        data: { purchaseOrderId: input.purchaseOrderId },
        include: { purchaseOrder: true },
      });

      return invoice;
    }),

  // Aprovar NFe (entrada no estoque)
  approve: tenantProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const invoice = await prisma.receivedInvoice.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId),
        },
        include: { items: true },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "NFe não encontrada",
        });
      }

      if (invoice.status === "APPROVED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "NFe já aprovada",
        });
      }

      // Verificar se todos os itens estão vinculados
      const unlinkedItems = invoice.items.filter((item) => !item.materialId);
      if (unlinkedItems.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${unlinkedItems.length} item(ns) não vinculado(s) a materiais`,
        });
      }

      // Atualizar status
      const updated = await prisma.receivedInvoice.update({
        where: { id: input.id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedBy: ctx.tenant.userId,
        },
      });

      return updated;
    }),

  // Rejeitar NFe
  reject: tenantProcedure
    .input(z.object({
      id: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const invoice = await prisma.receivedInvoice.update({
        where: { id: input.id },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
          rejectedBy: ctx.tenant.userId,
          rejectionReason: input.reason,
        },
      });

      return invoice;
    }),

  // Buscar fornecedor por CNPJ e criar se não existir
  findOrCreateSupplier: tenantProcedure
    .input(z.object({
      invoiceId: z.string(),
      createIfNotFound: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const invoice = await prisma.receivedInvoice.findFirst({
        where: {
          id: input.invoiceId,
          ...tenantFilter(ctx.companyId),
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "NFe não encontrada",
        });
      }

      // Buscar fornecedor pelo CNPJ
      const cnpjLimpo = invoice.supplierCnpj.replace(/\D/g, "");
      let supplier = await prisma.supplier.findFirst({
        where: {
          cnpj: { contains: cnpjLimpo },
        },
      });

      if (!supplier && input.createIfNotFound) {
        // Obter próximo código
        const lastSupplier = await prisma.supplier.findFirst({
          orderBy: { code: "desc" },
        });
        const nextCode = (lastSupplier?.code || 0) + 1;

        // Criar fornecedor
        supplier = await prisma.supplier.create({
          data: {
            code: nextCode,
            companyName: invoice.supplierName,
            cnpj: invoice.supplierCnpj,
            companyId: ctx.companyId,
          },
        });
      }

      if (supplier) {
        // Vincular à NFe
        await prisma.receivedInvoice.update({
          where: { id: input.invoiceId },
          data: { supplierId: supplier.id },
        });
      }

      return {
        found: !!supplier,
        supplier,
        created: input.createIfNotFound && !!supplier,
      };
    }),

  // Buscar materiais para vincular aos itens da NFe
  suggestMaterials: tenantProcedure
    .input(z.object({
      itemId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const item = await prisma.receivedInvoiceItem.findUnique({
        where: { id: input.itemId },
        include: {
          invoice: true,
        },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item não encontrado",
        });
      }

      // Buscar por código do fornecedor (SupplierMaterial)
      const bySupplierCode = item.invoice.supplierId
        ? await prisma.supplierMaterial.findMany({
            where: {
              supplierId: item.invoice.supplierId,
              supplierCode: item.productCode,
            },
            include: { material: true },
            take: 5,
          })
        : [];

      // Buscar por descrição similar
      const searchTerms = item.productName
        .split(/\s+/)
        .filter((t) => t.length > 3)
        .slice(0, 3);

      const byDescription = await prisma.material.findMany({
        where: {
          ...tenantFilter(ctx.companyId),
          OR: searchTerms.map((term) => ({
            description: { contains: term, mode: "insensitive" as const },
          })),
        },
        take: 10,
      });

      // Buscar por NCM
      const byNcm = item.ncm
        ? await prisma.material.findMany({
            where: {
              ...tenantFilter(ctx.companyId),
              ncm: item.ncm,
            },
            take: 5,
          })
        : [];

      // Combinar e remover duplicatas
      const allMaterials = [
        ...bySupplierCode.map((sm) => ({ ...sm.material, matchType: "supplier_code" as const })),
        ...byNcm.map((m) => ({ ...m, matchType: "ncm" as const })),
        ...byDescription.map((m) => ({ ...m, matchType: "description" as const })),
      ];

      const uniqueMaterials = allMaterials.filter(
        (m, i, arr) => arr.findIndex((x) => x.id === m.id) === i
      );

      return {
        item,
        suggestions: uniqueMaterials,
        hasExactMatch: bySupplierCode.length > 0,
      };
    }),

  // Vincular item e salvar vínculo para futuras importações
  linkItemAndSave: tenantProcedure
    .input(z.object({
      itemId: z.string(),
      materialId: z.string(),
      saveForFuture: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const item = await prisma.receivedInvoiceItem.findUnique({
        where: { id: input.itemId },
        include: { invoice: true },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item não encontrado",
        });
      }

      // Atualizar item
      const updatedItem = await prisma.receivedInvoiceItem.update({
        where: { id: input.itemId },
        data: {
          materialId: input.materialId,
          matchStatus: "MATCHED",
        },
        include: { material: true },
      });

      // Salvar vínculo para futuras importações
      if (input.saveForFuture && item.invoice.supplierId) {
        // Verificar se já existe
        const existing = await prisma.supplierMaterial.findFirst({
          where: {
            supplierId: item.invoice.supplierId,
            materialId: input.materialId,
          },
        });

        if (!existing) {
          await prisma.supplierMaterial.create({
            data: {
              supplierId: item.invoice.supplierId,
              materialId: input.materialId,
              supplierCode: item.productCode,
              lastPrice: item.unitPrice,
              lastPriceDate: new Date(),
            },
          });
        } else {
          // Atualizar código e preço
          await prisma.supplierMaterial.update({
            where: { id: existing.id },
            data: {
              supplierCode: item.productCode,
              lastPrice: item.unitPrice,
              lastPriceDate: new Date(),
            },
          });
        }
      }

      return updatedItem;
    }),

  // Auto-vincular todos os itens possíveis
  autoLinkItems: tenantProcedure
    .input(z.object({
      invoiceId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const invoice = await prisma.receivedInvoice.findFirst({
        where: {
          id: input.invoiceId,
          ...tenantFilter(ctx.companyId),
        },
        include: {
          items: {
            where: { matchStatus: "PENDING" },
          },
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "NFe não encontrada",
        });
      }

      let linked = 0;
      let notFound = 0;

      for (const item of invoice.items) {
        // Buscar por código do fornecedor
        if (invoice.supplierId) {
          const supplierMaterial = await prisma.supplierMaterial.findFirst({
            where: {
              supplierId: invoice.supplierId,
              supplierCode: item.productCode,
            },
          });

          if (supplierMaterial) {
            await prisma.receivedInvoiceItem.update({
              where: { id: item.id },
              data: {
                materialId: supplierMaterial.materialId,
                matchStatus: "MATCHED",
              },
            });
            linked++;
            continue;
          }
        }

        // Marcar como não encontrado
        await prisma.receivedInvoiceItem.update({
          where: { id: item.id },
          data: { matchStatus: "NOT_FOUND" },
        });
        notFound++;
      }

      return {
        total: invoice.items.length,
        linked,
        notFound,
      };
    }),

  // Criar material a partir do item da NFe
  createMaterialFromItem: tenantProcedure
    .input(z.object({
      itemId: z.string(),
      categoryId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const item = await prisma.receivedInvoiceItem.findUnique({
        where: { id: input.itemId },
        include: { invoice: true },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item não encontrado",
        });
      }

      // Obter próximo código
      const lastMaterial = await prisma.material.findFirst({
        orderBy: { code: "desc" },
      });
      const nextCode = (lastMaterial?.code || 0) + 1;

      // Criar material
      const material = await prisma.material.create({
        data: {
          code: nextCode,
          description: item.productName,
          unit: item.unit,
          ncm: item.ncm,
          categoryId: input.categoryId,
          companyId: ctx.companyId,
        },
      });

      // Vincular item ao material
      await prisma.receivedInvoiceItem.update({
        where: { id: input.itemId },
        data: {
          materialId: material.id,
          matchStatus: "MATCHED",
        },
      });

      // Criar vínculo fornecedor-material
      if (item.invoice.supplierId) {
        await prisma.supplierMaterial.create({
          data: {
            supplierId: item.invoice.supplierId,
            materialId: material.id,
            supplierCode: item.productCode,
            lastPrice: item.unitPrice,
            lastPriceDate: new Date(),
          },
        });
      }

      return material;
    }),

  // Comparar NFe com Pedido de Compra
  compareWithPurchaseOrder: tenantProcedure
    .input(z.object({
      invoiceId: z.string(),
      purchaseOrderId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const [invoice, purchaseOrder] = await Promise.all([
        prisma.receivedInvoice.findFirst({
          where: {
            id: input.invoiceId,
            ...tenantFilter(ctx.companyId),
          },
          include: {
            items: {
              include: { material: true },
            },
          },
        }),
        prisma.purchaseOrder.findFirst({
          where: {
            id: input.purchaseOrderId,
            ...tenantFilter(ctx.companyId),
          },
          include: {
            items: {
              include: { material: true },
            },
          },
        }),
      ]);

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "NFe não encontrada",
        });
      }

      if (!purchaseOrder) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pedido de Compra não encontrado",
        });
      }

      interface DivergenceItem {
        invoiceItemId: string;
        purchaseOrderItemId: string | null;
        materialId: string | null;
        materialDescription: string;
        invoiceQty: number;
        purchaseOrderQty: number | null;
        invoicePrice: number;
        purchaseOrderPrice: number | null;
        qtyDivergence: number | null;
        priceDivergence: number | null;
        qtyDivergencePercent: number | null;
        priceDivergencePercent: number | null;
        status: "OK" | "QTY_DIVERGENT" | "PRICE_DIVERGENT" | "BOTH_DIVERGENT" | "NOT_IN_PO";
      }

      const divergences: DivergenceItem[] = [];
      let totalDivergences = 0;

      for (const invoiceItem of invoice.items) {
        // Buscar item correspondente no pedido de compra
        const poItem = purchaseOrder.items.find(
          (poi) => poi.materialId === invoiceItem.materialId
        );

        if (!poItem) {
          divergences.push({
            invoiceItemId: invoiceItem.id,
            purchaseOrderItemId: null,
            materialId: invoiceItem.materialId,
            materialDescription: invoiceItem.material?.description || invoiceItem.productName,
            invoiceQty: invoiceItem.quantity,
            purchaseOrderQty: null,
            invoicePrice: invoiceItem.unitPrice,
            purchaseOrderPrice: null,
            qtyDivergence: null,
            priceDivergence: null,
            qtyDivergencePercent: null,
            priceDivergencePercent: null,
            status: "NOT_IN_PO",
          });
          totalDivergences++;
          continue;
        }

        const qtyDivergence = invoiceItem.quantity - poItem.quantity;
        const priceDivergence = invoiceItem.unitPrice - poItem.unitPrice;
        const qtyDivergencePercent = poItem.quantity > 0
          ? (qtyDivergence / poItem.quantity) * 100
          : 0;
        const priceDivergencePercent = poItem.unitPrice > 0
          ? (priceDivergence / poItem.unitPrice) * 100
          : 0;

        // Tolerância de 1% para preço e 0% para quantidade
        const hasQtyDivergence = Math.abs(qtyDivergence) > 0.001;
        const hasPriceDivergence = Math.abs(priceDivergencePercent) > 1;

        let status: DivergenceItem["status"] = "OK";
        if (hasQtyDivergence && hasPriceDivergence) {
          status = "BOTH_DIVERGENT";
          totalDivergences++;
        } else if (hasQtyDivergence) {
          status = "QTY_DIVERGENT";
          totalDivergences++;
        } else if (hasPriceDivergence) {
          status = "PRICE_DIVERGENT";
          totalDivergences++;
        }

        divergences.push({
          invoiceItemId: invoiceItem.id,
          purchaseOrderItemId: poItem.id,
          materialId: invoiceItem.materialId,
          materialDescription: invoiceItem.material?.description || invoiceItem.productName,
          invoiceQty: invoiceItem.quantity,
          purchaseOrderQty: poItem.quantity,
          invoicePrice: invoiceItem.unitPrice,
          purchaseOrderPrice: poItem.unitPrice,
          qtyDivergence,
          priceDivergence,
          qtyDivergencePercent,
          priceDivergencePercent,
          status,
        });
      }

      // Verificar itens do PO que não estão na NFe
      const missingInInvoice = purchaseOrder.items.filter(
        (poi) => !invoice.items.some((ii) => ii.materialId === poi.materialId)
      );

      return {
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          totalInvoice: invoice.totalInvoice,
        },
        purchaseOrder: {
          id: purchaseOrder.id,
          code: purchaseOrder.code,
          totalValue: purchaseOrder.totalValue,
        },
        divergences,
        missingInInvoice: missingInInvoice.map((poi) => ({
          purchaseOrderItemId: poi.id,
          materialId: poi.materialId,
          materialDescription: poi.material?.description || "",
          quantity: poi.quantity,
          unitPrice: poi.unitPrice,
        })),
        summary: {
          totalItems: invoice.items.length,
          okItems: divergences.filter((d) => d.status === "OK").length,
          divergentItems: totalDivergences,
          missingItems: missingInInvoice.length,
          totalValueDivergence: invoice.totalInvoice - purchaseOrder.totalValue,
        },
      };
    }),

  // Aplicar divergências aos itens
  applyDivergences: tenantProcedure
    .input(z.object({
      invoiceId: z.string(),
      items: z.array(z.object({
        itemId: z.string(),
        status: z.enum(["MATCHED", "DIVERGENT"]),
        divergenceNote: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      for (const item of input.items) {
        await prisma.receivedInvoiceItem.update({
          where: { id: item.itemId },
          data: {
            matchStatus: item.status,
            divergenceNote: item.divergenceNote,
          },
        });
      }

      // Atualizar status da NFe para VALIDATED se todos os itens foram verificados
      const invoice = await prisma.receivedInvoice.findUnique({
        where: { id: input.invoiceId },
        include: { items: true },
      });

      if (invoice) {
        const allVerified = invoice.items.every(
          (item) => item.matchStatus === "MATCHED" || item.matchStatus === "DIVERGENT"
        );

        if (allVerified) {
          await prisma.receivedInvoice.update({
            where: { id: input.invoiceId },
            data: { status: "VALIDATED" },
          });
        }
      }

      return { success: true };
    }),

  // Buscar pedidos de compra do mesmo fornecedor para vincular
  findPurchaseOrders: tenantProcedure
    .input(z.object({
      invoiceId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const invoice = await prisma.receivedInvoice.findFirst({
        where: {
          id: input.invoiceId,
          ...tenantFilter(ctx.companyId),
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "NFe não encontrada",
        });
      }

      if (!invoice.supplierId) {
        return [];
      }

      // Buscar pedidos do mesmo fornecedor que ainda não foram totalmente recebidos
      const supplierId = invoice.supplierId;
      const purchaseOrders = await prisma.purchaseOrder.findMany({
        where: {
          ...tenantFilter(ctx.companyId),
          supplierId: supplierId,
          status: { in: ["APPROVED", "PARTIAL"] },
        },
        include: {
          items: {
            include: { material: true },
          },
          _count: {
            select: { receivedInvoices: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      return purchaseOrders.map((po) => ({
        id: po.id,
        code: po.code,
        createdAt: po.createdAt,
        totalValue: po.totalValue,
        itemsCount: po.items.length,
        receivedCount: po._count.receivedInvoices,
        items: po.items.map((item: { id: string; material: { description: string } | null; quantity: number; unitPrice: number }) => ({
          id: item.id,
          materialDescription: item.material?.description || "",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      }));
    }),

  // Estatísticas
  stats: tenantProcedure.query(async ({ ctx }) => {
    const [pending, validated, approved, rejected, totalValue] = await Promise.all([
      prisma.receivedInvoice.count({
        where: { ...tenantFilter(ctx.companyId), status: "PENDING" },
      }),
      prisma.receivedInvoice.count({
        where: { ...tenantFilter(ctx.companyId), status: "VALIDATED" },
      }),
      prisma.receivedInvoice.count({
        where: { ...tenantFilter(ctx.companyId), status: "APPROVED" },
      }),
      prisma.receivedInvoice.count({
        where: { ...tenantFilter(ctx.companyId), status: "REJECTED" },
      }),
      prisma.receivedInvoice.aggregate({
        where: { ...tenantFilter(ctx.companyId), status: "APPROVED" },
        _sum: { totalInvoice: true },
      }),
    ]);

    return {
      pending,
      validated,
      approved,
      rejected,
      totalValue: totalValue._sum.totalInvoice || 0,
    };
  }),
});
