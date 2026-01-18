import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { fetchXmlAttachments, testConnection, type EmailConfig } from "@/lib/email/imap-client";
import { parseNFeXml, validateNFeXml } from "@/lib/nfe-parser";

export const emailIntegrationRouter = createTRPCRouter({
  // Testar conexão com servidor de email
  testConnection: tenantProcedure
    .input(z.object({
      host: z.string(),
      port: z.number(),
      user: z.string(),
      password: z.string(),
      tls: z.boolean().default(true),
      folder: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const config: EmailConfig = {
        host: input.host,
        port: input.port,
        user: input.user,
        password: input.password,
        tls: input.tls,
        folder: input.folder,
      };

      const result = await testConnection(config);
      return result;
    }),

  // Buscar XMLs de NFe do email
  fetchNFeFromEmail: tenantProcedure
    .input(z.object({
      host: z.string(),
      port: z.number(),
      user: z.string(),
      password: z.string(),
      tls: z.boolean().default(true),
      folder: z.string().optional(),
      onlyUnread: z.boolean().default(true),
      markAsRead: z.boolean().default(true),
      moveToFolder: z.string().optional(),
      maxMessages: z.number().default(50),
    }))
    .mutation(async ({ input, ctx }) => {
      const config: EmailConfig = {
        host: input.host,
        port: input.port,
        user: input.user,
        password: input.password,
        tls: input.tls,
        folder: input.folder,
      };

      // Buscar anexos XML
      const fetchResult = await fetchXmlAttachments(config, {
        onlyUnread: input.onlyUnread,
        markAsRead: input.markAsRead,
        moveToFolder: input.moveToFolder,
        maxMessages: input.maxMessages,
      });

      if (!fetchResult.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: fetchResult.errors.join("; "),
        });
      }

      // Processar cada XML encontrado
      const results: Array<{
        filename: string;
        fromEmail: string;
        success: boolean;
        invoiceNumber?: number;
        accessKey?: string;
        error?: string;
        alreadyExists?: boolean;
      }> = [];

      for (const xmlFile of fetchResult.xmlFiles) {
        try {
          // Validar XML
          const validation = validateNFeXml(xmlFile.content);
          if (!validation.valid) {
            results.push({
              filename: xmlFile.filename,
              fromEmail: xmlFile.fromEmail,
              success: false,
              error: validation.error || "XML inválido",
            });
            continue;
          }

          // Parsear XML
          const parsed = parseNFeXml(xmlFile.content);

          // Verificar se já existe
          const existing = await ctx.prisma.receivedInvoice.findUnique({
            where: { accessKey: parsed.chaveAcesso },
          });

          if (existing) {
            results.push({
              filename: xmlFile.filename,
              fromEmail: xmlFile.fromEmail,
              success: false,
              invoiceNumber: parsed.numero,
              accessKey: parsed.chaveAcesso,
              error: "NFe já importada",
              alreadyExists: true,
            });
            continue;
          }

          // Buscar fornecedor pelo CNPJ
          const cnpjLimpo = parsed.emitente.cnpj.replace(/\D/g, "");
          const supplier = await ctx.prisma.supplier.findFirst({
            where: { cnpj: { contains: cnpjLimpo } },
          });

          // Criar NFe
          await ctx.prisma.receivedInvoice.create({
            data: {
              accessKey: parsed.chaveAcesso,
              invoiceNumber: parsed.numero,
              series: parsed.serie,
              issueDate: parsed.dataEmissao,
              supplierId: supplier?.id,
              supplierCnpj: parsed.emitente.cnpj,
              supplierName: parsed.emitente.razaoSocial,
              totalProducts: parsed.totais.valorProdutos,
              totalInvoice: parsed.totais.valorNota,
              freightValue: parsed.totais.valorFrete,
              discountValue: parsed.totais.valorDesconto,
              icmsBase: parsed.totais.baseCalculoIcms,
              icmsValue: parsed.totais.valorIcms,
              ipiValue: parsed.totais.valorIpi,
              pisValue: parsed.totais.valorPis,
              cofinsValue: parsed.totais.valorCofins,
              xmlContent: xmlFile.content,
              companyId: ctx.companyId,
              items: {
                create: parsed.itens.map((item) => ({
                  itemNumber: item.numero,
                  productCode: item.codigo,
                  productName: item.descricao,
                  ncm: item.ncm,
                  cfop: item.cfop,
                  quantity: item.quantidade,
                  unit: item.unidade,
                  unitPrice: item.valorUnitario,
                  totalPrice: item.valorTotal,
                  icmsRate: item.icms.aliquota,
                  icmsValue: item.icms.valor,
                  ipiRate: item.ipi.aliquota,
                  ipiValue: item.ipi.valor,
                })),
              },
            },
          });

          results.push({
            filename: xmlFile.filename,
            fromEmail: xmlFile.fromEmail,
            success: true,
            invoiceNumber: parsed.numero,
            accessKey: parsed.chaveAcesso,
          });
        } catch (err) {
          results.push({
            filename: xmlFile.filename,
            fromEmail: xmlFile.fromEmail,
            success: false,
            error: err instanceof Error ? err.message : "Erro desconhecido",
          });
        }
      }

      return {
        messagesProcessed: fetchResult.messages.length,
        xmlFilesFound: fetchResult.xmlFiles.length,
        imported: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success && !r.alreadyExists).length,
        alreadyExists: results.filter((r) => r.alreadyExists).length,
        results,
        errors: fetchResult.errors,
      };
    }),

  // Salvar configuração de email
  saveConfig: tenantProcedure
    .input(z.object({
      host: z.string(),
      port: z.number(),
      user: z.string(),
      password: z.string(),
      tls: z.boolean().default(true),
      folder: z.string().optional(),
      autoFetch: z.boolean().default(false),
      fetchInterval: z.number().default(30), // minutos
    }))
    .mutation(async ({ input, ctx }) => {
      // Salvar nas configurações do sistema
      const configKey = "email_nfe_config";
      
      await ctx.prisma.systemSetting.upsert({
        where: {
          key_companyId: { key: configKey, companyId: ctx.companyId! },
        },
        create: {
          key: configKey,
          value: JSON.stringify({
            host: input.host,
            port: input.port,
            user: input.user,
            tls: input.tls,
            folder: input.folder,
            autoFetch: input.autoFetch,
            fetchInterval: input.fetchInterval,
          }),
          companyId: ctx.companyId,
          updatedBy: ctx.tenant.userId,
        },
        update: {
          value: JSON.stringify({
            host: input.host,
            port: input.port,
            user: input.user,
            tls: input.tls,
            folder: input.folder,
            autoFetch: input.autoFetch,
            fetchInterval: input.fetchInterval,
          }),
          updatedBy: ctx.tenant.userId,
        },
      });

      // Senha é salva separadamente (criptografada em produção)
      const passwordKey = "email_nfe_password";
      await ctx.prisma.systemSetting.upsert({
        where: {
          key_companyId: { key: passwordKey, companyId: ctx.companyId! },
        },
        create: {
          key: passwordKey,
          value: input.password, // Em produção, criptografar
          companyId: ctx.companyId,
          updatedBy: ctx.tenant.userId,
        },
        update: {
          value: input.password,
          updatedBy: ctx.tenant.userId,
        },
      });

      return { success: true };
    }),

  // Obter configuração de email
  getConfig: tenantProcedure.query(async ({ ctx }) => {
    const configKey = "email_nfe_config";
    const setting = await ctx.prisma.systemSetting.findUnique({
      where: {
        key_companyId: { key: configKey, companyId: ctx.companyId! },
      },
    });

    if (!setting) {
      return null;
    }

    try {
      return JSON.parse(String(setting.value)) as {
        host: string;
        port: number;
        user: string;
        tls: boolean;
        folder?: string;
        autoFetch: boolean;
        fetchInterval: number;
      };
    } catch {
      return null;
    }
  }),
});
