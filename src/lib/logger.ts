import { prisma } from "@/lib/prisma";
import { notificationService } from "@/server/services/notifications";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

interface LogContext {
  userId?: string;
  companyId?: string;
  requestId?: string;
  source?: string;
  durationMs?: number;
  [key: string]: string | number | boolean | null | undefined;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
}

// Configuração de níveis de log
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

// Nível mínimo para salvar no banco (em produção, ignorar debug)
const MIN_DB_LEVEL: LogLevel = process.env.NODE_ENV === "production" ? "info" : "debug";

// Nível mínimo para gerar notificação
const MIN_NOTIFICATION_LEVEL: LogLevel = "error";

class Logger {
  private defaultContext: LogContext = {};

  /**
   * Definir contexto padrão para todos os logs
   */
  setContext(context: LogContext) {
    this.defaultContext = { ...this.defaultContext, ...context };
  }

  /**
   * Limpar contexto
   */
  clearContext() {
    this.defaultContext = {};
  }

  /**
   * Criar um logger filho com contexto adicional
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.defaultContext = { ...this.defaultContext, ...context };
    return childLogger;
  }

  /**
   * Log de debug (apenas desenvolvimento)
   */
  debug(message: string, context?: LogContext) {
    this.log({ level: "debug", message, context });
  }

  /**
   * Log de informação
   */
  info(message: string, context?: LogContext) {
    this.log({ level: "info", message, context });
  }

  /**
   * Log de aviso
   */
  warn(message: string, context?: LogContext) {
    this.log({ level: "warn", message, context });
  }

  /**
   * Log de erro
   */
  error(message: string, context?: LogContext & { error?: Error }) {
    const { error, ...rest } = context || {};
    this.log({ level: "error", message, context: rest, error });
  }

  /**
   * Log de erro fatal (sistema indisponível)
   */
  fatal(message: string, context?: LogContext & { error?: Error }) {
    const { error, ...rest } = context || {};
    this.log({ level: "fatal", message, context: rest, error });
  }

  /**
   * Medir tempo de execução
   */
  time(label: string): () => void {
    const start = Date.now();
    return () => {
      const durationMs = Date.now() - start;
      this.info(`${label} completed`, { durationMs });
    };
  }

  /**
   * Log principal
   */
  private async log(entry: LogEntry) {
    const { level, message, context, error } = entry;
    const mergedContext = { ...this.defaultContext, ...context };
    const timestamp = new Date().toISOString();

    // Console log (sempre)
    const consoleMethod = level === "fatal" ? "error" : level;
    const logData = {
      timestamp,
      level,
      message,
      ...mergedContext,
      ...(error && { error: error.message, stack: error.stack }),
    };

    if (process.env.NODE_ENV === "production") {
      // JSON estruturado em produção
      console[consoleMethod](JSON.stringify(logData));
    } else {
      // Formatado em desenvolvimento
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      console[consoleMethod](prefix, message, mergedContext);
      if (error) {
        console[consoleMethod](error);
      }
    }

    // Salvar no banco se nível suficiente
    if (LOG_LEVELS[level] >= LOG_LEVELS[MIN_DB_LEVEL]) {
      this.saveToDatabase(level, message, mergedContext, error).catch((err) => {
        console.error("Failed to save log to database:", err);
      });
    }

    // Gerar notificação se erro crítico
    if (LOG_LEVELS[level] >= LOG_LEVELS[MIN_NOTIFICATION_LEVEL]) {
      this.sendNotification(level, message, mergedContext, error).catch((err) => {
        console.error("Failed to send notification:", err);
      });
    }
  }

  /**
   * Salvar log no banco de dados
   */
  private async saveToDatabase(
    level: LogLevel,
    message: string,
    context: LogContext,
    error?: Error
  ) {
    const { userId, companyId, requestId, source, durationMs, ...rest } = context;

    try {
      await prisma.systemLog.create({
        data: {
          level,
          message,
          context: rest as Record<string, string | number | boolean | null>,
          stack: error?.stack,
          userId,
          companyId,
          requestId,
          source,
          durationMs,
        },
      });
    } catch (err) {
      // Não propagar erro para não quebrar a aplicação
      console.error("Logger: Failed to save to database", err);
    }
  }

  /**
   * Enviar notificação para erros críticos
   */
  private async sendNotification(
    level: LogLevel,
    message: string,
    context: LogContext,
    error?: Error
  ) {
    try {
      const title = level === "fatal" ? "🚨 Erro Fatal no Sistema" : "⚠️ Erro no Sistema";
      const notificationMessage = error
        ? `${message}\n\nErro: ${error.message}`
        : message;

      // Notificar o usuário específico se houver
      if (context.userId) {
        await notificationService.notifyUser({
          userId: context.userId,
          type: "error",
          category: "error",
          title,
          message: notificationMessage,
          metadata: {
            level,
            source: context.source || null,
            requestId: context.requestId || null,
          },
        });
      } else {
        // Broadcast para administradores
        await notificationService.broadcast({
          type: "error",
          category: "error",
          title,
          message: notificationMessage,
          metadata: {
            level,
            source: context.source || null,
          },
        });
      }
    } catch (err) {
      console.error("Logger: Failed to send notification", err);
    }
  }
}

// Singleton
export const logger = new Logger();

// Funções de conveniência para contextos comuns
export function createRequestLogger(requestId: string, userId?: string, companyId?: string) {
  return logger.child({ requestId, userId, companyId });
}

export function createModuleLogger(source: string) {
  return logger.child({ source });
}
