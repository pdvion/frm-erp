"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { Button } from "@/components/ui/Button";
import {
  Users,
  Plus,
  Search,
  UserCheck,
  UserX,
  MoreVertical,
  Shield,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { NativeSelect } from "@/components/ui/NativeSelect";

type StatusFilter = "all" | "active" | "inactive";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = trpc.users.list.useQuery({
    search: search || undefined,
    status,
    page,
    limit: 20,
  });

  const { data: stats } = trpc.users.stats.useQuery();
  const { data: groups } = trpc.groups.list.useQuery();

  const deactivateMutation = trpc.users.deactivate.useMutation({
    onSuccess: () => refetch(),
  });

  const activateMutation = trpc.users.activate.useMutation({
    onSuccess: () => refetch(),
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <UserCheck className="w-3 h-3" />
          Ativo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <UserX className="w-3 h-3" />
        Inativo
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        icon={<Users className="w-6 h-6" />}
        module="SETTINGS"
        breadcrumbs={[
          { label: "Configurações", href: "/settings" },
          { label: "Usuários" },
        ]}
        actions={
          <LinkButton href="/settings/users/new" leftIcon={<Plus className="w-4 h-4" />}>
            Convidar Usuário
          </LinkButton>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-theme-card border border-theme rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-theme-muted">Total de Usuários</p>
              <p className="text-2xl font-semibold text-theme">
                {stats?.total ?? 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-theme-card border border-theme rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-theme-muted">Ativos</p>
              <p className="text-2xl font-semibold text-theme">
                {stats?.active ?? 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-theme-card border border-theme rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <UserX className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-theme-muted">Inativos</p>
              <p className="text-2xl font-semibold text-theme">
                {stats?.inactive ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <Input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <NativeSelect
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter);
              setPage(1);
            }}
            className="px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </NativeSelect>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-theme-table-header border-b border-theme">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                Usuário
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                E-mail
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                Grupos
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-table">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-theme-muted">
                  Carregando...
                </td>
              </tr>
            ) : data?.items?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-theme-muted">
                  Nenhum usuário encontrado
                </td>
              </tr>
            ) : (
              data?.items?.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-theme-table-hover transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium text-sm">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="font-medium text-theme">{user.name}</p>
                        {user.code && (
                          <p className="text-xs text-theme-muted">
                            Código: {user.code}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-theme">
                      <Mail className="w-4 h-4 text-theme-muted" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.groups.length === 0 ? (
                        <span className="text-sm text-theme-muted">
                          Sem grupos
                        </span>
                      ) : (
                        user.groups.slice(0, 2).map((group) => (
                          <span
                            key={group.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-theme-secondary text-theme"
                          >
                            <Shield className="w-3 h-3" />
                            {group.name}
                          </span>
                        ))
                      )}
                      {user.groups.length > 2 && (
                        <span className="text-xs text-theme-muted">
                          +{user.groups.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(user.isActive)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/settings/users/${user.id}`}
                        className="p-2 hover:bg-theme-secondary rounded-lg transition-colors"
                        title="Ver detalhes"
                      >
                        <MoreVertical className="w-4 h-4 text-theme-muted" />
                      </Link>
                      {user.isActive ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            deactivateMutation.mutate({ id: user.id })
                          }
                          title="Desativar"
                          className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            activateMutation.mutate({ id: user.id })
                          }
                          title="Reativar"
                          className="text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"
                        >
                          <UserCheck className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-theme flex items-center justify-between">
            <p className="text-sm text-theme-muted">
              Mostrando {(page - 1) * 20 + 1} a{" "}
              {Math.min(page * 20, data.pagination.total)} de{" "}
              {data.pagination.total} usuários
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((p) => Math.min(data.pagination.totalPages, p + 1))
                }
                disabled={page === data.pagination.totalPages}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/settings/groups"
          className="bg-theme-card border border-theme rounded-lg p-4 hover:border-blue-500 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-theme group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Grupos de Permissões
              </p>
              <p className="text-sm text-theme-muted">
                {groups?.length ?? 0} grupos configurados
              </p>
            </div>
          </div>
        </Link>
        <Link
          href="/settings/email-integration"
          className="bg-theme-card border border-theme rounded-lg p-4 hover:border-blue-500 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Mail className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="font-medium text-theme group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Integração de E-mail
              </p>
              <p className="text-sm text-theme-muted">
                Configurar envio de convites
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
