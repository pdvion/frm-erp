/**
 * NF-e Emitter - Integração com SEFAZ
 * 
 * Este módulo implementa a emissão de NF-e conforme layout 4.00
 * 
 * Referências:
 * - Manual de Orientação do Contribuinte (MOC)
 * - Portal Nacional da NF-e: https://www.nfe.fazenda.gov.br
 */

import { XMLBuilder } from "fast-xml-parser";

// Tipos para NF-e
export interface NFeEmitente {
  cnpj: string;
  ie: string;
  razaoSocial: string;
  nomeFantasia?: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    codigoMunicipio: string;
    municipio: string;
    uf: string;
    cep: string;
    pais: string;
    codigoPais: string;
    telefone?: string;
  };
  crt: "1" | "2" | "3"; // 1=Simples Nacional, 2=SN Excesso, 3=Regime Normal
}

export interface NFeDestinatario {
  cpfCnpj: string;
  ie?: string;
  razaoSocial: string;
  email?: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    codigoMunicipio: string;
    municipio: string;
    uf: string;
    cep: string;
    pais?: string;
    codigoPais?: string;
    telefone?: string;
  };
  indIEDest: "1" | "2" | "9"; // 1=Contribuinte, 2=Isento, 9=Não contribuinte
}

export interface NFeItem {
  numero: number;
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  // Impostos
  icms: {
    origem: "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";
    cst: string;
    baseCalculo?: number;
    aliquota?: number;
    valor?: number;
  };
  ipi?: {
    cst: string;
    baseCalculo?: number;
    aliquota?: number;
    valor?: number;
  };
  pis: {
    cst: string;
    baseCalculo?: number;
    aliquota?: number;
    valor?: number;
  };
  cofins: {
    cst: string;
    baseCalculo?: number;
    aliquota?: number;
    valor?: number;
  };
}

export interface NFeData {
  // Identificação
  naturezaOperacao: string;
  modelo: "55" | "65"; // 55=NF-e, 65=NFC-e
  serie: string;
  numero: number;
  dataEmissao: Date;
  dataSaida?: Date;
  tipoOperacao: "0" | "1"; // 0=Entrada, 1=Saída
  destino: "1" | "2" | "3"; // 1=Interna, 2=Interestadual, 3=Exterior
  tipoImpressao: "0" | "1" | "2" | "3" | "4" | "5";
  finalidade: "1" | "2" | "3" | "4"; // 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução
  consumidorFinal: "0" | "1";
  presencaComprador: "0" | "1" | "2" | "3" | "4" | "5" | "9";
  
  // Participantes
  emitente: NFeEmitente;
  destinatario: NFeDestinatario;
  
  // Itens
  itens: NFeItem[];
  
  // Totais
  totais: {
    baseCalculoIcms: number;
    valorIcms: number;
    baseCalculoIcmsSt?: number;
    valorIcmsSt?: number;
    valorProdutos: number;
    valorFrete?: number;
    valorSeguro?: number;
    valorDesconto?: number;
    valorIpi?: number;
    valorPis?: number;
    valorCofins?: number;
    valorOutros?: number;
    valorNota: number;
  };
  
  // Transporte
  transporte?: {
    modalidade: "0" | "1" | "2" | "3" | "4" | "9";
    transportadora?: {
      cnpj?: string;
      razaoSocial?: string;
      ie?: string;
      endereco?: string;
      municipio?: string;
      uf?: string;
    };
    volumes?: Array<{
      quantidade: number;
      especie?: string;
      marca?: string;
      numeracao?: string;
      pesoLiquido?: number;
      pesoBruto?: number;
    }>;
  };
  
  // Pagamento
  pagamento: {
    indicador: "0" | "1"; // 0=À vista, 1=A prazo
    formas: Array<{
      tipo: string; // 01=Dinheiro, 02=Cheque, 03=Cartão Crédito, etc.
      valor: number;
    }>;
  };
  
  // Informações adicionais
  informacoesAdicionais?: {
    contribuinte?: string;
    fisco?: string;
  };
}

