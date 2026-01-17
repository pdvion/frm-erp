import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { auditCreate, auditUpdate, auditDelete } from "../services/audit";

// Parser de XML NFe
interface NFeData {
  accessKey: string;
  invoiceNumber: number;
  series: number;
  issueDate: Date;
  supplierCnpj: string;
  supplierName: string;
  totalProducts: number;
  totalInvoice: number;
  freightValue: number;
  discountValue: number;
  icmsBase: number;
  icmsValue: number;
  ipiValue: number;
  pisValue: number;
  cofinsValue: number;
  items: NFeItemData[];
}

interface NFeItemData {
  itemNumber: number;
  productCode: string;
  productName: string;
  ncm: string | null;
  cfop: number;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  icmsRate: number;
  icmsValue: number;
  ipiRate: number;
  ipiValue: number;
}

function parseNFeXml(xmlContent: string): NFeData {
  // Parser simplificado de NFe XML
  // Em produção, usar biblioteca como fast-xml-parser
  
  const getTagValue = (xml: string, tag: string): string => {
    const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
    const match = xml.match(regex);
    return match ? match[1].trim() : "";
  };

  const getTagValueFloat = (xml: string, tag: string): number => {
    const value = getTagValue(xml, tag);
    return value ? parseFloat(value) : 0;
  };

  const getTagValueInt = (xml: string, tag: string): number => {
    const value = getTagValue(xml, tag);
    return value ? parseInt(value, 10) : 0;
  };

  // Extrair chave de acesso
  const chaveMatch = xmlContent.match(/<chNFe>([^<]+)<\/chNFe>/i) || 
                     xmlContent.match(/<infNFe[^>]*Id="NFe([^"]+)"/i);
  const accessKey = chaveMatch ? chaveMatch[1].replace(/\D/g, "") : "";

  // Dados da NFe (ide)
  const ideMatch = xmlContent.match(/<ide>([\s\S]*?)<\/ide>/i);
  const ide = ideMatch ? ideMatch[1] : "";
  const invoiceNumber = getTagValueInt(ide, "nNF");
  const series = getTagValueInt(ide, "serie") || 1;
  const issueDateStr = getTagValue(ide, "dhEmi") || getTagValue(ide, "dEmi");
  const issueDate = issueDateStr ? new Date(issueDateStr) : new Date();

  // Dados do emitente (emit)
  const emitMatch = xmlContent.match(/<emit>([\s\S]*?)<\/emit>/i);
  const emit = emitMatch ? emitMatch[1] : "";
  const supplierCnpj = getTagValue(emit, "CNPJ") || getTagValue(emit, "CPF");
  const supplierName = getTagValue(emit, "xNome");

  // Totais (ICMSTot)
  const totMatch = xmlContent.match(/<ICMSTot>([\s\S]*?)<\/ICMSTot>/i);
  const tot = totMatch ? totMatch[1] : "";
  const totalProducts = getTagValueFloat(tot, "vProd");
  const totalInvoice = getTagValueFloat(tot, "vNF");
  const freightValue = getTagValueFloat(tot, "vFrete");
  const discountValue = getTagValueFloat(tot, "vDesc");
  const icmsBase = getTagValueFloat(tot, "vBC");
  const icmsValue = getTagValueFloat(tot, "vICMS");
  const ipiValue = getTagValueFloat(tot, "vIPI");
  const pisValue = getTagValueFloat(tot, "vPIS");
  const cofinsValue = getTagValueFloat(tot, "vCOFINS");

  // Itens (det)
  const items: NFeItemData[] = [];
  const detMatches = xmlContent.matchAll(/<det[^>]*nItem="(\d+)"[^>]*>([\s\S]*?)<\/det>/gi);
  
  for (const detMatch of detMatches) {
    const itemNumber = parseInt(detMatch[1], 10);
    const det = detMatch[2];

    // Produto
    const prodMatch = det.match(/<prod>([\s\S]*?)<\/prod>/i);
    const prod = prodMatch ? prodMatch[1] : "";
    
    const productCode = getTagValue(prod, "cProd");
    const productName = getTagValue(prod, "xProd");
    const ncm = getTagValue(prod, "NCM") || null;
    const cfop = getTagValueInt(prod, "CFOP");
    const quantity = getTagValueFloat(prod, "qCom");
    const unit = getTagValue(prod, "uCom");
    const unitPrice = getTagValueFloat(prod, "vUnCom");
    const totalPrice = getTagValueFloat(prod, "vProd");

    // Impostos do item
    const impostoMatch = det.match(/<imposto>([\s\S]*?)<\/imposto>/i);
    const imposto = impostoMatch ? impostoMatch[1] : "";
    
    const icmsMatch = imposto.match(/<ICMS>([\s\S]*?)<\/ICMS>/i);
    const icms = icmsMatch ? icmsMatch[1] : "";
    const icmsRate = getTagValueFloat(icms, "pICMS");
    const itemIcmsValue = getTagValueFloat(icms, "vICMS");

    const ipiMatch = imposto.match(/<IPI>([\s\S]*?)<\/IPI>/i);
    const ipi = ipiMatch ? ipiMatch[1] : "";
    const ipiRate = getTagValueFloat(ipi, "pIPI");
    const itemIpiValue = getTagValueFloat(ipi, "vIPI");

    items.push({
      itemNumber,
      productCode,
      productName,
      ncm,
      cfop,
      quantity,
      unit,
      unitPrice,
      totalPrice,
      icmsRate,
      icmsValue: itemIcmsValue,
      ipiRate,
      ipiValue: itemIpiValue,
    });
  }

  return {
    accessKey,
    invoiceNumber,
    series,
    issueDate,
    supplierCnpj,
    supplierName,
    totalProducts,
    totalInvoice,
    freightValue,
    discountValue,
    icmsBase,
    icmsValue,
    ipiValue,
    pisValue,
    cofinsValue,
    items,
  };
}

