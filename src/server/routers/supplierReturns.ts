import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { auditCreate, auditUpdate, auditDelete } from "../services/audit";

const returnReasonEnum = z.enum([
  "QUALITY_ISSUE",
  "WRONG_PRODUCT",
  "WRONG_QUANTITY",
  "DAMAGED",
  "EXPIRED",
  "NOT_ORDERED",
  "PRICE_DIFFERENCE",
  "OTHER",
]);

const returnStatusEnum = z.enum([
  "DRAFT",
  "PENDING",
  "APPROVED",
  "INVOICED",
  "COMPLETED",
  "CANCELLED",
]);

const returnItemSchema = z.object({
  materialId: z.string().uuid(),
  receivedInvoiceItemId: z.string().uuid().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  reason: returnReasonEnum,
  reasonNotes: z.string().optional(),
  stockLocationId: z.string().uuid().optional(),
});

export const supplierReturnsRouter = createTRPCRouter({
  // Listar devoluções
  list: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: returnStatusEnum.optional(),
        supplierId: z.string().uuid().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, status, supplierId, startDate, endDate, page, pageSize } = input;

      const where = {
        companyId: ctx.companyId,
        ...(status && { status }),
        ...(supplierId && { supplierId }),
        ...((startDate || endDate) && {
          returnDate: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        }),
        ...(search && {
          OR: [
            { supplier: { companyName: { contains: search, mode: "insensitive" as const } } },
            { notes: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [data, total] = await Promise.all([
        ctx.prisma.supplierReturn.findMany({
          where,
          include: {
            supplier: { select: { id: true, code: true, companyName: true, cnpj: true } },
            receivedInvoice: { select: { id: true, invoiceNumber: true, series: true, accessKey: true } },
            items: {
              include: {
                material: { select: { id: true, code: true, description: true, unit: true } },
              },
            },
          },
          orderBy: { returnDate: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.prisma.supplierReturn.count({ where }),
      ]);

      return {
        data,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  // Buscar por ID
  getById: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supplierReturn = await ctx.prisma.supplierReturn.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          supplier: true,
          receivedInvoice: {
            include: {
              items: {
                include: {
                  material: { select: { id: true, code: true, description: true, unit: true } },
                },
              },
            },
          },
          items: {
            include: {
              material: { select: { id: true, code: true, description: true, unit: true } },
              stockLocation: { select: { id: true, code: true, name: true } },
            },
          },
        },
      });

      if (!supplierReturn) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Devolução não encontrada" });
      }

      return supplierReturn;
    }),

  // Criar devolução
  create: tenantProcedure
    .input(
      z.object({
        supplierId: z.string().uuid(),
        receivedInvoiceId: z.string().uuid().optional(),
        returnDate: z.date().optional(),
        notes: z.string().optional(),
        items: z.array(returnItemSchema).min(1, "Adicione pelo menos um item"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supplierId, receivedInvoiceId, returnDate, notes, items } = input;

      // Verificar fornecedor
      const supplier = await ctx.prisma.supplier.findFirst({
        where: { id: supplierId, companyId: ctx.companyId },
      });

      if (!supplier) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Fornecedor não encontrado" });
      }

      // Verificar NFe de origem (se informada)
      if (receivedInvoiceId) {
        const invoice = await ctx.prisma.receivedInvoice.findFirst({
          where: { id: receivedInvoiceId, companyId: ctx.companyId },
        });

        if (!invoice) {
          throw new TRPCError({ code: "NOT_FOUND", message: "NFe de origem não encontrada" });
        }
      }

      // Validar materiais pertencem ao tenant
      const materialIds = items.map((item) => item.materialId);
      const materials = await ctx.prisma.material.findMany({
        where: { id: { in: materialIds }, companyId: ctx.companyId },
        select: { id: true },
      });

      if (materials.length !== materialIds.length) {
        const foundIds = new Set(materials.map((m) => m.id));
        const missingIds = materialIds.filter((id) => !foundIds.has(id));
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Materiais não encontrados ou não pertencem à empresa: ${missingIds.join(", ")}`,
        });
      }

      // Calcular total
      const totalValue = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

      // Criar devolução
      const supplierReturn = await ctx.prisma.supplierReturn.create({
        data: {
          supplierId,
          receivedInvoiceId,
          returnDate: returnDate ?? new Date(),
          notes,
          totalValue,
          status: "DRAFT",
          companyId: ctx.companyId,
          createdBy: ctx.tenant.userId ?? undefined,
          items: {
            create: items.map((item) => ({
              materialId: item.materialId,
              receivedInvoiceItemId: item.receivedInvoiceItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              reason: item.reason,
              reasonNotes: item.reasonNotes,
              stockLocationId: item.stockLocationId,
            })),
          },
        },
        include: {
          supplier: { select: { companyName: true } },
          items: { include: { material: { select: { description: true } } } },
        },
      });

      await auditCreate("SupplierReturn", supplierReturn, String(supplierReturn.returnNumber), {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return supplierReturn;
    }),

  // Atualizar devolução (apenas rascunho)
  update: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        supplierId: z.string().uuid().optional(),
        receivedInvoiceId: z.string().uuid().nullable().optional(),
        returnDate: z.date().optional(),
        notes: z.string().optional(),
        items: z.array(returnItemSchema).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, items, ...data } = input;

      const existing = await ctx.prisma.supplierReturn.findFirst({
        where: { id, companyId: ctx.companyId },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Devolução não encontrada" });
      }

      if (existing.status !== "DRAFT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Apenas devoluções em rascunho podem ser editadas",
        });
      }

      // Atualizar itens se fornecidos
      if (items) {
        const totalValue = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

        const updated = await ctx.prisma.$transaction(async (tx) => {
          // Remover itens existentes
          await tx.supplierReturnItem.deleteMany({ where: { returnId: id } });

          // Atualizar devolução com novos itens
          return tx.supplierReturn.update({
            where: { id },
            data: {
              ...data,
              totalValue,
              items: {
                create: items.map((item) => ({
                  materialId: item.materialId,
                  receivedInvoiceItemId: item.receivedInvoiceItemId,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.quantity * item.unitPrice,
                  reason: item.reason,
                  reasonNotes: item.reasonNotes,
                  stockLocationId: item.stockLocationId,
                })),
              },
            },
            include: {
              supplier: { select: { companyName: true } },
              items: { include: { material: { select: { description: true } } } },
            },
          });
        });

        await auditUpdate("SupplierReturn", existing.id, String(updated.returnNumber), existing, updated, {
          userId: ctx.tenant.userId ?? undefined,
          companyId: ctx.companyId,
        });

        return updated;
      }

      // Atualizar apenas dados básicos
      const updated = await ctx.prisma.supplierReturn.update({
        where: { id },
        data,
        include: {
          supplier: { select: { companyName: true } },
          items: { include: { material: { select: { description: true } } } },
        },
      });

      await auditUpdate("SupplierReturn", existing.id, String(updated.returnNumber), existing, updated, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return updated;
    }),

  // Enviar para aprovação
  submit: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.supplierReturn.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: { items: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Devolução não encontrada" });
      }

      if (existing.status !== "DRAFT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Apenas devoluções em rascunho podem ser enviadas para aprovação",
        });
      }

      if (existing.items.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Adicione pelo menos um item antes de enviar para aprovação",
        });
      }

      const updated = await ctx.prisma.supplierReturn.update({
        where: { id: input.id },
        data: { status: "PENDING" },
      });

      await auditUpdate("SupplierReturn", existing.id, String(updated.returnNumber), existing, updated, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return updated;
    }),

  // Aprovar devolução
  approve: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.supplierReturn.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: { items: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Devolução não encontrada" });
      }

      if (existing.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Apenas devoluções pendentes podem ser aprovadas",
        });
      }

      // Executar todas as operações em transação (validação de estoque dentro da tx)
      const updated = await ctx.prisma.$transaction(async (tx) => {
        // Baixar estoque dos itens
        for (const item of existing.items) {
          const inventory = await tx.inventory.findFirst({
            where: { materialId: item.materialId, companyId: ctx.companyId },
          });

          if (!inventory || inventory.quantity < item.quantity) {
            const material = await tx.material.findUnique({
              where: { id: item.materialId },
              select: { description: true },
            });
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Estoque insuficiente para o material: ${material?.description || item.materialId}`,
            });
          }

          {
            // Baixar estoque
            await tx.inventory.update({
              where: { id: inventory.id },
              data: { quantity: { decrement: item.quantity } },
            });

            // Registrar movimento
            await tx.inventoryMovement.create({
              data: {
                inventoryId: inventory.id,
                movementType: "EXIT",
                quantity: item.quantity,
                unitCost: item.unitPrice,
                totalCost: item.totalPrice,
                documentType: "SUPPLIER_RETURN",
                documentNumber: String(existing.returnNumber),
                documentId: existing.id,
                supplierId: existing.supplierId,
                notes: `Devolução a fornecedor #${existing.returnNumber}`,
              },
            });
          }
        }

        // Atualizar status
        return tx.supplierReturn.update({
          where: { id: input.id },
          data: {
            status: "APPROVED",
            approvedAt: new Date(),
            approvedBy: ctx.tenant.userId ?? undefined,
          },
        });
      });

      await auditUpdate("SupplierReturn", existing.id, String(updated.returnNumber), existing, updated, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return updated;
    }),

  // Marcar como faturada (NFe de devolução emitida)
  markAsInvoiced: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        returnInvoiceNumber: z.number().int().positive(),
        returnInvoiceKey: z.string().length(44).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.supplierReturn.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Devolução não encontrada" });
      }

      if (existing.status !== "APPROVED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Apenas devoluções aprovadas podem ser marcadas como faturadas",
        });
      }

      const updated = await ctx.prisma.supplierReturn.update({
        where: { id: input.id },
        data: {
          status: "INVOICED",
          invoicedAt: new Date(),
          returnInvoiceNumber: input.returnInvoiceNumber,
          returnInvoiceKey: input.returnInvoiceKey,
        },
      });

      await auditUpdate("SupplierReturn", existing.id, String(updated.returnNumber), existing, updated, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return updated;
    }),

  // Concluir devolução
  complete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.supplierReturn.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Devolução não encontrada" });
      }

      if (existing.status !== "INVOICED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Apenas devoluções faturadas podem ser concluídas",
        });
      }

      // Executar todas as operações em transação
      const updated = await ctx.prisma.$transaction(async (tx) => {
        // Gerar crédito no contas a pagar (se houver NFe de origem vinculada)
        if (existing.receivedInvoiceId) {
          const invoice = await tx.receivedInvoice.findUnique({
            where: { id: existing.receivedInvoiceId },
          });

          if (invoice) {
            // Criar crédito (valor negativo)
            const lastPayable = await tx.accountsPayable.findFirst({
              where: { companyId: ctx.companyId },
              orderBy: { code: "desc" },
              select: { code: true },
            });
            const nextCode = (lastPayable?.code ?? 0) + 1;

            await tx.accountsPayable.create({
              data: {
                code: nextCode,
                supplierId: existing.supplierId,
                invoiceId: existing.receivedInvoiceId,
                documentType: "OTHER",
                documentNumber: String(existing.returnInvoiceNumber),
                description: `Crédito ref. devolução #${existing.returnNumber}`,
                originalValue: -existing.totalValue,
                netValue: -existing.totalValue,
                dueDate: new Date(),
                status: "PAID",
                paidAt: new Date(),
                paidValue: -existing.totalValue,
                companyId: ctx.companyId,
              },
            });
          }
        }

        return tx.supplierReturn.update({
          where: { id: input.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
      });

      await auditUpdate("SupplierReturn", existing.id, String(updated.returnNumber), existing, updated, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return updated;
    }),

  // Cancelar devolução
  cancel: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        reason: z.string().min(1, "Informe o motivo do cancelamento"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.supplierReturn.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: { items: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Devolução não encontrada" });
      }

      if (existing.status === "COMPLETED" || existing.status === "CANCELLED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta devolução não pode ser cancelada",
        });
      }

      // Executar todas as operações em transação
      const updated = await ctx.prisma.$transaction(async (tx) => {
        // Se já foi aprovada, estornar estoque
        if (existing.status === "APPROVED" || existing.status === "INVOICED") {
          for (const item of existing.items) {
            // Buscar inventário
            const inventory = await tx.inventory.findFirst({
              where: { materialId: item.materialId, companyId: ctx.companyId },
            });

            if (inventory) {
              // Estornar estoque
              await tx.inventory.update({
                where: { id: inventory.id },
                data: { quantity: { increment: item.quantity } },
              });

              // Registrar movimento de estorno
              await tx.inventoryMovement.create({
                data: {
                  inventoryId: inventory.id,
                  movementType: "ENTRY",
                  quantity: item.quantity,
                  unitCost: item.unitPrice,
                  totalCost: item.totalPrice,
                  documentType: "SUPPLIER_RETURN_CANCEL",
                  documentNumber: String(existing.returnNumber),
                  documentId: existing.id,
                  supplierId: existing.supplierId,
                  notes: `Estorno - Cancelamento devolução #${existing.returnNumber}`,
                },
              });
            }
          }
        }

        return tx.supplierReturn.update({
          where: { id: input.id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancelledBy: ctx.tenant.userId ?? undefined,
            cancellationReason: input.reason,
          },
        });
      });

      await auditUpdate("SupplierReturn", existing.id, String(updated.returnNumber), existing, updated, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return updated;
    }),

  // Excluir devolução (apenas rascunho)
  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.supplierReturn.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Devolução não encontrada" });
      }

      if (existing.status !== "DRAFT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Apenas devoluções em rascunho podem ser excluídas",
        });
      }

      await ctx.prisma.supplierReturn.delete({ where: { id: input.id } });

      await auditDelete("SupplierReturn", existing, String(existing.returnNumber), {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return { success: true };
    }),

  // Motivos de devolução (para dropdown)
  getReasons: tenantProcedure.query(() => {
    return [
      { value: "QUALITY_ISSUE", label: "Problema de Qualidade" },
      { value: "WRONG_PRODUCT", label: "Produto Errado" },
      { value: "WRONG_QUANTITY", label: "Quantidade Errada" },
      { value: "DAMAGED", label: "Avariado/Danificado" },
      { value: "EXPIRED", label: "Vencido" },
      { value: "NOT_ORDERED", label: "Não Solicitado" },
      { value: "PRICE_DIFFERENCE", label: "Diferença de Preço" },
      { value: "OTHER", label: "Outro Motivo" },
    ];
  }),

  // Estatísticas
  stats: tenantProcedure.query(async ({ ctx }) => {
    const [total, byStatus, byMonth] = await Promise.all([
      ctx.prisma.supplierReturn.count({ where: { companyId: ctx.companyId } }),
      ctx.prisma.supplierReturn.groupBy({
        by: ["status"],
        where: { companyId: ctx.companyId },
        _count: true,
        _sum: { totalValue: true },
      }),
      ctx.prisma.$queryRaw<Array<{ month: string; count: bigint; total: number }>>`
        SELECT 
          TO_CHAR("returnDate", 'YYYY-MM') as month,
          COUNT(*) as count,
          COALESCE(SUM("totalValue"), 0)::float as total
        FROM supplier_returns
        WHERE "companyId" = ${ctx.companyId}::uuid
        AND "returnDate" >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY TO_CHAR("returnDate", 'YYYY-MM')
        ORDER BY month DESC
      `,
    ]);

    return {
      total,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
        total: s._sum.totalValue || 0,
      })),
      byMonth: byMonth.map((m) => ({
        month: m.month,
        count: Number(m.count),
        total: m.total,
      })),
    };
  }),
});
