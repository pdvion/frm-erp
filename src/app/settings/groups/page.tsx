"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Shield,
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface GroupForm {
  name: string;
  description: string;
  permissions: string[];
}

const emptyForm: GroupForm = {
  name: "",
  description: "",
  permissions: [],
};

export default function GroupsPage() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GroupForm>(emptyForm);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: groups, isLoading } = trpc.groups.list.useQuery({
    includeMembers: true,
  });
  const { data: permissionsList } = trpc.groups.listPermissions.useQuery();

  const createMutation = trpc.groups.create.useMutation({
    onSuccess: () => {
      utils.groups.list.invalidate();
      resetForm();
    },
  });

  const updateMutation = trpc.groups.update.useMutation({
    onSuccess: () => {
      utils.groups.list.invalidate();
      resetForm();
    },
  });

  const deleteMutation = trpc.groups.delete.useMutation({
    onSuccess: () => {
      utils.groups.list.invalidate();
      setDeleteConfirm(null);
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (group: NonNullable<typeof groups>[0]) => {
    setEditingId(group.id);
    setForm({
      name: group.name,
      description: group.description || "",
      permissions: group.permissions as string[],
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        name: form.name,
        description: form.description || undefined,
        permissions: form.permissions,
      });
    } else {
      createMutation.mutate({
        name: form.name,
        description: form.description || undefined,
        permissions: form.permissions,
      });
    }
  };

  const togglePermission = (permKey: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permKey)
        ? prev.permissions.filter((p) => p !== permKey)
        : [...prev.permissions, permKey],
    }));
  };

  const toggleModule = (module: string) => {
    setExpandedModules((prev) =>
      prev.includes(module)
        ? prev.filter((m) => m !== module)
        : [...prev, module]
    );
  };

  const groupedPermissions = permissionsList?.reduce(
    (acc, perm) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
    },
    {} as Record<string, typeof permissionsList>
  );

  const filteredGroups = groups?.filter(
    (g) =>
      !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grupos de Permissões"
        icon={<Shield className="w-6 h-6" />}
        module="SETTINGS"
        breadcrumbs={[
          { label: "Configurações", href: "/settings" },
          { label: "Grupos" },
        ]}
        actions={
          <Button
            onClick={() => setShowForm(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Novo Grupo
          </Button>
        }
      />

      {/* Search */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted z-10" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar grupos..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-theme-muted">
            Carregando...
          </div>
        ) : filteredGroups?.length === 0 ? (
          <div className="col-span-full text-center py-8 text-theme-muted">
            Nenhum grupo encontrado
          </div>
        ) : (
          filteredGroups?.map((group) => (
            <div
              key={group.id}
              className="bg-theme-card border border-theme rounded-lg p-4 hover:border-blue-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-theme">{group.name}</h3>
                    {group.isSystem && (
                      <span className="text-xs text-theme-muted">Sistema</span>
                    )}
                  </div>
                </div>
                {!group.isSystem && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(group)}
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(group.id)}
                      title="Excluir"
                      className="text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {group.description && (
                <p className="text-sm text-theme-muted mb-3 line-clamp-2">
                  {group.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-theme-muted">
                  <Users className="w-4 h-4" />
                  <span>{group._count?.members ?? 0} membros</span>
                </div>
                <span className="text-xs text-theme-muted">
                  {(group.permissions as string[]).length} permissões
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-card border border-theme rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-theme flex items-center justify-between">
              <h2 className="text-lg font-semibold text-theme">
                {editingId ? "Editar Grupo" : "Novo Grupo"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4 space-y-4">
              <Input
                label="Nome do Grupo *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Descrição
                </label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme mb-2">
                  Permissões
                </label>
                <div className="border border-theme rounded-lg divide-y divide-theme max-h-64 overflow-auto">
                  {groupedPermissions &&
                    Object.entries(groupedPermissions).map(([module, perms]) => (
                      <div key={module}>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => toggleModule(module)}
                          className="w-full justify-between"
                        >
                          <span className="font-medium capitalize">
                            {module}
                          </span>
                          {expandedModules.includes(module) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                        {expandedModules.includes(module) && (
                          <div className="px-3 pb-2 space-y-1">
                            {perms?.map((perm) => (
                              <label
                                key={perm.key}
                                className="flex items-center gap-2 py-1 cursor-pointer"
                              >
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                                    form.permissions.includes(perm.key)
                                      ? "bg-blue-600 border-blue-600"
                                      : "border-theme-input"
                                  }`}
                                  onClick={() => togglePermission(perm.key)}
                                >
                                  {form.permissions.includes(perm.key) && (
                                    <Check className="w-3 h-3 text-white" />
                                  )}
                                </div>
                                <span className="text-sm text-theme">
                                  {perm.description}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-theme">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? "Salvar" : "Criar Grupo"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-card border border-theme rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-theme mb-2">
              Excluir Grupo?
            </h3>
            <p className="text-sm text-theme-muted mb-4">
              Esta ação não pode ser desfeita. Os membros perderão as permissões
              deste grupo.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteMutation.mutate({ id: deleteConfirm })}
                disabled={deleteMutation.isPending}
                isLoading={deleteMutation.isPending}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
