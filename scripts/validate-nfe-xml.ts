#!/usr/bin/env npx tsx
/**
 * NFe XML Batch Validator and Processor
 * VIO-863: Validação e processamento em lote de XMLs de NFe
 * 
 * Este script lê XMLs de NFe recursivamente, valida estrutura e dados,
 * classifica como Entrada ou Saída, e gera relatório detalhado.
 * 
 * Uso:
 *   npx tsx scripts/validate-nfe-xml.ts <pasta> [opções]
 * 
 * Opções:
 *   --type <entrada|saida|all>  Filtrar por tipo (default: all)
 *   --output <arquivo>          Arquivo de saída para relatório JSON
 *   --verbose                   Mostrar detalhes de cada XML
 *   --dry-run                   Apenas validar, não importar
 *   --cnpj <cnpj>               Filtrar por CNPJ da empresa
 *   --help                      Mostrar ajuda
 * 
 * Exemplos:
 *   npx tsx scripts/validate-nfe-xml.ts "/path/to/xmls" --type entrada
 *   npx tsx scripts/validate-nfe-xml.ts "/path/to/xmls" --output report.json --verbose
 */

import * as fs from "fs";
import * as path from "path";

// ============================================================================
// TIPOS
// ============================================================================

interface NFeValidationResult {
  file: string;
  relativePath: string;
  status: "valid" | "invalid" | "error";
  type: "entrada" | "saida" | "unknown";
  chaveAcesso?: string;
  numero?: string;
  serie?: string;
  dataEmissao?: string;
  emitente?: {
    cnpj: string;
    razaoSocial: string;
    uf: string;
  };
  destinatario?: {
    cnpj: string;
    razaoSocial: string;
    uf: string;
  };
  valorTotal?: number;
  itensCount?: number;
  protocolo?: string;
  situacao?: string;
  errors?: string[];
}

interface BatchReport {
  folder: string;
  timestamp: string;
  options: {
    type: string;
    cnpjFilter?: string;
  };
  summary: {
    total: number;
    valid: number;
    invalid: number;
    errors: number;
    entrada: number;
    saida: number;
    valorTotalEntrada: number;
    valorTotalSaida: number;
  };
  results: NFeValidationResult[];
  commonErrors: { error: string; count: number }[];
  byEmitente: { cnpj: string; razaoSocial: string; count: number; valorTotal: number }[];
  byDestinatario: { cnpj: string; razaoSocial: string; count: number; valorTotal: number }[];
}

// ============================================================================
// PARSER XML SIMPLIFICADO
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

