import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createSefazClient, SefazConfig, ManifestacaoTipo, SefazEnvironment } from "@/lib/sefaz";
import { Prisma } from "@prisma/client";
import { parsePfxCertificate, validateCertificate } from "@/lib/sefaz/certificate-parser";

export const sefazRouter = createTRPCRouter({
  // Consultar NFe destinadas ao CNPJ da empresa
  consultarNFeDestinadas: tenantProcedure
    .input(z.object({
      ultimoNSU: z.string().optional(),
    }).optional())
    .mutation(async ({ input, ctx }) => {
      // Buscar configuração SEFAZ da empresa
      const config = await getSefazConfig(ctx.companyId!, ctx.prisma);
      
      if (!config) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Configuração SEFAZ não encontrada. Configure o certificado digital.",
        });
      }

      const client = createSefazClient(config);
      const result = await client.consultarNFeDestinadas(input?.ultimoNSU);

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.message || "Erro ao consultar SEFAZ",
        });
      }

      return result;
    }),

  // Consultar NFe por chave de acesso
  consultarPorChave: tenantProcedure
    .input(z.object({
      chaveAcesso: z.string().length(44, "Chave de acesso deve ter 44 dígitos"),
    }))
    .mutation(async ({ input, ctx }) => {
      const config = await getSefazConfig(ctx.companyId!, ctx.prisma);
      
      if (!config) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Configuração SEFAZ não encontrada",
        });
      }

      const client = createSefazClient(config);
      const result = await client.consultarPorChave(input.chaveAcesso);

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.message || "Erro ao consultar NFe",
        });
      }

      return result;
    }),

  // Registrar manifestação do destinatário
  manifestar: tenantProcedure
    .input(z.object({
      chaveAcesso: z.string().length(44),
      tipo: z.enum(["CIENCIA", "CONFIRMACAO", "DESCONHECIMENTO", "NAO_REALIZADA"]),
      justificativa: z.string().optional(),
      pendingNfeId: z.string().uuid().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const config = await getSefazConfig(ctx.companyId!, ctx.prisma);
      
      if (!config) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Configuração SEFAZ não encontrada",
        });
      }

      const client = createSefazClient(config);
      const result = await client.manifestar(
        input.chaveAcesso,
        input.tipo as ManifestacaoTipo,
        input.justificativa
      );

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.message || "Erro ao registrar manifestação",
        });
      }

      // Registrar histórico de manifestação
      await ctx.prisma.sefazManifestacaoLog.create({
        data: {
          companyId: ctx.companyId,
          chaveAcesso: input.chaveAcesso,
          tipo: input.tipo,
          justificativa: input.justificativa,
          protocolo: result.protocolo,
          dataManifestacao: result.dataRecebimento || new Date(),
          status: "SUCESSO",
          pendingNfeId: input.pendingNfeId,
          userId: ctx.tenant.userId,
        },
      });

      // Atualizar NFe pendente se informada
      if (input.pendingNfeId) {
        await ctx.prisma.sefazPendingNfe.update({
          where: { id: input.pendingNfeId },
          data: {
            manifestacao: input.tipo,
            manifestadaEm: new Date(),
          },
        });
      }

      return result;
    }),

  // Manifestação em lote
  manifestarEmLote: tenantProcedure
    .input(z.object({
      nfeIds: z.array(z.string().uuid()),
      tipo: z.enum(["CIENCIA", "CONFIRMACAO", "DESCONHECIMENTO", "NAO_REALIZADA"]),
      justificativa: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const config = await getSefazConfig(ctx.companyId!, ctx.prisma);
      
      if (!config) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Configuração SEFAZ não encontrada",
        });
      }

      // Buscar NFes pendentes
      const nfes = await ctx.prisma.sefazPendingNfe.findMany({
        where: {
          id: { in: input.nfeIds },
          companyId: ctx.companyId,
        },
      });

      if (nfes.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nenhuma NFe encontrada",
        });
      }

      const client = createSefazClient(config);
      const results: { chaveAcesso: string; success: boolean; message?: string }[] = [];

      for (const nfe of nfes) {
        try {
          const result = await client.manifestar(
            nfe.chaveAcesso,
            input.tipo as ManifestacaoTipo,
            input.justificativa
          );

          // Registrar histórico
          await ctx.prisma.sefazManifestacaoLog.create({
            data: {
              companyId: ctx.companyId,
              chaveAcesso: nfe.chaveAcesso,
              tipo: input.tipo,
              justificativa: input.justificativa,
              protocolo: result.protocolo,
              dataManifestacao: result.dataRecebimento || new Date(),
              status: result.success ? "SUCESSO" : "ERRO",
              errorMessage: result.message,
              pendingNfeId: nfe.id,
              userId: ctx.tenant.userId,
            },
          });

          // Atualizar NFe pendente
          if (result.success) {
            await ctx.prisma.sefazPendingNfe.update({
              where: { id: nfe.id },
              data: {
                manifestacao: input.tipo,
                manifestadaEm: new Date(),
              },
            });
          }

          results.push({
            chaveAcesso: nfe.chaveAcesso,
            success: result.success,
            message: result.message,
          });
        } catch (error) {
          results.push({
            chaveAcesso: nfe.chaveAcesso,
            success: false,
            message: error instanceof Error ? error.message : "Erro desconhecido",
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const errorCount = results.filter((r) => !r.success).length;

      return {
        success: errorCount === 0,
        message: `${successCount} manifestações realizadas, ${errorCount} erros`,
        results,
        successCount,
        errorCount,
      };
    }),

  // Histórico de manifestações
  listManifestacoes: tenantProcedure
    .input(z.object({
      chaveAcesso: z.string().optional(),
      tipo: z.enum(["CIENCIA", "CONFIRMACAO", "DESCONHECIMENTO", "NAO_REALIZADA"]).optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { chaveAcesso, tipo, page = 1, limit = 20 } = input || {};

      const where = {
        companyId: ctx.companyId,
        ...(chaveAcesso && { chaveAcesso }),
        ...(tipo && { tipo }),
      };

      const [manifestacoes, total] = await Promise.all([
        ctx.prisma.sefazManifestacaoLog.findMany({
          where,
          orderBy: { dataManifestacao: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            pendingNfe: {
              select: {
                nomeEmitente: true,
                cnpjEmitente: true,
                valorTotal: true,
              },
            },
          },
        }),
        ctx.prisma.sefazManifestacaoLog.count({ where }),
      ]);

      return { manifestacoes, total, pages: Math.ceil(total / limit) };
    }),

  // Verificar status da configuração SEFAZ
  status: tenantProcedure.query(async ({ ctx }) => {
    const setting = await ctx.prisma.systemSetting.findFirst({
      where: { companyId: ctx.companyId, key: "sefaz_config" },
    });

    if (!setting?.value) {
      return {
        configured: false,
        environment: null,
        cnpj: null,
        hasCertificate: false,
      };
    }

    const config = setting.value as unknown as SefazConfigStored;
    return {
      configured: true,
      environment: config.environment,
      cnpj: config.cnpj,
      hasCertificate: !!config.certificateId,
    };
  }),

  // Salvar configuração SEFAZ
  saveConfig: tenantProcedure
    .input(z.object({
      cnpj: z.string().length(14, "CNPJ deve ter 14 dígitos"),
      uf: z.string().length(2),
      environment: z.enum(["homologacao", "producao"]),
      certificateBase64: z.string().optional(),
      certificatePassword: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const configValue: SefazConfigStored = {
        cnpj: input.cnpj,
        uf: input.uf,
        environment: input.environment,
        certificateId: input.certificateBase64 ? `cert_${ctx.companyId}` : undefined,
      };

      // Upsert da configuração
      await ctx.prisma.systemSetting.upsert({
        where: {
          key_companyId: {
            key: "sefaz_config",
            companyId: ctx.companyId!,
          },
        },
        create: {
          key: "sefaz_config",
          category: "integrations",
          companyId: ctx.companyId,
          value: configValue as unknown as Prisma.InputJsonValue,
          description: "Configuração de integração SEFAZ",
          updatedBy: ctx.tenant.userId,
        },
        update: {
          value: configValue as unknown as Prisma.InputJsonValue,
          updatedBy: ctx.tenant.userId,
        },
      });

      // TODO: Salvar certificado em storage seguro (Supabase Storage ou Vault)
      // Por segurança, o certificado não deve ser salvo em JSON no banco

      return { success: true, message: "Configuração salva com sucesso" };
    }),

  // Obter configuração atual
  getConfig: tenantProcedure.query(async ({ ctx }) => {
    const setting = await ctx.prisma.systemSetting.findFirst({
      where: { companyId: ctx.companyId, key: "sefaz_config" },
    });

    if (!setting?.value) {
      return null;
    }

    return setting.value as unknown as SefazConfigStored;
  }),

  // Processar e validar certificado PFX
  parseCertificate: tenantProcedure
    .input(z.object({
      certificateBase64: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Decodificar base64 para buffer
      const pfxBuffer = Buffer.from(input.certificateBase64, "base64");
      
      // Parsear o certificado
      const result = parsePfxCertificate(pfxBuffer, input.password);
      
      if (!result.success || !result.certificate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error || "Erro ao processar certificado",
        });
      }

      const cert = result.certificate;

      // Retornar informações do certificado (sem a chave privada por segurança)
      return {
        success: true,
        certificate: {
          cnpj: cert.cnpj,
          commonName: cert.commonName,
          issuer: cert.issuer,
          validFrom: cert.validFrom.toISOString(),
          validTo: cert.validTo.toISOString(),
          serialNumber: cert.serialNumber,
          thumbprint: cert.thumbprint,
          isValid: cert.isValid,
          daysToExpire: cert.daysToExpire,
        },
      };
    }),

  // Validar certificado existente
  validateStoredCertificate: tenantProcedure
    .query(async ({ ctx }) => {
      // Buscar certificado armazenado
      const certSetting = await ctx.prisma.systemSetting.findFirst({
        where: { companyId: ctx.companyId, key: "sefaz_certificate" },
      });

      if (!certSetting?.value) {
        return { valid: false, error: "Nenhum certificado configurado" };
      }

      const stored = certSetting.value as unknown as { certificatePem: string };
      
      if (!stored.certificatePem) {
        return { valid: false, error: "Certificado não encontrado" };
      }

      const validation = validateCertificate(stored.certificatePem);
      
      return {
        valid: validation.valid,
        daysToExpire: validation.daysToExpire,
        error: validation.error,
      };
    }),

  // Salvar certificado processado
  saveCertificate: tenantProcedure
    .input(z.object({
      certificateBase64: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Decodificar e parsear
      const pfxBuffer = Buffer.from(input.certificateBase64, "base64");
      const result = parsePfxCertificate(pfxBuffer, input.password);
      
      if (!result.success || !result.certificate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error || "Erro ao processar certificado",
        });
      }

      const cert = result.certificate;

      // Verificar se está válido
      if (!cert.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Certificado expirado ou ainda não válido",
        });
      }

      // Salvar certificado e chave privada de forma segura
      // NOTA: Em produção, usar Supabase Vault ou similar
      const certData = {
        certificatePem: cert.certificate,
        privateKeyPem: cert.privateKey, // Criptografar em produção!
        cnpj: cert.cnpj,
        commonName: cert.commonName,
        thumbprint: cert.thumbprint,
        validTo: cert.validTo.toISOString(),
      };

      await ctx.prisma.systemSetting.upsert({
        where: {
          key_companyId: {
            key: "sefaz_certificate",
            companyId: ctx.companyId!,
          },
        },
        create: {
          key: "sefaz_certificate",
          category: "integrations",
          companyId: ctx.companyId,
          value: certData as unknown as Prisma.InputJsonValue,
          description: "Certificado digital A1 para SEFAZ",
          updatedBy: ctx.tenant.userId,
        },
        update: {
          value: certData as unknown as Prisma.InputJsonValue,
          updatedBy: ctx.tenant.userId,
        },
      });

      return {
        success: true,
        message: "Certificado salvo com sucesso",
        certificate: {
          cnpj: cert.cnpj,
          commonName: cert.commonName,
          thumbprint: cert.thumbprint,
          daysToExpire: cert.daysToExpire,
        },
      };
    }),

  // ==========================================================================
  // SINCRONIZAÇÃO AUTOMÁTICA
  // ==========================================================================

  // Obter configuração de sincronização
  getSyncConfig: tenantProcedure.query(async ({ ctx }) => {
    const config = await ctx.prisma.sefazSyncConfig.findUnique({
      where: { companyId: ctx.companyId },
    });

    return config;
  }),

  // Salvar configuração de sincronização
  saveSyncConfig: tenantProcedure
    .input(z.object({
      isEnabled: z.boolean(),
      syncInterval: z.number().min(15).max(1440).default(60), // 15 min a 24h
      autoManifest: z.boolean().default(false),
      manifestType: z.enum(["CIENCIA", "CONFIRMACAO", "DESCONHECIMENTO", "NAO_REALIZADA"]).default("CIENCIA"),
      notifyOnNewNfe: z.boolean().default(true),
      notifyEmail: z.string().email().optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      const nextSyncAt = input.isEnabled
        ? new Date(Date.now() + input.syncInterval * 60 * 1000)
        : null;

      return ctx.prisma.sefazSyncConfig.upsert({
        where: { companyId: ctx.companyId },
        create: {
          companyId: ctx.companyId,
          ...input,
          nextSyncAt,
        },
        update: {
          ...input,
          nextSyncAt,
        },
      });
    }),

  // Listar NFes pendentes
  listPendingNfes: tenantProcedure
    .input(z.object({
      situacao: z.enum(["PENDENTE", "PROCESSANDO", "IMPORTADA", "IGNORADA", "ERRO"]).optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { situacao, page = 1, limit = 20 } = input || {};

      const where = {
        companyId: ctx.companyId,
        ...(situacao && { situacao }),
      };

      const [nfes, total] = await Promise.all([
        ctx.prisma.sefazPendingNfe.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.sefazPendingNfe.count({ where }),
      ]);

      return { nfes, total, pages: Math.ceil(total / limit) };
    }),

  // Importar NFe pendente (criar ReceivedInvoice)
  importPendingNfe: tenantProcedure
    .input(z.object({
      pendingNfeId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const pendingNfe = await ctx.prisma.sefazPendingNfe.findFirst({
        where: { id: input.pendingNfeId, companyId: ctx.companyId },
      });

      if (!pendingNfe) {
        throw new TRPCError({ code: "NOT_FOUND", message: "NFe pendente não encontrada" });
      }

      if (pendingNfe.situacao === "IMPORTADA") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "NFe já foi importada" });
      }

      if (!pendingNfe.xmlContent) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "XML da NFe não disponível" });
      }

      // Marcar como processando
      await ctx.prisma.sefazPendingNfe.update({
        where: { id: input.pendingNfeId },
        data: { situacao: "PROCESSANDO" },
      });

      try {
        // TODO: Parsear XML e criar ReceivedInvoice
        // Por enquanto, apenas simular a criação
        const receivedInvoice = await ctx.prisma.receivedInvoice.create({
          data: {
            accessKey: pendingNfe.chaveAcesso,
            invoiceNumber: parseInt(pendingNfe.chaveAcesso.substring(25, 34)),
            series: parseInt(pendingNfe.chaveAcesso.substring(22, 25)),
            issueDate: pendingNfe.dataEmissao || new Date(),
            supplierCnpj: pendingNfe.cnpjEmitente,
            supplierName: pendingNfe.nomeEmitente || "Fornecedor",
            totalInvoice: pendingNfe.valorTotal || 0,
            totalProducts: pendingNfe.valorTotal || 0,
            status: "PENDING",
            companyId: ctx.companyId,
            xmlContent: pendingNfe.xmlContent,
          },
        });

        // Atualizar NFe pendente
        await ctx.prisma.sefazPendingNfe.update({
          where: { id: input.pendingNfeId },
          data: {
            situacao: "IMPORTADA",
            receivedInvoiceId: receivedInvoice.id,
          },
        });

        return { success: true, receivedInvoiceId: receivedInvoice.id };
      } catch (error) {
        // Marcar erro
        await ctx.prisma.sefazPendingNfe.update({
          where: { id: input.pendingNfeId },
          data: {
            situacao: "ERRO",
            errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
          },
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao importar NFe",
        });
      }
    }),

  // Ignorar NFe pendente
  ignorePendingNfe: tenantProcedure
    .input(z.object({
      pendingNfeId: z.string().uuid(),
      motivo: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const pendingNfe = await ctx.prisma.sefazPendingNfe.findFirst({
        where: { id: input.pendingNfeId, companyId: ctx.companyId },
      });

      if (!pendingNfe) {
        throw new TRPCError({ code: "NOT_FOUND", message: "NFe pendente não encontrada" });
      }

      return ctx.prisma.sefazPendingNfe.update({
        where: { id: input.pendingNfeId },
        data: {
          situacao: "IGNORADA",
          errorMessage: input.motivo,
        },
      });
    }),

  // Executar sincronização manual
  executarSincronizacao: tenantProcedure
    .mutation(async ({ ctx }) => {
      // Verificar se há configuração SEFAZ
      const sefazConfig = await getSefazConfig(ctx.companyId!, ctx.prisma);
      
      if (!sefazConfig) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Configuração SEFAZ não encontrada",
        });
      }

      // Criar log de sincronização
      const syncLog = await ctx.prisma.sefazSyncLog.create({
        data: {
          companyId: ctx.companyId,
          syncType: "MANUAL",
          status: "STARTED",
        },
      });

      try {
        // Consultar NFes destinadas
        const client = createSefazClient(sefazConfig);
        const result = await client.consultarNFeDestinadas();

        if (!result.success) {
          await ctx.prisma.sefazSyncLog.update({
            where: { id: syncLog.id },
            data: {
              status: "ERROR",
              completedAt: new Date(),
              errorMessage: result.message,
            },
          });

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.message || "Erro ao consultar SEFAZ",
          });
        }

        // Processar NFes encontradas (simulado)
        const nfesFound = result.nfes?.length || 0;
        let nfesImported = 0;
        let nfesSkipped = 0;

        for (const nfe of result.nfes || []) {
          // Verificar se já existe
          const existing = await ctx.prisma.sefazPendingNfe.findFirst({
            where: { companyId: ctx.companyId, chaveAcesso: nfe.chaveAcesso },
          });

          if (existing) {
            nfesSkipped++;
            continue;
          }

          // Criar registro pendente
          await ctx.prisma.sefazPendingNfe.create({
            data: {
              companyId: ctx.companyId,
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

        // Atualizar log
        await ctx.prisma.sefazSyncLog.update({
          where: { id: syncLog.id },
          data: {
            status: "SUCCESS",
            completedAt: new Date(),
            nfesFound,
            nfesImported,
            nfesSkipped,
          },
        });

        // Atualizar última sincronização
        await ctx.prisma.sefazSyncConfig.upsert({
          where: { companyId: ctx.companyId },
          create: {
            companyId: ctx.companyId,
            lastSyncAt: new Date(),
          },
          update: {
            lastSyncAt: new Date(),
          },
        });

        return {
          success: true,
          nfesFound,
          nfesImported,
          nfesSkipped,
        };
      } catch (error) {
        await ctx.prisma.sefazSyncLog.update({
          where: { id: syncLog.id },
          data: {
            status: "ERROR",
            completedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
          },
        });

        throw error;
      }
    }),

  // Listar logs de sincronização
  listSyncLogs: tenantProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { page = 1, limit = 20 } = input || {};

      const [logs, total] = await Promise.all([
        ctx.prisma.sefazSyncLog.findMany({
          where: { companyId: ctx.companyId },
          orderBy: { startedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.sefazSyncLog.count({ where: { companyId: ctx.companyId } }),
      ]);

      return { logs, total, pages: Math.ceil(total / limit) };
    }),

  // Dashboard de sincronização
  getSyncDashboard: tenantProcedure.query(async ({ ctx }) => {
    const [config, pendingCounts, lastLogs] = await Promise.all([
      ctx.prisma.sefazSyncConfig.findUnique({
        where: { companyId: ctx.companyId },
      }),
      ctx.prisma.sefazPendingNfe.groupBy({
        by: ["situacao"],
        where: { companyId: ctx.companyId },
        _count: true,
      }),
      ctx.prisma.sefazSyncLog.findMany({
        where: { companyId: ctx.companyId },
        orderBy: { startedAt: "desc" },
        take: 5,
      }),
    ]);

    const situacaoMap = pendingCounts.reduce(
      (acc, item) => ({ ...acc, [item.situacao]: item._count }),
      { PENDENTE: 0, PROCESSANDO: 0, IMPORTADA: 0, IGNORADA: 0, ERRO: 0 }
    );

    return {
      config,
      pendingNfes: situacaoMap,
      lastLogs,
    };
  }),
});

interface SefazConfigStored {
  cnpj: string;
  uf: string;
  environment: "homologacao" | "producao";
  certificateId?: string;
}

/**
 * Busca configuração SEFAZ da empresa e monta objeto para o cliente
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getSefazConfig(companyId: string, prisma: any): Promise<SefazConfig | null> {
  const setting = await prisma.systemSetting.findFirst({
    where: { companyId, key: "sefaz_config" },
  });

  if (!setting?.value) {
    return null;
  }

  const stored = setting.value as unknown as SefazConfigStored;
  
  // TODO: Buscar certificado do storage seguro
  // Por enquanto, retorna config sem certificado (modo desenvolvimento)
  
  return {
    cnpj: stored.cnpj,
    uf: stored.uf as SefazEnvironment extends string ? string : never,
    environment: stored.environment,
    certificate: stored.certificateId ? { pfxPath: stored.certificateId, password: "" } : undefined,
  } as SefazConfig;
}
