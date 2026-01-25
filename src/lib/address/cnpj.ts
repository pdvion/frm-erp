/**
 * Integração com APIs para consulta de CNPJ
 * Usa ReceitaWS (gratuito, 3 consultas/minuto) ou BrasilAPI
 */

export interface CnpjData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacao: string;
  dataAbertura: string;
  naturezaJuridica: string;
  atividadePrincipal: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
  capitalSocial: number;
}

export interface CnpjResult {
  success: boolean;
  data?: CnpjData;
  error?: string;
}

/**
 * Formata CNPJ removendo caracteres não numéricos
 */
export function formatCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

/**
 * Valida formato do CNPJ (14 dígitos)
 */
export function isValidCnpjFormat(cnpj: string): boolean {
  const cleanCnpj = formatCnpj(cnpj);
  return /^\d{14}$/.test(cleanCnpj);
}

/**
 * Valida CNPJ com dígitos verificadores
 */
export function isValidCnpj(cnpj: string): boolean {
  const cleanCnpj = formatCnpj(cnpj);
  
  if (!isValidCnpjFormat(cleanCnpj)) return false;
  
  // Rejeita CNPJs com todos os dígitos iguais
  if (/^(\d)\1+$/.test(cleanCnpj)) return false;

  // Validação dos dígitos verificadores
  const calcDigit = (cnpjPart: string, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += parseInt(cnpjPart[i]) * weights[i];
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const digit1 = calcDigit(cleanCnpj.slice(0, 12), weights1);
  const digit2 = calcDigit(cleanCnpj.slice(0, 12) + digit1, weights2);

  return cleanCnpj.slice(12) === `${digit1}${digit2}`;
}

/**
 * Formata CNPJ para exibição (XX.XXX.XXX/XXXX-XX)
 */
export function formatCnpjDisplay(cnpj: string): string {
  const clean = formatCnpj(cnpj);
  if (clean.length !== 14) return cnpj;
  return clean.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

/**
 * Timeout padrão para requisições (10 segundos)
 */
const DEFAULT_TIMEOUT = 10000;

/**
 * Consulta dados da empresa pelo CNPJ usando BrasilAPI
 * https://brasilapi.com.br/docs#tag/CNPJ
 */
export async function fetchCompanyByCnpj(cnpj: string): Promise<CnpjResult> {
  const cleanCnpj = formatCnpj(cnpj);

  if (!isValidCnpjFormat(cleanCnpj)) {
    return {
      success: false,
      error: "CNPJ inválido. Deve conter 14 dígitos.",
    };
  }

  if (!isValidCnpj(cleanCnpj)) {
    return {
      success: false,
      error: "CNPJ inválido. Dígitos verificadores incorretos.",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    // Tenta BrasilAPI primeiro (mais rápido e sem limite)
    const response = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: "CNPJ não encontrado na base da Receita Federal.",
        };
      }
      return {
        success: false,
        error: `Erro na consulta: ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        cnpj: formatCnpjDisplay(cleanCnpj),
        razaoSocial: data.razao_social || "",
        nomeFantasia: data.nome_fantasia || data.razao_social || "",
        situacao: data.descricao_situacao_cadastral || "",
        dataAbertura: data.data_inicio_atividade || "",
        naturezaJuridica: data.natureza_juridica || "",
        atividadePrincipal: data.cnae_fiscal_descricao || "",
        logradouro: data.logradouro || "",
        numero: data.numero || "",
        complemento: data.complemento || "",
        bairro: data.bairro || "",
        municipio: data.municipio || "",
        uf: data.uf || "",
        cep: data.cep || "",
        telefone: data.ddd_telefone_1 || "",
        email: data.email || "",
        capitalSocial: data.capital_social || 0,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        error: "Tempo limite excedido ao consultar CNPJ.",
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao consultar CNPJ",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Mapeia dados do CNPJ para campos de formulário de Fornecedor/Cliente
 */
export function mapCnpjToSupplierForm(data: CnpjData): Record<string, string | number> {
  return {
    cnpj: data.cnpj,
    companyName: data.razaoSocial,
    tradeName: data.nomeFantasia,
    address: `${data.logradouro}${data.numero ? `, ${data.numero}` : ""}`,
    complement: data.complemento,
    neighborhood: data.bairro,
    city: data.municipio,
    state: data.uf,
    zipCode: data.cep,
    phone: data.telefone,
    email: data.email,
  };
}

/**
 * Mapeia dados do CNPJ para campos de formulário de Empresa
 */
export function mapCnpjToCompanyForm(data: CnpjData): Record<string, string | number> {
  return {
    cnpj: data.cnpj,
    name: data.razaoSocial,
    tradeName: data.nomeFantasia,
    address: `${data.logradouro}${data.numero ? `, ${data.numero}` : ""}`,
    city: data.municipio,
    state: data.uf,
    zipCode: data.cep,
    phone: data.telefone,
    email: data.email,
  };
}
