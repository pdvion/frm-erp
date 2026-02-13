"use client";

import { useState } from "react"; 
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { PageCard } from "@/components/ui/PageCard";
import { Drawer } from "@/components/ui/Drawer";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  UserPlus,
  Loader2,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Stethoscope,
  ThumbsUp,
  ThumbsDown,
  UserCheck,
  Ban,
  ChevronUp,
  Calendar,
  ClipboardCheck,
  MapPin,
  Briefcase,
  Landmark,
  User,
  RotateCcw,
  Pencil,
  Save,
} from "lucide-react";

const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  DRAFT: { label: "Rascunho", variant: "default" },
  DOCUMENTS: { label: "Documentos", variant: "info" },
  EXAM: { label: "Exame", variant: "warning" },
  APPROVAL: { label: "Aprovação", variant: "purple" },
  APPROVED: { label: "Aprovado", variant: "success" },
  REJECTED: { label: "Rejeitado", variant: "error" },
  COMPLETED: { label: "Concluído", variant: "emerald" },
  CANCELLED: { label: "Cancelado", variant: "default" },
};

const stepStatusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "Pendente", variant: "default" },
  IN_PROGRESS: { label: "Em Andamento", variant: "info" },
  COMPLETED: { label: "Concluído", variant: "success" },
  SKIPPED: { label: "Pulado", variant: "default" },
};

const docStatusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "Pendente", variant: "warning" },
  UPLOADED: { label: "Enviado", variant: "info" },
  VERIFIED: { label: "Verificado", variant: "success" },
  REJECTED: { label: "Rejeitado", variant: "error" },
};

const examResultConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  FIT: { label: "Apto", variant: "success" },
  UNFIT: { label: "Inapto", variant: "error" },
  FIT_RESTRICTIONS: { label: "Apto c/ Restrições", variant: "warning" },
  PENDING: { label: "Pendente", variant: "default" },
};

const stepTypeLabels: Record<string, string> = {
  DOCUMENT: "Documento",
  EXAM: "Exame",
  APPROVAL: "Aprovação",
  SIGNATURE: "Assinatura",
  SYSTEM: "Sistema",
};

