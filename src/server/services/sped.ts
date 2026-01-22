/**
 * Serviço de geração SPED Fiscal
 * 
 * Este serviço busca dados do banco e gera o arquivo SPED Fiscal (EFD ICMS/IPI)
 * 
 * @see VIO-567 - SPED Fiscal - EFD ICMS/IPI
 */

import { prisma } from "@/lib/prisma";
import {
  gerarSpedFiscal,
  validarSped,
  SpedConfig,
  DadosSped,
  Participante,
  Produto,
  DocumentoFiscal,
  ItemInventario,
} from "@/lib/sped/efd-icms-ipi";

/**
 * Resultado da geração do SPED
 */
export interface SpedResult {
  sucesso: boolean;
  conteudo?: string;
  nomeArquivo?: string;
  erro?: string;
  validacao?: {
    valido: boolean;
    erros: string[];
  };
}

/**
 * Parâmetros para geração do SPED
 */
export interface SpedParams {
  companyId: string;
  dataInicial: Date;
  dataFinal: Date;
  incluirInventario?: boolean;
  dataInventario?: Date;
}

/**
 * Obtém configuração da empresa para o SPED
 */
async function getSpedConfig(companyId: string, params: SpedParams): Promise<SpedConfig | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company || !company.cnpj || !company.ie || !company.state) {
    return null;
  }

  return {
    periodo: {
      dataInicial: params.dataInicial,
      dataFinal: params.dataFinal,
    },
    empresa: {
      cnpj: company.cnpj.replace(/\D/g, ""),
      ie: company.ie.replace(/\D/g, ""),
      razaoSocial: company.name,
      uf: company.state,
      codigoMunicipio: "", // TODO: Adicionar campo cityCode ao Company
      finalidade: "0",
      perfil: "A",
      atividade: "0", // Industrial
    },
  };
}

/**
 * Obtém participantes (fornecedores e clientes) do período
 */
async function getParticipantes(companyId: string, params: SpedParams): Promise<Participante[]> {
  const participantes: Participante[] = [];

  // Buscar fornecedores com movimentação no período
  const fornecedores = await prisma.supplier.findMany({
    where: {
      companyId,
      receivedInvoices: {
        some: {
          issueDate: {
            gte: params.dataInicial,
            lte: params.dataFinal,
          },
        },
      },
    },
  });

  for (const f of fornecedores) {
    participantes.push({
      codigo: `F${f.code}`,
      nome: f.companyName,
      codigoPais: "1058", // Brasil
      cnpjCpf: f.cnpj?.replace(/\D/g, "") || "",
      ie: f.stateRegistration?.replace(/\D/g, "") || "",
      codigoMunicipio: "", // TODO: Adicionar campo
      endereco: f.address || "",
      numero: f.addressNumber || "",
      complemento: f.addressComplement || "",
      bairro: f.neighborhood || "",
    });
  }

  // Buscar clientes com movimentação no período
  const clientes = await prisma.customer.findMany({
    where: {
      companyId,
      issuedInvoices: {
        some: {
          issueDate: {
            gte: params.dataInicial,
            lte: params.dataFinal,
          },
        },
      },
    },
  });

  for (const c of clientes) {
    participantes.push({
      codigo: `C${c.code}`,
      nome: c.companyName,
      codigoPais: "1058",
      cnpjCpf: (c.cnpj || c.cpf || "").replace(/\D/g, ""),
      ie: c.stateRegistration?.replace(/\D/g, "") || "",
      codigoMunicipio: "", // TODO: Adicionar campo
      endereco: c.addressStreet || "",
      numero: c.addressNumber || "",
      complemento: c.addressComplement || "",
      bairro: c.addressNeighborhood || "",
    });
  }

  return participantes;
}

/**
 * Obtém produtos movimentados no período
 */
async function getProdutos(companyId: string, params: SpedParams): Promise<Produto[]> {
  // Buscar materiais com movimentação no período
  const materiais = await prisma.material.findMany({
    where: {
      companyId,
      OR: [
        {
          receivedInvoiceItems: {
            some: {
              receivedInvoice: {
                issueDate: {
                  gte: params.dataInicial,
                  lte: params.dataFinal,
                },
              },
            },
          },
        },
        {
          issuedInvoiceItems: {
            some: {
              issuedInvoice: {
                issueDate: {
                  gte: params.dataInicial,
                  lte: params.dataFinal,
                },
              },
            },
          },
        },
      ],
    },
  });

  return materiais.map(m => ({
    codigo: m.code,
    descricao: m.description,
    codigoBarras: m.barcode || undefined,
    unidade: m.unit,
    tipoItem: "00" as const, // Mercadoria para revenda
    ncm: m.ncm || "00000000",
    aliquotaIcms: 18, // TODO: Buscar alíquota real
  }));
}

/**
 * Obtém unidades de medida utilizadas
 */
