"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  User,
  MapPin,
  FileText,
  CreditCard,
  CheckCircle2,
  Upload,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Building2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdmissionDocument {
  id: string;
  documentType: string;
  documentName: string;
  fileUrl: string | null;
  status: string;
  isRequired: boolean | null;
  uploadedAt: string | null;
  rejectionReason: string | null;
}

interface AdmissionStep {
  id: string;
  stepNumber: number;
  stepName: string;
  stepType: string;
  status: string;
}

interface AdmissionData {
  id: string;
  candidateName: string;
  candidateEmail: string | null;
  candidatePhone: string | null;
  candidateCpf: string | null;
  candidateRg: string | null;
  candidateBirthDate: string | null;
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
  candidatePis: string | null;
  candidateCtps: string | null;
  candidateCtpsSeries: string | null;
  candidateVoterRegistration: string | null;
  candidateMilitaryService: string | null;
  candidateBankName: string | null;
  candidateBankCode: string | null;
  candidateBankBranch: string | null;
  candidateBankAgency: string | null;
  candidateBankAccount: string | null;
  candidateBankAccountDigit: string | null;
  candidateBankAccountType: string | null;
  candidatePixKey: string | null;
  status: string;
  documents: AdmissionDocument[];
  steps: AdmissionStep[];
  tokenExpiresAt: string | null;
}

type WizardStep = "personal" | "address" | "documents_info" | "bank" | "upload" | "review";

const WIZARD_STEPS: { key: WizardStep; label: string; icon: React.ReactNode }[] = [
  { key: "personal", label: "Dados Pessoais", icon: <User className="w-4 h-4" /> },
  { key: "address", label: "Endereço", icon: <MapPin className="w-4 h-4" /> },
  { key: "documents_info", label: "Documentos", icon: <FileText className="w-4 h-4" /> },
  { key: "bank", label: "Dados Bancários", icon: <CreditCard className="w-4 h-4" /> },
  { key: "upload", label: "Enviar Arquivos", icon: <Upload className="w-4 h-4" /> },
  { key: "review", label: "Revisão", icon: <CheckCircle2 className="w-4 h-4" /> },
];

const BRAZILIAN_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const GENDER_OPTIONS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Feminino" },
  { value: "O", label: "Outro" },
];

const MARITAL_STATUS_OPTIONS = [
  { value: "SINGLE", label: "Solteiro(a)" },
  { value: "MARRIED", label: "Casado(a)" },
  { value: "DIVORCED", label: "Divorciado(a)" },
  { value: "WIDOWED", label: "Viúvo(a)" },
  { value: "SEPARATED", label: "Separado(a)" },
  { value: "STABLE_UNION", label: "União Estável" },
];

const BANK_ACCOUNT_TYPES = [
  { value: "CHECKING", label: "Conta Corrente" },
  { value: "SAVINGS", label: "Conta Poupança" },
  { value: "SALARY", label: "Conta Salário" },
];

// ─── Components ──────────────────────────────────────────────────────────────