function parseNFeXml(xmlContent: string): NFeValidationResult {
  const result: NFeValidationResult = {
    file: "",
    relativePath: "",
    status: "valid",
    type: "unknown",
    errors: [],
  };

  try {
    // Verificar se é um XML de NFe válido
    if (!xmlContent.includes("<nfeProc") && !xmlContent.includes("<NFe")) {
      result.status = "invalid";
      result.errors?.push("Não é um XML de NFe válido");
      return result;
    }

    // Extrair infNFe
    const infNFe = extractTagContent(xmlContent, "infNFe");
    if (!infNFe) {
      result.status = "invalid";
      result.errors?.push("Tag infNFe não encontrada");
      return result;
    }

    // Extrair chave de acesso do atributo Id
    const idMatch = xmlContent.match(/Id="NFe(\d{44})"/);
    if (idMatch) {
      result.chaveAcesso = idMatch[1];
    }

    // Extrair dados da identificação (ide)
    const ide = extractTagContent(infNFe, "ide");
    if (ide) {
      result.numero = extractTag(ide, "nNF") || undefined;
      result.serie = extractTag(ide, "serie") || undefined;
      result.dataEmissao = extractTag(ide, "dhEmi") || undefined;
      
      // tpNF: 0=Entrada, 1=Saída
      const tpNF = extractTag(ide, "tpNF");
      result.type = tpNF === "0" ? "entrada" : tpNF === "1" ? "saida" : "unknown";
    }

    // Extrair dados do emitente
    const emit = extractTagContent(infNFe, "emit");
    if (emit) {
      const cnpj = extractTag(emit, "CNPJ");
      const razaoSocial = extractTag(emit, "xNome");
      const enderEmit = extractTagContent(emit, "enderEmit");
      const uf = enderEmit ? extractTag(enderEmit, "UF") : null;
      
      if (cnpj && razaoSocial) {
        result.emitente = {
          cnpj,
          razaoSocial,
          uf: uf || "",
        };
      }
    }

    // Extrair dados do destinatário
    const dest = extractTagContent(infNFe, "dest");
    if (dest) {
      const cnpj = extractTag(dest, "CNPJ") || extractTag(dest, "CPF");
      const razaoSocial = extractTag(dest, "xNome");
      const enderDest = extractTagContent(dest, "enderDest");
      const uf = enderDest ? extractTag(enderDest, "UF") : null;
      
      if (cnpj && razaoSocial) {
        result.destinatario = {
          cnpj: cnpj || "",
          razaoSocial,
          uf: uf || "",
        };
      }
    }

    // Extrair totais
    const total = extractTagContent(infNFe, "total");
    if (total) {
      const icmsTot = extractTagContent(total, "ICMSTot");
      if (icmsTot) {
        const vNF = extractTag(icmsTot, "vNF");
        result.valorTotal = vNF ? parseFloat(vNF) : 0;
      }
    }

    // Contar itens
    const itensMatch = infNFe.match(/<det nItem/g);
    result.itensCount = itensMatch ? itensMatch.length : 0;

    // Extrair protocolo de autorização
    const protNFe = extractTagContent(xmlContent, "protNFe");
    if (protNFe) {
      result.protocolo = extractTag(protNFe, "nProt") || undefined;
      const cStat = extractTag(protNFe, "cStat");
      result.situacao = cStat === "100" ? "Autorizada" : cStat || undefined;
    }

    // Validações
    if (!result.chaveAcesso) {
      result.errors?.push("Chave de acesso não encontrada");
    } else if (result.chaveAcesso.length !== 44) {
      result.errors?.push(`Chave de acesso inválida: ${result.chaveAcesso.length} dígitos`);
    }

    if (!result.emitente?.cnpj) {
      result.errors?.push("CNPJ do emitente não encontrado");
    }

    if (!result.numero) {
      result.errors?.push("Número da NF não encontrado");
    }

    if (!result.valorTotal || result.valorTotal <= 0) {
      result.errors?.push("Valor total inválido ou zerado");
    }

    if (result.errors && result.errors.length > 0) {
      result.status = "invalid";
    }

  } catch (error) {
    result.status = "error";
    result.errors?.push(error instanceof Error ? error.message : "Erro desconhecido");
  }

  return result;
}

// ============================================================================
// PROCESSAMENTO EM LOTE
// ============================================================================

function findXmlFiles(folder: string): string[] {
  const files: string[] = [];
  
  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".xml")) {
        files.push(fullPath);
      }
    }
  }
  
  scanDir(folder);
  return files;
}

