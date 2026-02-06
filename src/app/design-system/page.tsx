"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tooltip } from "@/components/ui/Tooltip";
import { Dropdown, DropdownItem, DropdownDivider } from "@/components/ui/Dropdown";
import { DatePicker } from "@/components/ui/DatePicker";
import { Progress } from "@/components/ui/Progress";
import { Avatar, AvatarGroup, AvatarWithStatus } from "@/components/ui/Avatar";
import { DataTable, TableColumn } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Radio } from "@/components/ui/Radio";
import { Switch } from "@/components/ui/Switch";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Drawer, useDrawer } from "@/components/ui/Drawer";
import { Alert } from "@/components/ui/Alert";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import {
  Palette,
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
  Edit,
  MoreVertical,
  Settings,
  Package,
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
      <Button
        onClick={() => onCopy(code, id)}
        className="absolute top-2 right-2 p-2 rounded-lg bg-theme-card border border-theme opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copiar código"
      >
        {copied === id ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 text-theme-muted" />
        )}
      </Button>
    </div>
  );
}

interface TableItem {
  id: string;
  code: string;
  name: string;
  price: number;
  status: string;
}

const tableData: TableItem[] = [
  { id: "1", code: "PRD001", name: "Produto A", price: 99.90, status: "Ativo" },
  { id: "2", code: "PRD002", name: "Produto B", price: 149.90, status: "Ativo" },
  { id: "3", code: "PRD003", name: "Produto C", price: 79.90, status: "Inativo" },
  { id: "4", code: "PRD004", name: "Produto D", price: 199.90, status: "Ativo" },
];

const tableColumns: TableColumn<TableItem>[] = [
  { key: "code", header: "Código", sortable: true, width: "100px" },
  { key: "name", header: "Nome", sortable: true },
  { key: "price", header: "Preço", align: "right", sortable: true, render: (row) => `R$ ${row.price.toFixed(2)}` },
  { key: "status", header: "Status", render: (row) => <Badge variant={row.status === "Ativo" ? "success" : "default"}>{row.status}</Badge> },
];

const selectOptions = [
  { value: "opt1", label: "Opção 1" },
  { value: "opt2", label: "Opção 2" },
  { value: "opt3", label: "Opção 3" },
];

const radioOptions = [
  { value: "radio1", label: "Opção A" },
  { value: "radio2", label: "Opção B" },
  { value: "radio3", label: "Opção C" },
];

const tabItems = [
  { id: "tab1", label: "Geral" },
  { id: "tab2", label: "Detalhes" },
  { id: "tab3", label: "Configurações" },
];

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Produtos", href: "/products" },
  { label: "Detalhes" },
];

