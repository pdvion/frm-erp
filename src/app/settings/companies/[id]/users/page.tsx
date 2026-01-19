"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import {
  Building2,
  ChevronLeft,
  Users,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function CompanyUsersPage() {
  const params = useParams();
  const companyId = params.id as string;
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleRemoveUser = (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário da empresa?")) {
      return;
    }
    removeUserMutation.mutate({ companyId, userId });
  };

  if (loadingCompany) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Empresa não encontrada</h2>
          <Link href="/settings/companies" className="text-indigo-600 hover:underline mt-2 inline-block">
            Voltar para empresas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/settings/companies"
                className="text-gray-500 hover:text-gray-700"
                aria-label="Voltar para empresas"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-indigo-600" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Usuários da Empresa
                  </h1>
                  <p className="text-sm text-gray-500">{company.tradeName || company.name}</p>
                </div>
              </div>
            </div>
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
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Usuários Vinculados ({users?.length ?? 0})
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Para adicionar novos usuários, utilize o cadastro de usuários do sistema.
            </p>
          </div>

          {loadingUsers ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
            </div>
          ) : users && users.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {users.map((userCompany) => (
                <div key={userCompany.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-medium">
                        {userCompany.user?.email?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {userCompany.user?.name || userCompany.user?.email || "Usuário"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {userCompany.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      userCompany.isDefault 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-600"
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
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum usuário vinculado a esta empresa</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
