"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Palette,
  ChevronLeft,
  Save,
  Trash2,
  Plus,
  Search,
  Check,
  X,
  AlertTriangle,
  Info,
  Copy,
  ExternalLink,
} from "lucide-react";

interface CodeBlockProps {
  code: string;
  copied: string | null;
  onCopy: (code: string, id: string) => void;
  id: string;
}

function CodeBlock({ code, id, copied, onCopy }: CodeBlockProps) {
  return (
    <div className="relative group">
      <pre className="bg-theme-tertiary rounded-lg p-4 text-sm overflow-x-auto text-theme-secondary">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => onCopy(code, id)}
        className="absolute top-2 right-2 p-2 rounded-lg bg-theme-card border border-theme opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copiar código"
      >
        {copied === id ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 text-theme-muted" />
        )}
      </button>
    </div>
  );
}

export default function DesignSystemPage() {
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <header className="bg-theme-card border-b border-theme sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/settings" className="text-theme-muted hover:text-theme-secondary">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Palette className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-semibold text-theme">Design System</h1>
              </div>
            </div>
            <a
              href="https://github.com/pdvion/frm-erp/tree/main/src/components/ui"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-theme-muted hover:text-theme"
            >
              <ExternalLink className="w-4 h-4" />
              Ver no GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Introdução */}
        <section>
          <p className="text-theme-secondary max-w-3xl">
            Este Design System documenta os componentes reutilizáveis do FRM ERP.
            Todos os componentes seguem os padrões de acessibilidade WCAG AA e suportam
            temas claro e escuro.
          </p>
        </section>

        {/* Cores */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Cores</h2>
          <p className="text-theme-muted">Paleta de cores do tema com variáveis CSS.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: "Primary", color: "bg-blue-600", var: "--accent" },
              { name: "Success", color: "bg-green-600", var: "--success" },
              { name: "Warning", color: "bg-yellow-500", var: "--warning" },
              { name: "Error", color: "bg-red-600", var: "--error" },
              { name: "Background", color: "bg-theme", var: "--background" },
              { name: "Card", color: "bg-theme-card", var: "--card-bg" },
            ].map((item) => (
              <div key={item.name} className="space-y-2">
                <div className={`${item.color} h-16 rounded-lg border border-theme`} />
                <p className="text-sm font-medium text-theme">{item.name}</p>
                <p className="text-xs text-theme-muted font-mono">{item.var}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Botões */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Botões</h2>
          <p className="text-theme-muted">
            Componente Button com variantes, tamanhos, ícones e estados de loading.
          </p>

          <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-theme-secondary mb-3">Variantes</h3>
              <div className="flex flex-wrap gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-theme-secondary mb-3">Com Ícones</h3>
              <div className="flex flex-wrap gap-3">
                <Button leftIcon={<Plus className="w-4 h-4" />}>Novo</Button>
                <Button variant="secondary" leftIcon={<Save className="w-4 h-4" />}>Salvar</Button>
                <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />}>Excluir</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-theme-secondary mb-3">Estados</h3>
              <div className="flex flex-wrap gap-3">
                <Button isLoading>Carregando</Button>
                <Button disabled>Desabilitado</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-theme-secondary mb-3">Tamanhos</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Pequeno</Button>
                <Button size="md">Médio</Button>
                <Button size="lg">Grande</Button>
              </div>
            </div>
          </div>

          <CodeBlock
            id="button"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { Button } from "@/components/ui/Button";

<Button 
  variant="primary" // primary | secondary | outline | ghost | danger
  size="md"         // sm | md | lg
  leftIcon={<Save className="w-4 h-4" />}
  isLoading={false}
  disabled={false}
>
  Salvar
</Button>`}
          />
        </section>

        {/* Badges */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Badges</h2>
          <p className="text-theme-muted">Indicadores de status e categorias.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <div className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="success">Sucesso</Badge>
              <Badge variant="warning">Atenção</Badge>
              <Badge variant="error">Erro</Badge>
              <Badge variant="info">Info</Badge>
            </div>
          </div>

          <CodeBlock
            id="badge"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { Badge } from "@/components/ui/Badge";

<Badge variant="success">Ativo</Badge>
// Variantes: default | success | warning | error | info`}
          />
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Cards</h2>
          <p className="text-theme-muted">Containers para agrupar conteúdo relacionado.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-theme">Título do Card</h3>
                <p className="text-sm text-theme-muted">Subtítulo opcional</p>
              </CardHeader>
              <CardContent>
                <p className="text-theme-secondary">
                  Conteúdo do card com informações relevantes.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="secondary">Ação</Button>
              </CardFooter>
            </Card>

            <Card className="border-dashed">
              <CardHeader>
                <h3 className="font-semibold text-theme">Card com Borda Tracejada</h3>
              </CardHeader>
              <CardContent>
                <p className="text-theme-secondary">
                  Variante usando className customizado.
                </p>
              </CardContent>
            </Card>
          </div>

          <CodeBlock
            id="card"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";

