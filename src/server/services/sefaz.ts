/**
 * Serviço de integração com SEFAZ
 * 
 * Este serviço encapsula a lógica de comunicação com a SEFAZ,
 * incluindo emissão, cancelamento e carta de correção de NF-e.
 * 
 * @see VIO-566 - Emissão de NF-e
 */

import { prisma } from "@/lib/prisma";
import { 
  NFeEmitter, 
  NFeData, 
  SefazConfig,
  gerarChaveAcesso,
  gerarXmlNFe,
} from "@/lib/sefaz/nfe-emitter";

/**
 * Configuração do ambiente SEFAZ
 * Em produção, usar variáveis de ambiente
 */
const SEFAZ_AMBIENTE = (process.env.SEFAZ_AMBIENTE || "2") as "1" | "2"; // 2 = Homologação

/**
 * Interface para dados da empresa emitente
 */
interface DadosEmitente {
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
  };
  crt: "1" | "2" | "3";
}

/**
 * Obtém configuração SEFAZ para uma empresa
 * @param companyId - ID da empresa
 * @returns Configuração SEFAZ ou null se não configurada
 */
export async function getSefazConfig(companyId: string): Promise<SefazConfig | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      cnpj: true,
      stateRegistration: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
    },
  });

  if (!company || !company.state) {
    return null;
  }

  // TODO(VIO-566): Implementar armazenamento seguro de certificado digital
  // Por enquanto, retornar configuração simulada
  return {
    ambiente: SEFAZ_AMBIENTE,
    uf: company.state,
    certificado: {
      pfx: Buffer.from(""), // Certificado será carregado de storage seguro
      senha: "",
    },
    timeout: 30000,
  };
}

/**
 * Obtém dados do emitente a partir da empresa
 * @param companyId - ID da empresa
 */
export async function getDadosEmitente(companyId: string): Promise<DadosEmitente | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) return null;

  // Campos do schema Company: name, tradeName, cnpj, ie, address, city, state, zipCode
  return {
    cnpj: company.cnpj || "",
    ie: company.ie || "", // Inscrição Estadual
    razaoSocial: company.name,
    nomeFantasia: company.tradeName || undefined,
    endereco: {
      logradouro: company.address || "",
      numero: "S/N", // TODO: Adicionar campo addressNumber ao schema Company
      complemento: undefined,
      bairro: "", // TODO: Adicionar campo neighborhood ao schema Company
      codigoMunicipio: "", // TODO: Adicionar campo cityCode ao schema Company
      municipio: company.city || "",
      uf: company.state || "",
      cep: company.zipCode || "",
    },
    crt: "3", // Regime Normal por padrão - TODO: Adicionar campo taxRegime ao schema Company
  };
}

/**
 * Resultado da emissão de NF-e
 */
export interface EmissaoResult {
  sucesso: boolean;
  chaveAcesso?: string;
  protocolo?: string;
  xml?: string;
  erro?: string;
}

/**
 * Emite uma NF-e para a SEFAZ
 * @param invoiceId - ID da nota fiscal no sistema
 * @param companyId - ID da empresa emitente
 */
