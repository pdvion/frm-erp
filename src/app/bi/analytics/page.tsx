"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { LineChart } from "lucide-react";

export default function BIAnalyticsPage() {
  return (
    <PlaceholderPage
      title="Analytics"
      module="BI"
      icon={<LineChart className="w-6 h-6" />}
      breadcrumbs={[
        { label: "BI", href: "/bi" },
        { label: "Analytics" },
      ]}
      backHref="/bi"
    />
  );
}
