/**
 * Delphi Data Importer
 * Importa dados do sistema Delphi (FRM) a partir de arquivos CSV
 * VIO-776: Base de dados para validar
 */

import { prisma } from "@/lib/prisma";

export interface DelphiImportResult {
  entity: "customer" | "invoice" | "invoiceItem" | "stockMovement";
  action: "created" | "updated" | "skipped" | "error";
  sourceId: string;
  name?: string;
  reason?: string;
}

export interface DelphiImportSummary {
  entity: string;
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  results: DelphiImportResult[];
}

/**
 * Limpa e formata CNPJ/CPF
 */
function cleanDocument(doc: string | undefined | null): string {
  return (doc || "").replace(/\D/g, "");
}

function formatCnpj(cnpj: string): string {
  const cleaned = cleanDocument(cnpj);
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

function formatCpf(cpf: string): string {
  const cleaned = cleanDocument(cpf);
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

/**
 * Parse de data no formato brasileiro ou ISO
 */
function parseDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null;
  
  // Tenta formato ISO primeiro
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) return isoDate;
  
  // Tenta formato brasileiro DD/MM/YYYY
  const brMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    return new Date(parseInt(brMatch[3]), parseInt(brMatch[2]) - 1, parseInt(brMatch[1]));
  }
  
  return null;
}

/**
 * Parse de valor numérico (aceita vírgula como decimal)
 */
function parseNumber(value: string | undefined | null): number {
  if (!value) return 0;
  return parseFloat(value.replace(",", ".")) || 0;
}

/**
 * Interface para cliente do Delphi
 */
export interface DelphiCliente {
  codCliente: string;
  cliente: string;
  bairro?: string;
  logradouro?: string;
  complemento?: string;
  numero?: string;
  zipcode?: string;
  codCNPJ?: string;
  cidade?: string;
  stateUf?: string;
  ativo?: string;
  dataInicio?: string;
  codTipoCliente?: string;
}

/**
 * Importa clientes do Delphi
 */
