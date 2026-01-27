"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { FileBarChart } from "lucide-react";

export default function NewBoletoPage() {
  return (
    <PlaceholderPage
      title="Novo Boleto"
      module="FINANCE"
      icon={<FileBarChart className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Contas a Pagar", href: "/payables" },
        { label: "Boletos", href: "/payables/boletos" },
        { label: "Novo" },
      ]}
      backHref="/payables/boletos"
    />
  );
}
