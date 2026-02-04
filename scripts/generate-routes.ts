#!/usr/bin/env tsx
/**
 * Script para gerar automaticamente o registry de rotas
 * baseado na estrutura de pastas de src/app/
 *
 * Uso: pnpm routes:generate
 *
 * Convenção:
 * - Cada pasta com page.tsx é uma rota
 * - Arquivos _menu.json definem metadata do menu
 * - Hierarquia é inferida pela estrutura de pastas
 */

import * as fs from "fs";
import * as path from "path";

// Tipos
interface MenuConfig {
  label?: string;
  icon?: string;
  order?: number;
  showInMenu?: boolean;
  enabled?: boolean;
  description?: string;
  tags?: string[];
  permissions?: string[];
}

interface RouteNode {
  path: string;
  label: string;
  icon?: string;
  order: number;
  showInMenu: boolean;
  enabled: boolean;
  description?: string;
  tags?: string[];
  permissions?: string[];
  children: RouteNode[];
}

interface ModuleNode {
  id: string;
  label: string;
  icon: string;
  order: number;
  routes: RouteNode[];
}

// Ícones padrão por módulo (fallback)
const DEFAULT_ICONS: Record<string, string> = {
  dashboard: "Home",
  compras: "ShoppingCart",
  materials: "Package",
  suppliers: "Truck",
  estoque: "Warehouse",
  inventory: "Warehouse",
  vendas: "Receipt",
  customers: "Users",
  sales: "Receipt",
  financeiro: "DollarSign",
  finance: "DollarSign",
  payables: "CreditCard",
  receivables: "Wallet",
  treasury: "Landmark",
  fiscal: "FileText",
  invoices: "FileText",
  producao: "Factory",
  production: "Factory",
  rh: "Users",
  hr: "Users",
  relatorios: "BarChart3",
  reports: "BarChart3",
  bi: "TrendingUp",
  catalogo: "Package",
  catalog: "Package",
  tarefas: "CheckSquare",
  tasks: "CheckSquare",
  workflow: "GitBranch",
  documentos: "FolderOpen",
  documents: "FolderOpen",
  notificacoes: "Bell",
  notifications: "Bell",
  administracao: "Shield",
  admin: "Shield",
  configuracoes: "Settings",
  settings: "Settings",
  impex: "Globe",
  portal: "User",
  gpd: "Target",
  budget: "Calculator",
  audit: "Eye",
};

// Pastas a ignorar
const IGNORE_FOLDERS = [
  "api",
  "auth",
  "(auth)",
  "_components",
  "_hooks",
  "_utils",
  "login",
  "forgot-password",
  "reset-password",
  "mfa",
  "register",
];

// Diretórios raiz
const APP_DIR = path.join(process.cwd(), "src/app");
const OUTPUT_FILE = path.join(process.cwd(), "src/lib/routes/registry.generated.ts");
const MODULES_FILE = path.join(process.cwd(), "src/app/_modules.json");

interface ModuleConfig {
  id: string;
  label: string;
  icon: string;
  order: number;
  includes: string[];
}

interface ModulesConfig {
  modules: ModuleConfig[];
  ignore: string[];
}

/**
 * Lê o arquivo _modules.json
 */
function readModulesConfig(): ModulesConfig | null {
  if (fs.existsSync(MODULES_FILE)) {
    try {
      const content = fs.readFileSync(MODULES_FILE, "utf-8");
      return JSON.parse(content) as ModulesConfig;
    } catch (e) {
      console.warn(`⚠️  Erro ao ler ${MODULES_FILE}:`, e);
      return null;
    }
  }
  return null;
}

/**
 * Lê o arquivo _menu.json de uma pasta
 */
function readMenuConfig(dirPath: string): MenuConfig | null {
  const menuPath = path.join(dirPath, "_menu.json");
  if (fs.existsSync(menuPath)) {
    try {
      const content = fs.readFileSync(menuPath, "utf-8");
      return JSON.parse(content) as MenuConfig;
    } catch (e) {
      console.warn(`⚠️  Erro ao ler ${menuPath}:`, e);
      return null;
    }
  }
  return null;
}

/**
 * Verifica se uma pasta tem page.tsx
 */
function hasPage(dirPath: string): boolean {
  return (
    fs.existsSync(path.join(dirPath, "page.tsx")) ||
    fs.existsSync(path.join(dirPath, "page.ts")) ||
    fs.existsSync(path.join(dirPath, "page.jsx")) ||
    fs.existsSync(path.join(dirPath, "page.js"))
  );
}

/**
 * Converte nome de pasta para label legível
 */
