import { describe, it, expect, vi, afterEach } from "vitest";
import {
  validatePassword,
  getPasswordStrengthLabel,
  DEFAULT_PASSWORD_POLICY,
  type PasswordPolicy,
} from "./password";

describe("Password Validation", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });
  describe("DEFAULT_PASSWORD_POLICY", () => {
    it("deve ter configurações padrão corretas", () => {
      expect(DEFAULT_PASSWORD_POLICY.minLength).toBe(8);
      expect(DEFAULT_PASSWORD_POLICY.requireUppercase).toBe(true);
      expect(DEFAULT_PASSWORD_POLICY.requireLowercase).toBe(true);
      expect(DEFAULT_PASSWORD_POLICY.requireNumber).toBe(true);
      expect(DEFAULT_PASSWORD_POLICY.requireSpecial).toBe(false);
    });
  });

  describe("validatePassword", () => {
    describe("Comprimento mínimo", () => {
      it("deve rejeitar senha muito curta", () => {
        const result = validatePassword("Abc123");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Mínimo de 8 caracteres");
      });

      it("deve aceitar senha com comprimento mínimo", () => {
        const result = validatePassword("Abcd1234");
        expect(result.errors).not.toContain("Mínimo de 8 caracteres");
      });

      it("deve dar mais pontos para senhas longas", () => {
        const short = validatePassword("Abcd1234");
        const medium = validatePassword("Abcd12345678");
        const long = validatePassword("Abcd1234567890ab");
        
        expect(medium.score).toBeGreaterThan(short.score);
        expect(long.score).toBeGreaterThan(medium.score);
      });
    });

    describe("Letra maiúscula", () => {
      it("deve rejeitar senha sem maiúscula quando requerido", () => {
        const result = validatePassword("abcd1234");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Pelo menos uma letra maiúscula");
      });

      it("deve aceitar senha com maiúscula", () => {
        const result = validatePassword("Abcd1234");
        expect(result.errors).not.toContain("Pelo menos uma letra maiúscula");
      });
    });

    describe("Letra minúscula", () => {
      it("deve rejeitar senha sem minúscula quando requerido", () => {
        const result = validatePassword("ABCD1234");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Pelo menos uma letra minúscula");
      });

      it("deve aceitar senha com minúscula", () => {
        const result = validatePassword("Abcd1234");
        expect(result.errors).not.toContain("Pelo menos uma letra minúscula");
      });
    });

    describe("Número", () => {
      it("deve rejeitar senha sem número quando requerido", () => {
        const result = validatePassword("Abcdefgh");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Pelo menos um número");
      });

      it("deve aceitar senha com número", () => {
        const result = validatePassword("Abcd1234");
        expect(result.errors).not.toContain("Pelo menos um número");
      });
    });

    describe("Caractere especial", () => {
      it("não deve exigir especial por padrão", () => {
        const result = validatePassword("Abcd1234");
        expect(result.errors).not.toContain("Pelo menos um caractere especial (!@#$%^&*...)");
      });

      it("deve exigir especial quando configurado", () => {
        const policy: PasswordPolicy = {
          ...DEFAULT_PASSWORD_POLICY,
          requireSpecial: true,
        };
        const result = validatePassword("Abcd1234", policy);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Pelo menos um caractere especial (!@#$%^&*...)");
      });

      it("deve aceitar senha com especial", () => {
        const policy: PasswordPolicy = {
          ...DEFAULT_PASSWORD_POLICY,
          requireSpecial: true,
        };
        const result = validatePassword("Abcd123!", policy);
        expect(result.errors).not.toContain("Pelo menos um caractere especial (!@#$%^&*...)");
      });

      it("deve dar pontos extras para especial mesmo sem exigir", () => {
        const withoutSpecial = validatePassword("Abcd1234");
        const withSpecial = validatePassword("Abcd123!");
        expect(withSpecial.score).toBeGreaterThan(withoutSpecial.score);
      });
    });

    describe("Sugestões", () => {
      it("deve sugerir senha mais longa", () => {
        const result = validatePassword("Abcd1234");
        expect(result.suggestions).toContain("Use pelo menos 12 caracteres para maior segurança");
      });

      it("não deve sugerir senha mais longa se já tem 12+", () => {
        const result = validatePassword("Abcd12345678");
        expect(result.suggestions).not.toContain("Use pelo menos 12 caracteres para maior segurança");
      });

      it("deve sugerir caracteres especiais", () => {
        const result = validatePassword("Abcd1234");
        expect(result.suggestions).toContain("Adicione caracteres especiais para fortalecer");
      });

      it("deve sugerir misturar tipos quando só tem letras", () => {
        const result = validatePassword("Abcdefghij", {
          ...DEFAULT_PASSWORD_POLICY,
          requireNumber: false,
        });
        expect(result.suggestions).toContain("Misture letras, números e símbolos");
      });
    });

    describe("Penalidades", () => {
      it("deve penalizar caracteres repetidos", () => {
        const repeated = validatePassword("Aaaa1234");
        expect(repeated.suggestions).toContain("Evite caracteres repetidos em sequência");
      });

      it("deve penalizar padrões comuns", () => {
        const result = validatePassword("123456Aa");
        expect(result.errors).toContain("Evite senhas comuns ou sequências óbvias");
      });

      it("deve penalizar senha comum", () => {
        const result = validatePassword("password1A");
        expect(result.errors).toContain("Evite senhas comuns ou sequências óbvias");
      });

      it("deve penalizar qwerty", () => {
        const result = validatePassword("qwerty1A");
        expect(result.errors).toContain("Evite senhas comuns ou sequências óbvias");
      });
    });

    describe("Score", () => {
      it("deve retornar score entre 0 e 100", () => {
        const weak = validatePassword("a");
        const strong = validatePassword("Abcd1234!@#$XYZ");
        
        expect(weak.score).toBeGreaterThanOrEqual(0);
        expect(weak.score).toBeLessThanOrEqual(100);
        expect(strong.score).toBeGreaterThanOrEqual(0);
        expect(strong.score).toBeLessThanOrEqual(100);
      });

      it("deve dar score alto para senha forte", () => {
        const result = validatePassword("MyStr0ng!Pass#2024");
        expect(result.score).toBeGreaterThanOrEqual(70);
      });
    });

    describe("Política customizada", () => {
      it("deve aceitar política sem requisitos", () => {
        const policy: PasswordPolicy = {
          minLength: 4,
          requireUppercase: false,
          requireLowercase: false,
          requireNumber: false,
          requireSpecial: false,
        };
        const result = validatePassword("test", policy);
        expect(result.isValid).toBe(true);
      });

      it("deve aplicar comprimento mínimo customizado", () => {
        const policy: PasswordPolicy = {
          ...DEFAULT_PASSWORD_POLICY,
          minLength: 12,
        };
        const result = validatePassword("Abcd1234", policy);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Mínimo de 12 caracteres");
      });
    });
  });

  describe("getPasswordStrengthLabel", () => {
    it("deve retornar 'Muito fraca' para score < 30", () => {
      const result = getPasswordStrengthLabel(20);
      expect(result.label).toBe("Muito fraca");
      expect(result.color).toBe("bg-red-500");
    });

    it("deve retornar 'Fraca' para score 30-49", () => {
      const result = getPasswordStrengthLabel(40);
      expect(result.label).toBe("Fraca");
      expect(result.color).toBe("bg-orange-500");
    });

    it("deve retornar 'Média' para score 50-69", () => {
      const result = getPasswordStrengthLabel(60);
      expect(result.label).toBe("Média");
      expect(result.color).toBe("bg-yellow-500");
    });

    it("deve retornar 'Forte' para score 70-89", () => {
      const result = getPasswordStrengthLabel(80);
      expect(result.label).toBe("Forte");
      expect(result.color).toBe("bg-green-500");
    });

    it("deve retornar 'Muito forte' para score >= 90", () => {
      const result = getPasswordStrengthLabel(95);
      expect(result.label).toBe("Muito forte");
      expect(result.color).toBe("bg-green-600");
    });

    it("deve tratar limites corretamente", () => {
      expect(getPasswordStrengthLabel(29).label).toBe("Muito fraca");
      expect(getPasswordStrengthLabel(30).label).toBe("Fraca");
      expect(getPasswordStrengthLabel(49).label).toBe("Fraca");
      expect(getPasswordStrengthLabel(50).label).toBe("Média");
      expect(getPasswordStrengthLabel(69).label).toBe("Média");
      expect(getPasswordStrengthLabel(70).label).toBe("Forte");
      expect(getPasswordStrengthLabel(89).label).toBe("Forte");
      expect(getPasswordStrengthLabel(90).label).toBe("Muito forte");
    });
  });
});
