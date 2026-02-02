import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { emitEvent } from "../services/events";
import { emitirNFe, cancelarNFe, emitirCartaCorrecao } from "../services/sefaz";

export const billingRouter = createTRPCRouter({
  // Listar notas fiscais de saída
  list: tenantProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["DRAFT", "AUTHORIZED", "CANCELLED", "DENIED", "ALL"]).optional(),
      customerId: z.string().optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { search, status, customerId, dateFrom, dateTo, page = 1, limit = 20 } = input || {};

      const where: Prisma.IssuedInvoiceWhereInput = {
        ...tenantFilter(ctx.companyId, false),
        ...(search && {
          OR: [
            { customer: { companyName: { contains: search, mode: "insensitive" as const } } },
            { invoiceNumber: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(status && status !== "ALL" && { status }),
        ...(customerId && { customerId }),
        ...(dateFrom && { issueDate: { gte: dateFrom } }),
        ...(dateTo && { issueDate: { lte: dateTo } }),
      };

      const [invoices, total] = await Promise.all([
        ctx.prisma.issuedInvoice.findMany({
          where,
          include: {
            customer: { select: { id: true, code: true, companyName: true } },
            _count: { select: { items: true } },
          },
          orderBy: { issueDate: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.issuedInvoice.count({ where }),
      ]);

      return { invoices, total, pages: Math.ceil(total / limit) };
    }),

  // Buscar por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const invoice = await ctx.prisma.issuedInvoice.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId, false) },
        include: {
          customer: true,
          salesOrder: true,
          items: {
            include: {
              material: { select: { id: true, code: true, description: true, unit: true } },
            },
            orderBy: { sequence: "asc" },
          },
          receivables: true,
        },
      });

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nota fiscal não encontrada" });
      }

      return invoice;
    }),

  // Faturar pedido de venda
  createFromOrder: tenantProcedure
    .input(z.object({
      salesOrderId: z.string(),
      items: z.array(z.object({
        itemId: z.string(),
        quantity: z.number().positive(),
      })).optional(),
      paymentTerms: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const order = await ctx.prisma.salesOrder.findFirst({
        where: { id: input.salesOrderId, ...tenantFilter(ctx.companyId, false) },
        include: {
          customer: true,
          items: { include: { material: true } },
        },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }

      if (order.status === "CANCELLED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Pedido cancelado" });
      }

      // Gerar próximo número
      const lastInvoice = await ctx.prisma.issuedInvoice.findFirst({
        where: tenantFilter(ctx.companyId, false),
        orderBy: { code: "desc" },
      });
      const nextCode = (lastInvoice?.code || 0) + 1;

      // Determinar itens a faturar
      const itemsToInvoice = input.items
        ? order.items.filter((i) => input.items!.some((ii) => ii.itemId === i.id))
        : order.items;

      // Calcular totais
      let subtotal = 0;
      const invoiceItems = itemsToInvoice.map((item, index) => {
        const qty = input.items?.find((ii) => ii.itemId === item.id)?.quantity || item.quantity;
        const total = qty * item.unitPrice * (1 - (item.discountPercent || 0) / 100);
        subtotal += total;
        return {
          materialId: item.materialId,
          description: item.description || item.material.description,
          quantity: qty,
          unit: item.unit,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent || 0,
          totalPrice: total,
          sequence: index,
          cfop: "5102", // Venda de mercadoria
          ncm: item.material.ncm || "",
        };
      });

      // Criar nota fiscal
      const invoice = await ctx.prisma.issuedInvoice.create({
        data: {
          code: nextCode,
          invoiceNumber: String(nextCode).padStart(9, "0"),
          series: "1",
          model: "55",
          companyId: ctx.companyId,
          customerId: order.customerId,
          salesOrderId: order.id,
          issueDate: new Date(),
          operationType: "SALE",
          subtotal,
          discountValue: order.discountValue || 0,
          shippingValue: order.shippingValue || 0,
          totalValue: subtotal - (order.discountValue || 0) + (order.shippingValue || 0),
          paymentTerms: input.paymentTerms || order.paymentTerms,
          notes: input.notes,
          status: "DRAFT",
          createdBy: ctx.tenant.userId,
          items: { create: invoiceItems },
        },
        include: { items: true, customer: true },
      });

      // Atualizar status do pedido
      await ctx.prisma.salesOrder.update({
        where: { id: order.id },
        data: { status: "SHIPPED", invoiceNumber: invoice.invoiceNumber },
      });

      emitEvent("invoice.created", {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId ?? undefined,
      }, {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customer.companyName,
        totalValue: invoice.totalValue,
      });

      return invoice;
    }),

  // Criar nota fiscal manual
  create: tenantProcedure
    .input(z.object({
      customerId: z.string(),
      operationType: z.enum(["SALE", "RETURN", "TRANSFER", "OTHER"]).default("SALE"),
      paymentTerms: z.string().optional(),
      notes: z.string().optional(),
      items: z.array(z.object({
        materialId: z.string(),
        description: z.string().optional(),
        quantity: z.number().positive(),
        unit: z.string().default("UN"),
        unitPrice: z.number(),
        discountPercent: z.number().default(0),
        cfop: z.string().default("5102"),
        ncm: z.string().optional(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const { items, ...invoiceData } = input;

      // Gerar próximo número
      const lastInvoice = await ctx.prisma.issuedInvoice.findFirst({
        where: tenantFilter(ctx.companyId, false),
        orderBy: { code: "desc" },
      });
      const nextCode = (lastInvoice?.code || 0) + 1;

      // Calcular totais
      let subtotal = 0;
      const invoiceItems = items.map((item, index) => {
        const total = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
        subtotal += total;
        return { ...item, totalPrice: total, sequence: index };
      });

      const invoice = await ctx.prisma.issuedInvoice.create({
        data: {
          ...invoiceData,
          code: nextCode,
          invoiceNumber: String(nextCode).padStart(9, "0"),
          series: "1",
          model: "55",
          companyId: ctx.companyId,
          issueDate: new Date(),
          subtotal,
          totalValue: subtotal,
          status: "DRAFT",
          createdBy: ctx.tenant.userId,
          items: { create: invoiceItems },
        },
        include: { items: true },
      });

      return invoice;
    }),

  // Autorizar NFe (transmissão SEFAZ via serviço)
  // @see VIO-566 - Emissão de NF-e
  authorize: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const invoice = await ctx.prisma.issuedInvoice.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId, false) },
        include: { customer: true },
      });

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nota fiscal não encontrada" });
      }

      if (invoice.status !== "DRAFT") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nota já processada" });
      }

      // Emitir NF-e via serviço SEFAZ
      const resultado = await emitirNFe(input.id, ctx.companyId!);
      
      if (!resultado.sucesso) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: resultado.erro || "Erro na emissão da NF-e" 
        });
      }

      const authorizedInvoice = await ctx.prisma.issuedInvoice.update({
        where: { id: input.id },
        data: {
          status: "AUTHORIZED",
          accessKey: resultado.chaveAcesso,
          protocolNumber: resultado.protocolo,
          authorizedAt: new Date(),
          xmlContent: resultado.xml,
        },
      });

      emitEvent("invoice.authorized", {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId ?? undefined,
      }, {
        invoiceId: authorizedInvoice.id,
        invoiceNumber: authorizedInvoice.invoiceNumber,
        accessKey: resultado.chaveAcesso,
      });

      return authorizedInvoice;
    }),

  // Cancelar NFe (via serviço SEFAZ)
  // @see VIO-566 - Emissão de NF-e
  cancel: tenantProcedure
    .input(z.object({
      id: z.string(),
      reason: z.string().min(15, "Justificativa deve ter no mínimo 15 caracteres"),
    }))
    .mutation(async ({ input, ctx }) => {
      const invoice = await ctx.prisma.issuedInvoice.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId, false) },
      });

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nota fiscal não encontrada" });
      }

      if (invoice.status === "CANCELLED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nota já cancelada" });
      }

      // Verificar prazo (24h para cancelamento)
      if (invoice.authorizedAt) {
        const hoursSinceAuth = (Date.now() - invoice.authorizedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceAuth > 24) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Prazo de cancelamento expirado (24h)" });
        }
      }

      // Cancelar via serviço SEFAZ (se nota autorizada)
      if (invoice.status === "AUTHORIZED" && invoice.accessKey) {
        const resultado = await cancelarNFe(input.id, ctx.companyId!, input.reason);
        if (!resultado.sucesso) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: resultado.erro || "Erro no cancelamento da NF-e" 
          });
        }
      }

      const cancelledInvoice = await ctx.prisma.issuedInvoice.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: input.reason,
        },
      });

      return cancelledInvoice;
    }),

  // Carta de correção (via serviço SEFAZ)
  // @see VIO-566 - Emissão de NF-e
  correctionLetter: tenantProcedure
    .input(z.object({
      id: z.string(),
      correction: z.string().min(15, "Correção deve ter no mínimo 15 caracteres"),
    }))
    .mutation(async ({ input, ctx }) => {
      const invoice = await ctx.prisma.issuedInvoice.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId, false) },
      });

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nota fiscal não encontrada" });
      }

      if (invoice.status !== "AUTHORIZED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Só é possível corrigir notas autorizadas" });
      }

      // Incrementar sequência de correção
      const correctionSeq = (invoice.correctionSeq || 0) + 1;

      // Emitir CC-e via serviço SEFAZ
      const resultado = await emitirCartaCorrecao(input.id, ctx.companyId!, input.correction, correctionSeq);
      if (!resultado.sucesso) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: resultado.erro || "Erro na carta de correção" 
        });
      }

      const correctedInvoice = await ctx.prisma.issuedInvoice.update({
        where: { id: input.id },
        data: {
          correctionSeq,
          lastCorrection: input.correction,
          lastCorrectionAt: new Date(),
        },
      });

      return correctedInvoice;
    }),

  // Gerar títulos a receber
  generateReceivables: tenantProcedure
    .input(z.object({
      invoiceId: z.string(),
      installments: z.array(z.object({
        dueDate: z.date(),
        value: z.number().positive(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const invoice = await ctx.prisma.issuedInvoice.findFirst({
        where: { id: input.invoiceId, ...tenantFilter(ctx.companyId, false) },
        include: { customer: true },
      });

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nota fiscal não encontrada" });
      }

      // Validar soma das parcelas
      const totalInstallments = input.installments.reduce((sum, i) => sum + i.value, 0);
      if (Math.abs(totalInstallments - Number(invoice.totalValue)) > 0.01) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Soma das parcelas (${totalInstallments}) difere do valor da nota (${invoice.totalValue})`,
        });
      }

      // Gerar próximo código de título
      const lastReceivable = await ctx.prisma.accountsReceivable.findFirst({
        where: tenantFilter(ctx.companyId, false),
        orderBy: { code: "desc" },
      });
      let nextCode = (lastReceivable?.code || 0) + 1;

      // Criar títulos
      const receivables = await Promise.all(
        input.installments.map(async (inst, index) => {
          return ctx.prisma.accountsReceivable.create({
            data: {
              code: nextCode++,
              companyId: ctx.companyId,
              customerId: invoice.customerId,
              issuedInvoiceId: invoice.id,
              documentNumber: `${invoice.invoiceNumber}/${index + 1}`,
              description: `NF ${invoice.invoiceNumber} - Parcela ${index + 1}/${input.installments.length}`,
              issueDate: invoice.issueDate,
              dueDate: inst.dueDate,
              originalValue: inst.value,
              netValue: inst.value,
              status: "PENDING",
              documentType: "INVOICE",
            },
          });
        })
      );

      return receivables;
    }),

  // Dashboard de faturamento
  dashboard: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Faturamento do mês
    const monthInvoices = await ctx.prisma.issuedInvoice.aggregate({
      where: {
        ...tenantFilter(ctx.companyId, false),
        status: "AUTHORIZED",
        issueDate: { gte: startOfMonth },
      },
      _count: true,
      _sum: { totalValue: true },
    });

    // Por status
    const byStatus = await ctx.prisma.issuedInvoice.groupBy({
      by: ["status"],
      where: tenantFilter(ctx.companyId, false),
      _count: true,
      _sum: { totalValue: true },
    });

    // Pendentes de autorização
    const pendingAuth = await ctx.prisma.issuedInvoice.count({
      where: { ...tenantFilter(ctx.companyId, false), status: "DRAFT" },
    });

    // Top clientes do mês
    const topCustomers = await ctx.prisma.issuedInvoice.groupBy({
      by: ["customerId"],
      where: {
        ...tenantFilter(ctx.companyId, false),
        status: "AUTHORIZED",
        issueDate: { gte: startOfMonth },
      },
      _sum: { totalValue: true },
      orderBy: { _sum: { totalValue: "desc" } },
      take: 5,
    });

    const customerIds = topCustomers.map((c) => c.customerId);
    const customers = await ctx.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, companyName: true },
    });

    return {
      monthInvoices: {
        count: monthInvoices._count,
        value: monthInvoices._sum.totalValue || 0,
      },
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
        value: s._sum.totalValue || 0,
      })),
      pendingAuth,
      topCustomers: topCustomers.map((c) => ({
        customerId: c.customerId,
        customerName: customers.find((cust) => cust.id === c.customerId)?.companyName || "N/A",
        value: c._sum.totalValue || 0,
      })),
    };
  }),
});
