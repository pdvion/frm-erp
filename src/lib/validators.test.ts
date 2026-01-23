import { describe, it, expect } from "vitest";
import {
  cpfSchema,
  cpfOptionalSchema,
  cnpjSchema,
  cnpjOptionalSchema,
  cpfCnpjSchema,
  phoneSchema,
  phoneOptionalSchema,
  cepSchema,
  cepOptionalSchema,
  emailSchema,
  dateSchema,
  moneyPositiveSchema,
  moneySchema,
  percentageSchema,
} from "./validators";

describe("cpfSchema", () => {
  it("should validate valid CPF", () => {
    const result = cpfSchema.safeParse("529.982.247-25");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("52998224725");
    }
  });

  it("should validate CPF without formatting", () => {
    const result = cpfSchema.safeParse("52998224725");
    expect(result.success).toBe(true);
  });

  it("should reject invalid CPF (wrong check digits)", () => {
    const result = cpfSchema.safeParse("12345678900");
    expect(result.success).toBe(false);
  });

  it("should reject CPF with repeated digits", () => {
    const result = cpfSchema.safeParse("11111111111");
    expect(result.success).toBe(false);
  });

  it("should reject CPF with wrong length", () => {
    const result = cpfSchema.safeParse("123456789");
    expect(result.success).toBe(false);
  });
});

describe("cpfOptionalSchema", () => {
  it("should accept null", () => {
    const result = cpfOptionalSchema.safeParse(null);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(null);
    }
  });

  it("should accept undefined", () => {
    const result = cpfOptionalSchema.safeParse(undefined);
    expect(result.success).toBe(true);
  });

  it("should validate valid CPF", () => {
    const result = cpfOptionalSchema.safeParse("529.982.247-25");
    expect(result.success).toBe(true);
  });
});

describe("cnpjSchema", () => {
  it("should validate valid CNPJ", () => {
    const result = cnpjSchema.safeParse("11.222.333/0001-81");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("11222333000181");
    }
  });

  it("should validate CNPJ without formatting", () => {
    const result = cnpjSchema.safeParse("11222333000181");
    expect(result.success).toBe(true);
  });

  it("should reject invalid CNPJ (wrong check digits)", () => {
    const result = cnpjSchema.safeParse("12345678000100");
    expect(result.success).toBe(false);
  });

  it("should reject CNPJ with repeated digits", () => {
    const result = cnpjSchema.safeParse("11111111111111");
    expect(result.success).toBe(false);
  });

  it("should reject CNPJ with wrong length", () => {
    const result = cnpjSchema.safeParse("123456780001");
    expect(result.success).toBe(false);
  });
});

describe("cnpjOptionalSchema", () => {
  it("should accept null", () => {
    const result = cnpjOptionalSchema.safeParse(null);
    expect(result.success).toBe(true);
  });

  it("should accept undefined", () => {
    const result = cnpjOptionalSchema.safeParse(undefined);
    expect(result.success).toBe(true);
  });
});

describe("cpfCnpjSchema", () => {
  it("should validate valid CPF", () => {
    const result = cpfCnpjSchema.safeParse("529.982.247-25");
    expect(result.success).toBe(true);
  });

  it("should validate valid CNPJ", () => {
    const result = cpfCnpjSchema.safeParse("11.222.333/0001-81");
    expect(result.success).toBe(true);
  });

  it("should reject invalid document", () => {
    const result = cpfCnpjSchema.safeParse("123456");
    expect(result.success).toBe(false);
  });
});

describe("phoneSchema", () => {
  it("should validate mobile phone (11 digits)", () => {
    const result = phoneSchema.safeParse("(11) 99999-9999");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("11999999999");
    }
  });

  it("should validate landline (10 digits)", () => {
    const result = phoneSchema.safeParse("(11) 3333-3333");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("1133333333");
    }
  });

  it("should reject phone with wrong length", () => {
    const result = phoneSchema.safeParse("123456");
    expect(result.success).toBe(false);
  });
});

describe("phoneOptionalSchema", () => {
  it("should accept null", () => {
    const result = phoneOptionalSchema.safeParse(null);
    expect(result.success).toBe(true);
  });

  it("should accept undefined", () => {
    const result = phoneOptionalSchema.safeParse(undefined);
    expect(result.success).toBe(true);
  });
});

describe("cepSchema", () => {
  it("should validate valid CEP", () => {
    const result = cepSchema.safeParse("01234-567");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("01234567");
    }
  });

  it("should validate CEP without formatting", () => {
    const result = cepSchema.safeParse("01234567");
    expect(result.success).toBe(true);
  });

  it("should reject CEP with wrong length", () => {
    const result = cepSchema.safeParse("12345");
    expect(result.success).toBe(false);
  });
});

describe("cepOptionalSchema", () => {
  it("should accept null", () => {
    const result = cepOptionalSchema.safeParse(null);
    expect(result.success).toBe(true);
  });

  it("should accept undefined", () => {
    const result = cepOptionalSchema.safeParse(undefined);
    expect(result.success).toBe(true);
  });
});

describe("emailSchema", () => {
  it("should validate valid email", () => {
    const result = emailSchema.safeParse("test@example.com");
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = emailSchema.safeParse("invalid-email");
    expect(result.success).toBe(false);
  });
});

describe("dateSchema", () => {
  it("should validate valid date string", () => {
    const result = dateSchema.safeParse("2026-01-19");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeInstanceOf(Date);
    }
  });

  it("should reject invalid date", () => {
    const result = dateSchema.safeParse("invalid-date");
    expect(result.success).toBe(false);
  });
});

describe("moneyPositiveSchema", () => {
  it("should validate positive money", () => {
    const result = moneyPositiveSchema.safeParse(10.50);
    expect(result.success).toBe(true);
  });

  it("should reject zero", () => {
    const result = moneyPositiveSchema.safeParse(0);
    expect(result.success).toBe(false);
  });

  it("should reject negative money", () => {
    const result = moneyPositiveSchema.safeParse(-5);
    expect(result.success).toBe(false);
  });
});

describe("moneySchema", () => {
  it("should validate positive money", () => {
    const result = moneySchema.safeParse(10.50);
    expect(result.success).toBe(true);
  });

  it("should validate zero", () => {
    const result = moneySchema.safeParse(0);
    expect(result.success).toBe(true);
  });

  it("should reject negative money", () => {
    const result = moneySchema.safeParse(-5);
    expect(result.success).toBe(false);
  });
});

describe("percentageSchema", () => {
  it("should validate valid percentage (0-100)", () => {
    const result = percentageSchema.safeParse(50);
    expect(result.success).toBe(true);
  });

  it("should validate 0%", () => {
    const result = percentageSchema.safeParse(0);
    expect(result.success).toBe(true);
  });

  it("should validate 100%", () => {
    const result = percentageSchema.safeParse(100);
    expect(result.success).toBe(true);
  });

  it("should reject negative percentage", () => {
    const result = percentageSchema.safeParse(-10);
    expect(result.success).toBe(false);
  });

  it("should reject percentage > 100", () => {
    const result = percentageSchema.safeParse(150);
    expect(result.success).toBe(false);
  });
});
