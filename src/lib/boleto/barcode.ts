/**
 * Gerador de Código de Barras e Linha Digitável para Boletos
 * Padrão FEBRABAN
 */

import { BankCode } from "../cnab/types";

export interface BoletoBarcode {
  codigoBarras: string;
  linhaDigitavel: string;
}

export interface BoletoParams {
  bankCode: BankCode;
  moeda?: string; // 9 = Real
  fatorVencimento: number;
  valor: number;
  campoLivre: string; // 25 dígitos - específico de cada banco
}

/**
 * Calcula o dígito verificador do código de barras (módulo 11)
 */
function calcularDVCodigoBarras(codigo: string): string {
  const pesos = [2, 3, 4, 5, 6, 7, 8, 9];
  let soma = 0;
  let pesoIndex = 0;

  // Percorre da direita para esquerda
  for (let i = codigo.length - 1; i >= 0; i--) {
    soma += parseInt(codigo[i], 10) * pesos[pesoIndex % 8];
    pesoIndex++;
  }

  const resto = soma % 11;
  const dv = 11 - resto;

  if (dv === 0 || dv === 10 || dv === 11) {
    return "1";
  }

  return String(dv);
}

/**
 * Calcula o dígito verificador de um campo (módulo 10)
 */
function calcularDVCampo(campo: string): string {
  const pesos = [2, 1];
  let soma = 0;
  let pesoIndex = 0;

  // Percorre da direita para esquerda
  for (let i = campo.length - 1; i >= 0; i--) {
    let produto = parseInt(campo[i], 10) * pesos[pesoIndex % 2];
    
    // Se o produto for maior que 9, soma os dígitos
    if (produto > 9) {
      produto = Math.floor(produto / 10) + (produto % 10);
    }
    
    soma += produto;
    pesoIndex++;
  }

  const resto = soma % 10;
  const dv = resto === 0 ? 0 : 10 - resto;

  return String(dv);
}

/**
 * Calcula o fator de vencimento (dias desde 07/10/1997)
 */
export function calcularFatorVencimento(dataVencimento: Date): number {
  const dataBase = new Date(1997, 9, 7); // 07/10/1997
  const diffTime = dataVencimento.getTime() - dataBase.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Fator de vencimento tem 4 dígitos (1000-9999)
  // Após 9999, reinicia em 1000
  if (diffDays > 9999) {
    return 1000 + ((diffDays - 1000) % 9000);
  }
  
  return diffDays;
}

/**
 * Formata o valor para o código de barras (10 dígitos, sem vírgula)
 */
function formatarValor(valor: number): string {
  const centavos = Math.round(valor * 100);
  return String(centavos).padStart(10, "0");
}

/**
 * Gera o código de barras do boleto
 * Estrutura: BBBM.DFFFF.VVVVVVVVVV.CCCCCCCCCCCCCCCCCCCCCCCCC
 * B = Código do banco (3)
 * M = Moeda (1)
 * D = Dígito verificador (1)
 * F = Fator de vencimento (4)
 * V = Valor (10)
 * C = Campo livre (25)
 */
export function gerarCodigoBarras(params: BoletoParams): string {
  const { bankCode, moeda = "9", fatorVencimento, valor, campoLivre } = params;

  // Monta o código sem o DV
  const codigoSemDV = 
    bankCode +
    moeda +
    String(fatorVencimento).padStart(4, "0") +
    formatarValor(valor) +
    campoLivre.padEnd(25, "0").substring(0, 25);

  // Calcula o DV
  const dv = calcularDVCodigoBarras(
    codigoSemDV.substring(0, 4) + codigoSemDV.substring(4)
  );

  // Monta o código completo (44 dígitos)
  const codigoBarras = 
    codigoSemDV.substring(0, 4) + // BBBM
    dv +
    codigoSemDV.substring(4); // FFFF + VVVVVVVVVV + CCCCC...

  return codigoBarras;
}

/**
 * Gera a linha digitável a partir do código de barras
 * Estrutura: BBBMC.CCCCD CCCCC.CCCCCD CCCCC.CCCCCD D FFFFVVVVVVVVVV
 */
