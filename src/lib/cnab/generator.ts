/**
 * Gerador de arquivos CNAB 240
 */

import {
  CnabConfig,
  BoletoData,
  PagamentoData,
  RemessaResult,
  BankCode,
} from "./types";

/**
 * Formata string com padding à direita
 */
function padRight(value: string, length: number, char = " "): string {
  return value.substring(0, length).padEnd(length, char);
}

/**
 * Formata número com padding à esquerda
 */
function padLeft(value: number | string, length: number, char = "0"): string {
  return String(value).substring(0, length).padStart(length, char);
}

/**
 * Formata data no formato DDMMAAAA
 */
function formatDate(date: Date): string {
  const day = padLeft(date.getDate(), 2);
  const month = padLeft(date.getMonth() + 1, 2);
  const year = padLeft(date.getFullYear(), 4);
  return `${day}${month}${year}`;
}

/**
 * Formata valor monetário (centavos)
 */
function formatMoney(value: number, length = 15): string {
  const cents = Math.round(value * 100);
  return padLeft(cents, length);
}

/**
 * Remove acentos e caracteres especiais
 */
function removeAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .toUpperCase();
}

/**
 * Gera Header de Arquivo CNAB 240
 */
function generateHeaderArquivo(config: CnabConfig, sequencial: number): string {
  const now = new Date();
  
  let linha = "";
  linha += padLeft(config.bankCode, 3);           // 001-003: Código do Banco
  linha += "0000";                                 // 004-007: Lote de Serviço
  linha += "0";                                    // 008: Tipo de Registro (0=Header)
  linha += padRight("", 9);                        // 009-017: Uso Exclusivo FEBRABAN
  linha += config.cedenteDocumento.length === 11 ? "1" : "2"; // 018: Tipo de Inscrição
  linha += padLeft(config.cedenteDocumento.replace(/\D/g, ""), 14); // 019-032: CNPJ/CPF
  linha += padRight(config.convenio || "", 20);   // 033-052: Código do Convênio
  linha += padLeft(config.agencia, 5);            // 053-057: Agência
  linha += padRight(config.agenciaDigito || "", 1); // 058: Dígito Agência
  linha += padLeft(config.conta, 12);             // 059-070: Conta
  linha += padRight(config.contaDigito, 1);       // 071: Dígito Conta
  linha += " ";                                    // 072: Dígito Verificador Ag/Conta
  linha += padRight(removeAccents(config.cedente), 30); // 073-102: Nome da Empresa
  linha += padRight(BANK_NAMES[config.bankCode as BankCode] || "", 30); // 103-132: Nome do Banco
  linha += padRight("", 10);                       // 133-142: Uso Exclusivo FEBRABAN
  linha += "1";                                    // 143: Código Remessa (1=Remessa)
  linha += formatDate(now);                        // 144-151: Data de Geração
  linha += padLeft(now.getHours(), 2) + padLeft(now.getMinutes(), 2) + padLeft(now.getSeconds(), 2); // 152-157: Hora
  linha += padLeft(sequencial, 6);                 // 158-163: Número Sequencial
  linha += "087";                                  // 164-166: Versão do Layout
  linha += padLeft(0, 5);                          // 167-171: Densidade de Gravação
  linha += padRight("", 20);                       // 172-191: Reservado Banco
  linha += padRight("", 20);                       // 192-211: Reservado Empresa
  linha += padRight("", 29);                       // 212-240: Uso Exclusivo FEBRABAN
  
  return linha;
}

const BANK_NAMES: Record<string, string> = {
  "001": "BANCO DO BRASIL S.A.",
  "033": "BANCO SANTANDER S.A.",
  "104": "CAIXA ECONOMICA FEDERAL",
  "237": "BANCO BRADESCO S.A.",
  "341": "BANCO ITAU S.A.",
  "756": "BANCO SICOOB S.A.",
};

/**
 * Gera Header de Lote CNAB 240 (Cobrança)
 */
