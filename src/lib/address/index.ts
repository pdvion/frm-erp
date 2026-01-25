/**
 * Módulo de consulta de endereços e dados de empresas
 * 
 * Funcionalidades:
 * - Consulta de CEP via ViaCEP
 * - Consulta de CNPJ via BrasilAPI
 * - Validação de formatos
 * - Mapeamento para formulários
 */

export {
  fetchAddressByCep,
  formatCep,
  isValidCep,
  mapAddressToForm,
  type AddressData,
  type CepResult,
  type ViaCepResponse,
} from "./viacep";

export {
  fetchCompanyByCnpj,
  formatCnpj,
  formatCnpjDisplay,
  isValidCnpj,
  isValidCnpjFormat,
  mapCnpjToCompanyForm,
  mapCnpjToSupplierForm,
  type CnpjData,
  type CnpjResult,
} from "./cnpj";
