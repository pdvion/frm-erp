import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% das transações em produção
  
  // Ambiente
  environment: process.env.NODE_ENV,
  
  // Não enviar em desenvolvimento
  enabled: process.env.NODE_ENV === "production",
  
  // Configurações de profiling
  profilesSampleRate: 0.1,
});