export interface NFeResponse {
  success: boolean;
  chaveAcesso?: string;
  protocolo?: string;
  dataAutorizacao?: Date;
  xml?: string;
  erro?: {
    codigo: string;
    mensagem: string;
  };
}

// Configuração do ambiente
export interface SefazConfig {
  ambiente: "1" | "2"; // 1=Produção, 2=Homologação
  uf: string;
  certificado: {
    pfx: Buffer;
    senha: string;
  };
  timeout?: number;
}

// URLs dos Web Services por UF (homologação)
const WS_URLS_HOMOLOGACAO: Record<string, Record<string, string>> = {
  SP: {
    autorizacao: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx",
    retAutorizacao: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nferetautorizacao4.asmx",
    consulta: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx",
    status: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx",
    evento: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nferecepcaoevento4.asmx",
    inutilizacao: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeinutilizacao4.asmx",
  },
  // Adicionar outras UFs conforme necessário
};

// URLs dos Web Services por UF (produção)
const WS_URLS_PRODUCAO: Record<string, Record<string, string>> = {
  SP: {
    autorizacao: "https://nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx",
    retAutorizacao: "https://nfe.fazenda.sp.gov.br/ws/nferetautorizacao4.asmx",
    consulta: "https://nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx",
    status: "https://nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx",
    evento: "https://nfe.fazenda.sp.gov.br/ws/nferecepcaoevento4.asmx",
    inutilizacao: "https://nfe.fazenda.sp.gov.br/ws/nfeinutilizacao4.asmx",
  },
  // Adicionar outras UFs conforme necessário
};

/**
 * Gera o código numérico aleatório da NF-e (8 dígitos)
 */
function gerarCodigoNumerico(): string {
  return String(Math.floor(Math.random() * 100000000)).padStart(8, "0");
}

/**
 * Calcula o dígito verificador da chave de acesso
 */
function calcularDigitoVerificador(chave: string): string {
  const pesos = [2, 3, 4, 5, 6, 7, 8, 9];
  let soma = 0;
  let pesoIndex = 0;
  
  for (let i = chave.length - 1; i >= 0; i--) {
    soma += parseInt(chave[i]) * pesos[pesoIndex];
    pesoIndex = (pesoIndex + 1) % 8;
  }
  
  const resto = soma % 11;
  const dv = resto < 2 ? 0 : 11 - resto;
  
  return String(dv);
}

/**
 * Gera a chave de acesso da NF-e
 */
export function gerarChaveAcesso(
  uf: string,
  dataEmissao: Date,
  cnpj: string,
  modelo: string,
  serie: string,
  numero: number,
  tipoEmissao: string = "1",
  codigoNumerico?: string
): string {
  const cUF = getCodigoUF(uf);
  const aamm = `${String(dataEmissao.getFullYear()).slice(2)}${String(dataEmissao.getMonth() + 1).padStart(2, "0")}`;
  const cnpjLimpo = cnpj.replace(/\D/g, "").padStart(14, "0");
  const mod = modelo.padStart(2, "0");
  const ser = serie.padStart(3, "0");
  const nNF = String(numero).padStart(9, "0");
  const tpEmis = tipoEmissao;
  const cNF = codigoNumerico || gerarCodigoNumerico();
  
  const chaveSemDV = `${cUF}${aamm}${cnpjLimpo}${mod}${ser}${nNF}${tpEmis}${cNF}`;
  const dv = calcularDigitoVerificador(chaveSemDV);
  
  return `${chaveSemDV}${dv}`;
}

/**
 * Retorna o código IBGE da UF
 */
function getCodigoUF(uf: string): string {
  const codigos: Record<string, string> = {
    AC: "12", AL: "27", AP: "16", AM: "13", BA: "29",
    CE: "23", DF: "53", ES: "32", GO: "52", MA: "21",
    MT: "51", MS: "50", MG: "31", PA: "15", PB: "25",
    PR: "41", PE: "26", PI: "22", RJ: "33", RN: "24",
    RS: "43", RO: "11", RR: "14", SC: "42", SP: "35",
    SE: "28", TO: "17",
  };
  return codigos[uf] || "35";
}

/**
 * Formata valor numérico para o padrão da NF-e
 */
