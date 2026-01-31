#!/usr/bin/env npx tsx
/**
 * Delphi Legacy Data Validator
 * VIO-835: Validação de dados do sistema Delphi antes da migração
 * 
 * Este script lê arquivos CSV/JSON/XML do Delphi e valida contra os schemas Zod
 * do sistema novo, gerando um relatório de Pass/Fail.
 * 
 * Suporta:
 *   - CSV: Dados tabulares (clientes, materiais, fornecedores, etc.)
 *   - JSON: Dados estruturados
 *   - XML: Notas Fiscais Eletrônicas (NFe) - use validate-nfe-xml.ts para lotes
 * 
 * Uso:
 *   npx tsx scripts/validate-legacy-data.ts <arquivo> [--entity <tipo>] [--output <arquivo>]
 * 
 * Para XMLs de NFe em lote, use:
 *   npx tsx scripts/validate-nfe-xml.ts <pasta> [--type entrada|saida|all]
 * 
 * Exemplos:
 *   npx tsx scripts/validate-legacy-data.ts data/clientes.csv --entity customer
 *   npx tsx scripts/validate-legacy-data.ts data/materiais.json --entity material --output report.json
 *   npx tsx scripts/validate-legacy-data.ts nota.xml --entity nfe-xml
 */

import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

// ============================================================================
// SCHEMAS DE VALIDAÇÃO (baseados nos schemas do sistema novo)
// ============================================================================

const customerSchema = z.object({
  codCliente: z.string().min(1, "Código obrigatório"),
  cliente: z.string().min(1, "Nome obrigatório"),
  codCNPJ: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      const cleaned = val.replace(/\D/g, "");
      return cleaned.length === 11 || cleaned.length === 14;
    },
    { message: "CNPJ/CPF deve ter 11 ou 14 dígitos" }
  ),
  bairro: z.string().optional(),
  logradouro: z.string().optional(),
  complemento: z.string().optional(),
  numero: z.string().optional(),
  zipcode: z.string().optional(),
  cidade: z.string().optional(),
  stateUf: z.string().max(2).optional(),
  ativo: z.string().optional(),
  dataInicio: z.string().optional(),
  codTipoCliente: z.string().optional(),
});

const materialSchema = z.object({
  codMaterial: z.string().min(1, "Código obrigatório"),
  descricao: z.string().min(1, "Descrição obrigatória"),
  unidade: z.string().min(1, "Unidade obrigatória"),
  codGrupo: z.string().optional(),
  codSubGrupo: z.string().optional(),
  ncm: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      const cleaned = val.replace(/\D/g, "");
      return cleaned.length === 8;
    },
    { message: "NCM deve ter 8 dígitos" }
  ),
  pesoLiquido: z.string().optional(),
  pesoBruto: z.string().optional(),
  ativo: z.string().optional(),
  vlrUnitUltCompra: z.string().optional(),
  qdeMinima: z.string().optional(),
});

const supplierSchema = z.object({
  codFornecedor: z.string().min(1, "Código obrigatório"),
  fornecedor: z.string().min(1, "Nome obrigatório"),
  codCNPJ: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      const cleaned = val.replace(/\D/g, "");
      return cleaned.length === 11 || cleaned.length === 14;
    },
    { message: "CNPJ/CPF deve ter 11 ou 14 dígitos" }
  ),
  bairro: z.string().optional(),
  logradouro: z.string().optional(),
  complemento: z.string().optional(),
  numero: z.string().optional(),
  zipcode: z.string().optional(),
  cidade: z.string().optional(),
  stateUf: z.string().max(2).optional(),
  ativo: z.string().optional(),
  email: z.string().optional().refine(
    (val) => {
      if (!val || val === "") return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    },
    { message: "Email inválido" }
  ),
  telefone: z.string().optional(),
});