export default function AdmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const admissionId = params.id as string;
  const utils = trpc.useUtils();

  const [showExamForm, setShowExamForm] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [selectedStep, setSelectedStep] = useState<{
    id: string;
    stepNumber: number;
    stepName: string;
    stepType: string;
    status: string;
    completedAt: Date | null;
    completedBy: string | null;
    notes: string | null;
    admissionId: string;
    assignedTo: string | null;
    dueDate: Date | null;
    createdAt: Date;
  } | null>(null);
  const [stepNotes, setStepNotes] = useState("");
  const [isEditingCandidate, setIsEditingCandidate] = useState(false);
  const [editForm, setEditForm] = useState({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    candidateCpf: "",
    proposedSalary: "",
    proposedStartDate: "",
    notes: "",
  });
  const [examForm, setExamForm] = useState({
    clinicName: "",
    scheduledDate: "",
    notes: "",
  });
  const [examResultForm, setExamResultForm] = useState({
    examId: "",
    result: "" as string,
    asoNumber: "",
    notes: "",
  });

  const { data: admission, isLoading } = trpc.admission.byId.useQuery({ id: admissionId });

  const completeStepMutation = trpc.admission.completeStep.useMutation({
    onSuccess: () => {
      toast.success("Etapa concluída!");
      utils.admission.byId.invalidate({ id: admissionId });
      setSelectedStep(null);
    },
    onError: (err) => toast.error("Erro", { description: err.message }),
  });

  // TODO: Add reopenStep and updateStepNotes mutations when backend procedures are implemented
  const reopenStepMutation = { mutate: (_input: { stepId: string }) => toast.error("Funcionalidade ainda não implementada"), isPending: false };
  const updateStepNotesMutation = { mutate: (_input: { stepId: string; notes: string }) => toast.error("Funcionalidade ainda não implementada"), isPending: false };

  const verifyDocMutation = trpc.admission.verifyDocument.useMutation({
    onSuccess: () => {
      toast.success("Documento verificado!");
      utils.admission.byId.invalidate({ id: admissionId });
      setShowRejectReason(null);
      setRejectReason("");
    },
    onError: (err) => toast.error("Erro", { description: err.message }),
  });

  const scheduleExamMutation = trpc.admission.scheduleExam.useMutation({
    onSuccess: () => {
      toast.success("Exame agendado!");
      utils.admission.byId.invalidate({ id: admissionId });
      setShowExamForm(false);
      setExamForm({ clinicName: "", scheduledDate: "", notes: "" });
    },
    onError: (err) => toast.error("Erro", { description: err.message }),
  });

  const recordExamResultMutation = trpc.admission.recordExamResult.useMutation({
    onSuccess: () => {
      toast.success("Resultado registrado!");
      utils.admission.byId.invalidate({ id: admissionId });
      setExamResultForm({ examId: "", result: "", asoNumber: "", notes: "" });
    },
    onError: (err) => toast.error("Erro", { description: err.message }),
  });

  const approveMutation = trpc.admission.approve.useMutation({
    onSuccess: () => {
      toast.success("Admissão aprovada!");
      utils.admission.byId.invalidate({ id: admissionId });
    },
    onError: (err) => toast.error("Erro", { description: err.message }),
  });

  const rejectMutation = trpc.admission.reject.useMutation({
    onSuccess: () => {
      toast.success("Admissão rejeitada");
      utils.admission.byId.invalidate({ id: admissionId });
    },
    onError: (err) => toast.error("Erro", { description: err.message }),
  });

  const completeMutation = trpc.admission.complete.useMutation({
    onSuccess: () => {
      toast.success("Admissão concluída! Funcionário criado.");
      utils.admission.byId.invalidate({ id: admissionId });
    },
    onError: (err) => toast.error("Erro", { description: err.message }),
  });

  const updateAdmissionMutation = trpc.admission.update.useMutation({
    onSuccess: () => {
      toast.success("Dados atualizados!");
      utils.admission.byId.invalidate({ id: admissionId });
      setIsEditingCandidate(false);
    },
    onError: (err) => toast.error("Erro", { description: err.message }),
  });

  const cancelMutation = trpc.admission.cancel.useMutation({
    onSuccess: () => {
      toast.success("Admissão cancelada");
      router.push("/hr/admission");
    },
    onError: (err) => toast.error("Erro", { description: err.message }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-theme-muted" />
      </div>
    );
  }

  if (!admission) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 mx-auto text-theme-muted mb-4" />
        <p className="text-theme-muted">Processo de admissão não encontrado</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push("/hr/admission")}>
          Voltar
        </Button>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Fields like candidateRg, candidateBirthDate etc. will be added to schema later
  const adm = admission as any;
  const statusCfg = statusConfig[admission.status] || statusConfig.DRAFT;
  const isTerminal = ["COMPLETED", "CANCELLED", "REJECTED"].includes(admission.status);

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={`Admissão #${admission.code}`}
          subtitle={admission.candidateName}
          icon={<UserPlus className="w-6 h-6" />}
          backHref="/hr/admission"
          module="hr"
        />
        <Badge variant={statusCfg.variant} size="lg">
          {statusCfg.label}
        </Badge>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados do Candidato */}
          <PageCard
            title="Dados do Candidato"
            actions={!isTerminal && !isEditingCandidate ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditForm({
                    candidateName: admission.candidateName || "",
                    candidateEmail: admission.candidateEmail || "",
                    candidatePhone: admission.candidatePhone || "",
                    candidateCpf: admission.candidateCpf || "",
                    proposedSalary: admission.proposedSalary ? String(admission.proposedSalary) : "",
                    proposedStartDate: admission.proposedStartDate
                      ? new Date(admission.proposedStartDate).toISOString().split("T")[0]
                      : "",
                    notes: admission.notes || "",
                  });
                  setIsEditingCandidate(true);
                }}
                leftIcon={<Pencil className="w-4 h-4" />}
              >
                Editar
              </Button>
            ) : undefined}
          >
            {isEditingCandidate ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nome"
                    value={editForm.candidateName}
                    onChange={(e) => setEditForm((f) => ({ ...f, candidateName: e.target.value }))}
                  />
                  <Input
                    label="E-mail"
                    type="email"
                    value={editForm.candidateEmail}
                    onChange={(e) => setEditForm((f) => ({ ...f, candidateEmail: e.target.value }))}
                  />
                  <Input
                    label="Telefone"
                    value={editForm.candidatePhone}
                    onChange={(e) => setEditForm((f) => ({ ...f, candidatePhone: e.target.value }))}
                  />
                  <Input
                    label="CPF"
                    value={editForm.candidateCpf}
                    onChange={(e) => setEditForm((f) => ({ ...f, candidateCpf: e.target.value }))}
                  />
                  <Input
                    label="Salário Proposto"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={editForm.proposedSalary}
                    onChange={(e) => setEditForm((f) => ({ ...f, proposedSalary: e.target.value }))}
                  />
                  <Input
                    label="Data Prevista de Início"
                    type="date"
                    value={editForm.proposedStartDate}
                    onChange={(e) => setEditForm((f) => ({ ...f, proposedStartDate: e.target.value }))}
                  />
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-theme">Observações</label>
                    <Textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    onClick={() => {
                      updateAdmissionMutation.mutate({
                        id: admissionId,
                        candidateName: editForm.candidateName || undefined,
                        candidateEmail: editForm.candidateEmail || undefined,
                        candidatePhone: editForm.candidatePhone || undefined,
                        candidateCpf: editForm.candidateCpf || undefined,
                        proposedSalary: editForm.proposedSalary ? Number(editForm.proposedSalary) : undefined,
                        proposedStartDate: editForm.proposedStartDate || undefined,
                        notes: editForm.notes || undefined,
                      });
                    }}
                    disabled={updateAdmissionMutation.isPending}
                    leftIcon={updateAdmissionMutation.isPending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Save className="w-4 h-4" />
                    }
                  >
                    Salvar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setIsEditingCandidate(false)}
                    disabled={updateAdmissionMutation.isPending}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-theme-muted">Nome</span>
                  <p className="font-medium text-theme">{admission.candidateName}</p>
                </div>
                <div>
                  <span className="text-sm text-theme-muted">E-mail</span>
                  <p className="font-medium text-theme">{admission.candidateEmail || "—"}</p>
                </div>
                <div>
                  <span className="text-sm text-theme-muted">Telefone</span>
                  <p className="font-medium text-theme">{admission.candidatePhone || "—"}</p>
                </div>
                <div>
                  <span className="text-sm text-theme-muted">CPF</span>
                  <p className="font-medium text-theme">{admission.candidateCpf || "—"}</p>
                </div>
                <div>
                  <span className="text-sm text-theme-muted">Salário Proposto</span>
                  <p className="font-medium text-theme">
                    {admission.proposedSalary ? formatCurrency(admission.proposedSalary) : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-theme-muted">Data Prevista</span>
                  <p className="font-medium text-theme">
                    {admission.proposedStartDate ? formatDate(admission.proposedStartDate) : "—"}
                  </p>
                </div>
                {admission.notes && (
                  <div className="md:col-span-2">
                    <span className="text-sm text-theme-muted">Observações</span>
                    <p className="text-theme">{admission.notes}</p>
                  </div>
                )}
              </div>
            )}
          </PageCard>

          {/* Dados Pessoais */}
          {(adm.candidateRg || adm.candidateBirthDate || adm.candidateGender || adm.candidateMaritalStatus || adm.candidateMobile) && (
            <PageCard title="Dados Pessoais">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adm.candidateRg && (
                  <div>
                    <span className="text-sm text-theme-muted">RG</span>
                    <p className="font-medium text-theme">{adm.candidateRg}</p>
                  </div>
                )}
                {adm.candidateBirthDate && (
                  <div>
                    <span className="text-sm text-theme-muted">Data de Nascimento</span>
                    <p className="font-medium text-theme">{formatDate(adm.candidateBirthDate)}</p>
                  </div>
                )}
                {adm.candidateGender && (
                  <div>
                    <span className="text-sm text-theme-muted">Gênero</span>
                    <p className="font-medium text-theme">{adm.candidateGender}</p>
                  </div>
                )}
                {adm.candidateMaritalStatus && (
                  <div>
                    <span className="text-sm text-theme-muted">Estado Civil</span>
                    <p className="font-medium text-theme">{adm.candidateMaritalStatus}</p>
                  </div>
                )}
                {adm.candidateMobile && (
                  <div>
                    <span className="text-sm text-theme-muted">Celular</span>
                    <p className="font-medium text-theme">{adm.candidateMobile}</p>
                  </div>
                )}
              </div>
            </PageCard>
          )}

          {/* Endereço */}
          {(adm.candidateAddress || adm.candidateAddressCity || adm.candidateAddressZipCode) && (
            <PageCard title="Endereço">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adm.candidateAddress && (
                  <div className="md:col-span-2">
                    <span className="text-sm text-theme-muted">Logradouro</span>
                    <p className="font-medium text-theme">
                      {adm.candidateAddress}
                      {adm.candidateAddressNumber ? `, ${adm.candidateAddressNumber}` : ""}
                      {adm.candidateAddressComplement ? ` - ${adm.candidateAddressComplement}` : ""}
                    </p>
                  </div>
                )}
                {adm.candidateAddressNeighborhood && (
                  <div>
                    <span className="text-sm text-theme-muted">Bairro</span>
                    <p className="font-medium text-theme">{adm.candidateAddressNeighborhood}</p>
                  </div>
                )}
                {(adm.candidateAddressCity || adm.candidateAddressState) && (
                  <div>
                    <span className="text-sm text-theme-muted">Cidade / UF</span>
                    <p className="font-medium text-theme">
                      {[adm.candidateAddressCity, adm.candidateAddressState].filter(Boolean).join(" / ")}
                    </p>
                  </div>
                )}
                {adm.candidateAddressZipCode && (
                  <div>
                    <span className="text-sm text-theme-muted">CEP</span>
                    <p className="font-medium text-theme">{adm.candidateAddressZipCode}</p>
                  </div>
                )}
              </div>
            </PageCard>
          )}

          {/* Dados Profissionais / Contrato */}
          {(adm.contractType || adm.workHoursPerDay || admission.managerId) && (
            <PageCard title="Dados do Contrato">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adm.contractType && (
                  <div>
                    <span className="text-sm text-theme-muted">Tipo de Contrato</span>
                    <p className="font-medium text-theme">{adm.contractType}</p>
                  </div>
                )}
                {adm.workHoursPerDay && (
                  <div>
                    <span className="text-sm text-theme-muted">Jornada</span>
                    <p className="font-medium text-theme">
                      {adm.workHoursPerDay}h/dia — {adm.workDaysPerWeek || 5} dias/semana
                    </p>
                  </div>
                )}
              </div>
            </PageCard>
          )}

          {/* Dados Bancários */}
          {(adm.candidateBankName || adm.candidatePixKey) && (
            <PageCard title="Dados Bancários">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adm.candidateBankName && (
                  <div>
                    <span className="text-sm text-theme-muted">Banco</span>
                    <p className="font-medium text-theme">
                      {adm.candidateBankName}
                      {adm.candidateBankCode ? ` (${adm.candidateBankCode})` : ""}
                    </p>
                  </div>
                )}
                {(adm.candidateBankBranch || adm.candidateBankAccount) && (
                  <div>
                    <span className="text-sm text-theme-muted">Agência / Conta</span>
                    <p className="font-medium text-theme">
                      {[adm.candidateBankBranch, adm.candidateBankAccount].filter(Boolean).join(" / ")}
                      {adm.candidateBankAccountDigit ? `-${adm.candidateBankAccountDigit}` : ""}
                    </p>
                  </div>
                )}
                {adm.candidateBankAccountType && (
                  <div>
                    <span className="text-sm text-theme-muted">Tipo de Conta</span>
                    <p className="font-medium text-theme">{adm.candidateBankAccountType}</p>
                  </div>
                )}
                {adm.candidatePixKey && (
                  <div>
                    <span className="text-sm text-theme-muted">Chave PIX</span>
                    <p className="font-medium text-theme">{adm.candidatePixKey}</p>
                  </div>
                )}
              </div>
            </PageCard>
          )}

          {/* Documentos Trabalhistas */}
          {(adm.candidatePis || adm.candidateCtps || adm.candidateVoterRegistration || adm.candidateMilitaryService) && (
            <PageCard title="Documentos Trabalhistas">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adm.candidatePis && (
                  <div>
                    <span className="text-sm text-theme-muted">PIS/PASEP</span>
                    <p className="font-medium text-theme">{adm.candidatePis}</p>
                  </div>
                )}
                {adm.candidateCtps && (
                  <div>
                    <span className="text-sm text-theme-muted">CTPS</span>
                    <p className="font-medium text-theme">{adm.candidateCtps}</p>
                  </div>
                )}
                {adm.candidateVoterRegistration && (
                  <div>
                    <span className="text-sm text-theme-muted">Título de Eleitor</span>
                    <p className="font-medium text-theme">{adm.candidateVoterRegistration}</p>
                  </div>
                )}
                {adm.candidateMilitaryService && (
                  <div>
                    <span className="text-sm text-theme-muted">Certificado Militar</span>
                    <p className="font-medium text-theme">{adm.candidateMilitaryService}</p>
                  </div>
                )}
              </div>
            </PageCard>
          )}

          {/* Timeline de Etapas */}
          <PageCard title="Etapas do Processo">
            <div className="space-y-4">
              {admission.admission_steps?.map((step: {
                id: string;
                stepNumber: number;
                stepName: string;
                stepType: string;
                status: string;
                completedAt: Date | null;
                completedBy: string | null;
                notes: string | null;
                admissionId: string;
                assignedTo: string | null;
                dueDate: Date | null;
                createdAt: Date;
              }) => {
                const stepCfg = stepStatusConfig[step.status] || stepStatusConfig.PENDING;
                const isCurrentStep = step.status === "IN_PROGRESS";
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer hover:bg-theme-hover transition-colors ${
                      isCurrentStep ? "border-blue-500/50 bg-blue-50 dark:bg-blue-900/10" : "border-theme"
                    }`}
                    onClick={() => { setSelectedStep(step); setStepNotes(step.notes || ""); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") { setSelectedStep(step); setStepNotes(step.notes || ""); } }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      step.status === "COMPLETED"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : isCurrentStep
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                          : "bg-theme-tertiary text-theme-muted"
                    }`}>
                      {step.status === "COMPLETED" ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        step.stepNumber
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-theme">{step.stepName}</p>
                      {step.completedAt && (
                        <p className="text-xs text-theme-muted">
                          Concluído em {formatDate(step.completedAt)}
                        </p>
                      )}
                    </div>
                    <Badge variant={stepCfg.variant}>{stepCfg.label}</Badge>
                    {isCurrentStep && !isTerminal && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          completeStepMutation.mutate({ stepId: step.id });
                        }}
                        disabled={completeStepMutation.isPending}
                      >
                        {completeStepMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </PageCard>

          {/* Documentos */}
          <PageCard title="Documentos">
            <div className="space-y-3">
              {admission.admission_documents?.map((doc: {
                id: string;
                documentName: string;
                documentType: string;
                status: string;
                isRequired: boolean | null;
                fileUrl: string | null;
                uploadedAt: Date | null;
                verifiedAt: Date | null;
                rejectionReason: string | null;
              }) => {
                const docCfg = docStatusConfig[doc.status] || docStatusConfig.PENDING;
                return (
                  <div key={doc.id} className="flex items-center gap-4 p-3 rounded-lg border border-theme">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-theme">{doc.documentName}</p>
                        {doc.isRequired && (
                          <span className="text-xs text-red-500">*obrigatório</span>
                        )}
                      </div>
                      {doc.fileUrl && (
                        <p className="text-xs text-blue-600 truncate max-w-xs">{doc.fileUrl}</p>
                      )}
                      {doc.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1">Motivo: {doc.rejectionReason}</p>
                      )}
                    </div>
                    <Badge variant={docCfg.variant}>{docCfg.label}</Badge>
                    {doc.status === "UPLOADED" && !isTerminal && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => verifyDocMutation.mutate({ documentId: doc.id, approved: true })}
                          disabled={verifyDocMutation.isPending}
                          title="Aprovar"
                        >
                          <ThumbsUp className="w-4 h-4 text-green-600" />
                        </Button>
                        {showRejectReason === doc.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Motivo..."
                              className="w-40 text-xs"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                verifyDocMutation.mutate({
                                  documentId: doc.id,
                                  approved: false,
                                  rejectionReason: rejectReason,
                                });
                              }}
                              disabled={verifyDocMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowRejectReason(doc.id)}
                            title="Rejeitar"
                          >
                            <ThumbsDown className="w-4 h-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </PageCard>

          {/* Exame Admissional */}
          <PageCard
            title="Exame Admissional"
            actions={!isTerminal ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowExamForm(!showExamForm)}
              >
                {showExamForm ? <ChevronUp className="w-4 h-4 mr-1" /> : <Calendar className="w-4 h-4 mr-1" />}
                {showExamForm ? "Fechar" : "Agendar Exame"}
              </Button>
            ) : undefined}
          >

            {showExamForm && (
              <div className="mb-4 p-4 border border-theme rounded-lg bg-theme-secondary">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <Input
                    label="Clínica"
                    value={examForm.clinicName}
                    onChange={(e) => setExamForm((p) => ({ ...p, clinicName: e.target.value }))}
                    placeholder="Nome da clínica"
                  />
                  <Input
                    label="Data *"
                    type="datetime-local"
                    value={examForm.scheduledDate}
                    onChange={(e) => setExamForm((p) => ({ ...p, scheduledDate: e.target.value }))}
                    required
                  />
                </div>
                <Textarea
                  value={examForm.notes}
                  onChange={(e) => setExamForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Observações..."
                  rows={2}
                  className="mb-3"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (!examForm.scheduledDate) {
                      toast.error("Data do exame é obrigatória");
                      return;
                    }
                    scheduleExamMutation.mutate({
                      admissionId,
                      clinicName: examForm.clinicName || undefined,
                      scheduledDate: examForm.scheduledDate,
                      notes: examForm.notes || undefined,
                    });
                  }}
                  disabled={scheduleExamMutation.isPending}
                >
                  {scheduleExamMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Calendar className="w-4 h-4 mr-1" />
                  )}
                  Confirmar Agendamento
                </Button>
              </div>
            )}

            {admission.admission_exams?.length > 0 ? (
              <div className="space-y-3">
                {admission.admission_exams.map((exam: {
                  id: string;
                  examType: string;
                  clinicName: string | null;
                  scheduledDate: Date | null;
                  completedDate: Date | null;
                  result: string | null;
                  asoNumber: string | null;
                  notes: string | null;
                }) => (
                  <div key={exam.id} className="p-4 border border-theme rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-theme">{exam.examType}</p>
                        {exam.clinicName && (
                          <p className="text-sm text-theme-muted">{exam.clinicName}</p>
                        )}
                      </div>
                      {exam.result ? (
                        <Badge variant={(examResultConfig[exam.result] || examResultConfig.PENDING).variant}>
                          {(examResultConfig[exam.result] || examResultConfig.PENDING).label}
                        </Badge>
                      ) : (
                        <Badge variant="default">Aguardando Resultado</Badge>
                      )}
                    </div>
                    <div className="text-sm text-theme-muted">
                      {exam.scheduledDate && <span>Agendado: {formatDate(exam.scheduledDate)}</span>}
                      {exam.completedDate && <span className="ml-4">Realizado: {formatDate(exam.completedDate)}</span>}
                      {exam.asoNumber && <span className="ml-4">ASO: {exam.asoNumber}</span>}
                    </div>

                    {!exam.result && !isTerminal && (
                      <div className="mt-3 p-3 bg-theme-tertiary rounded-lg">
                        <p className="text-sm font-medium text-theme mb-2">Registrar Resultado</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                          <Select
                            value={examResultForm.examId === exam.id ? examResultForm.result : ""}
                            onChange={(val) => setExamResultForm({ examId: exam.id, result: val, asoNumber: examResultForm.asoNumber, notes: examResultForm.notes })}
                            placeholder="Resultado..."
                            options={[
                              { value: "FIT", label: "Apto" },
                              { value: "UNFIT", label: "Inapto" },
                              { value: "FIT_RESTRICTIONS", label: "Apto c/ Restrições" },
                            ]}
                          />
                          <Input
                            value={examResultForm.examId === exam.id ? examResultForm.asoNumber : ""}
                            onChange={(e) => setExamResultForm((p) => ({ ...p, examId: exam.id, asoNumber: e.target.value }))}
                            placeholder="Nº ASO"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              if (!examResultForm.result) {
                                toast.error("Selecione o resultado");
                                return;
                              }
                              recordExamResultMutation.mutate({
                                examId: exam.id,
                                result: examResultForm.result as "FIT" | "UNFIT" | "FIT_RESTRICTIONS" | "PENDING",
                                asoNumber: examResultForm.asoNumber || undefined,
                                notes: examResultForm.notes || undefined,
                              });
                            }}
                            disabled={recordExamResultMutation.isPending}
                          >
                            {recordExamResultMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Salvar"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-theme-muted text-center py-4">Nenhum exame agendado</p>
            )}
          </PageCard>
        </div>

        {/* Coluna Lateral — Ações */}
        <div className="space-y-6">
          {/* Progresso */}
          {(() => {
            const completedSteps = admission.admission_steps?.filter((s: { status: string }) => s.status === "COMPLETED").length || 0;
            const totalSteps = admission.admission_steps?.length || admission.totalSteps || 1;
            const pct = Math.round((completedSteps / totalSteps) * 100);
            return (
              <PageCard title="Progresso">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 bg-theme-tertiary rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-theme">
                    {completedSteps}/{totalSteps}
                  </span>
                </div>
                <div className="text-sm text-theme-muted space-y-1">
                  <p>Criado em: {formatDate(admission.createdAt)}</p>
                  {admission.completedAt && <p>Concluído em: {formatDate(admission.completedAt)}</p>}
                </div>
              </PageCard>
            );
          })()}

          {/* Ações Rápidas */}
          {!isTerminal && (
            <PageCard title="Ações">
              <div className="space-y-2">
                {admission.status === "APPROVAL" && (
                  <>
                    <Button
                      className="w-full justify-start"
                      onClick={() => approveMutation.mutate({ id: admissionId })}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ThumbsUp className="w-4 h-4 mr-2" />
                      )}
                      Aprovar Admissão
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      onClick={() => {
                        if (!rejectReason.trim()) {
                          toast.error("Informe o motivo da rejeição");
                          return;
                        }
                        rejectMutation.mutate({ id: admissionId, reason: rejectReason });
                      }}
                      disabled={rejectMutation.isPending}
                    >
                      {rejectMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ThumbsDown className="w-4 h-4 mr-2" />
                      )}
                      Rejeitar
                    </Button>
                    <Input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Motivo da rejeição..."
                      className="text-sm"
                    />
                  </>
                )}

                {admission.status === "APPROVED" && (
                  <Button
                    className="w-full justify-start"
                    onClick={() => completeMutation.mutate({ id: admissionId })}
                    disabled={completeMutation.isPending}
                  >
                    {completeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <UserCheck className="w-4 h-4 mr-2" />
                    )}
                    Concluir e Criar Funcionário
                  </Button>
                )}

                <hr className="border-theme my-2" />

                {!showCancelForm ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    onClick={() => setShowCancelForm(true)}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Cancelar Processo
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Input
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Motivo do cancelamento..."
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          if (!cancelReason.trim()) {
                            toast.error("Informe o motivo");
                            return;
                          }
                          cancelMutation.mutate({ id: admissionId, reason: cancelReason });
                        }}
                        disabled={cancelMutation.isPending}
                      >
                        Confirmar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setShowCancelForm(false); setCancelReason(""); }}
                      >
                        Voltar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </PageCard>
          )}

          {/* Info Resumida */}
          <PageCard title="Resumo">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-theme-muted">Documentos</span>
                <span className="font-medium text-theme">
                  {admission.admission_documents?.filter((d: { status: string }) => d.status === "VERIFIED").length || 0}
                  /{admission.admission_documents?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Exames</span>
                <span className="font-medium text-theme">
                  {admission.admission_exams?.filter((e: { result: string | null }) => e.result).length || 0}
                  /{admission.admission_exams?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Etapas</span>
                <span className="font-medium text-theme">
                  {admission.admission_steps?.filter((s: { status: string }) => s.status === "COMPLETED").length || 0}
                  /{admission.admission_steps?.length || 0}
                </span>
              </div>
            </div>
          </PageCard>
        </div>
      </div>

      {/* Drawer de Detalhes da Etapa */}
      <Drawer
        isOpen={!!selectedStep}
        onClose={() => setSelectedStep(null)}
        title={selectedStep ? `Etapa ${selectedStep.stepNumber}: ${selectedStep.stepName}` : ""}
        size="md"
      >
        {selectedStep && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-theme-muted">Status</span>
                <div className="mt-1">
                  <Badge variant={(stepStatusConfig[selectedStep.status] || stepStatusConfig.PENDING).variant}>
                    {(stepStatusConfig[selectedStep.status] || stepStatusConfig.PENDING).label}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-theme-muted">Tipo</span>
                <p className="font-medium text-theme mt-1">{stepTypeLabels[selectedStep.stepType] || selectedStep.stepType}</p>
              </div>
              {selectedStep.completedAt && (
                <div>
                  <span className="text-theme-muted">Concluído em</span>
                  <p className="font-medium text-theme mt-1">{formatDate(selectedStep.completedAt)}</p>
                </div>
              )}
              {selectedStep.completedBy && (
                <div>
                  <span className="text-theme-muted">Concluído por</span>
                  <p className="font-medium text-theme mt-1 truncate">{selectedStep.completedBy}</p>
                </div>
              )}
            </div>

            <div className="text-sm">
              <span className="text-theme-muted">Observações</span>
              {selectedStep.status === "COMPLETED" ? (
                <p className="font-medium text-theme mt-1 whitespace-pre-wrap">
                  {selectedStep.notes || "—"}
                </p>
              ) : (
                <>
                  <Textarea
                    value={stepNotes}
                    onChange={(e) => setStepNotes(e.target.value)}
                    placeholder="Adicionar observações sobre esta etapa..."
                    rows={3}
                    className="mt-1"
                  />
                  {stepNotes !== (selectedStep.notes || "") && (
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => updateStepNotesMutation.mutate({ stepId: selectedStep.id, notes: stepNotes })}
                      disabled={updateStepNotesMutation.isPending}
                    >
                      {updateStepNotesMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : null}
                      Salvar Notas
                    </Button>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-theme">
              {selectedStep.status === "COMPLETED" ? (
                <Button
                  variant="outline"
                  onClick={() => reopenStepMutation.mutate({ stepId: selectedStep.id })}
                  disabled={reopenStepMutation.isPending || isTerminal}
                  leftIcon={reopenStepMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <RotateCcw className="w-4 h-4" />
                  }
                >
                  Reabrir Etapa
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    completeStepMutation.mutate({ stepId: selectedStep.id, notes: stepNotes || undefined });
                  }}
                  disabled={completeStepMutation.isPending || selectedStep.status !== "IN_PROGRESS" || isTerminal}
                  leftIcon={completeStepMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <CheckCircle className="w-4 h-4" />
                  }
                >
                  Concluir Etapa
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
