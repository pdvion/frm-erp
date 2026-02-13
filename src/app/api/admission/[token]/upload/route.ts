/**
 * API Pública — Portal do Candidato: Upload de documentos
 * VIO-1102 — Admissão Digital Fase 3
 * 
 * POST /api/admission/[token]/upload — Upload de arquivo para documento específico
 * Sem autenticação — acesso via token único
 * 
 * Usa Supabase Storage bucket "admission-documents"
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET_NAME = "admission-documents";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

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

    if (admission.tokenExpiresAt && admission.tokenExpiresAt < new Date()) {
      return NextResponse.json({ error: "Link expirado. Solicite um novo link ao RH." }, { status: 410 });
    }

    if (admission.status === "COMPLETED" || admission.status === "CANCELLED" || admission.status === "REJECTED") {
      return NextResponse.json({ error: "Este processo não aceita mais alterações." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentId = formData.get("documentId") as string | null;

    if (!file || !documentId) {
      return NextResponse.json({ error: "Arquivo e documentId são obrigatórios" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Arquivo excede o tamanho máximo de 10MB" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: `Tipo de arquivo não permitido. Aceitos: PDF, JPEG, PNG, WebP`,
      }, { status: 400 });
    }

    // Verify document belongs to this admission
    const document = await prisma.admissionDocument.findFirst({
      where: { id: documentId, admissionId: admission.id },
    });

    if (!document) {
      return NextResponse.json({ error: "Documento não encontrado neste processo" }, { status: 404 });
    }

    // Upload to Supabase Storage
    const supabase = getSupabaseAdmin();
    const ext = file.name.split(".").pop() || "pdf";
    const storagePath = `${admission.companyId}/${admission.id}/${documentId}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: "Erro ao fazer upload do arquivo" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    // Update document record
    const updated = await prisma.admissionDocument.update({
      where: { id: documentId },
      data: {
        fileUrl: urlData.publicUrl,
        status: "UPLOADED",
        uploadedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: updated.id,
        documentType: updated.documentType,
        documentName: updated.documentName,
        fileUrl: updated.fileUrl,
        status: updated.status,
        uploadedAt: updated.uploadedAt,
      },
    });
  } catch (error) {
    console.error("Admission portal upload error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
