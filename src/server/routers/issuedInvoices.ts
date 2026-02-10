import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";

const invoiceStatusEnum = z.enum([
  "DRAFT",
  "PENDING",
  "AUTHORIZED",
  "CANCELLED",
  "DENIED",
]);

export const issuedInvoicesRouter = createTRPCRouter({
  list: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: invoiceStatusEnum.optional(),
        customerId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const { search, status, customerId, startDate, endDate, page, limit } = input;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {
        companyId: ctx.companyId,
      };

      if (search) {
        where.OR = [
          { invoiceNumber: { contains: search, mode: "insensitive" as const } },
          { accessKey: { contains: search, mode: "insensitive" as const } },
          { customer: { companyName: { contains: search, mode: "insensitive" as const } } },
        ];
      }

      if (status) {
        where.status = status;
      }

      if (customerId) {
        where.customerId = customerId;
      }

      if (startDate) {
        where.issueDate = { ...(where.issueDate as object || {}), gte: new Date(startDate) };
      }

      if (endDate) {
        where.issueDate = { ...(where.issueDate as object || {}), lte: new Date(endDate) };
      }

      const [invoices, total] = await Promise.all([
        ctx.prisma.issuedInvoice.findMany({
          where,
          include: {
            customer: { select: { id: true, code: true, companyName: true } },
            salesOrder: { select: { id: true, code: true } },
            _count: { select: { items: true } },
          },
          orderBy: { issueDate: "desc" },
          skip,
          take: limit,
        }),
        ctx.prisma.issuedInvoice.count({ where }),
      ]);

      return {
        invoices,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    }),

  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const invoice = await ctx.prisma.issuedInvoice.findFirst({
        where: {
          id: input.id,
          companyId: ctx.companyId,
        },
        include: {
          customer: true,
          salesOrder: { select: { id: true, code: true, status: true } },
          items: {
            include: {
              material: { select: { id: true, code: true, description: true, unit: true, ncm: true } },
            },
            orderBy: { sequence: "asc" },
          },
          receivables: {
            select: { id: true, installmentNumber: true, dueDate: true, netValue: true, status: true },
            orderBy: { installmentNumber: "asc" },
          },
        },
      });

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nota fiscal não encontrada" });
      }

      return invoice;
    }),

  // Criar NF a partir de pedido de venda
  createFromOrder: tenantProcedure
    .input(
      z.object({
        salesOrderId: z.string(),
        series: z.string().default("1"),
        paymentTerms: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Buscar pedido
      const order = await ctx.prisma.salesOrder.findFirst({
        where: { id: input.salesOrderId, ...tenantFilter(ctx.companyId) },
        include: {
          customer: true,
          items: { include: { material: true } },
        },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }

      if (!["CONFIRMED", "READY", "SHIPPED"].includes(order.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Pedido não está em status válido para faturamento" });
      }

      // Gerar código e número da NF
      const lastInvoice = await ctx.prisma.issuedInvoice.findFirst({
        where: { companyId: ctx.companyId },
        orderBy: { code: "desc" },
        select: { code: true, invoiceNumber: true },
      });

      const nextCode = (lastInvoice?.code ?? 0) + 1;
      const nextNumber = String(nextCode).padStart(9, "0");

      // Criar itens da NF
      const itemsData = order.items.map((item, index) => ({
        materialId: item.materialId,
        description: item.description || item.material.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        totalPrice: item.totalPrice,
        sequence: index + 1,
        ncm: item.material.ncm,
        cfop: "5102", // Venda de mercadoria (simplificado)
      }));

      const invoice = await ctx.prisma.issuedInvoice.create({
        data: {
          code: nextCode,
          invoiceNumber: nextNumber,
          series: input.series,
          companyId: ctx.companyId,
          customerId: order.customerId,
          salesOrderId: order.id,
          status: "DRAFT",
          subtotal: order.subtotal,
          discountValue: order.discountValue,
          shippingValue: order.shippingValue,
          totalValue: order.totalValue,
          paymentTerms: input.paymentTerms || order.paymentTerms,
          notes: input.notes,
          createdBy: ctx.tenant.userId,
          items: {
            create: itemsData,
          },
        },
        include: { items: true },
      });

      return invoice;
    }),

  // Criar NF manual (sem pedido)
  create: tenantProcedure
    .input(
      z.object({
        customerId: z.string(),
        series: z.string().default("1"),
        operationType: z.string().default("SALE"),
        paymentTerms: z.string().optional(),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            materialId: z.string(),
            description: z.string().optional(),
            quantity: z.number().positive(),
            unit: z.string().default("UN"),
            unitPrice: z.number().min(0),
            discountPercent: z.number().min(0).max(100).default(0),
            cfop: z.string().optional(),
          })
        ).min(1, "NF deve ter pelo menos um item"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Gerar código e número
      const lastInvoice = await ctx.prisma.issuedInvoice.findFirst({
        where: { companyId: ctx.companyId },
        orderBy: { code: "desc" },
        select: { code: true },
      });

      const nextCode = (lastInvoice?.code ?? 0) + 1;
      const nextNumber = String(nextCode).padStart(9, "0");

      // Calcular totais
      let subtotal = 0;
      const itemsData = await Promise.all(
        input.items.map(async (item, index) => {
          const material = await ctx.prisma.material.findUnique({
            where: { id: item.materialId },
            select: { ncm: true, description: true },
          });

          const itemTotal = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
          subtotal += itemTotal;

          return {
            materialId: item.materialId,
            description: item.description || material?.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            totalPrice: itemTotal,
            sequence: index + 1,
            ncm: material?.ncm,
            cfop: item.cfop || "5102",
          };
        })
      );

      const invoice = await ctx.prisma.issuedInvoice.create({
        data: {
          code: nextCode,
          invoiceNumber: nextNumber,
          series: input.series,
          companyId: ctx.companyId,
          customerId: input.customerId,
          operationType: input.operationType,
          status: "DRAFT",
          subtotal,
          totalValue: subtotal,
          paymentTerms: input.paymentTerms,
          notes: input.notes,
          createdBy: ctx.tenant.userId,
          items: {
            create: itemsData,
          },
        },
        include: { items: true },
      });

      return invoice;
    }),

  // Enviar para autorização (simular SEFAZ)
  authorize: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const invoice = await ctx.prisma.issuedInvoice.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nota fiscal não encontrada" });
      }

      if (invoice.status !== "DRAFT") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "NF não está em rascunho" });
      }

      // Simular autorização SEFAZ (em produção, integrar com webservice)
      const accessKey = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${Math.random().toString().slice(2, 46)}`;
      const protocolNumber = `${Date.now()}`;

      const updated = await ctx.prisma.issuedInvoice.update({
        where: { id: input.id },
        data: {
          status: "AUTHORIZED",
          accessKey,
          protocolNumber,
          authorizedAt: new Date(),
        },
      });

      // Atualizar status do pedido se houver
      if (invoice.salesOrderId) {
        await ctx.prisma.salesOrder.update({
          where: { id: invoice.salesOrderId },
          data: {
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: new Date(),
          },
        });
      }

      return updated;
    }),

  // Cancelar NF
  cancel: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().min(15, "Motivo deve ter pelo menos 15 caracteres"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const invoice = await ctx.prisma.issuedInvoice.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nota fiscal não encontrada" });
      }

      if (!["DRAFT", "AUTHORIZED"].includes(invoice.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "NF não pode ser cancelada neste status" });
      }

      // Verificar prazo de cancelamento (24h para NF autorizada)
      if (invoice.status === "AUTHORIZED" && invoice.authorizedAt) {
        const hoursElapsed = (Date.now() - invoice.authorizedAt.getTime()) / (1000 * 60 * 60);
        if (hoursElapsed > 24) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Prazo de 24h para cancelamento expirado" });
        }
      }

      return ctx.prisma.issuedInvoice.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: input.reason,
        },
      });
    }),

  // Carta de correção
  correction: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        correctionText: z.string().min(15, "Correção deve ter pelo menos 15 caracteres"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const invoice = await ctx.prisma.issuedInvoice.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nota fiscal não encontrada" });
      }

      if (invoice.status !== "AUTHORIZED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Apenas NF autorizadas podem receber carta de correção" });
      }

      const nextSeq = (invoice.correctionSeq ?? 0) + 1;
      if (nextSeq > 20) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Limite de 20 cartas de correção atingido" });
      }

      return ctx.prisma.issuedInvoice.update({
        where: { id: input.id },
        data: {
          correctionSeq: nextSeq,
          lastCorrection: input.correctionText,
          lastCorrectionAt: new Date(),
        },
      });
    }),

  // Gerar parcelas (contas a receber)
  generateReceivables: tenantProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        installments: z.array(
          z.object({
            dueDate: z.string(),
            value: z.number().positive(),
          })
        ).min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const invoice = await ctx.prisma.issuedInvoice.findFirst({
        where: { id: input.invoiceId, companyId: ctx.companyId },
        include: { receivables: true },
      });

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nota fiscal não encontrada" });
      }

      if (invoice.receivables.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "NF já possui parcelas geradas" });
      }

      // Validar soma das parcelas
      const totalInstallments = input.installments.reduce((sum, i) => sum + i.value, 0);
      if (Math.abs(totalInstallments - Number(invoice.totalValue)) > 0.01) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Soma das parcelas difere do valor total da NF" });
      }

      // Criar parcelas
      const receivables = await Promise.all(
        input.installments.map((inst, index) =>
          ctx.prisma.accountsReceivable.create({
            data: {
              code: Date.now() + index,
              companyId: ctx.companyId,
              customerId: invoice.customerId,
              issuedInvoiceId: invoice.id,
              documentNumber: invoice.invoiceNumber,
              installmentNumber: index + 1,
              totalInstallments: input.installments.length,
              dueDate: new Date(inst.dueDate),
              netValue: inst.value,
              originalValue: inst.value,
              status: "PENDING",
              description: `NF ${invoice.invoiceNumber} - Parcela ${index + 1}/${input.installments.length}`,
            },
          })
        )
      );

      return receivables;
    }),

  // Dashboard de faturamento
  dashboard: tenantProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalInvoices,
      draftInvoices,
      monthlyInvoices,
      monthlyRevenue,
      yearlyRevenue,
      byStatus,
    ] = await Promise.all([
      ctx.prisma.issuedInvoice.count({ where: { companyId: ctx.companyId } }),
      ctx.prisma.issuedInvoice.count({
        where: { companyId: ctx.companyId, status: "DRAFT" },
      }),
      ctx.prisma.issuedInvoice.count({
        where: {
          companyId: ctx.companyId,
          issueDate: { gte: startOfMonth },
          status: "AUTHORIZED",
        },
      }),
      ctx.prisma.issuedInvoice.aggregate({
        where: {
          companyId: ctx.companyId,
          issueDate: { gte: startOfMonth },
          status: "AUTHORIZED",
        },
        _sum: { totalValue: true },
      }),
      ctx.prisma.issuedInvoice.aggregate({
        where: {
          companyId: ctx.companyId,
          issueDate: { gte: startOfYear },
          status: "AUTHORIZED",
        },
        _sum: { totalValue: true },
      }),
      ctx.prisma.issuedInvoice.groupBy({
        by: ["status"],
        where: { companyId: ctx.companyId },
        _count: true,
        _sum: { totalValue: true },
      }),
    ]);

    return {
      totalInvoices,
      draftInvoices,
      monthlyInvoices,
      monthlyRevenue: monthlyRevenue._sum?.totalValue ?? 0,
      yearlyRevenue: yearlyRevenue._sum?.totalValue ?? 0,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
        value: s._sum?.totalValue ?? 0,
      })),
    };
  }),
});