const nfeEmitidaSchema = z.object({
  codEmissaoNF: z.string().min(1, "Código obrigatório"),
  numNF: z.string().min(1, "Número da NF obrigatório"),
  chaveNFe: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      return val.length === 44;
    },
    { message: "Chave NFe deve ter 44 dígitos" }
  ),
  dtEmissao: z.string().optional(),
  codCliente: z.string().optional(),
  CNPJDestino: z.string().optional(),
  vlrTotalProd: z.string().optional(),
  vlrTotalNF: z.string().optional(),
});

const stockMovementSchema = z.object({
  codMovimento: z.string().min(1, "Código obrigatório"),
  codMaterial: z.string().min(1, "Código do material obrigatório"),
  tipoMovimento: z.string().min(1, "Tipo de movimento obrigatório"),
  quantidade: z.string().min(1, "Quantidade obrigatória"),
  dtMovimento: z.string().optional(),
  codDeposito: z.string().optional(),
  vlrUnitario: z.string().optional(),
});

// Schema para validação de XML de NFe (arquivo único)
const nfeXmlSchema = z.object({
  chaveAcesso: z.string().length(44, "Chave de acesso deve ter 44 dígitos"),
  numero: z.number().int().positive("Número da NF obrigatório"),
  serie: z.number().int().min(0),
  dataEmissao: z.string().min(1, "Data de emissão obrigatória"),
  tipoNF: z.enum(["entrada", "saida"]),
  emitente: z.object({
    cnpj: z.string().length(14, "CNPJ do emitente deve ter 14 dígitos"),
    razaoSocial: z.string().min(1, "Razão social do emitente obrigatória"),
  }),
  destinatario: z.object({
    cnpj: z.string().min(11, "CNPJ/CPF do destinatário obrigatório"),
    razaoSocial: z.string().min(1, "Razão social do destinatário obrigatória"),
  }),
  valorTotal: z.number().positive("Valor total deve ser positivo"),
  itensCount: z.number().int().positive("Deve ter pelo menos 1 item"),
});

const schemas: Record<string, z.ZodSchema> = {
  customer: customerSchema,
  material: materialSchema,
  supplier: supplierSchema,
  nfe: nfeEmitidaSchema,
  stock: stockMovementSchema,
  "nfe-xml": nfeXmlSchema,
};

// ============================================================================
// FUNÇÕES DE PARSING
// ============================================================================

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const firstLine = lines[0];
  const separator = firstLine.includes(";") ? ";" : ",";

  const headers = lines[0].split(separator).map((h) => h.trim().replace(/^"|"$/g, ""));
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map((v) => v.trim().replace(/^"|"$/g, ""));
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || "";
    });
    records.push(record);
  }

  return records;
}

function parseJSON(content: string): Record<string, unknown>[] {
  const data = JSON.parse(content);
  return Array.isArray(data) ? data : [data];
}

// Parser de XML de NFe para validação individual
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