function processXmlFiles(
  folder: string,
  options: { type: string; cnpjFilter?: string }
): BatchReport {
  const files = findXmlFiles(folder);
  const results: NFeValidationResult[] = [];
  
  console.log(`\n📂 Processando: ${folder}`);
  console.log(`📄 Arquivos XML encontrados: ${files.length}\n`);
  
  let processed = 0;
  const startTime = Date.now();
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const result = parseNFeXml(content);
      result.file = path.basename(file);
      result.relativePath = path.relative(folder, file);
      
      // Filtrar por tipo
      if (options.type !== "all" && result.type !== options.type) {
        continue;
      }
      
      // Filtrar por CNPJ
      if (options.cnpjFilter) {
        const cnpjClean = options.cnpjFilter.replace(/\D/g, "");
        const matchEmit = result.emitente?.cnpj === cnpjClean;
        const matchDest = result.destinatario?.cnpj === cnpjClean;
        if (!matchEmit && !matchDest) {
          continue;
        }
      }
      
      results.push(result);
      processed++;
      
      // Progress indicator
      if (processed % 100 === 0) {
        process.stdout.write(`\r⏳ Processados: ${processed}/${files.length}`);
      }
    } catch (error) {
      results.push({
        file: path.basename(file),
        relativePath: path.relative(folder, file),
        status: "error",
        type: "unknown",
        errors: [error instanceof Error ? error.message : "Erro ao ler arquivo"],
      });
    }
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\r✅ Processados: ${results.length} arquivos em ${elapsed}s\n`);
  
  // Calcular estatísticas
  const valid = results.filter((r) => r.status === "valid").length;
  const invalid = results.filter((r) => r.status === "invalid").length;
  const errors = results.filter((r) => r.status === "error").length;
  const entrada = results.filter((r) => r.type === "entrada").length;
  const saida = results.filter((r) => r.type === "saida").length;
  
  const valorTotalEntrada = results
    .filter((r) => r.type === "entrada" && r.status === "valid")
    .reduce((sum, r) => sum + (r.valorTotal || 0), 0);
  
  const valorTotalSaida = results
    .filter((r) => r.type === "saida" && r.status === "valid")
    .reduce((sum, r) => sum + (r.valorTotal || 0), 0);
  
  // Erros comuns
  const errorCounts: Record<string, number> = {};
  results.forEach((r) => {
    r.errors?.forEach((err) => {
      errorCounts[err] = (errorCounts[err] || 0) + 1;
    });
  });
  const commonErrors = Object.entries(errorCounts)
    .map(([error, count]) => ({ error, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Agrupar por emitente
  const emitenteMap = new Map<string, { razaoSocial: string; count: number; valorTotal: number }>();
  results.filter((r) => r.status === "valid" && r.emitente).forEach((r) => {
    const key = r.emitente!.cnpj;
    const existing = emitenteMap.get(key) || { razaoSocial: r.emitente!.razaoSocial, count: 0, valorTotal: 0 };
    existing.count++;
    existing.valorTotal += r.valorTotal || 0;
    emitenteMap.set(key, existing);
  });
  const byEmitente = Array.from(emitenteMap.entries())
    .map(([cnpj, data]) => ({ cnpj, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
  
  // Agrupar por destinatário
  const destMap = new Map<string, { razaoSocial: string; count: number; valorTotal: number }>();
  results.filter((r) => r.status === "valid" && r.destinatario).forEach((r) => {
    const key = r.destinatario!.cnpj;
    const existing = destMap.get(key) || { razaoSocial: r.destinatario!.razaoSocial, count: 0, valorTotal: 0 };
    existing.count++;
    existing.valorTotal += r.valorTotal || 0;
    destMap.set(key, existing);
  });
  const byDestinatario = Array.from(destMap.entries())
    .map(([cnpj, data]) => ({ cnpj, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
  
  return {
    folder,
    timestamp: new Date().toISOString(),
    options,
    summary: {
      total: results.length,
      valid,
      invalid,
      errors,
      entrada,
      saida,
      valorTotalEntrada,
      valorTotalSaida,
    },
    results,
    commonErrors,
    byEmitente,
    byDestinatario,
  };
}

// ============================================================================
// CLI
// ============================================================================

function printUsage() {
  console.log(`
NFe XML Batch Validator
VIO-863: Validação e processamento em lote de XMLs de NFe

Uso:
  npx tsx scripts/validate-nfe-xml.ts <pasta> [opções]

Opções:
  --type <entrada|saida|all>  Filtrar por tipo (default: all)
  --output <arquivo>          Arquivo de saída para relatório JSON
  --verbose                   Mostrar detalhes de cada XML inválido
  --cnpj <cnpj>               Filtrar por CNPJ da empresa
  --help                      Mostrar ajuda

Exemplos:
  npx tsx scripts/validate-nfe-xml.ts "/path/to/xmls" --type entrada
  npx tsx scripts/validate-nfe-xml.ts "/path/to/xmls" --output report.json --verbose
