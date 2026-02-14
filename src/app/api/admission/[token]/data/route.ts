/**
 * API Pública — Portal do Candidato: Atualizar dados pessoais
 * VIO-1102 — Admissão Digital Fase 3
 * 
 * POST /api/admission/[token]/data — Preencher/atualizar dados pessoais
 * Sem autenticação — acesso via token único
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filterCandidateFields, isTokenExpired, isAdmissionClosed } from "@/server/services/admission-portal";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 36) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    const admission = await prisma.admissionProcess.findUnique({
      where: { accessToken: token },
    });

    if (!admission) {
      return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 });
    }

    if (isTokenExpired(admission.tokenExpiresAt)) {
      return NextResponse.json({ error: "Link expirado. Solicite um novo link ao RH." }, { status: 410 });
    }

    if (isAdmissionClosed(admission.status ?? "")) {
      return NextResponse.json({ error: "Este processo não aceita mais alterações." }, { status: 403 });
    }

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const { data, filteredCount } = filterCandidateFields(body as Record<string, unknown>);

    if (filteredCount === 0) {
      return NextResponse.json({ error: "Nenhum campo válido enviado" }, { status: 400 });
    }

    const updated = await prisma.admissionProcess.update({
      where: { id: admission.id },
      data,
    });

    return NextResponse.json({
      success: true,
      updatedFields: Object.keys(data),
      candidateName: updated.candidateName,
    });
  } catch (error) {
    console.error("Admission portal data update error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