export const receivedInvoicesRouter = createTRPCRouter({
  // Listar NFe recebidas
  list: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["PENDING", "VALIDATED", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
        supplierId: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search, status, supplierId, dateFrom, dateTo, page = 1, limit = 20 } = input ?? {};

      const where = {
        ...tenantFilter(ctx.companyId),
        ...(status && { status }),
        ...(supplierId && { supplierId }),
        ...(dateFrom && { issueDate: { gte: dateFrom } }),
        ...(dateTo && { issueDate: { lte: dateTo } }),
        ...(search && {
          OR: [
            { accessKey: { contains: search } },
            { supplierName: { contains: search, mode: "insensitive" as const } },
            { invoiceNumber: !isNaN(parseInt(search)) ? parseInt(search) : undefined },
          ].filter(Boolean),
        }),
      };

      const [invoices, total] = await Promise.all([
        ctx.prisma.receivedInvoice.findMany({
          where,
          include: {
            supplier: { select: { id: true, code: true, companyName: true } },
            purchaseOrder: { select: { id: true, code: true } },
            _count: { select: { items: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.receivedInvoice.count({ where }),
      ]);

      return {
        invoices,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Buscar NFe por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.receivedInvoice.findFirst({
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
              material: { select: { id: true, code: true, description: true, unit: true } },
              purchaseOrderItem: { select: { id: true, quantity: true, unitPrice: true } },
            },
            orderBy: { itemNumber: "asc" },
          },
        },
      });

      if (!invoice) {
        throw new Error("NFe não encontrada");
      }

      return invoice;
    }),

  // Upload e parse de XML
  uploadXml: tenantProcedure
    .input(z.object({ xmlContent: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Parse do XML
      const nfeData = parseNFeXml(input.xmlContent);

      if (!nfeData.accessKey || nfeData.accessKey.length !== 44) {
        throw new Error("Chave de acesso inválida");
      }

      // Verificar se já existe
      const existing = await ctx.prisma.receivedInvoice.findUnique({
        where: { accessKey: nfeData.accessKey },
      });

      if (existing) {
        throw new Error(`NFe já cadastrada (${nfeData.accessKey})`);
      }

      // Buscar fornecedor pelo CNPJ
      const supplier = await ctx.prisma.supplier.findFirst({
        where: {
          cnpj: nfeData.supplierCnpj,
          ...tenantFilter(ctx.companyId),
        },
      });

      // Criar NFe
      const invoice = await ctx.prisma.receivedInvoice.create({
        data: {
          accessKey: nfeData.accessKey,
          invoiceNumber: nfeData.invoiceNumber,
          series: nfeData.series,
          issueDate: nfeData.issueDate,
          supplierId: supplier?.id,
          supplierCnpj: nfeData.supplierCnpj,
          supplierName: nfeData.supplierName,
          totalProducts: nfeData.totalProducts,
          totalInvoice: nfeData.totalInvoice,
          freightValue: nfeData.freightValue,
          discountValue: nfeData.discountValue,
          icmsBase: nfeData.icmsBase,
          icmsValue: nfeData.icmsValue,
          ipiValue: nfeData.ipiValue,
          pisValue: nfeData.pisValue,
          cofinsValue: nfeData.cofinsValue,
          status: "PENDING",
          companyId: ctx.companyId,
          xmlContent: input.xmlContent,
          items: {
            create: nfeData.items.map((item) => ({
              itemNumber: item.itemNumber,
              productCode: item.productCode,
              productName: item.productName,
              ncm: item.ncm,
              cfop: item.cfop,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              icmsRate: item.icmsRate,
              icmsValue: item.icmsValue,
              ipiRate: item.ipiRate,
              ipiValue: item.ipiValue,
              matchStatus: "PENDING",
            })),
          },
        },
        include: {
          items: true,
        },
      });

      await auditCreate("ReceivedInvoice", invoice, nfeData.accessKey, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return invoice;
    }),

  // Auto-match: vincular itens automaticamente com materiais/OC
  autoMatch: tenantProcedure
    .input(z.object({ invoiceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.receivedInvoice.findFirst({
        where: {
          id: input.invoiceId,
          ...tenantFilter(ctx.companyId),
        },
        include: {
          items: true,
        },
      });

      if (!invoice) {
        throw new Error("NFe não encontrada");
      }

      let matchedCount = 0;
      let divergentCount = 0;
      let notFoundCount = 0;

      for (const item of invoice.items) {
        // Buscar material pelo código do produto (código do fornecedor)
        const supplierMaterial = await ctx.prisma.supplierMaterial.findFirst({
          where: {
            supplierCode: item.productCode,
            supplier: {
              cnpj: invoice.supplierCnpj,
            },
          },
          include: { material: true },
        });

        if (supplierMaterial) {
          // Buscar item de OC pendente para este material
          const poItem = await ctx.prisma.purchaseOrderItem.findFirst({
            where: {
              materialId: supplierMaterial.materialId,
              purchaseOrder: {
                supplierId: invoice.supplierId ?? undefined,
                status: { in: ["SENT", "PARTIAL"] },
                ...tenantFilter(ctx.companyId),
              },
              receivedQty: { lt: ctx.prisma.purchaseOrderItem.fields.quantity },
            },
            include: { purchaseOrder: true },
          });

          // Verificar divergências
          let matchStatus: "MATCHED" | "DIVERGENT" = "MATCHED";
          let divergenceType: string | null = null;
          let divergenceNote: string | null = null;

          if (poItem) {
            const pendingQty = poItem.quantity - poItem.receivedQty;
            const priceDiff = Math.abs(item.unitPrice - poItem.unitPrice) / poItem.unitPrice;

            if (item.quantity > pendingQty) {
              matchStatus = "DIVERGENT";
              divergenceType = "QTY";
              divergenceNote = `Qtd NFe (${item.quantity}) > Qtd pendente OC (${pendingQty})`;
              divergentCount++;
            } else if (priceDiff > 0.05) {
              matchStatus = "DIVERGENT";
              divergenceType = "PRICE";
              divergenceNote = `Preço NFe (${item.unitPrice.toFixed(2)}) difere do OC (${poItem.unitPrice.toFixed(2)})`;
              divergentCount++;
            } else {
              matchedCount++;
            }

            // Atualizar item
            await ctx.prisma.receivedInvoiceItem.update({
              where: { id: item.id },
              data: {
                materialId: supplierMaterial.materialId,
                purchaseOrderItemId: poItem.id,
                matchStatus,
                divergenceType,
                divergenceNote,
              },
            });

            // Vincular NFe ao pedido
            if (!invoice.purchaseOrderId) {
              await ctx.prisma.receivedInvoice.update({
                where: { id: invoice.id },
                data: { purchaseOrderId: poItem.purchaseOrderId },
              });
            }
          } else {
            // Material encontrado mas sem OC pendente
            await ctx.prisma.receivedInvoiceItem.update({
              where: { id: item.id },
              data: {
                materialId: supplierMaterial.materialId,
                matchStatus: "MATCHED",
              },
            });
            matchedCount++;
          }
        } else {
          // Material não encontrado
          await ctx.prisma.receivedInvoiceItem.update({
            where: { id: item.id },
            data: {
              matchStatus: "NOT_FOUND",
              divergenceNote: `Código ${item.productCode} não encontrado no cadastro`,
            },
          });
          notFoundCount++;
        }
      }

      // Atualizar status da NFe
      const newStatus = notFoundCount > 0 || divergentCount > 0 ? "PENDING" : "VALIDATED";
      await ctx.prisma.receivedInvoice.update({
        where: { id: invoice.id },
        data: { status: newStatus },
      });

      return {
        matched: matchedCount,
        divergent: divergentCount,
        notFound: notFoundCount,
        total: invoice.items.length,
      };
    }),

  // Vincular item manualmente
  linkItem: tenantProcedure
    .input(
      z.object({
        itemId: z.string(),
        materialId: z.string(),
        purchaseOrderItemId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.receivedInvoiceItem.update({
        where: { id: input.itemId },
        data: {
          materialId: input.materialId,
          purchaseOrderItemId: input.purchaseOrderItemId,
          matchStatus: "MATCHED",
          divergenceType: null,
          divergenceNote: null,
        },
      });

      return item;
    }),

  // Aprovar NFe (entrada no estoque + conta a pagar)
  approve: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.receivedInvoice.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId),
        },
        include: {
          items: {
            include: { material: true },
          },
        },
      });

      if (!invoice) {
        throw new Error("NFe não encontrada");
      }

      if (invoice.status === "APPROVED") {
        throw new Error("NFe já aprovada");
      }

      // Verificar se todos os itens estão vinculados
      const unlinkedItems = invoice.items.filter((i: { materialId: string | null }) => !i.materialId);
      if (unlinkedItems.length > 0) {
        throw new Error(`${unlinkedItems.length} item(ns) sem material vinculado`);
      }

      // Processar cada item: entrada no estoque
      for (const item of invoice.items) {
        if (!item.materialId) continue;

        // Buscar ou criar registro de estoque
        let inventory = await ctx.prisma.inventory.findFirst({
          where: {
            materialId: item.materialId,
            inventoryType: "RAW_MATERIAL",
            companyId: ctx.companyId ?? null,
          },
        });

        if (!inventory) {
          inventory = await ctx.prisma.inventory.create({
            data: {
              materialId: item.materialId,
              inventoryType: "RAW_MATERIAL",
              companyId: ctx.companyId,
              quantity: 0,
              availableQty: 0,
              unitCost: 0,
              totalCost: 0,
            },
          });
        }

        const newQuantity = inventory.quantity + item.quantity;

        // Criar movimento de entrada
        await ctx.prisma.inventoryMovement.create({
          data: {
            inventoryId: inventory.id,
            movementType: "ENTRY",
            quantity: item.quantity,
            unitCost: item.unitPrice,
            totalCost: item.totalPrice,
            balanceAfter: newQuantity,
            documentType: "NFE",
            documentNumber: invoice.accessKey.slice(-8),
            supplierId: invoice.supplierId,
            notes: `NFe ${invoice.invoiceNumber} - ${item.productName}`,
          },
        });

        // Atualizar estoque
        await ctx.prisma.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: newQuantity,
            availableQty: newQuantity,
            unitCost: item.unitPrice,
            totalCost: newQuantity * item.unitPrice,
            lastMovementAt: new Date(),
          },
        });

        // Atualizar preço do material
        await ctx.prisma.material.update({
          where: { id: item.materialId },
          data: {
            lastPurchasePrice: item.unitPrice,
            lastPurchaseDate: new Date(),
          },
        });

        // Atualizar quantidade recebida do item
        await ctx.prisma.receivedInvoiceItem.update({
          where: { id: item.id },
          data: { receivedQty: item.quantity },
        });

        // Se vinculado a OC, atualizar quantidade recebida
        if (item.purchaseOrderItemId) {
          const poItem = await ctx.prisma.purchaseOrderItem.findUnique({
            where: { id: item.purchaseOrderItemId },
          });

          if (poItem) {
            await ctx.prisma.purchaseOrderItem.update({
              where: { id: item.purchaseOrderItemId },
              data: { receivedQty: poItem.receivedQty + item.quantity },
            });
          }
        }
      }

      // Atualizar status da NFe
      const updatedInvoice = await ctx.prisma.receivedInvoice.update({
        where: { id: invoice.id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedBy: ctx.tenant.userId,
          receivedAt: new Date(),
          receivedBy: ctx.tenant.userId,
        },
      });

      await auditUpdate("ReceivedInvoice", invoice.id, invoice.accessKey, invoice, updatedInvoice, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return updatedInvoice;
    }),

  // Rejeitar NFe
  reject: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.receivedInvoice.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId),
        },
      });

      if (!invoice) {
        throw new Error("NFe não encontrada");
      }

      const updatedInvoice = await ctx.prisma.receivedInvoice.update({
        where: { id: input.id },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
          rejectedBy: ctx.tenant.userId,
          rejectionReason: input.reason,
        },
      });

      await auditUpdate("ReceivedInvoice", invoice.id, invoice.accessKey, invoice, updatedInvoice, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return updatedInvoice;
    }),

  // Excluir NFe (apenas PENDING)
  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.receivedInvoice.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId),
          status: "PENDING",
        },
      });

      if (!invoice) {
        throw new Error("NFe não encontrada ou não pode ser excluída");
      }

      await ctx.prisma.receivedInvoice.delete({
        where: { id: input.id },
      });

      await auditDelete("ReceivedInvoice", invoice, invoice.accessKey, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return { success: true };
    }),

  // Estatísticas
  stats: tenantProcedure.query(async ({ ctx }) => {
    const stats = await ctx.prisma.receivedInvoice.groupBy({
      by: ["status"],
      where: tenantFilter(ctx.companyId),
      _count: true,
      _sum: { totalInvoice: true },
    });

    return stats.map((s) => ({
      status: s.status,
      count: s._count,
      total: s._sum.totalInvoice ?? 0,
    }));
  }),
});
