/**
 * Serviço de geração SPED Fiscal
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

export interface SpedResult {
  sucesso: boolean;
  conteudo?: string;
  nomeArquivo?: string;
  erro?: string;
  validacao?: { valido: boolean; erros: string[] };
}

export interface SpedParams {
  companyId: string;
  dataInicial: Date;
  dataFinal: Date;
  incluirInventario?: boolean;
  dataInventario?: Date;
}

async function getSpedConfig(companyId: string, params: SpedParams): Promise<SpedConfig | null> {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company || !company.cnpj || !company.ie || !company.state) return null;

  return {
    periodo: { dataInicial: params.dataInicial, dataFinal: params.dataFinal },
    empresa: {
      cnpj: company.cnpj.replace(/\D/g, ""),
      ie: company.ie.replace(/\D/g, ""),
      razaoSocial: company.name,
      uf: company.state,
      codigoMunicipio: "",
      finalidade: "0",
      perfil: "A",
      atividade: "0",
    },
  };
}

async function getParticipantes(companyId: string, params: SpedParams): Promise<Participante[]> {
  const participantes: Participante[] = [];

  const fornecedores = await prisma.supplier.findMany({
    where: {
      companyId,
      receivedInvoices: { some: { issueDate: { gte: params.dataInicial, lte: params.dataFinal } } },
    },
  });

  for (const f of fornecedores) {
    participantes.push({
      codigo: `F${f.code}`,
      nome: f.companyName,
      codigoPais: "1058",
      cnpjCpf: f.cnpj?.replace(/\D/g, "") || "",
      ie: f.ie?.replace(/\D/g, "") || "",
      codigoMunicipio: "",
      endereco: f.address || "",
      numero: f.number || "",
      complemento: "",
      bairro: f.neighborhood || "",
    });
  }

  const clientes = await prisma.customer.findMany({
    where: {
      companyId,
      issuedInvoices: { some: { issueDate: { gte: params.dataInicial, lte: params.dataFinal } } },
    },
  });

  for (const c of clientes) {
    participantes.push({
      codigo: `C${c.code}`,
      nome: c.companyName,
      codigoPais: "1058",
      cnpjCpf: (c.cnpj || c.cpf || "").replace(/\D/g, ""),
      ie: c.stateRegistration?.replace(/\D/g, "") || "",
      codigoMunicipio: "",
      endereco: c.addressStreet || "",
      numero: c.addressNumber || "",
      complemento: c.addressComplement || "",
      bairro: c.addressNeighborhood || "",
    });
  }

  return participantes;
}

async function getProdutos(companyId: string, params: SpedParams): Promise<Produto[]> {
  const materiaisEntrada = await prisma.receivedInvoiceItem.findMany({
    where: { invoice: { companyId, issueDate: { gte: params.dataInicial, lte: params.dataFinal } } },
    include: { material: true },
  });

  const materiaisSaida = await prisma.issuedInvoiceItem.findMany({
    where: { invoice: { companyId, issueDate: { gte: params.dataInicial, lte: params.dataFinal } } },
    include: { material: true },
  });

  const materiaisMap = new Map<string, Produto>();

  for (const item of materiaisEntrada) {
    if (item.material && !materiaisMap.has(item.material.id)) {
      materiaisMap.set(item.material.id, {
        codigo: String(item.material.code),
        descricao: item.material.description,
        codigoBarras: "",
        unidade: item.material.unit,
        tipoItem: "00",
        ncm: item.ncm || item.material.ncm || "",
        aliquotaIcms: 0,
      });
    }
  }

  for (const item of materiaisSaida) {
    if (item.material && !materiaisMap.has(item.material.id)) {
      materiaisMap.set(item.material.id, {
        codigo: String(item.material.code),
        descricao: item.material.description,
        codigoBarras: "",
        unidade: item.material.unit,
        tipoItem: "00",
        ncm: item.ncm || item.material.ncm || "",
        aliquotaIcms: 0,
      });
    }
  }

  return Array.from(materiaisMap.values());
}

async function getDocumentosEntrada(companyId: string, params: SpedParams): Promise<DocumentoFiscal[]> {
  const notas = await prisma.receivedInvoice.findMany({
    where: { companyId, issueDate: { gte: params.dataInicial, lte: params.dataFinal }, status: "APPROVED" },
    include: { supplier: true, items: { include: { material: true } } },
  });

  return notas.map(nf => ({
    tipo: "entrada" as const,
    modelo: "55",
    serie: String(nf.series),
    numero: nf.invoiceNumber,
    chaveAcesso: nf.accessKey || undefined,
    dataEmissao: nf.issueDate,
    dataEntradaSaida: nf.receivedAt || undefined,
    valorTotal: Number(nf.totalInvoice),
    valorDesconto: Number(nf.discountValue || 0),
    valorFrete: Number(nf.freightValue || 0),
    valorProdutos: Number(nf.totalProducts || nf.totalInvoice),
    baseCalculoIcms: Number(nf.icmsBase || 0),
    valorIcms: Number(nf.icmsValue || 0),
    valorIpi: Number(nf.ipiValue || 0),
    valorPis: Number(nf.pisValue || 0),
    valorCofins: Number(nf.cofinsValue || 0),
    participanteCodigo: `F${nf.supplier?.code || "0"}`,
    itens: nf.items.map((item, idx) => ({
      numero: idx + 1,
      produtoCodigo: String(item.material?.code || item.productCode || ""),
      descricao: item.productName || item.material?.description || "",
      quantidade: Number(item.quantity),
      unidade: item.unit || item.material?.unit || "UN",
      valorUnitario: Number(item.unitPrice),
      valorTotal: Number(item.totalPrice),
      valorDesconto: 0,
      cfop: String(item.cfop || "1102"),
      cstIcms: "00",
      baseCalculoIcms: 0,
      aliquotaIcms: Number(item.icmsRate || 0),
      valorIcms: Number(item.icmsValue || 0),
      cstIpi: "50",
      valorIpi: Number(item.ipiValue || 0),
      cstPis: "01",
      valorPis: 0,
      cstCofins: "01",
      valorCofins: 0,
    })),
  }));
}

async function getDocumentosSaida(companyId: string, params: SpedParams): Promise<DocumentoFiscal[]> {
  const notas = await prisma.issuedInvoice.findMany({
    where: { companyId, issueDate: { gte: params.dataInicial, lte: params.dataFinal }, status: "AUTHORIZED" },
    include: { customer: true, items: { include: { material: true } } },
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
    valorFrete: 0,
    valorProdutos: Number(nf.subtotal || nf.totalValue),
    baseCalculoIcms: Number(nf.icmsBase || 0),
    valorIcms: Number(nf.icmsValue || 0),
    valorIpi: Number(nf.ipiValue || 0),
    valorPis: Number(nf.pisValue || 0),
    valorCofins: Number(nf.cofinsValue || 0),
    participanteCodigo: `C${nf.customer?.code || "0"}`,
    itens: nf.items.map((item, idx) => ({
      numero: idx + 1,
      produtoCodigo: String(item.material?.code || item.materialId || ""),
      descricao: item.description || item.material?.description || "",
      quantidade: Number(item.quantity),
      unidade: item.unit || item.material?.unit || "UN",
      valorUnitario: Number(item.unitPrice),
      valorTotal: Number(item.totalPrice),
      valorDesconto: Number(item.discountPercent ? Number(item.totalPrice) * Number(item.discountPercent) / 100 : 0),
      cfop: item.cfop || "5102",
      cstIcms: "00",
      baseCalculoIcms: Number(item.icmsBase || 0),
      aliquotaIcms: Number(item.icmsRate || 0),
      valorIcms: Number(item.icmsValue || 0),
      cstIpi: "50",
      valorIpi: Number(item.ipiValue || 0),
      cstPis: "01",
      valorPis: 0,
      cstCofins: "01",
      valorCofins: 0,
    })),
  }));
}

async function getInventario(companyId: string): Promise<ItemInventario[]> {
  const estoques = await prisma.inventory.findMany({
    where: { companyId },
    include: { material: true },
  });

  return estoques
    .filter(e => Number(e.quantity) > 0)
    .map(e => ({
      produtoCodigo: String(e.material.code),
      unidade: e.material.unit,
      quantidade: Number(e.quantity),
      valorUnitario: Number(e.material.lastPurchasePrice || 0),
      valorTotal: Number(e.quantity) * Number(e.material.lastPurchasePrice || 0),
      indicadorPropriedade: "0" as const,
    }));
}

export async function gerarArquivoSped(params: SpedParams): Promise<SpedResult> {
  try {
    const config = await getSpedConfig(params.companyId, params);
    if (!config) {
      return { sucesso: false, erro: "Empresa não encontrada ou dados fiscais incompletos (CNPJ, IE, UF)" };
    }

    const [participantes, produtos, documentosEntrada, documentosSaida, inventario] = await Promise.all([
      getParticipantes(params.companyId, params),
      getProdutos(params.companyId, params),
      getDocumentosEntrada(params.companyId, params),
      getDocumentosSaida(params.companyId, params),
      params.incluirInventario ? getInventario(params.companyId) : Promise.resolve([] as ItemInventario[]),
    ]);

    const unidadesSet = new Set<string>();
    for (const p of produtos) unidadesSet.add(p.unidade);
    const unidades = Array.from(unidadesSet).map(u => ({
      codigo: u,
      descricao: u === "UN" ? "UNIDADE" : u === "KG" ? "QUILOGRAMA" : u === "M" ? "METRO" : u === "L" ? "LITRO" : u,
    }));

    const dados: DadosSped = {
      config,
      participantes,
      produtos,
      unidades,
      documentos: [...documentosEntrada, ...documentosSaida],
      inventario: params.incluirInventario && inventario.length > 0 ? {
        data: params.dataInventario || params.dataFinal,
        motivo: "01",
        itens: inventario,
      } : undefined,
    };

    const conteudo = gerarSpedFiscal(dados);
    const validacao = validarSped(conteudo);

    const mes = String(params.dataInicial.getMonth() + 1).padStart(2, "0");
    const ano = params.dataInicial.getFullYear();
    const nomeArquivo = `SPED_${config.empresa.cnpj}_${ano}${mes}.txt`;

    return { sucesso: true, conteudo, nomeArquivo, validacao };
  } catch (error) {
    return { sucesso: false, erro: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}

export async function listarPeriodosDisponiveis(companyId: string): Promise<{ mes: number; ano: number; temDados: boolean }[]> {
  const entradas = await prisma.receivedInvoice.findMany({
    where: { companyId },
    select: { issueDate: true },
    orderBy: { issueDate: "desc" },
    take: 100,
  });

  const saidas = await prisma.issuedInvoice.findMany({
    where: { companyId },
    select: { issueDate: true },
    orderBy: { issueDate: "desc" },
    take: 100,
  });

  const periodosSet = new Set<string>();
  for (const e of entradas) periodosSet.add(`${e.issueDate.getFullYear()}-${e.issueDate.getMonth() + 1}`);
  for (const s of saidas) periodosSet.add(`${s.issueDate.getFullYear()}-${s.issueDate.getMonth() + 1}`);

  return Array.from(periodosSet)
    .map(p => { const [ano, mes] = p.split("-").map(Number); return { mes, ano, temDados: true }; })
    .sort((a, b) => a.ano !== b.ano ? b.ano - a.ano : b.mes - a.mes);
}
