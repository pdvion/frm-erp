/**
 * Cliente SEFAZ para consulta e manifestação de NFe
 * 
 * Utiliza o Web Service de Distribuição de DFe (NFeDistribuicaoDFe)
 * para consultar NFe destinadas ao CNPJ da empresa.
 */

import { 
  SefazConfig, 
  ConsultaNFeResult, 
  DownloadNFeResult, 
  ManifestacaoResult,
  ManifestacaoTipo,
  SEFAZ_URLS,
  UF_CODES,
} from "./types";

// Códigos de evento de manifestação
const MANIFESTACAO_CODES: Record<ManifestacaoTipo, number> = {
  CIENCIA: 210210,
  CONFIRMACAO: 210200,
  DESCONHECIMENTO: 210220,
  NAO_REALIZADA: 210240,
};

/**
 * Cliente para comunicação com SEFAZ
 */
export class SefazClient {
  private config: SefazConfig;
  private urls: typeof SEFAZ_URLS.producao;

  constructor(config: SefazConfig) {
    this.config = config;
    this.urls = SEFAZ_URLS[config.environment];
  }

  /**
   * Consulta NFe destinadas ao CNPJ
   * Usa o serviço NFeDistribuicaoDFe
   */
  async consultarNFeDestinadas(ultimoNSU?: string): Promise<ConsultaNFeResult> {
    try {
      const cUFAutor = UF_CODES[this.config.uf];
      const nsu = ultimoNSU || "000000000000000";

      // Montar envelope SOAP
      const _soapEnvelope = this.buildDistDFeEnvelope(cUFAutor, this.config.cnpj, nsu);

      // TODO: Assinar XML com certificado digital
      // TODO: Enviar requisição SOAP
      // TODO: Processar resposta

      // Por enquanto, retorna mock para desenvolvimento
      console.log("[SEFAZ] Consulta NFe destinadas - NSU:", nsu);
      
      return {
        success: true,
        message: "Consulta realizada (modo desenvolvimento)",
        nfes: [],
        totalRegistros: 0,
        ultimaNSU: nsu,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido",
        nfes: [],
        totalRegistros: 0,
      };
    }
  }

