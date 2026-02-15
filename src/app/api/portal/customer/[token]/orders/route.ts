/**
 * API Pública — Portal do Cliente: Pedidos
 * GET /api/portal/customer/[token]/orders — Lista de pedidos do cliente
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CustomerPortalService } from "@/server/services/customer-portal";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const svc = new CustomerPortalService(prisma);
    const result = await svc.validateToken(token);

    if (!result || "expired" in result || "revoked" in result) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const url = new URL(request.url);
    const limitParam = Number(url.searchParams.get("limit"));
    const limit = Math.min(Number.isFinite(limitParam) && limitParam > 0 ? Math.floor(limitParam) : 20, 50);
    const offsetParam = Number(url.searchParams.get("offset"));
    const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? Math.floor(offsetParam) : 0;
    const status = url.searchParams.get("status") || undefined;

    const data = await svc.getOrders(result.companyId, result.customerId, {
      limit,
      offset,
      status,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Customer portal orders error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
