"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Calendar,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Flag,
  MapPin,
  Building2,
} from "lucide-react";
import Link from "next/link";

type HolidayType = "NATIONAL" | "STATE" | "MUNICIPAL" | "COMPANY";

interface NewHoliday {
  date: string;
  name: string;
  type: HolidayType;
  isOptional: boolean;
}

const initialNewHoliday: NewHoliday = {
  date: "",
  name: "",
  type: "COMPANY",
  isOptional: false,
};

export default function HolidaysPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [newHoliday, setNewHoliday] = useState<NewHoliday>(initialNewHoliday);
  const [error, setError] = useState("");

  const { data: holidays, isLoading, refetch } = trpc.timeclock.listHolidays.useQuery({ year });

  const createMutation = trpc.timeclock.createHoliday.useMutation({
    onSuccess: () => {
      setShowModal(false);
      setNewHoliday(initialNewHoliday);
      setError("");
      refetch();
    },
    onError: (err) => setError(err.message),
  });

  const deleteMutation = trpc.timeclock.deleteHoliday.useMutation({
    onSuccess: () => refetch(),
  });

  const handleCreate = () => {
    setError("");

    if (!newHoliday.date) {
      setError("Data é obrigatória");
      return;
    }

    if (!newHoliday.name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    createMutation.mutate({
      date: new Date(newHoliday.date),
      name: newHoliday.name.trim(),
      type: newHoliday.type,
      isOptional: newHoliday.isOptional,
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Deseja excluir o feriado "${name}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  };

  const getTypeBadge = (type: string, isOptional: boolean) => {
    const styles: Record<string, string> = {
      NATIONAL: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
      STATE: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      MUNICIPAL: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
      COMPANY: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
    };
    const labels: Record<string, string> = {
      NATIONAL: "Nacional",
      STATE: "Estadual",
      MUNICIPAL: "Municipal",
      COMPANY: "Empresa",
    };
    const icons: Record<string, React.ReactNode> = {
      NATIONAL: <Flag className="w-3 h-3" />,
      STATE: <MapPin className="w-3 h-3" />,
      MUNICIPAL: <MapPin className="w-3 h-3" />,
      COMPANY: <Building2 className="w-3 h-3" />,
    };
    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${styles[type] || styles.COMPANY}`}>
          {icons[type]}
          {labels[type] || type}
        </span>
        {isOptional && (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-theme-tertiary text-theme-muted">
            Facultativo
          </span>
        )}
      </div>
    );
  };

  const holidayTypes: { value: HolidayType; label: string }[] = [
    { value: "NATIONAL", label: "Nacional" },
    { value: "STATE", label: "Estadual" },
    { value: "MUNICIPAL", label: "Municipal" },
    { value: "COMPANY", label: "Empresa" },
  ];

  // Agrupar feriados por mês
  const holidaysByMonth = holidays?.reduce((acc, h) => {
    const month = new Date(h.date).getMonth();
    if (!acc[month]) acc[month] = [];
    acc[month].push(h);
    return acc;
  }, {} as Record<number, typeof holidays>) || {};

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feriados"
        icon={<Calendar className="w-6 h-6" />}
        module="HR"
        breadcrumbs={[
          { label: "RH", href: "/hr" },
          { label: "Ponto", href: "/hr/timeclock" },
          { label: "Feriados" },
        ]}
        actions={
          <Button
            onClick={() => setShowModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Novo Feriado
          </Button>
        }
      />

      {/* Seletor de ano */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setYear((y) => y - 1)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-2xl font-bold text-theme min-w-[100px] text-center">
            {year}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setYear((y) => y + 1)}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Lista de feriados por mês */}
      {isLoading ? (
        <div className="bg-theme-card border border-theme rounded-lg p-8 text-center text-theme-muted">
          Carregando...
        </div>
      ) : !holidays || holidays.length === 0 ? (
        <div className="bg-theme-card border border-theme rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto text-theme-muted mb-3" />
          <p className="text-theme-muted">Nenhum feriado cadastrado para {year}</p>
          <Button
            variant="ghost"
            onClick={() => setShowModal(true)}
            className="mt-4"
          >
            Adicionar feriado
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(holidaysByMonth)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([month, monthHolidays]) => (
              <div
                key={month}
                className="bg-theme-card border border-theme rounded-lg overflow-hidden"
              >
                <div className="px-4 py-3 bg-theme-secondary border-b border-theme">
                  <h3 className="font-semibold text-theme">{monthNames[Number(month)]}</h3>
                </div>
                <div className="divide-y divide-theme">
                  {monthHolidays?.map((holiday) => (
                    <div
                      key={holiday.id}
                      className="p-4 hover:bg-theme-secondary transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="font-medium text-theme">{holiday.name}</p>
                          <p className="text-sm text-theme-muted capitalize">
                            {formatDate(holiday.date)}
                          </p>
                          {getTypeBadge(holiday.type, holiday.isOptional)}
                        </div>
                        {holiday.type === "COMPANY" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(holiday.id, holiday.name)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Resumo */}
      {holidays && holidays.length > 0 && (
        <div className="bg-theme-card border border-theme rounded-lg p-4">
          <div className="flex flex-wrap gap-6 justify-center text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-theme">{holidays.length}</p>
              <p className="text-theme-muted">Total de feriados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {holidays.filter((h) => h.type === "NATIONAL").length}
              </p>
              <p className="text-theme-muted">Nacionais</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {holidays.filter((h) => h.type === "COMPANY").length}
              </p>
              <p className="text-theme-muted">Empresa</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-theme-muted">
                {holidays.filter((h) => h.isOptional).length}
              </p>
              <p className="text-theme-muted">Facultativos</p>
            </div>
          </div>
        </div>
      )}

      {/* Links */}
      <div className="flex gap-4">
        <Link
          href="/hr/timeclock"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Voltar para Ponto Eletrônico
        </Link>
      </div>

      {/* Modal de novo feriado */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card border border-theme rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-theme mb-4">Novo Feriado</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Data *"
                type="date"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              />

              <Input
                label="Nome *"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                placeholder="Ex: Aniversário da Empresa"
              />

              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Tipo
                </label>
                <Select
                  value={newHoliday.type}
                  onChange={(value) => setNewHoliday({ ...newHoliday, type: value as HolidayType })}
                  options={holidayTypes.map((t) => ({
                    value: t.value,
                    label: t.label,
                  }))}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newHoliday.isOptional}
                  onChange={(e) => setNewHoliday({ ...newHoliday, isOptional: e.target.checked })}
                  className="w-4 h-4 rounded border-theme-input"
                />
                <span className="text-sm text-theme">Ponto facultativo</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setNewHoliday(initialNewHoliday);
                  setError("");
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                isLoading={createMutation.isPending}
                className="flex-1"
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