export default function DesignSystemPage() {
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTableRows, setSelectedTableRows] = useState<TableItem[]>([]);
  const [selectValue, setSelectValue] = useState("");
  const [textareaValue, setTextareaValue] = useState("");
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [radioValue, setRadioValue] = useState("radio1");
  const [switchValue, setSwitchValue] = useState(false);
  const [activeTab, setActiveTab] = useState("tab1");
  const drawer = useDrawer();

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Design System"
        icon={<Palette className="w-6 h-6" />}
        backHref="/settings"
        module="settings"
        actions={
          <a
            href="https://github.com/pdvion/frm-erp/tree/main/src/components/ui"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-theme-muted hover:text-theme"
          >
            <ExternalLink className="w-4 h-4" />
            Ver no GitHub
          </a>
        }
      />

      <main className="max-w-7xl mx-auto space-y-12">
        {/* Introdução */}
        <section>
          <p className="text-theme-secondary max-w-3xl">
            Este Design System documenta os componentes reutilizáveis do FRM ERP.
            Todos os componentes seguem os padrões de acessibilidade WCAG AA e suportam
            temas claro e escuro.
          </p>
        </section>

        {/* Tipografia */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Tipografia</h2>
          <p className="text-theme-muted">Classes de tipografia padronizadas para consistência visual.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-theme-secondary mb-4">Headings</h3>
              <div className="space-y-4">
                <div className="flex items-baseline gap-4">
                  <span className="text-heading-1">Heading 1</span>
                  <code className="text-xs bg-theme-tertiary px-2 py-1 rounded text-theme-muted">.text-heading-1</code>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-heading-2">Heading 2</span>
                  <code className="text-xs bg-theme-tertiary px-2 py-1 rounded text-theme-muted">.text-heading-2</code>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-heading-3">Heading 3</span>
                  <code className="text-xs bg-theme-tertiary px-2 py-1 rounded text-theme-muted">.text-heading-3</code>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-heading-4">Heading 4</span>
                  <code className="text-xs bg-theme-tertiary px-2 py-1 rounded text-theme-muted">.text-heading-4</code>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-theme-secondary mb-4">Body Text</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-body-lg">Body Large - Texto maior para destaques e introduções.</p>
                  <code className="text-xs bg-theme-tertiary px-2 py-1 rounded text-theme-muted">.text-body-lg</code>
                </div>
                <div>
                  <p className="text-body">Body - Texto padrão para parágrafos e conteúdo geral.</p>
                  <code className="text-xs bg-theme-tertiary px-2 py-1 rounded text-theme-muted">.text-body</code>
                </div>
                <div>
                  <p className="text-body-sm">Body Small - Texto menor para informações secundárias.</p>
                  <code className="text-xs bg-theme-tertiary px-2 py-1 rounded text-theme-muted">.text-body-sm</code>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-theme-secondary mb-4">Utilitários</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-label">Label Text</span>
                  <code className="text-xs bg-theme-tertiary px-2 py-1 rounded text-theme-muted">.text-label</code>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-caption">Caption text para notas e metadados</span>
                  <code className="text-xs bg-theme-tertiary px-2 py-1 rounded text-theme-muted">.text-caption</code>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-overline">Overline</span>
                  <code className="text-xs bg-theme-tertiary px-2 py-1 rounded text-theme-muted">.text-overline</code>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-code">code snippet</span>
                  <code className="text-xs bg-theme-tertiary px-2 py-1 rounded text-theme-muted">.text-code</code>
                </div>
              </div>
            </div>
          </div>

          <CodeBlock
            id="typography"
            copied={copied}
            onCopy={copyToClipboard}
            code={`/* Classes de Tipografia Disponíveis */

/* Headings */
.text-heading-1  /* 30px, bold, tight */
.text-heading-2  /* 24px, bold, tight */
.text-heading-3  /* 20px, semibold */
.text-heading-4  /* 18px, semibold */

/* Body */
.text-body-lg    /* 18px, normal */
.text-body       /* 16px, normal */
.text-body-sm    /* 14px, normal */

/* Utilitários */
.text-label      /* 14px, medium */
.text-caption    /* 12px, muted */
.text-overline   /* 12px, uppercase */
.text-code       /* monospace, bg */`}
          />
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
              <Input
                label="Nome"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Digite seu nome"
              />
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
            <FormField label="Nome completo" required placeholder="Digite seu nome" />

            <FormField label="E-mail" hint="Usaremos para enviar notificações" type="email" placeholder="email@exemplo.com" />

            <FormField label="Senha" error="Senha deve ter no mínimo 8 caracteres" type="password" placeholder="********" />

            <FormField label="Buscar" placeholder="Pesquisar..." leftIcon={<Search className="w-4 h-4" />} />
          </div>

          <CodeBlock
            id="form"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { FormField } from "@/components/ui/FormField";

<FormField 
  label="Nome" 
  required
  hint="Texto de ajuda"
  error="Mensagem de erro"
  placeholder="Digite..."
  leftIcon={<Search className="w-4 h-4" />}
/>`}
          />
        </section>

        {/* Input */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Input</h2>
          <p className="text-theme-muted">Campo de entrada de texto com variantes e estados.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-4 max-w-md">
            <Input label="Nome" placeholder="Digite seu nome" />
            <Input label="E-mail" type="email" placeholder="email@exemplo.com" />
            <Input label="Senha" type="password" placeholder="********" />
            <Input label="Desabilitado" disabled value="Valor fixo" />
          </div>

          <CodeBlock
            id="input"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { Input } from "@/components/ui/Input";

<Input 
  label="Nome"
  type="text" // text | email | password | number
  placeholder="Digite..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
  disabled={false}
/>`}
          />
        </section>

        {/* Select */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Select</h2>
          <p className="text-theme-muted">Campo de seleção com opções.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Categoria</label>
              <Select
                options={selectOptions}
                value={selectValue}
                onChange={setSelectValue}
                placeholder="Selecione uma opção"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Desabilitado</label>
              <Select
                options={selectOptions}
                value="opt1"
                onChange={() => {}}
                disabled
              />
            </div>
          </div>

          <CodeBlock
            id="select"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { Select } from "@/components/ui/Select";

const options = [
  { value: "opt1", label: "Opção 1" },
  { value: "opt2", label: "Opção 2" },
];

<Select
  label="Categoria"
  options={options}
  value={value}
  onChange={setValue}
  placeholder="Selecione..."
  disabled={false}
/>`}
          />
        </section>

        {/* Textarea */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Textarea</h2>
          <p className="text-theme-muted">Campo de texto multilinha.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Descrição</label>
              <Textarea
                placeholder="Digite uma descrição..."
                value={textareaValue}
                onChange={(e) => setTextareaValue(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <CodeBlock
            id="textarea"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { Textarea } from "@/components/ui/Textarea";

<Textarea
  label="Descrição"
  placeholder="Digite..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
  rows={4}
  maxLength={500}
/>`}
          />
        </section>

        {/* Checkbox */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Checkbox</h2>
          <p className="text-theme-muted">Caixa de seleção para opções binárias.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-4">
            <Checkbox
              label="Aceito os termos de uso"
              checked={checkboxValue}
              onChange={setCheckboxValue}
            />
            <Checkbox
              label="Opção desabilitada"
              checked={true}
              disabled
              onChange={() => {}}
            />
            <Checkbox
              label="Estado indeterminado"
              indeterminate
              onChange={() => {}}
            />
          </div>

          <CodeBlock
            id="checkbox"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { Checkbox } from "@/components/ui/Checkbox";

<Checkbox
  label="Aceito os termos"
  checked={checked}
  onChange={setChecked}
  disabled={false}
  indeterminate={false}
/>`}
          />
        </section>

        {/* Radio */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Radio</h2>
          <p className="text-theme-muted">Grupo de opções mutuamente exclusivas.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <div>
              <label className="block text-sm font-medium text-theme mb-2">Selecione uma opção</label>
              <Radio
                name="demo-radio"
                options={radioOptions}
                value={radioValue}
                onChange={setRadioValue}
              />
            </div>
          </div>

          <CodeBlock
            id="radio"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { Radio } from "@/components/ui/Radio";

const options = [
  { value: "opt1", label: "Opção A" },
  { value: "opt2", label: "Opção B" },
];

<Radio
  label="Selecione"
  options={options}
  value={value}
  onChange={setValue}
  direction="vertical" // vertical | horizontal
/>`}
          />
        </section>

        {/* Switch */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Switch</h2>
          <p className="text-theme-muted">Interruptor para ativar/desativar opções.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-4">
            <Switch
              label="Notificações por e-mail"
              checked={switchValue}
              onChange={setSwitchValue}
            />
            <Switch
              label="Modo escuro (desabilitado)"
              checked={true}
              disabled
              onChange={() => {}}
            />
          </div>

          <CodeBlock
            id="switch"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { Switch } from "@/components/ui/Switch";

<Switch
  label="Ativar notificações"
  checked={checked}
  onChange={setChecked}
  disabled={false}
/>`}
          />
        </section>

        {/* Tabs */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Tabs</h2>
          <p className="text-theme-muted">Navegação por abas para organizar conteúdo.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <Tabs
              tabs={tabItems}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
            <div className="mt-4">
              <TabPanel id="tab1" activeTab={activeTab}>
                <p className="text-theme-secondary">Conteúdo da aba Geral</p>
              </TabPanel>
              <TabPanel id="tab2" activeTab={activeTab}>
                <p className="text-theme-secondary">Conteúdo da aba Detalhes</p>
              </TabPanel>
              <TabPanel id="tab3" activeTab={activeTab}>
                <p className="text-theme-secondary">Conteúdo da aba Configurações</p>
              </TabPanel>
            </div>
          </div>

          <CodeBlock
            id="tabs"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { Tabs, TabPanel } from "@/components/ui/Tabs";

const tabs = [
  { id: "tab1", label: "Geral" },
  { id: "tab2", label: "Detalhes" },
];

<Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
<TabPanel id="tab1" activeTab={activeTab}>
  Conteúdo da aba 1
</TabPanel>
<TabPanel id="tab2" activeTab={activeTab}>
  Conteúdo da aba 2
</TabPanel>`}
          />
        </section>

        {/* Drawer */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Drawer</h2>
          <p className="text-theme-muted">Painel lateral deslizante.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <Button onClick={drawer.open}>Abrir Drawer</Button>
          </div>

          <Drawer
            isOpen={drawer.isOpen}
            onClose={drawer.close}
            title="Título do Drawer"
            size="md"
          >
            <div className="p-4">
              <p className="text-theme-secondary">Conteúdo do drawer aqui.</p>
            </div>
          </Drawer>

          <CodeBlock
            id="drawer"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { Drawer, useDrawer } from "@/components/ui/Drawer";

const drawer = useDrawer();

<Button onClick={drawer.open}>Abrir</Button>

<Drawer
  isOpen={drawer.isOpen}
  onClose={drawer.close}
  title="Título"
  position="right" // left | right
  size="md" // sm | md | lg
>
  Conteúdo
</Drawer>`}
          />
        </section>

        {/* Alert */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Alert</h2>
          <p className="text-theme-muted">Mensagens de alerta com diferentes variantes.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-4">
            <Alert variant="info" title="Informação">
              Esta é uma mensagem informativa.
            </Alert>
            <Alert variant="success" title="Sucesso">
              Operação realizada com sucesso!
            </Alert>
            <Alert variant="warning" title="Atenção">
              Verifique os dados antes de continuar.
            </Alert>
            <Alert variant="error" title="Erro">
              Ocorreu um erro ao processar.
            </Alert>
          </div>

          <CodeBlock
            id="alert"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { Alert } from "@/components/ui/Alert";

<Alert variant="info" title="Título">
  Mensagem do alerta
</Alert>
// Variantes: info | success | warning | error`}
          />
        </section>

        {/* Breadcrumbs */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Breadcrumbs</h2>
          <p className="text-theme-muted">Navegação hierárquica de páginas.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <Breadcrumbs items={breadcrumbItems} />
          </div>

          <CodeBlock
            id="breadcrumbs"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

const items = [
  { label: "Home", href: "/" },
  { label: "Produtos", href: "/products" },
  { label: "Detalhes" }, // Último item sem href
];

<Breadcrumbs items={items} />`}
          />
        </section>

        {/* EmptyState */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">EmptyState</h2>
          <p className="text-theme-muted">Estado vazio com ação opcional.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <EmptyState
              icon={<Package className="w-8 h-8" />}
              title="Nenhum produto encontrado"
              description="Adicione seu primeiro produto para começar."
              action={{ label: "Adicionar Produto", href: "/products/new" }}
            />
          </div>

          <CodeBlock
            id="emptystate"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { EmptyState } from "@/components/ui/EmptyState";

<EmptyState
  icon={<Package className="w-8 h-8" />}
  title="Nenhum item"
  description="Descrição opcional"
  action={{ label: "Adicionar", href: "/new" }}
  // ou action={{ label: "Adicionar", onClick: handleAdd }}
/>`}
          />
        </section>

        {/* Tooltip */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Tooltip</h2>
          <p className="text-theme-muted">Dicas de contexto ao passar o mouse.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <div className="flex flex-wrap gap-4">
              <Tooltip content="Tooltip no topo" position="top">
                <Button variant="outline">Top</Button>
              </Tooltip>
              <Tooltip content="Tooltip na direita" position="right">
                <Button variant="outline">Right</Button>
              </Tooltip>
              <Tooltip content="Tooltip embaixo" position="bottom">
                <Button variant="outline">Bottom</Button>
              </Tooltip>
              <Tooltip content="Tooltip na esquerda" position="left">
                <Button variant="outline">Left</Button>
              </Tooltip>
            </div>
          </div>

          <CodeBlock
            id="tooltip"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { Tooltip } from "@/components/ui/Tooltip";

<Tooltip 
  content="Texto de ajuda"
  position="top" // top | bottom | left | right
  delay={200}    // delay em ms
>
  <Button>Hover me</Button>
</Tooltip>`}
          />
        </section>

        {/* Dropdown */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Dropdown</h2>
          <p className="text-theme-muted">Menus suspensos com navegação por teclado.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <div className="flex flex-wrap gap-4">
              <Dropdown trigger={<Button variant="outline" leftIcon={<MoreVertical className="w-4 h-4" />}>Menu</Button>}>
                <DropdownItem icon={<Edit className="w-4 h-4" />} onClick={() => {}}>Editar</DropdownItem>
                <DropdownItem icon={<Copy className="w-4 h-4" />} onClick={() => {}}>Duplicar</DropdownItem>
                <DropdownDivider />
                <DropdownItem icon={<Settings className="w-4 h-4" />} onClick={() => {}}>Configurações</DropdownItem>
                <DropdownDivider />
                <DropdownItem variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={() => {}}>Excluir</DropdownItem>
              </Dropdown>
            </div>
          </div>

          <CodeBlock
            id="dropdown"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { Dropdown, DropdownItem, DropdownDivider } from "@/components/ui/Dropdown";

<Dropdown trigger={<Button>Menu</Button>}>
  <DropdownItem icon={<Edit />} onClick={...}>Editar</DropdownItem>
  <DropdownItem onClick={...}>Opção 2</DropdownItem>
  <DropdownDivider />
  <DropdownItem variant="danger">Excluir</DropdownItem>
</Dropdown>`}
          />
        </section>

        {/* DatePicker */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">DatePicker</h2>
          <p className="text-theme-muted">Seletor de data com calendário visual.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <div className="max-w-xs">
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                label="Data de nascimento"
                placeholder="Selecione uma data"
              />
            </div>
          </div>

          <CodeBlock
            id="datepicker"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { DatePicker, DateRangePicker } from "@/components/ui/DatePicker";

<DatePicker 
  value={date} 
  onChange={setDate}
  label="Data"
  minDate={new Date()}
  maxDate={new Date(2030, 11, 31)}
/>

<DateRangePicker
  startDate={start}
  endDate={end}
  onChange={({ start, end }) => setRange({ start, end })}
/>`}
          />
        </section>

        {/* Progress */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Progress</h2>
          <p className="text-theme-muted">Indicadores de progresso linear e circular.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-theme-secondary mb-3">Linear</h3>
              <div className="space-y-4 max-w-md">
                <Progress value={25} showValue label="Progresso" />
                <Progress value={50} color="success" showValue />
                <Progress value={75} color="warning" showValue />
                <Progress indeterminate label="Carregando..." />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-theme-secondary mb-3">Circular</h3>
              <div className="flex flex-wrap gap-6">
                <Progress variant="circular" value={25} size="sm" showValue />
                <Progress variant="circular" value={50} size="md" showValue />
                <Progress variant="circular" value={75} size="lg" showValue color="success" />
                <Progress variant="circular" indeterminate size="md" />
              </div>
            </div>
          </div>

          <CodeBlock
            id="progress"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { Progress } from "@/components/ui/Progress";

<Progress value={75} max={100} showValue />
<Progress variant="circular" value={50} size="lg" />
<Progress indeterminate />
<Progress color="success" value={100} /> // default | success | warning | danger`}
          />
        </section>

        {/* Avatar */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">Avatar</h2>
          <p className="text-theme-muted">Avatares de usuário com fallback e grupos.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-theme-secondary mb-3">Tamanhos</h3>
              <div className="flex items-center gap-4">
                <Avatar fallback="XS" size="xs" alt="Extra Small" />
                <Avatar fallback="SM" size="sm" alt="Small" />
                <Avatar fallback="MD" size="md" alt="Medium" />
                <Avatar fallback="LG" size="lg" alt="Large" />
                <Avatar fallback="XL" size="xl" alt="Extra Large" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-theme-secondary mb-3">Com Status</h3>
              <div className="flex items-center gap-4">
                <AvatarWithStatus fallback="ON" status="online" alt="Online" />
                <AvatarWithStatus fallback="AW" status="away" alt="Away" />
                <AvatarWithStatus fallback="BS" status="busy" alt="Busy" />
                <AvatarWithStatus fallback="OF" status="offline" alt="Offline" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-theme-secondary mb-3">Grupo</h3>
              <AvatarGroup max={3}>
                <Avatar fallback="AB" alt="Alice Brown" />
                <Avatar fallback="CD" alt="Carlos Dias" />
                <Avatar fallback="EF" alt="Elena Ferreira" />
                <Avatar fallback="GH" alt="Gabriel Henrique" />
                <Avatar fallback="IJ" alt="Isabela Jardim" />
              </AvatarGroup>
            </div>
          </div>

          <CodeBlock
            id="avatar"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { Avatar, AvatarGroup, AvatarWithStatus } from "@/components/ui/Avatar";

<Avatar src="/user.jpg" alt="Nome" size="md" />
<Avatar fallback="JD" size="lg" />

<AvatarWithStatus fallback="AB" status="online" />

<AvatarGroup max={3}>
  <Avatar fallback="A" />
  <Avatar fallback="B" />
  <Avatar fallback="C" />
  <Avatar fallback="D" />
</AvatarGroup>`}
          />
        </section>

        {/* DataTable */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-theme">DataTable</h2>
          <p className="text-theme-muted">Tabela de dados com sorting, seleção e estados.</p>

          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <DataTable
              data={tableData}
              columns={tableColumns}
              keyExtractor={(item) => item.id}
              sortable
              selectable
              selectedRows={selectedTableRows}
              onSelectionChange={setSelectedTableRows}
              emptyMessage="Nenhum produto encontrado"
            />
          </div>

          <CodeBlock
            id="datatable"
            copied={copied}
            onCopy={copyToClipboard}
            code={`import { DataTable, TableColumn } from "@/components/ui/DataTable";

interface Item {
  id: string;
  code: string;
  name: string;
  status: string;
}

const columns: TableColumn<Item>[] = [
  { key: "code", header: "Código", sortable: true, width: "100px" },
  { key: "name", header: "Nome", sortable: true },
  { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
];

<DataTable
  data={items}
  columns={columns}
  keyExtractor={(item) => item.id}
  loading={isLoading}
  sortable
  selectable
  selectedRows={selected}
  onSelectionChange={setSelected}
  stickyHeader
  onRowClick={(row) => router.push(\`/items/\${row.id}\`)}
/>`}
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
              "Avatar",
              "AvatarGroup",
              "Badge",
              "Breadcrumbs",
              "Button",
              "Card",
              "ChartLine",
              "ChartBar",
              "ChartPie",
              "ChartDonut",
              "ChartArea",
              "ChartCard",
              "DataTable",
              "DatePicker",
              "DateRangePicker",
              "Drawer",
              "Dropdown",
              "FileUpload",
              "FormField",
              "FormGrid",
              "ImageUpload",
              "Input",
              "KanbanBoard",
              "KpiCard",
              "Modal",
              "PageButton",
              "PageCard",
              "PageHeader",
              "PageInfoList",
              "PageTable",
              "PageTimeline",
              "Progress",
              "SelectWithAdd",
              "Skeleton",
              "SkipLink",
              "Tooltip",
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