function parseNFeXml(content: string): Record<string, unknown>[] {
  if (!content.includes("<nfeProc") && !content.includes("<NFe")) {
    throw new Error("Não é um XML de NFe válido");
  }

  const infNFe = extractTagContent(content, "infNFe");
  if (!infNFe) throw new Error("Tag infNFe não encontrada");

  const idMatch = content.match(/Id="NFe(\d{44})"/);
  const chaveAcesso = idMatch ? idMatch[1] : "";

  const ide = extractTagContent(infNFe, "ide");
  const numero = ide ? parseInt(extractTag(ide, "nNF") || "0") : 0;
  const serie = ide ? parseInt(extractTag(ide, "serie") || "1") : 1;
  const dhEmi = ide ? extractTag(ide, "dhEmi") || "" : "";
  const tpNF = ide ? extractTag(ide, "tpNF") : "1";
  const tipoNF = tpNF === "0" ? "entrada" : "saida";

  const emit = extractTagContent(infNFe, "emit");
  const emitCnpj = emit ? extractTag(emit, "CNPJ") || "" : "";
  const emitRazao = emit ? extractTag(emit, "xNome") || "" : "";

  const dest = extractTagContent(infNFe, "dest");
  const destCnpj = dest ? (extractTag(dest, "CNPJ") || extractTag(dest, "CPF") || "") : "";
  const destRazao = dest ? extractTag(dest, "xNome") || "" : "";

  const total = extractTagContent(infNFe, "total");
  const icmsTot = total ? extractTagContent(total, "ICMSTot") : null;
  const valorTotal = icmsTot ? parseFloat(extractTag(icmsTot, "vNF") || "0") : 0;

  const itensMatch = infNFe.match(/<det nItem/g);
  const itensCount = itensMatch ? itensMatch.length : 0;

  return [{
    chaveAcesso,
    numero,
    serie,
    dataEmissao: dhEmi,
    tipoNF,
    emitente: { cnpj: emitCnpj, razaoSocial: emitRazao },
    destinatario: { cnpj: destCnpj, razaoSocial: destRazao },
    valorTotal,
    itensCount,
  }];
}

// ============================================================================
// VALIDAÇÃO
// ============================================================================

interface ValidationResult {
  index: number;
  sourceId: string;
  status: "pass" | "fail";
  errors?: string[];
}

interface ValidationReport {
  file: string;
  entity: string;
  timestamp: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    passRate: string;
  };
  results: ValidationResult[];
  commonErrors: { error: string; count: number }[];
}

function validateRecords(
  records: Record<string, unknown>[],
  schema: z.ZodSchema,
  idField: string
): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const sourceId = String(record[idField] || `row-${i + 1}`);

    try {
      const parsed = schema.safeParse(record);

      if (parsed.success) {
        results.push({ index: i, sourceId, status: "pass" });
      } else {
        const errors = parsed.error.issues.map(
          (e) => `${e.path.join(".")}: ${e.message}`
        );
        results.push({ index: i, sourceId, status: "fail", errors });
      }
    } catch (error) {
      results.push({
        index: i,
        sourceId,
        status: "fail",
        errors: [error instanceof Error ? error.message : "Erro desconhecido"],
      });
    }
  }

  return results;
}

