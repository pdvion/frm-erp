/**
 * Design Tokens - FRM ERP
 * 
 * Fonte única de verdade para cores, tipografia e espaçamentos.
 * Sincronizado com globals.css e theme.ts
 */

// ============================================
// CORES DA MARCA FRM
// ============================================
export const frmColors = {
  primary: '#1a3a6e',
  dark: '#0f2847',
  light: '#2a5a9e',
  lighter: '#3d6cb8',
  50: '#e8eef6',
  100: '#c5d4e8',
  200: '#9fb8d9',
  300: '#789cca',
  400: '#5a85be',
  500: '#3d6eb2',
  600: '#1a3a6e',
  700: '#152f5a',
  800: '#0f2847',
  900: '#0a1c33',
} as const;

// ============================================
// CORES DE STATUS
// ============================================
export const statusColors = {
  success: {
    light: '#dcfce7',
    DEFAULT: '#22c55e',
    dark: '#15803d',
  },
  warning: {
    light: '#fef3c7',
    DEFAULT: '#f59e0b',
    dark: '#b45309',
  },
  error: {
    light: '#fee2e2',
    DEFAULT: '#ef4444',
    dark: '#b91c1c',
  },
  info: {
    light: '#dbeafe',
    DEFAULT: '#3b82f6',
    dark: '#1d4ed8',
  },
} as const;

// ============================================
// CORES NEUTRAS
// ============================================
export const grayColors = {
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
} as const;

// ============================================
// CORES POR MÓDULO (para PageHeader e ícones)
// ============================================
export const moduleColors = {
  dashboard: 'text-blue-600',
  materials: 'text-blue-600',
  suppliers: 'text-orange-600',
  customers: 'text-green-600',
  invoices: 'text-purple-600',
  inventory: 'text-teal-600',
  production: 'text-amber-600',
  hr: 'text-purple-600',
  finance: 'text-emerald-600',
  fiscal: 'text-red-600',
  sales: 'text-cyan-600',
  treasury: 'text-indigo-600',
  reports: 'text-violet-600',
  settings: 'text-gray-600',
  receiving: 'text-blue-600',
  requisitions: 'text-indigo-600',
  billing: 'text-green-600',
  engineering: 'text-orange-600',
  docs: 'text-blue-600',
  tasks: 'text-purple-600',
  workflow: 'text-cyan-600',
  impex: 'text-teal-600',
  budget: 'text-emerald-600',
  gpd: 'text-amber-600',
  oee: 'text-rose-600',
  bi: 'text-indigo-600',
  audit: 'text-slate-600',
  documents: 'text-blue-600',
} as const;

export type ModuleKey = keyof typeof moduleColors;

// ============================================
// CORES DE BOTÕES
// ============================================
export const buttonColors = {
  primary: {
    bg: 'bg-blue-600',
    hover: 'hover:bg-blue-700',
    text: 'text-white',
    focus: 'focus:ring-blue-500',
  },
  secondary: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    hover: 'hover:bg-gray-200 dark:hover:bg-gray-700',
    text: 'text-gray-700 dark:text-gray-200',
    focus: 'focus:ring-gray-500',
  },
  danger: {
    bg: 'bg-red-600',
    hover: 'hover:bg-red-700',
    text: 'text-white',
    focus: 'focus:ring-red-500',
  },
  success: {
    bg: 'bg-green-600',
    hover: 'hover:bg-green-700',
    text: 'text-white',
    focus: 'focus:ring-green-500',
  },
  ghost: {
    bg: 'bg-transparent',
    hover: 'hover:bg-gray-100 dark:hover:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-200',
    focus: 'focus:ring-gray-500',
  },
} as const;

// ============================================
// TIPOGRAFIA
// ============================================
export const typography = {
  fonts: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, Menlo, Monaco, monospace',
  },
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
} as const;

// ============================================
// SOMBRAS
// ============================================
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// ============================================
// BORDER RADIUS
// ============================================
export const radius = {
  sm: '0.25rem',
  DEFAULT: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px',
} as const;

// ============================================
// ESPAÇAMENTOS
// ============================================
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
} as const;

// ============================================
// Z-INDEX
// ============================================
export const zIndex = {
  dropdown: 50,
  sticky: 100,
  modal: 200,
  popover: 300,
  tooltip: 400,
  toast: 500,
} as const;

// ============================================
// BREAKPOINTS
// ============================================
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================
// EXPORT CONSOLIDADO
// ============================================
export const designTokens = {
  colors: {
    frm: frmColors,
    status: statusColors,
    gray: grayColors,
    module: moduleColors,
    button: buttonColors,
  },
  typography,
  shadows,
  radius,
  spacing,
  zIndex,
  breakpoints,
} as const;

export type DesignTokens = typeof designTokens;

export default designTokens;
