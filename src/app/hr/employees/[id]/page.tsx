"use client";

import { use } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";

import {
  Users,
  ArrowLeft,
  Edit,
  Loader2,
  Building2,
  Briefcase,
  Calendar,
  Mail,
  Phone,
  Smartphone,
  DollarSign,
  Clock,
  User,
  FileText,
} from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";

const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: "Ativo", variant: "success" },
  VACATION: { label: "Férias", variant: "info" },
  LEAVE: { label: "Afastado", variant: "warning" },
  SUSPENDED: { label: "Suspenso", variant: "orange" },
  TERMINATED: { label: "Desligado", variant: "default" },
};

const contractLabels: Record<string, string> = {
  CLT: "CLT",
  PJ: "PJ",
  TEMPORARY: "Temporário",
  INTERN: "Estagiário",
  APPRENTICE: "Aprendiz",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EmployeeDetailsPage({ params }: PageProps) {
  const { id } = use(params);

  const { data: employee, isLoading, error } = trpc.hr.getEmployee.useQuery({ id });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Funcionário não encontrado"
          icon={<Users className="w-6 h-6" />}
          module="hr"
        />
        <div className="bg-theme-card rounded-lg border border-theme p-8 text-center">
          <Users className="w-12 h-12 mx-auto text-theme-muted mb-4" />
          <p className="text-theme-muted mb-4">O funcionário solicitado não foi encontrado.</p>
          <Link
            href="/hr/employees"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  const config = statusConfig[employee.status] || statusConfig.ACTIVE;

  return (
    <div className="space-y-6">
      <PageHeader
        title={employee.name}
        subtitle={`#${employee.code} - ${employee.position?.name || "Sem cargo"}`}
        icon={<Users className="w-6 h-6" />}
        module="hr"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/hr/employees"
              className="flex items-center gap-2 px-4 py-2 text-theme-secondary hover:text-theme border border-theme rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
            <Link
              href={`/hr/employees/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Link>
          </div>
        }
      />

      {/* Status Badge and Company */}
      <div className="flex items-center gap-4 flex-wrap">
        <Badge variant={config.variant}>
          {config.label}
        </Badge>
        <span className="text-theme-muted">
          {contractLabels[employee.contractType] || employee.contractType}
        </span>
        {employee.company && (
          <Badge variant="info">
            <Building2 className="w-3.5 h-3.5" />
            {employee.company.tradeName || employee.company.name}
          </Badge>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dados Pessoais */}
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h3 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" />
            Dados Pessoais
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-theme-muted">Nome Completo</p>
              <p className="text-theme font-medium">{employee.name}</p>
            </div>
            {employee.cpf && (
              <div>
                <p className="text-sm text-theme-muted">CPF</p>
                <p className="text-theme">{employee.cpf}</p>
              </div>
            )}
            {employee.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-theme-muted" />
                <a href={`mailto:${employee.email}`} className="text-purple-600 hover:underline">
                  {employee.email}
                </a>
              </div>
            )}
            {employee.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-theme-muted" />
                <span className="text-theme">{employee.phone}</span>
              </div>
            )}
            {employee.mobile && (
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-theme-muted" />
                <span className="text-theme">{employee.mobile}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dados Profissionais */}
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h3 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-600" />
            Dados Profissionais
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-theme-muted" />
              <div>
                <p className="text-sm text-theme-muted">Departamento</p>
                <p className="text-theme">{employee.department?.name || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-theme-muted" />
              <div>
                <p className="text-sm text-theme-muted">Cargo</p>
                <p className="text-theme">{employee.position?.name || "-"}</p>
              </div>
            </div>
            {employee.manager && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-theme-muted" />
                <div>
                  <p className="text-sm text-theme-muted">Gestor</p>
                  <p className="text-theme">{employee.manager.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dados Contratuais */}
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h3 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Dados Contratuais
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-theme-muted" />
              <div>
                <p className="text-sm text-theme-muted">Data de Admissão</p>
                <p className="text-theme">{formatDate(employee.hireDate)}</p>
              </div>
            </div>
            {employee.terminationDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-500" />
                <div>
                  <p className="text-sm text-theme-muted">Data de Desligamento</p>
                  <p className="text-red-600">{formatDate(employee.terminationDate)}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-theme-muted" />
              <div>
                <p className="text-sm text-theme-muted">Salário</p>
                <p className="text-theme font-medium">{formatCurrency(employee.salary || 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-theme-muted" />
              <div>
                <p className="text-sm text-theme-muted">Jornada</p>
                <p className="text-theme">
                  {Number(employee.workHoursPerDay) || 8}h/dia - {Number(employee.workDaysPerWeek) || 5} dias/semana
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
