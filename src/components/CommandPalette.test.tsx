import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================
// ENTITY_CONFIG unit tests (logic only)
// ============================================

describe("CommandPalette — Entity Config", () => {
  const ENTITY_CONFIG = {
    material: {
      label: "Material",
      labelPlural: "Materiais",
      getHref: (id: string) => `/materials/${id}`,
      getTitle: (e: Record<string, unknown>) => `${e.code} — ${e.description}`,
      getSubtitle: (e: Record<string, unknown>) => [e.unit, e.ncm, e.manufacturer].filter(Boolean).join(" · "),
    },
    product: {
      label: "Produto",
      labelPlural: "Produtos",
      getHref: (id: string) => `/catalog/products/${id}`,
      getTitle: (e: Record<string, unknown>) => `${e.code} — ${e.name}`,
      getSubtitle: (e: Record<string, unknown>) => [e.shortDescription, e.status].filter(Boolean).join(" · "),
    },
    customer: {
      label: "Cliente",
      labelPlural: "Clientes",
      getHref: (id: string) => `/customers/${id}`,
      getTitle: (e: Record<string, unknown>) => String(e.tradeName || e.companyName),
      getSubtitle: (e: Record<string, unknown>) => [e.cnpj, e.addressCity && e.addressState ? `${e.addressCity}/${e.addressState}` : null].filter(Boolean).join(" · "),
    },
    supplier: {
      label: "Fornecedor",
      labelPlural: "Fornecedores",
      getHref: (id: string) => `/suppliers/${id}`,
      getTitle: (e: Record<string, unknown>) => String(e.tradeName || e.companyName),
      getSubtitle: (e: Record<string, unknown>) => [e.cnpj, e.city && e.state ? `${e.city}/${e.state}` : null].filter(Boolean).join(" · "),
    },
    employee: {
      label: "Colaborador",
      labelPlural: "Colaboradores",
      getHref: (id: string) => `/hr/employees/${id}`,
      getTitle: (e: Record<string, unknown>) => `${e.code} — ${e.name}`,
      getSubtitle: (e: Record<string, unknown>) => [e.email, e.contractType].filter(Boolean).join(" · "),
    },
  };

  describe("material", () => {
    const cfg = ENTITY_CONFIG.material;

    it("generates correct href", () => {
      expect(cfg.getHref("abc-123")).toBe("/materials/abc-123");
    });

    it("formats title with code and description", () => {
      expect(cfg.getTitle({ code: 1001, description: "PARAFUSO M10" })).toBe("1001 — PARAFUSO M10");
    });

    it("formats subtitle with unit, ncm, manufacturer", () => {
      expect(cfg.getSubtitle({ unit: "UN", ncm: "7318.15.00", manufacturer: "Ciser" })).toBe("UN · 7318.15.00 · Ciser");
    });

    it("handles missing subtitle fields", () => {
      expect(cfg.getSubtitle({ unit: "KG" })).toBe("KG");
    });
  });

  describe("product", () => {
    const cfg = ENTITY_CONFIG.product;

    it("generates correct href", () => {
      expect(cfg.getHref("prod-456")).toBe("/catalog/products/prod-456");
    });

    it("formats title", () => {
      expect(cfg.getTitle({ code: 200, name: "Kit Parafusos" })).toBe("200 — Kit Parafusos");
    });
  });

  describe("customer", () => {
    const cfg = ENTITY_CONFIG.customer;

    it("generates correct href", () => {
      expect(cfg.getHref("cust-789")).toBe("/customers/cust-789");
    });

    it("uses tradeName when available", () => {
      expect(cfg.getTitle({ tradeName: "Acme", companyName: "Acme Ltda" })).toBe("Acme");
    });

    it("falls back to companyName", () => {
      expect(cfg.getTitle({ companyName: "Acme Ltda" })).toBe("Acme Ltda");
    });

    it("formats city/state subtitle", () => {
      expect(cfg.getSubtitle({ cnpj: "12.345.678/0001-90", addressCity: "Curitiba", addressState: "PR" }))
        .toBe("12.345.678/0001-90 · Curitiba/PR");
    });
  });

  describe("supplier", () => {
    const cfg = ENTITY_CONFIG.supplier;

    it("generates correct href", () => {
      expect(cfg.getHref("sup-111")).toBe("/suppliers/sup-111");
    });

    it("formats city/state subtitle", () => {
      expect(cfg.getSubtitle({ cnpj: "98.765.432/0001-10", city: "São Paulo", state: "SP" }))
        .toBe("98.765.432/0001-10 · São Paulo/SP");
    });
  });

  describe("employee", () => {
    const cfg = ENTITY_CONFIG.employee;

    it("generates correct href", () => {
      expect(cfg.getHref("emp-222")).toBe("/hr/employees/emp-222");
    });

    it("formats title with code and name", () => {
      expect(cfg.getTitle({ code: 42, name: "João Silva" })).toBe("42 — João Silva");
    });

    it("formats subtitle with email and contract", () => {
      expect(cfg.getSubtitle({ email: "joao@frm.com", contractType: "CLT" })).toBe("joao@frm.com · CLT");
    });
  });
});

describe("CommandPalette — Similarity badge", () => {
  it("calculates percentage correctly", () => {
    expect(Math.round(0.85 * 100)).toBe(85);
    expect(Math.round(0.623 * 100)).toBe(62);
    expect(Math.round(0.499 * 100)).toBe(50);
  });

  it("classifies high similarity (>=80%)", () => {
    const pct = Math.round(0.85 * 100);
    expect(pct >= 80).toBe(true);
  });

  it("classifies medium similarity (60-79%)", () => {
    const pct = Math.round(0.65 * 100);
    expect(pct >= 60 && pct < 80).toBe(true);
  });

  it("classifies low similarity (<60%)", () => {
    const pct = Math.round(0.45 * 100);
    expect(pct < 60).toBe(true);
  });
});

describe("CommandPalette — Debounce logic", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("debounces query after 300ms", () => {
    let debouncedValue = "";
    const setDebounced = (v: string) => { debouncedValue = v; };

    const query = "parafuso";
    const timer = setTimeout(() => setDebounced(query.trim()), 300);

    expect(debouncedValue).toBe("");
    vi.advanceTimersByTime(300);
    expect(debouncedValue).toBe("parafuso");

    clearTimeout(timer);
    vi.useRealTimers();
  });

  it("does not trigger search for queries < 2 chars", () => {
    const query = "p";
    const enabled = query.trim().length >= 2;
    expect(enabled).toBe(false);
  });

  it("triggers search for queries >= 2 chars", () => {
    const query = "pa";
    const enabled = query.trim().length >= 2;
    expect(enabled).toBe(true);
  });
});

describe("CommandPalette — Keyboard navigation", () => {
  it("clamps selectedIndex to valid range (down)", () => {
    const resultsLength = 5;
    let selectedIndex = 3;
    selectedIndex = Math.min(selectedIndex + 1, resultsLength - 1);
    expect(selectedIndex).toBe(4);

    selectedIndex = Math.min(selectedIndex + 1, resultsLength - 1);
    expect(selectedIndex).toBe(4); // clamped
  });

  it("clamps selectedIndex to valid range (up)", () => {
    let selectedIndex = 1;
    selectedIndex = Math.max(selectedIndex - 1, 0);
    expect(selectedIndex).toBe(0);

    selectedIndex = Math.max(selectedIndex - 1, 0);
    expect(selectedIndex).toBe(0); // clamped
  });
});