function formatarValor(valor: number, casasDecimais: number = 2): string {
  return valor.toFixed(casasDecimais);
}

/**
 * Gera o XML da NF-e
 */
export function gerarXmlNFe(data: NFeData, chaveAcesso: string): string {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format: true,
  });

  const nfe = {
    NFe: {
      "@_xmlns": "http://www.portalfiscal.inf.br/nfe",
      infNFe: {
        "@_versao": "4.00",
        "@_Id": `NFe${chaveAcesso}`,
        ide: {
          cUF: getCodigoUF(data.emitente.endereco.uf),
          cNF: chaveAcesso.slice(35, 43),
          natOp: data.naturezaOperacao,
          mod: data.modelo,
          serie: data.serie,
          nNF: data.numero,
          dhEmi: data.dataEmissao.toISOString(),
          dhSaiEnt: data.dataSaida?.toISOString() || data.dataEmissao.toISOString(),
          tpNF: data.tipoOperacao,
          idDest: data.destino,
          cMunFG: data.emitente.endereco.codigoMunicipio,
          tpImp: data.tipoImpressao,
          tpEmis: "1",
          cDV: chaveAcesso.slice(-1),
          tpAmb: "2", // Homologação por padrão
          finNFe: data.finalidade,
          indFinal: data.consumidorFinal,
          indPres: data.presencaComprador,
          procEmi: "0",
          verProc: "FRM-ERP-1.0",
        },
        emit: {
          CNPJ: data.emitente.cnpj.replace(/\D/g, ""),
          xNome: data.emitente.razaoSocial,
          xFant: data.emitente.nomeFantasia || data.emitente.razaoSocial,
          enderEmit: {
            xLgr: data.emitente.endereco.logradouro,
            nro: data.emitente.endereco.numero,
            xCpl: data.emitente.endereco.complemento,
            xBairro: data.emitente.endereco.bairro,
            cMun: data.emitente.endereco.codigoMunicipio,
            xMun: data.emitente.endereco.municipio,
            UF: data.emitente.endereco.uf,
            CEP: data.emitente.endereco.cep.replace(/\D/g, ""),
            cPais: data.emitente.endereco.codigoPais || "1058",
            xPais: data.emitente.endereco.pais || "Brasil",
            fone: data.emitente.endereco.telefone?.replace(/\D/g, ""),
          },
          IE: data.emitente.ie.replace(/\D/g, ""),
          CRT: data.emitente.crt,
        },
        dest: {
          [data.destinatario.cpfCnpj.length > 11 ? "CNPJ" : "CPF"]: data.destinatario.cpfCnpj.replace(/\D/g, ""),
          xNome: data.destinatario.razaoSocial,
          enderDest: {
            xLgr: data.destinatario.endereco.logradouro,
            nro: data.destinatario.endereco.numero,
            xCpl: data.destinatario.endereco.complemento,
            xBairro: data.destinatario.endereco.bairro,
            cMun: data.destinatario.endereco.codigoMunicipio,
            xMun: data.destinatario.endereco.municipio,
            UF: data.destinatario.endereco.uf,
            CEP: data.destinatario.endereco.cep.replace(/\D/g, ""),
            cPais: data.destinatario.endereco.codigoPais || "1058",
            xPais: data.destinatario.endereco.pais || "Brasil",
            fone: data.destinatario.endereco.telefone?.replace(/\D/g, ""),
          },
          indIEDest: data.destinatario.indIEDest,
          IE: data.destinatario.ie?.replace(/\D/g, ""),
          email: data.destinatario.email,
        },
        det: data.itens.map((item) => ({
          "@_nItem": item.numero,
          prod: {
            cProd: item.codigo,
            cEAN: "SEM GTIN",
            xProd: item.descricao,
            NCM: item.ncm.replace(/\D/g, ""),
            CFOP: item.cfop,
            uCom: item.unidade,
            qCom: formatarValor(item.quantidade, 4),
            vUnCom: formatarValor(item.valorUnitario, 10),
            vProd: formatarValor(item.valorTotal),
            cEANTrib: "SEM GTIN",
            uTrib: item.unidade,
            qTrib: formatarValor(item.quantidade, 4),
            vUnTrib: formatarValor(item.valorUnitario, 10),
            indTot: "1",
          },
          imposto: {
            ICMS: {
              [`ICMS${item.icms.cst}`]: {
                orig: item.icms.origem,
                CST: item.icms.cst,
                ...(item.icms.baseCalculo && { vBC: formatarValor(item.icms.baseCalculo) }),
                ...(item.icms.aliquota && { pICMS: formatarValor(item.icms.aliquota) }),
                ...(item.icms.valor && { vICMS: formatarValor(item.icms.valor) }),
              },
            },
            PIS: {
              [`PIS${item.pis.cst === "01" || item.pis.cst === "02" ? "Aliq" : "NT"}`]: {
                CST: item.pis.cst,
                ...(item.pis.baseCalculo && { vBC: formatarValor(item.pis.baseCalculo) }),
                ...(item.pis.aliquota && { pPIS: formatarValor(item.pis.aliquota) }),
                ...(item.pis.valor && { vPIS: formatarValor(item.pis.valor) }),
              },
            },
            COFINS: {
              [`COFINS${item.cofins.cst === "01" || item.cofins.cst === "02" ? "Aliq" : "NT"}`]: {
                CST: item.cofins.cst,
                ...(item.cofins.baseCalculo && { vBC: formatarValor(item.cofins.baseCalculo) }),
                ...(item.cofins.aliquota && { pCOFINS: formatarValor(item.cofins.aliquota) }),
                ...(item.cofins.valor && { vCOFINS: formatarValor(item.cofins.valor) }),
              },
            },
          },
        })),
        total: {
          ICMSTot: {
            vBC: formatarValor(data.totais.baseCalculoIcms),
            vICMS: formatarValor(data.totais.valorIcms),
            vICMSDeson: "0.00",
            vFCPUFDest: "0.00",
            vICMSUFDest: "0.00",
            vICMSUFRemet: "0.00",
            vFCP: "0.00",
            vBCST: formatarValor(data.totais.baseCalculoIcmsSt || 0),
            vST: formatarValor(data.totais.valorIcmsSt || 0),
            vFCPST: "0.00",
            vFCPSTRet: "0.00",
            vProd: formatarValor(data.totais.valorProdutos),
            vFrete: formatarValor(data.totais.valorFrete || 0),
            vSeg: formatarValor(data.totais.valorSeguro || 0),
            vDesc: formatarValor(data.totais.valorDesconto || 0),
            vII: "0.00",
            vIPI: formatarValor(data.totais.valorIpi || 0),
            vIPIDevol: "0.00",
            vPIS: formatarValor(data.totais.valorPis || 0),
            vCOFINS: formatarValor(data.totais.valorCofins || 0),
            vOutro: formatarValor(data.totais.valorOutros || 0),
            vNF: formatarValor(data.totais.valorNota),
          },
        },
        transp: {
          modFrete: data.transporte?.modalidade || "9",
          ...(data.transporte?.transportadora && {
            transporta: {
              CNPJ: data.transporte.transportadora.cnpj?.replace(/\D/g, ""),
              xNome: data.transporte.transportadora.razaoSocial,
              IE: data.transporte.transportadora.ie?.replace(/\D/g, ""),
              xEnder: data.transporte.transportadora.endereco,
              xMun: data.transporte.transportadora.municipio,
              UF: data.transporte.transportadora.uf,
            },
          }),
          ...(data.transporte?.volumes && {
            vol: data.transporte.volumes.map((v) => ({
              qVol: v.quantidade,
              esp: v.especie,
              marca: v.marca,
              nVol: v.numeracao,
              pesoL: v.pesoLiquido ? formatarValor(v.pesoLiquido, 3) : undefined,
              pesoB: v.pesoBruto ? formatarValor(v.pesoBruto, 3) : undefined,
            })),
          }),
        },
        pag: {
          detPag: data.pagamento.formas.map((f) => ({
            indPag: data.pagamento.indicador,
            tPag: f.tipo,
            vPag: formatarValor(f.valor),
          })),
        },
        infAdic: data.informacoesAdicionais ? {
          infCpl: data.informacoesAdicionais.contribuinte,
          infAdFisco: data.informacoesAdicionais.fisco,
        } : undefined,
      },
    },
  };

  return builder.build(nfe);
}

