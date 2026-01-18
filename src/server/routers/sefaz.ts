import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createSefazClient, SefazConfig, ManifestacaoTipo } from "@/lib/sefaz";

export const sefazRouter = createTRPCRouter({
  // Consultar NFe destinadas ao CNPJ da empresa
  consultarNFeDestinadas: tenantProcedure
    .input(z.object({
      ultimoNSU: z.string().optional(),
    }).optional())
    .mutation(async ({ input, ctx }) => {
      // Buscar configuração SEFAZ da empresa
      const config = await getSefazConfig(ctx.companyId);
      
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
      const config = await getSefazConfig(ctx.companyId);
      
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
      const config = await getSefazConfig(ctx.companyId);
      
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
    const config = await getSefazConfig(ctx.companyId);
    
    return {
      configured: !!config,
      environment: config?.environment || null,
      cnpj: config?.cnpj || null,
      hasCertificate: !!(config?.certificate?.pfxBase64 || config?.certificate?.pfxPath),
    };
  }),
});

/**
 * Busca configuração SEFAZ da empresa
 * TODO: Implementar busca no banco de dados
 */
async function getSefazConfig(companyId: string): Promise<SefazConfig | null> {
  // Por enquanto, retorna null (não configurado)
  // Em produção, buscar da tabela de configurações da empresa
  
  // Exemplo de como seria:
  // const settings = await prisma.systemSetting.findFirst({
  //   where: { companyId, key: "sefaz_config" },
  // });
  // if (settings?.value) {
  //   return JSON.parse(settings.value as string) as SefazConfig;
  // }
  
  return null;
}
