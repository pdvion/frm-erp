"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  ChevronLeft,
  Building2,
  Plus,
  Edit,
  Users,
  Package,
  Truck,
  Loader2,
  Check,
  Search,
} from "lucide-react";

export default function CompaniesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: companies, isLoading, refetch } = trpc.companies.list.useQuery();

  const createMutation = trpc.companies.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowForm(false);
      resetForm();
    },
  });

  const updateMutation = trpc.companies.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditingId(null);
      resetForm();
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    tradeName: "",
    cnpj: "",
    ie: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      tradeName: "",
      cnpj: "",
      ie: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      email: "",
    });
  };

  const handleEdit = (company: NonNullable<typeof companies>[number]) => {
    setEditingId(company.id);
    setFormData({
      name: company.name,
      tradeName: company.tradeName || "",
      cnpj: company.cnpj || "",
      ie: company.ie || "",
      address: company.address || "",
      city: company.city || "",
      state: company.state || "",
      zipCode: company.zipCode || "",
      phone: company.phone || "",
      email: company.email || "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredCompanies = companies?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.tradeName?.toLowerCase().includes(search.toLowerCase()) ||
    c.cnpj?.includes(search)
  );

  return (
    <div className="space-y-6">
      <header className="bg-theme-card border-b border-theme sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/settings" className="text-theme-muted hover:text-theme-secondary">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-theme">Empresas</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CompanySwitcher />
              <button
                onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Nova Empresa
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Formulário */}
        {showForm && (
          <div className="bg-theme-card rounded-lg border border-theme p-6 mb-6">
            <h2 className="text-lg font-semibold text-theme mb-4">
              {editingId ? "Editar Empresa" : "Nova Empresa"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Razão Social *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-theme-input rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    value={formData.tradeName}
                    onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                    className="w-full border border-theme-input rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    className="w-full border border-theme-input rounded-lg px-3 py-2"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Inscrição Estadual
                  </label>
                  <input
                    type="text"
                    value={formData.ie}
                    onChange={(e) => setFormData({ ...formData, ie: e.target.value })}
                    className="w-full border border-theme-input rounded-lg px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full border border-theme-input rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full border border-theme-input rounded-lg px-3 py-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary mb-1">
                      UF
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full border border-theme-input rounded-lg px-3 py-2"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary mb-1">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      className="w-full border border-theme-input rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-theme-input rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-theme-input rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }}
                  className="px-4 py-2 text-theme-secondary hover:text-theme"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editingId ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Busca */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-theme-muted" />
            <input
              type="text"
              placeholder="Buscar por nome, fantasia ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 outline-none"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : !filteredCompanies?.length ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-theme-muted">Nenhuma empresa encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-theme-table">
                <thead className="bg-theme-tertiary">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Empresa</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">CNPJ</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Usuários</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Materiais</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Fornecedores</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {filteredCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-theme-hover">
                      <td className="px-4 py-3 text-sm font-medium text-theme">
                        #{company.code}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-theme">{company.name}</p>
                          {company.tradeName && (
                            <p className="text-sm text-theme-muted">{company.tradeName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-theme-muted">
                        {company.cnpj || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-sm text-theme-secondary">
                          <Users className="w-4 h-4" />
                          {company._count.users}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-sm text-theme-secondary">
                          <Package className="w-4 h-4" />
                          {company._count.materials}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-sm text-theme-secondary">
                          <Truck className="w-4 h-4" />
                          {company._count.suppliers}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          company.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-theme-tertiary text-theme"
                        }`}>
                          {company.isActive ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(company)}
                            className="p-1 text-theme-muted hover:text-blue-600"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/settings/companies/${company.id}/users`}
                            className="p-1 text-theme-muted hover:text-blue-600"
                            title="Gerenciar Usuários"
                          >
                            <Users className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
