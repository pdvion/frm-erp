import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";

export const impexRouter = createTRPCRouter({
  // ==========================================================================
  // PORTS (Portos)
  // ==========================================================================

  listPorts: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        country: z.string().optional(),
        type: z.enum(["MARITIME", "AIRPORT", "BORDER"]).optional(),
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search, country, type, isActive } = input ?? {};

      const where = {
        OR: [
          { companyId: ctx.companyId },
          { isShared: true },
        ],
        ...(search && {
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(country && { country }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive }),
      };

      return ctx.prisma.port.findMany({
        where,
        orderBy: [{ country: "asc" }, { name: "asc" }],
      });
    }),

  createPort: tenantProcedure
    .input(
      z.object({
        code: z.string().min(3).max(10),
        name: z.string().min(2),
        country: z.string().length(2),
        type: z.enum(["MARITIME", "AIRPORT", "BORDER"]),
        isShared: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.port.create({
        data: {
          ...input,
          companyId: input.isShared ? null : ctx.companyId,
        },
      });
    }),

  updatePort: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        code: z.string().min(3).max(10).optional(),
        name: z.string().min(2).optional(),
        country: z.string().length(2).optional(),
        type: z.enum(["MARITIME", "AIRPORT", "BORDER"]).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.port.update({
        where: { id },
        data,
      });
    }),

  deletePort: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.port.delete({
        where: { id: input.id },
      });
    }),

  // ==========================================================================
  // CUSTOMS BROKERS (Despachantes Aduaneiros)
  // ==========================================================================

  listBrokers: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search, isActive } = input ?? {};

      const where = {
        ...tenantFilter(ctx.companyId, false),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { cnpj: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(isActive !== undefined && { isActive }),
      };

      return ctx.prisma.customsBroker.findMany({
        where,
        orderBy: { name: "asc" },
      });
    }),

  createBroker: tenantProcedure
    .input(
      z.object({
        name: z.string().min(2),
        cnpj: z.string().min(14).max(18),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.customsBroker.create({
        data: {
          ...input,
          companyId: ctx.companyId,
        },
      });
    }),

  updateBroker: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(2).optional(),
        cnpj: z.string().min(14).max(18).optional(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.customsBroker.update({
        where: { id },
        data,
      });
    }),

  deleteBroker: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.customsBroker.delete({
        where: { id: input.id },
      });
    }),

  // ==========================================================================
  // CARGO TYPES (Tipos de Carga)
  // ==========================================================================

  listCargoTypes: tenantProcedure
    .input(
      z.object({
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { isActive } = input ?? {};

      return ctx.prisma.cargoType.findMany({
        where: {
          ...(isActive !== undefined && { isActive }),
        },
        orderBy: { code: "asc" },
      });
    }),

  createCargoType: tenantProcedure
    .input(
      z.object({
        code: z.string().min(2).max(10),
        name: z.string().min(2),
        description: z.string().optional(),
        isShared: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.cargoType.create({
        data: input,
      });
    }),

  updateCargoType: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        code: z.string().min(2).max(10).optional(),
        name: z.string().min(2).optional(),
        description: z.string().optional().nullable(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.cargoType.update({
        where: { id },
        data,
      });
    }),

  deleteCargoType: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.cargoType.delete({
        where: { id: input.id },
      });
    }),

  // ==========================================================================
  // INCOTERMS
  // ==========================================================================

  listIncoterms: tenantProcedure
    .input(
      z.object({
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { isActive } = input ?? {};

      return ctx.prisma.incoterm.findMany({
        where: {
          ...(isActive !== undefined && { isActive }),
        },
        orderBy: { code: "asc" },
      });
    }),

  createIncoterm: tenantProcedure
    .input(
      z.object({
        code: z.string().min(2).max(10),
        name: z.string().min(2),
        description: z.string().optional(),
        isShared: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.incoterm.create({
        data: input,
      });
    }),

  updateIncoterm: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        code: z.string().min(2).max(10).optional(),
        name: z.string().min(2).optional(),
        description: z.string().optional().nullable(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.incoterm.update({
        where: { id },
        data,
      });
    }),

  deleteIncoterm: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.incoterm.delete({
        where: { id: input.id },
      });
    }),

  // ==========================================================================
  // IMPORT PROCESSES (Processos de Importação)
  // ==========================================================================

  listProcesses: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum([
          "DRAFT", "PENDING_SHIPMENT", "IN_TRANSIT", "ARRIVED",
          "IN_CLEARANCE", "CLEARED", "DELIVERED", "CANCELLED"
        ]).optional(),
        supplierId: z.string().uuid().optional(),
        brokerId: z.string().uuid().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search, status, supplierId, brokerId, dateFrom, dateTo } = input ?? {};

      return ctx.prisma.importProcess.findMany({
        where: {
          companyId: ctx.companyId,
          ...(search && {
            OR: [
              { processNumber: { contains: search, mode: "insensitive" as const } },
              { reference: { contains: search, mode: "insensitive" as const } },
              { blNumber: { contains: search, mode: "insensitive" as const } },
            ],
          }),
          ...(status && { status }),
          ...(supplierId && { supplierId }),
          ...(brokerId && { brokerId }),
          ...(dateFrom && { eta: { gte: new Date(dateFrom) } }),
          ...(dateTo && { eta: { lte: new Date(dateTo) } }),
        },
        include: {
          supplier: { select: { id: true, companyName: true } },
          broker: { select: { id: true, name: true } },
          incoterm: { select: { id: true, code: true } },
          cargoType: { select: { id: true, code: true, name: true } },
          originPort: { select: { id: true, code: true, name: true } },
          destPort: { select: { id: true, code: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getProcess: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.importProcess.findUnique({
        where: { id: input.id },
        include: {
          supplier: true,
          broker: true,
          incoterm: true,
          cargoType: true,
          originPort: true,
          destPort: true,
          items: {
            include: {
              material: { select: { id: true, code: true, description: true } },
              purchaseOrder: { select: { id: true, code: true } },
            },
          },
          events: { orderBy: { eventDate: "desc" } },
          costs: true,
        },
      });
    }),

  createProcess: tenantProcedure
    .input(
      z.object({
        processNumber: z.string().min(1),
        reference: z.string().optional(),
        supplierId: z.string().uuid(),
        brokerId: z.string().uuid().optional(),
        incotermId: z.string().uuid(),
        cargoTypeId: z.string().uuid(),
        originPortId: z.string().uuid(),
        destPortId: z.string().uuid(),
        invoiceValue: z.number().min(0),
        currency: z.string().default("USD"),
        exchangeRate: z.number().optional(),
        freightValue: z.number().optional(),
        insuranceValue: z.number().optional(),
        invoiceDate: z.string().optional(),
        invoiceNumber: z.string().optional(),
        etd: z.string().optional(),
        eta: z.string().optional(),
        blNumber: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.importProcess.create({
        data: {
          processNumber: input.processNumber,
          reference: input.reference,
          supplierId: input.supplierId,
          brokerId: input.brokerId,
          incotermId: input.incotermId,
          cargoTypeId: input.cargoTypeId,
          originPortId: input.originPortId,
          destPortId: input.destPortId,
          invoiceValue: input.invoiceValue,
          currency: input.currency,
          exchangeRate: input.exchangeRate,
          freightValue: input.freightValue,
          insuranceValue: input.insuranceValue,
          invoiceDate: input.invoiceDate ? new Date(input.invoiceDate) : null,
          invoiceNumber: input.invoiceNumber,
          etd: input.etd ? new Date(input.etd) : null,
          eta: input.eta ? new Date(input.eta) : null,
          blNumber: input.blNumber,
          notes: input.notes,
          companyId: ctx.companyId,
        },
      });
    }),

  updateProcess: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        processNumber: z.string().min(1).optional(),
        reference: z.string().optional().nullable(),
        supplierId: z.string().uuid().optional(),
        brokerId: z.string().uuid().optional().nullable(),
        incotermId: z.string().uuid().optional(),
        cargoTypeId: z.string().uuid().optional(),
        originPortId: z.string().uuid().optional(),
        destPortId: z.string().uuid().optional(),
        status: z.enum([
          "DRAFT", "PENDING_SHIPMENT", "IN_TRANSIT", "ARRIVED",
          "IN_CLEARANCE", "CLEARED", "DELIVERED", "CANCELLED"
        ]).optional(),
        invoiceValue: z.number().min(0).optional(),
        currency: z.string().optional(),
        exchangeRate: z.number().optional().nullable(),
        freightValue: z.number().optional().nullable(),
        insuranceValue: z.number().optional().nullable(),
        invoiceDate: z.string().optional().nullable(),
        invoiceNumber: z.string().optional().nullable(),
        etd: z.string().optional().nullable(),
        eta: z.string().optional().nullable(),
        arrivalDate: z.string().optional().nullable(),
        clearanceDate: z.string().optional().nullable(),
        blNumber: z.string().optional().nullable(),
        diNumber: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, invoiceDate, etd, eta, arrivalDate, clearanceDate, ...rest } = input;
      
      return ctx.prisma.importProcess.update({
        where: { id },
        data: {
          ...rest,
          ...(invoiceDate !== undefined && { invoiceDate: invoiceDate ? new Date(invoiceDate) : null }),
          ...(etd !== undefined && { etd: etd ? new Date(etd) : null }),
          ...(eta !== undefined && { eta: eta ? new Date(eta) : null }),
          ...(arrivalDate !== undefined && { arrivalDate: arrivalDate ? new Date(arrivalDate) : null }),
          ...(clearanceDate !== undefined && { clearanceDate: clearanceDate ? new Date(clearanceDate) : null }),
        },
      });
    }),

  deleteProcess: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.importProcess.delete({
        where: { id: input.id },
      });
    }),

  // ==========================================================================
  // IMPORT PROCESS ITEMS
  // ==========================================================================

  addProcessItem: tenantProcedure
    .input(
      z.object({
        processId: z.string().uuid(),
        materialId: z.string().uuid(),
        purchaseOrderId: z.string().uuid().optional(),
        quantity: z.number().min(0),
        unitPrice: z.number().min(0),
        ncm: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const totalPrice = input.quantity * input.unitPrice;
      
      return ctx.prisma.importProcessItem.create({
        data: {
          processId: input.processId,
          materialId: input.materialId,
          purchaseOrderId: input.purchaseOrderId,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          totalPrice,
          ncm: input.ncm,
          description: input.description,
        },
      });
    }),

  updateProcessItem: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        materialId: z.string().uuid().optional(),
        purchaseOrderId: z.string().uuid().optional().nullable(),
        quantity: z.number().min(0).optional(),
        unitPrice: z.number().min(0).optional(),
        ncm: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      // Get current item to recalculate total
      const current = await ctx.prisma.importProcessItem.findUnique({ where: { id } });
      if (!current) throw new Error("Item not found");
      
      const quantity = data.quantity ?? Number(current.quantity);
      const unitPrice = data.unitPrice ?? Number(current.unitPrice);
      const totalPrice = quantity * unitPrice;
      
      return ctx.prisma.importProcessItem.update({
        where: { id },
        data: {
          ...data,
          totalPrice,
        },
      });
    }),

  deleteProcessItem: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.importProcessItem.delete({
        where: { id: input.id },
      });
    }),

  // ==========================================================================
  // IMPORT PROCESS EVENTS
  // ==========================================================================

  addProcessEvent: tenantProcedure
    .input(
      z.object({
        processId: z.string().uuid(),
        eventType: z.string().min(1),
        eventDate: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.importProcessEvent.create({
        data: {
          processId: input.processId,
          eventType: input.eventType,
          eventDate: new Date(input.eventDate),
          description: input.description,
        },
      });
    }),

  deleteProcessEvent: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.importProcessEvent.delete({
        where: { id: input.id },
      });
    }),

  // ==========================================================================
  // IMPORT PROCESS COSTS
  // ==========================================================================

  addProcessCost: tenantProcedure
    .input(
      z.object({
        processId: z.string().uuid(),
        costType: z.string().min(1),
        description: z.string().min(1),
        value: z.number().min(0),
        currency: z.string().default("BRL"),
        isEstimated: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.importProcessCost.create({
        data: input,
      });
    }),

  updateProcessCost: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        costType: z.string().optional(),
        description: z.string().optional(),
        value: z.number().min(0).optional(),
        currency: z.string().optional(),
        isEstimated: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.importProcessCost.update({
        where: { id },
        data,
      });
    }),

  deleteProcessCost: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.importProcessCost.delete({
        where: { id: input.id },
      });
    }),

  // ==========================================================================
  // DASHBOARD
  // ==========================================================================

  dashboard: tenantProcedure.query(async ({ ctx }) => {
    const [
      portsCount,
      brokersCount,
      cargoTypesCount,
      incotermsCount,
      processesCount,
      processesByStatus,
    ] = await Promise.all([
      ctx.prisma.port.count({
        where: {
          OR: [
            { companyId: ctx.companyId },
            { isShared: true },
          ],
          isActive: true,
        },
      }),
      ctx.prisma.customsBroker.count({
        where: {
          ...tenantFilter(ctx.companyId, false),
          isActive: true,
        },
      }),
      ctx.prisma.cargoType.count({
        where: { isActive: true },
      }),
      ctx.prisma.incoterm.count({
        where: { isActive: true },
      }),
      ctx.prisma.importProcess.count({
        where: { companyId: ctx.companyId },
      }),
      ctx.prisma.importProcess.groupBy({
        by: ["status"],
        where: { companyId: ctx.companyId },
        _count: { _all: true },
      }),
    ]);

    return {
      portsCount,
      brokersCount,
      cargoTypesCount,
      incotermsCount,
      processesCount,
      processesByStatus: processesByStatus.reduce((acc, item) => {
        acc[item.status] = item._count._all;
        return acc;
      }, {} as Record<string, number>),
    };
  }),
});
