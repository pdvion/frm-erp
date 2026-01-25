"use client";

import { useState, useCallback } from "react";
import {
  fetchAddressByCep,
  fetchCompanyByCnpj,
  isValidCep,
  isValidCnpj,
  mapAddressToForm,
  mapCnpjToSupplierForm,
  type AddressData,
  type CnpjData,
} from "@/lib/address";

interface UseAddressLookupReturn {
  // CEP
  lookupCep: (cep: string) => Promise<AddressData | null>;
  isLoadingCep: boolean;
  cepError: string | null;
  
  // CNPJ
  lookupCnpj: (cnpj: string) => Promise<CnpjData | null>;
  isLoadingCnpj: boolean;
  cnpjError: string | null;
  
  // Utils
  clearErrors: () => void;
}

/**
 * Hook para consulta de CEP e CNPJ com auto-preenchimento de formulários
 * 
 * @example
 * ```tsx
 * const { lookupCep, lookupCnpj, isLoadingCep, isLoadingCnpj } = useAddressLookup();
 * 
 * const handleCepBlur = async (cep: string) => {
 *   const address = await lookupCep(cep);
 *   if (address) {
 *     setFormData(prev => ({ ...prev, ...mapAddressToForm(address) }));
 *   }
 * };
 * ```
 */
export function useAddressLookup(): UseAddressLookupReturn {
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);

  const lookupCep = useCallback(async (cep: string): Promise<AddressData | null> => {
    if (!cep || !isValidCep(cep)) {
      return null;
    }

    setIsLoadingCep(true);
    setCepError(null);

    try {
      const result = await fetchAddressByCep(cep);
      
      if (result.success && result.data) {
        return result.data;
      } else {
        setCepError(result.error || "Erro ao consultar CEP");
        return null;
      }
    } catch {
      setCepError("Erro de conexão ao consultar CEP");
      return null;
    } finally {
      setIsLoadingCep(false);
    }
  }, []);

  const lookupCnpj = useCallback(async (cnpj: string): Promise<CnpjData | null> => {
    if (!cnpj || !isValidCnpj(cnpj)) {
      return null;
    }

    setIsLoadingCnpj(true);
    setCnpjError(null);

    try {
      const result = await fetchCompanyByCnpj(cnpj);
      
      if (result.success && result.data) {
        return result.data;
      } else {
        setCnpjError(result.error || "Erro ao consultar CNPJ");
        return null;
      }
    } catch {
      setCnpjError("Erro de conexão ao consultar CNPJ");
      return null;
    } finally {
      setIsLoadingCnpj(false);
    }
  }, []);

  const clearErrors = useCallback(() => {
    setCepError(null);
    setCnpjError(null);
  }, []);

  return {
    lookupCep,
    isLoadingCep,
    cepError,
    lookupCnpj,
    isLoadingCnpj,
    cnpjError,
    clearErrors,
  };
}

// Re-export utilities for convenience
export { mapAddressToForm, mapCnpjToSupplierForm };