async function getUnidades(companyId: string): Promise<{ codigo: string; descricao: string }[]> {
  const unidades = await prisma.material.findMany({
    where: { companyId },
    select: { unit: true },
    distinct: ["unit"],
  });

  const descricoes: Record<string, string> = {
    UN: "UNIDADE",
    PC: "PEÇA",
    KG: "QUILOGRAMA",
    G: "GRAMA",
    L: "LITRO",
    ML: "MILILITRO",
    M: "METRO",
    M2: "METRO QUADRADO",
    M3: "METRO CÚBICO",
    CX: "CAIXA",
    PCT: "PACOTE",
    FD: "FARDO",
    ROL: "ROLO",
    PAR: "PAR",
    JG: "JOGO",
    KIT: "KIT",
  };

  return unidades.map(u => ({
    codigo: u.unit,
    descricao: descricoes[u.unit] || u.unit,
  }));
}

/**
 * Obtém documentos fiscais de entrada (NF-e recebidas)
 */
async function getDocumentosEntrada(companyId: string, params: SpedParams): Promise<DocumentoFiscal[]> {
  const notas = await prisma.receivedInvoice.findMany({
    where: {
      companyId,
      issueDate: {
        gte: params.dataInicial,
        lte: params.dataFinal,
      },
      status: "APPROVED",
    },
    include: {
      supplier: true,
      items: {
        include: { material: true },
      },
    },
  });

  return notas.map(nf => ({
    tipo: "entrada" as const,
    modelo: nf.model || "55",
    serie: nf.series || "1",
    numero: nf.code,
    chaveAcesso: nf.accessKey || undefined,
    dataEmissao: nf.issueDate,
    dataEntradaSaida: nf.entryDate || undefined,
    valorTotal: Number(nf.totalValue),
    valorDesconto: Number(nf.discountValue || 0),
    valorFrete: Number(nf.freightValue || 0),
    valorProdutos: Number(nf.productsValue || nf.totalValue),
    baseCalculoIcms: Number(nf.icmsBase || 0),
    valorIcms: Number(nf.icmsValue || 0),
    valorIpi: Number(nf.ipiValue || 0),
    valorPis: Number(nf.pisValue || 0),
    valorCofins: Number(nf.cofinsValue || 0),
    participanteCodigo: `F${nf.supplier?.code || "0"}`,
    itens: nf.items.map((item, idx) => ({
      numero: idx + 1,
      produtoCodigo: item.material?.code || item.materialId || "",
      descricao: item.description || item.material?.description || "",
      quantidade: Number(item.quantity),
      unidade: item.unit || item.material?.unit || "UN",
      valorUnitario: Number(item.unitPrice),
      valorTotal: Number(item.totalPrice),
      valorDesconto: Number(item.discountValue || 0),
      cfop: item.cfop || "1102",
      cstIcms: item.icmsCst || "00",
      baseCalculoIcms: Number(item.icmsBase || 0),
      aliquotaIcms: Number(item.icmsRate || 0),
      valorIcms: Number(item.icmsValue || 0),
      cstIpi: item.ipiCst || "50",
      valorIpi: Number(item.ipiValue || 0),
      cstPis: item.pisCst || "01",
      valorPis: Number(item.pisValue || 0),
      cstCofins: item.cofinsCst || "01",
      valorCofins: Number(item.cofinsValue || 0),
    })),
  }));
}

/**
 * Obtém documentos fiscais de saída (NF-e emitidas)
 */
async function getDocumentosSaida(companyId: string, params: SpedParams): Promise<DocumentoFiscal[]> {
  const notas = await prisma.issuedInvoice.findMany({
    where: {
      companyId,
      issueDate: {
        gte: params.dataInicial,
        lte: params.dataFinal,
      },
      status: "AUTHORIZED",
    },
    include: {
      customer: true,
      items: {
        include: { material: true },
      },
    },
  });

  return notas.map(nf => ({
    tipo: "saida" as const,
    modelo: nf.model || "55",
    serie: nf.series || "1",
    numero: nf.code,
    chaveAcesso: nf.accessKey || undefined,
    dataEmissao: nf.issueDate,
    valorTotal: Number(nf.totalValue),
    valorDesconto: Number(nf.discountValue || 0),
    valorFrete: Number(nf.freightValue || 0),
    valorProdutos: Number(nf.subtotal || nf.totalValue),
    baseCalculoIcms: Number(nf.icmsBase || 0),
    valorIcms: Number(nf.icmsValue || 0),
    valorIpi: Number(nf.ipiValue || 0),
    valorPis: Number(nf.pisValue || 0),
    valorCofins: Number(nf.cofinsValue || 0),
    participanteCodigo: `C${nf.customer?.code || "0"}`,
    itens: nf.items.map((item, idx) => ({
      numero: idx + 1,
      produtoCodigo: item.material?.code || item.materialId || "",
      descricao: item.description || item.material?.description || "",
      quantidade: Number(item.quantity),
      unidade: item.unit || item.material?.unit || "UN",
      valorUnitario: Number(item.unitPrice),
      valorTotal: Number(item.totalPrice),
      valorDesconto: Number(item.discountPercent ? item.totalPrice * item.discountPercent / 100 : 0),
      cfop: item.cfop || "5102",
      cstIcms: item.icmsCst || "00",
      baseCalculoIcms: Number(item.icmsBase || 0),
      aliquotaIcms: Number(item.icmsRate || 0),
      valorIcms: Number(item.icmsValue || 0),
      cstIpi: item.ipiCst || "50",
      valorIpi: Number(item.ipiValue || 0),
      cstPis: item.pisCst || "01",
      valorPis: Number(item.pisValue || 0),
      cstCofins: item.cofinsCst || "01",
      valorCofins: Number(item.cofinsValue || 0),
    })),
  }));
}

