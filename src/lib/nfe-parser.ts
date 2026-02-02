/**
 * Parser de XML NFe
 * Extrai dados estruturados de arquivos XML de Nota Fiscal Eletrônica
 */

export interface NFeEmitente {
  cnpj: string;
  cpf?: string;
  razaoSocial: string;
  nomeFantasia?: string;
  ie?: string;
  endereco?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
}

export interface NFeDestinatario {
  cnpj?: string;
  cpf?: string;
  razaoSocial: string;
  nomeFantasia?: string;
  ie?: string;
  im?: string;
  email?: string;
  telefone?: string;
  endereco?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    codigoMunicipio?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
    codigoPais?: string;
    pais?: string;
  };
}

export interface NFeItem {
  numero: number;
  codigo: string;
  codigoEan?: string;
  descricao: string;
  ncm?: string;
  cest?: string;
  cfop: number;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  valorDesconto?: number;
  valorFrete?: number;
  valorSeguro?: number;
  valorOutros?: number;
  icms: {
    cst?: string;
    baseCalculo: number;
    aliquota: number;
    valor: number;
  };
  ipi: {
    cst?: string;
    baseCalculo: number;
    aliquota: number;
    valor: number;
  };
  pis: {
    cst?: string;
    baseCalculo: number;
    aliquota: number;
    valor: number;
  };
  cofins: {
    cst?: string;
    baseCalculo: number;
    aliquota: number;
    valor: number;
  };
}

export interface NFeDuplicata {
  numero: string;
  vencimento: Date;
  valor: number;
}

export interface NFeTransporte {
  modalidade: number; // 0=Emitente, 1=Destinatário, 2=Terceiros, 9=Sem frete
  transportadora?: {
    cnpj?: string;
    razaoSocial?: string;
    ie?: string;
    endereco?: string;
    cidade?: string;
    uf?: string;
  };
  volumes?: {
    quantidade: number;
    especie?: string;
    marca?: string;
    numeracao?: string;
    pesoLiquido: number;
    pesoBruto: number;
  };
}

export interface NFePagamento {
  forma: string; // 01=Dinheiro, 02=Cheque, 03=Cartão Crédito, etc
  valor: number;
  tipoIntegracao?: string;
  cnpjCredenciadora?: string;
  bandeira?: string;
  autorizacao?: string;
}

export interface NFeParsed {
  chaveAcesso: string;
  numero: number;
  serie: number;
  dataEmissao: Date;
  dataSaida?: Date;
  naturezaOperacao: string;
  tipoOperacao: number; // 0=Entrada, 1=Saída
  finalidade: number; // 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução
  consumidorFinal: boolean;
  presencaComprador: number; // 0=Não se aplica, 1=Presencial, 9=Internet
  emitente: NFeEmitente;
  destinatario: NFeDestinatario;
  itens: NFeItem[];
  totais: {
    baseCalculoIcms: number;
    valorIcms: number;
    baseCalculoIcmsSt: number;
    valorIcmsSt: number;
    valorIpi: number;
    valorPis: number;
    valorCofins: number;
    valorFrete: number;
    valorSeguro: number;
    valorDesconto: number;
    valorOutros: number;
    valorProdutos: number;
    valorNota: number;
    valorAproximadoTributos?: number;
  };
  duplicatas: NFeDuplicata[];
  pagamentos: NFePagamento[];
  transporte?: NFeTransporte;
  informacoesAdicionais?: string;
  informacoesFisco?: string;
}

/**
 * Extrai texto de um elemento XML
 */
function getText(element: Element | null, tagName: string): string {
  if (!element) return "";
  const el = element.getElementsByTagName(tagName)[0];
  return el?.textContent?.trim() || "";
}

/**
 * Extrai número de um elemento XML
 */
function getNumber(element: Element | null, tagName: string): number {
  const text = getText(element, tagName);
  return text ? parseFloat(text) : 0;
}

/**
 * Extrai inteiro de um elemento XML
 */
function getInt(element: Element | null, tagName: string): number {
  const text = getText(element, tagName);
  return text ? parseInt(text, 10) : 0;
}

/**
 * Extrai data de um elemento XML
 */
function getDate(element: Element | null, tagName: string): Date {
  const text = getText(element, tagName);
  if (!text) return new Date();
  // Formato: 2024-01-15T10:30:00-03:00 ou 2024-01-15
  return new Date(text);
}

/**
 * Detecta a versão do XML da NFe
 * Suporta versões: 1.10, 2.00, 3.10, 4.00
 */
