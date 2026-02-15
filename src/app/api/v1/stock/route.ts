/**
 * REST API v1 — Stock (Inventory levels)
 * VIO-1123
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authenticateApiKey,
  isErrorResponse,
  parsePagination,
  paginationMeta,
  apiHeaders,
  handleOptions,
} from "@/lib/api-auth";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request, "STOCK_READ");
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search") || undefined;
    const belowMinimum = searchParams.get("below_minimum") === "true";

    const where: Record<string, unknown> = {
      companyId: auth.companyId,
    };

    if (search) {
      where.material = {
        OR: [
          { description: { contains: search, mode: "insensitive" } },
          { internalCode: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [inventory, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          material: {
            select: {
              id: true,
              code: true,
              internalCode: true,
              description: true,
              unit: true,
              minQuantity: true,
              maxQuantity: true,
            },
          },
        },
        orderBy: { material: { description: "asc" } },
        skip,
        take: limit,
      }),
      prisma.inventory.count({ where }),
    ]);

    let data = inventory;
    if (belowMinimum) {
      data = inventory.filter(
        (inv) => Number(inv.quantity) < Number(inv.material.minQuantity ?? 0)
      );
    }

    return NextResponse.json(
      { data, pagination: paginationMeta(total, page, limit) },
      { headers: apiHeaders() }
    );
  } catch (e: unknown) {
    console.error("API v1 /stock error:", e instanceof Error ? e.message : String(e));
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: apiHeaders() }
    );
  }
}
