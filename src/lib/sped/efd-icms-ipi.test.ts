import { describe, it, expect } from "vitest";
import {
  gerarSpedFiscal,
  validarSped,
  formatarData,
  formatarValor,
  formatarQuantidade,
  VERSAO_LAYOUT,
  type SpedConfig,
  type DadosSped,
  type Participante,
  type Produto,
  type DocumentoFiscal,
  type ItemInventario,
} from "./efd-icms-ipi";

// Configuração base para testes
const configBase: SpedConfig = {
  periodo: {
    dataInicial: new Date(2026, 0, 1),
    dataFinal: new Date(2026, 0, 31),
  },
  empresa: {
    cnpj: "12345678000190",
    ie: "123456789",
    razaoSocial: "EMPRESA TESTE LTDA",
    uf: "SP",
    codigoMunicipio: "3550308",
    finalidade: "0",
    perfil: "A",
    atividade: "0",
  },
};

const participanteBase: Participante = {
  codigo: "FORN001",
  nome: "FORNECEDOR TESTE LTDA",
  codigoPais: "1058",
  cnpjCpf: "98765432000199",
  ie: "987654321",
  codigoMunicipio: "3550308",
  endereco: "RUA TESTE",
  numero: "100",
  bairro: "CENTRO",
};

const produtoBase: Produto = {
  codigo: "PROD001",
  descricao: "PRODUTO TESTE",
  unidade: "UN",
  tipoItem: "00",
  ncm: "12345678",
  aliquotaIcms: 18,
};

const documentoBase: DocumentoFiscal = {
  tipo: "entrada",
  modelo: "55",
  serie: "1",
  numero: 1,
  chaveAcesso: "35260112345678000190550010000000011123456789",
  dataEmissao: new Date(2026, 0, 15),
  valorTotal: 1180,
  valorProdutos: 1000,
  baseCalculoIcms: 1000,
  valorIcms: 180,
  participanteCodigo: "FORN001",
  itens: [
    {
      numero: 1,
      produtoCodigo: "PROD001",
      descricao: "PRODUTO TESTE",
      quantidade: 10,
      unidade: "UN",
      valorUnitario: 100,
      valorTotal: 1000,
      cfop: "1102",
      cstIcms: "00",
      baseCalculoIcms: 1000,
      aliquotaIcms: 18,
      valorIcms: 180,
    },
  ],
};

describe("formatarData", () => {
  it("should format date to SPED format (ddmmaaaa)", () => {
    const date = new Date(2026, 0, 15); // 15/01/2026
    expect(formatarData(date)).toBe("15012026");
  });

  it("should pad single digit day and month", () => {
    const date = new Date(2026, 0, 5); // 05/01/2026
    expect(formatarData(date)).toBe("05012026");
  });
});

describe("formatarValor", () => {
  it("should format number with comma as decimal separator", () => {
    expect(formatarValor(1234.56)).toBe("1234,56");
  });

  it("should format with specified decimal places", () => {
    expect(formatarValor(1234.5, 4)).toBe("1234,5000");
  });

  it("should return empty string for null", () => {
    expect(formatarValor(null)).toBe("");
  });

  it("should return empty string for undefined", () => {
    expect(formatarValor(undefined)).toBe("");
  });

  it("should format zero", () => {
    expect(formatarValor(0)).toBe("0,00");
  });
});

describe("formatarQuantidade", () => {
  it("should format quantity with 3 decimal places", () => {
    expect(formatarQuantidade(10)).toBe("10,000");
  });

  it("should format decimal quantity", () => {
    expect(formatarQuantidade(10.5)).toBe("10,500");
  });

  it("should return empty string for null", () => {
    expect(formatarQuantidade(null)).toBe("");
  });
});

describe("VERSAO_LAYOUT", () => {
  it("should be version 017", () => {
    expect(VERSAO_LAYOUT).toBe("017");
  });
});