/**
 * Obtém dados do inventário
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getInventario(companyId: string, _dataInventario: Date): Promise<ItemInventario[]> {
  const estoques = await prisma.inventory.findMany({
    where: { companyId },
    include: { material: true },
  });

  return estoques
    .filter(e => Number(e.quantity) > 0)
    .map(e => ({
      produtoCodigo: e.material.code,
      unidade: e.material.unit,
      quantidade: Number(e.quantity),
      valorUnitario: Number(e.averageCost || e.material.lastPurchasePrice || 0),
      valorTotal: Number(e.quantity) * Number(e.averageCost || e.material.lastPurchasePrice || 0),
      indicadorPropriedade: "0" as const, // Próprio
    }));
}

/**
 * Gera o arquivo SPED Fiscal para uma empresa
 */
export async function gerarArquivoSped(params: SpedParams): Promise<SpedResult> {
  try {
    // Obter configuração
    const config = await getSpedConfig(params.companyId, params);
    if (!config) {
      return {
        sucesso: false,
        erro: "Empresa não possui dados fiscais completos (CNPJ, IE, UF)",
      };
    }

    // Obter dados complementares da empresa
    const company = await prisma.company.findUnique({
      where: { id: params.companyId },
    });

    // Obter dados para o SPED
    const [participantes, produtos, unidades, docsEntrada, docsSaida] = await Promise.all([
      getParticipantes(params.companyId, params),
      getProdutos(params.companyId, params),
      getUnidades(params.companyId),
      getDocumentosEntrada(params.companyId, params),
      getDocumentosSaida(params.companyId, params),
    ]);

    // Obter inventário se solicitado
    let inventario: DadosSped["inventario"] | undefined;
    if (params.incluirInventario && params.dataInventario) {
      const itensInventario = await getInventario(params.companyId, params.dataInventario);
      inventario = {
        data: params.dataInventario,
        motivo: "01", // Final do período
        itens: itensInventario,
      };
    }

    // Montar dados do SPED
    const dadosSped: DadosSped = {
      config,
      dadosComplementares: {
        fantasia: company?.tradeName || undefined,
        cep: company?.zipCode || undefined,
        endereco: company?.address || undefined,
        telefone: company?.phone || undefined,
        email: company?.email || undefined,
      },
      participantes,
      produtos,
      unidades,
      documentos: [...docsEntrada, ...docsSaida],
      inventario,
    };

    // Gerar arquivo
    const conteudo = gerarSpedFiscal(dadosSped);

    // Validar
    const validacao = validarSped(conteudo);

    // Gerar nome do arquivo
    const mesAno = `${String(params.dataInicial.getMonth() + 1).padStart(2, "0")}${params.dataInicial.getFullYear()}`;
    const nomeArquivo = `SPED_${config.empresa.cnpj}_${mesAno}.txt`;

    return {
      sucesso: true,
      conteudo,
      nomeArquivo,
      validacao,
    };
  } catch (error) {
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Erro interno na geração do SPED",
    };
  }
}

/**
 * Lista períodos disponíveis para geração do SPED
 */
export async function listarPeriodosDisponiveis(companyId: string): Promise<{ mes: number; ano: number; temDados: boolean }[]> {
  // Buscar meses com movimentação
  const notasEntrada = await prisma.receivedInvoice.findMany({
    where: { companyId, status: "APPROVED" },
    select: { issueDate: true },
    orderBy: { issueDate: "asc" },
  });

  const notasSaida = await prisma.issuedInvoice.findMany({
    where: { companyId, status: "AUTHORIZED" },
    select: { issueDate: true },
    orderBy: { issueDate: "asc" },
  });

  const periodos = new Set<string>();

  for (const nf of [...notasEntrada, ...notasSaida]) {
    const mes = nf.issueDate.getMonth() + 1;
    const ano = nf.issueDate.getFullYear();
    periodos.add(`${ano}-${mes}`);
  }

  return Array.from(periodos)
    .map(p => {
      const [ano, mes] = p.split("-").map(Number);
      return { mes, ano, temDados: true };
    })
    .sort((a, b) => (b.ano - a.ano) || (b.mes - a.mes));
}
