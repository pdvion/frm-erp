import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  ExternalServiceError,
  RateLimitError,
  BusinessRuleError,
  toTRPCError,
  handleError,
  assertExists,
  assertCondition,
  assertAuthorized,
  assertPermission,
} from "./errors";

describe("Custom Error Classes", () => {
  describe("AppError", () => {
    it("deve criar erro com propriedades corretas", () => {
      const error = new AppError("Test error", "TEST_CODE", 500, true);
      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_CODE");
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });

    it("deve usar valores padrão", () => {
      const error = new AppError("Test", "CODE");
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });
  });

  describe("ValidationError", () => {
    it("deve criar erro de validação simples", () => {
      const error = new ValidationError("Campo inválido");
      expect(error.message).toBe("Campo inválido");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.statusCode).toBe(400);
      expect(error instanceof ValidationError).toBe(true);
    });

    it("deve criar erro de validação com campo", () => {
      const error = new ValidationError("Email inválido", "email");
      expect(error.field).toBe("email");
    });

    it("deve criar erro de validação com detalhes", () => {
      const details = { email: ["Formato inválido", "Já existe"] };
      const error = new ValidationError("Erros de validação", undefined, details);
      expect(error.details).toEqual(details);
    });
  });

  describe("NotFoundError", () => {
    it("deve criar erro sem ID", () => {
      const error = new NotFoundError("Material");
      expect(error.message).toBe("Material não encontrado");
      expect(error.code).toBe("NOT_FOUND");
      expect(error.statusCode).toBe(404);
      expect(error.resource).toBe("Material");
      expect(error.resourceId).toBeUndefined();
    });

    it("deve criar erro com ID", () => {
      const error = new NotFoundError("Material", "123");
      expect(error.message).toBe("Material com ID 123 não encontrado");
      expect(error.resourceId).toBe("123");
    });
  });

  describe("ConflictError", () => {
    it("deve criar erro sem campo de conflito", () => {
      const error = new ConflictError("Material");
      expect(error.message).toBe("Material já existe");
      expect(error.code).toBe("CONFLICT");
      expect(error.statusCode).toBe(409);
    });

    it("deve criar erro com campo de conflito", () => {
      const error = new ConflictError("Material", "código");
      expect(error.message).toBe("Material com este código já existe");
      expect(error.conflictField).toBe("código");
    });

    it("deve usar mensagem customizada", () => {
      const error = new ConflictError("Material", "código", "Código duplicado");
      expect(error.message).toBe("Código duplicado");
    });
  });

  describe("UnauthorizedError", () => {
    it("deve criar erro com mensagem padrão", () => {
      const error = new UnauthorizedError();
      expect(error.message).toBe("Não autorizado");
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.statusCode).toBe(401);
    });

    it("deve criar erro com mensagem customizada", () => {
      const error = new UnauthorizedError("Token expirado");
      expect(error.message).toBe("Token expirado");
    });
  });

  describe("ForbiddenError", () => {
    it("deve criar erro com mensagem padrão", () => {
      const error = new ForbiddenError();
      expect(error.message).toBe("Acesso negado");
      expect(error.code).toBe("FORBIDDEN");
      expect(error.statusCode).toBe(403);
    });

    it("deve criar erro com mensagem customizada", () => {
      const error = new ForbiddenError("Sem permissão");
      expect(error.message).toBe("Sem permissão");
    });
  });

  describe("ExternalServiceError", () => {
    it("deve criar erro de serviço externo", () => {
      const error = new ExternalServiceError("SEFAZ", "Timeout");
      expect(error.message).toBe("Erro no serviço SEFAZ: Timeout");
      expect(error.code).toBe("EXTERNAL_SERVICE_ERROR");
      expect(error.statusCode).toBe(502);
      expect(error.service).toBe("SEFAZ");
    });

    it("deve incluir erro original", () => {
      const originalError = new Error("Connection refused");
      const error = new ExternalServiceError("API", "Falha", originalError);
      expect(error.originalError).toBe(originalError);
    });
  });

  describe("RateLimitError", () => {
    it("deve criar erro com mensagem padrão", () => {
      const error = new RateLimitError();
      expect(error.message).toBe("Muitas requisições. Tente novamente mais tarde.");
      expect(error.code).toBe("RATE_LIMIT");
      expect(error.statusCode).toBe(429);
    });

    it("deve incluir retryAfter", () => {
      const error = new RateLimitError("Limite excedido", 60);
      expect(error.retryAfter).toBe(60);
    });
  });

  describe("BusinessRuleError", () => {
    it("deve criar erro de regra de negócio", () => {
      const error = new BusinessRuleError("ESTOQUE_INSUFICIENTE", "Estoque insuficiente");
      expect(error.message).toBe("Estoque insuficiente");
      expect(error.code).toBe("BUSINESS_RULE_ERROR");
      expect(error.statusCode).toBe(422);
      expect(error.rule).toBe("ESTOQUE_INSUFICIENTE");
    });
  });
});

