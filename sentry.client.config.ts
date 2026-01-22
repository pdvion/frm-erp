import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% das transações em produção
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Ambiente
  environment: process.env.NODE_ENV,
  
  // Ignorar erros comuns que não são bugs
  ignoreErrors: [
    // Erros de rede
    "Network request failed",
    "Failed to fetch",
    "Load failed",
    // Erros de navegação
    "ResizeObserver loop",
    "ResizeObserver loop completed with undelivered notifications",
    // Erros de extensões de browser
    "Extension context invalidated",
  ],
  
  // Não enviar em desenvolvimento
  enabled: process.env.NODE_ENV === "production",
  
  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