function generateReport(
  file: string,
  entity: string,
  results: ValidationResult[]
): ValidationReport {
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;

  const errorCounts: Record<string, number> = {};
  results
    .filter((r) => r.status === "fail")
    .forEach((r) => {
      r.errors?.forEach((error) => {
        errorCounts[error] = (errorCounts[error] || 0) + 1;
      });
    });

  const commonErrors = Object.entries(errorCounts)
    .map(([error, count]) => ({ error, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    file,
    entity,
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed,
      failed,
      passRate: `${((passed / results.length) * 100).toFixed(2)}%`,
    },
    results,
    commonErrors,
  };
}

// ============================================================================
// CLI
// ============================================================================

function printUsage() {
  console.log(`
Delphi Legacy Data Validator
VIO-835: Validação de dados antes da migração

Uso:
  npx tsx scripts/validate-legacy-data.ts <arquivo> [opções]

Opções:
  --entity <tipo>    Tipo de entidade: customer, material, supplier, nfe, stock, nfe-xml
  --output <arquivo> Arquivo de saída para o relatório JSON
  --verbose          Mostrar detalhes de cada registro com falha
  --help             Mostrar esta ajuda

Formatos suportados:
  .csv  - Dados tabulares (auto-detecta separador ; ou ,)
  .json - Dados estruturados
  .xml  - Notas Fiscais Eletrônicas (use --entity nfe-xml)

Exemplos:
  npx tsx scripts/validate-legacy-data.ts data/clientes.csv --entity customer
  npx tsx scripts/validate-legacy-data.ts data/materiais.json --entity material --output report.json
  npx tsx scripts/validate-legacy-data.ts nota.xml --entity nfe-xml

Para validação em lote de XMLs de NFe, use:
  npx tsx scripts/validate-nfe-xml.ts <pasta> [--type entrada|saida|all]
`);
}

function getIdField(entity: string): string {
  const idFields: Record<string, string> = {
    customer: "codCliente",
    material: "codMaterial",
    supplier: "codFornecedor",
    nfe: "codEmissaoNF",
    stock: "codMovimento",
    "nfe-xml": "chaveAcesso",
  };
  return idFields[entity] || "id";
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    printUsage();
    process.exit(0);
  }

  const inputFile = args[0];
  const entityIndex = args.indexOf("--entity");
  const outputIndex = args.indexOf("--output");
  const verbose = args.includes("--verbose");

  let entity = entityIndex !== -1 ? args[entityIndex + 1] : "customer";
  const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : null;

  if (!schemas[entity]) {
    console.error(`❌ Entidade inválida: ${entity}`);
    console.error(`   Entidades válidas: ${Object.keys(schemas).join(", ")}`);
    process.exit(1);
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Arquivo não encontrado: ${inputFile}`);
    process.exit(1);
  }

  console.log(`\n📂 Validando: ${inputFile}`);
  console.log(`📋 Entidade: ${entity}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  const content = fs.readFileSync(inputFile, "utf-8");
  const ext = path.extname(inputFile).toLowerCase();

  let records: Record<string, unknown>[];
  if (ext === ".json") {
    records = parseJSON(content);
  } else if (ext === ".csv") {
    records = parseCSV(content);
  } else if (ext === ".xml") {
    if (entity !== "nfe-xml") {
      console.log(`ℹ️  Arquivo XML detectado. Usando entidade nfe-xml automaticamente.`);
    }
    records = parseNFeXml(content);
  } else {
    console.error(`❌ Formato de arquivo não suportado: ${ext}`);
    console.error(`   Formatos suportados: .csv, .json, .xml`);
    process.exit(1);
  }
  
  // Auto-detectar entidade para XML
  if (ext === ".xml" && entity !== "nfe-xml") {
    entity = "nfe-xml";
  }

  console.log(`📊 Total de registros: ${records.length}\n`);

  const schema = schemas[entity];
  const idField = getIdField(entity);
  const results = validateRecords(records, schema, idField);
  const report = generateReport(inputFile, entity, results);

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📈 RESUMO DA VALIDAÇÃO`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   Total:    ${report.summary.total}`);
  console.log(`   ✅ Pass:   ${report.summary.passed}`);
  console.log(`   ❌ Fail:   ${report.summary.failed}`);
  console.log(`   📊 Taxa:   ${report.summary.passRate}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (report.commonErrors.length > 0) {
    console.log(`⚠️  ERROS MAIS COMUNS:`);
    report.commonErrors.forEach((e, i) => {
      console.log(`   ${i + 1}. (${e.count}x) ${e.error}`);
    });
    console.log();
  }

  if (verbose && report.summary.failed > 0) {
    console.log(`📝 DETALHES DOS REGISTROS COM FALHA:\n`);
    results
      .filter((r) => r.status === "fail")
      .slice(0, 20)
      .forEach((r) => {
        console.log(`   [${r.sourceId}] ${r.errors?.join("; ")}`);
      });
    if (report.summary.failed > 20) {
      console.log(`   ... e mais ${report.summary.failed - 20} registros`);
    }
    console.log();
  }

  if (outputFile) {
    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
    console.log(`📄 Relatório salvo em: ${outputFile}\n`);
  }

  // Exit code baseado no resultado
  if (report.summary.failed > 0) {
    console.log(`⚠️  Existem ${report.summary.failed} registros que precisam de correção antes da migração.\n`);
    process.exit(1);
  } else {
    console.log(`✅ Todos os registros passaram na validação! Pronto para migração.\n`);
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Erro fatal:", error);
  process.exit(1);
});
