"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { ArrowLeftRight } from "lucide-react";

export default function NewTransferPage() {
  return (
    <PlaceholderPage
      title="Nova Transferência"
      module="TREASURY"
      icon={<ArrowLeftRight className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Tesouraria", href: "/treasury" },
        { label: "Transferências", href: "/transfers" },
        { label: "Nova" },
      ]}
      backHref="/transfers"
    />
  );
}