`);
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatCnpj(cnpj: string): string {
  if (cnpj.length === 14) {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  }
  return cnpj;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes("--help") || args.length === 0) {
    printUsage();
    process.exit(0);
  }
  
  const folder = args[0];
  const typeIndex = args.indexOf("--type");
  const outputIndex = args.indexOf("--output");
  const cnpjIndex = args.indexOf("--cnpj");
  const verbose = args.includes("--verbose");
  
  const type = typeIndex !== -1 ? args[typeIndex + 1] : "all";
  const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : null;
  const cnpjFilter = cnpjIndex !== -1 ? args[cnpjIndex + 1] : undefined;
  
  if (!fs.existsSync(folder)) {
    console.error(`❌ Pasta não encontrada: ${folder}`);
    process.exit(1);
  }
  
  if (!["entrada", "saida", "all"].includes(type)) {
    console.error(`❌ Tipo inválido: ${type}. Use: entrada, saida ou all`);
    process.exit(1);
  }
  
  // Processar XMLs
  const report = processXmlFiles(folder, { type, cnpjFilter });
  
  // Exibir resumo
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📈 RESUMO DA VALIDAÇÃO`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   Total:           ${report.summary.total}`);
  console.log(`   ✅ Válidos:       ${report.summary.valid}`);
  console.log(`   ❌ Inválidos:     ${report.summary.invalid}`);
  console.log(`   ⚠️  Erros:         ${report.summary.errors}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   📥 Entrada:       ${report.summary.entrada} notas`);
  console.log(`      Valor Total:  ${formatCurrency(report.summary.valorTotalEntrada)}`);
  console.log(`   📤 Saída:         ${report.summary.saida} notas`);
  console.log(`      Valor Total:  ${formatCurrency(report.summary.valorTotalSaida)}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  // Top emitentes
  if (report.byEmitente.length > 0) {
    console.log(`📊 TOP EMITENTES:`);
    report.byEmitente.slice(0, 10).forEach((e, i) => {
      console.log(`   ${i + 1}. ${formatCnpj(e.cnpj)} - ${e.razaoSocial.substring(0, 40)}`);
      console.log(`      ${e.count} notas | ${formatCurrency(e.valorTotal)}`);
    });
    console.log();
  }
  
  // Top destinatários
  if (report.byDestinatario.length > 0) {
    console.log(`📊 TOP DESTINATÁRIOS:`);
    report.byDestinatario.slice(0, 10).forEach((d, i) => {
      console.log(`   ${i + 1}. ${formatCnpj(d.cnpj)} - ${d.razaoSocial.substring(0, 40)}`);
      console.log(`      ${d.count} notas | ${formatCurrency(d.valorTotal)}`);
    });
    console.log();
  }
  
  // Erros comuns
  if (report.commonErrors.length > 0) {
    console.log(`⚠️  ERROS MAIS COMUNS:`);
    report.commonErrors.forEach((e, i) => {
      console.log(`   ${i + 1}. (${e.count}x) ${e.error}`);
    });
    console.log();
  }
  
  // Detalhes verbose
  if (verbose && report.summary.invalid > 0) {
    console.log(`📝 DETALHES DOS XMLs INVÁLIDOS:\n`);
    report.results
      .filter((r) => r.status !== "valid")
      .slice(0, 20)
      .forEach((r) => {
        console.log(`   [${r.relativePath}]`);
        console.log(`   └─ ${r.errors?.join("; ")}`);
      });
    if (report.summary.invalid > 20) {
      console.log(`   ... e mais ${report.summary.invalid - 20} arquivos`);
    }
    console.log();
  }
  
  // Salvar relatório
  if (outputFile) {
    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
    console.log(`📄 Relatório salvo em: ${outputFile}\n`);
  }
  
  // Exit code
  if (report.summary.invalid > 0 || report.summary.errors > 0) {
    console.log(`⚠️  Existem ${report.summary.invalid + report.summary.errors} XMLs com problemas.\n`);
    process.exit(1);
  } else {
    console.log(`✅ Todos os XMLs são válidos! Prontos para importação.\n`);
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Erro fatal:", error);
  process.exit(1);
});