export function detectNFeVersion(xmlContent: string): string {
  // Tentar extrair versão do atributo versao
  const versionMatch = xmlContent.match(/versao="(\d+\.\d+)"/);
  if (versionMatch) {
    return versionMatch[1];
  }
  
  // Fallback: verificar estrutura do XML
  if (xmlContent.includes("infRespTec")) {
    return "4.00";
  }
  if (xmlContent.includes("rastro") || xmlContent.includes("cBenef")) {
    return "4.00";
  }
  if (xmlContent.includes("GTIN") || xmlContent.includes("cEANTrib")) {
    return "3.10";
  }
  if (xmlContent.includes("infEvento")) {
    return "2.00";
  }
  
  return "4.00"; // Default para versão mais recente
}

/**
 * Informações sobre a versão da NFe
 */
export interface NFeVersionInfo {
  version: string;
  vigencia: string;
  caracteristicas: string[];
  isLegacy: boolean;
}

/**
 * Retorna informações sobre uma versão de NFe
 */
export function getNFeVersionInfo(version: string): NFeVersionInfo {
  const versions: Record<string, NFeVersionInfo> = {
    "1.10": {
      version: "1.10",
      vigencia: "2006-2010",
      caracteristicas: ["Estrutura inicial", "Sem eventos"],
      isLegacy: true,
    },
    "2.00": {
      version: "2.00",
      vigencia: "2010-2014",
      caracteristicas: ["Eventos", "Cancelamento", "Carta de correção"],
      isLegacy: true,
    },
    "3.10": {
      version: "3.10",
      vigencia: "2014-2019",
      caracteristicas: ["GTIN", "FCP", "Partilha ICMS", "Difal"],
      isLegacy: true,
    },
    "4.00": {
      version: "4.00",
      vigencia: "2019-atual",
      caracteristicas: ["Responsável técnico", "Rastreabilidade", "Grupo de medicamentos"],
      isLegacy: false,
    },
  };
  
  return versions[version] || versions["4.00"];
}

/**
 * Parseia XML de NFe e retorna dados estruturados
 * Suporta versões: 1.10, 2.00, 3.10, 4.00
 */
