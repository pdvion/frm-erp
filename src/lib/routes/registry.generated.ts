/**
 * ARQUIVO GERADO AUTOMATICAMENTE
 * NÃO EDITE MANUALMENTE
 *
 * Gerado por: pnpm routes:generate
 * Data: 2026-02-14T16:18:34.598Z
 *
 * Para modificar o menu, edite os arquivos _menu.json nas pastas de src/app/
 */

import {
  BarChart3,
  Bell,
  CheckSquare,
  DollarSign,
  Factory,
  FileText,
  FolderOpen,
  GitBranch,
  Globe,
  Home,
  Receipt,
  Settings,
  Shield,
  ShoppingCart,
  TrendingUp,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import React from "react";
import type { ModuleDefinition, MenuItem, RouteDefinition } from "./types";

export const modules: ModuleDefinition[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    order: 0,
    routes: [
      { path: "/dashboard", label: "Dashboard", showInMenu: true, enabled: true }
    ],
  },
  {
    id: "compras",
    label: "Compras",
    icon: ShoppingCart,
    order: 1,
    routes: [
      { path: "/materials", label: "Materiais", showInMenu: true, enabled: true, tags: ["cadastro","compras"],
        children: [
          { path: "/materials/new", label: "New", showInMenu: true, enabled: true }
        ] },
      { path: "/suppliers", label: "Fornecedores", showInMenu: true, enabled: true, tags: ["cadastro","compras"],
        children: [
          { path: "/suppliers/new", label: "New", showInMenu: true, enabled: true }
        ] },
      { path: "/quotes", label: "Cotações", showInMenu: true, enabled: true,
        children: [
          { path: "/quotes/compare", label: "Compare", showInMenu: true, enabled: true },
          { path: "/quotes/new", label: "New", showInMenu: true, enabled: true }
        ] },
      { path: "/purchase-orders", label: "Ordens de Compra", showInMenu: true, enabled: true,
        children: [
          { path: "/purchase-orders/dashboard", label: "Dashboard", showInMenu: true, enabled: true },
          { path: "/purchase-orders/new", label: "New", showInMenu: true, enabled: true }
        ] },
      { path: "/receiving", label: "Recebimento", showInMenu: true, enabled: true,
        children: [
          { path: "/receiving/new", label: "New", showInMenu: true, enabled: true }
        ] },
      { path: "/requisitions", label: "Requisições", showInMenu: true, enabled: true,
        children: [
          { path: "/requisitions/consumption", label: "Consumption", showInMenu: true, enabled: true },
          { path: "/requisitions/new", label: "New", showInMenu: true, enabled: true }
        ] },
      { path: "/supplier-returns", label: "Devoluções", showInMenu: true, enabled: true,
        children: [
          { path: "/supplier-returns/new", label: "New", showInMenu: true, enabled: true }
        ] }
    ],
  },
  {
    id: "impex",
    label: "ImpEx",
    icon: Globe,
    order: 2,
    routes: [
      { path: "/impex/brokers", label: "Brokers", showInMenu: true, enabled: true },
      { path: "/impex/cargo-types", label: "Cargo Types", showInMenu: true, enabled: true },
      { path: "/impex/dashboard", label: "Dashboard", showInMenu: true, enabled: true },
      { path: "/impex/exchange", label: "Exchange", showInMenu: true, enabled: true,
        children: [
          { path: "/impex/exchange/new", label: "New", showInMenu: true, enabled: true }
        ] },
      { path: "/impex/incoterms", label: "Incoterms", showInMenu: true, enabled: true },
      { path: "/impex/ports", label: "Ports", showInMenu: true, enabled: true },
      { path: "/impex/processes", label: "Processes", showInMenu: true, enabled: true,
        children: [
          { path: "/impex/processes/new", label: "New", showInMenu: true, enabled: true }
        ] },
      { path: "/impex/reports", label: "Reports", showInMenu: true, enabled: true }
    ],
  },
  {
    id: "estoque",
    label: "Estoque",
    icon: Warehouse,
    order: 3,
    routes: [
      { path: "/locations", label: "Localizações", showInMenu: true, enabled: true,
        children: [
          { path: "/locations/new", label: "New", showInMenu: true, enabled: true }
        ] },
      { path: "/inventory", label: "Inventário", showInMenu: true, enabled: true,
        children: [
          { path: "/inventory/dashboard", label: "Dashboard", showInMenu: true, enabled: true },
          { path: "/inventory/entry", label: "Entry", showInMenu: true, enabled: true },
          { path: "/inventory/exit", label: "Exit", showInMenu: true, enabled: true },
          { path: "/inventory/movements", label: "Movements", showInMenu: true, enabled: true },
          { path: "/inventory/reservations", label: "Reservations", showInMenu: true, enabled: true }
        ] },
      { path: "/transfers", label: "Transferências", showInMenu: true, enabled: true,
        children: [
          { path: "/transfers/new", label: "New", showInMenu: true, enabled: true }
        ] },
      { path: "/picking", label: "Picking List", showInMenu: true, enabled: true,
        children: [
          { path: "/picking/list", label: "List", showInMenu: true, enabled: true },
          { path: "/picking/new", label: "New", showInMenu: true, enabled: true }
        ] },
      { path: "/inventory-count", label: "Contagem", showInMenu: true, enabled: true }
    ],
  },
  {
    id: "vendas",
    label: "Vendas",
    icon: Receipt,
    order: 4,
    routes: [
      { path: "/sales", label: "Pedidos", showInMenu: true, enabled: true,
        children: [
          { path: "/sales/dashboard", label: "Dashboard", showInMenu: true, enabled: true },
          { path: "/sales/invoices", label: "Invoices", showInMenu: true, enabled: true },
          { path: "/sales/leads", label: "Leads", showInMenu: true, enabled: true,
            children: [
              { path: "/sales/leads/new", label: "New", showInMenu: true, enabled: true }
            ] },
          { path: "/sales/new", label: "New", showInMenu: true, enabled: true },
          { path: "/sales/orders", label: "Orders", showInMenu: true, enabled: true },
          { path: "/sales/quotes", label: "Quotes", showInMenu: true, enabled: true,
            children: [
              { path: "/sales/quotes/new", label: "New", showInMenu: true, enabled: true }
            ] }
        ] },
      { path: "/billing", label: "Faturamento", showInMenu: true, enabled: true,
        children: [
          { path: "/billing/new", label: "New", showInMenu: true, enabled: true }
        ] },
      { path: "/customers", label: "Clientes", showInMenu: true, enabled: true,
        children: [
          { path: "/customers/new", label: "New", showInMenu: true, enabled: true }
        ] },
      { path: "/catalog", label: "Catálogo", showInMenu: true, enabled: true,
        children: [
          { path: "/catalog/categories", label: "Categories", showInMenu: true, enabled: true },
          { path: "/catalog/new", label: "New", showInMenu: true, enabled: true },
          { path: "/catalog/sync", label: "Sync", showInMenu: true, enabled: true }
        ] }
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: DollarSign,
    order: 5,
    routes: [
      { path: "/finance", label: "Financeiro", showInMenu: true, enabled: true,
        children: [
          { path: "/finance/dashboard", label: "Dashboard", showInMenu: true, enabled: true }
        ] },
      { path: "/payables", label: "Contas a Pagar", showInMenu: true, enabled: true,
        children: [
          { path: "/payables/batch-payment", label: "Batch Payment", showInMenu: true, enabled: true },
          { path: "/payables/boletos", label: "Boletos", showInMenu: true, enabled: true,
            children: [
              { path: "/payables/boletos/new", label: "New", showInMenu: true, enabled: true }
            ] },
          { path: "/payables/cashflow", label: "Cashflow", showInMenu: true, enabled: true },
          { path: "/payables/cnab", label: "Cnab", showInMenu: true, enabled: true },
          { path: "/payables/new", label: "New", showInMenu: true, enabled: true },
          { path: "/payables/pix", label: "Pix", showInMenu: true, enabled: true,
            children: [
              { path: "/payables/pix/new", label: "New", showInMenu: true, enabled: true },
              { path: "/payables/pix/schedules", label: "Schedules", showInMenu: true, enabled: true }
            ] }
        ] },
      { path: "/receivables", label: "Contas a Receber", showInMenu: true, enabled: true,
        children: [
          { path: "/receivables/new", label: "New", showInMenu: true, enabled: true }
        ] },
      { path: "/treasury", label: "Tesouraria", showInMenu: true, enabled: true,
        children: [
          { path: "/treasury/accounts", label: "Accounts", showInMenu: true, enabled: true,
            children: [
              { path: "/treasury/accounts/new", label: "New", showInMenu: true, enabled: true }
            ] },
          { path: "/treasury/approvals", label: "Approvals", showInMenu: true, enabled: true,
            children: [
              { path: "/treasury/approvals/history", label: "History", showInMenu: true, enabled: true },
              { path: "/treasury/approvals/levels", label: "Levels", showInMenu: true, enabled: true },
              { path: "/treasury/approvals/my-pending", label: "My Pending", showInMenu: true, enabled: true },
              { path: "/treasury/approvals/requests", label: "Requests", showInMenu: true, enabled: true }
            ] },
          { path: "/treasury/dda", label: "Dda", showInMenu: true, enabled: true },
          { path: "/treasury/import-ofx", label: "Import Ofx", showInMenu: true, enabled: true },
          { path: "/treasury/reconciliation", label: "Reconciliation", showInMenu: true, enabled: true }
        ] }
    ],
  },
  {
    id: "fiscal",
    label: "Fiscal",
    icon: FileText,
    order: 6,
    routes: [
      { path: "/invoices", label: "Notas Fiscais", showInMenu: true, enabled: true,
        children: [
          { path: "/invoices/import", label: "Import", showInMenu: true, enabled: true },
          { path: "/invoices/manifestacoes", label: "Manifestacoes", showInMenu: true, enabled: true },
          { path: "/invoices/pending", label: "Pending", showInMenu: true, enabled: true }
        ] },
      { path: "/fiscal", label: "Fiscal", showInMenu: true, enabled: true,
        children: [
          { path: "/fiscal/deploy-agent", label: "Deploy Agent", showInMenu: true, enabled: true, description: "Agente de implantação com IA",
            children: [
              { path: "/fiscal/deploy-agent/analysis", label: "Análise Fiscal", showInMenu: true, enabled: true },
              { path: "/fiscal/deploy-agent/wizard", label: "Wizard Config", showInMenu: true, enabled: true }
            ] },
          { path: "/fiscal/dashboard", label: "Dashboard", showInMenu: true, enabled: true },
          { path: "/fiscal/nfe", label: "Nfe", showInMenu: true, enabled: true,
            children: [
              { path: "/fiscal/nfe/import", label: "Import", showInMenu: true, enabled: true }
            ] },
          { path: "/fiscal/sped", label: "Sped", showInMenu: true, enabled: true }
        ] }
    ],
  },
  {
    id: "producao",
    label: "Produção",
    icon: Factory,
    order: 7,
    routes: [
      { path: "/production", label: "Produção", showInMenu: true, enabled: true,
        children: [
          { path: "/production/costs", label: "Costs", showInMenu: true, enabled: true },
          { path: "/production/dashboard", label: "Dashboard", showInMenu: true, enabled: true },
          { path: "/production/mes", label: "Mes", showInMenu: true, enabled: true },
          { path: "/production/mrp", label: "Mrp", showInMenu: true, enabled: true },
          { path: "/production/new", label: "New", showInMenu: true, enabled: true },
          { path: "/production/oee", label: "Oee", showInMenu: true, enabled: true },
          { path: "/production/quality", label: "Quality", showInMenu: true, enabled: true,
            children: [
              { path: "/production/quality/new", label: "New", showInMenu: true, enabled: true }
            ] },
          { path: "/production/work-centers", label: "Work Centers", showInMenu: true, enabled: true }
        ] },
      { path: "/engineering", label: "Engineering", showInMenu: true, enabled: true,
        children: [
          { path: "/engineering/bom", label: "Bom", showInMenu: true, enabled: true }
        ] },
      { path: "/mrp", label: "Mrp", showInMenu: true, enabled: true },
      { path: "/oee", label: "Oee", showInMenu: true, enabled: true,
        children: [
          { path: "/oee/production-logs", label: "Production Logs", showInMenu: true, enabled: true },
          { path: "/oee/stops", label: "Stops", showInMenu: true, enabled: true },
          { path: "/oee/work-centers", label: "Work Centers", showInMenu: true, enabled: true }
        ] }
    ],
  },
  {
    id: "rh",
    label: "RH",
    icon: Users,
    order: 8,
    routes: [
      { path: "/hr/employees", label: "Funcionários", showInMenu: true, enabled: true,
        children: [
          { path: "/hr/employees/new", label: "New", showInMenu: true, enabled: true }
        ] },
      { path: "/hr/payroll", label: "Folha de Pagamento", showInMenu: true, enabled: true,
        children: [
          { path: "/hr/payroll/calculate", label: "Calculate", showInMenu: true, enabled: true }
        ] },
      { path: "/hr/benefits", label: "Benefícios", showInMenu: true, enabled: true },
      { path: "/hr/timeclock", label: "Ponto", showInMenu: true, enabled: true,
        children: [
          { path: "/hr/timeclock/adjustments", label: "Adjustments", showInMenu: true, enabled: true },
          { path: "/hr/timeclock/holidays", label: "Holidays", showInMenu: true, enabled: true },
          { path: "/hr/timeclock/hours-bank", label: "Hours Bank", showInMenu: true, enabled: true },
          { path: "/hr/timeclock/schedules", label: "Schedules", showInMenu: true, enabled: true }
        ] },
      { path: "/hr/admission", label: "Admissão", showInMenu: true, enabled: true,
        children: [
          { path: "/hr/admission/new", label: "New", showInMenu: true, enabled: true }
        ] },
      { path: "/hr/esocial", label: "eSocial", showInMenu: true, enabled: true },
      { path: "/hr/departments", label: "Departamentos", showInMenu: true, enabled: true },
      { path: "/hr/terminations", label: "Rescisões", showInMenu: true, enabled: true,
        children: [
          { path: "/hr/terminations/new", label: "New", showInMenu: true, enabled: true }
        ] },
      { path: "/hr/thirteenth", label: "13º Salário", showInMenu: true, enabled: true },
      { path: "/hr/vacations", label: "Férias", showInMenu: true, enabled: true,
        children: [
          { path: "/hr/vacations/new", label: "New", showInMenu: true, enabled: true }
        ] },
      { path: "/hr/timesheet", label: "Timesheet", showInMenu: true, enabled: true }
    ],
  },
  {
    id: "relatorios",
    label: "Relatórios",
    icon: BarChart3,
    order: 9,
    routes: [
      { path: "/reports/cash-flow", label: "Cash Flow", showInMenu: true, enabled: true },
      { path: "/reports/chart-builder", label: "Chart Builder", showInMenu: true, enabled: true },
      { path: "/reports/dashboard", label: "Dashboard", showInMenu: true, enabled: true },
      { path: "/reports/dre", label: "Dre", showInMenu: true, enabled: true },
      { path: "/reports/financial-by-category", label: "Financial By Category", showInMenu: true, enabled: true },
      { path: "/reports/fiscal", label: "Fiscal", showInMenu: true, enabled: true },
      { path: "/reports/headcount", label: "Headcount", showInMenu: true, enabled: true },
      { path: "/reports/hr", label: "Hr", showInMenu: true, enabled: true },
      { path: "/reports/inventory", label: "Inventory", showInMenu: true, enabled: true },
      { path: "/reports/inventory-abc", label: "Inventory Abc", showInMenu: true, enabled: true },
      { path: "/reports/inventory-position", label: "Inventory Position", showInMenu: true, enabled: true },
      { path: "/reports/payables-aging", label: "Payables Aging", showInMenu: true, enabled: true },
      { path: "/reports/production", label: "Production", showInMenu: true, enabled: true },
      { path: "/reports/purchases", label: "Purchases", showInMenu: true, enabled: true },
      { path: "/reports/purchases-by-supplier", label: "Purchases By Supplier", showInMenu: true, enabled: true },
      { path: "/reports/receivables-aging", label: "Receivables Aging", showInMenu: true, enabled: true },
      { path: "/reports/sales", label: "Sales", showInMenu: true, enabled: true }
    ],
  },
  {
    id: "bi",
    label: "BI & Gestão",
    icon: TrendingUp,
    order: 10,
    routes: [
      { path: "/bi", label: "Business Intelligence", showInMenu: true, enabled: true,
        children: [
          { path: "/bi/analytics", label: "Analytics", showInMenu: true, enabled: true },
          { path: "/bi/dashboard", label: "Dashboard", showInMenu: true, enabled: true },
          { path: "/bi/dashboards", label: "Dashboards", showInMenu: true, enabled: true },
          { path: "/bi/financial", label: "Financial", showInMenu: true, enabled: true },
          { path: "/bi/inventory", label: "Inventory", showInMenu: true, enabled: true },
          { path: "/bi/kpis", label: "Kpis", showInMenu: true, enabled: true },
          { path: "/bi/production", label: "Production", showInMenu: true, enabled: true },
          { path: "/bi/reports", label: "Reports", showInMenu: true, enabled: true },
          { path: "/bi/sales", label: "Sales", showInMenu: true, enabled: true }
        ] },
      { path: "/gpd", label: "GPD", showInMenu: true, enabled: true,
        children: [
          { path: "/gpd/actions", label: "Actions", showInMenu: true, enabled: true },
          { path: "/gpd/goals", label: "Goals", showInMenu: true, enabled: true,
            children: [
              { path: "/gpd/goals/new", label: "New", showInMenu: true, enabled: true }
            ] },
          { path: "/gpd/indicators", label: "Indicators", showInMenu: true, enabled: true }
        ] },
      { path: "/budget", label: "Orçamento", showInMenu: true, enabled: true,
        children: [
          { path: "/budget/accounts", label: "Accounts", showInMenu: true, enabled: true },
          { path: "/budget/alerts", label: "Alerts", showInMenu: true, enabled: true },
          { path: "/budget/planning", label: "Planning", showInMenu: true, enabled: true },
          { path: "/budget/tracking", label: "Tracking", showInMenu: true, enabled: true },
          { path: "/budget/versions", label: "Versions", showInMenu: true, enabled: true }
        ] }
    ],
  },
  {
    id: "tarefas",
    label: "Tarefas",
    icon: CheckSquare,
    order: 11,
    routes: [
      { path: "/tasks/new", label: "New", showInMenu: true, enabled: true }
    ],
  },
  {
    id: "workflow",
    label: "Workflow",
    icon: GitBranch,
    order: 12,
    routes: [
      { path: "/workflow/definitions", label: "Definitions", showInMenu: true, enabled: true,
        children: [
          { path: "/workflow/definitions/new", label: "New", showInMenu: true, enabled: true,
            children: [
              { path: "/workflow/definitions/new/visual", label: "Visual", showInMenu: true, enabled: true }
            ] }
        ] },
      { path: "/workflow/instances", label: "Instances", showInMenu: true, enabled: true },
      { path: "/workflow/my-tasks", label: "My Tasks", showInMenu: true, enabled: true },
      { path: "/workflow/new", label: "New", showInMenu: true, enabled: true }
    ],
  },
  {
    id: "documentos",
    label: "Documentos",
    icon: FolderOpen,
    order: 13,
    routes: [
      { path: "/documents/categories", label: "Categories", showInMenu: true, enabled: true }
    ],
  },
  {
    id: "notificacoes",
    label: "Notificações",
    icon: Bell,
    order: 14,
    routes: [
      { path: "/notifications", label: "Notificações", showInMenu: true, enabled: true }
    ],
  },
  {
    id: "administracao",
    label: "Administração",
    icon: Shield,
    order: 15,
    routes: [
      { path: "/audit", label: "Auditoria", showInMenu: true, enabled: true },
      { path: "/admin", label: "Admin", showInMenu: true, enabled: true,
        children: [
          { path: "/admin/auth-logs", label: "Auth Logs", showInMenu: true, enabled: true }
        ] }
    ],
  },
  {
    id: "configuracoes",
    label: "Configurações",
    icon: Settings,
    order: 99,
    routes: [
      { path: "/docs", label: "Tutoriais", showInMenu: true, enabled: true,
        children: [
          { path: "/docs/privacy", label: "Privacy", showInMenu: true, enabled: true },
          { path: "/docs/terms", label: "Terms", showInMenu: true, enabled: true }
        ] },
      { path: "/design-system", label: "Design System", showInMenu: true, enabled: true },
      { path: "/settings", label: "Configurações", showInMenu: true, enabled: true,
        children: [
          { path: "/settings/ai", label: "Ai", showInMenu: true, enabled: true,
            children: [
              { path: "/settings/ai/embeddings", label: "Embeddings", showInMenu: true, enabled: true },
              { path: "/settings/ai/tasks", label: "Tasks", showInMenu: true, enabled: true },
              { path: "/settings/ai/usage", label: "Usage", showInMenu: true, enabled: true }
            ] },
          { path: "/settings/bank-accounts", label: "Bank Accounts", showInMenu: true, enabled: true },
          { path: "/settings/collection-rules", label: "Collection Rules", showInMenu: true, enabled: true },
          { path: "/settings/companies", label: "Companies", showInMenu: true, enabled: true },
          { path: "/settings/dashboard", label: "Dashboard", showInMenu: true, enabled: true },
          { path: "/settings/deploy-agent", label: "Deploy Agent", showInMenu: true, enabled: true },
          { path: "/settings/email-integration", label: "Email Integration", showInMenu: true, enabled: true },
          { path: "/settings/groups", label: "Groups", showInMenu: true, enabled: true },
          { path: "/settings/import", label: "Import", showInMenu: true, enabled: true },
          { path: "/settings/landing", label: "Landing", showInMenu: true, enabled: true },
          { path: "/settings/notifications", label: "Notifications", showInMenu: true, enabled: true },
          { path: "/settings/sefaz", label: "Sefaz", showInMenu: true, enabled: true },
          { path: "/settings/tutorials", label: "Tutorials", showInMenu: true, enabled: true },
          { path: "/settings/users", label: "Users", showInMenu: true, enabled: true,
            children: [
              { path: "/settings/users/new", label: "New", showInMenu: true, enabled: true }
            ] }
        ] }
    ],
  }
];

/**
 * Gera o Map de rotas para lookup rápido
 */
export function buildRouteRegistry(): Map<string, RouteDefinition> {
  const registry = new Map<string, RouteDefinition>();

  function addRoutes(routes: RouteDefinition[], moduleId: string) {
    for (const route of routes) {
      registry.set(route.path, { ...route, module: moduleId });
      if (route.children) {
        addRoutes(route.children, moduleId);
      }
    }
  }

  for (const mod of modules) {
    addRoutes(mod.routes, mod.id);
  }

  return registry;
}

/**
 * Cria um elemento de ícone React a partir de um componente Lucide
 */
function createIconElement(Icon: LucideIcon): React.ReactNode {
  return React.createElement(Icon, { className: "h-5 w-5" });
}

/**
 * Converte RouteDefinition para MenuItem recursivamente
 */
function routeToMenuItem(route: RouteDefinition): MenuItem {
  const hasChildren = route.children && route.children.length > 0;
  const menuChildren = hasChildren
    ? route.children!
      .filter((c) => c.showInMenu && c.enabled)
      .map(routeToMenuItem)
    : undefined;

  return {
    label: route.label,
    href: hasChildren ? undefined : route.path,
    children: menuChildren,
  };
}

/**
 * Retorna estrutura de menu para o Sidebar
 */
export function getMenuStructure(): MenuItem[] {
  return modules
    .filter((m) => m.routes.some((r) => r.showInMenu && r.enabled))
    .sort((a, b) => a.order - b.order)
    .map((mod) => {
      const menuRoutes = mod.routes.filter((r) => r.showInMenu && r.enabled);
      const isSingleRoute = menuRoutes.length === 1 && !menuRoutes[0].children;

      return {
        label: mod.label,
        icon: createIconElement(mod.icon),
        href: isSingleRoute ? menuRoutes[0].path : undefined,
        children: !isSingleRoute
          ? menuRoutes.map(routeToMenuItem)
          : undefined,
      };
    });
}

/**
 * Busca uma rota pelo path
 */
export function getRouteByPath(path: string): RouteDefinition | undefined {
  const registry = buildRouteRegistry();
  return registry.get(path);
}

/**
 * Retorna todas as rotas de um módulo
 */
export function getModuleRoutes(moduleId: string): RouteDefinition[] {
  const mod = modules.find((m) => m.id === moduleId);
  return mod?.routes ?? [];
}
