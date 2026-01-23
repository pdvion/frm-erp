import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  generateCSRFToken,
  validateCSRFToken,
  invalidateCSRFToken,
  renewCSRFToken,
  CSRF_HEADER,
  CSRF_COOKIE,
} from "./csrf";

describe("CSRF Protection", () => {
  beforeEach(() => {
    // Limpar tokens entre testes
    invalidateCSRFToken("test-session");
    invalidateCSRFToken("session-1");
    invalidateCSRFToken("session-2");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("generateCSRFToken", () => {
    it("deve gerar um token válido", () => {
      const token = generateCSRFToken("test-session");
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("deve gerar tokens diferentes para sessões diferentes", () => {
      const token1 = generateCSRFToken("session-1");
      const token2 = generateCSRFToken("session-2");
      expect(token1).not.toBe(token2);
    });

    it("deve gerar token no formato base64.signature", () => {
      const token = generateCSRFToken("test-session");
      const parts = token.split(".");
      expect(parts.length).toBe(2);
      expect(parts[0].length).toBeGreaterThan(0);
      expect(parts[1].length).toBe(64); // SHA256 hex = 64 chars
    });

    it("deve sobrescrever token anterior da mesma sessão", () => {
      const token1 = generateCSRFToken("test-session");
      const token2 = generateCSRFToken("test-session");
      expect(token1).not.toBe(token2);
      // Token antigo não deve mais ser válido
      expect(validateCSRFToken("test-session", token1)).toBe(false);
      expect(validateCSRFToken("test-session", token2)).toBe(true);
    });
  });

  describe("validateCSRFToken", () => {
    it("deve validar token correto", () => {
      const token = generateCSRFToken("test-session");
      expect(validateCSRFToken("test-session", token)).toBe(true);
    });

    it("deve rejeitar token vazio", () => {
      generateCSRFToken("test-session");
      expect(validateCSRFToken("test-session", "")).toBe(false);
    });

    it("deve rejeitar sessionId vazio", () => {
      const token = generateCSRFToken("test-session");
      expect(validateCSRFToken("", token)).toBe(false);
    });

    it("deve rejeitar token de outra sessão", () => {
      const token1 = generateCSRFToken("session-1");
      generateCSRFToken("session-2");
      expect(validateCSRFToken("session-2", token1)).toBe(false);
    });

    it("deve rejeitar token inexistente", () => {
      expect(validateCSRFToken("unknown-session", "fake-token")).toBe(false);
    });

    it("deve rejeitar token com assinatura inválida", () => {
      const token = generateCSRFToken("test-session");
      const [data] = token.split(".");
      const fakeToken = `${data}.invalidsignature`;
      expect(validateCSRFToken("test-session", fakeToken)).toBe(false);
    });

    it("deve rejeitar token malformado", () => {
      generateCSRFToken("test-session");
      expect(validateCSRFToken("test-session", "malformed-token")).toBe(false);
    });

    it("deve rejeitar token expirado", () => {
      vi.useFakeTimers();
      const token = generateCSRFToken("test-session");
      
      // Avançar o tempo em 2 horas (token expira em 1 hora)
      vi.advanceTimersByTime(2 * 60 * 60 * 1000);
      
      expect(validateCSRFToken("test-session", token)).toBe(false);
    });
  });

  describe("invalidateCSRFToken", () => {
    it("deve invalidar token existente", () => {
      const token = generateCSRFToken("test-session");
      expect(validateCSRFToken("test-session", token)).toBe(true);
      
      invalidateCSRFToken("test-session");
      
      expect(validateCSRFToken("test-session", token)).toBe(false);
    });

    it("não deve lançar erro para sessão inexistente", () => {
      expect(() => invalidateCSRFToken("unknown-session")).not.toThrow();
    });
  });

  describe("renewCSRFToken", () => {
    it("deve gerar novo token e invalidar o antigo", () => {
      const oldToken = generateCSRFToken("test-session");
      const newToken = renewCSRFToken("test-session");
      
      expect(newToken).not.toBe(oldToken);
      expect(validateCSRFToken("test-session", oldToken)).toBe(false);
      expect(validateCSRFToken("test-session", newToken)).toBe(true);
    });

    it("deve funcionar mesmo sem token anterior", () => {
      const token = renewCSRFToken("new-session");
      expect(token).toBeDefined();
      expect(validateCSRFToken("new-session", token)).toBe(true);
      
      // Cleanup
      invalidateCSRFToken("new-session");
    });
  });

  describe("Constants", () => {
    it("deve exportar CSRF_HEADER", () => {
      expect(CSRF_HEADER).toBe("x-csrf-token");
    });

    it("deve exportar CSRF_COOKIE", () => {
      expect(CSRF_COOKIE).toBe("csrf-token");
    });
  });

  describe("Cleanup lazy", () => {
    it("deve executar cleanup após muitas operações sem erro", () => {
      const sessions: string[] = [];
      
      // Gerar muitos tokens para acionar o cleanup (threshold é 100)
      for (let i = 0; i < 150; i++) {
        const sessionId = `session-cleanup-${i}`;
        sessions.push(sessionId);
        generateCSRFToken(sessionId);
      }
      
      // Verificar que pelo menos o último token ainda é válido
      const lastSession = sessions[sessions.length - 1];
      const lastToken = generateCSRFToken(lastSession);
      expect(validateCSRFToken(lastSession, lastToken)).toBe(true);
      
      // Cleanup
      sessions.forEach(s => invalidateCSRFToken(s));
    });
  });
});
