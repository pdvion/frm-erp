import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSefazClient, SefazConfig } from "@/lib/sefaz";

// Vercel Cron - executar a cada 4 horas
// Configurado em vercel.json: "0 */4 * * *"

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutos

interface SefazConfigStored {
  cnpj: string;
  uf: string;
  environment: string;
  certificateId?: string;
}

// Verificar se a requisição vem do Vercel Cron
function isValidCronRequest(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  
  // Em produção, verificar o header do Vercel Cron
  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`;
  }
  
  // Em desenvolvimento, permitir sem autenticação
  return process.env.NODE_ENV === "development";
}

// Buscar configuração SEFAZ da empresa
async function getSefazConfig(companyId: string): Promise<SefazConfig | null> {
  const setting = await prisma.systemSetting.findFirst({
    where: { companyId, key: "sefaz_config" },
  });

  if (!setting?.value) {
    return null;
  }

  const stored = setting.value as unknown as SefazConfigStored;
  
  return {
    cnpj: stored.cnpj,
    uf: stored.uf,
    environment: stored.environment,
    certificate: stored.certificateId ? { pfxPath: stored.certificateId, password: "" } : undefined,
  } as SefazConfig;
}

export async function GET(request: Request) {
  // Validar autenticação
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const results: Array<{
    companyId: string;
    companyName: string;
    success: boolean;
    nfesFound: number;
    nfesImported: number;
    error?: string;
  }> = [];

  try {
    // Buscar todas as empresas com sincronização SEFAZ habilitada
    const syncConfigs = await prisma.sefazSyncConfig.findMany({
      where: {
        isEnabled: true,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(`[SEFAZ Cron] Iniciando sincronização para ${syncConfigs.length} empresas`);

    for (const syncConfig of syncConfigs) {
      const companyId = syncConfig.companyId;
      const companyName = syncConfig.company.name;

      try {
        // Buscar configuração SEFAZ da empresa
        const sefazConfig = await getSefazConfig(companyId);

        if (!sefazConfig) {
          console.log(`[SEFAZ Cron] ${companyName}: Sem configuração SEFAZ válida`);
          results.push({
            companyId,
            companyName,
            success: false,
            nfesFound: 0,
            nfesImported: 0,
            error: "Configuração SEFAZ não encontrada",
          });
          continue;
        }

        // Criar log de sincronização
        const syncLog = await prisma.sefazSyncLog.create({
          data: {
            companyId,
            syncType: "SCHEDULED",
            status: "STARTED",
          },
        });

        // Consultar NFes destinadas
        const client = createSefazClient(sefazConfig);
        const result = await client.consultarNFeDestinadas();

        if (!result.success) {
          await prisma.sefazSyncLog.update({
            where: { id: syncLog.id },
            data: {
              status: "ERROR",
              completedAt: new Date(),
              errorMessage: result.message,
            },
          });

          results.push({
            companyId,
            companyName,
            success: false,
            nfesFound: 0,
            nfesImported: 0,
            error: result.message,
          });
          continue;
        }

        // Processar NFes encontradas
        const nfesFound = result.nfes?.length || 0;
        let nfesImported = 0;

        for (const nfe of result.nfes || []) {
          // Verificar se já existe
          const existing = await prisma.sefazPendingNfe.findFirst({
            where: { companyId, chaveAcesso: nfe.chaveAcesso },
          });

          if (existing) {
            continue;
          }

          // Criar registro pendente
          await prisma.sefazPendingNfe.create({
            data: {
              companyId,
              chaveAcesso: nfe.chaveAcesso,
              cnpjEmitente: nfe.cnpjEmitente || "",
              nomeEmitente: nfe.nomeEmitente,
              dataEmissao: nfe.dataEmissao ? new Date(nfe.dataEmissao) : null,
              valorTotal: nfe.valorNota,
              situacao: "PENDENTE",
            },
          });

          nfesImported++;
        }

        // Atualizar data da última sincronização
        await prisma.sefazSyncConfig.update({
          where: { id: syncConfig.id },
          data: {
            lastSyncAt: new Date(),
          },
        });

        // Atualizar log de sucesso
        await prisma.sefazSyncLog.update({
          where: { id: syncLog.id },
          data: {
            status: "SUCCESS",
            completedAt: new Date(),
            nfesFound,
            nfesImported,
            nfesSkipped: nfesFound - nfesImported,
          },
        });

        results.push({
          companyId,
          companyName,
          success: true,
          nfesFound,
          nfesImported,
        });

        console.log(`[SEFAZ Cron] ${companyName}: ${nfesFound} NFes encontradas, ${nfesImported} importadas`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        console.error(`[SEFAZ Cron] ${companyName}: Erro - ${errorMessage}`);
        
        results.push({
          companyId,
          companyName,
          success: false,
          nfesFound: 0,
          nfesImported: 0,
          error: errorMessage,
        });
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const totalNfesImported = results.reduce((sum, r) => sum + r.nfesImported, 0);

    console.log(`[SEFAZ Cron] Concluído em ${duration}ms: ${successCount}/${results.length} empresas, ${totalNfesImported} NFes importadas`);

    return NextResponse.json({
      success: true,
      duration,
      companies: results.length,
      successCount,
      totalNfesImported,
      results,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`[SEFAZ Cron] Erro geral: ${errorMessage}`);
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      duration: Date.now() - startTime,
    }, { status: 500 });
  }
}
