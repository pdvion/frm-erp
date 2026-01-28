"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import {
  Package,
  Users,
  Warehouse,
  FileText,
  ShoppingCart,
  DollarSign,
  Factory,
  BarChart3,
  Settings,
  Receipt,
  TrendingUp,
  Building2,
  CheckSquare,
  GitBranch,
  FolderOpen,
  Bell,
  Shield,
  FileInput,
  Truck,
  ClipboardList,
  Globe,
  type LucideIcon,
} from "lucide-react";

interface ModuleConfig {
  name: string;
  icon: LucideIcon;
  color: string;
}

const moduleMap: Record<string, ModuleConfig> = {
  dashboard: { name: "Dashboard", icon: Home, color: "text-blue-500" },
  materials: { name: "Materiais", icon: Package, color: "text-blue-500" },
  suppliers: { name: "Fornecedores", icon: Users, color: "text-green-500" },
  inventory: { name: "Estoque", icon: Warehouse, color: "text-orange-500" },
  quotes: { name: "Cotações", icon: FileText, color: "text-purple-500" },
  "purchase-orders": { name: "Pedidos de Compra", icon: ShoppingCart, color: "text-teal-500" },
  invoices: { name: "Notas Fiscais", icon: FileInput, color: "text-indigo-500" },
  payables: { name: "Contas a Pagar", icon: DollarSign, color: "text-red-500" },
  receivables: { name: "Contas a Receber", icon: DollarSign, color: "text-green-500" },
  requisitions: { name: "Requisições", icon: ClipboardList, color: "text-amber-500" },
  tasks: { name: "Tarefas", icon: CheckSquare, color: "text-indigo-500" },
  workflow: { name: "Workflow", icon: GitBranch, color: "text-purple-500" },
  documents: { name: "Documentos", icon: FolderOpen, color: "text-blue-500" },
  notifications: { name: "Notificações", icon: Bell, color: "text-blue-500" },
  production: { name: "Produção", icon: Factory, color: "text-purple-500" },
  sales: { name: "Vendas", icon: Receipt, color: "text-green-500" },
  customers: { name: "Clientes", icon: Users, color: "text-blue-500" },
  billing: { name: "Faturamento", icon: Receipt, color: "text-green-500" },
  finance: { name: "Financeiro", icon: DollarSign, color: "text-red-500" },
  fiscal: { name: "Fiscal", icon: FileText, color: "text-indigo-500" },
  hr: { name: "RH", icon: Users, color: "text-purple-500" },
  reports: { name: "Relatórios", icon: BarChart3, color: "text-blue-500" },
  bi: { name: "BI", icon: TrendingUp, color: "text-indigo-500" },
  gpd: { name: "GPD", icon: TrendingUp, color: "text-purple-500" },
  budget: { name: "Orçamento", icon: DollarSign, color: "text-green-500" },
  settings: { name: "Configurações", icon: Settings, color: "text-theme-muted" },
  admin: { name: "Administração", icon: Shield, color: "text-red-500" },
  audit: { name: "Auditoria", icon: Shield, color: "text-indigo-500" },
  profile: { name: "Perfil", icon: Users, color: "text-blue-500" },
  receiving: { name: "Recebimento", icon: Truck, color: "text-teal-500" },
  locations: { name: "Localizações", icon: Warehouse, color: "text-orange-500" },
  transfers: { name: "Transferências", icon: Truck, color: "text-blue-500" },
  picking: { name: "Picking", icon: ClipboardList, color: "text-amber-500" },
  treasury: { name: "Tesouraria", icon: DollarSign, color: "text-green-500" },
  engineering: { name: "Engenharia", icon: Factory, color: "text-purple-500" },
  impex: { name: "ImpEx", icon: Globe, color: "text-blue-500" },
  docs: { name: "Design System", icon: FileText, color: "text-indigo-500" },
  companies: { name: "Empresas", icon: Building2, color: "text-blue-500" },
};

const pathLabels: Record<string, string> = {
  new: "Novo",
  edit: "Editar",
  details: "Detalhes",
  pending: "Pendentes",
  import: "Importar",
  categories: "Categorias",
  definitions: "Definições",
  instances: "Instâncias",
  visual: "Editor Visual",
  dashboard: "Dashboard",
  processes: "Processos",
  exchange: "Câmbio",
  reports: "Relatórios",
  employees: "Funcionários",
  departments: "Departamentos",
  timesheet: "Folha de Ponto",
  payroll: "Folha de Pagamento",
  thirteenth: "13º Salário",
  vacations: "Férias",
  terminations: "Rescisões",
  users: "Usuários",
  groups: "Grupos",
  "bank-accounts": "Contas Bancárias",
  "email-integration": "Integração Email",
  sefaz: "SEFAZ",
  ai: "Tokens de IA",
  "auth-logs": "Logs de Acesso",
  "inventory-position": "Posição Estoque",
  "payables-aging": "Aging Pagar",
  "cash-flow": "Fluxo de Caixa",
  "chart-builder": "Editor de Gráficos",
  bom: "BOM/Estrutura",
  mrp: "MRP",
  mes: "MES",
  oee: "OEE",
  approvals: "Aprovações",
  sped: "SPED",
  ports: "Portos",
  dispatchers: "Despachantes",
  "cargo-types": "Tipos de Carga",
  incoterms: "Incoterms",
  timeclock: "Ponto",
  benefits: "Benefícios",
  "hours-bank": "Banco de Horas",
  reservations: "Reservas",
  "inventory-count": "Contagem",
  "supplier-returns": "Devoluções",
};

export function Breadcrumb() {
  const pathname = usePathname();
  
  if (pathname === "/dashboard" || pathname === "/") {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  
  if (segments.length === 0) return null;

  const firstSegment = segments[0];
  const moduleConfig = moduleMap[firstSegment] || { 
    name: firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1), 
    icon: Home, 
    color: "text-theme-muted" 
  };
  const ModuleIcon = moduleConfig.icon;

  const breadcrumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    
    // Check if segment is a UUID or ID (skip labeling)
    const isId = /^[a-f0-9-]{36}$|^[a-z0-9]{25}$/i.test(segment);
    
    let label: string;
    if (isId) {
      label = "Detalhes";
    } else if (pathLabels[segment]) {
      label = pathLabels[segment];
    } else if (moduleMap[segment]) {
      label = moduleMap[segment].name;
    } else {
      label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    }

    return { path, label, isLast, isId };
  });

  return (
    <div className="flex flex-col min-w-0">
      {/* Module Name */}
      <div className="flex items-center gap-2">
        <ModuleIcon className={`w-5 h-5 ${moduleConfig.color} flex-shrink-0`} />
        <span className="font-semibold text-theme truncate">{moduleConfig.name}</span>
      </div>
      
      {/* Breadcrumb Path */}
      <nav className="flex items-center gap-1 text-xs text-theme-muted mt-0.5 overflow-hidden">
        <Link href="/dashboard" className="hover:text-theme-secondary flex-shrink-0">
          Home
        </Link>
        {breadcrumbs.map((crumb) => (
          <span key={crumb.path} className="flex items-center gap-1 min-w-0">
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
            {crumb.isLast ? (
              <span className="text-theme-secondary truncate">{crumb.label}</span>
            ) : (
              <Link href={crumb.path} className="hover:text-theme-secondary truncate">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
}
