/**
 * Configuração centralizada para testes E2E
 * 
 * @see VIO-575 - Credenciais hardcoded nos testes E2E
 * @see VIO-576 - Timeout hardcoded sem constante
 */

// Credenciais de teste (usar variáveis de ambiente em produção)
export const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'paulo.vion@me.com',
  password: process.env.E2E_TEST_PASSWORD || 'Test@12345',
};

// Timeouts padronizados
export const TIMEOUTS = {
  /** Timeout curto para elementos que devem aparecer rapidamente */
  SHORT: 2000,
  /** Timeout médio para carregamento de páginas */
  MEDIUM: 5000,
  /** Timeout longo para operações de rede */
  LONG: 10000,
  /** Timeout para animações */
  ANIMATION: 300,
  /** Timeout para debounce de busca */
  DEBOUNCE: 500,
};

// URLs base
export const BASE_URLS = {
  login: '/login',
  dashboard: '/dashboard',
  materials: '/materials',
  suppliers: '/suppliers',
  quotes: '/quotes',
  purchaseOrders: '/purchase-orders',
  inventory: '/inventory',
};

// Seletores comuns
export const SELECTORS = {
  hamburgerMenu: '[data-testid="mobile-menu-toggle"], button:has(svg.lucide-menu)',
  sidebar: '[data-testid="sidebar"], nav:has-text("dashboard")',
  companySelector: '[data-testid="company-selector"], [role="combobox"]:has-text("empresa")',
  themeToggle: 'button:has-text("tema"), button:has-text("theme"), button:has-text("modo")',
};

// Viewports para testes responsivos
export const VIEWPORTS = {
  mobile: { width: 375, height: 667 },   // iPhone SE
  mobileLarge: { width: 414, height: 896 }, // iPhone 11
  tablet: { width: 768, height: 1024 },  // iPad
  desktop: { width: 1280, height: 720 }, // Desktop padrão
};

// Tamanhos mínimos para acessibilidade
export const MIN_SIZES = {
  touchTarget: 44,  // Tamanho mínimo recomendado para touch
  buttonHeight: 32, // Altura mínima de botões
  inputHeight: 36,  // Altura mínima de inputs
  spacing: 8,       // Espaçamento mínimo entre elementos
};
