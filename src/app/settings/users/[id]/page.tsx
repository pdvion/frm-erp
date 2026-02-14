"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/formatters";
import { User, Shield, Loader2, Pencil, Save, UserX, UserCheck } from "lucide-react";

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const utils = trpc.useUtils();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  const { data: user, isLoading } = trpc.users.byId.useQuery({ id });
  const { data: allGroups } = trpc.groups.list.useQuery(undefined, { enabled: isEditing });

  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("Usuário atualizado!");
      utils.users.byId.invalidate({ id });
      setIsEditing(false);
    },
    onError: (err) => toast.error("Erro", { description: err.message }),
  });

  const deactivateMutation = trpc.users.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Usuário desativado");
      utils.users.byId.invalidate({ id });
    },
    onError: (err) => toast.error("Erro", { description: err.message }),
  });

  const activateMutation = trpc.users.activate.useMutation({
    onSuccess: () => {
      toast.success("Usuário ativado");
      utils.users.byId.invalidate({ id });
    },
    onError: (err) => toast.error("Erro", { description: err.message }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-theme-muted" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-theme-muted">Usuário não encontrado.</p>
      </div>
    );
  }

  const startEditing = () => {
    setEditName(user.name || "");
    setSelectedGroupIds(user.groups?.map((g: { id: string }) => g.id) || []);
    setIsEditing(true);
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<User className="w-6 h-6 text-blue-500" />}
        title={user.name || "Usuário"}
        subtitle={user.email}
        backHref="/settings/users"
        actions={
          <div className="flex items-center gap-2">
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={startEditing}
                leftIcon={<Pencil className="w-4 h-4" />}
              >
                Editar
              </Button>
            )}
            {user.isActive ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deactivateMutation.mutate({ id })}
                disabled={deactivateMutation.isPending}
                leftIcon={deactivateMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <UserX className="w-4 h-4" />
                }
              >
                Desativar
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => activateMutation.mutate({ id })}
                disabled={activateMutation.isPending}
                leftIcon={activateMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <UserCheck className="w-4 h-4" />
                }
              >
                Ativar
              </Button>
            )}
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <Badge variant={user.isActive ? "success" : "error"}>
          {user.isActive ? "Ativo" : "Inativo"}
        </Badge>
        {user.isDefault && (
          <Badge variant="info">Padrão</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-theme-card rounded-xl border border-theme p-6 space-y-4">
          <h2 className="text-lg font-semibold text-theme">Informações</h2>
          {isEditing ? (
            <div className="space-y-4">
              <Input
                label="Nome"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <div className="text-sm">
                <span className="text-theme-muted">E-mail</span>
                <p className="font-medium text-theme mt-1">{user.email}</p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={() => {
                    updateMutation.mutate({
                      id,
                      name: editName || undefined,
                      groupIds: selectedGroupIds,
                    });
                  }}
                  disabled={updateMutation.isPending}
                  leftIcon={updateMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Save className="w-4 h-4" />
                  }
                >
                  Salvar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-theme-muted">Nome</span>
                <p className="font-medium text-theme mt-1">{user.name || "—"}</p>
              </div>
              <div>
                <span className="text-theme-muted">E-mail</span>
                <p className="font-medium text-theme mt-1">{user.email}</p>
              </div>
              <div>
                <span className="text-theme-muted">Código</span>
                <p className="font-medium text-theme mt-1">{user.code || "—"}</p>
              </div>
              <div>
                <span className="text-theme-muted">Criado em</span>
                <p className="font-medium text-theme mt-1">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <span className="text-theme-muted">Atualizado em</span>
                <p className="font-medium text-theme mt-1">{formatDate(user.updatedAt)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-theme-card rounded-xl border border-theme p-6 space-y-4">
          <h2 className="text-lg font-semibold text-theme flex items-center gap-2">
            <Shield className="w-5 h-5 text-theme-muted" />
            Grupos
          </h2>
          {isEditing && allGroups ? (
            <div className="space-y-2">
              {allGroups.map((group: { id: string; name: string; description?: string | null }) => {
                const isSelected = selectedGroupIds.includes(group.id);
                return (
                  <Button
                    key={group.id}
                    type="button"
                    variant="ghost"
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full h-auto flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer text-left ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-theme bg-theme-secondary hover:bg-theme-hover"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isSelected
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                    }`}>
                      {group.name?.charAt(0) || "G"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-theme">{group.name}</p>
                      {group.description && <p className="text-xs text-theme-muted">{group.description}</p>}
                    </div>
                    {isSelected && (
                      <Badge variant="info" size="sm">Selecionado</Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          ) : user.groups && user.groups.length > 0 ? (
            <div className="space-y-2">
              {user.groups.map((group: { id: string; name: string; description?: string | null }) => (
                <div key={group.id} className="flex items-center gap-3 p-3 rounded-lg bg-theme-secondary">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 text-xs font-bold">
                    {group.name?.charAt(0) || "G"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-theme">{group.name}</p>
                    {group.description && <p className="text-xs text-theme-muted">{group.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-theme-muted">Nenhum grupo atribuído.</p>
          )}
        </div>
      </div>

      {user.permissions && user.permissions.length > 0 && (
        <div className="bg-theme-card rounded-xl border border-theme p-6 space-y-4">
          <h2 className="text-lg font-semibold text-theme">Permissões Diretas</h2>
          <div className="flex flex-wrap gap-2">
            {user.permissions.map((perm) => (
              <Badge key={perm.id} variant="default">
                {perm.module}:{perm.permission}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
