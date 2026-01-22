/**
 * NF-e Emitter - Integração com SEFAZ
 * 
 * Este módulo implementa a emissão de NF-e conforme layout 4.00
 * 
 * Referências:
 * - Manual de Orientação do Contribuinte (MOC)
 * - Portal Nacional da NF-e: https://www.nfe.fazenda.gov.br
 * 
 * @module sefaz/nfe-emitter
 * @see VIO-566 - Emissão de NF-e
 */

import { XMLBuilder } from "fast-xml-parser";

// Constantes para cálculo do dígito verificador (Módulo 11)
const PESOS_MODULO_11 = [2, 3, 4, 5, 6, 7, 8, 9];
const DIVISOR_MODULO_11 = 11;
const LIMITE_RESTO_DV = 2;

/**
 * Dados do emitente da NF-e
 * @see Manual de Orientação do Contribuinte - Grupo C
 */
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

/**
 * Dados do destinatário da NF-e
 * @see Manual de Orientação do Contribuinte - Grupo E
 */
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

/**
 * Item da NF-e com dados do produto e impostos
 * @see Manual de Orientação do Contribuinte - Grupo I
 */
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

/**
 * Dados completos para emissão de uma NF-e
 * @see Manual de Orientação do Contribuinte - Layout 4.00
 */
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

/**
 * Resposta da emissão/consulta de NF-e
 */
export interface NFeResponse {
  sucesso: boolean;
  chaveAcesso?: string;
  protocolo?: string;
  dataAutorizacao?: Date;
  xml?: string;
  erro?: {
    codigo: string;
    mensagem: string;
  };
}

/**
 * Configuração para conexão com SEFAZ
 */
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
 * @returns Código numérico com 8 dígitos
 */
function gerarCodigoNumerico(): string {
  const MAX_CODIGO = 100000000;
  return String(Math.floor(Math.random() * MAX_CODIGO)).padStart(8, "0");
}

/**
 * Calcula o dígito verificador da chave de acesso usando Módulo 11
 * 
 * Algoritmo:
 * 1. Multiplica cada dígito da chave (da direita para esquerda) pelos pesos 2,3,4,5,6,7,8,9 (cíclico)
 * 2. Soma todos os resultados
 * 3. Calcula o resto da divisão por 11
 * 4. Se resto < 2, DV = 0; senão DV = 11 - resto
 * 
 * @param chave - Chave de acesso sem o dígito verificador (43 dígitos)
 * @returns Dígito verificador (1 dígito)
 */
function calcularDigitoVerificador(chave: string): string {
  let soma = 0;
  let pesoIndex = 0;
  
  // Percorre da direita para esquerda aplicando os pesos
  for (let i = chave.length - 1; i >= 0; i--) {
    soma += parseInt(chave[i]) * PESOS_MODULO_11[pesoIndex];
    pesoIndex = (pesoIndex + 1) % PESOS_MODULO_11.length;
  }
  
  const resto = soma % DIVISOR_MODULO_11;
  const dv = resto < LIMITE_RESTO_DV ? 0 : DIVISOR_MODULO_11 - resto;
  
  return String(dv);
}

/**
 * Valida os parâmetros de entrada para geração da chave de acesso
 * @throws Error se algum parâmetro for inválido
 */
function validarParametrosChaveAcesso(
  uf: string,
  cnpj: string,
  modelo: string,
  serie: string,
  numero: number
): void {
  // Validar UF
  const codigoUF = getCodigoUF(uf);
  if (codigoUF === "00") {
    throw new Error(`UF inválida: ${uf}. Use sigla de 2 letras (ex: SP, RJ, MG)`);
  }
  
  // Validar CNPJ
  const cnpjLimpo = cnpj.replace(/\D/g, "");
  if (cnpjLimpo.length !== 14) {
    throw new Error(`CNPJ inválido: deve ter 14 dígitos. Recebido: ${cnpjLimpo.length} dígitos`);
  }
  
  // Validar modelo
  if (modelo !== "55" && modelo !== "65") {
    throw new Error(`Modelo inválido: ${modelo}. Use 55 (NF-e) ou 65 (NFC-e)`);
  }
  
  // Validar série
  const serieNum = parseInt(serie);
  if (isNaN(serieNum) || serieNum < 0 || serieNum > 999) {
    throw new Error(`Série inválida: ${serie}. Use valor entre 0 e 999`);
  }
  
  // Validar número
  if (numero < 1 || numero > 999999999) {
    throw new Error(`Número inválido: ${numero}. Use valor entre 1 e 999999999`);
  }
}

