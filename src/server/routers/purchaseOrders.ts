import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { auditCreate, auditUpdate, auditDelete } from "../services/audit";
import { emitEvent } from "../services/events";
import { startWorkflowForEntity, getWorkflowStatus, requiresApproval } from "@/lib/workflow-integration";

export const purchaseOrdersRouter = createTRPCRouter({
  // Listar pedidos de compra
  list: tenantProcedure
    .input(
      z.object({
        supplierId: z.string().optional(),
        status: z.enum(["DRAFT", "PENDING", "APPROVED", "SENT", "PARTIAL", "COMPLETED", "CANCELLED"]).optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { supplierId, status, search, page = 1, limit = 20 } = input ?? {};

      const where = {
        ...tenantFilter(ctx.companyId, false),
        ...(supplierId && { supplierId }),
        ...(status && { status }),
        ...(search && {
          OR: [
            { supplier: { companyName: { contains: search, mode: "insensitive" as const } } },
            { notes: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [orders, total] = await Promise.all([
        ctx.prisma.purchaseOrder.findMany({
          where,
          include: {
            supplier: {
              select: {
                id: true,
                code: true,
                companyName: true,
                tradeName: true,
              },
            },
            quote: {
              select: {
                id: true,
                code: true,
              },
            },
            _count: {
              select: { items: true },
            },
          },
          orderBy: { orderDate: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.purchaseOrder.count({ where }),
      ]);

      return {
        orders,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Buscar pedido por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.purchaseOrder.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId, false),
        },
        include: {
          supplier: true,
          quote: true,
          items: {
            include: {
              material: {
                include: { category: true },
              },
              quoteItem: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }),

  // Criar pedido de compra a partir de cotação aprovada
  createFromQuote: tenantProcedure
    .input(
      z.object({
        quoteId: z.string(),
        expectedDeliveryDate: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Buscar cotação aprovada
      const quote = await ctx.prisma.quote.findFirst({
        where: {
          id: input.quoteId,
          status: "APPROVED",
          supplier: { ...tenantFilter(ctx.companyId, true) },
        },
        include: {
          supplier: true,
          items: {
            include: { material: true },
          },
        },
      });

      if (!quote) {
        throw new Error("Cotação não encontrada ou não está aprovada");
      }

      // Gerar próximo código
      const lastOrder = await ctx.prisma.purchaseOrder.findFirst({
        orderBy: { code: "desc" },
      });
      const nextCode = (lastOrder?.code ?? 0) + 1;

      // Criar pedido de compra
      const order = await ctx.prisma.purchaseOrder.create({
        data: {
          code: nextCode,
          supplierId: quote.supplierId,
          quoteId: quote.id,
          status: "DRAFT",
          expectedDeliveryDate: input.expectedDeliveryDate,
          paymentTerms: quote.paymentTerms,
          deliveryTerms: quote.deliveryTerms,
          freightValue: quote.freightValue,
          discountPercent: quote.discountPercent,
          totalValue: quote.totalValue,
          notes: input.notes,
          companyId: ctx.companyId,
          items: {
            create: quote.items.map((item) => ({
              materialId: item.materialId,
              quoteItemId: item.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              deliveryDays: item.deliveryDays,
              notes: item.notes,
            })),
          },
        },
        include: {
          supplier: true,
          items: {
            include: { material: true },
          },
        },
      });

      await auditCreate("PurchaseOrder", order, String(order.code), {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return order;
    }),

  // Criar pedido de compra manual
  create: tenantProcedure
    .input(
      z.object({
        supplierId: z.string(),
        expectedDeliveryDate: z.date().optional(),
        paymentTerms: z.string().optional(),
        deliveryTerms: z.string().optional(),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            materialId: z.string(),
            quantity: z.number().min(0.01),
            unitPrice: z.number().min(0),
            deliveryDays: z.number().optional(),
            notes: z.string().optional(),
          })
        ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { items, ...orderData } = input;

      // Gerar próximo código
      const lastOrder = await ctx.prisma.purchaseOrder.findFirst({
        orderBy: { code: "desc" },
      });
      const nextCode = (lastOrder?.code ?? 0) + 1;

      // Calcular totais
      const itemsWithTotals = items.map((item) => ({
        ...item,
        totalPrice: item.unitPrice * item.quantity,
      }));
      const totalValue = itemsWithTotals.reduce((sum, item) => sum + item.totalPrice, 0);

      const order = await ctx.prisma.purchaseOrder.create({
        data: {
          code: nextCode,
          ...orderData,
          totalValue,
          companyId: ctx.companyId,
          items: {
            create: itemsWithTotals,
          },
        },
        include: {
          supplier: true,
          items: {
            include: { material: true },
          },
        },
      });

      await auditCreate("PurchaseOrder", order, String(order.code), {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      // Emitir evento de pedido criado
      emitEvent("purchaseOrder.created", {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId ?? undefined,
      }, {
        orderId: order.id,
        code: order.code,
        supplierName: order.supplier.companyName,
        totalValue: order.totalValue,
      });

      return order;
    }),

  // Atualizar status do pedido
  updateStatus: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["DRAFT", "PENDING", "APPROVED", "SENT", "PARTIAL", "COMPLETED", "CANCELLED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const oldOrder = await ctx.prisma.purchaseOrder.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!oldOrder) {
        throw new Error("Pedido não encontrado ou sem permissão");
      }

      const order = await ctx.prisma.purchaseOrder.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      await auditUpdate("PurchaseOrder", input.id, String(order.code), oldOrder, order, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      // Emitir evento se status mudou para APPROVED ou SENT
      if (input.status !== oldOrder.status) {
        const eventType = input.status === "APPROVED" ? "purchaseOrder.approved"
          : input.status === "SENT" ? "purchaseOrder.sent"
          : null;

        if (eventType) {
          const supplier = await ctx.prisma.supplier.findUnique({
            where: { id: order.supplierId },
          });
          emitEvent(eventType, {
            userId: ctx.tenant.userId ?? undefined,
            companyId: ctx.companyId ?? undefined,
          }, {
            orderId: order.id,
            code: order.code,
            supplierName: supplier?.companyName || "Fornecedor",
            totalValue: order.totalValue,
          });
        }
      }

      return order;
    }),

  // Registrar recebimento parcial (com entrada automática no estoque)
  registerReceipt: tenantProcedure
    .input(
      z.object({
        itemId: z.string(),
        receivedQty: z.number().min(0.01),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.purchaseOrderItem.findUnique({
        where: { id: input.itemId },
        include: {
          purchaseOrder: {
            include: { supplier: true },
          },
          material: true,
        },
      });

      if (!item) {
        throw new Error("Item não encontrado");
      }

      const newReceivedQty = item.receivedQty + input.receivedQty;

      // Atualizar quantidade recebida do item
      const updatedItem = await ctx.prisma.purchaseOrderItem.update({
        where: { id: input.itemId },
        data: { receivedQty: newReceivedQty },
      });

      // === INTEGRAÇÃO COM ESTOQUE ===
      // Buscar ou criar registro de estoque para o material
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

      // Calcular novo saldo
      const newQuantity = inventory.quantity + input.receivedQty;
      const totalCost = input.receivedQty * item.unitPrice;

      // Criar movimento de entrada
      await ctx.prisma.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          movementType: "ENTRY",
          quantity: input.receivedQty,
          unitCost: item.unitPrice,
          totalCost,
          balanceAfter: newQuantity,
          documentType: "PURCHASE_ORDER",
          documentNumber: `PC-${item.purchaseOrder.code.toString().padStart(6, "0")}`,
          supplierId: item.purchaseOrder.supplierId,
          notes: `Recebimento do pedido PC-${item.purchaseOrder.code.toString().padStart(6, "0")}`,
        },
      });

      // Atualizar saldo do estoque
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

      // Atualizar preço da última compra no material
      await ctx.prisma.material.update({
        where: { id: item.materialId },
        data: {
          lastPurchasePrice: item.unitPrice,
          lastPurchaseDate: new Date(),
        },
      });

      // Verificar se todos os itens foram recebidos
      const allItems = await ctx.prisma.purchaseOrderItem.findMany({
        where: { purchaseOrderId: item.purchaseOrderId },
      });

      const allReceived = allItems.every((i: { id: string; quantity: number; receivedQty: number }) => 
        i.id === input.itemId 
          ? newReceivedQty >= i.quantity 
          : i.receivedQty >= i.quantity
      );

      const anyReceived = allItems.some((i: { id: string; receivedQty: number }) => 
        i.id === input.itemId 
          ? newReceivedQty > 0 
          : i.receivedQty > 0
      );

      // Atualizar status do pedido
      let newStatus = item.purchaseOrder.status;
      if (allReceived) {
        newStatus = "COMPLETED";
      } else if (anyReceived) {
        newStatus = "PARTIAL";
      }

      if (newStatus !== item.purchaseOrder.status) {
        await ctx.prisma.purchaseOrder.update({
          where: { id: item.purchaseOrderId },
          data: { 
            status: newStatus,
            actualDeliveryDate: allReceived ? new Date() : undefined,
          },
        });
      }

      return updatedItem;
    }),

  // Deletar pedido
  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.prisma.purchaseOrder.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId, false),
          status: "DRAFT",
        },
      });

      if (!order) {
        throw new Error("Pedido não encontrado ou não pode ser excluído");
      }

      const deleted = await ctx.prisma.purchaseOrder.delete({
        where: { id: input.id },
      });

      await auditDelete("PurchaseOrder", order, String(order.code), {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return deleted;
    }),

  // Estatísticas
  stats: tenantProcedure
    .query(async ({ ctx }) => {
      const [total, byStatus, recentOrders] = await Promise.all([
        ctx.prisma.purchaseOrder.count({
          where: tenantFilter(ctx.companyId, false),
        }),
        ctx.prisma.purchaseOrder.groupBy({
          by: ["status"],
          where: tenantFilter(ctx.companyId, false),
          _count: true,
          _sum: { totalValue: true },
        }),
        ctx.prisma.purchaseOrder.findMany({
          where: tenantFilter(ctx.companyId, false),
          include: { supplier: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

      return {
        total,
        byStatus: byStatus.map((s) => ({
          status: s.status,
          count: s._count,
          totalValue: s._sum.totalValue ?? 0,
        })),
        recentOrders,
      };
    }),

  // ============================================================================
  // INTEGRAÇÃO COM WORKFLOWS
  // ============================================================================

  // Enviar pedido para aprovação via workflow
  submitForApproval: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.prisma.purchaseOrder.findFirst({
        where: {
          id: input.id,
          ...tenantFilter(ctx.companyId, false),
        },
        include: { supplier: true },
      });

      if (!order) {
        throw new Error("Pedido não encontrado");
      }

      if (order.status !== "DRAFT") {
        throw new Error("Apenas pedidos em rascunho podem ser enviados para aprovação");
      }

      // Verificar se requer aprovação baseado no valor
      const approval = await requiresApproval(ctx.companyId!, "PURCHASE_ORDER", order.totalValue);

      if (!approval.required) {
        // Não requer aprovação - aprovar diretamente
        const updated = await ctx.prisma.purchaseOrder.update({
          where: { id: input.id },
          data: { status: "APPROVED" },
        });

        await auditUpdate("PurchaseOrder", input.id, String(order.code), order, updated, {
          userId: ctx.tenant.userId ?? undefined,
          companyId: ctx.companyId,
        });

        return { 
          success: true, 
          status: "APPROVED", 
          message: "Pedido aprovado automaticamente (não requer aprovação)" 
        };
      }

      // Iniciar workflow de aprovação
      const result = await startWorkflowForEntity({
        companyId: ctx.companyId!,
        entityType: "PURCHASE_ORDER",
        entityId: input.id,
        startedBy: ctx.tenant.userId!,
        workflowCode: approval.workflowCode,
        data: {
          orderCode: order.code,
          supplierName: order.supplier.companyName,
          totalValue: order.totalValue,
        },
      });

      if (!result.success) {
        throw new Error(result.error || "Erro ao iniciar workflow");
      }

      // Atualizar status do pedido para PENDING
      await ctx.prisma.purchaseOrder.update({
        where: { id: input.id },
        data: { status: "PENDING" },
      });

      await auditUpdate("PurchaseOrder", input.id, String(order.code), order, { ...order, status: "PENDING" }, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      emitEvent("purchaseOrder.submittedForApproval", {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId ?? undefined,
      }, {
        orderId: order.id,
        code: order.code,
        supplierName: order.supplier.companyName,
        totalValue: order.totalValue,
        workflowCode: result.instanceCode,
      });

      return { 
        success: true, 
        status: "PENDING", 
        workflowInstanceId: result.instanceId,
        workflowCode: result.instanceCode,
        message: "Pedido enviado para aprovação" 
      };
    }),

  // Obter status do workflow de um pedido
  getWorkflowStatus: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return getWorkflowStatus(ctx.companyId!, "PURCHASE_ORDER", input.id);
    }),
});