function generateHeaderLote(config: CnabConfig, lote: number): string {
  let linha = "";
  linha += padLeft(config.bankCode, 3);           // 001-003: Código do Banco
  linha += padLeft(lote, 4);                       // 004-007: Lote de Serviço
  linha += "1";                                    // 008: Tipo de Registro (1=Header Lote)
  linha += "R";                                    // 009: Tipo de Operação (R=Remessa)
  linha += "01";                                   // 010-011: Tipo de Serviço (01=Cobrança)
  linha += "00";                                   // 012-013: Forma de Lançamento
  linha += "045";                                  // 014-016: Versão do Layout do Lote
  linha += " ";                                    // 017: Uso Exclusivo FEBRABAN
  linha += config.cedenteDocumento.length === 11 ? "1" : "2"; // 018: Tipo de Inscrição
  linha += padLeft(config.cedenteDocumento.replace(/\D/g, ""), 15); // 019-033: CNPJ/CPF
  linha += padRight(config.convenio || "", 20);   // 034-053: Código do Convênio
  linha += padLeft(config.agencia, 5);            // 054-058: Agência
  linha += padRight(config.agenciaDigito || "", 1); // 059: Dígito Agência
  linha += padLeft(config.conta, 12);             // 060-071: Conta
  linha += padRight(config.contaDigito, 1);       // 072: Dígito Conta
  linha += " ";                                    // 073: Dígito Verificador Ag/Conta
  linha += padRight(removeAccents(config.cedente), 30); // 074-103: Nome da Empresa
  linha += padRight("", 40);                       // 104-143: Mensagem 1
  linha += padRight("", 40);                       // 144-183: Mensagem 2
  linha += padLeft(0, 8);                          // 184-191: Número Remessa/Retorno
  linha += formatDate(new Date());                 // 192-199: Data de Gravação
  linha += padLeft(0, 8);                          // 200-207: Data do Crédito
  linha += padRight("", 33);                       // 208-240: Uso Exclusivo FEBRABAN
  
  return linha;
}

/**
 * Gera Segmento P (Dados do Título)
 */
function generateSegmentoP(config: CnabConfig, boleto: BoletoData, lote: number, sequencial: number): string {
  let linha = "";
  linha += padLeft(config.bankCode, 3);           // 001-003: Código do Banco
  linha += padLeft(lote, 4);                       // 004-007: Lote de Serviço
  linha += "3";                                    // 008: Tipo de Registro (3=Detalhe)
  linha += padLeft(sequencial, 5);                 // 009-013: Nº Sequencial do Registro
  linha += "P";                                    // 014: Código de Segmento
  linha += " ";                                    // 015: Uso Exclusivo FEBRABAN
  linha += "01";                                   // 016-017: Código de Movimento (01=Entrada)
  linha += padLeft(config.agencia, 5);            // 018-022: Agência
  linha += padRight(config.agenciaDigito || "", 1); // 023: Dígito Agência
  linha += padLeft(config.conta, 12);             // 024-035: Conta
  linha += padRight(config.contaDigito, 1);       // 036: Dígito Conta
  linha += " ";                                    // 037: Dígito Verificador Ag/Conta
  linha += padRight(boleto.nossoNumero, 20);      // 038-057: Nosso Número
  linha += padLeft(config.carteira || "1", 1);    // 058: Carteira
  linha += "1";                                    // 059: Forma de Cadastro (1=Com Registro)
  linha += "1";                                    // 060: Tipo de Documento
  linha += "2";                                    // 061: Identificação Emissão Boleto (2=Cliente)
  linha += "2";                                    // 062: Identificação Distribuição
  linha += padRight(boleto.numeroDocumento, 15);  // 063-077: Número do Documento
  linha += formatDate(boleto.dataVencimento);     // 078-085: Data de Vencimento
  linha += formatMoney(boleto.valor);             // 086-100: Valor do Título
  linha += padLeft(0, 5);                          // 101-105: Agência Cobradora
  linha += " ";                                    // 106: Dígito Agência Cobradora
  linha += "02";                                   // 107-108: Espécie do Título (02=DM)
  linha += "A";                                    // 109: Aceite
  linha += formatDate(boleto.dataEmissao);        // 110-117: Data de Emissão
  linha += "0";                                    // 118: Código Juros Mora (0=Isento)
  linha += padLeft(0, 8);                          // 119-126: Data Juros Mora
  linha += formatMoney(boleto.valorJuros || 0);   // 127-141: Juros Mora
  linha += "0";                                    // 142: Código Desconto (0=Sem Desconto)
  linha += padLeft(0, 8);                          // 143-150: Data Desconto
  linha += formatMoney(boleto.valorDesconto || 0); // 151-165: Valor Desconto
  linha += formatMoney(0);                         // 166-180: Valor IOF
  linha += formatMoney(0);                         // 181-195: Valor Abatimento
  linha += padRight(boleto.numeroDocumento, 25);  // 196-220: Identificação do Título
  linha += "3";                                    // 221: Código para Protesto (3=Não Protestar)
  linha += padLeft(0, 2);                          // 222-223: Prazo para Protesto
  linha += "1";                                    // 224: Código para Baixa (1=Baixar)
  linha += padLeft(60, 3);                         // 225-227: Prazo para Baixa
  linha += "09";                                   // 228-229: Código da Moeda (09=Real)
  linha += padLeft(0, 10);                         // 230-239: Número do Contrato
  linha += " ";                                    // 240: Uso Exclusivo FEBRABAN
  
  return linha;
}

