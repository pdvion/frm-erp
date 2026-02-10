"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { fetchCompanyByCnpj, mapCnpjToCompanyForm, isValidCnpjFormat, formatCnpj } from "@/lib/address/cnpj";
import { fetchAddressByCep, isValidCep, formatCep } from "@/lib/address/viacep";
import {
  Building2,
  Plus,
  Edit,
  Users,
  Package,
  Truck,
  Loader2,
  Check,
  Search,
  Rocket,
} from "lucide-react";
import { NativeSelect } from "@/components/ui/NativeSelect";

export default function CompaniesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

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
    addressNumber: "",
    addressComplement: "",
    neighborhood: "",
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
      addressNumber: "",
      addressComplement: "",
      neighborhood: "",
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
      addressNumber: company.addressNumber || "",
      addressComplement: company.addressComplement || "",
      neighborhood: company.neighborhood || "",
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

  const handleCnpjLookup = useCallback(async () => {
    const cleanCnpj = formatCnpj(formData.cnpj);
    if (!isValidCnpjFormat(cleanCnpj)) {
      toast.error("CNPJ inválido", { description: "Digite um CNPJ com 14 dígitos." });
      return;
    }
    setIsLoadingCnpj(true);
    try {
      const result = await fetchCompanyByCnpj(cleanCnpj);
      if (result.success && result.data) {
        const mapped = mapCnpjToCompanyForm(result.data);
        setFormData((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(mapped).filter(([, v]) => v !== "" && v !== 0)
          ),
        }));
        toast.success("Dados preenchidos pelo CNPJ");
      } else {
        toast.error("Erro ao consultar CNPJ", { description: result.error });
      }
    } catch {
      toast.error("Erro ao consultar CNPJ");
    } finally {
      setIsLoadingCnpj(false);
    }
  }, [formData.cnpj]);

  const handleCepLookup = useCallback(async () => {
    const cleanCep = formatCep(formData.zipCode);
    if (!isValidCep(cleanCep)) {
      toast.error("CEP inválido", { description: "Digite um CEP com 8 dígitos." });
      return;
    }
    setIsLoadingCep(true);
    try {
      const result = await fetchAddressByCep(cleanCep);
      if (result.success && result.data) {
        setFormData((prev) => ({
          ...prev,
          address: result.data!.street || prev.address,
          neighborhood: result.data!.neighborhood || prev.neighborhood,
          city: result.data!.city || prev.city,
          state: result.data!.state || prev.state,
          zipCode: result.data!.zipCode || prev.zipCode,
        }));
        toast.success("Endereço preenchido pelo CEP");
      } else {
        toast.error("Erro ao consultar CEP", { description: result.error });
      }
    } catch {
      toast.error("Erro ao consultar CEP");
    } finally {
      setIsLoadingCep(false);
    }
  }, [formData.zipCode]);

  const filteredCompanies = companies?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.tradeName?.toLowerCase().includes(search.toLowerCase()) ||
    c.cnpj?.includes(search)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas"
        subtitle="Gerenciar empresas do grupo"
        icon={<Building2 className="w-6 h-6" />}
        backHref="/settings"
        module="settings"
        actions={
          <Button
            onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nova Empresa
          </Button>
        }
      />

      <div>
        {/* Formulário */}
        {showForm && (
          <div className="bg-theme-card rounded-lg border border-theme p-6 mb-6">
            <h2 className="text-lg font-semibold text-theme mb-4">
              {editingId ? "Editar Empresa" : "Nova Empresa"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Razão Social *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="Nome Fantasia"
                  value={formData.tradeName}
                  onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                />
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      label="CNPJ"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCnpjLookup}
                    isLoading={isLoadingCnpj}
                    className="mb-0.5"
                  >
                    Buscar
                  </Button>
                </div>
                <Input
                  label="Inscrição Estadual"
                  value={formData.ie}
                  onChange={(e) => setFormData({ ...formData, ie: e.target.value })}
                />
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      label="CEP"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value.replace(/\D/g, "") })}
                      placeholder="00000-000"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCepLookup}
                    isLoading={isLoadingCep}
                    className="mb-0.5"
                  >
                    Buscar
                  </Button>
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Logradouro"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <Input
                  label="Número"
                  value={formData.addressNumber}
                  onChange={(e) => setFormData({ ...formData, addressNumber: e.target.value })}
                />
                <Input
                  label="Complemento"
                  value={formData.addressComplement}
                  onChange={(e) => setFormData({ ...formData, addressComplement: e.target.value })}
                />
                <Input
                  label="Bairro"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                />
                <Input
                  label="Cidade"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    UF
                  </label>
                  <NativeSelect
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full border border-theme-input rounded-lg px-3 py-2 bg-theme-card text-theme"
                  >
                    <option value="">Selecione...</option>
                    <option value="AC">AC - Acre</option>
                    <option value="AL">AL - Alagoas</option>
                    <option value="AP">AP - Amapá</option>
                    <option value="AM">AM - Amazonas</option>
                    <option value="BA">BA - Bahia</option>
                    <option value="CE">CE - Ceará</option>
                    <option value="DF">DF - Distrito Federal</option>
                    <option value="ES">ES - Espírito Santo</option>
                    <option value="GO">GO - Goiás</option>
                    <option value="MA">MA - Maranhão</option>
                    <option value="MT">MT - Mato Grosso</option>
                    <option value="MS">MS - Mato Grosso do Sul</option>
                    <option value="MG">MG - Minas Gerais</option>
                    <option value="PA">PA - Pará</option>
                    <option value="PB">PB - Paraíba</option>
                    <option value="PR">PR - Paraná</option>
                    <option value="PE">PE - Pernambuco</option>
                    <option value="PI">PI - Piauí</option>
                    <option value="RJ">RJ - Rio de Janeiro</option>
                    <option value="RN">RN - Rio Grande do Norte</option>
                    <option value="RS">RS - Rio Grande do Sul</option>
                    <option value="RO">RO - Rondônia</option>
                    <option value="RR">RR - Roraima</option>
                    <option value="SC">SC - Santa Catarina</option>
                    <option value="SP">SP - São Paulo</option>
                    <option value="SE">SE - Sergipe</option>
                    <option value="TO">TO - Tocantins</option>
                  </NativeSelect>
                </div>
                <Input
                  label="Telefone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Input
                  label="E-mail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  {editingId ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Busca */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-theme-muted" />
            <Input
              type="text"
              placeholder="Buscar por nome, fantasia ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 outline-none bg-transparent text-theme placeholder:text-theme-muted"
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
              <Building2 className="w-12 h-12 mx-auto text-theme-muted mb-4" />
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
                        <Badge variant={company.isActive ? "success" : "default"}>
                          {company.isActive ? "Ativa" : "Inativa"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(company)}
                            className="text-theme-muted hover:text-blue-600"
                            title="Editar"
                            aria-label="Editar empresa"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Link
                            href={`/settings/companies/${company.id}/users`}
                            className="p-1 text-theme-muted hover:text-blue-600"
                            title="Gerenciar Usuários"
                          >
                            <Users className="w-4 h-4" />
                          </Link>
                          <Link
                            href="/setup/deploy-agent"
                            className="p-1 text-theme-muted hover:text-purple-600"
                            title="Configurar via Deploy Agent"
                          >
                            <Rocket className="w-4 h-4" />
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
      </div>
    </div>
  );
}
