/**
 * Integração com API ViaCEP para consulta de endereços
 * https://viacep.com.br/
 */

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  unidade: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  regiao: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

export interface AddressData {
  zipCode: string;
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  ibgeCode: string;
  ddd: string;
}

export interface CepResult {
  success: boolean;
  data?: AddressData;
  error?: string;
}

/**
 * Formata CEP removendo caracteres não numéricos
 */
export function formatCep(cep: string): string {
  return cep.replace(/\D/g, "");
}

/**
 * Valida formato do CEP (8 dígitos)
 */
export function isValidCep(cep: string): boolean {
  const cleanCep = formatCep(cep);
  return /^\d{8}$/.test(cleanCep);
}

/**
 * Consulta endereço pelo CEP usando a API ViaCEP
 */
export async function fetchAddressByCep(cep: string): Promise<CepResult> {
  const cleanCep = formatCep(cep);

  if (!isValidCep(cleanCep)) {
    return {
      success: false,
      error: "CEP inválido. Deve conter 8 dígitos.",
    };
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Erro na consulta: ${response.status}`,
      };
    }

    const data = await response.json() as ViaCepResponse & { erro?: boolean };

    if (data.erro) {
      return {
        success: false,
        error: "CEP não encontrado.",
      };
    }

    return {
      success: true,
      data: {
        zipCode: data.cep,
        street: data.logradouro || "",
        complement: data.complemento || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
        ibgeCode: data.ibge || "",
        ddd: data.ddd || "",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao consultar CEP",
    };
  }
}

/**
 * Hook-friendly function para usar em componentes React
 * Retorna os dados formatados para preencher formulários
 */
export function mapAddressToForm(address: AddressData): Record<string, string> {
  return {
    zipCode: address.zipCode,
    address: address.street,
    neighborhood: address.neighborhood,
    city: address.city,
    state: address.state,
    ibgeCode: address.ibgeCode,
  };
}
