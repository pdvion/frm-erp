"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { LayoutDashboard } from "lucide-react";

export default function BIDashboardsPage() {
  return (
    <PlaceholderPage
      title="Dashboards"
      module="BI"
      icon={<LayoutDashboard className="w-6 h-6" />}
      breadcrumbs={[
        { label: "BI", href: "/bi" },
        { label: "Dashboards" },
      ]}
      backHref="/bi"
    />
  );
}
