/**
 * Test Utilities - Helpers para testes E2E e unitários
 * VIO-834 - DevOps e Qualidade (QA)
 */

/**
 * Gera um data-testid consistente
 * @param module - Nome do módulo (ex: "materials", "suppliers")
 * @param component - Nome do componente (ex: "list", "form", "button")
 * @param action - Ação opcional (ex: "submit", "cancel", "delete")
 */
export function testId(
  module: string,
  component: string,
  action?: string
): string {
  const parts = [module, component];
  if (action) {
    parts.push(action);
  }
  return parts.join("-");
}

/**
 * Gera props com data-testid
 */
export function withTestId(
  module: string,
  component: string,
  action?: string
): { "data-testid": string } {
  return { "data-testid": testId(module, component, action) };
}

/**
 * Módulos do sistema para padronização
 */
export const MODULES = {
  MATERIALS: "materials",
  SUPPLIERS: "suppliers",
  CUSTOMERS: "customers",
  INVENTORY: "inventory",
  RECEIVING: "receiving",
  PAYABLES: "payables",
  RECEIVABLES: "receivables",
  HR: "hr",
  PRODUCTION: "production",
  FISCAL: "fiscal",
  BI: "bi",
  CATALOG: "catalog",
  SETTINGS: "settings",
  AUTH: "auth",
} as const;

/**
 * Componentes comuns para padronização
 */
export const COMPONENTS = {
  LIST: "list",
  FORM: "form",
  TABLE: "table",
  MODAL: "modal",
  BUTTON: "button",
  INPUT: "input",
  SELECT: "select",
  HEADER: "header",
  SIDEBAR: "sidebar",
  CARD: "card",
  ALERT: "alert",
  DIALOG: "dialog",
} as const;

/**
 * Ações comuns para padronização
 */
export const ACTIONS = {
  SUBMIT: "submit",
  CANCEL: "cancel",
  DELETE: "delete",
  EDIT: "edit",
  CREATE: "create",
  SAVE: "save",
  SEARCH: "search",
  FILTER: "filter",
  EXPORT: "export",
  IMPORT: "import",
  REFRESH: "refresh",
} as const;

/**
 * Helper para criar seletores de teste
 */
export function selector(testIdValue: string): string {
  return `[data-testid="${testIdValue}"]`;
}

/**
 * Valida se um elemento tem o data-testid correto
 */
export function hasTestId(element: HTMLElement, expectedId: string): boolean {
  return element.getAttribute("data-testid") === expectedId;
}

/**
 * Gera um ID único para testes
 */
export function uniqueTestId(prefix: string = "test"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Dados de teste para formulários
 */
export const TEST_DATA = {
  material: {
    code: () => `MAT-${Date.now()}`,
    description: "Material de Teste Automatizado",
    unit: "UN",
    ncm: "84818099",
    category: "Matéria Prima",
  },
  supplier: {
    cnpj: () => `${Math.floor(Math.random() * 99999999999999).toString().padStart(14, "0")}`,
    razaoSocial: "Fornecedor Teste LTDA",
    nomeFantasia: "Fornecedor Teste",
    email: () => `teste-${Date.now()}@example.com`,
  },
  customer: {
    cnpj: () => `${Math.floor(Math.random() * 99999999999999).toString().padStart(14, "0")}`,
    razaoSocial: "Cliente Teste LTDA",
    nomeFantasia: "Cliente Teste",
    email: () => `cliente-${Date.now()}@example.com`,
  },
};

/**
 * Aguarda um tempo específico (para testes)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry com backoff exponencial
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await wait(delayMs * attempt);
      }
    }
  }
  
  throw lastError;
}