<Card>
  <CardHeader>
    <h3>Título</h3>
  </CardHeader>
  <CardContent>
    Conteúdo
  </CardContent>
  <CardFooter>
    <Button>Ação</Button>
  </CardFooter>
</Card>`}
          />
        </section>

        {/* Modal */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Modal</h2>
          <p className="text-theme-muted">Diálogos modais para ações e formulários.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <Button onClick={() => setShowModal(true)}>Abrir Modal</Button>
          </div>

          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title="Título do Modal"
            description="Descrição opcional do modal."
            size="md"
          >
            <div className="space-y-4">
              <FormField label="Nome" required>
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Digite seu nome"
                />
              </FormField>
            </div>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setShowModal(false)}>
                Confirmar
              </Button>
            </ModalFooter>
          </Modal>

          <CodeBlock
            id="modal"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { Modal, ModalFooter } from "@/components/ui/Modal";

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Título"
  description="Descrição"
  size="md" // sm | md | lg | xl
>
  <div>Conteúdo</div>
  <ModalFooter>
    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
    <Button onClick={onConfirm}>Confirmar</Button>
  </ModalFooter>
</Modal>`}
          />
        </section>

        {/* Form Fields */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Formulários</h2>
          <p className="text-theme-muted">Campos de formulário com labels, validação e estados.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-4 max-w-md">
            <FormField label="Nome completo" required>
              <Input placeholder="Digite seu nome" />
            </FormField>

            <FormField label="E-mail" hint="Usaremos para enviar notificações">
              <Input type="email" placeholder="email@exemplo.com" />
            </FormField>

            <FormField label="Senha" error="Senha deve ter no mínimo 8 caracteres">
              <Input type="password" placeholder="********" />
            </FormField>

            <FormField label="Buscar">
              <Input
                placeholder="Pesquisar..."
                leftIcon={<Search className="w-4 h-4" />}
              />
            </FormField>
          </div>

          <CodeBlock
            id="form"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

<FormField 
  label="Nome" 
  required
  hint="Texto de ajuda"
  error="Mensagem de erro"
>
  <Input 
    placeholder="Digite..."
    leftIcon={<Search className="w-4 h-4" />}
  />
</FormField>`}
          />
        </section>

        {/* Skeleton */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Skeleton</h2>
          <p className="text-theme-muted">Placeholders de carregamento.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-24 h-3" />
              </div>
            </div>
            <Skeleton className="w-full h-20" />
          </div>

          <CodeBlock
            id="skeleton"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { Skeleton } from "@/components/ui/Skeleton";

<Skeleton className="w-32 h-4" />
<Skeleton className="w-12 h-12 rounded-full" />`}
          />
        </section>

        {/* Alertas */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Alertas</h2>
          <p className="text-theme-muted">Mensagens de feedback para o usuário.</p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Mensagem informativa para o usuário.
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800 dark:text-green-200">
                Operação realizada com sucesso!
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Atenção: verifique os dados antes de continuar.
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <X className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-200">
                Erro ao processar a solicitação.
              </p>
            </div>
          </div>
        </section>

        {/* Componentes Disponíveis */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Todos os Componentes</h2>
          <p className="text-theme-muted">Lista completa de componentes disponíveis em <code className="text-sm bg-theme-tertiary px-1 rounded">@/components/ui</code></p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              "AccessibleTable",
              "Badge",
              "Breadcrumbs",
              "Button",
              "Card",
              "Drawer",
              "FormField",
              "FormGrid",
              "Input",
              "KanbanBoard",
              "Modal",
              "PageButton",
              "PageCard",
              "PageHeader",
              "PageInfoList",
              "PageTable",
              "PageTimeline",
              "SelectWithAdd",
              "Skeleton",
              "SkipLink",
              "VisuallyHidden",
              "Wizard",
              "AdvancedFilters",
              "ExportButtons",
              "MaskedInput",
              "Toaster",
            ].map((component) => (
              <div
                key={component}
                className="px-3 py-2 bg-theme-tertiary rounded-lg text-sm font-mono text-theme-secondary"
              >
                {component}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
