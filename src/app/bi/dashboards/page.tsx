"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  LayoutDashboard,
  Plus,
  Star,
  Globe,
  Lock,
  Eye,
  Pencil,
  LayoutGrid,
  User,
} from "lucide-react";
import Link from "next/link";

export default function BIDashboardsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDashboard, setNewDashboard] = useState({
    name: "",
    description: "",
    isDefault: false,
    isPublic: false,
  });

  const { data: dashboards, isLoading, refetch } = trpc.bi.listDashboards.useQuery();

  const createMutation = trpc.bi.createDashboard.useMutation({
    onSuccess: () => {
      setShowCreateModal(false);
      setNewDashboard({ name: "", description: "", isDefault: false, isPublic: false });
      refetch();
    },
  });

  const handleCreate = () => {
    if (!newDashboard.name.trim()) return;
    createMutation.mutate(newDashboard);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboards"
        icon={<LayoutDashboard className="w-6 h-6" />}
        module="BI"
        breadcrumbs={[
          { label: "BI", href: "/bi" },
          { label: "Dashboards" },
        ]}
        actions={
          <Button
            onClick={() => setShowCreateModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Novo Dashboard
          </Button>
        }
      />

      {/* Lista de Dashboards */}
      {isLoading ? (
        <div className="bg-theme-card border border-theme rounded-lg p-8 text-center text-theme-muted">
          Carregando...
        </div>
      ) : !dashboards || dashboards.length === 0 ? (
        <div className="bg-theme-card border border-theme rounded-lg p-8 text-center">
          <LayoutDashboard className="w-12 h-12 mx-auto text-theme-muted mb-3" />
          <p className="text-theme-muted">Nenhum dashboard criado</p>
          <Button
            variant="ghost"
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-blue-600 dark:text-blue-400"
          >
            Criar primeiro dashboard
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboards.map((dashboard) => (
            <div
              key={dashboard.id}
              className="bg-theme-card border border-theme rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-4 border-b border-theme">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-theme">{dashboard.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {dashboard.isDefault && (
                      <span className="p-1 text-yellow-500" title="Dashboard padrão">
                        <Star className="w-4 h-4 fill-current" />
                      </span>
                    )}
                    {dashboard.isPublic ? (
                      <span className="p-1 text-green-500" title="Público">
                        <Globe className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="p-1 text-theme-muted" title="Privado">
                        <Lock className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
                {dashboard.description && (
                  <p className="text-sm text-theme-muted mt-2 line-clamp-2">
                    {dashboard.description}
                  </p>
                )}
              </div>

              <div className="p-4 bg-theme-secondary">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-theme-muted">
                    <span className="flex items-center gap-1">
                      <LayoutGrid className="w-4 h-4" />
                      {dashboard._count.widgets} widgets
                    </span>
                    {dashboard.creator && (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {dashboard.creator.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Link href={`/bi/dashboards/${dashboard.id}`} className="flex-1">
                    <Button size="sm" leftIcon={<Eye className="w-4 h-4" />} className="w-full">
                      Visualizar
                    </Button>
                  </Link>
                  <Link
                    href={`/bi/dashboards/${dashboard.id}/edit`}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 border border-theme rounded-lg text-theme hover:bg-theme-secondary text-sm transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Links */}
      <div className="flex gap-4">
        <Link
          href="/bi"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Voltar para BI
        </Link>
      </div>

      {/* Modal de criação */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card border border-theme rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-theme mb-4">Novo Dashboard</h3>

            <div className="space-y-4">
              <Input
                label="Nome *"
                value={newDashboard.name}
                onChange={(e) => setNewDashboard({ ...newDashboard, name: e.target.value })}
                placeholder="Ex: Dashboard de Vendas"
              />

              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Descrição
                </label>
                <Textarea
                  value={newDashboard.description}
                  onChange={(e) => setNewDashboard({ ...newDashboard, description: e.target.value })}
                  rows={2}
                  placeholder="Descrição opcional..."
                />
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isDefault"
                    checked={newDashboard.isDefault}
                    onChange={(checked) => setNewDashboard({ ...newDashboard, isDefault: checked })}
                  />
                  <label htmlFor="isDefault" className="text-sm text-theme cursor-pointer">Dashboard padrão</label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isPublic"
                    checked={newDashboard.isPublic}
                    onChange={(checked) => setNewDashboard({ ...newDashboard, isPublic: checked })}
                  />
                  <label htmlFor="isPublic" className="text-sm text-theme cursor-pointer">Público</label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewDashboard({ name: "", description: "", isDefault: false, isPublic: false });
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newDashboard.name.trim()}
                isLoading={createMutation.isPending}
                className="flex-1"
              >
                Criar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
