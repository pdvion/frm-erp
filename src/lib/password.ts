export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,
};

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-100
  errors: string[];
  suggestions: string[];
}

export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): PasswordValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Comprimento mínimo
  if (password.length < policy.minLength) {
    errors.push(`Mínimo de ${policy.minLength} caracteres`);
  } else {
    score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
  }

  // Letra maiúscula
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Pelo menos uma letra maiúscula");
  } else if (/[A-Z]/.test(password)) {
    score += 15;
  }

  // Letra minúscula
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Pelo menos uma letra minúscula");
  } else if (/[a-z]/.test(password)) {
    score += 15;
  }

  // Número
  if (policy.requireNumber && !/[0-9]/.test(password)) {
    errors.push("Pelo menos um número");
  } else if (/[0-9]/.test(password)) {
    score += 15;
  }

  // Caractere especial
  if (policy.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Pelo menos um caractere especial (!@#$%^&*...)");
  } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 15;
  }

  // Sugestões
  if (password.length < 12) {
    suggestions.push("Use pelo menos 12 caracteres para maior segurança");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    suggestions.push("Adicione caracteres especiais para fortalecer");
  }
  if (/^[a-zA-Z]+$/.test(password)) {
    suggestions.push("Misture letras, números e símbolos");
  }

  // Penalidades
  if (/(.)\1{2,}/.test(password)) {
    score -= 10; // Caracteres repetidos
    suggestions.push("Evite caracteres repetidos em sequência");
  }
  if (/^(123|abc|qwerty|password|senha)/i.test(password)) {
    score -= 20; // Padrões comuns
    errors.push("Evite senhas comuns ou sequências óbvias");
  }

  score = Math.max(0, Math.min(100, score));

  return {
    isValid: errors.length === 0,
    score,
    errors,
    suggestions,
  };
}

export function getPasswordStrengthLabel(score: number): {
  label: string;
  color: string;
} {
  if (score < 30) return { label: "Muito fraca", color: "bg-red-500" };
  if (score < 50) return { label: "Fraca", color: "bg-orange-500" };
  if (score < 70) return { label: "Média", color: "bg-yellow-500" };
  if (score < 90) return { label: "Forte", color: "bg-green-500" };
  return { label: "Muito forte", color: "bg-green-600" };
}
