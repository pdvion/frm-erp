/**
 * API Pública — Portal do Fornecedor
 * VIO-1125 — Portal do Fornecedor
 *
 * GET /api/portal/supplier/[token] — Dados do fornecedor + resumo de pagamentos
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SupplierPortalService } from "@/server/services/supplier-portal";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 36) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    const svc = new SupplierPortalService(prisma);
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
    const summary = await svc.getPaymentSummary(portalToken.companyId, portalToken.supplierId);

    return NextResponse.json({
      supplier: (portalToken as Record<string, unknown>).supplier,
      company: (portalToken as Record<string, unknown>).company,
      expiresAt: portalToken.expiresAt,
      paymentSummary: summary,
    });
  } catch (error: unknown) {
    console.error("Supplier portal API error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
