/**
 * ARQUIVO GERADO AUTOMATICAMENTE
 * NÃO EDITE MANUALMENTE
 *
 * Gerado por: pnpm routes:generate
 * Data: 2026-02-15T00:01:30.531Z
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
  Rocket,
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
          { path: "/materials/new", label: "Novo Material", showInMenu: true, enabled: true }
        ] },
      { path: "/suppliers", label: "Fornecedores", showInMenu: true, enabled: true, tags: ["cadastro","compras"],
        children: [
          { path: "/suppliers/new", label: "Novo Fornecedor", showInMenu: true, enabled: true }
        ] },
      { path: "/quotes", label: "Cotações", showInMenu: true, enabled: true,
        children: [
          { path: "/quotes/compare", label: "Comparar Cotações", showInMenu: true, enabled: true },
          { path: "/quotes/new", label: "Nova Cotação", showInMenu: true, enabled: true }
        ] },
      { path: "/purchase-orders", label: "Ordens de Compra", showInMenu: true, enabled: true,
        children: [
          { path: "/purchase-orders/dashboard", label: "Dashboard", showInMenu: true, enabled: true },
          { path: "/purchase-orders/new", label: "Novo Pedido de Compra", showInMenu: true, enabled: true }
        ] },
      { path: "/receiving", label: "Recebimento", showInMenu: true, enabled: true,
        children: [
          { path: "/receiving/new", label: "Novo Recebimento", showInMenu: true, enabled: true }
        ] },
      { path: "/requisitions", label: "Requisições", showInMenu: true, enabled: true,
        children: [
          { path: "/requisitions/consumption", label: "Consumo", showInMenu: true, enabled: true },
          { path: "/requisitions/new", label: "Nova Requisição", showInMenu: true, enabled: true }
        ] },
      { path: "/supplier-returns", label: "Devoluções", showInMenu: true, enabled: true,
        children: [
          { path: "/supplier-returns/new", label: "Nova Devolução", showInMenu: true, enabled: true }
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
          { path: "/transfers/new", label: "Nova Transferência", showInMenu: true, enabled: true }
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
          { path: "/sales/crm", label: "CRM", showInMenu: true, enabled: true,
            children: [
              { path: "/sales/crm/contacts", label: "Contatos", showInMenu: true, enabled: true },
              { path: "/sales/crm/opportunities", label: "Oportunidades", showInMenu: true, enabled: true },
              { path: "/sales/crm/pipelines", label: "Pipelines", showInMenu: true, enabled: true }
            ] },
          { path: "/sales/dashboard", label: "Dashboard", showInMenu: true, enabled: true },
          { path: "/sales/invoices", label: "Invoices", showInMenu: true, enabled: true },
          { path: "/sales/leads", label: "Leads", showInMenu: true, enabled: true,
            children: [
              { path: "/sales/leads/new", label: "New", showInMenu: true, enabled: true }
            ] },
          { path: "/sales/new", label: "Novo Pedido de Venda", showInMenu: true, enabled: true },
          { path: "/sales/orders", label: "Orders", showInMenu: true, enabled: true },
          { path: "/sales/quotes", label: "Quotes", showInMenu: true, enabled: true,
            children: [
              { path: "/sales/quotes/new", label: "New", showInMenu: true, enabled: true }
            ] }
        ] },
      { path: "/billing", label: "Faturamento", showInMenu: true, enabled: true,
        children: [
          { path: "/billing/new", label: "Nova Fatura", showInMenu: true, enabled: true }
        ] },
      { path: "/customers", label: "Clientes", showInMenu: true, enabled: true,
        children: [
          { path: "/customers/new", label: "Novo Cliente", showInMenu: true, enabled: true }
        ] },
      { path: "/catalog", label: "Catálogo", showInMenu: true, enabled: true,
        children: [
          { path: "/catalog/categories", label: "Categorias", showInMenu: true, enabled: true },
          { path: "/catalog/new", label: "Novo Produto", showInMenu: true, enabled: true },
          { path: "/catalog/sync", label: "Sincronização", showInMenu: true, enabled: true }
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
          { path: "/finance/dashboard", label: "Dashboard Financeiro", showInMenu: true, enabled: true }
        ] },
      { path: "/payables", label: "Contas a Pagar", showInMenu: true, enabled: true,
        children: [
          { path: "/payables/batch-payment", label: "Pagamento em Lote", showInMenu: true, enabled: true },
          { path: "/payables/boletos", label: "Boletos", showInMenu: true, enabled: true,
            children: [
              { path: "/payables/boletos/new", label: "New", showInMenu: true, enabled: true }
            ] },
          { path: "/payables/cashflow", label: "Cashflow", showInMenu: true, enabled: true },
          { path: "/payables/cnab", label: "Cnab", showInMenu: true, enabled: true },
          { path: "/payables/new", label: "Nova Conta a Pagar", showInMenu: true, enabled: true },
          { path: "/payables/pix", label: "Pix", showInMenu: true, enabled: true,
            children: [
              { path: "/payables/pix/new", label: "New", showInMenu: true, enabled: true },
              { path: "/payables/pix/schedules", label: "Schedules", showInMenu: true, enabled: true }
            ] }
        ] },
      { path: "/receivables", label: "Contas a Receber", showInMenu: true, enabled: true,
        children: [
          { path: "/receivables/new", label: "Nova Conta a Receber", showInMenu: true, enabled: true }
        ] },
      { path: "/treasury", label: "Tesouraria", showInMenu: true, enabled: true,
        children: [
          { path: "/treasury/accounts", label: "Contas Bancárias", showInMenu: true, enabled: true,
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
          { path: "/treasury/dda", label: "DDA", showInMenu: true, enabled: true },
          { path: "/treasury/import-ofx", label: "Importar OFX", showInMenu: true, enabled: true },
          { path: "/treasury/reconciliation", label: "Conciliação Bancária", showInMenu: true, enabled: true }
        ] },
      { path: "/assets", label: "Patrimônio", showInMenu: true, enabled: true,
        children: [
          { path: "/assets/depreciation", label: "Depreciação", showInMenu: true, enabled: true },
          { path: "/assets/movements", label: "Movimentações", showInMenu: true, enabled: true }
        ] },
      { path: "/accounting", label: "Contabilidade", showInMenu: true, enabled: true,
        children: [
          { path: "/accounting/chart-of-accounts", label: "Plano de Contas", showInMenu: true, enabled: true },
          { path: "/accounting/entries", label: "Lançamentos", showInMenu: true, enabled: true },
          { path: "/accounting/reports", label: "Relatórios Contábeis", showInMenu: true, enabled: true }
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
          { path: "/fiscal/dashboard", label: "Dashboard Fiscal", showInMenu: true, enabled: true },
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
          { path: "/production/mes", label: "MES", showInMenu: true, enabled: true },
          { path: "/production/mrp", label: "Mrp", showInMenu: true, enabled: true },
          { path: "/production/new", label: "New", showInMenu: true, enabled: true },
          { path: "/production/oee", label: "Oee", showInMenu: true, enabled: true },
          { path: "/production/quality", label: "Qualidade", showInMenu: true, enabled: true,
            children: [
              { path: "/production/quality/new", label: "New", showInMenu: true, enabled: true }
            ] },
          { path: "/production/work-centers", label: "Centros de Trabalho", showInMenu: true, enabled: true }
        ] },
      { path: "/engineering", label: "Engineering", showInMenu: true, enabled: true,
        children: [
          { path: "/engineering/bom", label: "Lista de Materiais (BOM)", showInMenu: true, enabled: true }
        ] },
      { path: "/mrp", label: "Mrp", showInMenu: true, enabled: true },
      { path: "/oee", label: "Oee", showInMenu: true, enabled: true,
        children: [
          { path: "/oee/production-logs", label: "Production Logs", showInMenu: true, enabled: true },
          { path: "/oee/stops", label: "Paradas", showInMenu: true, enabled: true },
          { path: "/oee/work-centers", label: "Work Centers", showInMenu: true, enabled: true }
        ] },
      { path: "/maintenance", label: "Manutenção", showInMenu: true, enabled: true,
        children: [
          { path: "/maintenance/equipment", label: "Equipamentos", showInMenu: true, enabled: true },
          { path: "/maintenance/failure-codes", label: "Códigos de Falha", showInMenu: true, enabled: true },
          { path: "/maintenance/orders", label: "Ordens de Serviço", showInMenu: true, enabled: true },
          { path: "/maintenance/plans", label: "Planos", showInMenu: true, enabled: true }
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
          { path: "/hr/timeclock/hours-bank", label: "Banco de Horas", showInMenu: true, enabled: true },
          { path: "/hr/timeclock/schedules", label: "Escalas", showInMenu: true, enabled: true }
        ] },
      { path: "/hr/admission", label: "Admissão", showInMenu: true, enabled: true,
        children: [
          { path: "/hr/admission/new", label: "Nova Admissão", showInMenu: true, enabled: true }
        ] },
      { path: "/hr/esocial", label: "eSocial", showInMenu: true, enabled: true },
      { path: "/hr/departments", label: "Departamentos", showInMenu: true, enabled: true },
      { path: "/hr/terminations", label: "Rescisões", showInMenu: true, enabled: true,
        children: [
          { path: "/hr/terminations/new", label: "Nova Rescisão", showInMenu: true, enabled: true }
        ] },
      { path: "/hr/thirteenth", label: "13º Salário", showInMenu: true, enabled: true },
      { path: "/hr/vacations", label: "Férias", showInMenu: true, enabled: true,
        children: [
          { path: "/hr/vacations/new", label: "Novas Férias", showInMenu: true, enabled: true }
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
      { path: "/reports/cash-flow", label: "Fluxo de Caixa", showInMenu: true, enabled: true },
      { path: "/reports/chart-builder", label: "Construtor de Gráficos", showInMenu: true, enabled: true },
      { path: "/reports/dashboard", label: "Dashboard", showInMenu: true, enabled: true },
      { path: "/reports/dre", label: "DRE", showInMenu: true, enabled: true },
      { path: "/reports/financial-by-category", label: "Financeiro por Categoria", showInMenu: true, enabled: true },
      { path: "/reports/fiscal", label: "Fiscal", showInMenu: true, enabled: true },
      { path: "/reports/headcount", label: "Quadro de Pessoal", showInMenu: true, enabled: true },
      { path: "/reports/hr", label: "Recursos Humanos", showInMenu: true, enabled: true },
      { path: "/reports/inventory", label: "Estoque", showInMenu: true, enabled: true },
      { path: "/reports/inventory-abc", label: "Curva ABC Estoque", showInMenu: true, enabled: true },
      { path: "/reports/inventory-position", label: "Posição de Estoque", showInMenu: true, enabled: true },
      { path: "/reports/payables-aging", label: "Aging Contas a Pagar", showInMenu: true, enabled: true },
      { path: "/reports/production", label: "Produção", showInMenu: true, enabled: true },
      { path: "/reports/purchases", label: "Compras", showInMenu: true, enabled: true },
      { path: "/reports/purchases-by-supplier", label: "Compras por Fornecedor", showInMenu: true, enabled: true },
      { path: "/reports/receivables-aging", label: "Aging Contas a Receber", showInMenu: true, enabled: true },
      { path: "/reports/sales", label: "Vendas", showInMenu: true, enabled: true }
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
          { path: "/bi/analytics", label: "Análises", showInMenu: true, enabled: true },
          { path: "/bi/dashboard", label: "Dashboard", showInMenu: true, enabled: true },
          { path: "/bi/dashboards", label: "Painéis", showInMenu: true, enabled: true },
          { path: "/bi/financial", label: "Financeiro", showInMenu: true, enabled: true },
          { path: "/bi/inventory", label: "Estoque", showInMenu: true, enabled: true },
          { path: "/bi/kpis", label: "KPIs", showInMenu: true, enabled: true },
          { path: "/bi/production", label: "Produção", showInMenu: true, enabled: true },
          { path: "/bi/reports", label: "Relatórios", showInMenu: true, enabled: true },
          { path: "/bi/sales", label: "Vendas", showInMenu: true, enabled: true }
        ] },
      { path: "/gpd", label: "GPD", showInMenu: true, enabled: true,
        children: [
          { path: "/gpd/actions", label: "Ações", showInMenu: true, enabled: true },
          { path: "/gpd/goals", label: "Metas", showInMenu: true, enabled: true,
            children: [
              { path: "/gpd/goals/new", label: "Nova Meta", showInMenu: true, enabled: true }
            ] },
          { path: "/gpd/indicators", label: "Indicadores", showInMenu: true, enabled: true }
        ] },
      { path: "/budget", label: "Orçamento", showInMenu: true, enabled: true,
        children: [
          { path: "/budget/accounts", label: "Contas Orçamentárias", showInMenu: true, enabled: true },
          { path: "/budget/alerts", label: "Alertas", showInMenu: true, enabled: true },
          { path: "/budget/planning", label: "Planejamento", showInMenu: true, enabled: true },
          { path: "/budget/tracking", label: "Acompanhamento", showInMenu: true, enabled: true },
          { path: "/budget/versions", label: "Versões", showInMenu: true, enabled: true }
        ] }
    ],
  },
  {
    id: "tarefas",
    label: "Tarefas",
    icon: CheckSquare,
    order: 11,
    routes: [
      { path: "/tasks/new", label: "Nova Tarefa", showInMenu: true, enabled: true }
    ],
  },
  {
    id: "workflow",
    label: "Workflow",
    icon: GitBranch,
    order: 12,
    routes: [
      { path: "/workflow/definitions", label: "Definições", showInMenu: true, enabled: true,
        children: [
          { path: "/workflow/definitions/new", label: "Nova Definição", showInMenu: true, enabled: true,
            children: [
              { path: "/workflow/definitions/new/visual", label: "Editor Visual", showInMenu: true, enabled: true }
            ] }
        ] },
      { path: "/workflow/instances", label: "Instâncias", showInMenu: true, enabled: true },
      { path: "/workflow/my-tasks", label: "Minhas Tarefas", showInMenu: true, enabled: true },
      { path: "/workflow/new", label: "Novo Workflow", showInMenu: true, enabled: true }
    ],
  },
  {
    id: "documentos",
    label: "Documentos",
    icon: FolderOpen,
    order: 13,
    routes: [
      { path: "/documents/categories", label: "Categorias", showInMenu: true, enabled: true }
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
          { path: "/admin/auth-logs", label: "Logs de Autenticação", showInMenu: true, enabled: true }
        ] }
    ],
  },
  {
    id: "setup",
    label: "Setup",
    icon: Rocket,
    order: 98,
    routes: [
      { path: "/setup/deploy-agent", label: "Deploy Agent", showInMenu: true, enabled: true,
        children: [
          { path: "/setup/deploy-agent/analysis", label: "Análise", showInMenu: true, enabled: true },
          { path: "/setup/deploy-agent/wizard", label: "Assistente", showInMenu: true, enabled: true }
        ] },
      { path: "/setup/onboarding", label: "Onboarding", showInMenu: true, enabled: true }
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
          { path: "/docs/privacy", label: "Privacidade", showInMenu: true, enabled: true },
          { path: "/docs/terms", label: "Termos de Uso", showInMenu: true, enabled: true }
        ] },
      { path: "/design-system", label: "Design System", showInMenu: true, enabled: true },
      { path: "/settings", label: "Configurações", showInMenu: true, enabled: true,
        children: [
          { path: "/settings/ai", label: "Inteligência Artificial", showInMenu: true, enabled: true,
            children: [
              { path: "/settings/ai/embeddings", label: "Embeddings", showInMenu: true, enabled: true },
              { path: "/settings/ai/tasks", label: "Tarefas IA", showInMenu: true, enabled: true },
              { path: "/settings/ai/usage", label: "Consumo", showInMenu: true, enabled: true }
            ] },
          { path: "/settings/bank-accounts", label: "Contas Bancárias", showInMenu: true, enabled: true },
          { path: "/settings/collection-rules", label: "Regras de Cobrança", showInMenu: true, enabled: true },
          { path: "/settings/companies", label: "Empresas", showInMenu: true, enabled: true },
          { path: "/settings/dashboard", label: "Dashboard", showInMenu: true, enabled: true },
          { path: "/settings/deploy-agent", label: "Deploy Agent", showInMenu: true, enabled: true },
          { path: "/settings/email-integration", label: "Integração de E-mail", showInMenu: true, enabled: true },
          { path: "/settings/groups", label: "Grupos", showInMenu: true, enabled: true },
          { path: "/settings/import", label: "Importação", showInMenu: true, enabled: true },
          { path: "/settings/landing", label: "Landing Page", showInMenu: true, enabled: true },
          { path: "/settings/notifications", label: "Notificações", showInMenu: true, enabled: true },
          { path: "/settings/sefaz", label: "SEFAZ", showInMenu: true, enabled: true },
          { path: "/settings/tutorials", label: "Tutoriais", showInMenu: true, enabled: true },
          { path: "/settings/users", label: "Usuários", showInMenu: true, enabled: true,
            children: [
              { path: "/settings/users/new", label: "Novo Usuário", showInMenu: true, enabled: true }
            ] },
          { path: "/settings/webhooks", label: "Webhooks", showInMenu: true, enabled: true }
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