describe("toTRPCError", () => {
  it("deve retornar TRPCError inalterado", () => {
    const trpcError = new TRPCError({ code: "BAD_REQUEST", message: "Test" });
    expect(toTRPCError(trpcError)).toBe(trpcError);
  });

  it("deve converter ValidationError", () => {
    const error = new ValidationError("Campo inválido");
    const trpcError = toTRPCError(error);
    expect(trpcError.code).toBe("BAD_REQUEST");
    expect(trpcError.message).toBe("Campo inválido");
  });

  it("deve converter NotFoundError", () => {
    const error = new NotFoundError("Material");
    const trpcError = toTRPCError(error);
    expect(trpcError.code).toBe("NOT_FOUND");
  });

  it("deve converter ConflictError", () => {
    const error = new ConflictError("Material");
    const trpcError = toTRPCError(error);
    expect(trpcError.code).toBe("CONFLICT");
  });

  it("deve converter UnauthorizedError", () => {
    const error = new UnauthorizedError();
    const trpcError = toTRPCError(error);
    expect(trpcError.code).toBe("UNAUTHORIZED");
  });

  it("deve converter ForbiddenError", () => {
    const error = new ForbiddenError();
    const trpcError = toTRPCError(error);
    expect(trpcError.code).toBe("FORBIDDEN");
  });

  it("deve converter RateLimitError", () => {
    const error = new RateLimitError();
    const trpcError = toTRPCError(error);
    expect(trpcError.code).toBe("TOO_MANY_REQUESTS");
  });

  it("deve converter BusinessRuleError", () => {
    const error = new BusinessRuleError("RULE", "Mensagem");
    const trpcError = toTRPCError(error);
    expect(trpcError.code).toBe("PRECONDITION_FAILED");
  });

  it("deve converter ExternalServiceError", () => {
    const error = new ExternalServiceError("API", "Erro");
    const trpcError = toTRPCError(error);
    expect(trpcError.code).toBe("BAD_GATEWAY");
  });

  it("deve converter AppError genérico", () => {
    const error = new AppError("Erro", "CODE");
    const trpcError = toTRPCError(error);
    expect(trpcError.code).toBe("INTERNAL_SERVER_ERROR");
  });

  it("deve converter Error padrão", () => {
    const error = new Error("Erro padrão");
    const trpcError = toTRPCError(error);
    expect(trpcError.code).toBe("INTERNAL_SERVER_ERROR");
    expect(trpcError.message).toBe("Erro padrão");
  });

  it("deve converter erro desconhecido", () => {
    const trpcError = toTRPCError("string error");
    expect(trpcError.code).toBe("INTERNAL_SERVER_ERROR");
    expect(trpcError.message).toBe("Erro interno do servidor");
  });
});

describe("handleError", () => {
  it("deve retornar resultado de operação bem-sucedida", async () => {
    const result = await handleError(async () => "success");
    expect(result).toBe("success");
  });

  it("deve converter AppError para TRPCError", async () => {
    await expect(
      handleError(async () => {
        throw new NotFoundError("Material");
      })
    ).rejects.toThrow(TRPCError);
  });

  it("deve converter erro desconhecido para TRPCError", async () => {
    await expect(
      handleError(async () => {
        throw new Error("Unknown error");
      }, "test-context")
    ).rejects.toThrow(TRPCError);
  });
});

describe("Assertion Helpers", () => {
  describe("assertExists", () => {
    it("não deve lançar erro para valor existente", () => {
      expect(() => assertExists("value", "Resource")).not.toThrow();
      expect(() => assertExists(0, "Resource")).not.toThrow();
      expect(() => assertExists(false, "Resource")).not.toThrow();
    });

    it("deve lançar NotFoundError para null", () => {
      expect(() => assertExists(null, "Material")).toThrow(NotFoundError);
    });

    it("deve lançar NotFoundError para undefined", () => {
      expect(() => assertExists(undefined, "Material", "123")).toThrow(NotFoundError);
    });
  });

  describe("assertCondition", () => {
    it("não deve lançar erro para condição verdadeira", () => {
      expect(() => assertCondition(true, "RULE", "Mensagem")).not.toThrow();
    });

    it("deve lançar BusinessRuleError para condição falsa", () => {
      expect(() => assertCondition(false, "ESTOQUE", "Sem estoque")).toThrow(BusinessRuleError);
    });
  });

  describe("assertAuthorized", () => {
    it("não deve lançar erro para condição verdadeira", () => {
      expect(() => assertAuthorized(true)).not.toThrow();
    });

    it("deve lançar UnauthorizedError para condição falsa", () => {
      expect(() => assertAuthorized(false)).toThrow(UnauthorizedError);
    });

    it("deve usar mensagem customizada", () => {
      expect(() => assertAuthorized(false, "Token inválido")).toThrow("Token inválido");
    });
  });

  describe("assertPermission", () => {
    it("não deve lançar erro para condição verdadeira", () => {
      expect(() => assertPermission(true)).not.toThrow();
    });

    it("deve lançar ForbiddenError para condição falsa", () => {
      expect(() => assertPermission(false)).toThrow(ForbiddenError);
    });

    it("deve usar mensagem customizada", () => {
      expect(() => assertPermission(false, "Acesso negado")).toThrow("Acesso negado");
    });
  });
});
