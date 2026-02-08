"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Clock,
  LogIn,
  Coffee,
  LogOut,
  CheckCircle,
  MapPin,
} from "lucide-react";
import Link from "next/link";

type ClockType = "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END";

export default function TimeClockPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: profile } = trpc.employeePortal.getMyProfile.useQuery();

  const now = new Date();
  const { data: todayRecords, refetch: refetchRecords } =
    trpc.employeePortal.getMyTimeRecords.useQuery({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });

  const registerMutation = trpc.employeePortal.registerTimeClock.useMutation({
    onSuccess: () => {
      refetchRecords();
      utils.employeePortal.getMyTimeRecords.invalidate();
    },
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          setLocationError("Localização não disponível");
        }
      );
    } else {
      setLocationError("Geolocalização não suportada neste navegador");
    }
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayEntry = todayRecords?.records.find((r) => {
    const recordDate = new Date(r.date);
    recordDate.setHours(0, 0, 0, 0);
    return recordDate.getTime() === today.getTime();
  });

  const handleRegister = async (type: ClockType) => {
    await registerMutation.mutateAsync({
      type,
      latitude: location?.latitude,
      longitude: location?.longitude,
    });
  };

  const getButtonState = (type: ClockType) => {
    if (!todayEntry) {
      return type === "CLOCK_IN";
    }

    switch (type) {
      case "CLOCK_IN":
        return !todayEntry.entryTime;
      case "BREAK_START":
        return todayEntry.entryTime && !todayEntry.lunchOutTime;
      case "BREAK_END":
        return todayEntry.lunchOutTime && !todayEntry.lunchInTime;
      case "CLOCK_OUT":
        return (
          todayEntry.entryTime &&
          (!todayEntry.lunchOutTime ||
            (todayEntry.lunchOutTime && todayEntry.lunchInTime)) &&
          !todayEntry.exitTime
        );
      default:
        return false;
    }
  };

  const clockButtons = [
    {
      type: "CLOCK_IN" as ClockType,
      label: "Entrada",
      icon: LogIn,
      color: "bg-green-600 hover:bg-green-700",
      time: todayEntry?.entryTime,
    },
    {
      type: "BREAK_START" as ClockType,
      label: "Saída Almoço",
      icon: Coffee,
      color: "bg-yellow-600 hover:bg-yellow-700",
      time: todayEntry?.lunchOutTime,
    },
    {
      type: "BREAK_END" as ClockType,
      label: "Retorno Almoço",
      icon: Coffee,
      color: "bg-orange-600 hover:bg-orange-700",
      time: todayEntry?.lunchInTime,
    },
    {
      type: "CLOCK_OUT" as ClockType,
      label: "Saída",
      icon: LogOut,
      color: "bg-red-600 hover:bg-red-700",
      time: todayEntry?.exitTime,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Registro de Ponto"
        icon={<Clock className="w-6 h-6" />}
        backHref="/portal"
        backLabel="Voltar ao Portal"
      />

      {/* Current Time Display */}
      <div className="bg-theme-card rounded-lg border border-theme p-8 text-center">
        <p className="text-theme-muted mb-2">
          {currentTime.toLocaleDateString("pt-BR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <p className="text-6xl font-bold text-theme font-mono">
          {currentTime.toLocaleTimeString("pt-BR")}
        </p>
        {profile && (
          <p className="text-theme-muted mt-4">
            {profile.name} - {profile.position?.name || "Colaborador"}
          </p>
        )}
        {location && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center justify-center gap-1">
            <MapPin className="w-4 h-4" />
            Localização capturada
          </p>
        )}
        {locationError && (
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
            {locationError}
          </p>
        )}
      </div>

      {/* Clock Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {clockButtons.map((btn) => {
          const Icon = btn.icon;
          const isEnabled = getButtonState(btn.type);
          const isRegistered = !!btn.time;

          return (
            <div key={btn.type} className="relative">
              <Button
                onClick={() => handleRegister(btn.type)}
                disabled={!isEnabled || registerMutation.isPending}
                className={`w-full h-24 flex flex-col items-center justify-center gap-2 ${
                  isEnabled ? btn.color : "bg-gray-400 dark:bg-gray-600"
                } text-white`}
              >
                {isRegistered ? (
                  <CheckCircle className="w-8 h-8" />
                ) : (
                  <Icon className="w-8 h-8" />
                )}
                <span className="font-medium">{btn.label}</span>
              </Button>
              {isRegistered && (
                <div className="absolute -bottom-6 left-0 right-0 text-center">
                  <span className="text-sm font-semibold text-theme-secondary">
                    {btn.time}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Today's Summary */}
      <div className="mt-8 bg-theme-card rounded-lg border border-theme p-6">
        <h2 className="text-lg font-semibold text-theme mb-4">
          Registros de Hoje
        </h2>
        {todayEntry ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-theme-secondary rounded-lg">
              <p className="text-sm text-theme-muted">
                Entrada
              </p>
              <p className="text-xl font-semibold text-theme">
                {todayEntry.entryTime || "--:--"}
              </p>
            </div>
            <div className="text-center p-4 bg-theme-secondary rounded-lg">
              <p className="text-sm text-theme-muted">
                Saída Almoço
              </p>
              <p className="text-xl font-semibold text-theme">
                {todayEntry.lunchOutTime || "--:--"}
              </p>
            </div>
            <div className="text-center p-4 bg-theme-secondary rounded-lg">
              <p className="text-sm text-theme-muted">
                Retorno Almoço
              </p>
              <p className="text-xl font-semibold text-theme">
                {todayEntry.lunchInTime || "--:--"}
              </p>
            </div>
            <div className="text-center p-4 bg-theme-secondary rounded-lg">
              <p className="text-sm text-theme-muted">Saída</p>
              <p className="text-xl font-semibold text-theme">
                {todayEntry.exitTime || "--:--"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-theme-muted text-center py-4">
            Nenhum registro hoje. Clique em &quot;Entrada&quot; para começar.
          </p>
        )}
      </div>

      {/* Link to Timesheet */}
      <div className="text-center">
        <Link href="/portal/timesheet">
          <Button variant="secondary">Ver Espelho de Ponto Completo</Button>
        </Link>
      </div>
    </div>
  );
}
