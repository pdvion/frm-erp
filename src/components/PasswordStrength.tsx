"use client";

import { useMemo } from "react";
import { validatePassword, getPasswordStrengthLabel, DEFAULT_PASSWORD_POLICY } from "@/lib/password";
import { Check, X, AlertCircle } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrength({ password, showRequirements = true }: PasswordStrengthProps) {
  const validation = useMemo(() => validatePassword(password), [password]);
  const strength = useMemo(() => getPasswordStrengthLabel(validation.score), [validation.score]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Barra de força */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-theme-tertiary rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${validation.score}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${
          validation.score < 50 ? "text-red-600" : 
          validation.score < 70 ? "text-yellow-600" : "text-green-600"
        }`}>
          {strength.label}
        </span>
      </div>

      {/* Requisitos */}
      {showRequirements && (
        <div className="space-y-1">
          <Requirement 
            met={password.length >= DEFAULT_PASSWORD_POLICY.minLength} 
            text={`Mínimo ${DEFAULT_PASSWORD_POLICY.minLength} caracteres`} 
          />
          <Requirement 
            met={/[A-Z]/.test(password)} 
            text="Uma letra maiúscula" 
          />
          <Requirement 
            met={/[a-z]/.test(password)} 
            text="Uma letra minúscula" 
          />
          <Requirement 
            met={/[0-9]/.test(password)} 
            text="Um número" 
          />
          <Requirement 
            met={/[!@#$%^&*(),.?":{}|<>]/.test(password)} 
            text="Um caractere especial (opcional)" 
            optional 
          />
        </div>
      )}

      {/* Sugestões */}
      {validation.suggestions.length > 0 && validation.score < 70 && (
        <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded-lg text-xs text-yellow-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            {validation.suggestions.map((s, i) => (
              <p key={i}>{s}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Requirement({ 
  met, 
  text, 
  optional = false 
}: { 
  met: boolean; 
  text: string; 
  optional?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 text-xs ${
      met ? "text-green-600" : optional ? "text-theme-muted" : "text-theme-muted"
    }`}>
      {met ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <X className={`w-3.5 h-3.5 ${optional ? "text-theme-muted" : ""}`} />
      )}
      <span>{text}</span>
    </div>
  );
}
