"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import {
  Building2,
  Users,
  Trash2,
  Loader2,
  AlertTriangle,
  UserPlus,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { NativeSelect } from "@/components/ui/NativeSelect";

export default function CompanyUsersPage() {
  const params = useParams();
  const companyId = params.id as string;
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // Query para buscar empresa
  const { data: company, isLoading: loadingCompany } = trpc.companies.getById.useQuery(
    { id: companyId },
    { enabled: !!companyId }
  );

  // Query para buscar usuários da empresa
  const { data: users, isLoading: loadingUsers, refetch } = trpc.companies.listUsers.useQuery(
    { companyId },
    { 
      enabled: !!companyId,
      refetchOnMount: true, // VIO-806: Garantir refetch ao navegar entre empresas
    }
  );

  // Query para buscar todos os usuários do sistema (para o select)
  const { data: allUsers } = trpc.users.list.useQuery(
    { limit: 100 },
    { enabled: showAddForm }
  );

  // Mutation para adicionar usuário
  const addUserMutation = trpc.companies.addUser.useMutation({
    onSuccess: () => {
      setSuccess("Usuário vinculado com sucesso!");
      setShowAddForm(false);
      setSelectedUserId("");
      setIsDefault(false);
      refetch();
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err) => {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    },
  });

  // Mutation para remover usuário
  const removeUserMutation = trpc.companies.removeUser.useMutation({
    onSuccess: () => {
      setSuccess("Usuário removido com sucesso!");
      refetch();
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleAddUser = () => {
    if (!selectedUserId) {
      setError("Selecione um usuário");
      return;
    }
    setError(null);
    addUserMutation.mutate({ companyId, userId: selectedUserId, isDefault });
  };

  const handleRemoveUser = (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário da empresa?")) {
      return;
    }
    removeUserMutation.mutate({ companyId, userId });
  };

  // Filtrar usuários que ainda não estão vinculados
  const availableUsers = allUsers?.items.filter(
    (u: { id: string; name: string; email: string }) => !users?.some((uc) => uc.userId === u.id)
  ) || [];

  if (loadingCompany) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-theme">Empresa não encontrada</h2>
          <Link href="/settings/companies" className="text-blue-600 hover:underline mt-2 inline-block">
            Voltar para empresas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários da Empresa"
        subtitle={company.tradeName || company.name}
        icon={<Building2 className="w-6 h-6" />}
        backHref="/settings/companies"
        module="settings"
        actions={
          <Button
            onClick={() => setShowAddForm(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Vincular Usuário
          </Button>
        }
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-6">
            {success}
          </Alert>
        )}

        {/* Lista de Usuários */}
        <div className="bg-theme-card rounded-lg border border-theme">
          <div className="px-6 py-4 border-b border-theme">
            <h2 className="text-lg font-medium text-theme">
              Usuários Vinculados ({users?.length ?? 0})
            </h2>
            <p className="text-sm text-theme-muted mt-1">
              Para adicionar novos usuários, utilize o cadastro de usuários do sistema.
            </p>
          </div>

          {loadingUsers ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            </div>
          ) : users && users.length > 0 ? (
            <div className="divide-y divide-theme-table">
              {users.map((userCompany) => (
                <div key={userCompany.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {userCompany.user?.email?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-theme">
                        {userCompany.user?.name || userCompany.user?.email || "Usuário"}
                      </p>
                      <p className="text-sm text-theme-muted">
                        {userCompany.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      userCompany.isDefault 
                        ? "bg-green-100 text-green-800" 
                        : "bg-theme-tertiary text-theme-secondary"
                    }`}>
                      {userCompany.isDefault ? "Empresa Padrão" : "Vinculado"}
                    </span>
                    <Button
                      onClick={() => handleRemoveUser(userCompany.userId)}
                      disabled={removeUserMutation.isPending}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      aria-label={`Remover ${userCompany.user?.email}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-theme-muted">
              <Users className="w-12 h-12 mx-auto mb-4 text-theme-muted" />
              <p>Nenhum usuário vinculado a esta empresa</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal para Vincular Usuário */}
      <Modal
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setSelectedUserId("");
          setIsDefault(false);
        }}
        title="Vincular Usuário"
        description="Selecione um usuário do sistema para vincular a esta empresa."
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="user-select" className="block text-sm font-medium text-theme-secondary">
              Usuário <span className="text-red-500">*</span>
            </label>
            <NativeSelect
              id="user-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-theme-input rounded-lg text-theme bg-theme-card focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecione um usuário...</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email} {user.name && `(${user.email})`}
                </option>
              ))}
            </NativeSelect>
            {availableUsers.length === 0 && (
              <p className="text-sm text-theme-muted mt-1">
                Todos os usuários já estão vinculados a esta empresa.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="checkbox"
              id="is-default"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-theme-input rounded focus:ring-blue-500"
            />
            <label htmlFor="is-default" className="text-sm text-theme-secondary">
              Definir como empresa padrão para este usuário
            </label>
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowAddForm(false);
              setSelectedUserId("");
              setIsDefault(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddUser}
            isLoading={addUserMutation.isPending}
            disabled={!selectedUserId || availableUsers.length === 0}
          >
            Vincular
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
