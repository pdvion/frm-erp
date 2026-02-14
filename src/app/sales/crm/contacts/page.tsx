"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Select } from "@/components/ui/Select";
import {
  Users,
  Search,
  Loader2,
  Plus,
  Mail,
  Phone,
  Smartphone,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formIsPrimary, setFormIsPrimary] = useState(false);

  const utils = trpc.useUtils();

  const { data: customers } = trpc.customers.list.useQuery({ limit: 200 });

  const { data, isLoading, isError, error } = trpc.crm.listContacts.useQuery({
    search: search || undefined,
    customerId: customerFilter !== "ALL" ? customerFilter : undefined,
    page,
    limit: 20,
  });

  const createMutation = trpc.crm.createContact.useMutation({
    onSuccess: () => {
      utils.crm.listContacts.invalidate();
      resetForm();
    },
    onError: (err) => {
      alert(`Erro ao criar contato: ${err.message}`);
    },
  });

  const resetForm = () => {
    setShowCreate(false);
    setFormCustomerId("");
    setFormName("");
    setFormRole("");
    setFormDepartment("");
    setFormEmail("");
    setFormPhone("");
    setFormMobile("");
    setFormIsPrimary(false);
  };

  const handleCreate = () => {
    if (!formCustomerId || !formName.trim()) return;
    createMutation.mutate({
      customerId: formCustomerId,
      name: formName.trim(),
      role: formRole.trim() || undefined,
      department: formDepartment.trim() || undefined,
      email: formEmail.trim() || undefined,
      phone: formPhone.trim() || undefined,
      mobile: formMobile.trim() || undefined,
      isPrimary: formIsPrimary,
    });
  };

  const customerOptions = [
    { value: "ALL", label: "Todos os clientes" },
    ...(customers?.customers?.map((c: { id: string; companyName: string }) => ({
      value: c.id,
      label: c.companyName,
    })) ?? []),
  ];

  const customerFormOptions =
    customers?.customers?.map((c: { id: string; companyName: string }) => ({
      value: c.id,
      label: c.companyName,
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contatos"
        icon={<Users className="w-6 h-6" />}
        backHref="/sales/crm"
        module="sales"
        actions={
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Contato
          </Button>
        }
      />

      {/* Filters */}
      <div className="bg-theme-card rounded-lg border border-theme p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
          <div className="w-full md:w-64">
            <Select
              value={customerFilter}
              onChange={(v) => { setCustomerFilter(v); setPage(1); }}
              options={customerOptions}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : isError ? (
          <div className="p-6">
            <Alert variant="error" title="Erro ao carregar contatos">{error.message}</Alert>
          </div>
        ) : !data?.items.length ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-theme-muted mb-4" />
            <p className="text-theme-muted">Nenhum contato encontrado</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-theme-table-header border-b border-theme">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Cargo / Depto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Contato</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Principal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {data.items.map((contact) => (
                    <tr key={contact.id} className="hover:bg-theme-table-hover transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-theme">{contact.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-theme-secondary">
                          <Building2 className="w-4 h-4 text-theme-muted" />
                          {contact.customer?.companyName ?? "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-theme">{contact.role ?? "—"}</div>
                        {contact.department && (
                          <div className="text-xs text-theme-muted">{contact.department}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {contact.email && (
                            <div className="flex items-center gap-1 text-sm text-theme-secondary">
                              <Mail className="w-3 h-3 text-theme-muted" />
                              {contact.email}
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-1 text-sm text-theme-secondary">
                              <Phone className="w-3 h-3 text-theme-muted" />
                              {contact.phone}
                            </div>
                          )}
                          {contact.mobile && (
                            <div className="flex items-center gap-1 text-sm text-theme-secondary">
                              <Smartphone className="w-3 h-3 text-theme-muted" />
                              {contact.mobile}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {contact.isPrimary && <Badge variant="info">Principal</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                <div className="text-sm text-theme-muted">
                  Página {page} de {data.pagination.totalPages} ({data.pagination.total} contatos)
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setPage(page - 1)} disabled={page === 1}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setPage(page + 1)} disabled={page === data.pagination.totalPages}>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Contact Modal */}
      <Modal isOpen={showCreate} onClose={resetForm} title="Novo Contato">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Cliente *</label>
            <Select
              value={formCustomerId}
              onChange={(v) => setFormCustomerId(v)}
              options={customerFormOptions}
              placeholder="Selecione o cliente"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Nome *</label>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome do contato" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Cargo</label>
              <Input value={formRole} onChange={(e) => setFormRole(e.target.value)} placeholder="Ex: Diretor" />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Departamento</label>
              <Input value={formDepartment} onChange={(e) => setFormDepartment(e.target.value)} placeholder="Ex: Compras" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-theme mb-1">Email</label>
            <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@empresa.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Telefone</label>
              <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="(11) 3333-4444" />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Celular</label>
              <Input value={formMobile} onChange={(e) => setFormMobile(e.target.value)} placeholder="(11) 99999-8888" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrimary"
              checked={formIsPrimary}
              onChange={(e) => setFormIsPrimary(e.target.checked)}
              className="rounded border-theme"
            />
            <label htmlFor="isPrimary" className="text-sm text-theme">Contato principal</label>
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={resetForm}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            isLoading={createMutation.isPending}
            disabled={!formCustomerId || !formName.trim()}
          >
            Criar Contato
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
