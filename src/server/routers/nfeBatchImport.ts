/**
 * NFe Batch Import Router
 * VIO-863: Importação em lote de XMLs de NFe (Entrada e Saída)
 */

import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { tenantFilter } from "../trpc";

// ============================================================================
// SCHEMAS
// ============================================================================

const nfeXmlSchema = z.object({
  fileName: z.string(),
  xmlContent: z.string(),
});

const batchImportInputSchema = z.object({
  xmlFiles: z.array(nfeXmlSchema).min(1).max(100),
  type: z.enum(["entrada", "saida"]),
  skipDuplicates: z.boolean().default(true),
  dryRun: z.boolean().default(false),
});

// ============================================================================
// PARSER HELPERS
// ============================================================================

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function extractTagContent(xml: string, tag: string): string | null {
  const startTag = `<${tag}`;
  const endTag = `</${tag}>`;
  const startIdx = xml.indexOf(startTag);
  if (startIdx === -1) return null;
  
  const contentStart = xml.indexOf(">", startIdx) + 1;
  const endIdx = xml.indexOf(endTag, contentStart);
  if (endIdx === -1) return null;
  
  return xml.substring(contentStart, endIdx);
}

interface ParsedNFe {
  chaveAcesso: string;
  numero: number;
  serie: number;
  dataEmissao: Date;
  tipoNF: "entrada" | "saida";
  emitente: {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia?: string;
    ie?: string;
    uf: string;
    cidade: string;
  };
  destinatario: {
    cnpj: string;
    razaoSocial: string;
    ie?: string;
    uf: string;
    cidade: string;
  };
  valores: {
    produtos: number;
    frete: number;
    seguro: number;
    desconto: number;
    icms: number;
    ipi: number;
    pis: number;
    cofins: number;
    total: number;
  };
  itens: {
    numero: number;
    codigo: string;
    descricao: string;
    ncm: string;
    cfop: number;
    unidade: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
  }[];
  protocolo?: string;
  xmlContent: string;
}

function parseNFeXml(xmlContent: string): ParsedNFe {
  if (!xmlContent.includes("<nfeProc") && !xmlContent.includes("<NFe")) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Não é um XML de NFe válido" });
  }

  const infNFe = extractTagContent(xmlContent, "infNFe");
  if (!infNFe) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Tag infNFe não encontrada" });
  }

  const idMatch = xmlContent.match(/Id="NFe(\d{44})"/);
  const chaveAcesso = idMatch ? idMatch[1] : "";
  if (!chaveAcesso || chaveAcesso.length !== 44) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Chave de acesso inválida" });
  }

  const ide = extractTagContent(infNFe, "ide");
  if (!ide) throw new TRPCError({ code: "NOT_FOUND", message: "Tag ide não encontrada" });

  const numero = parseInt(extractTag(ide, "nNF") || "0");
  const serie = parseInt(extractTag(ide, "serie") || "1");
  const dhEmi = extractTag(ide, "dhEmi") || "";
  const tpNF = extractTag(ide, "tpNF");
  const tipoNF = tpNF === "0" ? "entrada" : "saida";

  const emit = extractTagContent(infNFe, "emit");
  if (!emit) throw new TRPCError({ code: "NOT_FOUND", message: "Tag emit não encontrada" });

  const emitCnpj = extractTag(emit, "CNPJ") || "";
  const emitRazao = extractTag(emit, "xNome") || "";
  const emitFantasia = extractTag(emit, "xFant") || undefined;
  const emitIe = extractTag(emit, "IE") || undefined;
  const enderEmit = extractTagContent(emit, "enderEmit");
  const emitUf = enderEmit ? extractTag(enderEmit, "UF") || "" : "";
  const emitCidade = enderEmit ? extractTag(enderEmit, "xMun") || "" : "";

  const dest = extractTagContent(infNFe, "dest");
  if (!dest) throw new TRPCError({ code: "NOT_FOUND", message: "Tag dest não encontrada" });

  const destCnpj = extractTag(dest, "CNPJ") || extractTag(dest, "CPF") || "";
  const destRazao = extractTag(dest, "xNome") || "";
  const destIe = extractTag(dest, "IE") || undefined;
  const enderDest = extractTagContent(dest, "enderDest");
  const destUf = enderDest ? extractTag(enderDest, "UF") || "" : "";
  const destCidade = enderDest ? extractTag(enderDest, "xMun") || "" : "";

  const total = extractTagContent(infNFe, "total");
  const icmsTot = total ? extractTagContent(total, "ICMSTot") : null;

  const valores = {
    produtos: parseFloat(icmsTot ? extractTag(icmsTot, "vProd") || "0" : "0"),
    frete: parseFloat(icmsTot ? extractTag(icmsTot, "vFrete") || "0" : "0"),
    seguro: parseFloat(icmsTot ? extractTag(icmsTot, "vSeg") || "0" : "0"),
    desconto: parseFloat(icmsTot ? extractTag(icmsTot, "vDesc") || "0" : "0"),
    icms: parseFloat(icmsTot ? extractTag(icmsTot, "vICMS") || "0" : "0"),
    ipi: parseFloat(icmsTot ? extractTag(icmsTot, "vIPI") || "0" : "0"),
    pis: parseFloat(icmsTot ? extractTag(icmsTot, "vPIS") || "0" : "0"),
    cofins: parseFloat(icmsTot ? extractTag(icmsTot, "vCOFINS") || "0" : "0"),
    total: parseFloat(icmsTot ? extractTag(icmsTot, "vNF") || "0" : "0"),
  };

  const itens: ParsedNFe["itens"] = [];
  const detMatches = infNFe.matchAll(/<det nItem="(\d+)">([\s\S]*?)<\/det>/g);
  for (const match of detMatches) {
    const nItem = parseInt(match[1]);
    const detContent = match[2];
    const prod = extractTagContent(detContent, "prod");
    if (prod) {
      itens.push({
        numero: nItem,
        codigo: extractTag(prod, "cProd") || "",
        descricao: extractTag(prod, "xProd") || "",
        ncm: extractTag(prod, "NCM") || "",
        cfop: parseInt(extractTag(prod, "CFOP") || "0"),
        unidade: extractTag(prod, "uCom") || "",
        quantidade: parseFloat(extractTag(prod, "qCom") || "0"),
        valorUnitario: parseFloat(extractTag(prod, "vUnCom") || "0"),
        valorTotal: parseFloat(extractTag(prod, "vProd") || "0"),
      });
    }
  }

  const protNFe = extractTagContent(xmlContent, "protNFe");
  const protocolo = protNFe ? extractTag(protNFe, "nProt") || undefined : undefined;

  return {
    chaveAcesso,
    numero,
    serie,
    dataEmissao: new Date(dhEmi),
    tipoNF,
    emitente: {
      cnpj: emitCnpj,
      razaoSocial: emitRazao,
      nomeFantasia: emitFantasia,
      ie: emitIe,
      uf: emitUf,
      cidade: emitCidade,
    },
    destinatario: {
      cnpj: destCnpj,
      razaoSocial: destRazao,
      ie: destIe,
      uf: destUf,
      cidade: destCidade,
    },
    valores,
    itens,
    protocolo,
    xmlContent,
  };
}

