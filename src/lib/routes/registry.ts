import React from "react";
import {
  Home,
  ShoppingCart,
  Warehouse,
  Receipt,
  DollarSign,
  FileText,
  Factory,
  Users,
  BarChart3,
  TrendingUp,
  CheckSquare,
  GitBranch,
  FolderOpen,
  Bell,
  Shield,
  Settings,
  Package,
  type LucideIcon,
} from "lucide-react";
import { ModuleDefinition, RouteDefinition, MenuItem } from "./types";

/**
 * Registro centralizado de todas as rotas do sistema.
 *
 * IMPORTANTE: Ao criar uma nova página, adicione a rota aqui.
 * Execute `pnpm routes:audit` para verificar rotas órfãs.
 */
export const modules: ModuleDefinition[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    order: 0,
    routes: [
      { path: "/dashboard", label: "Dashboard", showInMenu: true, enabled: true },
    ],
  },
  {
    id: "compras",
    label: "Compras",
    icon: ShoppingCart,
    order: 1,
    routes: [
      { path: "/materials", label: "Materiais", showInMenu: true, enabled: true, tags: ["cadastro"] },
      { path: "/materials/new", label: "Novo Material", showInMenu: false, enabled: true },
      { path: "/suppliers", label: "Fornecedores", showInMenu: true, enabled: true },
      { path: "/quotes", label: "Cotações", showInMenu: true, enabled: true },
      { path: "/purchase-orders", label: "Ordens de Compra", showInMenu: true, enabled: true },
      { path: "/receiving", label: "Recebimento", showInMenu: true, enabled: true },
      { path: "/requisitions", label: "Requisições", showInMenu: true, enabled: true },
      { path: "/supplier-returns", label: "Devoluções", showInMenu: true, enabled: true },
      { path: "/impex", label: "ImpEx", showInMenu: true, enabled: true },
    ],
  },
  {
    id: "estoque",
    label: "Estoque",
    icon: Warehouse,
    order: 2,
    routes: [
      { path: "/inventory", label: "Inventário", showInMenu: true, enabled: true },
      { path: "/inventory/dashboard", label: "Dashboard", showInMenu: false, enabled: true },
      { path: "/locations", label: "Localizações", showInMenu: true, enabled: true },
      { path: "/transfers", label: "Transferências", showInMenu: true, enabled: true },
      { path: "/picking", label: "Picking List", showInMenu: true, enabled: true },
      { path: "/inventory-count", label: "Contagem", showInMenu: true, enabled: true },
    ],
  },
  {
    id: "vendas",
    label: "Vendas",
    icon: Receipt,
    order: 3,
    routes: [
      { path: "/customers", label: "Clientes", showInMenu: true, enabled: true },
      { path: "/sales", label: "Pedidos", showInMenu: true, enabled: true },
      { path: "/billing", label: "Faturamento", showInMenu: true, enabled: true },
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: DollarSign,
    order: 4,
    routes: [
      { path: "/finance/dashboard", label: "Dashboard", showInMenu: true, enabled: true },
      { path: "/payables", label: "Contas a Pagar", showInMenu: true, enabled: true },
      { path: "/receivables", label: "Contas a Receber", showInMenu: true, enabled: true },
      { path: "/treasury", label: "Tesouraria", showInMenu: true, enabled: true },
      { path: "/treasury/approvals", label: "Aprovações", showInMenu: true, enabled: true },
    ],
  },
  {
    id: "fiscal",
    label: "Fiscal",
    icon: FileText,
    order: 5,
    routes: [
      { path: "/fiscal/dashboard", label: "Dashboard", showInMenu: true, enabled: true },
      { path: "/invoices", label: "Notas Fiscais", showInMenu: true, enabled: true },
      { path: "/invoices/pending", label: "NFe Pendentes", showInMenu: true, enabled: true },
      { path: "/invoices/import", label: "Importar XML", showInMenu: true, enabled: true },
      { 
        path: "/fiscal/deploy-agent", 
        label: "Deploy Agent", 
        showInMenu: true, 
        enabled: true,
        children: [
          { path: "/fiscal/deploy-agent/analysis", label: "Análise Fiscal", showInMenu: true, enabled: true },
          { path: "/fiscal/deploy-agent/wizard", label: "Wizard Config", showInMenu: true, enabled: true },
        ],
      },
      { path: "/fiscal/sped", label: "SPED", showInMenu: true, enabled: true },
    ],
  },
  {
    id: "producao",
    label: "Produção",
    icon: Factory,
    order: 6,
    routes: [
      { path: "/production", label: "Ordens de Produção", showInMenu: true, enabled: true },
      { path: "/production/dashboard", label: "Dashboard", showInMenu: false, enabled: true },
      { path: "/production/mrp", label: "MRP", showInMenu: true, enabled: true },
      { path: "/production/mes", label: "MES", showInMenu: true, enabled: true },
      { path: "/production/oee", label: "OEE", showInMenu: true, enabled: true },
      { path: "/production/costs", label: "Custos", showInMenu: true, enabled: true },
    ],
  },
  {
    id: "rh",
    label: "RH",
    icon: Users,
    order: 7,
    routes: [
      { path: "/hr", label: "Funcionários", showInMenu: true, enabled: true },
      { path: "/hr/dashboard", label: "Dashboard", showInMenu: false, enabled: true },
      { path: "/hr/payroll", label: "Folha de Pagamento", showInMenu: true, enabled: true },
      { path: "/hr/benefits", label: "Benefícios", showInMenu: true, enabled: true },
      { path: "/hr/timeclock", label: "Ponto", showInMenu: true, enabled: true },
      { path: "/hr/admission", label: "Admissão", showInMenu: true, enabled: true },
    ],
  },
  {
    id: "relatorios",
    label: "Relatórios",
    icon: BarChart3,
    order: 8,
    routes: [
      { path: "/reports", label: "Visão Geral", showInMenu: true, enabled: true },
      { path: "/reports/inventory-position", label: "Posição Estoque", showInMenu: true, enabled: true },
      { path: "/reports/payables-aging", label: "Aging Pagar", showInMenu: true, enabled: true },
      { path: "/reports/cash-flow", label: "Fluxo de Caixa", showInMenu: true, enabled: true },
    ],
  },
  {
    id: "bi",
    label: "BI & Gestão",
    icon: TrendingUp,
    order: 9,
    routes: [
      { path: "/bi", label: "Business Intelligence", showInMenu: true, enabled: true },
      { path: "/bi/analytics", label: "Analytics", showInMenu: false, enabled: true },
      { path: "/bi/kpis", label: "KPIs", showInMenu: false, enabled: true },
      { path: "/gpd", label: "GPD", showInMenu: true, enabled: true },
      { path: "/budget", label: "Orçamento", showInMenu: true, enabled: true },
    ],
  },
  {
    id: "catalogo",
    label: "Catálogo",
    icon: Package,
    order: 10,
    routes: [
      { path: "/catalog", label: "Produtos", showInMenu: true, enabled: true },
      { path: "/catalog/categories", label: "Categorias", showInMenu: true, enabled: true },
      { path: "/catalog/sync", label: "Sincronização", showInMenu: true, enabled: true },
    ],
  },
  {
    id: "tarefas",
    label: "Tarefas",
    icon: CheckSquare,
    order: 11,
    routes: [
      { path: "/tasks", label: "Tarefas", showInMenu: true, enabled: true },
    ],
  },
  {
    id: "workflow",
    label: "Workflow",
    icon: GitBranch,
    order: 12,
    routes: [
      { path: "/workflow", label: "Workflows", showInMenu: true, enabled: true },
    ],
  },
  {
    id: "documentos",
    label: "Documentos",
    icon: FolderOpen,
    order: 13,
    routes: [
      { path: "/documents", label: "GED", showInMenu: true, enabled: true },
    ],
  },
  {
    id: "notificacoes",
    label: "Notificações",
    icon: Bell,
    order: 14,
    routes: [
      { path: "/notifications", label: "Notificações", showInMenu: true, enabled: true },
    ],
  },
  {
    id: "administracao",
    label: "Administração",
    icon: Shield,
    order: 15,
    routes: [
      { path: "/settings/users", label: "Usuários", showInMenu: true, enabled: true },
      { path: "/settings/groups", label: "Grupos", showInMenu: true, enabled: true },
      { path: "/settings/companies", label: "Empresas", showInMenu: true, enabled: true },
      { path: "/audit", label: "Auditoria", showInMenu: true, enabled: true },
      { path: "/admin/auth-logs", label: "Logs de Acesso", showInMenu: true, enabled: true },
    ],
  },
  {
    id: "configuracoes",
    label: "Configurações",
    icon: Settings,
    order: 99,
    routes: [
      { path: "/settings", label: "Geral", showInMenu: true, enabled: true },
      { path: "/settings/bank-accounts", label: "Contas Bancárias", showInMenu: true, enabled: true },
      { path: "/settings/email-integration", label: "Integração Email", showInMenu: true, enabled: true },
      { path: "/settings/sefaz", label: "SEFAZ", showInMenu: true, enabled: true },
      { path: "/settings/ai", label: "Tokens de IA", showInMenu: true, enabled: true },
      { path: "/docs", label: "Tutoriais", showInMenu: true, enabled: true },
      { path: "/design-system", label: "Design System", showInMenu: true, enabled: true },
    ],
  },
];

/**
 * Gera o Map de rotas para lookup rápido
 */
export function buildRouteRegistry(): Map<string, RouteDefinition> {
  const registry = new Map<string, RouteDefinition>();

  for (const mod of modules) {
    for (const route of mod.routes) {
      registry.set(route.path, { ...route, module: mod.id });
    }
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
