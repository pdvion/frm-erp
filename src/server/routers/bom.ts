import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { auditCreate } from "../services/audit";

export const bomRouter = createTRPCRouter({
  // Listar estrutura de um produto (BOM)
  getByProduct: tenantProcedure
    .input(z.object({ materialId: z.string() }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.bomItem.findMany({
        where: {
          parentMaterialId: input.materialId,
          isActive: true,
        },
        include: {
          childMaterial: {
            select: {
              id: true,
              code: true,
              description: true,
              unit: true,
              lastPurchasePrice: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { sequence: "asc" },
      });

      // Buscar material pai
      const parentMaterial = await ctx.prisma.material.findUnique({
        where: { id: input.materialId },
        select: {
          id: true,
          code: true,
          description: true,
          unit: true,
          category: { select: { id: true, name: true } },
        },
      });

      return {
        parentMaterial,
        items,
        totalItems: items.length,
      };
    }),

  // Listar todos os produtos com BOM
  listProducts: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { search, page = 1, limit = 20 } = input ?? {};

      // Buscar materiais que têm BOM (são pais de algum item)
      const parentIds = await ctx.prisma.bomItem.findMany({
        where: { isActive: true },
        select: { parentMaterialId: true },
        distinct: ["parentMaterialId"],
      });

      const where = {
        id: { in: parentIds.map((p) => p.parentMaterialId) },
        ...(search && {
          OR: [
            { description: { contains: search, mode: "insensitive" as const } },
            { code: { equals: parseInt(search) || -1 } },
          ],
        }),
      };

      const [products, total] = await Promise.all([
        ctx.prisma.material.findMany({
          where,
          select: {
            id: true,
            code: true,
            description: true,
            unit: true,
            category: { select: { id: true, name: true } },
            _count: { select: { bomAsParent: true } },
          },
          orderBy: { description: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.material.count({ where }),
      ]);

      return {
        products: products.map((p) => ({
          ...p,
          bomItemCount: p._count.bomAsParent,
        })),
        total,
      };
    }),

  // Buscar item específico da BOM
  getItem: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.bomItem.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          quantity: true,
          unit: true,
          scrapPercentage: true,
          leadTimeDays: true,
          sequence: true,
          notes: true,
          childMaterial: {
            select: { id: true, code: true, description: true, unit: true },
          },
        },
      });
    }),

  // Adicionar item à BOM
  addItem: tenantProcedure
    .input(
      z.object({
        parentMaterialId: z.string(),
        childMaterialId: z.string(),
        quantity: z.number().positive(),
        unit: z.string().default("UN"),
        scrapPercentage: z.number().min(0).max(100).default(0),
        leadTimeDays: z.number().min(0).default(0),
        sequence: z.number().min(0).default(0),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validar que não é o mesmo material
      if (input.parentMaterialId === input.childMaterialId) {
        throw new Error("Um material não pode ser componente de si mesmo");
      }

      // Verificar se já existe
      const existing = await ctx.prisma.bomItem.findUnique({
        where: {
          parentMaterialId_childMaterialId: {
            parentMaterialId: input.parentMaterialId,
            childMaterialId: input.childMaterialId,
          },
        },
      });

      if (existing) {
        throw new Error("Este componente já existe na estrutura");
      }

      // Verificar circularidade (componente não pode ter o pai como filho)
      const childBom = await ctx.prisma.bomItem.findMany({
        where: { parentMaterialId: input.childMaterialId },
        select: { childMaterialId: true },
      });

      if (childBom.some((b) => b.childMaterialId === input.parentMaterialId)) {
        throw new Error("Referência circular detectada: o componente já contém o produto pai");
      }

      const item = await ctx.prisma.bomItem.create({
        data: input,
        include: {
          parentMaterial: { select: { code: true, description: true } },
          childMaterial: { select: { code: true, description: true } },
        },
      });

      await auditCreate("BomItem", item, `${item.parentMaterial.code} -> ${item.childMaterial.code}`, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return item;
    }),

  // Atualizar item da BOM
  updateItem: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        quantity: z.number().positive().optional(),
        unit: z.string().optional(),
        scrapPercentage: z.number().min(0).max(100).optional(),
        leadTimeDays: z.number().min(0).optional(),
        sequence: z.number().min(0).optional(),
        notes: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      return ctx.prisma.bomItem.update({
        where: { id },
        data,
        include: {
          childMaterial: { select: { code: true, description: true, unit: true } },
        },
      });
    }),

  // Remover item da BOM
  removeItem: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.bomItem.delete({
        where: { id: input.id },
      });
    }),

  // Copiar BOM de um produto para outro
  copyBom: tenantProcedure
    .input(
      z.object({
        sourceMaterialId: z.string(),
        targetMaterialId: z.string(),
        replaceExisting: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.sourceMaterialId === input.targetMaterialId) {
        throw new Error("Origem e destino não podem ser o mesmo material");
      }

      // Buscar BOM de origem
      const sourceItems = await ctx.prisma.bomItem.findMany({
        where: { parentMaterialId: input.sourceMaterialId, isActive: true },
      });

      if (sourceItems.length === 0) {
        throw new Error("Material de origem não possui estrutura");
      }

      // Se replaceExisting, remover itens existentes no destino
      if (input.replaceExisting) {
        await ctx.prisma.bomItem.deleteMany({
          where: { parentMaterialId: input.targetMaterialId },
        });
      }

      // Copiar itens
      const createdItems = await ctx.prisma.bomItem.createMany({
        data: sourceItems.map((item) => ({
          parentMaterialId: input.targetMaterialId,
          childMaterialId: item.childMaterialId,
          quantity: item.quantity,
          unit: item.unit,
          scrapPercentage: item.scrapPercentage,
          leadTimeDays: item.leadTimeDays,
          sequence: item.sequence,
          notes: item.notes,
        })),
        skipDuplicates: true,
      });

      return { copiedCount: createdItems.count };
    }),

  // Explodir BOM (multinível)
  explode: tenantProcedure
    .input(
      z.object({
        materialId: z.string(),
        quantity: z.number().positive().default(1),
        maxLevels: z.number().min(1).max(10).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      interface ExplodedItem {
        level: number;
        materialId: string;
        materialCode: number;
        materialDescription: string;
        unit: string;
        quantityPerUnit: number;
        totalQuantity: number;
        scrapPercentage: number;
        hasChildren: boolean;
      }

      const explodedItems: ExplodedItem[] = [];

      async function explodeLevel(
        parentId: string,
        parentQty: number,
        level: number
      ): Promise<void> {
        if (level > input.maxLevels) return;

        const items = await ctx.prisma.bomItem.findMany({
          where: { parentMaterialId: parentId, isActive: true },
          include: {
            childMaterial: {
              select: { id: true, code: true, description: true, unit: true },
            },
          },
          orderBy: { sequence: "asc" },
        });

        for (const item of items) {
          const scrapMultiplier = 1 + item.scrapPercentage / 100;
          const totalQty = parentQty * item.quantity * scrapMultiplier;

          // Verificar se tem filhos
          const childCount = await ctx.prisma.bomItem.count({
            where: { parentMaterialId: item.childMaterialId, isActive: true },
          });

          explodedItems.push({
            level,
            materialId: item.childMaterialId,
            materialCode: item.childMaterial.code,
            materialDescription: item.childMaterial.description,
            unit: item.unit,
            quantityPerUnit: item.quantity,
            totalQuantity: totalQty,
            scrapPercentage: item.scrapPercentage,
            hasChildren: childCount > 0,
          });

          // Recursão para próximo nível
          if (childCount > 0) {
            await explodeLevel(item.childMaterialId, totalQty, level + 1);
          }
        }
      }

      await explodeLevel(input.materialId, input.quantity, 1);

      // Agrupar por material (somar quantidades)
      const grouped = explodedItems.reduce(
        (acc, item) => {
          const key = item.materialId;
          if (!acc[key]) {
            acc[key] = { ...item };
          } else {
            acc[key].totalQuantity += item.totalQuantity;
          }
          return acc;
        },
        {} as Record<string, ExplodedItem>
      );

      return {
        detailed: explodedItems,
        summarized: Object.values(grouped).sort((a, b) => a.materialCode - b.materialCode),
        totalComponents: explodedItems.length,
        uniqueComponents: Object.keys(grouped).length,
      };
    }),

  // Calcular custo da BOM
  calculateCost: tenantProcedure
    .input(
      z.object({
        materialId: z.string(),
        quantity: z.number().positive().default(1),
      })
    )
    .query(async ({ ctx, input }) => {
      interface CostItem {
        materialId: string;
        materialCode: number;
        materialDescription: string;
        quantity: number;
        unitCost: number;
        totalCost: number;
      }

      const costItems: CostItem[] = [];

      async function calculateLevel(parentId: string, parentQty: number): Promise<number> {
        const items = await ctx.prisma.bomItem.findMany({
          where: { parentMaterialId: parentId, isActive: true },
          include: {
            childMaterial: {
              select: { id: true, code: true, description: true, lastPurchasePrice: true },
            },
          },
        });

        let totalCost = 0;

        for (const item of items) {
          const scrapMultiplier = 1 + item.scrapPercentage / 100;
          const qty = parentQty * item.quantity * scrapMultiplier;

          // Verificar se tem filhos (é um semi-acabado)
          const childCount = await ctx.prisma.bomItem.count({
            where: { parentMaterialId: item.childMaterialId, isActive: true },
          });

          let itemCost: number;
          if (childCount > 0) {
            // Calcular custo recursivamente
            itemCost = await calculateLevel(item.childMaterialId, qty);
          } else {
            // Usar preço de compra
            const unitCost = item.childMaterial.lastPurchasePrice || 0;
            itemCost = qty * unitCost;

            costItems.push({
              materialId: item.childMaterialId,
              materialCode: item.childMaterial.code,
              materialDescription: item.childMaterial.description,
              quantity: qty,
              unitCost,
              totalCost: itemCost,
            });
          }

          totalCost += itemCost;
        }

        return totalCost;
      }

      const totalCost = await calculateLevel(input.materialId, input.quantity);

      return {
        items: costItems,
        totalCost,
        unitCost: totalCost / input.quantity,
      };
    }),

  // Onde usado (reverse BOM)
  whereUsed: tenantProcedure
    .input(z.object({ materialId: z.string() }))
    .query(async ({ ctx, input }) => {
      const usages = await ctx.prisma.bomItem.findMany({
        where: {
          childMaterialId: input.materialId,
          isActive: true,
        },
        include: {
          parentMaterial: {
            select: {
              id: true,
              code: true,
              description: true,
              unit: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { parentMaterial: { description: "asc" } },
      });

      return {
        usages: usages.map((u) => ({
          parentMaterial: u.parentMaterial,
          quantity: u.quantity,
          unit: u.unit,
        })),
        totalUsages: usages.length,
      };
    }),
});
