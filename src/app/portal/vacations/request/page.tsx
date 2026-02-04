"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Calendar, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function RequestVacationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    startDate: "",
    days: 30,
    sellDays: 0,
    advanceThirteenth: false,
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);

  const { data: vacations } = trpc.employeePortal.getMyVacations.useQuery();

  const requestMutation = trpc.employeePortal.requestVacation.useMutation({
    onSuccess: () => {
      router.push("/portal/vacations");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.startDate) {
      setError("Selecione a data de início");
      return;
    }

    if (formData.days < 5 || formData.days > 30) {
      setError("O período deve ser entre 5 e 30 dias");
      return;
    }

    if (formData.sellDays > 10 || formData.sellDays > Math.floor(formData.days / 3)) {
      setError(`Você pode vender no máximo 10 dias ou 1/3 do período (${Math.floor(formData.days / 3)} dias)`);
      return;
    }

    if (vacations?.balance && formData.days > vacations.balance.available) {
      setError(`Você só tem ${vacations.balance.available} dias disponíveis`);
      return;
    }

    await requestMutation.mutateAsync({
      startDate: formData.startDate,
      days: formData.days,
      sellDays: formData.sellDays,
      advanceThirteenth: formData.advanceThirteenth,
      notes: formData.notes || undefined,
    });
  };

  const calculateEndDate = () => {
    if (!formData.startDate) return "";
    const start = new Date(formData.startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + formData.days - 1);
    return end.toLocaleDateString("pt-BR");
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Solicitar Férias"
        icon={<Calendar className="w-6 h-6" />}
        backHref="/portal/vacations"
        backLabel="Voltar"
      />

      <div className="max-w-2xl">
        {/* Balance Info */}
        {vacations?.balance && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
            <p className="text-purple-800 dark:text-purple-200">
              <strong>Saldo disponível:</strong> {vacations.balance.available} dias
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data de Início *
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  min={(() => {
                    const minDate = new Date();
                    minDate.setDate(minDate.getDate() + 30);
                    return minDate.toISOString().split("T")[0];
                  })()}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantidade de Dias *
                </label>
                <Input
                  type="number"
                  value={formData.days}
                  onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 0 })}
                  min={5}
                  max={30}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Entre 5 e 30 dias</p>
              </div>
            </div>

            {formData.startDate && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Período:</strong> {new Date(formData.startDate).toLocaleDateString("pt-BR")} até{" "}
                  {calculateEndDate()}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vender Dias (Abono Pecuniário)
              </label>
              <Input
                type="number"
                value={formData.sellDays}
                onChange={(e) => setFormData({ ...formData, sellDays: parseInt(e.target.value) || 0 })}
                min={0}
                max={10}
              />
              <p className="text-xs text-gray-500 mt-1">Máximo de 10 dias (1/3 do período)</p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="advanceThirteenth"
                checked={formData.advanceThirteenth}
                onChange={(e) => setFormData({ ...formData, advanceThirteenth: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="advanceThirteenth" className="text-sm text-gray-700 dark:text-gray-300">
                Solicitar adiantamento do 13º salário
              </label>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observações
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Informações adicionais..."
              />
            </div>
          </div>

          <div className="flex justify-between">
            <Link href="/portal/vacations">
              <Button type="button" variant="secondary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <Button type="submit" disabled={requestMutation.isPending}>
              {requestMutation.isPending ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
