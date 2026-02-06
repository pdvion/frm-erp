"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";

import {
  Gift,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Filter,
  Bus,
  Utensils,
  Heart,
  GraduationCap,
  Users,
  Award,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { NativeSelect } from "@/components/ui/NativeSelect";

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  TRANSPORT: { label: "Vale Transporte", icon: <Bus className="w-4 h-4" />, color: "bg-blue-100 text-blue-800" },
  MEAL: { label: "Vale Refeição", icon: <Utensils className="w-4 h-4" />, color: "bg-orange-100 text-orange-800" },
  FOOD: { label: "Vale Alimentação", icon: <Utensils className="w-4 h-4" />, color: "bg-green-100 text-green-800" },
  HEALTH: { label: "Plano de Saúde", icon: <Heart className="w-4 h-4" />, color: "bg-red-100 text-red-800" },
  DENTAL: { label: "Plano Odontológico", icon: <Heart className="w-4 h-4" />, color: "bg-pink-100 text-pink-800" },
  LIFE_INSURANCE: { label: "Seguro de Vida", icon: <Heart className="w-4 h-4" />, color: "bg-purple-100 text-purple-800" },
  PENSION: { label: "Previdência", icon: <Award className="w-4 h-4" />, color: "bg-indigo-100 text-indigo-800" },
  EDUCATION: { label: "Auxílio Educação", icon: <GraduationCap className="w-4 h-4" />, color: "bg-cyan-100 text-cyan-800" },
  CHILDCARE: { label: "Auxílio Creche", icon: <Users className="w-4 h-4" />, color: "bg-yellow-100 text-yellow-800" },
  OTHER: { label: "Outros", icon: <Gift className="w-4 h-4" />, color: "bg-theme-tertiary text-theme" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Ativo", color: "bg-green-100 text-green-800" },
  SUSPENDED: { label: "Suspenso", color: "bg-yellow-100 text-yellow-800" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

export default function BenefitsPage() {
  const [activeTab, setActiveTab] = useState<"types" | "employees" | "trainings" | "skills">("types");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data: dashboard, isLoading: loadingDashboard } = trpc.benefits.dashboard.useQuery();

  const { data: benefitTypes, isLoading: loadingTypes } = trpc.benefits.listBenefitTypes.useQuery(
    { category: categoryFilter !== "ALL" ? categoryFilter as "TRANSPORT" | "MEAL" | "FOOD" | "HEALTH" | "DENTAL" | "LIFE_INSURANCE" | "PENSION" | "EDUCATION" | "CHILDCARE" | "OTHER" : undefined },
    { enabled: activeTab === "types" }
  );

  const { data: employeeBenefits, isLoading: loadingEmployeeBenefits } = trpc.benefits.listEmployeeBenefits.useQuery(
    { page, limit: 20 },
    { enabled: activeTab === "employees" }
  );

  const { data: trainings, isLoading: loadingTrainings } = trpc.benefits.listTrainings.useQuery(
    { search: search || undefined },
    { enabled: activeTab === "trainings" }
  );

  const { data: skillsSummary, isLoading: loadingSkills } = trpc.benefits.getSkillMatrixSummary.useQuery(
    {},
    { enabled: activeTab === "skills" }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Benefícios e Treinamentos"
        icon={<Gift className="w-6 h-6" />}
        backHref="/hr"
        module="hr"
      />

      <main className="max-w-7xl mx-auto">
        {/* Dashboard Cards */}
        {loadingDashboard ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-2">
                <Gift className="w-4 h-4" />
                <span className="text-sm">Tipos de Benefício</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{dashboard?.totalBenefitTypes || 0}</p>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">Benefícios Ativos</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{dashboard?.activeBenefits || 0}</p>
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-2">
                <GraduationCap className="w-4 h-4" />
                <span className="text-sm">Treinamentos Pendentes</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{dashboard?.pendingTrainings || 0}</p>
              {(dashboard?.expiredTrainings || 0) > 0 && (
                <p className="text-xs text-red-600">{dashboard?.expiredTrainings} expirados</p>
              )}
            </div>

            <div className="bg-theme-card rounded-lg border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-muted mb-2">
                <Award className="w-4 h-4" />
                <span className="text-sm">Competências</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{dashboard?.skillsCount || 0}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-theme-card rounded-lg border border-theme mb-6">
          <div className="border-b border-theme">
            <nav className="flex -mb-px">
              {[
                { key: "types", label: "Tipos de Benefício", icon: <Gift className="w-4 h-4" /> },
                { key: "employees", label: "Benefícios por Funcionário", icon: <Users className="w-4 h-4" /> },
                { key: "trainings", label: "Treinamentos", icon: <GraduationCap className="w-4 h-4" /> },
                { key: "skills", label: "Matriz de Polivalência", icon: <Award className="w-4 h-4" /> },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant="ghost"
                  onClick={() => { setActiveTab(tab.key as typeof activeTab); setPage(1); }}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 rounded-none ${
                    activeTab === tab.key
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-theme-muted hover:text-theme-secondary"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>

          {/* Filtros */}
          <div className="p-4 border-b border-theme">
            <div className="flex flex-col md:flex-row gap-4">
              {activeTab === "trainings" && (
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                  <Input
                    type="text"
                    placeholder="Buscar treinamentos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg"
                  />
                </div>
              )}
              {activeTab === "types" && (
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-theme-muted" />
                  <NativeSelect
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="border border-theme-input rounded-lg px-3 py-2"
                  >
                    <option value="ALL">Todas Categorias</option>
                    {Object.entries(categoryConfig).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </NativeSelect>
                </div>
              )}
            </div>
          </div>

          {/* Conteúdo das Tabs */}
          <div className="p-4">
            {/* Tipos de Benefício */}
            {activeTab === "types" && (
              loadingTypes ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : !benefitTypes?.length ? (
                <div className="text-center py-12">
                  <Gift className="w-12 h-12 mx-auto text-theme-muted mb-4" />
                  <p className="text-theme-muted">Nenhum tipo de benefício cadastrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {benefitTypes.map((type) => {
                    const cfg = categoryConfig[type.category] || categoryConfig.OTHER;
                    return (
                      <div key={type.id} className="bg-theme-tertiary rounded-lg p-4 border border-theme">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`p-2 rounded-lg ${cfg.color}`}>
                            {cfg.icon}
                          </span>
                          <div>
                            <h3 className="font-medium text-theme">{type.name}</h3>
                            <p className="text-xs text-theme-muted">{type.code}</p>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-theme-muted">Categoria:</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${cfg.color}`}>{cfg.label}</span>
                          </div>
                          {type.defaultValue && type.defaultValue > 0 && (
                            <div className="flex justify-between">
                              <span className="text-theme-muted">Valor Padrão:</span>
                              <span className="font-medium">{formatCurrency(type.defaultValue)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-theme-muted">Funcionários:</span>
                            <span className="font-medium">{type._count?.employeeBenefits || 0}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Benefícios por Funcionário */}
            {activeTab === "employees" && (
              loadingEmployeeBenefits ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : !employeeBenefits?.benefits.length ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-theme-muted mb-4" />
                  <p className="text-theme-muted">Nenhum benefício atribuído</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-theme-table">
                      <thead className="bg-theme-tertiary">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Funcionário</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Benefício</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Valor</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Desconto</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme-table">
                        {employeeBenefits.benefits.map((benefit) => {
                          const statusCfg = statusConfig[benefit.status] || statusConfig.ACTIVE;
                          const categoryCfg = categoryConfig[benefit.benefitType?.category || "OTHER"] || categoryConfig.OTHER;
                          return (
                            <tr key={benefit.id} className="hover:bg-theme-hover">
                              <td className="px-4 py-3 font-medium text-theme">
                                {benefit.employee?.name}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className={`p-1 rounded ${categoryCfg.color}`}>
                                    {categoryCfg.icon}
                                  </span>
                                  <span className="text-sm">{benefit.benefitType?.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {formatCurrency(benefit.value || 0)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {formatCurrency(benefit.employeeDiscount || 0)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                                  {statusCfg.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {employeeBenefits.pages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-theme-muted">
                        Página {page} de {employeeBenefits.pages}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={page === employeeBenefits.pages}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )
            )}

            {/* Treinamentos */}
            {activeTab === "trainings" && (
              loadingTrainings ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : !trainings?.length ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-12 h-12 mx-auto text-theme-muted mb-4" />
                  <p className="text-theme-muted">Nenhum treinamento cadastrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trainings.map((training) => (
                    <div key={training.id} className="bg-theme-tertiary rounded-lg p-4 border border-theme">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="p-2 rounded-lg bg-cyan-100 text-cyan-800">
                          <GraduationCap className="w-4 h-4" />
                        </span>
                        <div>
                          <h3 className="font-medium text-theme">{training.name}</h3>
                          <p className="text-xs text-theme-muted">{training.code}</p>
                        </div>
                        {training.isMandatory && (
                          <span className="ml-auto px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                            Obrigatório
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        {training.durationHours && (
                          <div className="flex justify-between">
                            <span className="text-theme-muted">Duração:</span>
                            <span>{training.durationHours}h</span>
                          </div>
                        )}
                        {training.validityMonths && (
                          <div className="flex justify-between">
                            <span className="text-theme-muted">Validade:</span>
                            <span>{training.validityMonths} meses</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-theme-muted">Participantes:</span>
                          <span className="font-medium">{training._count?.employeeTrainings || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Matriz de Polivalência */}
            {activeTab === "skills" && (
              loadingSkills ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : !skillsSummary?.length ? (
                <div className="text-center py-12">
                  <Award className="w-12 h-12 mx-auto text-theme-muted mb-4" />
                  <p className="text-theme-muted">Nenhuma competência cadastrada</p>
                  <p className="text-sm text-theme-muted mt-2">
                    A Matriz de Polivalência permite mapear as competências dos funcionários
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-theme-table">
                    <thead className="bg-theme-tertiary">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Competência</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Categoria</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Funcionários</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Nível Médio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-table">
                      {skillsSummary.map((skill, idx) => (
                        <tr key={idx} className="hover:bg-theme-hover">
                          <td className="px-4 py-3 font-medium text-theme">{skill.skillName}</td>
                          <td className="px-4 py-3 text-sm text-theme-muted">{skill.category || "-"}</td>
                          <td className="px-4 py-3 text-center">{skill.employeeCount}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {[1, 2, 3, 4].map((level) => (
                                <div
                                  key={level}
                                  className={`w-4 h-4 rounded ${
                                    level <= Math.round(skill.avgLevel)
                                      ? "bg-blue-600"
                                      : "bg-theme-tertiary"
                                  }`}
                                />
                              ))}
                              <span className="ml-2 text-sm text-theme-muted">
                                {skill.avgLevel.toFixed(1)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
