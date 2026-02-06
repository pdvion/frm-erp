"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useMFA } from "@/hooks/useMFA";
import { 
  Shield, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  ArrowLeft,
  Smartphone,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function MFASetupPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { enrollTOTP, verifyTOTP, isLoading, error, clearError } = useMFA();

  const [step, setStep] = useState<"intro" | "qrcode" | "verify" | "success">("intro");
  const [enrollData, setEnrollData] = useState<{
    id: string;
    qrCode: string;
    secret: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleStartEnroll = async () => {
    clearError();
    const result = await enrollTOTP("FRM ERP");
    
    if (result) {
      setEnrollData({
        id: result.id,
        qrCode: result.totp.qr_code,
        secret: result.totp.secret,
      });
      setStep("qrcode");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData) return;
    if (code.length !== 6) return; // VIO-538: Validar código de 6 dígitos

    const success = await verifyTOTP(enrollData.id, code);
    if (success) {
      setStep("success");
    }
  };

  const copySecret = async () => {
    if (enrollData?.secret) {
      try {
        await navigator.clipboard.writeText(enrollData.secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Falha ao copiar:', err);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--frm-primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--frm-50)] to-[var(--frm-100)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[var(--frm-primary)] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--frm-primary)]">
            Autenticação em Dois Fatores
          </h1>
          <p className="text-theme-secondary mt-1">Adicione uma camada extra de segurança</p>
        </div>

        <div className="bg-theme-card rounded-2xl shadow-xl p-8">
          {/* Step: Intro */}
          {step === "intro" && (
            <>
              <div className="text-center mb-6">
                <Smartphone className="w-12 h-12 text-[var(--frm-light)] mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-theme mb-2">
                  Configurar Autenticador
                </h2>
                <p className="text-theme-secondary text-sm leading-relaxed">
                  Use um aplicativo autenticador como Google Authenticator, 
                  1Password ou Authy para gerar códigos de verificação.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <Button
                onClick={handleStartEnroll}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--frm-primary)] text-white rounded-lg hover:bg-[var(--frm-dark)] transition-colors disabled:opacity-50 font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando QR Code...
                  </>
                ) : (
                  "Começar Configuração"
                )}
              </Button>

              <div className="mt-4 text-center">
                <Link
                  href="/"
                  className="text-sm text-theme-muted hover:text-[var(--frm-primary)]"
                >
                  Configurar depois
                </Link>
              </div>
            </>
          )}

          {/* Step: QR Code */}
          {step === "qrcode" && enrollData && (
            <>
              <h2 className="text-xl font-semibold text-theme mb-4 text-center">
                Escaneie o QR Code
              </h2>
              
              <div className="flex justify-center mb-4">
                {/* QR Code renderizado como imagem base64 para evitar XSS */}
                <div className="p-4 bg-theme-card border-2 border-theme rounded-xl">
                  {enrollData.qrCode.startsWith('data:') ? (
                    <Image src={enrollData.qrCode} alt="QR Code para autenticação" width={200} height={200} unoptimized />
                  ) : (
                    <div 
                      className="w-[200px] h-[200px] flex items-center justify-center text-theme-muted"
                      aria-label="QR Code indisponível"
                    >
                      QR Code indisponível
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-theme-secondary text-center mb-4">
                Abra seu aplicativo autenticador e escaneie o código acima.
              </p>

              <div className="bg-theme-tertiary rounded-lg p-3 mb-6">
                <p className="text-xs text-theme-muted mb-1">
                  Não consegue escanear? Use este código:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono bg-theme-card px-2 py-1 rounded border break-all">
                    {enrollData.secret}
                  </code>
                  <Button
                    onClick={copySecret}
                    className="p-2 text-theme-muted hover:text-[var(--frm-primary)] transition-colors"
                    title="Copiar"
                    aria-label={copied ? "Copiado" : "Copiar segredo"}
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => setStep("verify")}
                className="w-full py-3 bg-[var(--frm-primary)] text-white rounded-lg hover:bg-[var(--frm-dark)] transition-colors font-medium"
              >
                Continuar
              </Button>
            </>
          )}

          {/* Step: Verify */}
          {step === "verify" && enrollData && (
            <>
              <h2 className="text-xl font-semibold text-theme mb-2 text-center">
                Verificar Código
              </h2>
              <p className="text-theme-secondary text-sm text-center mb-6">
                Digite o código de 6 dígitos do seu autenticador
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleVerify}>
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  aria-label="Código de verificação MFA"
                  className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 border border-theme-input rounded-lg focus:ring-2 focus:ring-[var(--frm-light)] focus:border-[var(--frm-light)] mb-4"
                  autoFocus
                />

                <Button
                  type="submit"
                  disabled={code.length !== 6}
                  isLoading={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Verificando..." : "Verificar e Ativar"}
                </Button>
              </form>

              <Button
                onClick={() => setStep("qrcode")}
                className="w-full mt-3 py-2 text-theme-muted hover:text-[var(--frm-primary)] text-sm"
              >
                Voltar ao QR Code
              </Button>
            </>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-theme mb-2">
                MFA Ativado!
              </h2>
              <p className="text-theme-secondary mb-6">
                Sua conta agora está protegida com autenticação em dois fatores.
              </p>

              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--frm-primary)] text-white rounded-lg hover:bg-[var(--frm-dark)] transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Ir para o Dashboard
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-theme-muted mt-6">
          © 2026 FRM ERP - Grupo FRM
        </p>
      </div>
    </div>
  );
}
