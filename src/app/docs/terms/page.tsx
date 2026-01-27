"use client";

import { PageHeader } from "@/components/PageHeader";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Termos de Uso"
        icon={<FileText className="w-6 h-6" />}
        module="DOCS"
        breadcrumbs={[
          { label: "Documentação", href: "/docs" },
          { label: "Termos de Uso" },
        ]}
      />

      <div className="bg-theme-card border border-theme rounded-lg p-8 prose prose-sm dark:prose-invert max-w-none">
        <h2>1. Aceitação dos Termos</h2>
        <p>
          Ao acessar e utilizar o sistema FRM ERP, você concorda com estes termos de uso.
          Se você não concordar com qualquer parte destes termos, não deve utilizar o sistema.
        </p>

        <h2>2. Uso do Sistema</h2>
        <p>
          O sistema FRM ERP é fornecido para uso empresarial. Você é responsável por manter
          a confidencialidade de suas credenciais de acesso e por todas as atividades
          realizadas em sua conta.
        </p>

        <h2>3. Privacidade e Dados</h2>
        <p>
          Seus dados são tratados de acordo com nossa Política de Privacidade.
          Implementamos medidas de segurança para proteger suas informações.
        </p>

        <h2>4. Propriedade Intelectual</h2>
        <p>
          Todo o conteúdo do sistema, incluindo código, design e documentação,
          é propriedade da Vion e está protegido por leis de propriedade intelectual.
        </p>

        <h2>5. Limitação de Responsabilidade</h2>
        <p>
          O sistema é fornecido &quot;como está&quot;. Não garantimos que o sistema estará
          disponível ininterruptamente ou livre de erros.
        </p>

        <h2>6. Alterações nos Termos</h2>
        <p>
          Reservamo-nos o direito de modificar estes termos a qualquer momento.
          Alterações significativas serão comunicadas aos usuários.
        </p>

        <p className="text-theme-muted text-sm mt-8">
          Última atualização: Janeiro de 2026
        </p>
      </div>
    </div>
  );
}
