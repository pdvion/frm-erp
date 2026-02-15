/**
 * API Pública — Portal do Cliente
 * VIO-1124 — Portal do Cliente (Pedidos, boletos, tracking)
 *
 * GET /api/portal/customer/[token] — Dados do cliente + resumo financeiro
 * Sem autenticação — acesso via token único
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CustomerPortalService } from "@/server/services/customer-portal";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 36) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    const svc = new CustomerPortalService(prisma);
    const result = await svc.validateToken(token);

    if (!result) {
      return NextResponse.json({ error: "Portal não encontrado" }, { status: 404 });
    }

    if ("expired" in result) {
      return NextResponse.json(
        { error: "Link expirado. Solicite um novo link ao seu contato comercial." },
        { status: 410 }
      );
    }

    if ("revoked" in result) {
      return NextResponse.json(
        { error: "Link revogado. Solicite um novo link ao seu contato comercial." },
        { status: 410 }
      );
    }

    const portalToken = result;
    const summary = await svc.getFinancialSummary(portalToken.companyId, portalToken.customerId);

    return NextResponse.json({
      customer: (portalToken as Record<string, unknown>).customer,
      company: (portalToken as Record<string, unknown>).company,
      expiresAt: portalToken.expiresAt,
      financialSummary: summary,
    });
  } catch (error: unknown) {
    console.error("Customer portal API error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