/**
 * Gera a chave de acesso da NF-e (44 dígitos)
 * 
 * Formato: cUF + AAMM + CNPJ + mod + serie + nNF + tpEmis + cNF + cDV
 * 
 * @param uf - Sigla da UF do emitente (2 letras)
 * @param dataEmissao - Data de emissão da NF-e
 * @param cnpj - CNPJ do emitente (14 dígitos)
 * @param modelo - Modelo do documento (55=NF-e, 65=NFC-e)
 * @param serie - Série do documento (1-999)
 * @param numero - Número do documento (1-999999999)
 * @param tipoEmissao - Tipo de emissão (1=Normal, etc)
 * @param codigoNumerico - Código numérico opcional (8 dígitos)
 * @returns Chave de acesso com 44 dígitos
 * @throws Error se algum parâmetro for inválido
 * 
 * @example
 * const chave = gerarChaveAcesso('SP', new Date(), '12345678000199', '55', '1', 123);
 * // Retorna: '35260112345678000199550010000001231xxxxxxxx9'
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
  // Validar parâmetros de entrada (CR-002)
  validarParametrosChaveAcesso(uf, cnpj, modelo, serie, numero);
  
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
 * Códigos IBGE das UFs brasileiras
 */
const CODIGOS_UF: Record<string, string> = {
  AC: "12", AL: "27", AP: "16", AM: "13", BA: "29",
  CE: "23", DF: "53", ES: "32", GO: "52", MA: "21",
  MT: "51", MS: "50", MG: "31", PA: "15", PB: "25",
  PR: "41", PE: "26", PI: "22", RJ: "33", RN: "24",
  RS: "43", RO: "11", RR: "14", SC: "42", SP: "35",
  SE: "28", TO: "17",
};

/**
 * Retorna o código IBGE da UF
 * @param uf - Sigla da UF (2 letras maiúsculas)
 * @returns Código IBGE da UF ou "00" se não encontrado
 */
function getCodigoUF(uf: string): string {
  return CODIGOS_UF[uf.toUpperCase()] || "00";
}

/**
 * Formata valor numérico para o padrão da NF-e
 * @param valor - Valor numérico a formatar
 * @param casasDecimais - Número de casas decimais (padrão: 2)
 * @returns Valor formatado como string
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
 * @see VIO-566 - Emissão de NF-e
 */
export class NFeEmitter {
  private readonly config: SefazConfig;
  private readonly wsUrls: Record<string, string>;

  constructor(config: SefazConfig) {
    this.config = config;
    this.wsUrls = config.ambiente === "1"
      ? WS_URLS_PRODUCAO[config.uf] || WS_URLS_PRODUCAO.SP
      : WS_URLS_HOMOLOGACAO[config.uf] || WS_URLS_HOMOLOGACAO.SP;
  }

  /**
   * Retorna a configuração atual
   */
  getConfig(): SefazConfig {
    return this.config;
  }

