import { type LucideIcon } from "lucide-react";

export interface RouteDefinition {
  /** Caminho da rota (ex: "/materials") */
  path: string;
  /** Label para exibição no menu */
  label: string;
  /** Descrição para acessibilidade e tooltips */
  description?: string;
  /** Módulo pai (ex: "compras", "estoque") */
  module?: string;
  /** Se deve aparecer no menu lateral */
  showInMenu: boolean;
  /** Ordem de exibição no menu */
  menuOrder?: number;
  /** Permissões necessárias para acessar */
  permissions?: string[];
  /** Se a rota está ativa/habilitada */
  enabled: boolean;
  /** Tags para busca e categorização */
  tags?: string[];
  /** Subitens hierárquicos (para menus aninhados) */
  children?: RouteDefinition[];
}

export interface ModuleDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  order: number;
  routes: RouteDefinition[];
}

export interface MenuItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
}

export interface RouteChild {
  path: string;
  label: string;
  showInMenu: boolean;
  enabled: boolean;
  children?: RouteChild[];
}

export type RouteRegistry = Map<string, RouteDefinition>;
