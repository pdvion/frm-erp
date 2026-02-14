"use client";

import { use, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Drawer, useDrawer } from "@/components/ui/Drawer";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { toast } from "sonner";
import { uploadImage, STORAGE_PATHS } from "@/lib/storage";

import {
  UserPlus,
  ArrowLeft,
  Loader2,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  Eye,
  ShieldCheck,
  ShieldX,
  ExternalLink,
  Link2,
  Link2Off,
  Copy,
  ClipboardCheck,
  User,
  MapPin,
  CreditCard,
  Stethoscope,
  ChevronRight,
} from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "info" | "purple" | "emerald" }> = {
  DRAFT: { label: "Rascunho", variant: "default" },
  DOCUMENTS: { label: "Documentos", variant: "info" },
  EXAM: { label: "Exame", variant: "warning" },
  APPROVAL: { label: "Aprovação", variant: "purple" },
  APPROVED: { label: "Aprovado", variant: "success" },
  REJECTED: { label: "Rejeitado", variant: "error" },
  COMPLETED: { label: "Concluído", variant: "emerald" },
  CANCELLED: { label: "Cancelado", variant: "default" },
};

const docStatusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "info"; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", variant: "default", icon: <Clock className="w-3.5 h-3.5" /> },
  UPLOADED: { label: "Enviado", variant: "info", icon: <Upload className="w-3.5 h-3.5" /> },
  VERIFIED: { label: "Verificado", variant: "success", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  REJECTED: { label: "Rejeitado", variant: "error", icon: <ShieldX className="w-3.5 h-3.5" /> },
};

const stepStatusConfig: Record<string, { label: string; variant: "default" | "success" | "info" | "warning" }> = {
  PENDING: { label: "Pendente", variant: "default" },
  IN_PROGRESS: { label: "Em Andamento", variant: "info" },
  COMPLETED: { label: "Concluído", variant: "success" },
  SKIPPED: { label: "Pulado", variant: "warning" },
};

const examResultConfig: Record<string, { label: string; variant: "default" | "success" | "error" | "warning" }> = {
  PENDING: { label: "Aguardando", variant: "default" },
  FIT: { label: "Apto", variant: "success" },
  UNFIT: { label: "Inapto", variant: "error" },
  FIT_RESTRICTIONS: { label: "Apto c/ Restrições", variant: "warning" },
};

