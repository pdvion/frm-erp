import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 0.1,
  
  // Ambiente
  environment: process.env.NODE_ENV,
  
  // Não enviar em desenvolvimento
  enabled: process.env.NODE_ENV === "production",
});
