import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter, reportsProcedure } from "../trpc";

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
        AND: [
          {
            OR: [
              { companyId: ctx.companyId },
              { isShared: true },
            ],
          },
          ...(search ? [{
            OR: [
              { code: { contains: search, mode: "insensitive" as const } },
              { name: { contains: search, mode: "insensitive" as const } },
            ],
          }] : []),
        ],
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
          OR: [
            { companyId: ctx.companyId },
            { isShared: true },
          ],
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
        data: {
          ...input,
          companyId: input.isShared ? null : ctx.companyId,
        },
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
      const existing = await ctx.prisma.cargoType.findFirst({
        where: { id, companyId: ctx.companyId, isShared: false },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tipo de carga não encontrado ou é compartilhado" });
      }
      return ctx.prisma.cargoType.update({
        where: { id },
        data,
      });
    }),

  deleteCargoType: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.cargoType.findFirst({
        where: { id: input.id, companyId: ctx.companyId, isShared: false },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tipo de carga não encontrado ou é compartilhado" });
      }
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
          OR: [
            { companyId: ctx.companyId },
            { isShared: true },
          ],
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
        data: {
          ...input,
          companyId: input.isShared ? null : ctx.companyId,
        },
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
      const existing = await ctx.prisma.incoterm.findFirst({
        where: { id, companyId: ctx.companyId, isShared: false },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Incoterm não encontrado ou é compartilhado" });
      }
      return ctx.prisma.incoterm.update({
        where: { id },
        data,
      });
    }),

  deleteIncoterm: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.incoterm.findFirst({
        where: { id: input.id, companyId: ctx.companyId, isShared: false },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Incoterm não encontrado ou é compartilhado" });
      }
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
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search, status, supplierId, brokerId, dateFrom, dateTo, page = 1, limit = 20 } = input ?? {};

      const where = {
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
      };

      const [items, total] = await Promise.all([
        ctx.prisma.importProcess.findMany({
          where,
          include: {
            supplier: { select: { id: true, companyName: true } },
            customsBroker: { select: { id: true, name: true } },
            incoterm: { select: { id: true, code: true } },
            cargoType: { select: { id: true, code: true, name: true } },
            originPort: { select: { id: true, code: true, name: true } },
            destinationPort: { select: { id: true, code: true, name: true } },
            _count: { select: { importProcessItems: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.importProcess.count({ where }),
      ]);

      return {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  getProcess: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.importProcess.findUnique({
        where: { id: input.id },
        include: {
          supplier: true,
          customsBroker: true,
          incoterm: true,
          cargoType: true,
          originPort: true,
          destinationPort: true,
          importProcessItems: {
            include: {
              material: { select: { id: true, code: true, description: true } },
              purchaseOrder: { select: { id: true, code: true } },
            },
          },
          importProcessEvents: { orderBy: { eventDate: "desc" } },
          importProcessCosts: true,
          exchangeContracts: true,
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
        destinationPortId: z.string().uuid(),
        fobValue: z.number().min(0),
        currency: z.string().default("USD"),
        freightValue: z.number().optional(),
        insuranceValue: z.number().optional(),
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
          destinationPortId: input.destinationPortId,
          fobValue: input.fobValue,
          currency: input.currency,
          freightValue: input.freightValue,
          insuranceValue: input.insuranceValue,
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
        destinationPortId: z.string().uuid().optional(),
        status: z.enum([
          "DRAFT", "PENDING_SHIPMENT", "IN_TRANSIT", "ARRIVED",
          "IN_CLEARANCE", "CLEARED", "DELIVERED", "CANCELLED"
        ]).optional(),
        fobValue: z.number().min(0).optional(),
        currency: z.string().optional(),
        freightValue: z.number().optional().nullable(),
        insuranceValue: z.number().optional().nullable(),
        etd: z.string().optional().nullable(),
        eta: z.string().optional().nullable(),
        actualArrival: z.string().optional().nullable(),
        clearanceDate: z.string().optional().nullable(),
        blNumber: z.string().optional().nullable(),
        diNumber: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, etd, eta, actualArrival, clearanceDate, ...rest } = input;
      
      return ctx.prisma.importProcess.update({
        where: { id },
        data: {
          ...rest,
          ...(etd !== undefined && { etd: etd ? new Date(etd) : null }),
          ...(eta !== undefined && { eta: eta ? new Date(eta) : null }),
          ...(actualArrival !== undefined && { actualArrival: actualArrival ? new Date(actualArrival) : null }),
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
          importProcessId: input.processId,
          materialId: input.materialId,
          purchaseOrderId: input.purchaseOrderId,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          totalPrice,
          ncmCode: input.ncm,
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
      const current = await ctx.prisma.importProcessItem.findFirst({
        where: { id },
        include: { importProcess: { select: { companyId: true } } },
      });
      if (!current || current.importProcess.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }
      
      const quantity = data.quantity ?? Number(current.quantity);
      const unitPrice = data.unitPrice ?? Number(current.unitPrice);
      const totalPrice = quantity * unitPrice;
      
      return ctx.prisma.importProcessItem.update({
        where: { id },
        data: {
          materialId: data.materialId,
          purchaseOrderId: data.purchaseOrderId,
          ncmCode: data.ncm,
          description: data.description,
          quantity,
          unitPrice,
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
          importProcessId: input.processId,
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
        data: {
          importProcessId: input.processId,
          costType: input.costType,
          description: input.description,
          value: input.value,
          currency: input.currency,
          isEstimated: input.isEstimated,
        },
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
  // EXCHANGE CONTRACTS (Contratos de Câmbio)
  // ==========================================================================

  listExchangeContracts: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["OPEN", "PARTIALLY_LIQUIDATED", "LIQUIDATED", "CANCELLED"]).optional(),
        bankAccountId: z.string().uuid().optional(),
        processId: z.string().uuid().optional(),
        maturityFrom: z.string().optional(),
        maturityTo: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search, status, bankAccountId, processId, maturityFrom, maturityTo, page = 1, limit = 20 } = input ?? {};

      const where = {
        companyId: ctx.companyId,
        ...(search && {
          OR: [
            { contractNumber: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(status && { status }),
        ...(bankAccountId && { bankAccountId }),
        ...(processId && { processId }),
        ...(maturityFrom && { maturityDate: { gte: new Date(maturityFrom) } }),
        ...(maturityTo && { maturityDate: { lte: new Date(maturityTo) } }),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.exchangeContract.findMany({
          where,
          include: {
            bankAccount: { select: { id: true, name: true, bankName: true } },
            importProcess: { select: { id: true, processNumber: true } },
            _count: { select: { exchangeLiquidations: true } },
          },
          orderBy: { maturityDate: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.exchangeContract.count({ where }),
      ]);

      return {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  getExchangeContract: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.exchangeContract.findUnique({
        where: { id: input.id },
        include: {
          bankAccount: true,
          importProcess: { select: { id: true, processNumber: true, supplier: { select: { companyName: true } } } },
          exchangeLiquidations: { orderBy: { liquidationDate: "desc" } },
        },
      });
    }),

  createExchangeContract: tenantProcedure
    .input(
      z.object({
        contractNumber: z.string().min(1),
        bankAccountId: z.string().uuid(),
        processId: z.string().uuid().optional(),
        foreignValue: z.number().min(0),
        foreignCurrency: z.string().default("USD"),
        contractRate: z.number().min(0),
        contractDate: z.string(),
        maturityDate: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const brlValue = input.foreignValue * input.contractRate;

      return ctx.prisma.exchangeContract.create({
        data: {
          contractNumber: input.contractNumber,
          bankAccountId: input.bankAccountId,
          processId: input.processId,
          foreignValue: input.foreignValue,
          foreignCurrency: input.foreignCurrency,
          contractRate: input.contractRate,
          brlValue,
          contractDate: new Date(input.contractDate),
          maturityDate: new Date(input.maturityDate),
          notes: input.notes,
          companyId: ctx.companyId,
        },
      });
    }),

  updateExchangeContract: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        contractNumber: z.string().min(1).optional(),
        bankAccountId: z.string().uuid().optional(),
        processId: z.string().uuid().optional().nullable(),
        foreignValue: z.number().min(0).optional(),
        foreignCurrency: z.string().optional(),
        contractRate: z.number().min(0).optional(),
        contractDate: z.string().optional(),
        maturityDate: z.string().optional(),
        status: z.enum(["OPEN", "PARTIALLY_LIQUIDATED", "LIQUIDATED", "CANCELLED"]).optional(),
        notes: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, contractDate, maturityDate, foreignValue, contractRate, ...rest } = input;

      // Recalculate BRL value if needed
      let brlValue: number | undefined;
      if (foreignValue !== undefined || contractRate !== undefined) {
        const current = await ctx.prisma.exchangeContract.findFirst({
          where: { id },
          include: { bankAccount: { select: { companyId: true } } },
        });
        if (current && current.bankAccount.companyId === ctx.companyId) {
          const fv = foreignValue ?? Number(current.foreignValue);
          const cr = contractRate ?? Number(current.contractRate);
          brlValue = fv * cr;
        }
      }

      return ctx.prisma.exchangeContract.update({
        where: { id },
        data: {
          ...rest,
          ...(foreignValue !== undefined && { foreignValue }),
          ...(contractRate !== undefined && { contractRate }),
          ...(brlValue !== undefined && { brlValue }),
          ...(contractDate && { contractDate: new Date(contractDate) }),
          ...(maturityDate && { maturityDate: new Date(maturityDate) }),
        },
      });
    }),

  deleteExchangeContract: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.exchangeContract.delete({
        where: { id: input.id },
      });
    }),

  // ==========================================================================
  // EXCHANGE LIQUIDATIONS
  // ==========================================================================

  liquidateContract: tenantProcedure
    .input(
      z.object({
        contractId: z.string().uuid(),
        foreignValue: z.number().min(0),
        liquidationRate: z.number().min(0),
        liquidationDate: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const contract = await ctx.prisma.exchangeContract.findUnique({
        where: { id: input.contractId },
      });

      if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "Contrato não encontrado" });

      const brlValue = input.foreignValue * input.liquidationRate;
      const expectedBrl = input.foreignValue * Number(contract.contractRate);
      const variation = brlValue - expectedBrl; // Positivo = perda, Negativo = ganho

      // Create liquidation record
      const liquidation = await ctx.prisma.exchangeLiquidation.create({
        data: {
          contractId: input.contractId,
          foreignValue: input.foreignValue,
          liquidationRate: input.liquidationRate,
          brlValue,
          variation,
          liquidationDate: new Date(input.liquidationDate),
          notes: input.notes,
        },
      });

      // Update contract totals
      const totalLiquidated = Number(contract.liquidatedValue || 0) + input.foreignValue;
      const totalVariation = Number(contract.exchangeVariation || 0) + variation;
      const remainingValue = Number(contract.foreignValue) - totalLiquidated;

      let newStatus: "OPEN" | "PARTIALLY_LIQUIDATED" | "LIQUIDATED" = "PARTIALLY_LIQUIDATED";
      if (remainingValue <= 0.01) {
        newStatus = "LIQUIDATED";
      }

      await ctx.prisma.exchangeContract.update({
        where: { id: input.contractId },
        data: {
          liquidatedValue: totalLiquidated,
          liquidationRate: input.liquidationRate,
          exchangeVariation: totalVariation,
          liquidationDate: new Date(input.liquidationDate),
          status: newStatus,
        },
      });

      return liquidation;
    }),

  // ==========================================================================
  // EXCHANGE SUMMARY
  // ==========================================================================

  getExchangeSummary: tenantProcedure.query(async ({ ctx }) => {
    const contracts = await ctx.prisma.exchangeContract.findMany({
      where: { companyId: ctx.companyId },
      select: {
        status: true,
        foreignValue: true,
        foreignCurrency: true,
        brlValue: true,
        liquidatedValue: true,
        exchangeVariation: true,
        maturityDate: true,
      },
    });

    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const summary = {
      totalContracts: contracts.length,
      openContracts: 0,
      totalForeignOpen: 0,
      totalBrlOpen: 0,
      totalVariation: 0,
      expiringIn30Days: 0,
      expiredContracts: 0,
    };

    for (const contract of contracts) {
      if (contract.status === "OPEN" || contract.status === "PARTIALLY_LIQUIDATED") {
        summary.openContracts++;
        const remaining = Number(contract.foreignValue) - Number(contract.liquidatedValue || 0);
        summary.totalForeignOpen += remaining;
        summary.totalBrlOpen += remaining * (Number(contract.brlValue) / Number(contract.foreignValue));

        if (contract.maturityDate <= today) {
          summary.expiredContracts++;
        } else if (contract.maturityDate <= thirtyDaysFromNow) {
          summary.expiringIn30Days++;
        }
      }

      summary.totalVariation += Number(contract.exchangeVariation || 0);
    }

    return summary;
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
      processesByStatus: processesByStatus.reduce((acc: Record<string, number>, item: { status: string; _count: { _all: number } }) => {
        acc[item.status] = item._count._all;
        return acc;
      }, {} as Record<string, number>),
    };
  }),

  // ==========================================================================
  // DASHBOARD AVANÇADO
  // ==========================================================================

  getDashboardData: reportsProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      processes,
      exchangeContracts,
      recentProcesses,
      upcomingArrivals,
    ] = await Promise.all([
      // All processes for status breakdown
      ctx.prisma.importProcess.findMany({
        where: { companyId: ctx.companyId },
        select: {
          id: true,
          status: true,
          fobValue: true,
          currency: true,
          eta: true,
          createdAt: true,
        },
      }),
      // Exchange contracts summary
      ctx.prisma.exchangeContract.findMany({
        where: { companyId: ctx.companyId },
        select: {
          status: true,
          foreignValue: true,
          brlValue: true,
          liquidatedValue: true,
          exchangeVariation: true,
          maturityDate: true,
        },
      }),
      // Recent processes (last 30 days)
      ctx.prisma.importProcess.findMany({
        where: {
          companyId: ctx.companyId,
          createdAt: { gte: thirtyDaysAgo },
        },
        include: {
          supplier: { select: { companyName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Upcoming arrivals (next 30 days)
      ctx.prisma.importProcess.findMany({
        where: {
          companyId: ctx.companyId,
          status: { in: ["IN_TRANSIT", "PENDING_SHIPMENT"] },
          eta: { gte: today, lte: thirtyDaysFromNow },
        },
        include: {
          supplier: { select: { companyName: true } },
          destinationPort: { select: { code: true, name: true } },
        },
        orderBy: { eta: "asc" },
        take: 10,
      }),
    ]);

    // Calculate KPIs
    const activeStatuses = ["DRAFT", "PENDING_SHIPMENT", "IN_TRANSIT", "ARRIVED", "IN_CLEARANCE"];
    const activeProcesses = processes.filter(p => activeStatuses.includes(p.status));
    
    const totalValueInTransit = processes
      .filter(p => p.status === "IN_TRANSIT")
      .reduce((sum, p) => sum + Number(p.fobValue || 0), 0);

    const statusBreakdown = processes.reduce((acc: Record<string, number>, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    // Exchange summary
    const openContracts = exchangeContracts.filter(c => c.status === "OPEN" || c.status === "PARTIALLY_LIQUIDATED");
    const totalExchangeOpen = openContracts.reduce((sum, c) => {
      const remaining = Number(c.foreignValue) - Number(c.liquidatedValue || 0);
      return sum + remaining;
    }, 0);
    const totalExchangeVariation = exchangeContracts.reduce((sum, c) => sum + Number(c.exchangeVariation || 0), 0);
    const expiredContracts = openContracts.filter(c => c.maturityDate <= today).length;

    return {
      kpis: {
        activeProcesses: activeProcesses.length,
        totalProcesses: processes.length,
        totalValueInTransit,
        openExchangeContracts: openContracts.length,
        totalExchangeOpen,
        totalExchangeVariation,
        expiredContracts,
      },
      statusBreakdown,
      recentProcesses: recentProcesses.map(p => ({
        id: p.id,
        processNumber: p.processNumber,
        supplier: p.supplier?.companyName,
        status: p.status,
        fobValue: Number(p.fobValue || 0),
        currency: p.currency,
        createdAt: p.createdAt,
      })),
      upcomingArrivals: upcomingArrivals.map(p => ({
        id: p.id,
        processNumber: p.processNumber,
        supplier: p.supplier?.companyName,
        destinationPort: p.destinationPort?.code,
        eta: p.eta,
        fobValue: Number(p.fobValue || 0),
        currency: p.currency,
      })),
    };
  }),

  // ==========================================================================
  // RELATÓRIOS
  // ==========================================================================

  getProcessReport: reportsProcedure
    .input(
      z.object({
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        status: z.string().optional(),
        supplierId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { dateFrom, dateTo, status, supplierId } = input;

      const processes = await ctx.prisma.importProcess.findMany({
        where: {
          companyId: ctx.companyId,
          ...(dateFrom && { createdAt: { gte: new Date(dateFrom) } }),
          ...(dateTo && { createdAt: { lte: new Date(dateTo) } }),
          ...(status && { status: status as "DRAFT" | "PENDING_SHIPMENT" | "IN_TRANSIT" | "ARRIVED" | "IN_CLEARANCE" | "CLEARED" | "DELIVERED" | "CANCELLED" }),
          ...(supplierId && { supplierId }),
        },
        include: {
          supplier: { select: { companyName: true } },
          customsBroker: { select: { name: true } },
          incoterm: { select: { code: true } },
          originPort: { select: { code: true } },
          destinationPort: { select: { code: true } },
          _count: { select: { importProcessItems: true, importProcessCosts: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const summary = {
        totalProcesses: processes.length,
        totalValue: processes.reduce((sum, p) => sum + Number(p.fobValue || 0), 0),
        byStatus: processes.reduce((acc: Record<string, number>, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {}),
        bySupplier: processes.reduce((acc: Record<string, { count: number; value: number }>, p) => {
          const name = p.supplier?.companyName || "Sem fornecedor";
          if (!acc[name]) acc[name] = { count: 0, value: 0 };
          acc[name].count++;
          acc[name].value += Number(p.fobValue || 0);
          return acc;
        }, {}),
      };

      return {
        processes: processes.map(p => ({
          id: p.id,
          processNumber: p.processNumber,
          supplier: p.supplier?.companyName,
          customsBroker: p.customsBroker?.name,
          incoterm: p.incoterm?.code,
          route: `${p.originPort?.code} → ${p.destinationPort?.code}`,
          fobValue: Number(p.fobValue || 0),
          currency: p.currency,
          status: p.status,
          eta: p.eta,
          itemsCount: p._count.importProcessItems,
          costsCount: p._count.importProcessCosts,
          createdAt: p.createdAt,
        })),
        summary,
      };
    }),

  getCostReport: reportsProcedure
    .input(
      z.object({
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        processId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { dateFrom, dateTo, processId } = input;

      const costs = await ctx.prisma.importProcessCost.findMany({
        where: {
          importProcess: { companyId: ctx.companyId },
          ...(processId && { importProcessId: processId }),
          ...(dateFrom && { createdAt: { gte: new Date(dateFrom) } }),
          ...(dateTo && { createdAt: { lte: new Date(dateTo) } }),
        },
        include: {
          importProcess: { select: { processNumber: true, fobValue: true, currency: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const byCostType = costs.reduce((acc: Record<string, { count: number; total: number }>, c) => {
        if (!acc[c.costType]) acc[c.costType] = { count: 0, total: 0 };
        acc[c.costType].count++;
        acc[c.costType].total += Number(c.value);
        return acc;
      }, {});

      return {
        costs: costs.map(c => ({
          id: c.id,
          processNumber: c.importProcess.processNumber,
          costType: c.costType,
          description: c.description,
          value: Number(c.value),
          currency: c.currency,
          isEstimated: c.isEstimated,
          createdAt: c.createdAt,
        })),
        summary: {
          totalCosts: costs.length,
          totalValue: costs.reduce((sum, c) => sum + Number(c.value), 0),
          byCostType,
        },
      };
    }),

  getExchangeReport: tenantProcedure
    .input(
      z.object({
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        status: z.enum(["OPEN", "PARTIALLY_LIQUIDATED", "LIQUIDATED", "CANCELLED"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { dateFrom, dateTo, status } = input;

      const contracts = await ctx.prisma.exchangeContract.findMany({
        where: {
          companyId: ctx.companyId,
          ...(status && { status }),
          ...(dateFrom && { contractDate: { gte: new Date(dateFrom) } }),
          ...(dateTo && { contractDate: { lte: new Date(dateTo) } }),
        },
        include: {
          bankAccount: { select: { name: true, bankName: true } },
          importProcess: { select: { processNumber: true } },
          _count: { select: { exchangeLiquidations: true } },
        },
        orderBy: { contractDate: "desc" },
      });

      const summary = {
        totalContracts: contracts.length,
        totalForeignValue: contracts.reduce((sum, c) => sum + Number(c.foreignValue), 0),
        totalBrlValue: contracts.reduce((sum, c) => sum + Number(c.brlValue), 0),
        totalVariation: contracts.reduce((sum, c) => sum + Number(c.exchangeVariation || 0), 0),
        byStatus: contracts.reduce((acc: Record<string, number>, c) => {
          acc[c.status] = (acc[c.status] || 0) + 1;
          return acc;
        }, {}),
        avgRate: contracts.length > 0
          ? contracts.reduce((sum, c) => sum + Number(c.contractRate), 0) / contracts.length
          : 0,
      };

      return {
        contracts: contracts.map(c => ({
          id: c.id,
          contractNumber: c.contractNumber,
          bank: c.bankAccount?.bankName || c.bankAccount?.name,
          processNumber: c.importProcess?.processNumber,
          foreignValue: Number(c.foreignValue),
          foreignCurrency: c.foreignCurrency,
          contractRate: Number(c.contractRate),
          brlValue: Number(c.brlValue),
          status: c.status,
          variation: Number(c.exchangeVariation || 0),
          liquidationsCount: c._count.exchangeLiquidations,
          contractDate: c.contractDate,
          maturityDate: c.maturityDate,
        })),
        summary,
      };
    }),
});
