"use client";

import { CheckCircle, Package, ClipboardList, AlertTriangle, Clock } from "lucide-react";
import { MobileCard, MobileCardHeader } from "@/components/mobile/MobileCard";
import { Badge } from "@/components/ui/Badge";

const mockNotifications = [
  { id: "1", title: "Requisição #REQ-1234 aprovada", subtitle: "Aprovada por João Silva", time: "Há 5 min", icon: <CheckCircle className="w-5 h-5 text-green-500" />, read: false },
  { id: "2", title: "Estoque baixo — Rolamento 6205", subtitle: "Quantidade atual: 3 un (mínimo: 10)", time: "Há 30 min", icon: <AlertTriangle className="w-5 h-5 text-amber-500" />, read: false },
  { id: "3", title: "Nova requisição pendente", subtitle: "#REQ-1237 — Parafusos M8x30", time: "Há 2h", icon: <ClipboardList className="w-5 h-5 text-blue-500" />, read: true },
  { id: "4", title: "Recebimento confirmado", subtitle: "NF-e 12345 — Fornecedor ABC Ltda", time: "Há 1 dia", icon: <Package className="w-5 h-5 text-purple-500" />, read: true },
];

export default function MobileNotificationsPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notificações</h2>
        <Badge variant="info">{mockNotifications.filter((n) => !n.read).length} novas</Badge>
      </div>

      <div className="space-y-3">
        {mockNotifications.map((n) => (
          <MobileCard key={n.id} className={n.read ? "opacity-60" : ""}>
            <MobileCardHeader
              title={n.title}
              subtitle={n.subtitle}
              icon={n.icon}
              badge={
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {n.time}
                </span>
              }
            />
          </MobileCard>
        ))}
      </div>

      <p className="text-center text-sm text-gray-400 dark:text-gray-500 pt-4">
        Notificações em tempo real em breve
      </p>
    </div>
  );
}
