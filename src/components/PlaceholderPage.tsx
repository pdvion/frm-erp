import { PageHeader } from "@/components/PageHeader";
import { Construction } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface PlaceholderPageProps {
  title: string;
  module: string;
  icon?: ReactNode;
  breadcrumbs: { label: string; href?: string }[];
  backHref: string;
  description?: string;
}

export function PlaceholderPage({
  title,
  module,
  icon,
  breadcrumbs,
  backHref,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        icon={icon ?? <Construction className="w-6 h-6" />}
        module={module}
        breadcrumbs={breadcrumbs}
      />

      <div className="bg-theme-card border border-theme rounded-lg p-12 text-center">
        <Construction className="w-16 h-16 mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold text-theme mb-2">Em Desenvolvimento</h2>
        <p className="text-theme-muted mb-6 max-w-md mx-auto">
          {description ?? "Esta funcionalidade está sendo desenvolvida e estará disponível em breve."}
        </p>
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Voltar
        </Link>
      </div>
    </div>
  );
}