  /**
   * Retorna as URLs dos Web Services
   */
  getWsUrls(): Record<string, string> {
    return this.wsUrls;
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

      // TODO(VIO-566): Implementar assinatura e transmissão real para SEFAZ
      // Por enquanto, retornar simulação
      return {
        sucesso: true,
        chaveAcesso,
        protocolo: `${Date.now()}`,
        dataAutorizacao: new Date(),
        xml,
      };
    } catch (error) {
      return {
        sucesso: false,
        erro: {
          codigo: "999",
          mensagem: error instanceof Error ? error.message : "Erro desconhecido",
        },
      };
    }
  }

  /**
   * Consulta status do serviço SEFAZ
   */
  async consultarStatus(): Promise<{ online: boolean; mensagem: string }> {
    // TODO(VIO-566): Implementar consulta real usando this.wsUrls.status
    console.log(`Consultando status em: ${this.wsUrls.status}`);
    return {
      online: true,
      mensagem: `Serviço em operação (simulado) - Ambiente: ${this.config.ambiente === "1" ? "Produção" : "Homologação"}`,
    };
  }

  /**
   * Consulta NF-e pela chave de acesso
   */
  async consultar(chaveAcesso: string): Promise<NFeResponse> {
    // TODO(VIO-566): Implementar consulta real usando this.wsUrls.consulta
    console.log(`Consultando NF-e em: ${this.wsUrls.consulta}`);
    return {
      sucesso: true,
      chaveAcesso,
      protocolo: "SIMULADO",
      dataAutorizacao: new Date(),
    };
  }

  /**
   * Cancela uma NF-e autorizada
   * @param chaveAcesso - Chave de acesso da NF-e (44 dígitos)
   * @param justificativa - Motivo do cancelamento (mín. 15 caracteres)
   */
  async cancelar(chaveAcesso: string, justificativa: string): Promise<NFeResponse> {
    if (justificativa.length < 15) {
      return {
        sucesso: false,
        erro: {
          codigo: "999",
          mensagem: "Justificativa deve ter no mínimo 15 caracteres",
        },
      };
    }

    // TODO(VIO-566): Implementar cancelamento real usando this.wsUrls.evento
    console.log(`Cancelando NF-e em: ${this.wsUrls.evento}`);
    return {
      sucesso: true,
      chaveAcesso,
      protocolo: `CANC${Date.now()}`,
      dataAutorizacao: new Date(),
    };
  }

  /**
   * Emite carta de correção (CC-e)
   * @param chaveAcesso - Chave de acesso da NF-e (44 dígitos)
   * @param correcao - Texto da correção (mín. 15 caracteres)
   * @param sequencia - Número sequencial da correção (1-20)
   */
  async cartaCorrecao(chaveAcesso: string, correcao: string, sequencia: number): Promise<NFeResponse> {
    if (correcao.length < 15) {
      return {
        sucesso: false,
        erro: {
          codigo: "999",
          mensagem: "Correção deve ter no mínimo 15 caracteres",
        },
      };
    }

    if (sequencia < 1 || sequencia > 20) {
      return {
        sucesso: false,
        erro: {
          codigo: "999",
          mensagem: "Sequência deve estar entre 1 e 20",
        },
      };
    }

    // TODO(VIO-566): Implementar CC-e real usando this.wsUrls.evento
    console.log(`Emitindo CC-e sequência ${sequencia} em: ${this.wsUrls.evento}`);
    return {
      sucesso: true,
      chaveAcesso,
      protocolo: `CCE${Date.now()}`,
      dataAutorizacao: new Date(),
    };
  }

  /**
   * Inutiliza numeração de NF-e
   * @param serie - Série do documento (1-999)
   * @param numeroInicial - Número inicial a inutilizar
   * @param numeroFinal - Número final a inutilizar
   * @param justificativa - Motivo da inutilização (mín. 15 caracteres)
   */
  async inutilizar(
    serie: string,
    numeroInicial: number,
    numeroFinal: number,
    justificativa: string
  ): Promise<NFeResponse> {
    if (justificativa.length < 15) {
      return {
        sucesso: false,
        erro: {
          codigo: "999",
          mensagem: "Justificativa deve ter no mínimo 15 caracteres",
        },
      };
    }

    if (numeroInicial > numeroFinal) {
      return {
        sucesso: false,
        erro: {
          codigo: "999",
          mensagem: "Número inicial deve ser menor ou igual ao número final",
        },
      };
    }

    // TODO(VIO-566): Implementar inutilização real usando this.wsUrls.inutilizacao
    console.log(`Inutilizando série ${serie}, números ${numeroInicial}-${numeroFinal} em: ${this.wsUrls.inutilizacao}`);
    return {
      sucesso: true,
      protocolo: `INUT${Date.now()}`,
      dataAutorizacao: new Date(),
    };
  }
}

export default NFeEmitter;
