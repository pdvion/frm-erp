"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/PageHeader";
import {
  Clock,
  LogIn,
  LogOut,
  Coffee,
  MapPin,
  CheckCircle2,
  AlertCircle,
  User,
  Calendar,
} from "lucide-react";

// Tipos de registro de ponto
const punchTypes = [
  { value: "ENTRY", label: "Entrada", icon: LogIn, color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
  { value: "BREAK_START", label: "Saída Intervalo", icon: Coffee, color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30" },
  { value: "BREAK_END", label: "Retorno Intervalo", icon: Coffee, color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30" },
  { value: "EXIT", label: "Saída", icon: LogOut, color: "text-red-600 bg-red-100 dark:bg-red-900/30" },
] as const;

type PunchType = typeof punchTypes[number]["value"];

// Mapeamento de tipos do frontend para backend
const typeMapping: Record<PunchType, "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END"> = {
  ENTRY: "CLOCK_IN",
  EXIT: "CLOCK_OUT",
  BREAK_START: "BREAK_START",
  BREAK_END: "BREAK_END",
};

const reverseTypeMapping: Record<string, PunchType> = {
  CLOCK_IN: "ENTRY",
  CLOCK_OUT: "EXIT",
  BREAK_START: "BREAK_START",
  BREAK_END: "BREAK_END",
};

export default function TimesheetRegisterPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedType, setSelectedType] = useState<PunchType | null>(null);
  const [registered, setRegistered] = useState(false);
  
  // Buscar funcionário atual (simplificado - em produção viria do contexto de auth)
  const { data: employeesData } = trpc.hr.listEmployees.useQuery({ limit: 1 });
  const currentEmployee = employeesData?.employees?.[0];
  
  // Buscar marcações do dia
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data: entriesData, refetch } = trpc.timeclock.listEntries.useQuery({
    employeeId: currentEmployee?.id,
    startDate: today,
    endDate: new Date(),
    limit: 10,
  }, { enabled: !!currentEmployee?.id });
  
  // Mutation para registrar ponto
  const clockInMutation = trpc.timeclock.clockIn.useMutation({
    onSuccess: () => {
      setRegistered(true);
      refetch();
      setTimeout(() => setRegistered(false), 3000);
    },
  });
  
  // Mapear entradas do backend para o formato esperado
  const punches = React.useMemo(() => 
    entriesData?.entries?.map((e) => ({
      time: new Date(e.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      type: reverseTypeMapping[e.type] || "ENTRY" as PunchType,
      location: e.location || "Escritório Principal",
    })) || []
  , [entriesData?.entries]);

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determinar próximo tipo de ponto baseado nos registros
  useEffect(() => {
    if (punches.length === 0) {
      setSelectedType("ENTRY");
    } else {
      const lastPunch = punches[punches.length - 1];
      switch (lastPunch.type) {
        case "ENTRY":
          setSelectedType("BREAK_START");
          break;
        case "BREAK_START":
          setSelectedType("BREAK_END");
          break;
        case "BREAK_END":
          setSelectedType("EXIT");
          break;
        case "EXIT":
          setSelectedType("ENTRY");
          break;
      }
    }
  }, [punches]);

  const handleRegister = () => {
    if (!selectedType || !currentEmployee?.id) return;
    
    clockInMutation.mutate({
      employeeId: currentEmployee.id,
      type: typeMapping[selectedType],
      location: "Escritório Principal",
    });
  };
  
  const isRegistering = clockInMutation.isPending;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getPunchTypeInfo = (type: PunchType) => {
    return punchTypes.find((p) => p.value === type)!;
  };

  // Calcular horas trabalhadas
  const calculateWorkedHours = () => {
    if (punches.length < 2) return "0h 0min";
    
    let totalMinutes = 0;
    let entryTime: Date | null = null;
    
    for (const punch of punches) {
      const [hours, minutes] = punch.time.split(":").map(Number);
      const punchDate = new Date();
      punchDate.setHours(hours, minutes, 0);
      
      if (punch.type === "ENTRY" || punch.type === "BREAK_END") {
        entryTime = punchDate;
      } else if ((punch.type === "BREAK_START" || punch.type === "EXIT") && entryTime) {
        totalMinutes += (punchDate.getTime() - entryTime.getTime()) / (1000 * 60);
        entryTime = null;
      }
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.floor(totalMinutes % 60);
    return `${hours}h ${mins}min`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registrar Ponto"
        subtitle="Registro eletrônico de ponto"
        icon={<Clock className="w-6 h-6" />}
        module="HR"
        backHref="/hr/timesheet"
        backLabel="Voltar"
      />

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Relógio Digital */}
        <div className="bg-theme-card border border-theme rounded-xl p-8 text-center">
          <div className="text-6xl font-mono font-bold text-theme mb-2">
            {currentTime.toLocaleTimeString("pt-BR")}
          </div>
          <div className="text-theme-muted capitalize">
            {formatDate(currentTime)}
          </div>
        </div>

        {/* Identificação do Funcionário */}
        <div className="bg-theme-card border border-theme rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold text-theme">João Silva</div>
              <div className="text-sm text-theme-muted">Matrícula: 001234 • Depto: TI</div>
            </div>
          </div>
        </div>

        {/* Seleção de Tipo de Ponto */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">Tipo de Registro</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {punchTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.value;
              return (
                <Button
                  key={type.value}
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedType(type.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all h-auto justify-start ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-theme hover:border-blue-300 hover:bg-theme-secondary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${type.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`font-medium ${isSelected ? "text-blue-600" : "text-theme"}`}>
                      {type.label}
                    </span>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Localização */}
        <div className="bg-theme-card border border-theme rounded-lg p-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-sm text-theme-muted">Localização</div>
              <div className="text-theme">Escritório Principal - São Paulo, SP</div>
            </div>
          </div>
        </div>

        {/* Botão de Registro */}
        <Button
          onClick={handleRegister}
          disabled={!selectedType || isRegistering || registered}
          isLoading={isRegistering}
          className={`w-full py-4 rounded-xl font-semibold text-lg ${
            registered
              ? "bg-green-600 hover:bg-green-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          leftIcon={registered ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
        >
          {registered ? "Ponto Registrado!" : "Registrar Ponto"}
        </Button>

        {/* Registros do Dia */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-theme">Registros de Hoje</h3>
            <div className="flex items-center gap-2 text-sm text-theme-muted">
              <Calendar className="w-4 h-4" />
              <span>Trabalhado: {calculateWorkedHours()}</span>
            </div>
          </div>

          {punches.length === 0 ? (
            <div className="text-center py-8 text-theme-muted">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum registro hoje</p>
            </div>
          ) : (
            <div className="space-y-3">
              {punches.map((punch, idx) => {
                const typeInfo = getPunchTypeInfo(punch.type);
                const Icon = typeInfo.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-theme-secondary rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-theme">{typeInfo.label}</div>
                        <div className="text-xs text-theme-muted">{punch.location}</div>
                      </div>
                    </div>
                    <div className="text-lg font-mono font-semibold text-theme">
                      {punch.time}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Link para histórico */}
        <div className="text-center">
          <Link
            href="/hr/timesheet"
            className="text-blue-600 hover:underline text-sm"
          >
            Ver histórico completo de registros
          </Link>
        </div>
      </div>
    </div>
  );
}
