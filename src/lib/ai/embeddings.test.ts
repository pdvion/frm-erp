import { describe, it, expect } from "vitest";
import {
  composeMaterialEmbeddingText,
  composeProductEmbeddingText,
  composeCustomerEmbeddingText,
  composeSupplierEmbeddingText,
  composeEmployeeEmbeddingText,
  composeTaskEmbeddingText,
  composeSalesOrderEmbeddingText,
  composeEmbeddingText,
  EMBEDDABLE_ENTITIES,
} from "./embeddings";

describe("composeMaterialEmbeddingText", () => {
  it("should compose text with all fields", () => {
    const text = composeMaterialEmbeddingText({
      id: "uuid-1", code: 1001, description: "Parafuso Sextavado M10x50",
      internalCode: "PAR-001", ncm: "7318.15.00", unit: "UN",
      categoryName: "Fixadores", subCategoryName: "Parafusos",
      manufacturer: "Ciser", notes: "Aço carbono zincado", barcode: "7891234567890",
    });

    expect(text).toContain("Parafuso Sextavado M10x50");
    expect(text).toContain("Código interno: PAR-001");
    expect(text).toContain("NCM: 7318.15.00");
    expect(text).toContain("Categoria: Fixadores");
    expect(text).toContain("Subcategoria: Parafusos");
    expect(text).toContain("Fabricante: Ciser");
    expect(text).toContain("Código de barras: 7891234567890");
  });

  it("should compose text with minimal fields", () => {
    const text = composeMaterialEmbeddingText({ id: "uuid-2", code: 2001, description: "Chapa de Aço 3mm", unit: "KG" });
    expect(text).toBe("Chapa de Aço 3mm | Código: 2001 | Unidade: KG");
  });

  it("should skip null optional fields", () => {
    const text = composeMaterialEmbeddingText({
      id: "uuid-3", code: 3001, description: "Rolamento 6205", unit: "UN",
      internalCode: null, ncm: null, categoryName: null, subCategoryName: null,
      manufacturer: null, notes: null, barcode: null,
    });
    expect(text).toBe("Rolamento 6205 | Código: 3001 | Unidade: UN");
  });
});

describe("composeProductEmbeddingText", () => {
  it("should compose text with all fields", () => {
    const text = composeProductEmbeddingText({
      id: "uuid-1", code: "PROD-001", name: "Parafuso Sextavado Kit",
      shortDescription: "Kit com 100 parafusos", description: "Kit completo de fixação",
      tags: ["fixação", "industrial"], categoryName: "Kits",
      materialDescription: "Parafuso Sextavado M10x50",
      specifications: { peso: "2kg", material: "Aço" },
    });
    expect(text).toContain("Parafuso Sextavado Kit");
    expect(text).toContain("SKU: PROD-001");
    expect(text).toContain("Kit com 100 parafusos");
    expect(text).toContain("Tags: fixação, industrial");
    expect(text).toContain("Material: Parafuso Sextavado M10x50");
    expect(text).toContain("Especificações:");
  });

  it("should handle minimal product", () => {
    const text = composeProductEmbeddingText({ id: "uuid-2", code: "P-002", name: "Produto Simples" });
    expect(text).toBe("Produto Simples | SKU: P-002");
  });
});

describe("composeCustomerEmbeddingText", () => {
  it("should compose text with all fields", () => {
    const text = composeCustomerEmbeddingText({
      id: "uuid-1", code: "CLI-001", companyName: "Indústria ABC Ltda",
      tradeName: "ABC", cnpj: "12.345.678/0001-90", cpf: null,
      city: "São Paulo", state: "SP", contactName: "João Silva",
      notes: "Cliente premium", segment: "Metalúrgica",
    });
    expect(text).toContain("Indústria ABC Ltda");
    expect(text).toContain("Nome fantasia: ABC");
    expect(text).toContain("CNPJ: 12.345.678/0001-90");
    expect(text).toContain("São Paulo/SP");
    expect(text).toContain("Contato: João Silva");
    expect(text).toContain("Segmento: Metalúrgica");
  });

  it("should handle minimal customer", () => {
    const text = composeCustomerEmbeddingText({ id: "uuid-2", code: "CLI-002", companyName: "Empresa XYZ" });
    expect(text).toBe("Empresa XYZ | Código: CLI-002");
  });
});

describe("composeSupplierEmbeddingText", () => {
  it("should compose text with categories", () => {
    const text = composeSupplierEmbeddingText({
      id: "uuid-1", code: 501, companyName: "Fornecedor Industrial SA",
      tradeName: "FornInd", cnpj: "98.765.432/0001-10",
      city: "Curitiba", state: "PR", cnae: "2599-3/99",
      categories: ["Manutenção", "Dispositivos"], notes: "Entrega rápida",
    });
    expect(text).toContain("Fornecedor Industrial SA");
    expect(text).toContain("Nome fantasia: FornInd");
    expect(text).toContain("Curitiba/PR");
    expect(text).toContain("CNAE: 2599-3/99");
    expect(text).toContain("Categorias: Manutenção, Dispositivos");
  });
});

