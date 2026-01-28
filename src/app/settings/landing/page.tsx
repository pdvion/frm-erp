"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { trpc } from "@/lib/trpc";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Settings,
  ChevronLeft,
  Upload,
  Trash2,
  Save,
  RotateCcw,
  Loader2,
  Image as ImageIcon,
  Type,
  Layout,
  Eye,
  AlertCircle,
  CheckCircle,
  Plus,
  GripVertical,
  X,
  Package,
  Warehouse,
  FileText,
  BarChart3,
  Shield,
  Users,
  Truck,
  DollarSign,
  Factory,
  ClipboardList,
} from "lucide-react";

// Ícones disponíveis para features
const AVAILABLE_ICONS = {
  Package: Package,
  Warehouse: Warehouse,
  FileText: FileText,
  BarChart3: BarChart3,
  Shield: Shield,
  Users: Users,
  Truck: Truck,
  DollarSign: DollarSign,
  Factory: Factory,
  ClipboardList: ClipboardList,
} as const;

type IconName = keyof typeof AVAILABLE_ICONS;

interface Feature {
  icon: IconName;
  title: string;
  description: string;
}

interface TrustIndicator {
  icon: string;
  text: string;
}

interface LandingConfig {
  hero: {
    title: string;
    subtitle: string;
    description: string;
    image: string | null;
  };
  features: Feature[];
  trustIndicators: TrustIndicator[];
}