function PortalInput({
  label,
  error,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        className={`w-full rounded-lg border px-4 py-2.5 text-gray-900 bg-white transition-colors
          focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
    </div>
  );
}

function PortalSelect({
  label,
  options,
  error,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
}) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        className={`w-full rounded-lg border px-4 py-2.5 text-gray-900 bg-white transition-colors
          focus:outline-none focus:ring-2 focus:ring-offset-0
          ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"}
        `}
        {...props}
      >
        <option value="">Selecione...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CandidatePortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [admission, setAdmission] = useState<AdmissionData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const fetchAdmission = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admission/${token}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao carregar dados");
        return;
      }
      const data: AdmissionData = await res.json();
      setAdmission(data);

      // Initialize form data from admission
      const initial: Record<string, string> = {};
      const fields = [
        "candidateRg", "candidateBirthDate", "candidateGender", "candidateMaritalStatus",
        "candidateMobile", "candidateAddress", "candidateAddressNumber",
        "candidateAddressComplement", "candidateAddressNeighborhood", "candidateAddressCity",
        "candidateAddressState", "candidateAddressZipCode", "candidatePis", "candidateCtps",
        "candidateCtpsSeries", "candidateVoterRegistration", "candidateMilitaryService",
        "candidateBankName", "candidateBankCode", "candidateBankBranch", "candidateBankAgency",
        "candidateBankAccount", "candidateBankAccountDigit", "candidateBankAccountType",
        "candidatePixKey",
      ];
      for (const f of fields) {
        const val = data[f as keyof AdmissionData];
        if (val) {
          if (f === "candidateBirthDate" && typeof val === "string") {
            initial[f] = val.split("T")[0];
          } else {
            initial[f] = String(val);
          }
        }
      }
      setFormData(initial);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAdmission();
  }, [fetchAdmission]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const saveData = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/admission/${token}/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveMessage(data.error || "Erro ao salvar");
        return;
      }
      setSaveMessage("Dados salvos com sucesso!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage("Erro de conexão ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (documentId: string, file: File) => {
    setUploadingDoc(documentId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("documentId", documentId);

      const res = await fetch(`/api/admission/${token}/upload`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao enviar arquivo");
        return;
      }

      // Refresh admission data to get updated document status
      await fetchAdmission();
    } catch {
      alert("Erro de conexão ao enviar arquivo.");
    } finally {
      setUploadingDoc(null);
      setSelectedDocId(null);
    }
  };

  const handleNext = async () => {
    // Save data before moving to next step (except upload and review steps)
    const step = WIZARD_STEPS[currentStep].key;
    if (step !== "upload" && step !== "review") {
      await saveData();
    }
    setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // ─── Loading / Error States ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Indisponível</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!admission) return null;

  const isReadOnly = ["COMPLETED", "CANCELLED", "REJECTED"].includes(admission.status);

  // ─── Step Content ──────────────────────────────────────────────────────────

  const renderStepContent = () => {
    const step = WIZARD_STEPS[currentStep].key;

    switch (step) {
      case "personal":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PortalInput
                label="Nome Completo"
                value={admission.candidateName}
                disabled
                hint="Preenchido pelo RH"
              />
              <PortalInput
                label="CPF"
                value={admission.candidateCpf || ""}
                disabled
                hint="Preenchido pelo RH"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PortalInput
                label="RG"
                value={formData.candidateRg || ""}
                onChange={(e) => handleChange("candidateRg", e.target.value)}
                placeholder="00.000.000-0"
                disabled={isReadOnly}
              />
              <PortalInput
                label="Data de Nascimento"
                type="date"
                value={formData.candidateBirthDate || ""}
                onChange={(e) => handleChange("candidateBirthDate", e.target.value)}
                disabled={isReadOnly}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PortalSelect
                label="Gênero"
                options={GENDER_OPTIONS}
                value={formData.candidateGender || ""}
                onChange={(e) => handleChange("candidateGender", e.target.value)}
                disabled={isReadOnly}
              />
              <PortalSelect
                label="Estado Civil"
                options={MARITAL_STATUS_OPTIONS}
                value={formData.candidateMaritalStatus || ""}
                onChange={(e) => handleChange("candidateMaritalStatus", e.target.value)}
                disabled={isReadOnly}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PortalInput
                label="Celular"
                value={formData.candidateMobile || ""}
                onChange={(e) => handleChange("candidateMobile", e.target.value)}
                placeholder="(00) 00000-0000"
                disabled={isReadOnly}
              />
              <PortalInput
                label="E-mail"
                value={admission.candidateEmail || ""}
                disabled
                hint="Preenchido pelo RH"
              />
            </div>
          </div>
        );

      case "address":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <PortalInput
                  label="CEP"
                  value={formData.candidateAddressZipCode || ""}
                  onChange={(e) => handleChange("candidateAddressZipCode", e.target.value)}
                  placeholder="00000-000"
                  disabled={isReadOnly}
                />
              </div>
              <PortalSelect
                label="UF"
                options={BRAZILIAN_STATES.map((s) => ({ value: s, label: s }))}
                value={formData.candidateAddressState || ""}
                onChange={(e) => handleChange("candidateAddressState", e.target.value)}
                disabled={isReadOnly}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <PortalInput
                  label="Logradouro"
                  value={formData.candidateAddress || ""}
                  onChange={(e) => handleChange("candidateAddress", e.target.value)}
                  placeholder="Rua, Avenida, etc."
                  disabled={isReadOnly}
                />
              </div>
              <PortalInput
                label="Número"
                value={formData.candidateAddressNumber || ""}
                onChange={(e) => handleChange("candidateAddressNumber", e.target.value)}
                placeholder="123"
                disabled={isReadOnly}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PortalInput
                label="Complemento"
                value={formData.candidateAddressComplement || ""}
                onChange={(e) => handleChange("candidateAddressComplement", e.target.value)}
                placeholder="Apto 101, Bloco B"
                disabled={isReadOnly}
              />
              <PortalInput
                label="Bairro"
                value={formData.candidateAddressNeighborhood || ""}
                onChange={(e) => handleChange("candidateAddressNeighborhood", e.target.value)}
                placeholder="Centro"
                disabled={isReadOnly}
              />
            </div>
            <PortalInput
              label="Cidade"
              value={formData.candidateAddressCity || ""}
              onChange={(e) => handleChange("candidateAddressCity", e.target.value)}
              placeholder="São Paulo"
              disabled={isReadOnly}
            />
          </div>
        );

      case "documents_info":
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-500">
              Preencha os dados dos seus documentos. Na próxima etapa você poderá enviar os arquivos digitalizados.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PortalInput
                label="PIS/PASEP"
                value={formData.candidatePis || ""}
                onChange={(e) => handleChange("candidatePis", e.target.value)}
                placeholder="000.00000.00-0"
                disabled={isReadOnly}
              />
              <PortalInput
                label="Título de Eleitor"
                value={formData.candidateVoterRegistration || ""}
                onChange={(e) => handleChange("candidateVoterRegistration", e.target.value)}
                placeholder="0000 0000 0000"
                disabled={isReadOnly}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <PortalInput
                label="CTPS (Número)"
                value={formData.candidateCtps || ""}
                onChange={(e) => handleChange("candidateCtps", e.target.value)}
                placeholder="0000000"
                disabled={isReadOnly}
              />
              <PortalInput
                label="CTPS (Série)"
                value={formData.candidateCtpsSeries || ""}
                onChange={(e) => handleChange("candidateCtpsSeries", e.target.value)}
                placeholder="000-0"
                disabled={isReadOnly}
              />
              <PortalInput
                label="Certificado Reservista"
                value={formData.candidateMilitaryService || ""}
                onChange={(e) => handleChange("candidateMilitaryService", e.target.value)}
                placeholder="Número"
                disabled={isReadOnly}
              />
            </div>
          </div>
        );

      case "bank":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PortalInput
                label="Banco"
                value={formData.candidateBankName || ""}
                onChange={(e) => handleChange("candidateBankName", e.target.value)}
                placeholder="Ex: Banco do Brasil"
                disabled={isReadOnly}
              />
              <PortalInput
                label="Código do Banco"
                value={formData.candidateBankCode || ""}
                onChange={(e) => handleChange("candidateBankCode", e.target.value)}
                placeholder="001"
                disabled={isReadOnly}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <PortalInput
                label="Agência"
                value={formData.candidateBankAgency || ""}
                onChange={(e) => handleChange("candidateBankAgency", e.target.value)}
                placeholder="0000"
                disabled={isReadOnly}
              />
              <PortalInput
                label="Conta"
                value={formData.candidateBankAccount || ""}
                onChange={(e) => handleChange("candidateBankAccount", e.target.value)}
                placeholder="00000"
                disabled={isReadOnly}
              />
              <PortalInput
                label="Dígito"
                value={formData.candidateBankAccountDigit || ""}
                onChange={(e) => handleChange("candidateBankAccountDigit", e.target.value)}
                placeholder="0"
                disabled={isReadOnly}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PortalSelect
                label="Tipo de Conta"
                options={BANK_ACCOUNT_TYPES}
                value={formData.candidateBankAccountType || ""}
                onChange={(e) => handleChange("candidateBankAccountType", e.target.value)}
                disabled={isReadOnly}
              />
              <PortalInput
                label="Chave PIX"
                value={formData.candidatePixKey || ""}
                onChange={(e) => handleChange("candidatePixKey", e.target.value)}
                placeholder="CPF, e-mail, celular ou chave aleatória"
                disabled={isReadOnly}
              />
            </div>
          </div>
        );

      case "upload":
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Envie os documentos solicitados. Formatos aceitos: PDF, JPEG, PNG (máx. 10MB).
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && selectedDocId) {
                  handleFileUpload(selectedDocId, file);
                }
                e.target.value = "";
              }}
            />
            <div className="space-y-3">
              {admission.documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                    doc.status === "VERIFIED"
                      ? "bg-green-50 border-green-200"
                      : doc.status === "REJECTED"
                        ? "bg-red-50 border-red-200"
                        : doc.status === "UPLOADED"
                          ? "bg-blue-50 border-blue-200"
                          : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className={`w-5 h-5 flex-shrink-0 ${
                      doc.status === "VERIFIED" ? "text-green-600" :
                        doc.status === "REJECTED" ? "text-red-600" :
                          doc.status === "UPLOADED" ? "text-blue-600" :
                            "text-gray-400"
                    }`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.documentName}
                        {doc.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        {doc.status === "PENDING" && "Pendente de envio"}
                        {doc.status === "UPLOADED" && "Enviado — aguardando verificação"}
                        {doc.status === "VERIFIED" && "✓ Verificado"}
                        {doc.status === "REJECTED" && `✗ Rejeitado: ${doc.rejectionReason || "Motivo não informado"}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                    {!isReadOnly && doc.status !== "VERIFIED" && (
                      <button
                        onClick={() => {
                          setSelectedDocId(doc.id);
                          fileInputRef.current?.click();
                        }}
                        disabled={uploadingDoc === doc.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg
                          bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {uploadingDoc === doc.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {doc.status === "REJECTED" ? "Reenviar" : doc.fileUrl ? "Substituir" : "Enviar"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                Revise seus dados abaixo. Você pode voltar às etapas anteriores para corrigir qualquer informação.
              </p>
            </div>

            {/* Personal Data Summary */}
            <ReviewSection title="Dados Pessoais" icon={<User className="w-4 h-4" />}>
              <ReviewRow label="Nome" value={admission.candidateName} />
              <ReviewRow label="CPF" value={admission.candidateCpf} />
              <ReviewRow label="RG" value={formData.candidateRg} />
              <ReviewRow label="Data de Nascimento" value={formData.candidateBirthDate} />
              <ReviewRow label="Gênero" value={GENDER_OPTIONS.find((o) => o.value === formData.candidateGender)?.label} />
              <ReviewRow label="Estado Civil" value={MARITAL_STATUS_OPTIONS.find((o) => o.value === formData.candidateMaritalStatus)?.label} />
              <ReviewRow label="Celular" value={formData.candidateMobile} />
            </ReviewSection>

            {/* Address Summary */}
            <ReviewSection title="Endereço" icon={<MapPin className="w-4 h-4" />}>
              <ReviewRow label="CEP" value={formData.candidateAddressZipCode} />
              <ReviewRow
                label="Endereço"
                value={[formData.candidateAddress, formData.candidateAddressNumber, formData.candidateAddressComplement].filter(Boolean).join(", ")}
              />
              <ReviewRow label="Bairro" value={formData.candidateAddressNeighborhood} />
              <ReviewRow label="Cidade/UF" value={[formData.candidateAddressCity, formData.candidateAddressState].filter(Boolean).join(" - ")} />
            </ReviewSection>

            {/* Documents Summary */}
            <ReviewSection title="Documentos" icon={<FileText className="w-4 h-4" />}>
              <ReviewRow label="PIS/PASEP" value={formData.candidatePis} />
              <ReviewRow label="CTPS" value={[formData.candidateCtps, formData.candidateCtpsSeries].filter(Boolean).join(" / ")} />
              <ReviewRow label="Título de Eleitor" value={formData.candidateVoterRegistration} />
            </ReviewSection>

            {/* Bank Summary */}
            <ReviewSection title="Dados Bancários" icon={<CreditCard className="w-4 h-4" />}>
              <ReviewRow label="Banco" value={[formData.candidateBankCode, formData.candidateBankName].filter(Boolean).join(" - ")} />
              <ReviewRow label="Agência" value={formData.candidateBankAgency} />
              <ReviewRow label="Conta" value={[formData.candidateBankAccount, formData.candidateBankAccountDigit].filter(Boolean).join("-")} />
              <ReviewRow label="Tipo" value={BANK_ACCOUNT_TYPES.find((o) => o.value === formData.candidateBankAccountType)?.label} />
              <ReviewRow label="PIX" value={formData.candidatePixKey} />
            </ReviewSection>

            {/* Upload Summary */}
            <ReviewSection title="Arquivos Enviados" icon={<Upload className="w-4 h-4" />}>
              {admission.documents.map((doc) => (
                <ReviewRow
                  key={doc.id}
                  label={doc.documentName}
                  value={
                    doc.status === "VERIFIED" ? "✓ Verificado" :
                      doc.status === "UPLOADED" ? "Enviado" :
                        doc.status === "REJECTED" ? "✗ Rejeitado" :
                          "Pendente"
                  }
                  valueColor={
                    doc.status === "VERIFIED" ? "text-green-600" :
                      doc.status === "REJECTED" ? "text-red-600" :
                        doc.status === "UPLOADED" ? "text-blue-600" :
                          "text-yellow-600"
                  }
                />
              ))}
            </ReviewSection>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Portal do Candidato</h1>
            <p className="text-sm text-gray-500">
              Olá, <span className="font-medium text-gray-700">{admission.candidateName}</span>
            </p>
          </div>
          {isReadOnly && (
            <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              <X className="w-3 h-3" /> Somente leitura
            </span>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step Indicator */}
        <nav className="mb-8" aria-label="Etapas do formulário">
          <ol className="flex items-center gap-1 overflow-x-auto pb-2">
            {WIZARD_STEPS.map((s, i) => {
              const isActive = i === currentStep;
              const isDone = i < currentStep;
              return (
                <li key={s.key} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(i)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md"
                        : isDone
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          : "bg-white text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <span className="flex-shrink-0">{s.icon}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < WIZARD_STEPS.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-300 mx-1 flex-shrink-0" />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {WIZARD_STEPS[currentStep].icon}
              {WIZARD_STEPS[currentStep].label}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Etapa {currentStep + 1} de {WIZARD_STEPS.length}
            </p>
          </div>

          <div className="px-6 py-6">
            {renderStepContent()}
          </div>

          {/* Footer with navigation */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
                bg-white border border-gray-300 text-gray-700 hover:bg-gray-50
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            <div className="flex items-center gap-3">
              {saveMessage && (
                <span className={`text-sm ${saveMessage.includes("sucesso") ? "text-green-600" : "text-red-500"}`}>
                  {saveMessage}
                </span>
              )}

              {currentStep < WIZARD_STEPS.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={saving || isReadOnly}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg
                    bg-blue-600 text-white hover:bg-blue-700
                    disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Salvar e Avançar
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={saveData}
                  disabled={saving || isReadOnly}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg
                    bg-green-600 text-white hover:bg-green-700
                    disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Finalizar Preenchimento
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Token expiry notice */}
        {admission.tokenExpiresAt && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Este link expira em {new Date(admission.tokenExpiresAt).toLocaleDateString("pt-BR")}.
            Em caso de dúvidas, entre em contato com o RH.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Review Helpers ──────────────────────────────────────────────────────────

function ReviewSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  valueColor = "text-gray-900",
}: {
  label: string;
  value?: string | null;
  valueColor?: string;
}) {
  return (
    <div className="px-4 py-2.5 flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${value ? valueColor : "text-gray-300 italic"}`}>
        {value || "Não informado"}
      </span>
    </div>
  );
}
