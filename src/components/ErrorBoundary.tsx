"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[ErrorBoundary]", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                Erro ao carregar este componente
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                {this.state.error?.message || "Ocorreu um erro inesperado."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface QueryErrorAlertProps {
  error: { message: string } | null;
  title?: string;
  onRetry?: () => void;
}

export function QueryErrorAlert({
  error,
  title = "Erro ao carregar dados",
  onRetry,
}: QueryErrorAlertProps) {
  if (!error) return null;

  return (
    <Alert variant="error" title={title}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm">{error.message}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Tentar novamente
          </Button>
        )}
      </div>
    </Alert>
  );
}
