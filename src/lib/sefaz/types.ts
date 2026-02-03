/**
 * Tipos para integração com SEFAZ
 */

// Ambientes SEFAZ
export type SefazEnvironment = "homologacao" | "producao";

// Estados brasileiros
export type UF = 
  | "AC" | "AL" | "AP" | "AM" | "BA" | "CE" | "DF" | "ES" | "GO" 
  | "MA" | "MT" | "MS" | "MG" | "PA" | "PB" | "PR" | "PE" | "PI" 
  | "RJ" | "RN" | "RS" | "RO" | "RR" | "SC" | "SP" | "SE" | "TO";

// Configuração do certificado
export interface CertificateConfig {
  pfxPath?: string;
  pfxBase64?: string;
  password: string;
}

// Configuração SEFAZ
export interface SefazConfig {
  environment: SefazEnvironment;
  uf: UF;
  cnpj: string;
  certificate: CertificateConfig;
}

// Tipos de evento de manifestação
export type ManifestacaoTipo = 
  | "CIENCIA"           // 210210 - Ciência da Operação
  | "CONFIRMACAO"       // 210200 - Confirmação da Operação
  | "DESCONHECIMENTO"   // 210220 - Desconhecimento da Operação
  | "NAO_REALIZADA";    // 210240 - Operação não Realizada

// Situação da NFe na SEFAZ
export type SituacaoNFe = 
  | "AUTORIZADA"
  | "CANCELADA"
  | "DENEGADA";

// Resumo de NFe retornado pela consulta
export interface NFeResumo {
  chaveAcesso: string;
  cnpjEmitente: string;
  nomeEmitente: string;
  cnpjDestinatario: string;
  valorNota: number;
  dataEmissao: Date;
  situacao: SituacaoNFe;
  manifestacao?: ManifestacaoTipo;
  dataManifestacao?: Date;
}

// NFe completa com XML
export interface NFeCompleta extends NFeResumo {
  xml: string;
  numero: number;
  serie: number;
}

// Resultado da consulta de NFe
export interface ConsultaNFeResult {
  success: boolean;
  message?: string;
  nfes: NFeResumo[];
  totalRegistros: number;
  ultimaNSU?: string;
  ultimoNSU?: string;
  maxNSU?: string;
  documentos?: Array<{ nsu: string; schema: string; conteudo: string }>;
  xml?: string;
}

// Resultado do download de NFe
export interface DownloadNFeResult {
  success: boolean;
  message?: string;
  nfe?: NFeCompleta;
}

// Resultado da manifestação
export interface ManifestacaoResult {
  success: boolean;
  message?: string;
  protocolo?: string;
  dataRecebimento?: Date;
}

// Códigos de UF para SEFAZ
export const UF_CODES: Record<UF, number> = {
  AC: 12, AL: 27, AP: 16, AM: 13, BA: 29, CE: 23, DF: 53, ES: 32,
  GO: 52, MA: 21, MT: 51, MS: 50, MG: 31, PA: 15, PB: 25, PR: 41,
  PE: 26, PI: 22, RJ: 33, RN: 24, RS: 43, RO: 11, RR: 14, SC: 42,
  SP: 35, SE: 28, TO: 17,
};

// URLs dos Web Services SEFAZ (Ambiente Nacional - AN)
export const SEFAZ_URLS = {
  homologacao: {
    consultaNFeDest: "https://hom.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx",
    recepcaoEvento: "https://hom.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx",
    consultaChave: "https://hom.nfe.fazenda.gov.br/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx",
  },
  producao: {
    consultaNFeDest: "https://www.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx",
    recepcaoEvento: "https://www.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx",
    consultaChave: "https://www.nfe.fazenda.gov.br/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx",
  },
};