export async function importDelphiCustomers(
  customers: DelphiCliente[],
  companyId: string,
  options: { updateIfExists?: boolean; dryRun?: boolean } = {}
): Promise<DelphiImportSummary> {
  const results: DelphiImportResult[] = [];
  
  for (const customer of customers) {
    try {
      const document = cleanDocument(customer.codCNPJ);
      const isCnpj = document.length === 14;
      const isCpf = document.length === 11;
      
      if (!document || (!isCnpj && !isCpf)) {
        results.push({
          entity: "customer",
          action: "skipped",
          sourceId: customer.codCliente,
          name: customer.cliente,
          reason: "CNPJ/CPF inválido ou não informado",
        });
        continue;
      }
      
      // Verificar se já existe
      const existing = await prisma.customer.findFirst({
        where: {
          OR: [
            isCnpj ? { cnpj: { contains: document } } : {},
            isCpf ? { cpf: { contains: document } } : {},
          ].filter((o) => Object.keys(o).length > 0),
          companyId,
        },
      });
      
      if (existing) {
        if (!options.updateIfExists) {
          results.push({
            entity: "customer",
            action: "skipped",
            sourceId: customer.codCliente,
            name: customer.cliente,
            reason: "Cliente já cadastrado",
          });
          continue;
        }
        
        if (options.dryRun) {
          results.push({
            entity: "customer",
            action: "updated",
            sourceId: customer.codCliente,
            name: customer.cliente,
            reason: "Simulação - seria atualizado",
          });
          continue;
        }
        
        // Atualizar cliente existente
        await prisma.customer.update({
          where: { id: existing.id },
          data: {
            addressStreet: customer.logradouro || existing.addressStreet,
            addressNumber: customer.numero || existing.addressNumber,
            addressComplement: customer.complemento || existing.addressComplement,
            addressNeighborhood: customer.bairro || existing.addressNeighborhood,
            addressCity: customer.cidade || existing.addressCity,
            addressState: customer.stateUf || existing.addressState,
            addressZipCode: customer.zipcode || existing.addressZipCode,
          },
        });
        
        results.push({
          entity: "customer",
          action: "updated",
          sourceId: customer.codCliente,
          name: customer.cliente,
        });
        continue;
      }
      
      if (options.dryRun) {
        results.push({
          entity: "customer",
          action: "created",
          sourceId: customer.codCliente,
          name: customer.cliente,
          reason: "Simulação - seria criado",
        });
        continue;
      }
      
      // Criar novo cliente
      await prisma.customer.create({
        data: {
          code: customer.codCliente,
          companyName: customer.cliente,
          cnpj: isCnpj ? formatCnpj(document) : undefined,
          cpf: isCpf ? formatCpf(document) : undefined,
          addressStreet: customer.logradouro,
          addressNumber: customer.numero,
          addressComplement: customer.complemento,
          addressNeighborhood: customer.bairro,
          addressCity: customer.cidade,
          addressState: customer.stateUf,
          addressZipCode: customer.zipcode,
          status: customer.ativo === "1" || customer.ativo === "true" ? "ACTIVE" : "INACTIVE",
          companyId,
        },
      });
      
      results.push({
        entity: "customer",
        action: "created",
        sourceId: customer.codCliente,
        name: customer.cliente,
      });
    } catch (error) {
      results.push({
        entity: "customer",
        action: "error",
        sourceId: customer.codCliente,
        name: customer.cliente,
        reason: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }
  
  return {
    entity: "customers",
    total: customers.length,
    created: results.filter((r) => r.action === "created").length,
    updated: results.filter((r) => r.action === "updated").length,
    skipped: results.filter((r) => r.action === "skipped").length,
    errors: results.filter((r) => r.action === "error").length,
    results,
  };
}

/**
 * Interface para NFe emitida do Delphi
 */
export interface DelphiNFeEmitida {
  codEmissaoNF: string;
  tipoEmissao?: string;
  numNF: string;
  codEmpresa?: string;
  chaveNFe?: string;
  dtEmissao?: string;
  codCliente?: string;
  CNPJDestino?: string;
  vlrTotalProd?: string;
  vlrNfe?: string;
  numStatusGeral?: string;
}

/**
 * Importa NFe emitidas do Delphi
 */
export async function importDelphiInvoices(
  invoices: DelphiNFeEmitida[],
  companyId: string,
  options: { updateIfExists?: boolean; dryRun?: boolean } = {}
): Promise<DelphiImportSummary> {
  const results: DelphiImportResult[] = [];
  
  for (const invoice of invoices) {
    try {
      if (!invoice.numNF) {
        results.push({
          entity: "invoice",
          action: "skipped",
          sourceId: invoice.codEmissaoNF,
          reason: "Número da NF não informado",
        });
        continue;
      }
      
      // Verificar se já existe pela chave de acesso
      const existing = invoice.chaveNFe
        ? await prisma.issuedInvoice.findFirst({
          where: { accessKey: invoice.chaveNFe, companyId },
        })
        : null;
      
      if (existing) {
        if (!options.updateIfExists) {
          results.push({
            entity: "invoice",
            action: "skipped",
            sourceId: invoice.codEmissaoNF,
            name: `NF ${invoice.numNF}`,
            reason: "NFe já cadastrada",
          });
          continue;
        }
        
        if (options.dryRun) {
          results.push({
            entity: "invoice",
            action: "updated",
            sourceId: invoice.codEmissaoNF,
            name: `NF ${invoice.numNF}`,
            reason: "Simulação - seria atualizada",
          });
          continue;
        }
        
        // Atualizar NFe existente
        await prisma.issuedInvoice.update({
          where: { id: existing.id },
          data: {
            totalValue: parseNumber(invoice.vlrNfe),
          },
        });
        
        results.push({
          entity: "invoice",
          action: "updated",
          sourceId: invoice.codEmissaoNF,
          name: `NF ${invoice.numNF}`,
        });
        continue;
      }
      
      // Buscar cliente pelo código
      let customerId: string | null = null;
      if (invoice.codCliente) {
        const customer = await prisma.customer.findFirst({
          where: { code: invoice.codCliente, companyId },
          select: { id: true },
        });
        customerId = customer?.id || null;
      }
      
      if (options.dryRun) {
        results.push({
          entity: "invoice",
          action: "created",
          sourceId: invoice.codEmissaoNF,
          name: `NF ${invoice.numNF}`,
          reason: "Simulação - seria criada",
        });
        continue;
      }
      
      // Criar nova NFe - precisa de customerId válido
      if (!customerId) {
        results.push({
          entity: "invoice",
          action: "skipped",
          sourceId: invoice.codEmissaoNF,
          name: `NF ${invoice.numNF}`,
          reason: "Cliente não encontrado",
        });
        continue;
      }
      
      // Buscar próximo código
      const lastInvoice = await prisma.issuedInvoice.findFirst({
        where: { companyId },
        orderBy: { code: "desc" },
        select: { code: true },
      });
      const nextCode = (lastInvoice?.code || 0) + 1;
      
      await prisma.issuedInvoice.create({
        data: {
          code: nextCode,
          invoiceNumber: invoice.numNF,
          series: "1",
          accessKey: invoice.chaveNFe,
          issueDate: parseDate(invoice.dtEmissao) || new Date(),
          customerId,
          totalValue: parseNumber(invoice.vlrNfe),
          status: "AUTHORIZED",
          companyId,
        },
      });
      
      results.push({
        entity: "invoice",
        action: "created",
        sourceId: invoice.codEmissaoNF,
        name: `NF ${invoice.numNF}`,
      });
    } catch (error) {
      results.push({
        entity: "invoice",
        action: "error",
        sourceId: invoice.codEmissaoNF,
        name: `NF ${invoice.numNF}`,
        reason: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }
  
  return {
    entity: "invoices",
    total: invoices.length,
    created: results.filter((r) => r.action === "created").length,
    updated: results.filter((r) => r.action === "updated").length,
    skipped: results.filter((r) => r.action === "skipped").length,
    errors: results.filter((r) => r.action === "error").length,
    results,
  };
}

/**
 * Parse de CSV simples (separador ;)
 */
export function parseDelphiCSV<T>(
  csvContent: string
): T[] {
  const lines = csvContent.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(";").map((h) => h.trim());
  const results: T[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(";");
    const obj: Record<string, string> = {};
    
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = (values[j] || "").trim();
    }
    
    results.push(obj as T);
  }
  
  return results;
}