const docStatusStyles: Record<string, { bg: string; iconColor: string }> = {
  VERIFIED: { bg: "bg-green-100 dark:bg-green-900/30", iconColor: "text-green-600" },
  UPLOADED: { bg: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-600" },
  REJECTED: { bg: "bg-red-100 dark:bg-red-900/30", iconColor: "text-red-600" },
  PENDING: { bg: "bg-theme-tertiary", iconColor: "text-theme-muted" },
};

interface AdmissionDocument {
  id: string;
  documentType: string;
  documentName: string;
  fileUrl: string | null;
  status: string;
  isRequired: boolean | null;
  uploadedAt: Date | null;
  verifiedAt: Date | null;
  rejectionReason: string | null;
}

interface AdmissionStep {
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
}

type TabId = "overview" | "documents" | "steps" | "exams";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdmissionDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [copiedLink, setCopiedLink] = useState(false);

  // Document drawer state
  const documentDrawer = useDrawer();
  const [selectedDoc, setSelectedDoc] = useState<AdmissionDocument | null>(null);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Upload state
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: admission, isLoading, error } = trpc.admission.byId.useQuery({ id });

  const uploadDocMutation = trpc.admission.uploadDocument.useMutation({
    onSuccess: () => {
      toast.success("Documento enviado com sucesso!");
      utils.admission.byId.invalidate({ id });
      setUploadingDocId(null);
      if (selectedDoc) {
        setSelectedDoc({ ...selectedDoc, status: "UPLOADED", fileUrl: "uploaded", uploadedAt: new Date() });
      }
    },
    onError: (err) => {
      toast.error("Erro ao enviar documento", { description: err.message });
      setUploadingDocId(null);
    },
  });

  const verifyDocMutation = trpc.admission.verifyDocument.useMutation({
    onSuccess: (_, variables) => {
      toast.success(variables.approved ? "Documento verificado!" : "Documento rejeitado");
      utils.admission.byId.invalidate({ id });
      setRejectModalOpen(false);
      setRejectionReason("");
      documentDrawer.close();
      setSelectedDoc(null);
    },
    onError: (err) => {
      toast.error("Erro ao verificar documento", { description: err.message });
    },
  });

  const completeStepMutation = trpc.admission.completeStep.useMutation({
    onSuccess: () => {
      toast.success("Etapa concluída!");
      utils.admission.byId.invalidate({ id });
    },
    onError: (err) => {
      toast.error("Erro ao concluir etapa", { description: err.message });
    },
  });

  const generateTokenMutation = trpc.admission.generateToken.useMutation({
    onSuccess: (data) => {
      toast.success("Link do portal gerado!");
      utils.admission.byId.invalidate({ id });
      if (data.portalUrl) {
        const fullUrl = `${window.location.origin}${data.portalUrl}`;
        navigator.clipboard.writeText(fullUrl);
        toast.info("Link copiado para a área de transferência");
      }
    },
    onError: (err) => {
      toast.error("Erro ao gerar link", { description: err.message });
    },
  });

  const revokeTokenMutation = trpc.admission.revokeToken.useMutation({
    onSuccess: () => {
      toast.success("Link do portal revogado");
      utils.admission.byId.invalidate({ id });
    },
    onError: (err) => {
      toast.error("Erro ao revogar link", { description: err.message });
    },
  });

  const updatePhotoMutation = trpc.admission.update.useMutation({
    onSuccess: () => {
      utils.admission.byId.invalidate({ id });
    },
    onError: (err) => {
      toast.error("Erro ao atualizar foto", { description: err.message });
    },
  });

  async function handlePhotoUpload(file: File): Promise<string> {
    const result = await uploadImage(file, STORAGE_PATHS.avatars, `admission-${id}-${Date.now()}.${file.name.split(".").pop()}`);
    if (!result.success || !result.url) {
      throw new Error(result.error || "Erro no upload");
    }
    updatePhotoMutation.mutate({ id, candidatePhoto: result.url });
    toast.success("Foto atualizada!");
    return result.url;
  }

  // Handlers
  function openDocDrawer(doc: typeof selectedDoc) {
    setSelectedDoc(doc);
    documentDrawer.open();
  }

  function handleFileUpload(docId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Arquivo excede 10MB");
      return;
    }

    setUploadingDocId(docId);
    // For now, simulate upload URL — real implementation uses Supabase Storage via /api/admission/[token]/upload
    const fakeUrl = `uploads/${admission?.companyId}/${id}/${docId}.${file.name.split(".").pop()}`;
    uploadDocMutation.mutate({ documentId: docId, fileUrl: fakeUrl });
  }

  function handleVerify(docId: string) {
    verifyDocMutation.mutate({ documentId: docId, approved: true });
  }

  function handleReject(docId: string) {
    if (!rejectionReason.trim()) {
      toast.error("Informe o motivo da rejeição");
      return;
    }
    verifyDocMutation.mutate({ documentId: docId, approved: false, rejectionReason: rejectionReason.trim() });
  }

  function handleCopyPortalLink() {
    if (!admission?.accessToken) return;
    const url = `${window.location.origin}/admission/portal/${admission.accessToken}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function canCompleteDocumentStep(): boolean {
    if (!admission) return false;
    const requiredDocs = admission.admission_documents.filter((d) => d.isRequired);
    return requiredDocs.every((d) => d.status === "VERIFIED");
  }

  // Loading / Error states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !admission) {
    return (
      <div className="space-y-6">
        <PageHeader title="Processo não encontrado" icon={<UserPlus className="w-6 h-6" />} module="hr" />
        <div className="bg-theme-card rounded-lg border border-theme p-8 text-center">
          <UserPlus className="w-12 h-12 mx-auto text-theme-muted mb-4" />
          <p className="text-theme-muted mb-4">O processo de admissão solicitado não foi encontrado.</p>
          <Link
            href="/hr/admission"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  const statusCfg = statusConfig[admission.status] || statusConfig.DRAFT;
  const isClosed = ["COMPLETED", "CANCELLED", "REJECTED"].includes(admission.status);
  const docsTotal = admission.admission_documents.length;
  const docsVerified = admission.admission_documents.filter((d) => d.status === "VERIFIED").length;

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "overview", label: "Visão Geral", icon: <User className="w-4 h-4" /> },
    { id: "documents", label: "Documentos", icon: <FileText className="w-4 h-4" />, count: docsTotal },
    { id: "steps", label: "Etapas", icon: <CheckCircle className="w-4 h-4" />, count: admission.admission_steps.length },
    { id: "exams", label: "Exames", icon: <Stethoscope className="w-4 h-4" />, count: admission.admission_exams.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Admissão #${admission.code}`}
        icon={<UserPlus className="w-6 h-6" />}
        backHref="/hr/admission"
        module="hr"
      />

      {/* Header Card */}
      <div className="bg-theme-card rounded-lg border border-theme p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <ImageUpload
              value={admission.candidatePhoto}
              onChange={(url) => {
                if (url === null) {
                  updatePhotoMutation.mutate({ id, candidatePhoto: null });
                }
              }}
              onUpload={handlePhotoUpload}
              shape="circle"
              size="lg"
              alt={`Foto de ${admission.candidateName}`}
              placeholder={
                <span className="text-2xl font-bold text-theme-muted">
                  {admission.candidateName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </span>
              }
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-theme">{admission.candidateName}</h2>
                <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
              </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-theme-muted">
              {admission.candidateEmail && (
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {admission.candidateEmail}
                </div>
              )}
              {admission.candidatePhone && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {admission.candidatePhone}
                </div>
              )}
              {admission.candidateCpf && (
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  {admission.candidateCpf}
                </div>
              )}
              {admission.proposedSalary && (
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  {formatCurrency(admission.proposedSalary)}
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-theme-muted mb-1">
                <span>Etapa {admission.currentStep} de {admission.totalSteps}</span>
                <span>{docsVerified}/{docsTotal} documentos verificados</span>
              </div>
              <div className="w-full bg-theme-tertiary rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${((admission.currentStep || 0) / (admission.totalSteps || 1)) * 100}%` }}
                />
              </div>
            </div>
            </div>{/* close inner flex-1 */}
          </div>{/* close flex items-start gap-4 */}

          {/* Portal Link Actions */}
          {!isClosed && (
            <div className="flex flex-col gap-2 min-w-[200px]">
              {admission.accessToken ? (
                <>
                  <div className="text-xs text-theme-muted mb-1">
                    Portal ativo {admission.tokenExpiresAt && (
                      <>até {formatDate(admission.tokenExpiresAt)}</>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPortalLink}
                  >
                    {copiedLink ? <ClipboardCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedLink ? "Copiado!" : "Copiar Link"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/admission/portal/${admission.accessToken}`, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir Portal
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeTokenMutation.mutate({ id })}
                    disabled={revokeTokenMutation.isPending}
                  >
                    <Link2Off className="w-4 h-4" />
                    Revogar Link
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateTokenMutation.mutate({ id })}
                  disabled={generateTokenMutation.isPending}
                >
                  {generateTokenMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                  Gerar Link do Portal
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-theme">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-theme-muted hover:text-theme hover:border-theme"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-theme-tertiary">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab admission={admission} />}
      {activeTab === "documents" && (
        <DocumentsTab
          documents={admission.admission_documents}
          onOpenDoc={openDocDrawer}
          canCompleteStep={canCompleteDocumentStep()}
        />
      )}
      {activeTab === "steps" && (
        <StepsTab
          steps={admission.admission_steps}
          isClosed={isClosed}
          canCompleteDocStep={canCompleteDocumentStep()}
          onCompleteStep={(stepId) => completeStepMutation.mutate({ stepId })}
          isCompleting={completeStepMutation.isPending}
        />
      )}
      {activeTab === "exams" && <ExamsTab exams={admission.admission_exams} />}

      {/* Document Drawer */}
      <Drawer
        isOpen={documentDrawer.isOpen}
        onClose={() => { documentDrawer.close(); setSelectedDoc(null); }}
        title={selectedDoc?.documentName || "Documento"}
        description={selectedDoc?.isRequired ? "Documento obrigatório" : "Documento opcional"}
        size="lg"
      >
        {selectedDoc && (
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-theme-muted">Status:</span>
                <Badge variant={docStatusConfig[selectedDoc.status]?.variant || "default"}>
                  {docStatusConfig[selectedDoc.status]?.icon}
                  {docStatusConfig[selectedDoc.status]?.label || selectedDoc.status}
                </Badge>
              </div>
              {selectedDoc.isRequired && (
                <Badge variant="warning">Obrigatório</Badge>
              )}
            </div>

            {/* Rejection reason */}
            {selectedDoc.status === "REJECTED" && selectedDoc.rejectionReason && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">Motivo da rejeição:</p>
                <p className="text-sm text-red-700 dark:text-red-400">{selectedDoc.rejectionReason}</p>
              </div>
            )}

            {/* File preview / upload */}
            {selectedDoc.fileUrl ? (
              <div className="space-y-3">
                <div className="bg-theme-tertiary rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-theme">Arquivo enviado</p>
                      <p className="text-xs text-theme-muted">
                        {selectedDoc.uploadedAt && `Enviado em ${formatDate(selectedDoc.uploadedAt)}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedDoc.fileUrl!, "_blank")}
                  >
                    <Eye className="w-4 h-4" />
                    Visualizar
                  </Button>
                </div>

                {/* Re-upload if rejected */}
                {selectedDoc.status === "REJECTED" && !isClosed && (
                  <div>
                    <label className="block text-sm font-medium text-theme mb-2">Reenviar arquivo:</label>
                    <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-theme rounded-lg cursor-pointer hover:bg-theme-tertiary transition-colors">
                      <Upload className="w-5 h-5 text-theme-muted" />
                      <span className="text-sm text-theme-muted">Clique para selecionar</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={(e) => handleFileUpload(selectedDoc.id, e)}
                      />
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-theme mb-2">Upload do documento:</label>
                <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-theme rounded-lg cursor-pointer hover:bg-theme-tertiary transition-colors">
                  {uploadingDocId === selectedDoc.id ? (
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-theme-muted" />
                      <span className="text-sm text-theme-muted">Clique para selecionar ou arraste o arquivo</span>
                      <span className="text-xs text-theme-muted">PDF, JPEG, PNG, WebP — máx. 10MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => handleFileUpload(selectedDoc.id, e)}
                    disabled={uploadingDocId === selectedDoc.id}
                  />
                </label>
              </div>
            )}

            {/* Verification info */}
            {selectedDoc.verifiedAt && (
              <div className="text-xs text-theme-muted">
                Verificado em {formatDate(selectedDoc.verifiedAt)}
              </div>
            )}

            {/* Action buttons */}
            {selectedDoc.status === "UPLOADED" && !isClosed && (
              <div className="flex gap-3 pt-4 border-t border-theme">
                <Button
                  variant="primary"
                  onClick={() => handleVerify(selectedDoc.id)}
                  disabled={verifyDocMutation.isPending}
                  className="flex-1"
                >
                  {verifyDocMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  Verificar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setRejectModalOpen(true)}
                  disabled={verifyDocMutation.isPending}
                  className="flex-1"
                >
                  <ShieldX className="w-4 h-4" />
                  Rejeitar
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => { setRejectModalOpen(false); setRejectionReason(""); }}
        title="Rejeitar Documento"
        description="Informe o motivo da rejeição para que o candidato possa corrigir."
        size="sm"
      >
        <div className="space-y-4">
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Ex: Documento ilegível, fora da validade..."
            rows={3}
          />
          <ModalFooter>
            <Button variant="ghost" onClick={() => { setRejectModalOpen(false); setRejectionReason(""); }}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => selectedDoc && handleReject(selectedDoc.id)}
              disabled={!rejectionReason.trim() || verifyDocMutation.isPending}
            >
              {verifyDocMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldX className="w-4 h-4" />}
              Confirmar Rejeição
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({ admission }: { admission: Record<string, unknown> & {
  candidateName: string;
  candidateEmail: string | null;
  candidatePhone: string | null;
  candidateCpf: string | null;
  candidateRg: string | null;
  candidateBirthDate: Date | null;
  candidateGender: string | null;
  candidateMaritalStatus: string | null;
  candidateMobile: string | null;
  candidateAddress: string | null;
  candidateAddressNumber: string | null;
  candidateAddressComplement: string | null;
  candidateAddressNeighborhood: string | null;
  candidateAddressCity: string | null;
  candidateAddressState: string | null;
  candidateAddressZipCode: string | null;
  proposedSalary: unknown;
  proposedStartDate: Date | null;
  contractType: string | null;
  candidateBankName: string | null;
  candidateBankAgency: string | null;
  candidateBankAccount: string | null;
  candidateBankAccountDigit: string | null;
  candidateBankAccountType: string | null;
  candidatePixKey: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}}) {
  const genderLabels: Record<string, string> = { M: "Masculino", F: "Feminino", O: "Outro" };
  const maritalLabels: Record<string, string> = {
    SINGLE: "Solteiro(a)", MARRIED: "Casado(a)", DIVORCED: "Divorciado(a)",
    WIDOWED: "Viúvo(a)", SEPARATED: "Separado(a)", STABLE_UNION: "União Estável",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Dados Pessoais */}
      <div className="bg-theme-card rounded-lg border border-theme p-5">
        <h3 className="text-sm font-semibold text-theme mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          Dados Pessoais
        </h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <InfoItem label="Nome" value={admission.candidateName} />
          <InfoItem label="Email" value={admission.candidateEmail} />
          <InfoItem label="Telefone" value={admission.candidatePhone} />
          <InfoItem label="Celular" value={admission.candidateMobile} />
          <InfoItem label="CPF" value={admission.candidateCpf} />
          <InfoItem label="RG" value={admission.candidateRg} />
          <InfoItem label="Nascimento" value={admission.candidateBirthDate ? formatDate(admission.candidateBirthDate) : null} />
          <InfoItem label="Gênero" value={admission.candidateGender ? genderLabels[admission.candidateGender] || admission.candidateGender : null} />
          <InfoItem label="Estado Civil" value={admission.candidateMaritalStatus ? maritalLabels[admission.candidateMaritalStatus] || admission.candidateMaritalStatus : null} />
        </dl>
      </div>

      {/* Endereço */}
      <div className="bg-theme-card rounded-lg border border-theme p-5">
        <h3 className="text-sm font-semibold text-theme mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-green-600" />
          Endereço
        </h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <InfoItem label="Logradouro" value={admission.candidateAddress} span2 />
          <InfoItem label="Número" value={admission.candidateAddressNumber} />
          <InfoItem label="Complemento" value={admission.candidateAddressComplement} />
          <InfoItem label="Bairro" value={admission.candidateAddressNeighborhood} />
          <InfoItem label="Cidade" value={admission.candidateAddressCity} />
          <InfoItem label="Estado" value={admission.candidateAddressState} />
          <InfoItem label="CEP" value={admission.candidateAddressZipCode} />
        </dl>
      </div>

      {/* Dados Contratuais */}
      <div className="bg-theme-card rounded-lg border border-theme p-5">
        <h3 className="text-sm font-semibold text-theme mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-600" />
          Dados Contratuais
        </h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <InfoItem label="Salário Proposto" value={admission.proposedSalary ? formatCurrency(admission.proposedSalary) : null} />
          <InfoItem label="Data Início" value={admission.proposedStartDate ? formatDate(admission.proposedStartDate) : null} />
          <InfoItem label="Tipo Contrato" value={admission.contractType} />
          <InfoItem label="Criado em" value={formatDate(admission.createdAt)} />
        </dl>
      </div>

      {/* Dados Bancários */}
      <div className="bg-theme-card rounded-lg border border-theme p-5">
        <h3 className="text-sm font-semibold text-theme mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-orange-600" />
          Dados Bancários
        </h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <InfoItem label="Banco" value={admission.candidateBankName} />
          <InfoItem label="Agência" value={admission.candidateBankAgency} />
          <InfoItem label="Conta" value={admission.candidateBankAccount ? `${admission.candidateBankAccount}-${admission.candidateBankAccountDigit || ""}` : null} />
          <InfoItem label="Tipo" value={admission.candidateBankAccountType} />
          <InfoItem label="PIX" value={admission.candidatePixKey} span2 />
        </dl>
      </div>

      {/* Observações */}
      {admission.notes && (
        <div className="bg-theme-card rounded-lg border border-theme p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-theme mb-2">Observações</h3>
          <p className="text-sm text-theme-muted whitespace-pre-wrap">{admission.notes}</p>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value, span2 }: { label: string; value: string | null | undefined; span2?: boolean }) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <dt className="text-theme-muted text-xs">{label}</dt>
      <dd className="text-theme font-medium mt-0.5">{value || "—"}</dd>
    </div>
  );
}

// ─── Documents Tab ───────────────────────────────────────────────────────────

function DocumentsTab({
  documents,
  onOpenDoc,
  canCompleteStep,
}: {
  documents: {
    id: string;
    documentType: string;
    documentName: string;
    fileUrl: string | null;
    status: string;
    isRequired: boolean | null;
    uploadedAt: Date | null;
    verifiedAt: Date | null;
    verifiedBy: string | null;
    rejectionReason: string | null;
    createdAt: Date;
  }[];
  onOpenDoc: (doc: AdmissionDocument) => void;
  canCompleteStep: boolean;
}) {
  const required = documents.filter((d) => d.isRequired);
  const optional = documents.filter((d) => !d.isRequired);
  const requiredVerified = required.filter((d) => d.status === "VERIFIED").length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-theme-card rounded-lg border border-theme p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium text-theme">{requiredVerified}/{required.length}</span>
            <span className="text-theme-muted"> documentos obrigatórios verificados</span>
          </div>
          {canCompleteStep ? (
            <Badge variant="success">
              <CheckCircle className="w-3.5 h-3.5" />
              Pronto para avançar
            </Badge>
          ) : (
            <Badge variant="warning">
              <AlertCircle className="w-3.5 h-3.5" />
              Documentos pendentes
            </Badge>
          )}
        </div>
        <div className="w-full bg-theme-tertiary rounded-full h-2 mt-3">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${required.length > 0 ? (requiredVerified / required.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Required Documents */}
      <div>
        <h3 className="text-sm font-semibold text-theme mb-3">Documentos Obrigatórios</h3>
        <div className="space-y-2">
          {required.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} onClick={() => onOpenDoc(doc)} />
          ))}
        </div>
      </div>

      {/* Optional Documents */}
      {optional.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-theme mb-3">Documentos Opcionais</h3>
          <div className="space-y-2">
            {optional.map((doc) => (
              <DocumentRow key={doc.id} doc={doc} onClick={() => onOpenDoc(doc)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentRow({ doc, onClick }: {
  doc: {
    id: string;
    documentName: string;
    status: string;
    fileUrl: string | null;
    uploadedAt: Date | null;
    isRequired: boolean | null;
  };
  onClick: () => void;
}) {
  const cfg = docStatusConfig[doc.status] || docStatusConfig.PENDING;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-theme-card rounded-lg border border-theme hover:bg-theme-hover transition-colors text-left group"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          (docStatusStyles[doc.status] ?? docStatusStyles.PENDING).bg
        }`}>
          <FileText className={`w-5 h-5 ${
            (docStatusStyles[doc.status] ?? docStatusStyles.PENDING).iconColor
          }`} />
        </div>
        <div>
          <p className="text-sm font-medium text-theme">{doc.documentName}</p>
          <p className="text-xs text-theme-muted">
            {doc.uploadedAt ? `Enviado em ${formatDate(doc.uploadedAt)}` : "Aguardando envio"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={cfg.variant}>
          {cfg.icon}
          {cfg.label}
        </Badge>
        <ChevronRight className="w-4 h-4 text-theme-muted group-hover:text-theme transition-colors" />
      </div>
    </button>
  );
}

// ─── Steps Tab ───────────────────────────────────────────────────────────────

function StepsTab({
  steps,
  isClosed,
  canCompleteDocStep,
  onCompleteStep,
  isCompleting,
}: {
  steps: AdmissionStep[];
  isClosed: boolean;
  canCompleteDocStep: boolean;
  onCompleteStep: (stepId: string) => void;
  isCompleting: boolean;
}) {
  return (
    <div className="space-y-3">
      {steps.map((step) => {
        const cfg = stepStatusConfig[step.status] || stepStatusConfig.PENDING;
        const isDocStep = step.stepType === "DOCUMENT";
        const canComplete = step.status === "IN_PROGRESS" && !isClosed && (!isDocStep || canCompleteDocStep);
        const isBlocked = isDocStep && step.status === "IN_PROGRESS" && !canCompleteDocStep;

        return (
          <div
            key={step.id}
            className={`flex items-start gap-4 p-4 bg-theme-card rounded-lg border transition-colors ${
              step.status === "IN_PROGRESS" ? "border-blue-300 dark:border-blue-700" : "border-theme"
            }`}
          >
            {/* Step number circle */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
              step.status === "COMPLETED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
              step.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
              "bg-theme-tertiary text-theme-muted"
            }`}>
              {step.status === "COMPLETED" ? <CheckCircle className="w-5 h-5" /> : step.stepNumber}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-theme">{step.stepName}</h4>
                <Badge variant={cfg.variant}>{cfg.label}</Badge>
              </div>
              {step.completedAt && (
                <p className="text-xs text-theme-muted">Concluída em {formatDate(step.completedAt)}</p>
              )}
              {step.notes && (
                <p className="text-xs text-theme-muted mt-1">{step.notes}</p>
              )}
              {isBlocked && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Todos os documentos obrigatórios devem estar verificados
                </p>
              )}
            </div>

            {canComplete && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onCompleteStep(step.id)}
                disabled={isCompleting}
              >
                {isCompleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Concluir
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Exams Tab ───────────────────────────────────────────────────────────────

function ExamsTab({ exams }: {
  exams: {
    id: string;
    examType: string;
    clinicName: string | null;
    scheduledDate: Date | null;
    completedDate: Date | null;
    result: string | null;
    asoNumber: string | null;
    notes: string | null;
  }[];
}) {
  if (exams.length === 0) {
    return (
      <div className="bg-theme-card rounded-lg border border-theme p-8 text-center">
        <Stethoscope className="w-10 h-10 mx-auto text-theme-muted mb-3" />
        <p className="text-theme-muted text-sm">Nenhum exame agendado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {exams.map((exam) => {
        const resultCfg = examResultConfig[exam.result || "PENDING"] || examResultConfig.PENDING;
        return (
          <div key={exam.id} className="bg-theme-card rounded-lg border border-theme p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-theme">{exam.examType}</h4>
              <Badge variant={resultCfg.variant}>{resultCfg.label}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {exam.clinicName && <InfoItem label="Clínica" value={exam.clinicName} />}
              {exam.scheduledDate && <InfoItem label="Agendado" value={formatDate(exam.scheduledDate)} />}
              {exam.completedDate && <InfoItem label="Realizado" value={formatDate(exam.completedDate)} />}
              {exam.asoNumber && <InfoItem label="ASO" value={exam.asoNumber} />}
            </div>
            {exam.notes && <p className="text-xs text-theme-muted mt-2">{exam.notes}</p>}
          </div>
        );
      })}
    </div>
  );
}
