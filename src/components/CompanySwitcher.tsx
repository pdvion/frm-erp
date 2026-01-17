"use client";

import { useState, useEffect } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";

type Company = {
  id: string;
  code: number;
  name: string;
  isDefault: boolean;
};

export function CompanySwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const { data: tenantData, isLoading } = trpc.tenant.current.useQuery();
  const switchMutation = trpc.tenant.switchCompany.useMutation();

  const companies = tenantData?.companies ?? [];
  const currentCompany = companies.find((c) => c.id === (selectedCompanyId ?? tenantData?.companyId));

  useEffect(() => {
    // Carregar empresa salva no localStorage
    const savedCompanyId = localStorage.getItem("frm-active-company");
    if (savedCompanyId && !selectedCompanyId) {
      setSelectedCompanyId(savedCompanyId);
    } else if (tenantData?.companyId && !selectedCompanyId) {
      setSelectedCompanyId(tenantData.companyId);
    }
  }, [tenantData?.companyId, selectedCompanyId]);

  const handleSelectCompany = async (company: Company) => {
    try {
      await switchMutation.mutateAsync({ companyId: company.id });
      setSelectedCompanyId(company.id);
      localStorage.setItem("frm-active-company", company.id);
      setIsOpen(false);
      // Recarregar a página para atualizar os dados
      window.location.reload();
    } catch (error) {
      console.error("Erro ao trocar empresa:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg animate-pulse">
        <div className="w-5 h-5 bg-gray-300 rounded"></div>
        <div className="w-24 h-4 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (companies.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-w-[200px]"
      >
        <Building2 className="w-5 h-5 text-gray-500" />
        <span className="flex-1 text-left text-sm font-medium text-gray-700 truncate">
          {currentCompany?.name ?? "Selecione uma empresa"}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 max-h-64 overflow-auto">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleSelectCompany(company)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                  company.id === selectedCompanyId ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {company.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    Código: {company.code}
                    {company.isDefault && " • Padrão"}
                  </div>
                </div>
                {company.id === selectedCompanyId && (
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
