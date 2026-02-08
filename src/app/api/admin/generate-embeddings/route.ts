import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  processEmbeddingsBatch,
  EMBEDDABLE_ENTITIES,
  type EmbeddableEntity,
  type EntityEmbeddingData,
} from "@/lib/ai/embeddings";
import { getGoogleKey } from "@/server/services/getAIApiKey";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`;
  }
  // Dev: permitir sem auth
  return process.env.NODE_ENV === "development";
}

async function fetchAllEntities(
  entityType: EmbeddableEntity,
  companyId: string,
  existingIds: string[]
): Promise<EntityEmbeddingData[]> {
  const notIn = existingIds.length > 0 ? { id: { notIn: existingIds } } : {};

  switch (entityType) {
    case "material": {
      const items = await prisma.material.findMany({
        where: { OR: [{ companyId }, { isShared: true }], status: "ACTIVE", ...notIn },
        include: { category: { select: { name: true } } },
        take: 500,
      });
      return items.map((m) => ({
        type: "material" as const,
        data: {
          id: m.id, code: m.code, description: m.description,
          internalCode: m.internalCode, ncm: m.ncm, unit: m.unit,
          categoryName: m.category?.name, subCategoryName: null,
          manufacturer: m.manufacturer, notes: m.notes, barcode: m.barcode,
        },
      }));
    }
    case "product": {
      const items = await prisma.product.findMany({
        where: { companyId, ...notIn },
        include: { category: { select: { name: true } }, material: { select: { description: true } } },
        take: 500,
      });
      return items.map((p) => ({
        type: "product" as const,
        data: {
          id: p.id, code: p.code, name: p.name,
          shortDescription: p.shortDescription, description: p.description,
          tags: p.tags, categoryName: p.category?.name,
          materialDescription: p.material?.description,
          specifications: p.specifications as Record<string, unknown> | null,
        },
      }));
    }
    case "customer": {
      const items = await prisma.customer.findMany({
        where: { companyId, status: "ACTIVE", ...notIn },
        take: 500,
      });
      return items.map((c) => ({
        type: "customer" as const,
        data: {
          id: c.id, code: c.code, companyName: c.companyName,
          tradeName: c.tradeName, cnpj: c.cnpj, cpf: c.cpf,
          city: c.addressCity, state: c.addressState,
          contactName: c.contactName, notes: c.notes,
        },
      }));
    }
    case "supplier": {
      const items = await prisma.supplier.findMany({
        where: { OR: [{ companyId }, { isShared: true }], status: "ACTIVE", ...notIn },
        take: 500,
      });
      return items.map((s) => {
        const cats: string[] = [];
        if (s.cat01Embalagens) cats.push("Embalagens");
        if (s.cat02Tintas) cats.push("Tintas");
        if (s.cat03OleosGraxas) cats.push("Óleos/Graxas");
        if (s.cat04Dispositivos) cats.push("Dispositivos");
        if (s.cat05Acessorios) cats.push("Acessórios");
        if (s.cat06Manutencao) cats.push("Manutenção");
        if (s.cat07Servicos) cats.push("Serviços");
        if (s.cat08Escritorio) cats.push("Escritório");
        return {
          type: "supplier" as const,
          data: {
            id: s.id, code: s.code, companyName: s.companyName,
            tradeName: s.tradeName, cnpj: s.cnpj, city: s.city,
            state: s.state, cnae: s.cnae, categories: cats, notes: s.notes,
          },
        };
      });
    }
    case "employee": {
      const items = await prisma.employee.findMany({
        where: { companyId, status: "ACTIVE", ...notIn },
        include: { department: { select: { name: true } }, position: { select: { name: true } } },
        take: 500,
      });
      return items.map((e) => ({
        type: "employee" as const,
        data: {
          id: e.id, code: e.code, name: e.name, cpf: e.cpf,
          email: e.email, departmentName: e.department?.name,
          positionName: e.position?.name, contractType: e.contractType,
          notes: e.notes,
        },
      }));
    }
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Buscar todas as empresas ativas
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      select: { id: true, tradeName: true },
    });

    const allResults: Record<string, Record<string, { total: number; success: number; failed: number }>> = {};

    for (const company of companies) {
      const apiKey = await getGoogleKey(prisma, company.id);
      if (!apiKey) {
        allResults[company.tradeName ?? company.id] = { _error: { total: 0, success: 0, failed: 0 } };
        continue;
      }

      const companyResults: Record<string, { total: number; success: number; failed: number }> = {};

      for (const entityType of EMBEDDABLE_ENTITIES) {
        // Buscar IDs já com embedding
        const existing = await prisma.embedding.findMany({
          where: { entityType, companyId: company.id },
          select: { entityId: true },
        });
        const existingIds = existing.map((e) => e.entityId);

        const entities = await fetchAllEntities(entityType, company.id, existingIds);

        if (entities.length === 0) {
          companyResults[entityType] = { total: 0, success: 0, failed: 0 };
          continue;
        }

        const result = await processEmbeddingsBatch(prisma, entities, company.id, apiKey);
        companyResults[entityType] = { total: result.total, success: result.success, failed: result.failed, errors: result.errors } as Record<string, unknown> & { total: number; success: number; failed: number };
      }

      allResults[company.tradeName ?? company.id] = companyResults;
    }

    return NextResponse.json({
      success: true,
      results: allResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
