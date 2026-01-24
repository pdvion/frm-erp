"use client";

import { InputMask } from "@react-input/mask";
import { forwardRef } from "react";

interface MaskedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mask: string;
  replacement?: Record<string, RegExp>;
}

const defaultReplacement = {
  "0": /\d/,
  "a": /[a-zA-Z]/,
  "*": /[a-zA-Z0-9]/,
};

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, replacement = defaultReplacement, className, ...props }, ref) => {
    return (
      <InputMask
        ref={ref}
        mask={mask}
        replacement={replacement}
        className={className}
        {...props}
      />
    );
  }
);

MaskedInput.displayName = "MaskedInput";

// Máscaras predefinidas
export const MASKS = {
  CNPJ: "00.000.000/0000-00",
  CPF: "000.000.000-00",
  PHONE: "(00) 0000-0000",
  MOBILE: "(00) 00000-0000",
  CEP: "00000-000",
  DATE: "00/00/0000",
} as const;

// Componentes específicos para cada tipo de máscara
export function CnpjInput(props: Omit<MaskedInputProps, "mask">) {
  return <MaskedInput mask={MASKS.CNPJ} {...props} />;
}

export function CpfInput(props: Omit<MaskedInputProps, "mask">) {
  return <MaskedInput mask={MASKS.CPF} {...props} />;
}

export function PhoneInput(props: Omit<MaskedInputProps, "mask">) {
  return <MaskedInput mask={MASKS.PHONE} {...props} />;
}

export function MobileInput(props: Omit<MaskedInputProps, "mask">) {
  return <MaskedInput mask={MASKS.MOBILE} {...props} />;
}

export function CepInput(props: Omit<MaskedInputProps, "mask">) {
  return <MaskedInput mask={MASKS.CEP} {...props} />;
}
