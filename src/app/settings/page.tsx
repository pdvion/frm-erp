"use client";

import Link from "next/link";
import {
  ChevronLeft,
  Settings,
  Building2,
  BookOpen,
  Layout,
  Shield,
  Wallet,
  Bell,
  Bot,
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
  {
    title: "Régua de Cobrança",
    description: "Configurar etapas automáticas de cobrança",
    href: "/settings/collection-rules",
    icon: Bell,
    color: "bg-orange-500",
  },
  {
    title: "Tokens de IA",
    description: "Configurar tokens de API para OpenAI, Anthropic e Google",
    href: "/settings/ai",
    icon: Bot,
    color: "bg-violet-500",
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
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Settings className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-theme">Configurações</h1>
          <p className="text-sm text-theme-muted">Configurações do sistema</p>
        </div>
      </div>

      <div>
        {/* Settings Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-theme mb-4">Configurações do Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {settingsItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-theme-card rounded-lg border border-theme p-5 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 ${item.color} text-white rounded-lg group-hover:scale-105 transition-transform`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-theme group-hover:text-blue-600">
                      {item.title}
                    </h3>
                    <p className="text-sm text-theme-muted mt-1">
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
          <h2 className="text-lg font-semibold text-theme mb-4">Links Rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 bg-theme-card rounded-lg border border-theme p-4 hover:border-blue-300 transition-colors"
              >
                <item.icon className="w-5 h-5 text-theme-muted" />
                <div>
                  <h3 className="font-medium text-theme">{item.title}</h3>
                  <p className="text-sm text-theme-muted">{item.description}</p>
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
      </div>
    </div>
  );
}
