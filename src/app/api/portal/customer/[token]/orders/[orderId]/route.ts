/**
 * API Pública — Portal do Cliente: Detalhe do Pedido
 * GET /api/portal/customer/[token]/orders/[orderId]
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CustomerPortalService } from "@/server/services/customer-portal";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string; orderId: string }> }
) {
  try {
    const { token, orderId } = await params;
    const svc = new CustomerPortalService(prisma);
    const result = await svc.validateToken(token);

    if (!result || "expired" in result || "revoked" in result) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const order = await svc.getOrderDetail(result.companyId, result.customerId, orderId);

    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error: unknown) {
    console.error("Customer portal order detail error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
