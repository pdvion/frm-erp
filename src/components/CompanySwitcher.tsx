"use client";

import { useState, useEffect } from "react";
import { Building2, ChevronDown, Check, Globe } from "lucide-react";
import { trpc } from "@/lib/trpc";

const ALL_COMPANIES_ID = "all";

export function CompanySwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const { data: tenantData, isLoading } = trpc.tenant.current.useQuery();
  const switchMutation = trpc.tenant.switchCompany.useMutation();

  const companies = tenantData?.companies ?? [];
  const hasMultipleCompanies = companies.length > 1;
  const isAllSelected = selectedCompanyId === ALL_COMPANIES_ID;
  const currentCompany = isAllSelected 
    ? null 
    : companies.find((c) => c.id === (selectedCompanyId ?? tenantData?.companyId));

  useEffect(() => {
    // Carregar empresa salva no localStorage
    const savedCompanyId = localStorage.getItem("frm-active-company");
    if (savedCompanyId && !selectedCompanyId) {
      setSelectedCompanyId(savedCompanyId);
    } else if (tenantData?.companyId && !selectedCompanyId) {
      setSelectedCompanyId(tenantData.companyId);
    }
  }, [tenantData?.companyId, selectedCompanyId]);

  const handleSelectCompany = async (companyId: string) => {
    try {
      if (companyId === ALL_COMPANIES_ID) {
        // Selecionar "Todas" - usar a primeira empresa como base mas marcar como "all"
        setSelectedCompanyId(ALL_COMPANIES_ID);
        localStorage.setItem("frm-active-company", ALL_COMPANIES_ID);
        setIsOpen(false);
        window.location.reload();
      } else {
        await switchMutation.mutateAsync({ companyId });
        setSelectedCompanyId(companyId);
        localStorage.setItem("frm-active-company", companyId);
        setIsOpen(false);
        window.location.reload();
      }
    } catch (error) {
      console.error("Erro ao trocar empresa:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-theme-tertiary rounded-lg animate-pulse">
        <div className="w-5 h-5 bg-theme-tertiary rounded"></div>
        <div className="w-24 h-4 bg-theme-tertiary rounded"></div>
      </div>
    );
  }

  if (companies.length === 0) {
    return null;
  }

  return (
    <div className="relative min-w-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 md:px-3 py-2 bg-theme-card border border-theme rounded-lg hover:bg-theme-secondary transition-colors w-full md:min-w-[200px] max-w-[200px] md:max-w-none"
      >
        {isAllSelected ? (
          <Globe className="w-5 h-5 text-blue-500 flex-shrink-0" />
        ) : (
          <Building2 className="w-5 h-5 text-theme-muted flex-shrink-0" />
        )}
        <span className="flex-1 text-left text-sm font-medium text-theme-secondary truncate hidden sm:block">
          {isAllSelected ? "Todas as Empresas" : (currentCompany?.name ?? "Selecione")}
        </span>
        <ChevronDown className={`w-4 h-4 text-theme-muted transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-1 bg-theme-card border border-theme rounded-lg shadow-lg z-20 py-1 max-h-64 overflow-auto min-w-[250px]">
            {/* Opção "Todas as Empresas" - apenas se tiver múltiplas empresas */}
            {hasMultipleCompanies && (
              <button
                onClick={() => handleSelectCompany(ALL_COMPANIES_ID)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-theme-secondary transition-colors border-b border-theme ${
                  isAllSelected ? "bg-blue-50" : ""
                }`}
              >
                <Globe className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-theme">
                    Todas as Empresas
                  </div>
                  <div className="text-xs text-theme-muted">
                    Visualizar dados de todas
                  </div>
                </div>
                {isAllSelected && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            )}
            
            {/* Lista de empresas */}
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleSelectCompany(company.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-theme-secondary transition-colors ${
                  company.id === selectedCompanyId && !isAllSelected ? "bg-blue-50" : ""
                }`}
              >
                <Building2 className="w-5 h-5 text-theme-muted flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-theme">
                    {company.name}
                  </div>
                  <div className="text-xs text-theme-muted">
                    Código: {company.code}
                    {company.isDefault && " • Padrão"}
                  </div>
                </div>
                {company.id === selectedCompanyId && !isAllSelected && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