/**
 * Classe principal para emissão de NF-e
 */
export class NFeEmitter {
  private config: SefazConfig;
  private wsUrls: Record<string, string>;

  constructor(config: SefazConfig) {
    this.config = config;
    this.wsUrls = config.ambiente === "1"
      ? WS_URLS_PRODUCAO[config.uf] || WS_URLS_PRODUCAO.SP
      : WS_URLS_HOMOLOGACAO[config.uf] || WS_URLS_HOMOLOGACAO.SP;
  }

  /**
   * Emite uma NF-e
   */
  async emitir(data: NFeData): Promise<NFeResponse> {
    try {
      // Gerar chave de acesso
      const chaveAcesso = gerarChaveAcesso(
        data.emitente.endereco.uf,
        data.dataEmissao,
        data.emitente.cnpj,
        data.modelo,
        data.serie,
        data.numero
      );

      // Gerar XML
      const xml = gerarXmlNFe(data, chaveAcesso);

      // TODO: Assinar XML com certificado digital
      // const xmlAssinado = await this.assinarXml(xml);

      // TODO: Transmitir para SEFAZ
      // const resposta = await this.transmitir(xmlAssinado);

      // Por enquanto, retornar simulação
      return {
        success: true,
        chaveAcesso,
        protocolo: `${Date.now()}`,
        dataAutorizacao: new Date(),
        xml,
      };
    } catch (error) {
      return {
        success: false,
        erro: {
          codigo: "999",
          mensagem: error instanceof Error ? error.message : "Erro desconhecido",
        },
      };
    }
  }

