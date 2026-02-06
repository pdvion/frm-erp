"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { 
  LogIn, 
  Mail, 
  Lock, 
  Loader2, 
  AlertCircle,
  Package,
  Warehouse,
  FileText,
  BarChart3,
  Shield,
  CheckCircle,
  ArrowRight,
  Users,
  Truck,
  DollarSign,
  Factory,
  ClipboardList,
  LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// Mapeamento de ícones disponíveis
const ICON_MAP: Record<string, LucideIcon> = {
  Package,
  Warehouse,
  FileText,
  BarChart3,
  Shield,
  CheckCircle,
  Users,
  Truck,
  DollarSign,
  Factory,
  ClipboardList,
};

// Features padrão (fallback)
const DEFAULT_FEATURES = [
  {
    icon: "Package",
    title: "Gestão de Materiais",
    description: "Controle completo de materiais, categorias e especificações técnicas"
  },
  {
    icon: "Warehouse",
    title: "Controle de Estoque",
    description: "Movimentações, inventário e rastreabilidade em tempo real"
  },
  {
    icon: "FileText",
    title: "Entrada de NFe",
    description: "Importação automática de XML, validação e conferência"
  },
  {
    icon: "BarChart3",
    title: "Relatórios Avançados",
    description: "Dashboards e indicadores para tomada de decisão"
  },
];

interface Feature {
  icon: string;
  title: string;
  description: string;
}

export default function LandingPage() {
  const router = useRouter();
  const { signIn, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Buscar configurações da landing page
  const { data: landingConfig } = trpc.settings.getLandingConfig.useQuery();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extrair configurações com fallbacks
  const heroTitle = String(landingConfig?.hero?.title || "Gestão Industrial");
  const heroSubtitle = String(landingConfig?.hero?.subtitle || "Completa e Moderna").trim();
  const heroDescription = String(landingConfig?.hero?.description || "ERP desenvolvido para indústrias, com módulos avançados de compras, estoque, produção e financeiro.");
  const heroImage = landingConfig?.hero?.image as string | null;
  const features: Feature[] = (landingConfig?.features as Feature[]) || DEFAULT_FEATURES;

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message === "Invalid login credentials" 
        ? "E-mail ou senha inválidos" 
        : error.message);
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-tertiary">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--frm-primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero/Features */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{
          background: heroImage 
            ? `url(${heroImage}) center/cover`
            : "linear-gradient(135deg, var(--frm-primary), var(--frm-dark))",
        }}
      >
        {/* Overlay for image */}
        {heroImage && <div className="absolute inset-0 bg-black/40" />}
        
        {/* Background Pattern (only when no image) */}
        {!heroImage && (
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>
        )}

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-theme-card/20 backdrop-blur rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 100 60" className="w-8 h-5">
                <text x="50" y="45" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold" fontFamily="Arial, sans-serif">FRM</text>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">FRM ERP</h1>
              <p className="text-sm text-white/70">Sistema de Gestão Industrial</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold leading-tight">
                {heroTitle}<br />
                <span className="text-white/80">{heroSubtitle}</span>
              </h2>
              <p className="mt-4 text-lg text-white/70 max-w-md">
                {heroDescription}
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => {
                const IconComponent = ICON_MAP[feature.icon] || Package;
                return (
                  <div key={index} className="bg-theme-card/10 backdrop-blur rounded-xl p-4">
                    <IconComponent className="w-8 h-8 text-white/90 mb-3" />
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-white/60 mt-1">{feature.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 text-white/70">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm">Multi-tenant</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-sm">MFA Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm">Auditoria</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-white/50">
            © 2026 FRM ERP - Grupo FRM
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-theme-tertiary">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-[var(--frm-primary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 100 60" className="w-12 h-7">
                <text x="50" y="45" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold" fontFamily="Arial, sans-serif">FRM</text>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--frm-primary)]">FRM ERP</h1>
            <p className="text-theme-secondary mt-1">Sistema de Gestão Industrial</p>
          </div>

          {/* Login Card */}
          <div className="bg-theme-card rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-theme">Bem-vindo de volta</h2>
              <p className="text-theme-secondary mt-1">Entre com suas credenciais para acessar o sistema</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-theme-secondary mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
                  <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-theme-input rounded-xl focus:ring-2 focus:ring-[var(--frm-light)] focus:border-[var(--frm-light)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-theme-secondary mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
                  <Input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 border border-theme-input rounded-xl focus:ring-2 focus:ring-[var(--frm-light)] focus:border-[var(--frm-light)] transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer">
                  <Input 
                    type="checkbox" 
                    id="remember-me"
                    aria-label="Lembrar-me neste dispositivo"
                    className="w-4 h-4 rounded border-theme text-[var(--frm-primary)] focus:ring-[var(--frm-light)]" 
                  />
                  <span className="text-sm text-theme-secondary">Lembrar-me</span>
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-[var(--frm-light)] hover:text-[var(--frm-primary)] hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--frm-primary)] text-white rounded-xl hover:bg-[var(--frm-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-theme"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-theme-card text-theme-muted">ou</span>
              </div>
            </div>

            {/* Demo Access */}
            <div className="text-center">
              <p className="text-sm text-theme-secondary mb-3">Quer conhecer o sistema?</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-[var(--frm-primary)] hover:text-[var(--frm-dark)] font-medium"
              >
                Acessar página de login completa
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-theme-muted mt-6">
            Ao entrar, você concorda com nossos{" "}
            <Link href="/docs/terms" className="text-[var(--frm-light)] hover:underline">Termos de Uso</Link>
            {" "}e{" "}
            <Link href="/docs/privacy" className="text-[var(--frm-light)] hover:underline">Política de Privacidade</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
