"use client";

import { ClipboardList, Plus } from "lucide-react";
import { MobileCard, MobileCardHeader } from "@/components/mobile/MobileCard";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

export default function MobileRequisitionsPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-theme">
          Requisições
        </h2>
        <Link
          href="/m/requisitions/new"
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium active:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nova
        </Link>
      </div>

      <div className="space-y-3">
        {[
          { id: "1234", desc: "Parafusos sextavados M10x50", status: "Pendente", variant: "warning" as const },
          { id: "1235", desc: "Óleo lubrificante SAE 10W40", status: "Aprovada", variant: "success" as const },
          { id: "1236", desc: "Rolamento 6205-2RS", status: "Em Andamento", variant: "info" as const },
        ].map((req) => (
          <MobileCard key={req.id}>
            <MobileCardHeader
              title={`#REQ-${req.id}`}
              subtitle={req.desc}
              icon={<ClipboardList className="w-5 h-5" />}
              badge={<Badge variant={req.variant}>{req.status}</Badge>}
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
