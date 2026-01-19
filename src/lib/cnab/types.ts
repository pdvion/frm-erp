/**
 * Tipos para integração CNAB 240/400
 */

export type BankCode = "001" | "033" | "104" | "237" | "341" | "756";

export const BANK_NAMES: Record<BankCode, string> = {
  "001": "Banco do Brasil",
  "033": "Santander",
  "104": "Caixa Econômica Federal",
  "237": "Bradesco",
  "341": "Itaú",
  "756": "Sicoob",
};

export type CnabLayout = "240" | "400";

export type RemessaTipo = "COBRANCA" | "PAGAMENTO";

export type RetornoTipo = "COBRANCA" | "PAGAMENTO";

export interface CnabConfig {
  bankCode: BankCode;
  layout: CnabLayout;
  agencia: string;
  agenciaDigito?: string;
  conta: string;
  contaDigito: string;
  convenio?: string;
  carteira?: string;
  cedente: string;
  cedenteDocumento: string;
}

export interface BoletoData {
  id: string;
  nossoNumero: string;
  numeroDocumento: string;
  dataEmissao: Date;
  dataVencimento: Date;
  valor: number;
  valorDesconto?: number;
  valorMulta?: number;
  valorJuros?: number;
  sacado: {
    nome: string;
    documento: string;
    endereco: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  instrucoes?: string[];
  linhaDigitavel?: string;
  codigoBarras?: string;
  pixCopiaECola?: string;
}

export interface RemessaRegistro {
  tipo: "HEADER_ARQUIVO" | "HEADER_LOTE" | "DETALHE" | "TRAILER_LOTE" | "TRAILER_ARQUIVO";
  segmento?: "P" | "Q" | "R" | "S" | "T" | "U" | "A" | "B" | "J";
  dados: Record<string, string | number>;
}

export interface RemessaResult {
  success: boolean;
  filename?: string;
  content?: string;
  totalRegistros?: number;
  valorTotal?: number;
  errors?: string[];
}

export interface RetornoRegistro {
  tipo: "HEADER_ARQUIVO" | "HEADER_LOTE" | "DETALHE" | "TRAILER_LOTE" | "TRAILER_ARQUIVO";
  segmento?: string;
  nossoNumero?: string;
  seuNumero?: string;
  dataOcorrencia?: Date;
  dataPagamento?: Date;
  dataVencimento?: Date;
  valorPago?: number;
  valorTitulo?: number;
  valorTarifa?: number;
  codigoOcorrencia?: string;
  descricaoOcorrencia?: string;
  motivoRejeicao?: string[];
  dados?: Record<string, string | number | Date | undefined>;
}

export interface RetornoResult {
  success: boolean;
  banco?: BankCode;
  dataGeracao?: Date;
  registros: RetornoRegistro[];
  totalPagos?: number;
  totalRejeitados?: number;
  valorTotal?: number;
  errors?: string[];
}

export interface PagamentoData {
  id: string;
  tipo: "FORNECEDOR" | "IMPOSTO" | "TRIBUTO" | "OUTROS";
  favorecido: {
    nome: string;
    documento: string;
    banco: string;
    agencia: string;
    conta: string;
    contaDigito: string;
  };
  valor: number;
  dataPagamento: Date;
  codigoBarras?: string;
  descricao?: string;
}

export const OCORRENCIAS_COBRANCA: Record<string, string> = {
  "02": "Entrada Confirmada",
  "03": "Entrada Rejeitada",
  "04": "Transferência de Carteira",
  "05": "Transferência de Carteira",
  "06": "Liquidação",
  "09": "Baixa",
  "10": "Baixa por Pagamento",
  "11": "Títulos em Carteira",
  "12": "Confirmação Recebimento Instrução Abatimento",
  "13": "Confirmação Recebimento Instrução Cancelamento Abatimento",
  "14": "Confirmação Recebimento Instrução Alteração de Vencimento",
  "17": "Liquidação após Baixa",
  "19": "Confirmação Recebimento Instrução de Protesto",
  "20": "Confirmação Recebimento Instrução de Sustação/Cancelamento de Protesto",
  "23": "Remessa a Cartório",
  "24": "Retirada de Cartório",
  "25": "Protestado e Baixado",
  "26": "Instrução Rejeitada",
  "27": "Confirmação do Pedido de Alteração de Outros Dados",
  "28": "Débito de Tarifas/Custas",
  "30": "Alteração de Dados Rejeitada",
};
