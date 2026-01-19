"use client";

import Link from "next/link";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  ChevronLeft,
  Settings,
  Building2,
  BookOpen,
  Layout,
  Shield,
  Wallet,
} from "lucide-react";

const settingsItems = [
  {
    title: "Empresas",
    description: "Gerenciar empresas do grupo e vínculos de usuários",
    href: "/settings/companies",
    icon: Building2,
    color: "bg-blue-500",
  },
  {
    title: "Integração SEFAZ",
    description: "Configurar certificado digital e consulta de NFe",
    href: "/settings/sefaz",
    icon: Shield,
    color: "bg-green-500",
  },
  {
    title: "Contas Bancárias",
    description: "Gerenciar contas bancárias e integrações",
    href: "/settings/bank-accounts",
    icon: Wallet,
    color: "bg-emerald-500",
  },
  {
    title: "Tutoriais",
    description: "Criar e editar tutoriais de ajuda do sistema",
    href: "/settings/tutorials",
    icon: BookOpen,
    color: "bg-purple-500",
  },
  {
    title: "Landing Page",
    description: "Personalizar a página inicial do sistema",
    href: "/settings/landing",
    icon: Layout,
    color: "bg-pink-500",
  },
];

const quickLinks = [
  {
    title: "Documentação",
    description: "Ver todos os tutoriais disponíveis",
    href: "/docs",
    icon: BookOpen,
  },
  {
    title: "Dashboard",
    description: "Voltar ao painel principal",
    href: "/dashboard",
    icon: Layout,
  },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Configurações</h1>
              </div>
            </div>
            <CompanySwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Settings Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações do Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {settingsItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 ${item.color} text-white rounded-lg group-hover:scale-105 transition-transform`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Links Rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors"
              >
                <item.icon className="w-5 h-5 text-gray-400" />
                <div>
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Precisa de ajuda?</h3>
              <p className="text-sm text-blue-700 mt-1">
                Acesse a <Link href="/docs" className="underline font-medium">Central de Documentação</Link> para 
                ver tutoriais sobre como usar cada funcionalidade do sistema.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