function folderToLabel(folder: string): string {
  // Remove prefixos de grupo do Next.js
  const cleanName = folder.replace(/^\(.*\)$/, "").replace(/^\[.*\]$/, "");
  if (!cleanName) return "";

  // Converte kebab-case para Title Case
  return cleanName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Obtém ícone padrão baseado no nome da pasta
 */
function getDefaultIcon(folder: string): string {
  const key = folder.toLowerCase().replace(/-/g, "");
  return DEFAULT_ICONS[key] || "Circle";
}

/**
 * Escaneia uma pasta recursivamente
 */
function scanDirectory(dirPath: string, basePath: string = ""): RouteNode[] {
  const routes: RouteNode[] = [];

  if (!fs.existsSync(dirPath)) {
    return routes;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const folders = entries.filter((e) => e.isDirectory() && !e.name.startsWith("_") && !e.name.startsWith("."));

  for (const folder of folders) {
    const folderName = folder.name;

    // Ignorar pastas especiais
    if (IGNORE_FOLDERS.includes(folderName)) {
      continue;
    }

    // Ignorar rotas dinâmicas [id] para o menu
    if (folderName.startsWith("[") && folderName.endsWith("]")) {
      continue;
    }

    // Ignorar grupos do Next.js mas processar conteúdo
    if (folderName.startsWith("(") && folderName.endsWith(")")) {
      const groupPath = path.join(dirPath, folderName);
      const groupRoutes = scanDirectory(groupPath, basePath);
      routes.push(...groupRoutes);
      continue;
    }

    const fullPath = path.join(dirPath, folderName);
    const routePath = `${basePath}/${folderName}`;

    // Ler configuração do menu
    const menuConfig = readMenuConfig(fullPath);

    // Verificar se tem página
    const hasPageFile = hasPage(fullPath);

    // Escanear subpastas
    const children = scanDirectory(fullPath, routePath);

    // Só incluir se tem página ou filhos com páginas
    if (hasPageFile || children.length > 0) {
      const label = menuConfig?.label || folderToLabel(folderName);
      const showInMenu = menuConfig?.showInMenu ?? true;

      // Se tem página própria E filhos, incluir a rota raiz como primeiro filho
      let finalChildren = children.filter((c) => c.showInMenu);
      if (hasPageFile && finalChildren.length > 0) {
        // Adicionar a rota raiz como primeiro item se tem página
        const selfRoute: RouteNode = {
          path: routePath,
          label: menuConfig?.label || folderToLabel(folderName),
          order: 0,
          showInMenu: true,
          enabled: true,
          children: [],
        };
        finalChildren = [selfRoute, ...finalChildren];
      }

      const route: RouteNode = {
        path: routePath,
        label,
        icon: menuConfig?.icon,
        order: menuConfig?.order ?? 99,
        showInMenu,
        enabled: menuConfig?.enabled ?? true,
        description: menuConfig?.description,
        tags: menuConfig?.tags,
        permissions: menuConfig?.permissions,
        children: hasPageFile && finalChildren.length > 1 ? finalChildren.slice(1) : finalChildren,
      };

      // Se tem página mas não tem filhos, é uma rota simples
      if (hasPageFile && children.length === 0) {
        route.children = [];
      }

      routes.push(route);
    }
  }

  // Ordenar por order
  routes.sort((a, b) => a.order - b.order);

  return routes;
}

/**
 * Agrupa rotas em módulos (primeiro nível)
 */
function groupIntoModules(routes: RouteNode[]): ModuleNode[] {
  const modules: ModuleNode[] = [];

  for (const route of routes) {
    const moduleId = route.path.split("/")[1] || "dashboard";
    const icon = route.icon || getDefaultIcon(moduleId);

    // Se a rota tem filhos, é um módulo com subrotas
    // Se não tem filhos, é um módulo com rota única
    const moduleRoutes: RouteNode[] = route.children.length > 0 ? route.children : [route];

    modules.push({
      id: moduleId,
      label: route.label,
      icon,
      order: route.order,
      routes: moduleRoutes,
    });
  }

  return modules.sort((a, b) => a.order - b.order);
}

/**
 * Gera o código TypeScript do registry
 */
function generateRegistryCode(modules: ModuleNode[]): string {
  // Coletar todos os ícones usados
  const usedIcons = new Set<string>();
  for (const mod of modules) {
    usedIcons.add(mod.icon);
  }

  const iconImports = Array.from(usedIcons).sort().join(",\n  ");

  // Gerar código dos módulos
  const modulesCode = modules
    .map((mod) => {
      const routesCode = generateRoutesCode(mod.routes, 3);
      return `  {
    id: "${mod.id}",
    label: "${mod.label}",
    icon: ${mod.icon},
    order: ${mod.order},
    routes: [
${routesCode}
    ],
  }`;
    })
    .join(",\n");

  return `/**
 * ARQUIVO GERADO AUTOMATICAMENTE
 * NÃO EDITE MANUALMENTE
 *
 * Gerado por: pnpm routes:generate
 * Data: ${new Date().toISOString()}
 *
 * Para modificar o menu, edite os arquivos _menu.json nas pastas de src/app/
 */

import {
  ${iconImports},
  type LucideIcon,
} from "lucide-react";
import React from "react";
import type { ModuleDefinition, MenuItem, RouteDefinition } from "./types";

export const modules: ModuleDefinition[] = [
${modulesCode}
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
`;
}

/**
 * Gera código para array de rotas (recursivo)
 */
function generateRoutesCode(routes: RouteNode[], indent: number): string {
  const spaces = "  ".repeat(indent);
  return routes
    .map((route) => {
      const childrenCode =
        route.children.length > 0
          ? `,
${spaces}  children: [
${generateRoutesCode(route.children, indent + 2)}
${spaces}  ]`
          : "";

      const tagsCode = route.tags ? `, tags: ${JSON.stringify(route.tags)}` : "";
      const descCode = route.description ? `, description: "${route.description}"` : "";

      return `${spaces}{ path: "${route.path}", label: "${route.label}", showInMenu: ${route.showInMenu}, enabled: ${route.enabled}${tagsCode}${descCode}${childrenCode} }`;
    })
    .join(",\n");
}

/**
 * Agrupa rotas usando _modules.json
 */
function groupWithModulesConfig(routes: RouteNode[], config: ModulesConfig): ModuleNode[] {
  const modules: ModuleNode[] = [];
  const usedRoutes = new Set<string>();

  for (const modConfig of config.modules) {
    const moduleRoutes: RouteNode[] = [];

    for (const include of modConfig.includes) {
      const matchingRoutes = routes.filter((r) => {
        const routeFolder = r.path.split("/")[1];
        return routeFolder === include;
      });

      for (const route of matchingRoutes) {
        usedRoutes.add(route.path);
        // Se o módulo tem apenas uma rota incluída, usar os filhos dessa rota
        if (modConfig.includes.length === 1 && route.children.length > 0) {
          moduleRoutes.push(...route.children);
        } else {
          // Adicionar a rota como item do módulo
          moduleRoutes.push(route);
        }
      }
    }

    if (moduleRoutes.length > 0) {
      modules.push({
        id: modConfig.id,
        label: modConfig.label,
        icon: modConfig.icon,
        order: modConfig.order,
        routes: moduleRoutes.sort((a, b) => a.order - b.order),
      });
    }
  }

  // Reportar rotas não agrupadas (exceto ignoradas)
  const ignoredFolders = new Set(config.ignore);
  const ungroupedRoutes = routes.filter((r) => {
    const folder = r.path.split("/")[1];
    return !usedRoutes.has(r.path) && !ignoredFolders.has(folder);
  });

  if (ungroupedRoutes.length > 0) {
    console.warn("\n⚠️  Rotas não agrupadas (adicione ao _modules.json):");
    for (const route of ungroupedRoutes) {
      console.warn(`   - ${route.path} (${route.label})`);
    }
  }

  return modules.sort((a, b) => a.order - b.order);
}

// Main
function main() {
  console.log("🔍 Escaneando src/app/...");

  const routes = scanDirectory(APP_DIR);
  console.log(`📁 Encontradas ${routes.length} rotas de primeiro nível`);

  // Tentar usar _modules.json para agrupamento
  const modulesConfig = readModulesConfig();
  let modules: ModuleNode[];

  if (modulesConfig) {
    console.log("📦 Usando _modules.json para agrupamento");
    modules = groupWithModulesConfig(routes, modulesConfig);
  } else {
    console.log("📦 Agrupando automaticamente (sem _modules.json)");
    modules = groupIntoModules(routes);
  }

  console.log(`📦 Gerados ${modules.length} módulos`);

  const code = generateRegistryCode(modules);

  // Escrever arquivo
  fs.writeFileSync(OUTPUT_FILE, code, "utf-8");
  console.log(`✅ Gerado: ${OUTPUT_FILE}`);

  // Listar módulos
  console.log("\n📋 Módulos gerados:");
  for (const mod of modules) {
    const routeCount = mod.routes.length;
    const childCount = mod.routes.reduce((acc, r) => acc + (r.children?.length || 0), 0);
    console.log(`   - ${mod.label} (${routeCount} rotas, ${childCount} subitens)`);
  }
}

main();
