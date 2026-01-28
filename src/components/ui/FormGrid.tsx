"use client";

import { ReactNode } from "react";

interface FormGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

/**
 * Grid responsivo para formulários
 * - Mobile (< 640px): sempre 1 coluna
 * - Tablet (640px - 1024px): 2 colunas
 * - Desktop (> 1024px): número de colunas especificado
 */
export function FormGrid({ children, columns = 2, className = "" }: FormGridProps) {
  const colsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={`grid ${colsClass} gap-4 sm:gap-6 ${className}`}>
      {children}
    </div>
  );
}

interface FormFieldProps {
  children: ReactNode;
  span?: 1 | 2 | 3 | 4 | "full";
  className?: string;
}

/**
 * Campo de formulário com suporte a span de colunas
 * - span="full" ocupa todas as colunas disponíveis
 */
export function FormField({ children, span = 1, className = "" }: FormFieldProps) {
  const spanClass = span === "full" 
    ? "col-span-full" 
    : {
      1: "",
      2: "sm:col-span-2",
      3: "sm:col-span-2 lg:col-span-3",
      4: "sm:col-span-2 lg:col-span-4",
    }[span];

  return (
    <div className={`${spanClass} ${className}`}>
      {children}
    </div>
  );
}

interface FormSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * Seção de formulário com título
 */
export function FormSection({ title, children, className = "" }: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium text-theme border-b border-theme pb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

interface FormActionsProps {
  children: ReactNode;
  className?: string;
}

/**
 * Container para botões de ação do formulário
 * Responsivo: empilha em mobile, lado a lado em desktop
 */
export function FormActions({ children, className = "" }: FormActionsProps) {
  return (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-theme ${className}`}>
      {children}
    </div>
  );
}