/**
 * Gera Segmento Q (Dados do Sacado)
 */
function generateSegmentoQ(config: CnabConfig, boleto: BoletoData, lote: number, sequencial: number): string {
  let linha = "";
  linha += padLeft(config.bankCode, 3);           // 001-003: Código do Banco
  linha += padLeft(lote, 4);                       // 004-007: Lote de Serviço
  linha += "3";                                    // 008: Tipo de Registro (3=Detalhe)
  linha += padLeft(sequencial, 5);                 // 009-013: Nº Sequencial do Registro
  linha += "Q";                                    // 014: Código de Segmento
  linha += " ";                                    // 015: Uso Exclusivo FEBRABAN
  linha += "01";                                   // 016-017: Código de Movimento
  
  const docSacado = boleto.sacado.documento.replace(/\D/g, "");
  linha += docSacado.length === 11 ? "1" : "2";   // 018: Tipo de Inscrição Sacado
  linha += padLeft(docSacado, 15);                 // 019-033: CNPJ/CPF Sacado
  linha += padRight(removeAccents(boleto.sacado.nome), 40); // 034-073: Nome Sacado
  linha += padRight(removeAccents(boleto.sacado.endereco), 40); // 074-113: Endereço
  linha += padRight("", 15);                       // 114-128: Bairro
  linha += padLeft(boleto.sacado.cep.replace(/\D/g, ""), 8); // 129-136: CEP
  linha += padRight(removeAccents(boleto.sacado.cidade), 15); // 137-151: Cidade
  linha += padRight(boleto.sacado.uf, 2);         // 152-153: UF
  linha += "0";                                    // 154: Tipo de Inscrição Sacador
  linha += padLeft(0, 15);                         // 155-169: CNPJ/CPF Sacador
  linha += padRight("", 40);                       // 170-209: Nome Sacador
  linha += padLeft(0, 3);                          // 210-212: Código Banco Correspondente
  linha += padRight("", 20);                       // 213-232: Nosso Número Correspondente
  linha += padRight("", 8);                        // 233-240: Uso Exclusivo FEBRABAN
  
  return linha;
}

/**
 * Gera Trailer de Lote CNAB 240
 */
function generateTrailerLote(config: CnabConfig, lote: number, qtdRegistros: number, valorTotal: number): string {
  let linha = "";
  linha += padLeft(config.bankCode, 3);           // 001-003: Código do Banco
  linha += padLeft(lote, 4);                       // 004-007: Lote de Serviço
  linha += "5";                                    // 008: Tipo de Registro (5=Trailer Lote)
  linha += padRight("", 9);                        // 009-017: Uso Exclusivo FEBRABAN
  linha += padLeft(qtdRegistros, 6);               // 018-023: Quantidade de Registros
  linha += padLeft(0, 6);                          // 024-029: Quantidade de Títulos Cobrança Simples
  linha += formatMoney(valorTotal, 17);            // 030-046: Valor Total Títulos
  linha += padLeft(0, 6);                          // 047-052: Quantidade de Títulos Cobrança Vinculada
  linha += formatMoney(0, 17);                     // 053-069: Valor Total Vinculada
  linha += padLeft(0, 6);                          // 070-075: Quantidade de Títulos Cobrança Caucionada
  linha += formatMoney(0, 17);                     // 076-092: Valor Total Caucionada
  linha += padLeft(0, 6);                          // 093-098: Quantidade de Títulos Cobrança Descontada
  linha += formatMoney(0, 17);                     // 099-115: Valor Total Descontada
  linha += padRight("", 8);                        // 116-123: Número do Aviso de Lançamento
  linha += padRight("", 117);                      // 124-240: Uso Exclusivo FEBRABAN
  
  return linha;
}