describe("gerarSpedFiscal", () => {
  it("should generate valid SPED file", () => {
    const dados: DadosSped = {
      config: configBase,
      participantes: [participanteBase],
      produtos: [produtoBase],
      unidades: [{ codigo: "UN", descricao: "UNIDADE" }],
      documentos: [documentoBase],
    };

    const resultado = gerarSpedFiscal(dados);

    expect(resultado).toContain("|0000|");
    expect(resultado).toContain("|9999|");
  });

  it("should start with registro 0000", () => {
    const dados: DadosSped = {
      config: configBase,
      participantes: [],
      produtos: [],
      unidades: [],
      documentos: [],
    };

    const resultado = gerarSpedFiscal(dados);
    const linhas = resultado.split("\r\n");

    expect(linhas[0]).toMatch(/^\|0000\|/);
  });

  it("should end with registro 9999", () => {
    const dados: DadosSped = {
      config: configBase,
      participantes: [],
      produtos: [],
      unidades: [],
      documentos: [],
    };

    const resultado = gerarSpedFiscal(dados);
    const linhas = resultado.split("\r\n").filter(l => l.trim());

    expect(linhas[linhas.length - 1]).toMatch(/^\|9999\|/);
  });

  it("should include empresa data in registro 0000", () => {
    const dados: DadosSped = {
      config: configBase,
      participantes: [],
      produtos: [],
      unidades: [],
      documentos: [],
    };

    const resultado = gerarSpedFiscal(dados);

    expect(resultado).toContain("EMPRESA TESTE LTDA");
    expect(resultado).toContain("12345678000190");
  });

  it("should include participantes in registro 0150", () => {
    const dados: DadosSped = {
      config: configBase,
      participantes: [participanteBase],
      produtos: [],
      unidades: [],
      documentos: [],
    };

    const resultado = gerarSpedFiscal(dados);

    expect(resultado).toContain("|0150|");
    expect(resultado).toContain("FORNECEDOR TESTE LTDA");
  });

  it("should include produtos in registro 0200", () => {
    const dados: DadosSped = {
      config: configBase,
      participantes: [],
      produtos: [produtoBase],
      unidades: [],
      documentos: [],
    };

    const resultado = gerarSpedFiscal(dados);

    expect(resultado).toContain("|0200|");
    expect(resultado).toContain("PRODUTO TESTE");
  });

  it("should include unidades in registro 0190", () => {
    const dados: DadosSped = {
      config: configBase,
      participantes: [],
      produtos: [],
      unidades: [{ codigo: "UN", descricao: "UNIDADE" }],
      documentos: [],
    };

    const resultado = gerarSpedFiscal(dados);

    expect(resultado).toContain("|0190|");
    expect(resultado).toContain("UN");
  });

  it("should include documentos in registro C100", () => {
    const dados: DadosSped = {
      config: configBase,
      participantes: [participanteBase],
      produtos: [produtoBase],
      unidades: [{ codigo: "UN", descricao: "UNIDADE" }],
      documentos: [documentoBase],
    };

    const resultado = gerarSpedFiscal(dados);

    expect(resultado).toContain("|C100|");
    expect(resultado).toContain("|C170|");
    expect(resultado).toContain("|C190|");
  });

  it("should include inventario when provided", () => {
    const inventarioItem: ItemInventario = {
      produtoCodigo: "PROD001",
      unidade: "UN",
      quantidade: 100,
      valorUnitario: 50,
      valorTotal: 5000,
      indicadorPropriedade: "0",
    };

    const dados: DadosSped = {
      config: configBase,
      participantes: [],
      produtos: [produtoBase],
      unidades: [{ codigo: "UN", descricao: "UNIDADE" }],
      documentos: [],
      inventario: {
        data: new Date(2026, 0, 31),
        motivo: "01",
        itens: [inventarioItem],
      },
    };

    const resultado = gerarSpedFiscal(dados);

    expect(resultado).toContain("|H005|");
    expect(resultado).toContain("|H010|");
  });

  it("should include contador when provided", () => {
    const dados: DadosSped = {
      config: {
        ...configBase,
        contador: {
          nome: "CONTADOR TESTE",
          cpf: "12345678901",
          crc: "SP-123456",
          email: "contador@teste.com",
        },
      },
      participantes: [],
      produtos: [],
      unidades: [],
      documentos: [],
    };

    const resultado = gerarSpedFiscal(dados);

    expect(resultado).toContain("|0100|");
    expect(resultado).toContain("CONTADOR TESTE");
  });

  it("should include dados complementares when provided", () => {
    const dados: DadosSped = {
      config: configBase,
      dadosComplementares: {
        fantasia: "EMPRESA FANTASIA",
        cep: "01234567",
        endereco: "RUA PRINCIPAL",
        numero: "500",
        bairro: "CENTRO",
        telefone: "1199999999",
        email: "empresa@teste.com",
      },
      participantes: [],
      produtos: [],
      unidades: [],
      documentos: [],
    };

    const resultado = gerarSpedFiscal(dados);

    expect(resultado).toContain("|0005|");
    expect(resultado).toContain("EMPRESA FANTASIA");
  });

  it("should use CRLF line endings", () => {
    const dados: DadosSped = {
      config: configBase,
      participantes: [],
      produtos: [],
      unidades: [],
      documentos: [],
    };

    const resultado = gerarSpedFiscal(dados);

    expect(resultado).toContain("\r\n");
  });
});