  /**
   * Consulta status do serviço
   */
  async consultarStatus(): Promise<{ online: boolean; mensagem: string }> {
    // TODO: Implementar consulta real
    return {
      online: true,
      mensagem: "Serviço em operação (simulado)",
    };
  }

  /**
   * Consulta NF-e pela chave de acesso
   */
  async consultar(chaveAcesso: string): Promise<NFeResponse> {
    // TODO: Implementar consulta real
    return {
      success: true,
      chaveAcesso,
      protocolo: "SIMULADO",
      dataAutorizacao: new Date(),
    };
  }

  /**
   * Cancela uma NF-e
   */
  async cancelar(chaveAcesso: string, justificativa: string): Promise<NFeResponse> {
    if (justificativa.length < 15) {
      return {
        success: false,
        erro: {
          codigo: "999",
          mensagem: "Justificativa deve ter no mínimo 15 caracteres",
        },
      };
    }

    // TODO: Implementar cancelamento real
    return {
      success: true,
      chaveAcesso,
      protocolo: `CANC${Date.now()}`,
      dataAutorizacao: new Date(),
    };
  }

  /**
   * Emite carta de correção
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async cartaCorrecao(chaveAcesso: string, correcao: string, sequencia: number): Promise<NFeResponse> {
    if (correcao.length < 15) {
      return {
        success: false,
        erro: {
          codigo: "999",
          mensagem: "Correção deve ter no mínimo 15 caracteres",
        },
      };
    }

    // TODO: Implementar CC-e real
    return {
      success: true,
      chaveAcesso,
      protocolo: `CCE${Date.now()}`,
      dataAutorizacao: new Date(),
    };
  }

  /**
   * Inutiliza numeração
   */
  async inutilizar(
    serie: string,
    numeroInicial: number,
    numeroFinal: number,
    justificativa: string
  ): Promise<NFeResponse> {
    if (justificativa.length < 15) {
      return {
        success: false,
        erro: {
          codigo: "999",
          mensagem: "Justificativa deve ter no mínimo 15 caracteres",
        },
      };
    }

    // TODO: Implementar inutilização real
    return {
      success: true,
      protocolo: `INUT${Date.now()}`,
      dataAutorizacao: new Date(),
    };
  }
}

export default NFeEmitter;
