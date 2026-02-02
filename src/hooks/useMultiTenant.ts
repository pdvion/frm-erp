"use client";

import { useEffect, useState } from "react";

const ALL_COMPANIES_ID = "all";

/**
 * Hook para verificar o estado multi-tenant atual
 * Retorna se "Todas as Empresas" está selecionado
 */
export function useMultiTenant() {
  const [isAllCompanies, setIsAllCompanies] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const savedCompanyId = localStorage.getItem("frm-active-company");
    setSelectedCompanyId(savedCompanyId);
    setIsAllCompanies(savedCompanyId === ALL_COMPANIES_ID);
  }, []);

  return {
    isAllCompanies,
    selectedCompanyId,
    showCompanyColumn: isAllCompanies,
  };
}
