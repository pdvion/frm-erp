"use client";

import { MobileCard, MobileCardHeader, MobileCardContent } from "@/components/mobile/MobileCard";
import { Badge } from "@/components/ui/Badge";
import {
  ClipboardList,
  CheckSquare,
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
} from "lucide-react";
import Link from "next/link";

const quickActions = [
  {
    href: "/m/requisitions",
    label: "Requisições",
    icon: <ClipboardList className="w-6 h-6" />,
    color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
  },
  {
    href: "/m/approvals",
    label: "Aprovações",
    icon: <CheckSquare className="w-6 h-6" />,
    color: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
  },
  {
    href: "/m/inventory",
    label: "Estoque",
    icon: <Package className="w-6 h-6" />,
    color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
  },
];

export default function MobileHomePage() {
  return (
    <div className="p-4 space-y-6">
      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 active:scale-95 transition-transform ${action.color}`}
            >
              {action.icon}
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Pending Summary */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Pendências
        </h2>
        <div className="space-y-3">
          <MobileCard>
            <MobileCardHeader
              title="Aprovações Pendentes"
              subtitle="3 itens aguardando sua aprovação"
              icon={<CheckSquare className="w-5 h-5" />}
              badge={<Badge variant="warning">3</Badge>}
            />
          </MobileCard>

          <MobileCard>
            <MobileCardHeader
              title="Requisições em Andamento"
              subtitle="5 requisições abertas"
              icon={<ClipboardList className="w-5 h-5" />}
              badge={<Badge variant="info">5</Badge>}
            />
          </MobileCard>

          <MobileCard>
            <MobileCardHeader
              title="Estoque Baixo"
              subtitle="2 itens abaixo do mínimo"
              icon={<AlertTriangle className="w-5 h-5" />}
              badge={<Badge variant="error">2</Badge>}
            />
          </MobileCard>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Atividade Recente
        </h2>
        <div className="space-y-2">
          {[
            { text: "Requisição #1234 aprovada", time: "Há 5 min", icon: <CheckSquare className="w-4 h-4 text-green-500" /> },
            { text: "Estoque atualizado - Parafuso M8", time: "Há 15 min", icon: <Package className="w-4 h-4 text-blue-500" /> },
            { text: "Nova cotação recebida", time: "Há 1h", icon: <TrendingUp className="w-4 h-4 text-purple-500" /> },
          ].map((activity, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              {activity.icon}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                  {activity.text}
                </p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
