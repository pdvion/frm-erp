/**
 * SPED Fiscal - EFD ICMS/IPI
 * Geração de arquivo digital conforme layout oficial
 * 
 * @see VIO-567 - SPED Fiscal - EFD ICMS/IPI
 * @see http://sped.rfb.gov.br/pasta/show/1569
 */

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

/**
 * Configuração para geração do SPED
 */
export interface SpedConfig {
  /** Período de apuração */
  periodo: {
    dataInicial: Date;
    dataFinal: Date;
  };
  /** Dados da empresa */
  empresa: {
    cnpj: string;
    ie: string;
    razaoSocial: string;
    uf: string;
    codigoMunicipio: string;
    /** Código de finalidade: 0=Original, 1=Retificadora */
    finalidade: "0" | "1";
    /** Perfil de apresentação: A, B ou C */
    perfil: "A" | "B" | "C";
    /** Indicador de atividade: 0=Industrial, 1=Outros */
    atividade: "0" | "1";
  };
  /** Contador responsável */
  contador?: {
    nome: string;
    cpf: string;
    crc: string;
    email?: string;
    telefone?: string;
  };
}

/**
 * Registro genérico do SPED
 */
interface RegistroSped {
  /** Código do registro (ex: "0000", "C100") */
  codigo: string;
  /** Campos do registro */
  campos: (string | number | null | undefined)[];
}

/**
 * Participante (fornecedor/cliente)
 */
export interface Participante {
  codigo: string;
  nome: string;
  codigoPais: string;
  cnpjCpf: string;
  ie?: string;
  codigoMunicipio?: string;
  suframa?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
}

/**
 * Produto/Item
 */
export interface Produto {
  codigo: string;
  descricao: string;
  codigoBarras?: string;
  unidade: string;
  tipoItem: "00" | "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10" | "99";
  ncm: string;
  exTipi?: string;
  genero?: string;
  aliquotaIcms?: number;
}

/**
 * Documento Fiscal (NF-e)
 */
export interface DocumentoFiscal {
  tipo: "entrada" | "saida";
  modelo: string;
  serie: string;
  numero: number;
  chaveAcesso?: string;
  dataEmissao: Date;
  dataEntradaSaida?: Date;
  valorTotal: number;
  valorDesconto?: number;
  valorFrete?: number;
  valorSeguro?: number;
  valorOutros?: number;
  valorProdutos: number;
  baseCalculoIcms?: number;
  valorIcms?: number;
  baseCalculoIcmsSt?: number;
  valorIcmsSt?: number;
  valorIpi?: number;
  valorPis?: number;
  valorCofins?: number;
  participanteCodigo: string;
  itens: ItemDocumento[];
}

/**
 * Item do documento fiscal
 */
export interface ItemDocumento {
  numero: number;
  produtoCodigo: string;
  descricao?: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  valorDesconto?: number;
  cfop: string;
  cstIcms: string;
  baseCalculoIcms?: number;
  aliquotaIcms?: number;
  valorIcms?: number;
  cstIpi?: string;
  valorIpi?: number;
  cstPis?: string;
  valorPis?: number;
  cstCofins?: string;
  valorCofins?: number;
}

/**
 * Item do inventário
 */