export function gerarLinhaDigitavel(codigoBarras: string): string {
  if (codigoBarras.length !== 44) {
    throw new Error("Código de barras deve ter 44 dígitos");
  }

  // Campo 1: BBBMC.CCCCD (posições 1-4 e 20-24 do código de barras)
  const campo1 = codigoBarras.substring(0, 4) + codigoBarras.substring(19, 24);
  const dv1 = calcularDVCampo(campo1);

  // Campo 2: CCCCC.CCCCCD (posições 25-34 do código de barras)
  const campo2 = codigoBarras.substring(24, 34);
  const dv2 = calcularDVCampo(campo2);

  // Campo 3: CCCCC.CCCCCD (posições 35-44 do código de barras)
  const campo3 = codigoBarras.substring(34, 44);
  const dv3 = calcularDVCampo(campo3);

  // Campo 4: D (dígito verificador geral - posição 5 do código de barras)
  const campo4 = codigoBarras.substring(4, 5);

  // Campo 5: FFFFVVVVVVVVVV (fator vencimento + valor - posições 6-19)
  const campo5 = codigoBarras.substring(5, 19);

  // Formata a linha digitável
  const linhaDigitavel = 
    campo1.substring(0, 5) + "." + campo1.substring(5) + dv1 + " " +
    campo2.substring(0, 5) + "." + campo2.substring(5) + dv2 + " " +
    campo3.substring(0, 5) + "." + campo3.substring(5) + dv3 + " " +
    campo4 + " " +
    campo5;

  return linhaDigitavel;
}

/**
 * Gera código de barras e linha digitável completos
 */
export function gerarBoleto(params: BoletoParams): BoletoBarcode {
  const codigoBarras = gerarCodigoBarras(params);
  const linhaDigitavel = gerarLinhaDigitavel(codigoBarras);

  return {
    codigoBarras,
    linhaDigitavel,
  };
}

/**
 * Gera o campo livre para Banco do Brasil (001)
 * Estrutura: CCCCCC.NNNNNNNNNNN.AAAA.TTTTTTT
 * C = Convênio (6)
 * N = Nosso número (11)
 * A = Agência (4)
 * T = Conta (7)
 */
export function gerarCampoLivreBB(params: {
  convenio: string;
  nossoNumero: string;
  agencia: string;
  conta: string;
  carteira: string;
}): string {
  const { convenio, nossoNumero, agencia, conta, carteira } = params;

  // Convênio de 6 dígitos
  if (convenio.length === 6) {
    return (
      convenio.padStart(6, "0") +
      nossoNumero.padStart(5, "0") +
      agencia.padStart(4, "0") +
      conta.padStart(8, "0") +
      carteira.padStart(2, "0")
    );
  }

  // Convênio de 7 dígitos
  if (convenio.length === 7) {
    return (
      "000000" +
      convenio.padStart(7, "0") +
      nossoNumero.padStart(10, "0") +
      carteira.padStart(2, "0")
    );
  }

  throw new Error("Convênio deve ter 6 ou 7 dígitos para Banco do Brasil");
}

/**
 * Gera o campo livre para Bradesco (237)
 * Estrutura: AAAA.CC.NNNNNNNNNNN.C.0
 * A = Agência (4)
 * C = Carteira (2)
 * N = Nosso número (11)
 * C = Conta (7)
 */
export function gerarCampoLivreBradesco(params: {
  agencia: string;
  carteira: string;
  nossoNumero: string;
  conta: string;
}): string {
  const { agencia, carteira, nossoNumero, conta } = params;

  return (
    agencia.padStart(4, "0") +
    carteira.padStart(2, "0") +
    nossoNumero.padStart(11, "0") +
    conta.padStart(7, "0") +
    "0"
  );
}

/**
 * Gera o campo livre para Itaú (341)
 * Estrutura: CCC.NNNNNNNNN.D.AAAA.CCCCCCC.D.000
 * C = Carteira (3)
 * N = Nosso número (8)
 * D = DAC nosso número (1)
 * A = Agência (4)
 * C = Conta (5)
 * D = DAC agência/conta (1)
 */
export function gerarCampoLivreItau(params: {
  carteira: string;
  nossoNumero: string;
  agencia: string;
  conta: string;
}): string {
  const { carteira, nossoNumero, agencia, conta } = params;

  const nossoNumeroFormatado = nossoNumero.padStart(8, "0");
  const dacNossoNumero = calcularDVCampo(carteira + nossoNumeroFormatado);

  const agenciaFormatada = agencia.padStart(4, "0");
  const contaFormatada = conta.padStart(5, "0");
  const dacAgenciaConta = calcularDVCampo(agenciaFormatada + contaFormatada);

  return (
    carteira.padStart(3, "0") +
    nossoNumeroFormatado +
    dacNossoNumero +
    agenciaFormatada +
    contaFormatada +
    dacAgenciaConta +
    "000"
  );
}