describe("composeEmployeeEmbeddingText", () => {
  it("should compose text with all fields", () => {
    const text = composeEmployeeEmbeddingText({
      id: "uuid-1", code: 100, name: "Maria Santos",
      cpf: "123.456.789-00", email: "maria@empresa.com",
      departmentName: "Produção", positionName: "Operadora CNC",
      contractType: "CLT", notes: "Turno noturno",
    });
    expect(text).toContain("Maria Santos");
    expect(text).toContain("Matrícula: 100");
    expect(text).toContain("Departamento: Produção");
    expect(text).toContain("Cargo: Operadora CNC");
    expect(text).toContain("Contrato: CLT");
  });
});

describe("composeTaskEmbeddingText", () => {
  it("should compose text with all fields", () => {
    const text = composeTaskEmbeddingText({
      id: "uuid-1", code: 42, title: "Aprovar pedido de compra #1234",
      description: "Pedido de compra de parafusos para a linha de produção",
      priority: "HIGH", status: "PENDING",
      entityType: "PURCHASE_ORDER", ownerName: "Carlos Silva",
      departmentName: "Compras", resolution: null,
    });
    expect(text).toContain("Aprovar pedido de compra #1234");
    expect(text).toContain("Tarefa #42");
    expect(text).toContain("Prioridade: HIGH");
    expect(text).toContain("Status: PENDING");
    expect(text).toContain("Tipo: PURCHASE_ORDER");
    expect(text).toContain("Responsável: Carlos Silva");
    expect(text).toContain("Departamento: Compras");
  });

  it("should handle minimal task", () => {
    const text = composeTaskEmbeddingText({ id: "uuid-2", code: 1, title: "Tarefa simples" });
    expect(text).toBe("Tarefa simples | Tarefa #1");
  });

  it("should include resolution when present", () => {
    const text = composeTaskEmbeddingText({
      id: "uuid-3", code: 10, title: "Verificar estoque",
      resolution: "Estoque conferido e ajustado",
    });
    expect(text).toContain("Resolução: Estoque conferido e ajustado");
  });
});

describe("composeSalesOrderEmbeddingText", () => {
  it("should compose text with all fields", () => {
    const text = composeSalesOrderEmbeddingText({
      id: "uuid-1", code: 5001, customerName: "Indústria ABC Ltda",
      customerTradeName: "ABC", status: "CONFIRMED",
      totalValue: 15750.50, notes: "Entrega urgente",
      itemDescriptions: ["Parafuso M10x50", "Porca M10", "Arruela M10"],
    });
    expect(text).toContain("Pedido de Venda #5001");
    expect(text).toContain("Cliente: Indústria ABC Ltda");
    expect(text).toContain("(ABC)");
    expect(text).toContain("Status: CONFIRMED");
    expect(text).toContain("Valor: R$ 15750.50");
    expect(text).toContain("Itens: Parafuso M10x50, Porca M10, Arruela M10");
    expect(text).toContain("Observações: Entrega urgente");
  });

  it("should handle minimal sales order", () => {
    const text = composeSalesOrderEmbeddingText({
      id: "uuid-2", code: 5002, customerName: "Cliente XYZ",
      status: "PENDING", totalValue: 0,
    });
    expect(text).toBe("Pedido de Venda #5002 | Cliente: Cliente XYZ | Status: PENDING | Valor: R$ 0.00");
  });
});

describe("composeEmbeddingText (generic)", () => {
  it("should dispatch to correct composer", () => {
    const materialText = composeEmbeddingText({ type: "material", data: { id: "1", code: 1, description: "Test", unit: "UN" } });
    expect(materialText).toContain("Test");

    const employeeText = composeEmbeddingText({ type: "employee", data: { id: "2", code: 1, name: "Maria", contractType: "CLT" } });
    expect(employeeText).toContain("Maria");

    const taskText = composeEmbeddingText({ type: "task", data: { id: "3", code: 1, title: "Aprovar compra" } });
    expect(taskText).toContain("Aprovar compra");

    const orderText = composeEmbeddingText({ type: "sales_order", data: { id: "4", code: 1, customerName: "ABC", status: "PENDING", totalValue: 100 } });
    expect(orderText).toContain("ABC");
  });
});

describe("EMBEDDABLE_ENTITIES", () => {
  it("should contain all 7 entity types", () => {
    expect(EMBEDDABLE_ENTITIES).toHaveLength(7);
    expect(EMBEDDABLE_ENTITIES).toContain("material");
    expect(EMBEDDABLE_ENTITIES).toContain("product");
    expect(EMBEDDABLE_ENTITIES).toContain("customer");
    expect(EMBEDDABLE_ENTITIES).toContain("supplier");
    expect(EMBEDDABLE_ENTITIES).toContain("employee");
    expect(EMBEDDABLE_ENTITIES).toContain("task");
    expect(EMBEDDABLE_ENTITIES).toContain("sales_order");
  });
});
