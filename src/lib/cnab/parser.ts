/**
 * Parser de arquivos CNAB 240 (Retorno)
 */

import {
  RetornoResult,
  RetornoRegistro,
  BankCode,
  OCORRENCIAS_COBRANCA,
} from "./types";

/**
 * Extrai substring e remove espaços
 */
function extract(line: string, start: number, end: number): string {
  return line.substring(start - 1, end).trim();
}

/**
 * Extrai número
 */
function extractNumber(line: string, start: number, end: number): number {
  return parseInt(extract(line, start, end), 10) || 0;
}

/**
 * Extrai valor monetário (centavos para reais)
 */
function extractMoney(line: string, start: number, end: number): number {
  const cents = extractNumber(line, start, end);
  return cents / 100;
}

/**
 * Extrai data no formato DDMMAAAA
 */
function extractDate(line: string, start: number, end: number): Date | undefined {
  const dateStr = extract(line, start, end);
  if (!dateStr || dateStr === "00000000") return undefined;
  
  const day = parseInt(dateStr.substring(0, 2), 10);
  const month = parseInt(dateStr.substring(2, 4), 10) - 1;
  const year = parseInt(dateStr.substring(4, 8), 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return undefined;
  
  return new Date(year, month, day);
}

/**
 * Parse Header de Arquivo
 */
function parseHeaderArquivo(line: string): RetornoRegistro {
  return {
    tipo: "HEADER_ARQUIVO",
    dados: {
      banco: extract(line, 1, 3),
      lote: extract(line, 4, 7),
      tipoRegistro: extract(line, 8, 8),
      cnpjCpf: extract(line, 19, 32),
      nomeEmpresa: extract(line, 73, 102),
      nomeBanco: extract(line, 103, 132),
      dataGeracao: extract(line, 144, 151),
      horaGeracao: extract(line, 152, 157),
      sequencialArquivo: extract(line, 158, 163),
    },
  };
}

/**
 * Parse Header de Lote
 */
function parseHeaderLote(line: string): RetornoRegistro {
  return {
    tipo: "HEADER_LOTE",
    dados: {
      banco: extract(line, 1, 3),
      lote: extract(line, 4, 7),
      tipoOperacao: extract(line, 9, 9),
      tipoServico: extract(line, 10, 11),
      cnpjCpf: extract(line, 19, 33),
      nomeEmpresa: extract(line, 74, 103),
    },
  };
}

/**
 * Parse Segmento T (Título)
 */
function parseSegmentoT(line: string): RetornoRegistro {
  const codigoOcorrencia = extract(line, 16, 17);
  
  return {
    tipo: "DETALHE",
    segmento: "T",
    nossoNumero: extract(line, 38, 57),
    seuNumero: extract(line, 59, 73),
    dataVencimento: extractDate(line, 74, 81),
    valorTitulo: extractMoney(line, 82, 96),
    codigoOcorrencia,
    descricaoOcorrencia: OCORRENCIAS_COBRANCA[codigoOcorrencia] || `Ocorrência ${codigoOcorrencia}`,
    dados: {
      agenciaCobradora: extract(line, 97, 101),
      digitoAgencia: extract(line, 102, 102),
      usoEmpresa: extract(line, 106, 130),
      codigoMoeda: extract(line, 131, 132),
    },
  };
}

/**
 * Parse Segmento U (Complemento)
 */
function parseSegmentoU(line: string): RetornoRegistro {
  const motivosRejeicao: string[] = [];
  const motivo1 = extract(line, 214, 223);
  if (motivo1 && motivo1 !== "0000000000") {
    motivosRejeicao.push(motivo1);
  }
  
  return {
    tipo: "DETALHE",
    segmento: "U",
    dataOcorrencia: extractDate(line, 138, 145),
    dataPagamento: extractDate(line, 146, 153),
    valorPago: extractMoney(line, 78, 92),
    valorTarifa: extractMoney(line, 198, 212),
    motivoRejeicao: motivosRejeicao.length > 0 ? motivosRejeicao : undefined,
    dados: {
      jurosMultaEncargos: extractMoney(line, 18, 32),
      valorDesconto: extractMoney(line, 33, 47),
      valorAbatimento: extractMoney(line, 48, 62),
      valorIOF: extractMoney(line, 63, 77),
      valorLiquido: extractMoney(line, 93, 107),
      valorOutrasDespesas: extractMoney(line, 108, 122),
      valorOutrosCreditos: extractMoney(line, 123, 137),
    },
  };
}

/**
 * Parse Trailer de Lote
 */
function parseTrailerLote(line: string): RetornoRegistro {
  return {
    tipo: "TRAILER_LOTE",
    dados: {
      banco: extract(line, 1, 3),
      lote: extract(line, 4, 7),
      qtdRegistros: extractNumber(line, 18, 23),
      qtdTitulosSimples: extractNumber(line, 24, 29),
      valorTotalSimples: extractMoney(line, 30, 46),
      qtdTitulosVinculada: extractNumber(line, 47, 52),
      valorTotalVinculada: extractMoney(line, 53, 69),
    },
  };
}

/**
 * Parse Trailer de Arquivo
 */
function parseTrailerArquivo(line: string): RetornoRegistro {
  return {
    tipo: "TRAILER_ARQUIVO",
    dados: {
      banco: extract(line, 1, 3),
      qtdLotes: extractNumber(line, 18, 23),
      qtdRegistros: extractNumber(line, 24, 29),
    },
  };
}

/**
 * Parse arquivo de retorno CNAB 240
 */
export function parseRetornoCnab240(content: string): RetornoResult {
  try {
    const lines = content.split(/\r?\n/).filter(l => l.length > 0);
    
    if (lines.length < 4) {
      return {
        success: false,
        registros: [],
        errors: ["Arquivo inválido: menos de 4 linhas"],
      };
    }
    
    const registros: RetornoRegistro[] = [];
    let banco: BankCode | undefined;
    let dataGeracao: Date | undefined;
    let totalPagos = 0;
    let totalRejeitados = 0;
    let valorTotal = 0;
    
    for (const line of lines) {
      if (line.length !== 240) continue;
      
      const tipoRegistro = line.substring(7, 8);
      const segmento = line.substring(13, 14);
      
      switch (tipoRegistro) {
        case "0": // Header de Arquivo
          const header = parseHeaderArquivo(line);
          banco = header.dados?.banco as BankCode;
          dataGeracao = extractDate(line, 144, 151);
          registros.push(header);
          break;
          
        case "1": // Header de Lote
          registros.push(parseHeaderLote(line));
          break;
          
        case "3": // Detalhe
          if (segmento === "T") {
            const segT = parseSegmentoT(line);
            registros.push(segT);
            
            // Contar ocorrências
            const cod = segT.codigoOcorrencia;
            if (cod === "06" || cod === "10" || cod === "17") {
              totalPagos++;
            } else if (cod === "03" || cod === "26") {
              totalRejeitados++;
            }
          } else if (segmento === "U") {
            const segU = parseSegmentoU(line);
            registros.push(segU);
            if (segU.valorPago) {
              valorTotal += segU.valorPago;
            }
          }
          break;
          
        case "5": // Trailer de Lote
          registros.push(parseTrailerLote(line));
          break;
          
        case "9": // Trailer de Arquivo
          registros.push(parseTrailerArquivo(line));
          break;
      }
    }
    
    return {
      success: true,
      banco,
      dataGeracao,
      registros,
      totalPagos,
      totalRejeitados,
      valorTotal,
    };
  } catch (error) {
    return {
      success: false,
      registros: [],
      errors: [error instanceof Error ? error.message : "Erro ao processar arquivo"],
    };
  }
}

/**
 * Extrai títulos pagos do retorno
 */
export function extractTitulosPagos(retorno: RetornoResult): Array<{
  nossoNumero: string;
  seuNumero?: string;
  valorPago: number;
  dataPagamento?: Date;
  valorTarifa?: number;
}> {
  const titulos: Array<{
    nossoNumero: string;
    seuNumero?: string;
    valorPago: number;
    dataPagamento?: Date;
    valorTarifa?: number;
  }> = [];
  
  let currentTitulo: {
    nossoNumero?: string;
    seuNumero?: string;
    codigoOcorrencia?: string;
  } | null = null;
  
  for (const registro of retorno.registros) {
    if (registro.tipo === "DETALHE" && registro.segmento === "T") {
      currentTitulo = {
        nossoNumero: registro.nossoNumero,
        seuNumero: registro.seuNumero,
        codigoOcorrencia: registro.codigoOcorrencia,
      };
    } else if (registro.tipo === "DETALHE" && registro.segmento === "U" && currentTitulo) {
      // Verificar se foi pago (ocorrências 06, 10, 17)
      const cod = currentTitulo.codigoOcorrencia;
      if (cod === "06" || cod === "10" || cod === "17") {
        titulos.push({
          nossoNumero: currentTitulo.nossoNumero || "",
          seuNumero: currentTitulo.seuNumero,
          valorPago: registro.valorPago || 0,
          dataPagamento: registro.dataOcorrencia,
          valorTarifa: registro.valorTarifa,
        });
      }
      currentTitulo = null;
    }
  }
  
  return titulos;
}
