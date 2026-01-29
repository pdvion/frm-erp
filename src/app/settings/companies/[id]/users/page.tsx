"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import {
  Building2,
  ChevronLeft,
  Users,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle,
  UserPlus,
} from "lucide-react";

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
    { enabled: !!companyId }
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
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-theme">Empresa não encontrada</h2>
          <Link href="/settings/companies" className="text-indigo-600 hover:underline mt-2 inline-block">
            Voltar para empresas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="bg-theme-card border-b border-theme sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/settings/companies"
                className="text-theme-muted hover:text-theme-secondary"
                aria-label="Voltar para empresas"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-indigo-600" />
                <div>
                  <h1 className="text-xl font-semibold text-theme">
                    Usuários da Empresa
                  </h1>
                  <p className="text-sm text-theme-muted">{company.tradeName || company.name}</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Vincular Usuário
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800">{success}</p>
            </div>
          </div>
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
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
            </div>
          ) : users && users.length > 0 ? (
            <div className="divide-y divide-theme-table">
              {users.map((userCompany) => (
                <div key={userCompany.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-medium">
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
                    <button
                      onClick={() => handleRemoveUser(userCompany.userId)}
                      disabled={removeUserMutation.isPending}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      aria-label={`Remover ${userCompany.user?.email}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
            <select
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
            </select>
            {availableUsers.length === 0 && (
              <p className="text-sm text-theme-muted mt-1">
                Todos os usuários já estão vinculados a esta empresa.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
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
