"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Users, Plus, Search, Edit2, Trash2, Check, X } from "lucide-react";

interface BrokerFormData {
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
}

export default function BrokersPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BrokerFormData>({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });

  const utils = trpc.useUtils();

  const { data: brokers, isLoading } = trpc.impex.listBrokers.useQuery({
    search: search || undefined,
  });

  const createMutation = trpc.impex.createBroker.useMutation({
    onSuccess: () => {
      utils.impex.listBrokers.invalidate();
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = trpc.impex.updateBroker.useMutation({
    onSuccess: () => {
      utils.impex.listBrokers.invalidate();
      setShowModal(false);
      resetForm();
    },
  });

  const deleteMutation = trpc.impex.deleteBroker.useMutation({
    onSuccess: () => {
      utils.impex.listBrokers.invalidate();
    },
  });

  const resetForm = () => {
    setFormData({ name: "", cnpj: "", email: "", phone: "", address: "", city: "", state: "" });
    setEditingId(null);
  };

  const openEdit = (broker: NonNullable<typeof brokers>[number]) => {
    setFormData({
      name: broker.name,
      cnpj: broker.cnpj,
      email: broker.email || "",
      phone: broker.phone || "",
      address: broker.address || "",
      city: broker.city || "",
      state: broker.state || "",
    });
    setEditingId(broker.id);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
      });
    } else {
      createMutation.mutate({
        ...formData,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
      });
    }
  };

  const formatCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Despachantes Aduaneiros"
        icon={<Users className="w-6 h-6" />}
        module="PURCHASES"
        breadcrumbs={[
          { label: "ImpEx", href: "/impex" },
          { label: "Despachantes" },
        ]}
        actions={
          <Button
            onClick={() => { resetForm(); setShowModal(true); }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Novo Despachante
          </Button>
        }
      />

      {/* Filtros */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou CNPJ..."
            className="w-full pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-theme-secondary">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">Código</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">Nome</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">CNPJ</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">Contato</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">Status</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-theme-muted">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-theme-muted">Carregando...</td>
              </tr>
            ) : !brokers?.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-theme-muted">Nenhum despachante encontrado</td>
              </tr>
            ) : (
              brokers.map((broker) => (
                <tr key={broker.id} className="hover:bg-theme-secondary">
                  <td className="px-4 py-3 font-mono text-theme">{broker.code}</td>
                  <td className="px-4 py-3 font-medium text-theme">{broker.name}</td>
                  <td className="px-4 py-3 font-mono text-sm text-theme">{formatCnpj(broker.cnpj)}</td>
                  <td className="px-4 py-3 text-sm text-theme-muted">
                    {broker.email && <div>{broker.email}</div>}
                    {broker.phone && <div>{broker.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {broker.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                        <Check className="w-3 h-3" /> Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                        <X className="w-3 h-3" /> Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(broker)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Excluir este despachante?")) {
                            deleteMutation.mutate({ id: broker.id });
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card border border-theme rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-theme mb-4">
              {editingId ? "Editar Despachante" : "Novo Despachante"}
            </h3>
            <div className="space-y-4">
              <Input
                label="Nome *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                label="CNPJ *"
                value={formatCnpj(formData.cnpj)}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value.replace(/\D/g, "") })}
                placeholder="00.000.000/0000-00"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Input
                  label="Telefone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <Input
                label="Endereço"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Cidade"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <Input
                  label="Estado"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  maxLength={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2 border border-theme rounded-lg text-theme hover:bg-theme-secondary"
              >
                Cancelar
              </button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.cnpj}
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
