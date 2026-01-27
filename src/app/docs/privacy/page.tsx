"use client";

import { PageHeader } from "@/components/PageHeader";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Política de Privacidade"
        icon={<Shield className="w-6 h-6" />}
        module="DOCS"
        breadcrumbs={[
          { label: "Documentação", href: "/docs" },
          { label: "Privacidade" },
        ]}
      />

      <div className="bg-theme-card border border-theme rounded-lg p-8 prose prose-sm dark:prose-invert max-w-none">
        <h2>1. Coleta de Dados</h2>
        <p>
          Coletamos apenas os dados necessários para o funcionamento do sistema,
          incluindo informações de cadastro, dados de transações e logs de acesso.
        </p>

        <h2>2. Uso dos Dados</h2>
        <p>
          Seus dados são utilizados exclusivamente para:
        </p>
        <ul>
          <li>Fornecer os serviços do sistema</li>
          <li>Melhorar a experiência do usuário</li>
          <li>Garantir a segurança da plataforma</li>
          <li>Cumprir obrigações legais</li>
        </ul>

        <h2>3. Compartilhamento de Dados</h2>
        <p>
          Não compartilhamos seus dados com terceiros, exceto quando necessário
          para o funcionamento do sistema ou quando exigido por lei.
        </p>

        <h2>4. Segurança</h2>
        <p>
          Implementamos medidas de segurança técnicas e organizacionais para
          proteger seus dados contra acesso não autorizado, perda ou alteração.
        </p>

        <h2>5. Seus Direitos</h2>
        <p>
          Você tem direito a acessar, corrigir ou excluir seus dados pessoais.
          Entre em contato conosco para exercer esses direitos.
        </p>

        <h2>6. Cookies</h2>
        <p>
          Utilizamos cookies essenciais para o funcionamento do sistema e
          cookies de análise para melhorar nossos serviços.
        </p>

        <h2>7. Contato</h2>
        <p>
          Para questões sobre privacidade, entre em contato através do e-mail
          privacidade@vion.com.br
        </p>

        <p className="text-theme-muted text-sm mt-8">
          Última atualização: Janeiro de 2026
        </p>
      </div>
    </div>
  );
}
