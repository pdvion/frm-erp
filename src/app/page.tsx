"use client";

import Link from "next/link";
import { Package, Users, Warehouse, FileText, Settings, BarChart3, Shield } from "lucide-react";
import { CompanySwitcher } from "@/components/CompanySwitcher";

const modules = [
  {
    title: "Materiais",
    description: "Cadastro e gestão de materiais",
    href: "/materials",
    icon: Package,
    color: "bg-blue-500",
  },
  {
    title: "Fornecedores",
    description: "Cadastro de fornecedores",
    href: "/suppliers",
    icon: Users,
    color: "bg-green-500",
  },
  {
    title: "Estoque",
    description: "Controle de estoque e movimentações",
    href: "/inventory",
    icon: Warehouse,
    color: "bg-orange-500",
  },
  {
    title: "Orçamentos",
    description: "Cotações e orçamentos de compra",
    href: "/quotes",
    icon: FileText,
    color: "bg-purple-500",
  },
  {
    title: "Relatórios",
    description: "Relatórios e dashboards",
    href: "/reports",
    icon: BarChart3,
    color: "bg-pink-500",
  },
  {
    title: "Configurações",
    description: "Configurações do sistema",
    href: "/settings",
    icon: Settings,
    color: "bg-gray-500",
  },
  {
    title: "Auditoria",
    description: "Logs de ações e governança",
    href: "/audit",
    icon: Shield,
    color: "bg-indigo-500",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FRM ERP</h1>
                <p className="text-sm text-gray-500">Sistema de Gestão Industrial</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CompanySwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bem-vindo ao FRM ERP
          </h2>
          <p className="text-gray-600">
            Sistema de gestão de materiais, fornecedores e estoque.
            Selecione um módulo para começar.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`${module.color} p-3 rounded-lg`}>
                  <module.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {module.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Status Section */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Status do Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Banco de Dados</p>
                <p className="text-xs text-gray-500">Supabase PostgreSQL</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">API</p>
                <p className="text-xs text-gray-500">tRPC Ativo</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Integrações</p>
                <p className="text-xs text-gray-500">SEFAZ - Pendente</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-gray-500 text-center">
            POC Delphi FRM © 2026 - Migração do sistema ERP industrial
          </p>
        </div>
      </footer>
    </div>
  );
}
