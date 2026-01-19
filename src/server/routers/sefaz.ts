import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createSefazClient, SefazConfig, ManifestacaoTipo, SefazEnvironment } from "@/lib/sefaz";
import { Prisma } from "@prisma/client";

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

      return result;
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