export function parseNFeXml(xmlContent: string): NFeParsed {
  // Criar parser DOM
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, "text/xml");

  // Verificar erros de parsing
  const parseError = doc.getElementsByTagName("parsererror")[0];
  if (parseError) {
    throw new Error("XML inválido: " + parseError.textContent);
  }

  // Buscar elemento NFe ou nfeProc
  let nfe = doc.getElementsByTagName("NFe")[0];
  if (!nfe) {
    const nfeProc = doc.getElementsByTagName("nfeProc")[0];
    if (nfeProc) {
      nfe = nfeProc.getElementsByTagName("NFe")[0];
    }
  }

  if (!nfe) {
    throw new Error("Elemento NFe não encontrado no XML");
  }

  const infNFe = nfe.getElementsByTagName("infNFe")[0];
  if (!infNFe) {
    throw new Error("Elemento infNFe não encontrado no XML");
  }

  // Extrair chave de acesso do atributo Id
  const chaveAcesso = infNFe.getAttribute("Id")?.replace("NFe", "") || "";
  if (chaveAcesso.length !== 44) {
    throw new Error("Chave de acesso inválida");
  }

  // Dados da identificação
  const ide = infNFe.getElementsByTagName("ide")[0];
  const numero = getInt(ide, "nNF");
  const serie = getInt(ide, "serie");
  const dataEmissao = getDate(ide, "dhEmi") || getDate(ide, "dEmi");
  const dataSaida = getText(ide, "dhSaiEnt") ? getDate(ide, "dhSaiEnt") : undefined;
  const naturezaOperacao = getText(ide, "natOp");
  const tipoOperacao = getInt(ide, "tpNF"); // 0=Entrada, 1=Saída
  const finalidade = getInt(ide, "finNFe"); // 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução
  const consumidorFinal = getText(ide, "indFinal") === "1";
  const presencaComprador = getInt(ide, "indPres");

  // Dados do emitente
  const emit = infNFe.getElementsByTagName("emit")[0];
  const enderEmit = emit?.getElementsByTagName("enderEmit")[0];
  const emitente: NFeEmitente = {
    cnpj: getText(emit, "CNPJ"),
    cpf: getText(emit, "CPF"),
    razaoSocial: getText(emit, "xNome"),
    nomeFantasia: getText(emit, "xFant"),
    ie: getText(emit, "IE"),
    endereco: enderEmit ? {
      logradouro: getText(enderEmit, "xLgr"),
      numero: getText(enderEmit, "nro"),
      complemento: getText(enderEmit, "xCpl"),
      bairro: getText(enderEmit, "xBairro"),
      cidade: getText(enderEmit, "xMun"),
      uf: getText(enderEmit, "UF"),
      cep: getText(enderEmit, "CEP"),
    } : undefined,
  };

  // Dados do destinatário
  const dest = infNFe.getElementsByTagName("dest")[0];
  const enderDest = dest?.getElementsByTagName("enderDest")[0];
  const destinatario: NFeDestinatario = {
    cnpj: getText(dest, "CNPJ"),
    cpf: getText(dest, "CPF"),
    razaoSocial: getText(dest, "xNome"),
    nomeFantasia: getText(dest, "xFant"),
    ie: getText(dest, "IE"),
    im: getText(dest, "IM"),
    email: getText(dest, "email"),
    telefone: getText(enderDest, "fone"),
    endereco: enderDest ? {
      logradouro: getText(enderDest, "xLgr"),
      numero: getText(enderDest, "nro"),
      complemento: getText(enderDest, "xCpl"),
      bairro: getText(enderDest, "xBairro"),
      codigoMunicipio: getText(enderDest, "cMun"),
      cidade: getText(enderDest, "xMun"),
      uf: getText(enderDest, "UF"),
      cep: getText(enderDest, "CEP"),
      codigoPais: getText(enderDest, "cPais"),
      pais: getText(enderDest, "xPais"),
    } : undefined,
  };

  // Itens da nota
  const detElements = infNFe.getElementsByTagName("det");
  const itens: NFeItem[] = [];

  for (let i = 0; i < detElements.length; i++) {
    const det = detElements[i];
    const prod = det.getElementsByTagName("prod")[0];
    const imposto = det.getElementsByTagName("imposto")[0];

    // ICMS
    const icmsGroup = imposto?.getElementsByTagName("ICMS")[0];
    const icmsEl = icmsGroup?.children[0]; // ICMS00, ICMS10, etc.

    // IPI
    const ipiGroup = imposto?.getElementsByTagName("IPI")[0];
    const ipiTrib = ipiGroup?.getElementsByTagName("IPITrib")[0];

    // PIS
    const pisGroup = imposto?.getElementsByTagName("PIS")[0];
    const pisEl = pisGroup?.children[0];

    // COFINS
    const cofinsGroup = imposto?.getElementsByTagName("COFINS")[0];
    const cofinsEl = cofinsGroup?.children[0];

    itens.push({
      numero: parseInt(det.getAttribute("nItem") || "0", 10),
      codigo: getText(prod, "cProd"),
      codigoEan: getText(prod, "cEAN") || getText(prod, "cEANTrib"),
      descricao: getText(prod, "xProd"),
      ncm: getText(prod, "NCM"),
      cest: getText(prod, "CEST"),
      cfop: getInt(prod, "CFOP"),
      unidade: getText(prod, "uCom"),
      quantidade: getNumber(prod, "qCom"),
      valorUnitario: getNumber(prod, "vUnCom"),
      valorTotal: getNumber(prod, "vProd"),
      valorDesconto: getNumber(prod, "vDesc") || undefined,
      valorFrete: getNumber(prod, "vFrete") || undefined,
      valorSeguro: getNumber(prod, "vSeg") || undefined,
      valorOutros: getNumber(prod, "vOutro") || undefined,
      icms: {
        cst: getText(icmsEl, "CST") || getText(icmsEl, "CSOSN"),
        baseCalculo: getNumber(icmsEl, "vBC"),
        aliquota: getNumber(icmsEl, "pICMS"),
        valor: getNumber(icmsEl, "vICMS"),
      },
      ipi: {
        cst: getText(ipiTrib, "CST"),
        baseCalculo: getNumber(ipiTrib, "vBC"),
        aliquota: getNumber(ipiTrib, "pIPI"),
        valor: getNumber(ipiTrib, "vIPI"),
      },
      pis: {
        cst: getText(pisEl, "CST"),
        baseCalculo: getNumber(pisEl, "vBC"),
        aliquota: getNumber(pisEl, "pPIS"),
        valor: getNumber(pisEl, "vPIS"),
      },
      cofins: {
        cst: getText(cofinsEl, "CST"),
        baseCalculo: getNumber(cofinsEl, "vBC"),
        aliquota: getNumber(cofinsEl, "pCOFINS"),
        valor: getNumber(cofinsEl, "vCOFINS"),
      },
    });
  }

  // Totais
  const total = infNFe.getElementsByTagName("total")[0];
  const icmsTot = total?.getElementsByTagName("ICMSTot")[0];
  const totais = {
    baseCalculoIcms: getNumber(icmsTot, "vBC"),
    valorIcms: getNumber(icmsTot, "vICMS"),
    baseCalculoIcmsSt: getNumber(icmsTot, "vBCST"),
    valorIcmsSt: getNumber(icmsTot, "vST"),
    valorIpi: getNumber(icmsTot, "vIPI"),
    valorPis: getNumber(icmsTot, "vPIS"),
    valorCofins: getNumber(icmsTot, "vCOFINS"),
    valorFrete: getNumber(icmsTot, "vFrete"),
    valorSeguro: getNumber(icmsTot, "vSeg"),
    valorDesconto: getNumber(icmsTot, "vDesc"),
    valorOutros: getNumber(icmsTot, "vOutro"),
    valorProdutos: getNumber(icmsTot, "vProd"),
    valorNota: getNumber(icmsTot, "vNF"),
    valorAproximadoTributos: getNumber(icmsTot, "vTotTrib") || undefined,
  };

  // Duplicatas
  const cobr = infNFe.getElementsByTagName("cobr")[0];
  const dupElements = cobr?.getElementsByTagName("dup") || [];
  const duplicatas: NFeDuplicata[] = [];

  for (let i = 0; i < dupElements.length; i++) {
    const dup = dupElements[i];
    duplicatas.push({
      numero: getText(dup, "nDup"),
      vencimento: getDate(dup, "dVenc"),
      valor: getNumber(dup, "vDup"),
    });
  }

  // Transporte
  const transp = infNFe.getElementsByTagName("transp")[0];
  let transporte: NFeTransporte | undefined;
  if (transp) {
    const transporta = transp.getElementsByTagName("transporta")[0];
    const vol = transp.getElementsByTagName("vol")[0];

    transporte = {
      modalidade: getInt(transp, "modFrete"),
      transportadora: transporta ? {
        cnpj: getText(transporta, "CNPJ"),
        razaoSocial: getText(transporta, "xNome"),
        ie: getText(transporta, "IE"),
        endereco: getText(transporta, "xEnder"),
        cidade: getText(transporta, "xMun"),
        uf: getText(transporta, "UF"),
      } : undefined,
      volumes: vol ? {
        quantidade: getInt(vol, "qVol"),
        especie: getText(vol, "esp"),
        marca: getText(vol, "marca"),
        numeracao: getText(vol, "nVol"),
        pesoLiquido: getNumber(vol, "pesoL"),
        pesoBruto: getNumber(vol, "pesoB"),
      } : undefined,
    };
  }

  // Pagamentos
  const pag = infNFe.getElementsByTagName("pag")[0];
  const detPagElements = pag?.getElementsByTagName("detPag") || [];
  const pagamentos: NFePagamento[] = [];

  for (let i = 0; i < detPagElements.length; i++) {
    const detPag = detPagElements[i];
    const card = detPag.getElementsByTagName("card")[0];
    pagamentos.push({
      forma: getText(detPag, "tPag"),
      valor: getNumber(detPag, "vPag"),
      tipoIntegracao: getText(detPag, "tpIntegra") || undefined,
      cnpjCredenciadora: card ? getText(card, "CNPJ") : undefined,
      bandeira: card ? getText(card, "tBand") : undefined,
      autorizacao: card ? getText(card, "cAut") : undefined,
    });
  }

  // Informações adicionais
  const infAdic = infNFe.getElementsByTagName("infAdic")[0];
  const informacoesAdicionais = getText(infAdic, "infCpl");
  const informacoesFisco = getText(infAdic, "infAdFisco");

  return {
    chaveAcesso,
    numero,
    serie,
    dataEmissao,
    dataSaida,
    naturezaOperacao,
    tipoOperacao,
    finalidade,
    consumidorFinal,
    presencaComprador,
    emitente,
    destinatario,
    itens,
    totais,
    duplicatas,
    pagamentos,
    transporte,
    informacoesAdicionais,
    informacoesFisco,
  };
}

/**
 * Valida se o XML é uma NFe válida
 */
export function validateNFeXml(xmlContent: string): { valid: boolean; error?: string } {
  try {
    const parsed = parseNFeXml(xmlContent);
    
    if (!parsed.chaveAcesso || parsed.chaveAcesso.length !== 44) {
      return { valid: false, error: "Chave de acesso inválida" };
    }
    
    if (!parsed.emitente.cnpj && !parsed.emitente.cpf) {
      return { valid: false, error: "CNPJ/CPF do emitente não encontrado" };
    }
    
    if (parsed.itens.length === 0) {
      return { valid: false, error: "NFe sem itens" };
    }
    
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : "Erro ao validar XML" 
    };
  }
}

/**
 * Formata CNPJ para exibição
 */
export function formatCnpj(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

/**
 * Formata chave de acesso para exibição
 */
export function formatChaveAcesso(chave: string): string {
  const cleaned = chave.replace(/\D/g, "");
  if (cleaned.length !== 44) return chave;
  return cleaned.replace(/(.{4})/g, "$1 ").trim();
}
