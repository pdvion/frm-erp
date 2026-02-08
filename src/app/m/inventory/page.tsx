"use client";

import { Package, Search } from "lucide-react";
import { MobileCard, MobileCardHeader } from "@/components/mobile/MobileCard";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

export default function MobileInventoryPage() {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-theme">
        Estoque
      </h2>

      {/* Search */}
      <Input
        placeholder="Buscar material..."
        leftIcon={<Search className="w-4 h-4" />}
      />

      <div className="space-y-3">
        {[
          { id: "1", code: "MAT-001", desc: "Parafuso Sextavado M10x50", qty: "1.250 un", status: "ok" },
          { id: "2", code: "MAT-002", desc: "Óleo Lubrificante SAE 10W40", qty: "45 L", status: "low" },
          { id: "3", code: "MAT-003", desc: "Rolamento 6205-2RS", qty: "8 un", status: "critical" },
          { id: "4", code: "MAT-004", desc: "Correia Dentada HTD 5M", qty: "120 m", status: "ok" },
        ].map((item) => (
          <MobileCard key={item.id}>
            <MobileCardHeader
              title={`${item.code} — ${item.desc}`}
              subtitle={`Estoque: ${item.qty}`}
              icon={<Package className="w-5 h-5" />}
              badge={
                <Badge
                  variant={
                    item.status === "ok" ? "success" : item.status === "low" ? "warning" : "error"
                  }
                >
                  {item.status === "ok" ? "Normal" : item.status === "low" ? "Baixo" : "Crítico"}
                </Badge>
              }
            />
          </MobileCard>
        ))}
      </div>

      <p className="text-center text-sm text-theme-muted pt-4">
        Módulo em desenvolvimento — VIO-964
      </p>
    </div>
  );
}
