"use client";

import { CheckSquare } from "lucide-react";
import { MobileCard, MobileCardHeader } from "@/components/mobile/MobileCard";
import { Badge } from "@/components/ui/Badge";

export default function MobileApprovalsPage() {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Aprovações
      </h2>

      <div className="space-y-3">
        {[
          { id: "1", title: "Requisição #REQ-1234", subtitle: "Parafusos sextavados M10x50 — João Silva", type: "Requisição" },
          { id: "2", title: "Pedido #PC-0089", subtitle: "Fornecedor ABC Ltda — R$ 4.500,00", type: "Compra" },
          { id: "3", title: "Férias — Maria Santos", subtitle: "15/03/2026 a 29/03/2026 (15 dias)", type: "RH" },
        ].map((item) => (
          <MobileCard key={item.id}>
            <MobileCardHeader
              title={item.title}
              subtitle={item.subtitle}
              icon={<CheckSquare className="w-5 h-5" />}
              badge={<Badge variant="warning">{item.type}</Badge>}
            />
          </MobileCard>
        ))}
      </div>

      <p className="text-center text-sm text-gray-400 dark:text-gray-500 pt-4">
        Módulo em desenvolvimento — VIO-965
      </p>
    </div>
  );
}
