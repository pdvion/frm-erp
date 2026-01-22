"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageCard } from "@/components/ui/PageCard";
import {
  FileText,
  Upload,
  FileCheck,
  ArrowRight,
  Receipt,
  Calculator,
} from "lucide-react";

const modules = [
  {
    title: "NFe Recebidas",
    description: "Gerenciar notas fiscais eletrônicas de entrada",
    href: "/fiscal/nfe",
    icon: Receipt,
    color: "bg-blue-500",
  },
  {
    title: "Importar NFe",
    description: "Importar XML de NFe via upload ou email",
    href: "/fiscal/nfe/import",
    icon: Upload,
    color: "bg-green-500",
  },
  {
    title: "SPED Fiscal",
    description: "Gerar arquivo EFD ICMS/IPI",
    href: "/fiscal/sped",
    icon: FileCheck,
    color: "bg-purple-500",
  },
];

export default function FiscalPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Módulo Fiscal"
        subtitle="Gestão de documentos fiscais e obrigações acessórias"
        icon={<FileText className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Link key={module.href} href={module.href}>
            <PageCard className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${module.color}`}>
                  <module.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {module.description}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </div>
            </PageCard>
          </Link>
        ))}
      </div>

      {/* Informações */}
      <PageCard title="Sobre o Módulo Fiscal">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              NFe - Nota Fiscal Eletrônica
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
              <li>Importação de XML via upload ou email</li>
              <li>Vinculação automática com materiais</li>
              <li>Conferência com pedidos de compra</li>
              <li>Aprovação com entrada no estoque</li>
              <li>Geração automática de título a pagar</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              SPED Fiscal
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
              <li>EFD ICMS/IPI - Escrituração Fiscal Digital</li>
              <li>Blocos 0, C, E, H e 9</li>
              <li>Validação automática do arquivo</li>
              <li>Download em formato TXT</li>
              <li>Layout versão 018 (2024)</li>
            </ul>
          </div>
        </div>
      </PageCard>
    </div>
  );
}
