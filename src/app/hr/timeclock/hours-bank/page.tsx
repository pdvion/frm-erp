"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/Input";
import {
  Clock,
  Plus,
  Minus,
  TrendingUp,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { Select } from "@/components/ui/Select";
import { Modal, ModalFooter } from "@/components/ui/Modal";

type EntryType = "CREDIT" | "DEBIT" | "COMPENSATION" | "EXPIRATION" | "ADJUSTMENT";

export default function HoursBankPage() {
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [employeeSearch, setEmployeeSearch] = useState("");

  const { data, isLoading, refetch } = trpc.timeclock.listHoursBank.useQuery({
    page,
    limit: 20,
  });

  const { data: employees } = trpc.hr.listEmployees.useQuery({
    search: employeeSearch || undefined,
    status: "ACTIVE",
  });

  const addEntryMutation = trpc.timeclock.addHoursBankEntry.useMutation({
    onSuccess: () => {
      setShowAddModal(false);
      setNewEntry(initialNewEntry);
      refetch();
    },
  });

  const [newEntry, setNewEntry] = useState({
    employeeId: "",
    type: "CREDIT" as EntryType,
    date: new Date().toISOString().split("T")[0],
    hours: 0,
    description: "",
  });

  const initialNewEntry = {
    employeeId: "",
    type: "CREDIT" as EntryType,
    date: new Date().toISOString().split("T")[0],
    hours: 0,
    description: "",
  };

  const handleAddEntry = () => {
    if (!newEntry.employeeId || newEntry.hours === 0) return;

    const hoursValue = newEntry.type === "DEBIT" || newEntry.type === "COMPENSATION" || newEntry.type === "EXPIRATION"
      ? -Math.abs(newEntry.hours)
      : Math.abs(newEntry.hours);

    addEntryMutation.mutate({
      employeeId: newEntry.employeeId,
      type: newEntry.type,
      date: new Date(newEntry.date),
      hours: hoursValue,
      description: newEntry.description || undefined,
    });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatHours = (hours: number) => {
    const absHours = Math.abs(hours);
    const h = Math.floor(absHours);
    const m = Math.round((absHours - h) * 60);
    const sign = hours >= 0 ? "+" : "-";
    return `${sign}${h}h${m.toString().padStart(2, "0")}min`;
  };

  const formatBalance = (hours: number) => {
    const absHours = Math.abs(hours);
    const h = Math.floor(absHours);
    const m = Math.round((absHours - h) * 60);
    return `${hours >= 0 ? "" : "-"}${h}h${m.toString().padStart(2, "0")}min`;
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      CREDIT: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
      DEBIT: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
      COMPENSATION: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      EXPIRATION: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
      ADJUSTMENT: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    };
    const labels: Record<string, string> = {
      CREDIT: "Crédito",
      DEBIT: "Débito",
      COMPENSATION: "Compensação",
      EXPIRATION: "Expiração",
      ADJUSTMENT: "Ajuste",
    };
    const icons: Record<string, React.ReactNode> = {
      CREDIT: <Plus className="w-3 h-3" />,
      DEBIT: <Minus className="w-3 h-3" />,
      COMPENSATION: <Clock className="w-3 h-3" />,
      EXPIRATION: <AlertTriangle className="w-3 h-3" />,
      ADJUSTMENT: <TrendingUp className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${styles[type] || styles.CREDIT}`}>
        {icons[type]}
        {labels[type] || type}
      </span>
    );
  };

  const entryTypes: { value: EntryType; label: string }[] = [
    { value: "CREDIT", label: "Crédito (Horas Extras)" },
    { value: "DEBIT", label: "Débito (Falta/Atraso)" },
    { value: "COMPENSATION", label: "Compensação" },
    { value: "ADJUSTMENT", label: "Ajuste Manual" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banco de Horas"
        icon={<Clock className="w-6 h-6" />}
        module="HR"
        breadcrumbs={[
          { label: "RH", href: "/hr" },
          { label: "Ponto", href: "/hr/timeclock" },
          { label: "Banco de Horas" },
        ]}
        actions={
          <Button
            onClick={() => setShowAddModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Lançamento
          </Button>
        }
      />

      {/* Tabela de movimentações */}
      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        <div className="p-4 border-b border-theme">
          <h2 className="text-lg font-semibold text-theme">Movimentações do Banco de Horas</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-theme-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                  Tipo
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-theme-muted">
                  Horas
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-theme-muted">
                  Saldo
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-muted">
                  Descrição
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-theme-muted">
                    Carregando...
                  </td>
                </tr>
              ) : !data?.entries || data.entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-theme-muted">
                    Nenhuma movimentação encontrada
                  </td>
                </tr>
              ) : (
                data.entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-theme-secondary transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-theme-muted" />
                        <span className="text-theme">{formatDate(entry.date)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getTypeBadge(entry.type)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-medium ${
                          Number(entry.hours) >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatHours(Number(entry.hours))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-bold ${
                          Number(entry.balance) >= 0
                            ? "text-theme"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatBalance(Number(entry.balance))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-theme-muted">
                      {entry.description || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
            <p className="text-sm text-theme-muted">
              Página {page} de {data.pages} ({data.total} registros)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Links */}
      <div className="flex gap-4">
        <Link
          href="/hr/timeclock"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Voltar para Ponto Eletrônico
        </Link>
      </div>

      {/* Modal de novo lançamento */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setNewEntry(initialNewEntry); setSelectedEmployee(""); setEmployeeSearch(""); }}
        title="Novo Lançamento no Banco de Horas"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme mb-1">
              Funcionário *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <Input
                type="text"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder="Buscar funcionário..."
                className="w-full pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
              />
            </div>
            {employees?.employees && employees.employees.length > 0 && employeeSearch && (
              <div className="mt-1 max-h-32 overflow-auto border border-theme rounded-lg bg-theme-card">
                {employees.employees.map((emp) => (
                  <Button
                    key={emp.id}
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setNewEntry({ ...newEntry, employeeId: emp.id });
                      setSelectedEmployee(emp.name);
                      setEmployeeSearch("");
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-theme-secondary text-theme text-sm justify-start h-auto rounded-none"
                  >
                    {emp.name} ({emp.code})
                  </Button>
                ))}
              </div>
            )}
            {selectedEmployee && (
              <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                Selecionado: {selectedEmployee}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-theme mb-1">Tipo *</label>
            <Select
              value={newEntry.type}
              onChange={(value) => setNewEntry({ ...newEntry, type: value as EntryType })}
              options={entryTypes.map((t) => ({ value: t.value, label: t.label }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Data *"
              type="date"
              value={newEntry.date}
              onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
            />
            <Input
              label="Horas *"
              type="number"
              step={0.5}
              min={0}
              value={newEntry.hours}
              onChange={(e) => setNewEntry({ ...newEntry, hours: parseFloat(e.target.value) || 0 })}
              placeholder="Ex: 2.5"
            />
          </div>

          <Input
            label="Descrição"
            value={newEntry.description}
            onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
            placeholder="Ex: Hora extra projeto X"
          />

          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => { setShowAddModal(false); setNewEntry(initialNewEntry); setSelectedEmployee(""); setEmployeeSearch(""); }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddEntry}
              disabled={!newEntry.employeeId || newEntry.hours === 0}
              isLoading={addEntryMutation.isPending}
            >
              Salvar
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}