describe("validarSped", () => {
  it("should validate correct SPED content", () => {
    const dados: DadosSped = {
      config: configBase,
      participantes: [],
      produtos: [],
      unidades: [],
      documentos: [],
    };

    const conteudo = gerarSpedFiscal(dados);
    const resultado = validarSped(conteudo);

    expect(resultado.valido).toBe(true);
    expect(resultado.erros).toHaveLength(0);
  });

  it("should detect missing registro 0000", () => {
    const conteudo = "|C001|0|\r\n|9999|2|";
    const resultado = validarSped(conteudo);

    expect(resultado.valido).toBe(false);
    expect(resultado.erros).toContain("Arquivo deve iniciar com registro 0000");
  });

  it("should detect missing registro 9999", () => {
    const conteudo = "|0000|017|0|01012026|31012026|EMPRESA|12345678000190||SP|123456789|3550308|||A|0|\r\n|0001|0|";
    const resultado = validarSped(conteudo);

    expect(resultado.valido).toBe(false);
    expect(resultado.erros).toContain("Arquivo deve terminar com registro 9999");
  });

  it("should detect invalid delimiters", () => {
    const conteudo = "|0000|017|\r\nINVALID LINE\r\n|9999|2|";
    const resultado = validarSped(conteudo);

    expect(resultado.valido).toBe(false);
    expect(resultado.erros.some(e => e.includes("Delimitadores inválidos"))).toBe(true);
  });
});

describe("Bloco C - Documentos Fiscais", () => {
  it("should generate C001 with indicator 0 when has documents", () => {
    const dados: DadosSped = {
      config: configBase,
      participantes: [participanteBase],
      produtos: [produtoBase],
      unidades: [{ codigo: "UN", descricao: "UNIDADE" }],
      documentos: [documentoBase],
    };

    const resultado = gerarSpedFiscal(dados);

    expect(resultado).toContain("|C001|0|");
  });

  it("should generate C001 with indicator 1 when no documents", () => {
    const dados: DadosSped = {
      config: configBase,
      participantes: [],
      produtos: [],
      unidades: [],
      documentos: [],
    };

    const resultado = gerarSpedFiscal(dados);

    expect(resultado).toContain("|C001|1|");
  });
});

describe("Bloco H - Inventário", () => {
  it("should generate H001 with indicator 0 when has inventory", () => {
    const dados: DadosSped = {
      config: configBase,
      participantes: [],
      produtos: [produtoBase],
      unidades: [{ codigo: "UN", descricao: "UNIDADE" }],
      documentos: [],
      inventario: {
        data: new Date(2026, 0, 31),
        motivo: "01",
        itens: [{
          produtoCodigo: "PROD001",
          unidade: "UN",
          quantidade: 100,
          valorUnitario: 50,
          valorTotal: 5000,
          indicadorPropriedade: "0",
        }],
      },
    };

    const resultado = gerarSpedFiscal(dados);

    expect(resultado).toContain("|H001|0|");
  });

  it("should generate H001 with indicator 1 when no inventory", () => {
    const dados: DadosSped = {
      config: configBase,
      participantes: [],
      produtos: [],
      unidades: [],
      documentos: [],
    };

    const resultado = gerarSpedFiscal(dados);

    expect(resultado).toContain("|H001|1|");
  });
});

describe("Bloco 9 - Controle", () => {
  it("should include registro 9900 for each registro type", () => {
    const dados: DadosSped = {
      config: configBase,
      participantes: [participanteBase],
      produtos: [produtoBase],
      unidades: [{ codigo: "UN", descricao: "UNIDADE" }],
      documentos: [documentoBase],
    };

    const resultado = gerarSpedFiscal(dados);

    expect(resultado).toContain("|9900|0000|");
    expect(resultado).toContain("|9900|C100|");
    expect(resultado).toContain("|9900|9999|");
  });
});
