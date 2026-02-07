"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { PageCard } from "@/components/ui/PageCard";
import {
  Bell,
  Mail,
  Smartphone,
  Monitor,
  Loader2,
  Check,
  AlertTriangle,
  Info,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";

interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const categories: NotificationCategory[] = [
  {
    id: "system",
    name: "Sistema",
    description: "Atualizações do sistema, manutenções e alertas de segurança",
    icon: <Monitor className="w-5 h-5 text-blue-500" />,
  },
  {
    id: "business",
    name: "Negócios",
    description: "Aprovações, vencimentos, pedidos e transações",
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
  },
  {
    id: "error",
    name: "Erros",
    description: "Falhas de integração, erros de processamento e alertas críticos",
    icon: <AlertCircle className="w-5 h-5 text-red-500" />,
  },
];

export default function NotificationSettingsPage() {
  const utils = trpc.useUtils();
  const [saving, setSaving] = useState<string | null>(null);

  const { data: preferences, isLoading } = trpc.notifications.getPreferences.useQuery();

  const updatePreferencesMutation = trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => {
      utils.notifications.getPreferences.invalidate();
      toast.success("Preferências atualizadas");
      setSaving(null);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar preferências: " + error.message);
      setSaving(null);
    },
  });

  const getPreference = (category: string) => {
    return preferences?.find((p) => p.category === category) || {
      emailEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
    };
  };

  const handleToggle = (category: string, field: "emailEnabled" | "pushEnabled" | "inAppEnabled", value: boolean) => {
    setSaving(`${category}-${field}`);
    updatePreferencesMutation.mutate({
      category,
      [field]: value,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Configurações de Notificações"
          icon={<Bell className="w-6 h-6" />}
          backHref="/settings"
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações de Notificações"
        icon={<Bell className="w-6 h-6" />}
        backHref="/settings"
      />

      <PageCard title="Preferências por Categoria">
        <p className="text-theme-muted text-sm mb-6">
          Configure como você deseja receber notificações para cada categoria de evento.
        </p>

        <div className="space-y-6">
          {categories.map((category) => {
            const pref = getPreference(category.id);
            return (
              <div
                key={category.id}
                className="border border-theme rounded-lg p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-theme-secondary rounded-lg">
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-theme">{category.name}</h3>
                    <p className="text-sm text-theme-muted mt-1">
                      {category.description}
                    </p>

                    <div className="flex flex-wrap gap-4 mt-4">
                      {/* In-App */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Input
                          type="checkbox"
                          checked={pref.inAppEnabled ?? false}
                          onChange={(e) => handleToggle(category.id, "inAppEnabled", e.target.checked)}
                          disabled={saving === `${category.id}-inAppEnabled`}
                          className="w-4 h-4 rounded border-theme-input text-blue-600 focus:ring-blue-500"
                        />
                        <Monitor className="w-4 h-4 text-theme-muted" />
                        <span className="text-sm text-theme-secondary">No app</span>
                        {saving === `${category.id}-inAppEnabled` && (
                          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                        )}
                      </label>

                      {/* Email */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Input
                          type="checkbox"
                          checked={pref.emailEnabled ?? false}
                          onChange={(e) => handleToggle(category.id, "emailEnabled", e.target.checked)}
                          disabled={saving === `${category.id}-emailEnabled`}
                          className="w-4 h-4 rounded border-theme-input text-blue-600 focus:ring-blue-500"
                        />
                        <Mail className="w-4 h-4 text-theme-muted" />
                        <span className="text-sm text-theme-secondary">Email</span>
                        {saving === `${category.id}-emailEnabled` && (
                          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                        )}
                      </label>

                      {/* Push */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Input
                          type="checkbox"
                          checked={pref.pushEnabled ?? false}
                          onChange={(e) => handleToggle(category.id, "pushEnabled", e.target.checked)}
                          disabled={saving === `${category.id}-pushEnabled`}
                          className="w-4 h-4 rounded border-theme-input text-blue-600 focus:ring-blue-500"
                        />
                        <Smartphone className="w-4 h-4 text-theme-muted" />
                        <span className="text-sm text-theme-secondary">Push</span>
                        {saving === `${category.id}-pushEnabled` && (
                          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PageCard>

      <PageCard title="Tipos de Notificação">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-theme-secondary rounded-lg">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Info className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <span className="font-medium text-theme">Informação</span>
              <p className="text-xs text-theme-muted">Atualizações gerais e avisos</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-theme-secondary rounded-lg">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <span className="font-medium text-theme">Sucesso</span>
              <p className="text-xs text-theme-muted">Ações concluídas com êxito</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-theme-secondary rounded-lg">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <span className="font-medium text-theme">Aviso</span>
              <p className="text-xs text-theme-muted">Atenção necessária</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-theme-secondary rounded-lg">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <span className="font-medium text-theme">Erro</span>
              <p className="text-xs text-theme-muted">Problemas que requerem ação</p>
            </div>
          </div>
        </div>
      </PageCard>

      <PageCard title="Notificações em Tempo Real">
        <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Bell className="w-8 h-8 text-blue-600" />
          <div>
            <h4 className="font-medium text-theme">Supabase Realtime Ativo</h4>
            <p className="text-sm text-theme-muted">
              As notificações são atualizadas automaticamente em tempo real via Supabase Realtime.
              Você receberá alertas instantâneos quando novos eventos ocorrerem.
            </p>
          </div>
        </div>
      </PageCard>
    </div>
  );
}