export default function LandingSettingsPage() {
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [config, setConfig] = useState<LandingConfig>({
    hero: {
      title: "Gestão Industrial",
      subtitle: "Completa e Moderna",
      description: "ERP desenvolvido para indústrias, com módulos avançados de compras, estoque, produção e financeiro.",
      image: null,
    },
    features: [],
    trustIndicators: [],
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"hero" | "features" | "preview">("hero");

  // Buscar configurações atuais
  const { data: landingConfig, isLoading, refetch } = trpc.settings.getLandingConfig.useQuery();
  
  // Mutations
  const updateSetting = trpc.settings.update.useMutation();
  const getUploadUrl = trpc.storage.getUploadUrl.useMutation();

  // Carregar configurações quando disponíveis
  useEffect(() => {
    if (landingConfig) {
      setConfig({
        hero: {
          title: String(landingConfig.hero.title || "Gestão Industrial"),
          subtitle: String(landingConfig.hero.subtitle || "Completa e Moderna"),
          description: String(landingConfig.hero.description || ""),
          image: landingConfig.hero.image as string | null,
        },
        features: (landingConfig.features as Feature[]) || [],
        trustIndicators: (landingConfig.trustIndicators as TrustIndicator[]) || [],
      });
    }
  }, [landingConfig]);

  // Verificar permissão
  const canEdit = hasPermission("settings.landing.edit") || hasPermission("*");

  // Upload de imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    try {
      // Obter URL assinada
      const { signedUrl, publicUrl } = await getUploadUrl.mutateAsync({
        fileName: file.name,
        path: "landing/hero",
        contentType: file.type,
      });

      // Upload direto para o Storage
      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Falha no upload");
      }

      // Atualizar config local
      setConfig((prev) => ({
        ...prev,
        hero: { ...prev.hero, image: publicUrl },
      }));

      setMessage({ type: "success", text: "Imagem enviada com sucesso!" });
    } catch (error) {
      console.error("Erro no upload:", error);
      setMessage({ type: "error", text: "Erro ao enviar imagem" });
    } finally {
      setIsUploading(false);
    }
  };

  // Remover imagem
  const handleRemoveImage = () => {
    setConfig((prev) => ({
      ...prev,
      hero: { ...prev.hero, image: null },
    }));
  };

  // Adicionar feature
  const addFeature = () => {
    setConfig((prev) => ({
      ...prev,
      features: [
        ...prev.features,
        { icon: "Package", title: "Nova Feature", description: "Descrição da feature" },
      ],
    }));
  };

  // Remover feature
  const removeFeature = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  // Atualizar feature
  const updateFeature = (index: number, field: keyof Feature, value: string) => {
    setConfig((prev) => ({
      ...prev,
      features: prev.features.map((f, i) =>
        i === index ? { ...f, [field]: value } : f
      ),
    }));
  };

  // Salvar configurações
  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // Salvar cada configuração
      await updateSetting.mutateAsync({
        key: "landing.hero.title",
        value: config.hero.title,
        global: true,
      });
      await updateSetting.mutateAsync({
        key: "landing.hero.subtitle",
        value: config.hero.subtitle,
        global: true,
      });
      await updateSetting.mutateAsync({
        key: "landing.hero.description",
        value: config.hero.description,
        global: true,
      });
      await updateSetting.mutateAsync({
        key: "landing.hero.image",
        value: config.hero.image,
        global: true,
      });
      await updateSetting.mutateAsync({
        key: "landing.features",
        value: config.features,
        global: true,
      });

      setMessage({ type: "success", text: "Configurações salvas com sucesso!" });
      refetch();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setMessage({ type: "error", text: "Erro ao salvar configurações" });
    } finally {
      setIsSaving(false);
    }
  };

  // Restaurar padrão
  const handleReset = () => {
    if (landingConfig) {
      setConfig({
        hero: {
          title: String(landingConfig.hero.title || "Gestão Industrial"),
          subtitle: String(landingConfig.hero.subtitle || "Completa e Moderna"),
          description: String(landingConfig.hero.description || ""),
          image: landingConfig.hero.image as string | null,
        },
        features: (landingConfig.features as Feature[]) || [],
        trustIndicators: (landingConfig.trustIndicators as TrustIndicator[]) || [],
      });
    }
    setMessage(null);
  };

  if (permissionsLoading || isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-theme-tertiary">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--frm-primary)]" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!canEdit) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-theme-tertiary">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-theme mb-2">Acesso Negado</h1>
            <p className="text-theme-secondary mb-4">
              Você não tem permissão para editar as configurações da landing page.
            </p>
            <Link
              href="/dashboard"
              className="text-[var(--frm-primary)] hover:underline"
            >
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <header className="bg-theme-card shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="p-2 hover:bg-theme-hover rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-theme">
                      Configurações da Landing Page
                    </h1>
                    <p className="text-sm text-theme-muted">
                      Personalize a página inicial do sistema
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 text-theme-secondary hover:bg-theme-hover rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--frm-primary)] text-white rounded-lg hover:bg-[var(--frm-dark)] transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Message */}
        {message && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div
              className={`p-4 rounded-lg flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {message.text}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab("hero")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === "hero"
                  ? "border-[var(--frm-primary)] text-[var(--frm-primary)]"
                  : "border-transparent text-theme-muted hover:text-theme-secondary"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Hero & Textos
            </button>
            <button
              onClick={() => setActiveTab("features")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === "features"
                  ? "border-[var(--frm-primary)] text-[var(--frm-primary)]"
                  : "border-transparent text-theme-muted hover:text-theme-secondary"
              }`}
            >
              <Layout className="w-4 h-4" />
              Features
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === "preview"
                  ? "border-[var(--frm-primary)] text-[var(--frm-primary)]"
                  : "border-transparent text-theme-muted hover:text-theme-secondary"
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>
        </div>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Hero & Textos Tab */}
          {activeTab === "hero" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Imagem do Hero */}
              <div className="bg-theme-card rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Imagem de Fundo
                </h2>
                
                <div className="space-y-4">
                  {config.hero.image ? (
                    <div className="relative">
                      <Image
                        src={config.hero.image}
                        alt="Hero"
                        width={400}
                        height={192}
                        className="w-full h-48 object-cover rounded-lg"
                        unoptimized
                      />
                      <button
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-48 border-2 border-dashed border-theme rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[var(--frm-primary)] transition-colors bg-gradient-to-br from-[var(--frm-primary)] to-[var(--frm-dark)]"
                    >
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-white mb-2" />
                          <p className="text-white text-sm">
                            Clique para enviar uma imagem
                          </p>
                          <p className="text-white/70 text-xs mt-1">
                            ou mantenha o gradiente padrão
                          </p>
                        </>
                      )}
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  <p className="text-sm text-theme-muted">
                    Formatos: JPG, PNG, WebP, GIF. Tamanho máximo: 5MB.
                  </p>
                </div>
              </div>

              {/* Textos */}
              <div className="bg-theme-card rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Textos
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary mb-1">
                      Título Principal
                    </label>
                    <input
                      type="text"
                      value={config.hero.title}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, title: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-[var(--frm-light)] focus:border-[var(--frm-light)]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary mb-1">
                      Subtítulo
                    </label>
                    <input
                      type="text"
                      value={config.hero.subtitle}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, subtitle: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-[var(--frm-light)] focus:border-[var(--frm-light)]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={config.hero.description}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, description: e.target.value },
                        }))
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-[var(--frm-light)] focus:border-[var(--frm-light)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === "features" && (
            <div className="bg-theme-card rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-theme flex items-center gap-2">
                  <Layout className="w-5 h-5" />
                  Features Destacadas
                </h2>
                <button
                  onClick={addFeature}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-[var(--frm-primary)] text-white rounded-lg hover:bg-[var(--frm-dark)] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </button>
              </div>

              <div className="space-y-4">
                {config.features.map((feature, index) => {
                  const IconComponent = AVAILABLE_ICONS[feature.icon] || Package;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 border border-theme rounded-lg"
                    >
                      <div className="cursor-move text-theme-muted">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      
                      <div className="w-12 h-12 bg-[var(--frm-primary)] rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-theme-muted mb-1">
                              Ícone
                            </label>
                            <select
                              value={feature.icon}
                              onChange={(e) =>
                                updateFeature(index, "icon", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-theme-input rounded-lg text-sm"
                            >
                              {Object.keys(AVAILABLE_ICONS).map((iconName) => (
                                <option key={iconName} value={iconName}>
                                  {iconName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-theme-muted mb-1">
                              Título
                            </label>
                            <input
                              type="text"
                              value={feature.title}
                              onChange={(e) =>
                                updateFeature(index, "title", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-theme-input rounded-lg text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-theme-muted mb-1">
                            Descrição
                          </label>
                          <input
                            type="text"
                            value={feature.description}
                            onChange={(e) =>
                              updateFeature(index, "description", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-theme-input rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      
                      <button
                        onClick={() => removeFeature(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}

                {config.features.length === 0 && (
                  <div className="text-center py-8 text-theme-muted">
                    <Layout className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma feature configurada</p>
                    <p className="text-sm">Clique em &quot;Adicionar&quot; para criar uma</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === "preview" && (
            <div className="bg-theme-card rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b bg-theme-tertiary">
                <h2 className="text-lg font-semibold text-theme flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Preview da Landing Page
                </h2>
              </div>
              
              {/* Mini Preview */}
              <div className="p-4">
                <div className="border rounded-lg overflow-hidden" style={{ maxHeight: "600px" }}>
                  <div className="flex scale-75 origin-top-left" style={{ width: "133.33%", height: "133.33%" }}>
                    {/* Left Side - Hero */}
                    <div 
                      className="w-1/2 p-8 text-white relative"
                      style={{
                        background: config.hero.image 
                          ? `url(${config.hero.image}) center/cover`
                          : "linear-gradient(135deg, var(--frm-primary), var(--frm-dark))",
                      }}
                    >
                      {config.hero.image && (
                        <div className="absolute inset-0 bg-black/40" />
                      )}
                      <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-2">
                          {config.hero.title}<br />
                          <span className="opacity-80">{config.hero.subtitle}</span>
                        </h2>
                        <p className="text-sm opacity-70 mb-6">
                          {config.hero.description}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {config.features.slice(0, 4).map((feature, index) => {
                            const IconComponent = AVAILABLE_ICONS[feature.icon] || Package;
                            return (
                              <div key={index} className="bg-theme-card/10 backdrop-blur rounded-lg p-3">
                                <IconComponent className="w-6 h-6 mb-2" />
                                <h3 className="font-semibold text-sm">{feature.title}</h3>
                                <p className="text-xs opacity-60">{feature.description}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Side - Login Form Preview */}
                    <div className="w-1/2 bg-theme-tertiary p-8 flex items-center justify-center">
                      <div className="w-full max-w-sm bg-theme-card rounded-xl shadow-lg p-6">
                        <h3 className="text-xl font-bold text-theme mb-1">Bem-vindo de volta</h3>
                        <p className="text-theme-muted text-sm mb-4">Entre com suas credenciais</p>
                        <div className="space-y-3">
                          <div className="h-10 bg-theme-tertiary rounded-lg" />
                          <div className="h-10 bg-theme-tertiary rounded-lg" />
                          <div className="h-10 bg-[var(--frm-primary)] rounded-lg" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
