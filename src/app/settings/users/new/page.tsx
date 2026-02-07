"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserPlus, Save, ArrowLeft, Shield, Check } from "lucide-react";
import Link from "next/link";

export default function NewUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    groupIds: [] as string[],
  });
  const [error, setError] = useState("");

  const { data: groups } = trpc.groups.list.useQuery({ includeMembers: false });

  const inviteMutation = trpc.users.invite.useMutation({
    onSuccess: (data) => {
      if (data.isNew) {
        toast.success("Usuário criado com sucesso! Um e-mail de convite será enviado.");
      } else {
        toast.info("Usuário já existente foi adicionado a esta empresa.");
      }
      router.push("/settings/users");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    if (!form.email.trim()) {
      setError("E-mail é obrigatório");
      return;
    }

    inviteMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      groupIds: form.groupIds.length > 0 ? form.groupIds : undefined,
    });
  };

  const toggleGroup = (groupId: string) => {
    setForm((prev) => ({
      ...prev,
      groupIds: prev.groupIds.includes(groupId)
        ? prev.groupIds.filter((id) => id !== groupId)
        : [...prev.groupIds, groupId],
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Convidar Usuário"
        icon={<UserPlus className="w-6 h-6" />}
        module="SETTINGS"
        breadcrumbs={[
          { label: "Configurações", href: "/settings" },
          { label: "Usuários", href: "/settings/users" },
          { label: "Convidar" },
        ]}
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Dados Básicos */}
        <div className="bg-theme-card border border-theme rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-theme">Dados do Usuário</h2>

          <Input
            label="Nome Completo *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: João da Silva"
            required
          />

          <div>
            <Input
              label="E-mail *"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Ex: joao@empresa.com.br"
              required
            />
            <p className="mt-1 text-xs text-theme-muted">
              O usuário receberá um e-mail de convite neste endereço.
            </p>
          </div>
        </div>

        {/* Grupos de Permissões */}
        <div className="bg-theme-card border border-theme rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-theme">
              Grupos de Permissões
            </h2>
          </div>
          <p className="text-sm text-theme-muted">
            Selecione os grupos que o usuário fará parte. As permissões serão
            herdadas dos grupos selecionados.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {groups?.map((group) => (
              <Button
                key={group.id}
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                  form.groupIds.includes(group.id)
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-theme hover:border-blue-300 dark:hover:border-blue-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center ${
                    form.groupIds.includes(group.id)
                      ? "bg-blue-600 border-blue-600"
                      : "border-theme-input"
                  }`}
                >
                  {form.groupIds.includes(group.id) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-theme truncate">{group.name}</p>
                  {group.description && (
                    <p className="text-xs text-theme-muted truncate">
                      {group.description}
                    </p>
                  )}
                </div>
                {group.isSystem && (
                  <span className="px-2 py-0.5 text-xs bg-theme-secondary rounded text-theme-muted">
                    Sistema
                  </span>
                )}
              </Button>
            ))}
          </div>

          {(!groups || groups.length === 0) && (
            <p className="text-sm text-theme-muted text-center py-4">
              Nenhum grupo disponível.{" "}
              <Link
                href="/settings/groups"
                className="text-blue-600 hover:underline"
              >
                Criar grupo
              </Link>
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/settings/users">
            <Button
              type="button"
              variant="secondary"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            isLoading={inviteMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Convidar Usuário
          </Button>
        </div>
      </form>
    </div>
  );
}