  /**
   * Consulta NFe por chave de acesso
   */
  async consultarPorChave(chaveAcesso: string): Promise<DownloadNFeResult> {
    try {
      if (chaveAcesso.length !== 44) {
        return {
          success: false,
          message: "Chave de acesso deve ter 44 dígitos",
        };
      }

      const cUFAutor = UF_CODES[this.config.uf];

      // Montar envelope SOAP para consulta por chave
      const _soapEnvelope = this.buildConsChNFeEnvelope(cUFAutor, this.config.cnpj, chaveAcesso);

      // TODO: Assinar XML com certificado digital
      // TODO: Enviar requisição SOAP
      // TODO: Processar resposta e extrair XML da NFe

      console.log("[SEFAZ] Consulta por chave:", chaveAcesso);

      return {
        success: true,
        message: "Consulta realizada (modo desenvolvimento)",
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Registra manifestação do destinatário
   */
  async manifestar(
    chaveAcesso: string, 
    tipo: ManifestacaoTipo,
    justificativa?: string
  ): Promise<ManifestacaoResult> {
    try {
      if (chaveAcesso.length !== 44) {
        return {
          success: false,
          message: "Chave de acesso deve ter 44 dígitos",
        };
      }

      // Justificativa obrigatória para NAO_REALIZADA
      if (tipo === "NAO_REALIZADA" && (!justificativa || justificativa.length < 15)) {
        return {
          success: false,
          message: "Justificativa obrigatória (mínimo 15 caracteres) para Operação não Realizada",
        };
      }

      const codigoEvento = MANIFESTACAO_CODES[tipo];
      const cUFAutor = UF_CODES[this.config.uf];

      // Montar envelope SOAP para evento
      const _soapEnvelope = this.buildEventoEnvelope(
        cUFAutor, 
        this.config.cnpj, 
        chaveAcesso, 
        codigoEvento,
        justificativa
      );

      // TODO: Assinar XML com certificado digital
      // TODO: Enviar requisição SOAP
      // TODO: Processar resposta

      console.log("[SEFAZ] Manifestação:", tipo, "Chave:", chaveAcesso);

      return {
        success: true,
        message: `Manifestação ${tipo} registrada (modo desenvolvimento)`,
        protocolo: "000000000000000",
        dataRecebimento: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Monta envelope SOAP para consulta de distribuição
   */
  private buildDistDFeEnvelope(cUFAutor: number, cnpj: string, nsu: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Header>
    <nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
      <cUF>${cUFAutor}</cUF>
      <versaoDados>1.01</versaoDados>
    </nfeCabecMsg>
  </soap12:Header>
  <soap12:Body>
    <nfeDistDFeInteresse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
      <nfeDadosMsg>
        <distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
          <tpAmb>${this.config.environment === "producao" ? 1 : 2}</tpAmb>
          <cUFAutor>${cUFAutor}</cUFAutor>
          <CNPJ>${cnpj}</CNPJ>
          <distNSU>
            <ultNSU>${nsu}</ultNSU>
          </distNSU>
        </distDFeInt>
      </nfeDadosMsg>
    </nfeDistDFeInteresse>
  </soap12:Body>
</soap12:Envelope>`;
  }

  /**
   * Monta envelope SOAP para consulta por chave
   */
  private buildConsChNFeEnvelope(cUFAutor: number, cnpj: string, chave: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Header>
    <nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
      <cUF>${cUFAutor}</cUF>
      <versaoDados>1.01</versaoDados>
    </nfeCabecMsg>
  </soap12:Header>
  <soap12:Body>
    <nfeDistDFeInteresse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
      <nfeDadosMsg>
        <distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
          <tpAmb>${this.config.environment === "producao" ? 1 : 2}</tpAmb>
          <cUFAutor>${cUFAutor}</cUFAutor>
          <CNPJ>${cnpj}</CNPJ>
          <consChNFe>
            <chNFe>${chave}</chNFe>
          </consChNFe>
        </distDFeInt>
      </nfeDadosMsg>
    </nfeDistDFeInteresse>
  </soap12:Body>
</soap12:Envelope>`;
  }

  /**
   * Monta envelope SOAP para evento de manifestação
   */
  private buildEventoEnvelope(
    cUFAutor: number, 
    cnpj: string, 
    chave: string, 
    codigoEvento: number,
    justificativa?: string
  ): string {
    const sequencia = 1;
    const dataEvento = new Date().toISOString().replace(/\.\d{3}Z$/, "-03:00");
    const idEvento = `ID${codigoEvento}${chave}0${sequencia}`;

    let detEvento = "";
    if (codigoEvento === 210240 && justificativa) {
      detEvento = `<xJust>${justificativa}</xJust>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Header>
    <nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4">
      <cUF>${cUFAutor}</cUF>
      <versaoDados>1.00</versaoDados>
    </nfeCabecMsg>
  </soap12:Header>
  <soap12:Body>
    <nfeRecepcaoEvento xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4">
      <nfeDadosMsg>
        <envEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">
          <idLote>1</idLote>
          <evento versao="1.00">
            <infEvento Id="${idEvento}">
              <cOrgao>91</cOrgao>
              <tpAmb>${this.config.environment === "producao" ? 1 : 2}</tpAmb>
              <CNPJ>${cnpj}</CNPJ>
              <chNFe>${chave}</chNFe>
              <dhEvento>${dataEvento}</dhEvento>
              <tpEvento>${codigoEvento}</tpEvento>
              <nSeqEvento>${sequencia}</nSeqEvento>
              <verEvento>1.00</verEvento>
              <detEvento versao="1.00">
                <descEvento>${this.getDescricaoEvento(codigoEvento)}</descEvento>
                ${detEvento}
              </detEvento>
            </infEvento>
          </evento>
        </envEvento>
      </nfeDadosMsg>
    </nfeRecepcaoEvento>
  </soap12:Body>
</soap12:Envelope>`;
  }

  /**
   * Retorna descrição do evento de manifestação
   */
  private getDescricaoEvento(codigo: number): string {
    switch (codigo) {
      case 210210: return "Ciencia da Operacao";
      case 210200: return "Confirmacao da Operacao";
      case 210220: return "Desconhecimento da Operacao";
      case 210240: return "Operacao nao Realizada";
      default: return "";
    }
  }
}

/**
 * Cria instância do cliente SEFAZ
 */
export function createSefazClient(config: SefazConfig): SefazClient {
  return new SefazClient(config);
}
