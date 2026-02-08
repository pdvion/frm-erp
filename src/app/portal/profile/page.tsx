"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: profile, isLoading, refetch } =
    trpc.employeePortal.getMyProfile.useQuery();

  const [formData, setFormData] = useState({
    phone: "",
    mobile: "",
    email: "",
    address: "",
    addressCity: "",
    addressState: "",
    addressZipCode: "",
  });

  const updateMutation = trpc.employeePortal.updateMyProfile.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setIsEditing(false);
      refetch();
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleEdit = () => {
    if (profile) {
      setFormData({
        phone: profile.phone || "",
        mobile: profile.mobile || "",
        email: profile.email || "",
        address: profile.address || "",
        addressCity: profile.addressCity || "",
        addressState: profile.addressState || "",
        addressZipCode: profile.addressZipCode || "",
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    setError(null);
    await updateMutation.mutateAsync({
      phone: formData.phone || undefined,
      mobile: formData.mobile || undefined,
      email: formData.email || undefined,
      address: formData.address || undefined,
      addressCity: formData.addressCity || undefined,
      addressState: formData.addressState || undefined,
      addressZipCode: formData.addressZipCode || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-theme-secondary rounded w-1/3" />
          <div className="h-64 bg-theme-secondary rounded" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-yellow-800 dark:text-yellow-200">
            Perfil não encontrado
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Meus Dados"
        icon={<User className="w-6 h-6" />}
        backHref="/portal"
        backLabel="Voltar ao Portal"
        actions={
          !isEditing ? (
            <Button onClick={handleEdit}>Editar Dados</Button>
          ) : undefined
        }
      />

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <CheckCircle className="w-5 h-5" />
            Dados atualizados com sucesso!
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Info (Read-only) */}
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Dados Pessoais
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-theme-muted">
                Nome Completo
              </label>
              <p className="font-medium text-theme">
                {profile.name}
              </p>
            </div>
            <div>
              <label className="text-sm text-theme-muted">
                CPF
              </label>
              <p className="font-medium text-theme">
                {profile.cpf}
              </p>
            </div>
            <div>
              <label className="text-sm text-theme-muted">
                Data de Nascimento
              </label>
              <p className="font-medium text-theme">
                {profile.birthDate != null
                  ? new Date(profile.birthDate).toLocaleDateString("pt-BR")
                  : "Não informado"}
              </p>
            </div>
            <div>
              <label className="text-sm text-theme-muted">
                RG
              </label>
              <p className="font-medium text-theme">
                {profile.rg || "Não informado"}
              </p>
            </div>
          </div>
        </div>

        {/* Employment Info (Read-only) */}
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Dados Profissionais
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-theme-muted">
                Matrícula
              </label>
              <p className="font-medium text-theme">
                {profile.code || "Não informado"}
              </p>
            </div>
            <div>
              <label className="text-sm text-theme-muted">
                Cargo
              </label>
              <p className="font-medium text-theme">
                {profile.position?.name || "Não definido"}
              </p>
            </div>
            <div>
              <label className="text-sm text-theme-muted">
                Departamento
              </label>
              <p className="font-medium text-theme">
                {profile.department?.name || "Não definido"}
              </p>
            </div>
            <div>
              <label className="text-sm text-theme-muted">
                Data de Admissão
              </label>
              <p className="font-medium text-theme">
                {profile.hireDate != null
                  ? new Date(profile.hireDate).toLocaleDateString("pt-BR")
                  : "Não informado"}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info (Editable) */}
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contato
          </h2>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Telefone
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  E-mail Pessoal
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-theme-muted">
                  Telefone
                </label>
                <p className="font-medium text-theme flex items-center gap-2">
                  <Phone className="w-4 h-4 text-theme-muted" />
                  {profile.phone || "Não informado"}
                </p>
              </div>
              <div>
                <label className="text-sm text-theme-muted">
                  E-mail Pessoal
                </label>
                <p className="font-medium text-theme flex items-center gap-2">
                  <Mail className="w-4 h-4 text-theme-muted" />
                  {profile.email || "Não informado"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Address (Editable) */}
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Endereço
          </h2>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Endereço
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Rua, número, complemento"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Cidade
                  </label>
                  <Input
                    value={formData.addressCity}
                    onChange={(e) =>
                      setFormData({ ...formData, addressCity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-1">
                    Estado
                  </label>
                  <Input
                    value={formData.addressState}
                    onChange={(e) =>
                      setFormData({ ...formData, addressState: e.target.value })
                    }
                    maxLength={2}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  CEP
                </label>
                <Input
                  value={formData.addressZipCode}
                  onChange={(e) =>
                    setFormData({ ...formData, addressZipCode: e.target.value })
                  }
                  placeholder="00000-000"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-medium text-theme">
                {profile.address || "Não informado"}
              </p>
              {(profile.addressCity || profile.addressState) && (
                <p className="text-theme-muted">
                  {profile.addressCity}
                  {profile.addressCity && profile.addressState && " - "}
                  {profile.addressState}
                </p>
              )}
              {profile.addressZipCode && (
                <p className="text-theme-muted">
                  CEP: {profile.addressZipCode}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Mobile Contact */}
        <div className="bg-theme-card rounded-lg border border-theme p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Celular
          </h2>
          {isEditing ? (
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">
                Número do Celular
              </label>
              <Input
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mobile: e.target.value,
                  })
                }
                placeholder="(00) 00000-0000"
              />
            </div>
          ) : (
            <div>
              <label className="text-sm text-theme-muted">
                Celular
              </label>
              <p className="font-medium text-theme">
                {profile.mobile || "Não informado"}
              </p>
            </div>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end gap-4">
          <Button
            variant="secondary"
            onClick={() => setIsEditing(false)}
            disabled={updateMutation.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      )}
    </div>
  );
}