/**
 * Gera Trailer de Arquivo CNAB 240
 */
function generateTrailerArquivo(config: CnabConfig, qtdLotes: number, qtdRegistros: number): string {
  let linha = "";
  linha += padLeft(config.bankCode, 3);           // 001-003: Código do Banco
  linha += "9999";                                 // 004-007: Lote de Serviço
  linha += "9";                                    // 008: Tipo de Registro (9=Trailer Arquivo)
  linha += padRight("", 9);                        // 009-017: Uso Exclusivo FEBRABAN
  linha += padLeft(qtdLotes, 6);                   // 018-023: Quantidade de Lotes
  linha += padLeft(qtdRegistros, 6);               // 024-029: Quantidade de Registros
  linha += padLeft(0, 6);                          // 030-035: Quantidade de Contas para Conciliação
  linha += padRight("", 205);                      // 036-240: Uso Exclusivo FEBRABAN
  
  return linha;
}

/**
 * Gera arquivo de remessa CNAB 240 para cobrança
 */
export function generateRemessaCobranca(
  config: CnabConfig,
  boletos: BoletoData[],
  sequencialArquivo: number
): RemessaResult {
  try {
    const linhas: string[] = [];
    let valorTotal = 0;
    
    // Header de Arquivo
    linhas.push(generateHeaderArquivo(config, sequencialArquivo));
    
    // Header de Lote
    linhas.push(generateHeaderLote(config, 1));
    
    // Detalhes (Segmentos P e Q para cada boleto)
    let sequencialDetalhe = 1;
    for (const boleto of boletos) {
      linhas.push(generateSegmentoP(config, boleto, 1, sequencialDetalhe++));
      linhas.push(generateSegmentoQ(config, boleto, 1, sequencialDetalhe++));
      valorTotal += boleto.valor;
    }
    
    // Trailer de Lote
    const qtdRegistrosLote = 2 + (boletos.length * 2); // Header + Detalhes + Trailer
    linhas.push(generateTrailerLote(config, 1, qtdRegistrosLote, valorTotal));
    
    // Trailer de Arquivo
    const qtdRegistrosTotal = linhas.length + 1; // +1 para o próprio trailer
    linhas.push(generateTrailerArquivo(config, 1, qtdRegistrosTotal));
    
    const content = linhas.join("\r\n");
    const now = new Date();
    const filename = `CNAB240_${config.bankCode}_${now.getFullYear()}${padLeft(now.getMonth() + 1, 2)}${padLeft(now.getDate(), 2)}_${padLeft(sequencialArquivo, 6)}.rem`;
    
    return {
      success: true,
      filename,
      content,
      totalRegistros: boletos.length,
      valorTotal,
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Erro desconhecido"],
    };
  }
}

/**
 * Valida arquivo CNAB 240
 */
export function validateCnab240(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const lines = content.split(/\r?\n/).filter(l => l.length > 0);
  
  if (lines.length < 4) {
    errors.push("Arquivo deve ter no mínimo 4 linhas (Header Arquivo, Header Lote, Trailer Lote, Trailer Arquivo)");
    return { valid: false, errors };
  }
  
  // Validar tamanho das linhas
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length !== 240) {
      errors.push(`Linha ${i + 1}: Tamanho inválido (${lines[i].length} caracteres, esperado 240)`);
    }
  }
  
  // Validar Header de Arquivo
  const headerArquivo = lines[0];
  if (headerArquivo.substring(7, 8) !== "0") {
    errors.push("Header de Arquivo: Tipo de registro inválido");
  }
  
  // Validar Trailer de Arquivo
  const trailerArquivo = lines[lines.length - 1];
  if (trailerArquivo.substring(7, 8) !== "9") {
    errors.push("Trailer de Arquivo: Tipo de registro inválido");
  }
  
  return { valid: errors.length === 0, errors };
}