// ============================================================================
// ROUTER
// ============================================================================

export const nfeBatchImportRouter = createTRPCRouter({
  /**
   * Validar lote de XMLs sem importar
   */
  validate: tenantProcedure
    .input(z.object({
      xmlFiles: z.array(nfeXmlSchema).min(1).max(100),
    }))
    .mutation(async ({ input }) => {
      const results: {
        fileName: string;
        status: "valid" | "invalid" | "duplicate";
        chaveAcesso?: string;
        numero?: number;
        emitente?: string;
        destinatario?: string;
        valorTotal?: number;
        error?: string;
      }[] = [];

      for (const file of input.xmlFiles) {
        try {
          const parsed = parseNFeXml(file.xmlContent);
          
          const existing = await prisma.receivedInvoice.findUnique({
            where: { accessKey: parsed.chaveAcesso },
          });

          if (existing) {
            results.push({
              fileName: file.fileName,
              status: "duplicate",
              chaveAcesso: parsed.chaveAcesso,
              numero: parsed.numero,
              error: "NFe já importada",
            });
            continue;
          }

          results.push({
            fileName: file.fileName,
            status: "valid",
            chaveAcesso: parsed.chaveAcesso,
            numero: parsed.numero,
            emitente: parsed.emitente.razaoSocial,
            destinatario: parsed.destinatario.razaoSocial,
            valorTotal: parsed.valores.total,
          });
        } catch (error) {
          results.push({
            fileName: file.fileName,
            status: "invalid",
            error: error instanceof Error ? error.message : "Erro desconhecido",
          });
        }
      }

      return {
        total: results.length,
        valid: results.filter((r) => r.status === "valid").length,
        invalid: results.filter((r) => r.status === "invalid").length,
        duplicates: results.filter((r) => r.status === "duplicate").length,
        results,
      };
    }),

  /**
   * Importar lote de XMLs de NFe de Entrada
   */
  importEntrada: tenantProcedure
    .input(batchImportInputSchema)
    .mutation(async ({ input, ctx }) => {
      if (input.type !== "entrada") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este endpoint é apenas para NFe de Entrada",
        });
      }

      const results: {
        fileName: string;
        status: "imported" | "skipped" | "error";
        chaveAcesso?: string;
        invoiceId?: string;
        error?: string;
      }[] = [];

      for (const file of input.xmlFiles) {
        try {
          const parsed = parseNFeXml(file.xmlContent);

          const existing = await prisma.receivedInvoice.findUnique({
            where: { accessKey: parsed.chaveAcesso },
          });

          if (existing) {
            if (input.skipDuplicates) {
              results.push({
                fileName: file.fileName,
                status: "skipped",
                chaveAcesso: parsed.chaveAcesso,
                error: "NFe já importada",
              });
              continue;
            } else {
              throw new TRPCError({ code: "BAD_REQUEST", message: "NFe já importada" });
            }
          }

          if (input.dryRun) {
            results.push({
              fileName: file.fileName,
              status: "imported",
              chaveAcesso: parsed.chaveAcesso,
              error: "Dry run - não importado",
            });
            continue;
          }

          // Buscar ou criar fornecedor
          let supplier = await prisma.supplier.findFirst({
            where: {
              cnpj: { contains: parsed.emitente.cnpj },
              ...tenantFilter(ctx.companyId),
            },
          });

          if (!supplier) {
            const maxCode = await prisma.supplier.aggregate({
              where: tenantFilter(ctx.companyId),
              _max: { code: true },
            });

            supplier = await prisma.supplier.create({
              data: {
                code: (maxCode._max.code || 0) + 1,
                companyName: parsed.emitente.razaoSocial,
                tradeName: parsed.emitente.nomeFantasia,
                cnpj: parsed.emitente.cnpj,
                city: parsed.emitente.cidade,
                state: parsed.emitente.uf,
                status: "ACTIVE",
                companyId: ctx.companyId,
              },
            });
          }

          // Criar NFe de entrada
          const invoice = await prisma.receivedInvoice.create({
            data: {
              accessKey: parsed.chaveAcesso,
              invoiceNumber: parsed.numero,
              series: parsed.serie,
              issueDate: parsed.dataEmissao,
              supplierId: supplier.id,
              supplierCnpj: parsed.emitente.cnpj,
              supplierName: parsed.emitente.razaoSocial,
              companyId: ctx.companyId,
              totalProducts: parsed.valores.produtos,
              discountValue: parsed.valores.desconto,
              freightValue: parsed.valores.frete,
              icmsBase: parsed.valores.produtos,
              icmsValue: parsed.valores.icms,
              ipiValue: parsed.valores.ipi,
              pisValue: parsed.valores.pis,
              cofinsValue: parsed.valores.cofins,
              totalInvoice: parsed.valores.total,
              status: "PENDING",
              xmlContent: parsed.xmlContent,
            },
          });

          // Criar itens
          for (const item of parsed.itens) {
            const material = await prisma.material.findFirst({
              where: {
                OR: [
                  { internalCode: item.codigo },
                  { code: parseInt(item.codigo) || 0 },
                ],
                ...tenantFilter(ctx.companyId),
              },
            });

            await prisma.receivedInvoiceItem.create({
              data: {
                invoiceId: invoice.id,
                materialId: material?.id,
                itemNumber: item.numero,
                productCode: item.codigo,
                productName: item.descricao,
                ncm: item.ncm,
                cfop: item.cfop,
                unit: item.unidade,
                quantity: item.quantidade,
                unitPrice: item.valorUnitario,
                totalPrice: item.valorTotal,
              },
            });
          }

          results.push({
            fileName: file.fileName,
            status: "imported",
            chaveAcesso: parsed.chaveAcesso,
            invoiceId: invoice.id,
          });
        } catch (error) {
          results.push({
            fileName: file.fileName,
            status: "error",
            error: error instanceof Error ? error.message : "Erro desconhecido",
          });
        }
      }

      return {
        total: results.length,
        imported: results.filter((r) => r.status === "imported").length,
        skipped: results.filter((r) => r.status === "skipped").length,
        errors: results.filter((r) => r.status === "error").length,
        results,
      };
    }),

  /**
   * Importar lote de XMLs de NFe de Saída
   */
  importSaida: tenantProcedure
    .input(batchImportInputSchema)
    .mutation(async ({ input, ctx }) => {
      if (input.type !== "saida") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este endpoint é apenas para NFe de Saída",
        });
      }

      const results: {
        fileName: string;
        status: "imported" | "skipped" | "error";
        chaveAcesso?: string;
        invoiceId?: string;
        error?: string;
      }[] = [];

      for (const file of input.xmlFiles) {
        try {
          const parsed = parseNFeXml(file.xmlContent);

          const existing = await prisma.issuedInvoice.findFirst({
            where: { accessKey: parsed.chaveAcesso },
          });

          if (existing) {
            if (input.skipDuplicates) {
              results.push({
                fileName: file.fileName,
                status: "skipped",
                chaveAcesso: parsed.chaveAcesso,
                error: "NFe já importada",
              });
              continue;
            } else {
              throw new TRPCError({ code: "BAD_REQUEST", message: "NFe já importada" });
            }
          }

          if (input.dryRun) {
            results.push({
              fileName: file.fileName,
              status: "imported",
              chaveAcesso: parsed.chaveAcesso,
              error: "Dry run - não importado",
            });
            continue;
          }

          // Buscar ou criar cliente
          let customer = await prisma.customer.findFirst({
            where: {
              OR: [
                { cnpj: { contains: parsed.destinatario.cnpj } },
                { cpf: { contains: parsed.destinatario.cnpj } },
              ],
              ...tenantFilter(ctx.companyId),
            },
          });

          if (!customer) {
            const maxCodeResult = await prisma.customer.aggregate({
              where: tenantFilter(ctx.companyId),
              _max: { code: true },
            });

            const isCnpj = parsed.destinatario.cnpj.length === 14;
            const nextCode = String(Number(maxCodeResult._max.code || "0") + 1);
            customer = await prisma.customer.create({
              data: {
                code: nextCode,
                companyName: parsed.destinatario.razaoSocial,
                cnpj: isCnpj ? parsed.destinatario.cnpj : undefined,
                cpf: !isCnpj ? parsed.destinatario.cnpj : undefined,
                addressCity: parsed.destinatario.cidade,
                addressState: parsed.destinatario.uf,
                status: "ACTIVE",
                companyId: ctx.companyId,
              },
            });
          }

          // Criar NFe de saída
          const maxInvoiceCode = await prisma.issuedInvoice.aggregate({
            where: { companyId: ctx.companyId },
            _max: { code: true },
          });

          const invoice = await prisma.issuedInvoice.create({
            data: {
              code: (maxInvoiceCode._max.code || 0) + 1,
              invoiceNumber: String(parsed.numero),
              series: String(parsed.serie),
              model: "55",
              accessKey: parsed.chaveAcesso,
              protocolNumber: parsed.protocolo,
              issueDate: parsed.dataEmissao,
              customerId: customer.id,
              companyId: ctx.companyId,
              subtotal: parsed.valores.produtos,
              discountValue: parsed.valores.desconto,
              shippingValue: parsed.valores.frete,
              icmsBase: parsed.valores.produtos,
              icmsValue: parsed.valores.icms,
              ipiValue: parsed.valores.ipi,
              pisValue: parsed.valores.pis,
              cofinsValue: parsed.valores.cofins,
              totalValue: parsed.valores.total,
              status: "AUTHORIZED",
              authorizedAt: parsed.dataEmissao,
              xmlContent: parsed.xmlContent,
            },
          });

          // Criar itens
          for (const item of parsed.itens) {
            const material = await prisma.material.findFirst({
              where: {
                OR: [
                  { internalCode: item.codigo },
                  { code: parseInt(item.codigo) || 0 },
                ],
                ...tenantFilter(ctx.companyId),
              },
            });

            if (material) {
              await prisma.issuedInvoiceItem.create({
                data: {
                  invoiceId: invoice.id,
                  materialId: material.id,
                  description: item.descricao,
                  ncm: item.ncm,
                  cfop: String(item.cfop),
                  unit: item.unidade,
                  quantity: item.quantidade,
                  unitPrice: item.valorUnitario,
                  totalPrice: item.valorTotal,
                },
              });
            }
          }

          results.push({
            fileName: file.fileName,
            status: "imported",
            chaveAcesso: parsed.chaveAcesso,
            invoiceId: invoice.id,
          });
        } catch (error) {
          results.push({
            fileName: file.fileName,
            status: "error",
            error: error instanceof Error ? error.message : "Erro desconhecido",
          });
        }
      }

      return {
        total: results.length,
        imported: results.filter((r) => r.status === "imported").length,
        skipped: results.filter((r) => r.status === "skipped").length,
        errors: results.filter((r) => r.status === "error").length,
        results,
      };
    }),

  /**
   * Estatísticas de importação
   */
  getStats: tenantProcedure.query(async ({ ctx }) => {
    const [receivedCount, issuedCount, receivedTotal, issuedTotal] = await Promise.all([
      prisma.receivedInvoice.count({
        where: { companyId: ctx.companyId },
      }),
      prisma.issuedInvoice.count({
        where: { companyId: ctx.companyId },
      }),
      prisma.receivedInvoice.aggregate({
        where: { companyId: ctx.companyId },
        _sum: { totalInvoice: true },
      }),
      prisma.issuedInvoice.aggregate({
        where: { companyId: ctx.companyId },
        _sum: { totalValue: true },
      }),
    ]);

    return {
      entrada: {
        count: receivedCount,
        total: receivedTotal._sum.totalInvoice || 0,
      },
      saida: {
        count: issuedCount,
        total: issuedTotal._sum.totalValue || 0,
      },
    };
  }),
});