export async function emitirNFe(invoiceId: string, companyId: string): Promise<EmissaoResult> {
  try {
    // Buscar nota fiscal com todos os dados necessários
    const invoice = await prisma.issuedInvoice.findFirst({
      where: { id: invoiceId, companyId },
      include: {
        customer: true,
        items: {
          include: { material: true },
        },
      },
    });

    if (!invoice) {
      return { sucesso: false, erro: "Nota fiscal não encontrada" };
    }

    // Obter configuração SEFAZ
    const config = await getSefazConfig(companyId);
    if (!config) {
      return { sucesso: false, erro: "Empresa não configurada para emissão de NF-e" };
    }

    // Obter dados do emitente
    const emitente = await getDadosEmitente(companyId);
    if (!emitente) {
      return { sucesso: false, erro: "Dados do emitente não encontrados" };
    }

    // Montar dados da NF-e
    // Campos Customer: companyName, tradeName, cnpj, cpf, stateRegistration, 
    // addressStreet, addressNumber, addressComplement, addressNeighborhood, 
    // addressCity, addressState, addressZipCode
    const nfeData: NFeData = {
      naturezaOperacao: invoice.operationType || "VENDA",
      modelo: (invoice.model as "55" | "65") || "55",
      serie: invoice.series || "1",
      numero: invoice.code,
      dataEmissao: invoice.issueDate,
      dataSaida: invoice.issueDate,
      tipoOperacao: "1", // Saída
      destino: invoice.customer?.addressState === emitente.endereco.uf ? "1" : "2",
      tipoImpressao: "1", // DANFE normal
      finalidade: "1", // Normal
      consumidorFinal: invoice.customer?.type === "PERSON" ? "1" : "0",
      presencaComprador: "1", // Presencial
      emitente: {
        cnpj: emitente.cnpj,
        ie: emitente.ie,
        razaoSocial: emitente.razaoSocial,
        nomeFantasia: emitente.nomeFantasia,
        endereco: {
          ...emitente.endereco,
          pais: "Brasil",
          codigoPais: "1058",
        },
        crt: emitente.crt,
      },
      destinatario: {
        cpfCnpj: invoice.customer?.cnpj || invoice.customer?.cpf || "",
        razaoSocial: invoice.customer?.companyName || "",
        ie: invoice.customer?.stateRegistration || undefined,
        email: invoice.customer?.email || undefined,
        endereco: {
          logradouro: invoice.customer?.addressStreet || "",
          numero: invoice.customer?.addressNumber || "S/N",
          complemento: invoice.customer?.addressComplement || undefined,
          bairro: invoice.customer?.addressNeighborhood || "",
          codigoMunicipio: "", // TODO: Adicionar campo cityCode ao Customer
          municipio: invoice.customer?.addressCity || "",
          uf: invoice.customer?.addressState || "",
          cep: invoice.customer?.addressZipCode || "",
        },
        indIEDest: invoice.customer?.stateRegistration ? "1" : "9",
      },
      itens: invoice.items.map((item, index) => ({
        numero: index + 1,
        codigo: item.material?.code || item.materialId,
        descricao: item.description || item.material?.description || "",
        ncm: item.material?.ncm || "00000000",
        cfop: item.cfop || "5102",
        unidade: item.unit || item.material?.unit || "UN",
        quantidade: Number(item.quantity),
        valorUnitario: Number(item.unitPrice),
        valorTotal: Number(item.totalPrice),
        icms: {
          origem: "0",
          cst: "00",
          baseCalculo: Number(item.totalPrice),
          aliquota: 18,
          valor: Number(item.totalPrice) * 0.18,
        },
        pis: { cst: "01", baseCalculo: Number(item.totalPrice), aliquota: 1.65, valor: Number(item.totalPrice) * 0.0165 },
        cofins: { cst: "01", baseCalculo: Number(item.totalPrice), aliquota: 7.6, valor: Number(item.totalPrice) * 0.076 },
      })),
      totais: {
        baseCalculoIcms: Number(invoice.subtotal),
        valorIcms: Number(invoice.subtotal) * 0.18,
        valorProdutos: Number(invoice.subtotal),
        valorNota: Number(invoice.totalValue),
      },
      pagamento: {
        indicador: "0",
        formas: [{ tipo: "01", valor: Number(invoice.totalValue) }],
      },
    };

    // Criar instância do emitter e emitir
    const emitter = new NFeEmitter(config);
    const resultado = await emitter.emitir(nfeData);

    if (resultado.sucesso) {
      return {
        sucesso: true,
        chaveAcesso: resultado.chaveAcesso,
        protocolo: resultado.protocolo,
        xml: resultado.xml,
      };
    } else {
      return {
        sucesso: false,
        erro: resultado.erro?.mensagem || "Erro desconhecido na emissão",
      };
    }
  } catch (error) {
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Erro interno na emissão",
    };
  }
}

/**
 * Cancela uma NF-e autorizada
 * @param invoiceId - ID da nota fiscal
 * @param companyId - ID da empresa
 * @param justificativa - Motivo do cancelamento (mín. 15 caracteres)
 */
export async function cancelarNFe(
  invoiceId: string,
  companyId: string,
  justificativa: string
): Promise<EmissaoResult> {
  try {
    const invoice = await prisma.issuedInvoice.findFirst({
      where: { id: invoiceId, companyId },
    });

    if (!invoice || !invoice.accessKey) {
      return { sucesso: false, erro: "Nota fiscal não encontrada ou não autorizada" };
    }

    const config = await getSefazConfig(companyId);
    if (!config) {
      return { sucesso: false, erro: "Empresa não configurada para operações SEFAZ" };
    }

    const emitter = new NFeEmitter(config);
    const resultado = await emitter.cancelar(invoice.accessKey, justificativa);

    if (resultado.sucesso) {
      return {
        sucesso: true,
        protocolo: resultado.protocolo,
      };
    } else {
      return {
        sucesso: false,
        erro: resultado.erro?.mensagem || "Erro no cancelamento",
      };
    }
  } catch (error) {
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Erro interno no cancelamento",
    };
  }
}

/**
 * Emite carta de correção para uma NF-e
 * @param invoiceId - ID da nota fiscal
 * @param companyId - ID da empresa
 * @param correcao - Texto da correção (mín. 15 caracteres)
 * @param sequencia - Número sequencial da correção (1-20)
 */
export async function emitirCartaCorrecao(
  invoiceId: string,
  companyId: string,
  correcao: string,
  sequencia: number
): Promise<EmissaoResult> {
  try {
    const invoice = await prisma.issuedInvoice.findFirst({
      where: { id: invoiceId, companyId },
    });

    if (!invoice || !invoice.accessKey) {
      return { sucesso: false, erro: "Nota fiscal não encontrada ou não autorizada" };
    }

    const config = await getSefazConfig(companyId);
    if (!config) {
      return { sucesso: false, erro: "Empresa não configurada para operações SEFAZ" };
    }

    const emitter = new NFeEmitter(config);
    const resultado = await emitter.cartaCorrecao(invoice.accessKey, correcao, sequencia);

    if (resultado.sucesso) {
      return {
        sucesso: true,
        protocolo: resultado.protocolo,
      };
    } else {
      return {
        sucesso: false,
        erro: resultado.erro?.mensagem || "Erro na carta de correção",
      };
    }
  } catch (error) {
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Erro interno na carta de correção",
    };
  }
}

// Exportar funções auxiliares para uso em outros módulos
export { gerarChaveAcesso, gerarXmlNFe };