export interface ItemInventario {
  produtoCodigo: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  indicadorPropriedade: "0" | "1" | "2" | "3" | "4" | "5";
  participanteCodigo?: string;
  descricaoComplementar?: string;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const VERSAO_LAYOUT = "017"; // Versão do layout do SPED
const DELIMITADOR = "|";

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

/**
 * Formata data para o padrão SPED (ddmmaaaa)
 */
function formatarData(data: Date): string {
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();
  return `${dia}${mes}${ano}`;
}

/**
 * Formata valor numérico para o padrão SPED (com vírgula)
 */
function formatarValor(valor: number | null | undefined, casasDecimais = 2): string {
  if (valor === null || valor === undefined) return "";
  return valor.toFixed(casasDecimais).replace(".", ",");
}

/**
 * Formata quantidade para o padrão SPED
 */
function formatarQuantidade(qtd: number | null | undefined): string {
  if (qtd === null || qtd === undefined) return "";
  return qtd.toFixed(3).replace(".", ",");
}

/**
 * Monta linha do registro SPED
 */
function montarLinha(registro: RegistroSped): string {
  const campos = registro.campos.map(c => c ?? "");
  return `${DELIMITADOR}${registro.codigo}${DELIMITADOR}${campos.join(DELIMITADOR)}${DELIMITADOR}`;
}

// =============================================================================
// BLOCO 0 - ABERTURA, IDENTIFICAÇÃO E REFERÊNCIAS
// =============================================================================

/**
 * Registro 0000 - Abertura do arquivo digital
 */
function gerarRegistro0000(config: SpedConfig): string {
  const registro: RegistroSped = {
    codigo: "0000",
    campos: [
      "017", // Versão do layout
      "0", // Código da finalidade (0=Original)
      formatarData(config.periodo.dataInicial),
      formatarData(config.periodo.dataFinal),
      config.empresa.razaoSocial,
      config.empresa.cnpj,
      "", // CPF (vazio para PJ)
      config.empresa.uf,
      config.empresa.ie,
      config.empresa.codigoMunicipio,
      "", // IM
      "", // SUFRAMA
      config.empresa.perfil,
      config.empresa.atividade,
    ],
  };
  return montarLinha(registro);
}

/**
 * Registro 0001 - Abertura do Bloco 0
 */
function gerarRegistro0001(temDados: boolean): string {
  const registro: RegistroSped = {
    codigo: "0001",
    campos: [temDados ? "0" : "1"], // 0=com dados, 1=sem dados
  };
  return montarLinha(registro);
}

/**
 * Registro 0005 - Dados complementares da entidade
 */
function gerarRegistro0005(config: SpedConfig, dados: {
  fantasia?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  telefone?: string;
  email?: string;
}): string {
  const registro: RegistroSped = {
    codigo: "0005",
    campos: [
      dados.fantasia || config.empresa.razaoSocial,
      dados.cep || "",
      dados.endereco || "",
      dados.numero || "",
      dados.complemento || "",
      dados.bairro || "",
      dados.telefone || "",
      "", // Fax
      dados.email || "",
    ],
  };
  return montarLinha(registro);
}

/**
 * Registro 0100 - Dados do contabilista
 */
function gerarRegistro0100(contador: SpedConfig["contador"]): string {
  if (!contador) return "";
  
  const registro: RegistroSped = {
    codigo: "0100",
    campos: [
      contador.nome,
      contador.cpf,
      contador.crc,
      "", // CNPJ escritório
      "", // CEP
      "", // Endereço
      "", // Número
      "", // Complemento
      "", // Bairro
      contador.telefone || "",
      "", // Fax
      contador.email || "",
      "", // Código município
    ],
  };
  return montarLinha(registro);
}

/**
 * Registro 0150 - Tabela de cadastro do participante
 */
function gerarRegistro0150(participante: Participante): string {
  const registro: RegistroSped = {
    codigo: "0150",
    campos: [
      participante.codigo,
      participante.nome,
      participante.codigoPais,
      participante.cnpjCpf,
      "", // CPF (se PF)
      participante.ie || "",
      participante.codigoMunicipio || "",
      participante.suframa || "",
      participante.endereco || "",
      participante.numero || "",
      participante.complemento || "",
      participante.bairro || "",
    ],
  };
  return montarLinha(registro);
}

/**
 * Registro 0190 - Identificação das unidades de medida
 */
function gerarRegistro0190(unidade: string, descricao: string): string {
  const registro: RegistroSped = {
    codigo: "0190",
    campos: [unidade, descricao],
  };
  return montarLinha(registro);
}

/**
 * Registro 0200 - Tabela de identificação do item
 */
function gerarRegistro0200(produto: Produto): string {
  const registro: RegistroSped = {
    codigo: "0200",
    campos: [
      produto.codigo,
      produto.descricao,
      produto.codigoBarras || "",
      "", // Código anterior
      produto.unidade,
      produto.tipoItem,
      produto.ncm,
      produto.exTipi || "",
      produto.genero || "",
      "", // Código serviço
      produto.aliquotaIcms ? formatarValor(produto.aliquotaIcms) : "",
      "", // CEST
    ],
  };
  return montarLinha(registro);
}

/**
 * Registro 0990 - Encerramento do Bloco 0
 */
function gerarRegistro0990(qtdLinhas: number): string {
  const registro: RegistroSped = {
    codigo: "0990",
    campos: [qtdLinhas],
  };
  return montarLinha(registro);
}

// =============================================================================
// BLOCO C - DOCUMENTOS FISCAIS I (MERCADORIAS)
// =============================================================================

/**
 * Registro C001 - Abertura do Bloco C
 */
function gerarRegistroC001(temDados: boolean): string {
  const registro: RegistroSped = {
    codigo: "C001",
    campos: [temDados ? "0" : "1"],
  };
  return montarLinha(registro);
}

/**
 * Registro C100 - Nota Fiscal (código 01), NF-e (código 55), NFC-e (código 65)
 */
function gerarRegistroC100(doc: DocumentoFiscal): string {
  const registro: RegistroSped = {
    codigo: "C100",
    campos: [
      doc.tipo === "entrada" ? "0" : "1", // Indicador do tipo de operação
      "1", // Indicador do emitente (0=própria, 1=terceiros)
      doc.participanteCodigo,
      doc.modelo,
      "00", // Situação do documento (00=regular)
      doc.serie,
      doc.numero,
      doc.chaveAcesso || "",
      formatarData(doc.dataEmissao),
      doc.dataEntradaSaida ? formatarData(doc.dataEntradaSaida) : "",
      formatarValor(doc.valorTotal),
      "1", // Indicador do tipo de pagamento (1=à vista)
      formatarValor(doc.valorDesconto || 0),
      "", // Abatimento não documentado
      formatarValor(doc.valorProdutos),
      formatarValor(doc.valorFrete || 0),
      formatarValor(doc.valorSeguro || 0),
      formatarValor(doc.valorOutros || 0),
      formatarValor(doc.baseCalculoIcms || 0),
      formatarValor(doc.valorIcms || 0),
      formatarValor(doc.baseCalculoIcmsSt || 0),
      formatarValor(doc.valorIcmsSt || 0),
      formatarValor(doc.valorIpi || 0),
      formatarValor(doc.valorPis || 0),
      formatarValor(doc.valorCofins || 0),
      "", // Valor PIS/ST
      "", // Valor COFINS/ST
    ],
  };
  return montarLinha(registro);
}

/**
 * Registro C170 - Itens do documento (código 01, 1B, 04 e 55)
 */
function gerarRegistroC170(item: ItemDocumento): string {
  const registro: RegistroSped = {
    codigo: "C170",
    campos: [
      item.numero,
      item.produtoCodigo,
      item.descricao || "",
      formatarQuantidade(item.quantidade),
      item.unidade,
      formatarValor(item.valorUnitario, 4),
      formatarValor(item.valorTotal),
      formatarValor(item.valorDesconto || 0),
      "0", // Movimentação física
      item.cstIcms,
      item.cfop,
      "", // Código natureza operação
      formatarValor(item.baseCalculoIcms || 0),
      formatarValor(item.aliquotaIcms || 0),
      formatarValor(item.valorIcms || 0),
      "", // Base cálculo ICMS ST
      "", // Alíquota ICMS ST
      "", // Valor ICMS ST
      "", // Indicador período apuração IPI
      item.cstIpi || "",
      "", // Código enquadramento IPI
      "", // Base cálculo IPI
      "", // Alíquota IPI
      formatarValor(item.valorIpi || 0),
      item.cstPis || "",
      "", // Base cálculo PIS
      "", // Alíquota PIS (%)
      "", // Quantidade base PIS
      "", // Alíquota PIS (R$)
      formatarValor(item.valorPis || 0),
      item.cstCofins || "",
      "", // Base cálculo COFINS
      "", // Alíquota COFINS (%)
      "", // Quantidade base COFINS
      "", // Alíquota COFINS (R$)
      formatarValor(item.valorCofins || 0),
      "", // Código conta analítica
    ],
  };
  return montarLinha(registro);
}

/**
 * Registro C190 - Registro analítico do documento
 */
function gerarRegistroC190(
  cstIcms: string,
  cfop: string,
  aliquotaIcms: number,
  valorOperacao: number,
  baseCalculoIcms: number,
  valorIcms: number,
  baseCalculoIcmsSt: number,
  valorIcmsSt: number,
  valorIpiReduzido: number,
  valorOutros: number
): string {
  const registro: RegistroSped = {
    codigo: "C190",
    campos: [
      cstIcms,
      cfop,
      formatarValor(aliquotaIcms),
      formatarValor(valorOperacao),
      formatarValor(baseCalculoIcms),
      formatarValor(valorIcms),
      formatarValor(baseCalculoIcmsSt),
      formatarValor(valorIcmsSt),
      formatarValor(valorIpiReduzido),
      formatarValor(valorOutros),
    ],
  };
  return montarLinha(registro);
}

/**
 * Registro C990 - Encerramento do Bloco C
 */
function gerarRegistroC990(qtdLinhas: number): string {
  const registro: RegistroSped = {
    codigo: "C990",
    campos: [qtdLinhas],
  };
  return montarLinha(registro);
}

// =============================================================================
// BLOCO H - INVENTÁRIO FÍSICO
// =============================================================================

/**
 * Registro H001 - Abertura do Bloco H
 */
function gerarRegistroH001(temDados: boolean): string {
  const registro: RegistroSped = {
    codigo: "H001",
    campos: [temDados ? "0" : "1"],
  };
  return montarLinha(registro);
}

/**
 * Registro H005 - Totais do inventário
 */
function gerarRegistroH005(dataInventario: Date, valorTotal: number, motivoInventario: string): string {
  const registro: RegistroSped = {
    codigo: "H005",
    campos: [
      formatarData(dataInventario),
      formatarValor(valorTotal),
      motivoInventario, // 01=Final período, 02=Mudança tributação, etc.
    ],
  };
  return montarLinha(registro);
}

/**
 * Registro H010 - Inventário
 */
function gerarRegistroH010(item: ItemInventario): string {
  const registro: RegistroSped = {
    codigo: "H010",
    campos: [
      item.produtoCodigo,
      item.unidade,
      formatarQuantidade(item.quantidade),
      formatarValor(item.valorUnitario, 6),
      formatarValor(item.valorTotal),
      item.indicadorPropriedade,
      item.participanteCodigo || "",
      "", // Texto complementar
      "", // Código conta analítica
      formatarValor(item.valorTotal), // Valor item IR
    ],
  };
  return montarLinha(registro);
}

/**
 * Registro H990 - Encerramento do Bloco H
 */
function gerarRegistroH990(qtdLinhas: number): string {
  const registro: RegistroSped = {
    codigo: "H990",
    campos: [qtdLinhas],
  };
  return montarLinha(registro);
}

// =============================================================================
// BLOCO 9 - CONTROLE E ENCERRAMENTO
// =============================================================================

/**
 * Registro 9001 - Abertura do Bloco 9
 */
function gerarRegistro9001(): string {
  const registro: RegistroSped = {
    codigo: "9001",
    campos: ["0"],
  };
  return montarLinha(registro);
}

/**
 * Registro 9900 - Registros do arquivo
 */
function gerarRegistro9900(codigoRegistro: string, quantidade: number): string {
  const registro: RegistroSped = {
    codigo: "9900",
    campos: [codigoRegistro, quantidade],
  };
  return montarLinha(registro);
}

/**
 * Registro 9990 - Encerramento do Bloco 9
 */
function gerarRegistro9990(qtdLinhas: number): string {
  const registro: RegistroSped = {
    codigo: "9990",
    campos: [qtdLinhas],
  };
  return montarLinha(registro);
}

/**
 * Registro 9999 - Encerramento do arquivo digital
 */
function gerarRegistro9999(qtdLinhasTotal: number): string {
  const registro: RegistroSped = {
    codigo: "9999",
    campos: [qtdLinhasTotal],
  };
  return montarLinha(registro);
}

// =============================================================================
// GERADOR PRINCIPAL
// =============================================================================

/**
 * Dados para geração do SPED
 */
export interface DadosSped {
  config: SpedConfig;
  dadosComplementares?: {
    fantasia?: string;
    cep?: string;
    endereco?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    telefone?: string;
    email?: string;
  };
  participantes: Participante[];
  produtos: Produto[];
  unidades: { codigo: string; descricao: string }[];
  documentos: DocumentoFiscal[];
  inventario?: {
    data: Date;
    motivo: string;
    itens: ItemInventario[];
  };
}

/**
 * Gera o arquivo SPED Fiscal completo
 * @param dados - Dados para geração do SPED
 * @returns Conteúdo do arquivo TXT
 */
export function gerarSpedFiscal(dados: DadosSped): string {
  const linhas: string[] = [];
  const contadores: Record<string, number> = {};

  // Função auxiliar para adicionar linha e contar
  const addLinha = (linha: string) => {
    if (!linha) return;
    linhas.push(linha);
    const codigo = linha.split(DELIMITADOR)[1];
    contadores[codigo] = (contadores[codigo] || 0) + 1;
  };

  // ==========================================================================
  // BLOCO 0 - ABERTURA
  // ==========================================================================
  addLinha(gerarRegistro0000(dados.config));
  addLinha(gerarRegistro0001(true));
  
  if (dados.dadosComplementares) {
    addLinha(gerarRegistro0005(dados.config, dados.dadosComplementares));
  }
  
  if (dados.config.contador) {
    addLinha(gerarRegistro0100(dados.config.contador));
  }

  // Participantes
  for (const participante of dados.participantes) {
    addLinha(gerarRegistro0150(participante));
  }

  // Unidades de medida
  for (const unidade of dados.unidades) {
    addLinha(gerarRegistro0190(unidade.codigo, unidade.descricao));
  }

  // Produtos
  for (const produto of dados.produtos) {
    addLinha(gerarRegistro0200(produto));
  }

  const qtdBloco0 = linhas.length + 1; // +1 para o 0990
  addLinha(gerarRegistro0990(qtdBloco0));

  // ==========================================================================
  // BLOCO C - DOCUMENTOS FISCAIS
  // ==========================================================================
  const inicioC = linhas.length;
  addLinha(gerarRegistroC001(dados.documentos.length > 0));

  for (const doc of dados.documentos) {
    addLinha(gerarRegistroC100(doc));
    
    // Itens do documento
    for (const item of doc.itens) {
      addLinha(gerarRegistroC170(item));
    }

    // Registro analítico (simplificado - agrupa por CST/CFOP)
    const totaisPorCfop = new Map<string, {
      valorOp: number;
      baseIcms: number;
      valorIcms: number;
      aliqIcms: number;
    }>();

    for (const item of doc.itens) {
      const chave = `${item.cstIcms}-${item.cfop}`;
      const atual = totaisPorCfop.get(chave) || { valorOp: 0, baseIcms: 0, valorIcms: 0, aliqIcms: item.aliquotaIcms || 0 };
      atual.valorOp += item.valorTotal;
      atual.baseIcms += item.baseCalculoIcms || 0;
      atual.valorIcms += item.valorIcms || 0;
      totaisPorCfop.set(chave, atual);
    }

    for (const [chave, totais] of totaisPorCfop) {
      const [cst, cfop] = chave.split("-");
      addLinha(gerarRegistroC190(cst, cfop, totais.aliqIcms, totais.valorOp, totais.baseIcms, totais.valorIcms, 0, 0, 0, 0));
    }
  }

  const qtdBlocoC = linhas.length - inicioC + 1;
  addLinha(gerarRegistroC990(qtdBlocoC));

  // ==========================================================================
  // BLOCO H - INVENTÁRIO
  // ==========================================================================
  const inicioH = linhas.length;
  const temInventario = dados.inventario && dados.inventario.itens.length > 0;
  addLinha(gerarRegistroH001(temInventario || false));

  if (temInventario && dados.inventario) {
    const valorTotalInventario = dados.inventario.itens.reduce((acc, item) => acc + item.valorTotal, 0);
    addLinha(gerarRegistroH005(dados.inventario.data, valorTotalInventario, dados.inventario.motivo));

    for (const item of dados.inventario.itens) {
      addLinha(gerarRegistroH010(item));
    }
  }

  const qtdBlocoH = linhas.length - inicioH + 1;
  addLinha(gerarRegistroH990(qtdBlocoH));

  // ==========================================================================
  // BLOCO 9 - CONTROLE E ENCERRAMENTO
  // ==========================================================================
  const inicioBloco9 = linhas.length;
  addLinha(gerarRegistro9001());

  // Contagem de registros do bloco 9
  contadores["9001"] = 1;
  contadores["9990"] = 1;
  contadores["9999"] = 1;
  contadores["9900"] = Object.keys(contadores).length;

  for (const [codigo, qtd] of Object.entries(contadores).sort()) {
    addLinha(gerarRegistro9900(codigo, qtd));
  }

  const qtdBloco9 = linhas.length - inicioBloco9 + 2; // +2 para 9990 e 9999
  addLinha(gerarRegistro9990(qtdBloco9));
  addLinha(gerarRegistro9999(linhas.length + 1));

  return linhas.join("\r\n");
}

/**
 * Valida estrutura básica do SPED gerado
 */
export function validarSped(conteudo: string): { valido: boolean; erros: string[] } {
  const erros: string[] = [];
  const linhas = conteudo.split("\r\n").filter(l => l.trim());

  // Verificar registro inicial
  if (!linhas[0]?.startsWith("|0000|")) {
    erros.push("Arquivo deve iniciar com registro 0000");
  }

  // Verificar registro final
  if (!linhas[linhas.length - 1]?.startsWith("|9999|")) {
    erros.push("Arquivo deve terminar com registro 9999");
  }

  // Verificar delimitadores
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    if (!linha.startsWith("|") || !linha.endsWith("|")) {
      erros.push(`Linha ${i + 1}: Delimitadores inválidos`);
    }
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}

export {
  formatarData,
  formatarValor,
  formatarQuantidade,
  VERSAO_LAYOUT,
};