/**
 * Gera o campo livre para Santander (033)
 * Estrutura: 9.CCCCCCC.NNNNNNNNNNNNN.0.C
 * C = Código do cedente (7)
 * N = Nosso número (13)
 * C = IOS (1)
 */
export function gerarCampoLivreSantander(params: {
  codigoCedente: string;
  nossoNumero: string;
  ios?: string;
}): string {
  const { codigoCedente, nossoNumero, ios = "0" } = params;

  return (
    "9" +
    codigoCedente.padStart(7, "0") +
    nossoNumero.padStart(13, "0") +
    "0" +
    ios.padStart(3, "0") +
    "0"
  );
}

/**
 * Gera o campo livre para Caixa (104)
 * Estrutura: CCCCCC.EEEE.SSSS.TTTTTTTTTTTTTTTT
 * C = Código do cedente (6)
 * E = Emissão (4)
 * S = Sequencial (4)
 * T = Nosso número (15)
 */
export function gerarCampoLivreCaixa(params: {
  codigoCedente: string;
  nossoNumero: string;
}): string {
  const { codigoCedente, nossoNumero } = params;

  // Caixa tem estrutura específica por carteira
  // Simplificado para carteira sem registro
  return (
    codigoCedente.padStart(6, "0") +
    nossoNumero.padStart(17, "0") +
    "00"
  );
}

/**
 * Gera o campo livre para Sicoob (756)
 * Estrutura: CC.CCCCC.NNNNNNNNNNN.AAA.CCCCC
 * C = Carteira (2)
 * C = Código do cedente (5)
 * N = Nosso número (11)
 * A = Agência (3)
 * C = Conta (5)
 */
export function gerarCampoLivreSicoob(params: {
  carteira: string;
  codigoCedente: string;
  nossoNumero: string;
  agencia: string;
  conta: string;
}): string {
  const { carteira, codigoCedente, nossoNumero, agencia, conta } = params;

  return (
    carteira.padStart(2, "0") +
    codigoCedente.padStart(5, "0") +
    nossoNumero.padStart(11, "0") +
    agencia.padStart(3, "0") +
    conta.padStart(5, "0") +
    "1" // Modalidade
  );
}

/**
 * Valida um código de barras
 */
export function validarCodigoBarras(codigoBarras: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (codigoBarras.length !== 44) {
    errors.push(`Código de barras deve ter 44 dígitos (tem ${codigoBarras.length})`);
    return { valid: false, errors };
  }

  if (!/^\d+$/.test(codigoBarras)) {
    errors.push("Código de barras deve conter apenas números");
    return { valid: false, errors };
  }

  // Valida o dígito verificador
  const codigoSemDV = codigoBarras.substring(0, 4) + codigoBarras.substring(5);
  const dvCalculado = calcularDVCodigoBarras(codigoSemDV);
  const dvInformado = codigoBarras.substring(4, 5);

  if (dvCalculado !== dvInformado) {
    errors.push(`Dígito verificador inválido (esperado ${dvCalculado}, informado ${dvInformado})`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Extrai informações de um código de barras
 */
export function extrairInfoCodigoBarras(codigoBarras: string): {
  banco: string;
  moeda: string;
  dv: string;
  fatorVencimento: number;
  valor: number;
  campoLivre: string;
  dataVencimento: Date;
} {
  const banco = codigoBarras.substring(0, 3);
  const moeda = codigoBarras.substring(3, 4);
  const dv = codigoBarras.substring(4, 5);
  const fatorVencimento = parseInt(codigoBarras.substring(5, 9), 10);
  const valorCentavos = parseInt(codigoBarras.substring(9, 19), 10);
  const valor = valorCentavos / 100;
  const campoLivre = codigoBarras.substring(19, 44);

  // Calcula a data de vencimento
  const dataBase = new Date(1997, 9, 7); // 07/10/1997
  const dataVencimento = new Date(dataBase.getTime() + fatorVencimento * 24 * 60 * 60 * 1000);

  return {
    banco,
    moeda,
    dv,
    fatorVencimento,
    valor,
    campoLivre,
    dataVencimento,
  };
}
