"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import type { BreadcrumbItem } from "@/components/ui/Breadcrumbs";

/**
 * Mapeamento de rotas para labels amigáveis
 */
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  materials: "Materiais",
  suppliers: "Fornecedores",
  customers: "Clientes",
  invoices: "Notas Fiscais",
  inventory: "Estoque",
  production: "Produção",
  hr: "RH",
  employees: "Funcionários",
  finance: "Financeiro",
  fiscal: "Fiscal",
  sales: "Vendas",
  treasury: "Tesouraria",
  reports: "Relatórios",
  settings: "Configurações",
  receiving: "Recebimento",
  requisitions: "Requisições",
  billing: "Faturamento",
  engineering: "Engenharia",
  bom: "Estrutura de Produto",
  docs: "Documentação",
  tasks: "Tarefas",
  workflow: "Workflow",
  impex: "Comércio Exterior",
  budget: "Orçamento",
  gpd: "GPD",
  goals: "Metas",
  oee: "OEE",
  bi: "BI",
  audit: "Auditoria",
  documents: "Documentos",
  categories: "Categorias",
  quotes: "Cotações",
  payables: "Contas a Pagar",
  receivables: "Contas a Receber",
  accounts: "Contas",
  quality: "Qualidade",
  new: "Novo",
  edit: "Editar",
  import: "Importar",
  export: "Exportar",
  nfe: "NFe",
  sped: "SPED",
  companies: "Empresas",
  users: "Usuários",
};

/**
 * Rotas que devem ser ignoradas no breadcrumb
 */
const ignoredSegments = ["app", "api", "[id]", "[slug]"];

/**
 * Hook para gerar breadcrumbs automaticamente baseado na rota atual
 */
export function useRouteBreadcrumbs(
  customLabels?: Record<string, string>
): BreadcrumbItem[] {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    if (!pathname || pathname === "/") {
      return [];
    }

    const segments = pathname.split("/").filter(Boolean);
    const items: BreadcrumbItem[] = [];
    let currentPath = "";

    // Sempre adiciona Dashboard como primeiro item
    items.push({
      label: "Dashboard",
      href: "/dashboard",
    });

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;

      // Ignora segmentos específicos
      if (ignoredSegments.includes(segment)) {
        continue;
      }

      // Verifica se é um ID dinâmico (UUID ou número)
      const isId = /^[0-9a-f-]{36}$|^\d+$/.test(segment);
      
      if (isId) {
        // Para IDs, usa "Detalhes" como label
        items.push({
          label: "Detalhes",
          href: currentPath,
        });
        continue;
      }

      // Busca label customizado ou do mapeamento
      const label = customLabels?.[segment] || routeLabels[segment] || formatSegment(segment);

      items.push({
        label,
        href: currentPath,
      });
    }

    // Remove href do último item (página atual)
    if (items.length > 0) {
      const lastItem = items[items.length - 1];
      items[items.length - 1] = { label: lastItem.label };
    }

    return items;
  }, [pathname, customLabels]);

  return breadcrumbs;
}

/**
 * Formata um segmento de URL para exibição
 */
function formatSegment(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default useRouteBreadcrumbs;
