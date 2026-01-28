"use client";

import { ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  isOptional?: boolean;
}

interface WizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  children: ReactNode;
  onSubmit?: () => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  nextLabel?: string;
  prevLabel?: string;
  canGoNext?: boolean;
  canGoPrev?: boolean;
  showStepNumbers?: boolean;
}

export function Wizard({
  steps,
  currentStep,
  onStepChange,
  children,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Salvar",
  cancelLabel = "Cancelar",
  nextLabel = "Próximo",
  prevLabel = "Anterior",
  canGoNext = true,
  canGoPrev = true,
  showStepNumbers = true,
}: WizardProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onSubmit?.();
    } else if (canGoNext) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep && canGoPrev) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <div className="bg-theme-card rounded-xl border border-theme overflow-hidden">
      {/* Progress Header */}
      <div className="border-b border-theme p-4 sm:p-6">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const isClickable = index < currentStep;

              return (
                <li key={step.id} className="flex-1 relative">
                  <div className="flex flex-col items-center">
                    {/* Connector Line */}
                    {index > 0 && (
                      <div
                        className={`absolute left-0 right-1/2 top-4 h-0.5 -translate-y-1/2 ${
                          isCompleted ? "bg-blue-600" : "bg-theme-input"
                        }`}
                        aria-hidden="true"
                      />
                    )}
                    {index < steps.length - 1 && (
                      <div
                        className={`absolute left-1/2 right-0 top-4 h-0.5 -translate-y-1/2 ${
                          isCompleted ? "bg-blue-600" : "bg-theme-input"
                        }`}
                        aria-hidden="true"
                      />
                    )}

                    {/* Step Circle */}
                    <button
                      type="button"
                      onClick={() => isClickable && onStepChange(index)}
                      disabled={!isClickable}
                      className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                        isCompleted
                          ? "bg-blue-600 text-white cursor-pointer hover:bg-blue-700"
                          : isCurrent
                            ? "bg-blue-600 text-white ring-4 ring-blue-600/20"
                            : "bg-theme-input text-theme-muted"
                      } ${!isClickable && !isCurrent ? "cursor-default" : ""}`}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" aria-hidden="true" />
                      ) : showStepNumbers ? (
                        index + 1
                      ) : step.icon ? (
                        step.icon
                      ) : (
                        index + 1
                      )}
                    </button>

                    {/* Step Label */}
                    <div className="mt-2 text-center">
                      <span
                        className={`text-xs sm:text-sm font-medium ${
                          isCurrent ? "text-theme" : "text-theme-muted"
                        }`}
                      >
                        <span className="hidden sm:inline">{step.title}</span>
                        <span className="sm:hidden">{index + 1}</span>
                      </span>
                      {step.isOptional && (
                        <span className="hidden sm:block text-xs text-theme-muted">
                          (Opcional)
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Current Step Info */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6">
        <h2 className="text-lg font-semibold text-theme">
          {steps[currentStep].title}
        </h2>
        {steps[currentStep].description && (
          <p className="text-sm text-theme-muted mt-1">
            {steps[currentStep].description}
          </p>
        )}
      </div>

      {/* Step Content */}
      <div className="p-4 sm:p-6">{children}</div>

      {/* Navigation Footer */}
      <div className="border-t border-theme p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-theme-muted hover:text-theme transition-colors"
            >
              {cancelLabel}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirstStep || !canGoPrev || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-theme-input text-theme-secondary rounded-lg hover:bg-theme-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            {prevLabel}
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : isLastStep ? (
              submitLabel
            ) : (
              <>
                {nextLabel}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para conteúdo de cada step
interface WizardStepContentProps {
  children: ReactNode;
  className?: string;
}

export function WizardStepContent({ children, className = "" }: WizardStepContentProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 ${className}`}>
      {children}
    </div>
  );
}
