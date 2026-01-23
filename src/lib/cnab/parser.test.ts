import { describe, it, expect } from "vitest";
import { parseRetornoCnab240, extractTitulosPagos } from "./parser";

// Criar header de arquivo válido
function createHeaderArquivo(banco = "001"): string {
  let line = "";
  line += banco;           // 1-3: Código do banco
  line += "0000";          // 4-7: Lote
  line += "0";             // 8: Tipo registro (0 = header arquivo)
  line += " ".repeat(9);   // 9-17: Uso FEBRABAN
  line += "2";             // 18: Tipo inscrição
  line += "12345678901234"; // 19-32: CNPJ/CPF
  line += " ".repeat(40);  // 33-72: Convênio
  line += "EMPRESA TESTE".padEnd(30, " "); // 73-102: Nome empresa
  line += "BANCO TESTE".padEnd(30, " ");   // 103-132: Nome banco
  line += " ".repeat(10);  // 133-142: Uso FEBRABAN
  line += "1";             // 143: Código remessa/retorno
  line += "15012026";      // 144-151: Data geração
  line += "120000";        // 152-157: Hora geração
  line += "000001";        // 158-163: Sequencial arquivo
  line += "089";           // 164-166: Versão layout
  line += "00000";         // 167-171: Densidade
  return line.padEnd(240, " ");
}

// Criar header de lote
function createHeaderLote(banco = "001"): string {
  let line = "";
  line += banco;           // 1-3: Código do banco
  line += "0001";          // 4-7: Lote
  line += "1";             // 8: Tipo registro (1 = header lote)
  line += "R";             // 9: Tipo operação
  line += "01";            // 10-11: Tipo serviço
  line += " ".repeat(2);   // 12-13: Uso FEBRABAN
  line += "045";           // 14-16: Versão layout
  line += " ";             // 17: Uso FEBRABAN
  line += "2";             // 18: Tipo inscrição
  line += "123456789012345"; // 19-33: CNPJ/CPF
  line += " ".repeat(40);  // 34-73: Convênio
  line += "EMPRESA TESTE".padEnd(30, " "); // 74-103: Nome empresa
  return line.padEnd(240, " ");
}

// Criar segmento T (título)
function createSegmentoT(params: {
  banco?: string;
  nossoNumero?: string;
  seuNumero?: string;
  codigoOcorrencia?: string;
  valorTitulo?: number;
}): string {
  const {
    banco = "001",
    nossoNumero = "12345678901234567890",
    seuNumero = "SEU123456789012",
    codigoOcorrencia = "06",
    valorTitulo = 10000, // R$ 100,00 em centavos
  } = params;

  let line = "";
  line += banco;           // 1-3: Código do banco
  line += "0001";          // 4-7: Lote
  line += "3";             // 8: Tipo registro (3 = detalhe)
  line += "00001";         // 9-13: Sequencial
  line += "T";             // 14: Segmento
  line += " ";             // 15: Uso FEBRABAN
  line += codigoOcorrencia; // 16-17: Código ocorrência
  line += " ".repeat(20);  // 18-37: Agência/conta
  line += nossoNumero.padEnd(20, " "); // 38-57: Nosso número
  line += " ";             // 58: Carteira
  line += seuNumero.padEnd(15, " "); // 59-73: Seu número
  line += "15012026";      // 74-81: Data vencimento
  line += String(valorTitulo).padStart(15, "0"); // 82-96: Valor título
  line += "00000";         // 97-101: Agência cobradora
  line += "0";             // 102: Dígito agência
  line += " ".repeat(3);   // 103-105: Uso empresa
  line += " ".repeat(25);  // 106-130: Uso empresa
  line += "09";            // 131-132: Código moeda
  return line.padEnd(240, " ");
}

// Criar segmento U (complemento)
function createSegmentoU(params: {
  banco?: string;
  valorPago?: number;
  dataPagamento?: string;
  valorTarifa?: number;
}): string {
  const {
    banco = "001",
    valorPago = 10000, // R$ 100,00 em centavos
    dataPagamento = "15012026",
    valorTarifa = 250, // R$ 2,50 em centavos
  } = params;

  let line = "";
  line += banco;           // 1-3: Código do banco
  line += "0001";          // 4-7: Lote
  line += "3";             // 8: Tipo registro (3 = detalhe)
  line += "00002";         // 9-13: Sequencial
  line += "U";             // 14: Segmento
  line += " ";             // 15: Uso FEBRABAN
  line += "06";            // 16-17: Código ocorrência
  line += "000000000000000"; // 18-32: Juros/multa/encargos
  line += "000000000000000"; // 33-47: Valor desconto
  line += "000000000000000"; // 48-62: Valor abatimento
  line += "000000000000000"; // 63-77: Valor IOF
  line += String(valorPago).padStart(15, "0"); // 78-92: Valor pago
  line += "000000000000000"; // 93-107: Valor líquido
  line += "000000000000000"; // 108-122: Outras despesas
  line += "000000000000000"; // 123-137: Outros créditos
  line += dataPagamento;   // 138-145: Data ocorrência
  line += dataPagamento;   // 146-153: Data pagamento
  line += " ".repeat(44);  // 154-197: Reservado
  line += String(valorTarifa).padStart(15, "0"); // 198-212: Valor tarifa
  line += " ";             // 213: Reservado
  line += "0000000000";    // 214-223: Motivos rejeição
  return line.padEnd(240, " ");
}

// Criar trailer de lote
function createTrailerLote(banco = "001"): string {
  let line = "";
  line += banco;           // 1-3: Código do banco
  line += "0001";          // 4-7: Lote
  line += "5";             // 8: Tipo registro (5 = trailer lote)
  line += " ".repeat(9);   // 9-17: Uso FEBRABAN
  line += "000004";        // 18-23: Qtd registros
  line += "000001";        // 24-29: Qtd títulos simples
  line += "00000000000010000"; // 30-46: Valor total simples
  line += "000000";        // 47-52: Qtd títulos vinculada
  line += "00000000000000000"; // 53-69: Valor total vinculada
  return line.padEnd(240, " ");
}

// Criar trailer de arquivo
function createTrailerArquivo(banco = "001"): string {
  let line = "";
  line += banco;           // 1-3: Código do banco
  line += "9999";          // 4-7: Lote
  line += "9";             // 8: Tipo registro (9 = trailer arquivo)
  line += " ".repeat(9);   // 9-17: Uso FEBRABAN
  line += "000001";        // 18-23: Qtd lotes
  line += "000006";        // 24-29: Qtd registros
  return line.padEnd(240, " ");
}

describe("CNAB Parser", () => {
  describe("parseRetornoCnab240", () => {
    it("deve retornar erro para arquivo com menos de 4 linhas", () => {
      const content = createHeaderArquivo() + "\n" + createTrailerArquivo();
      const result = parseRetornoCnab240(content);

      expect(result.success).toBe(false);
      expect(result.errors).toContain("Arquivo inválido: menos de 4 linhas");
    });

    it("deve ignorar linhas com tamanho diferente de 240", () => {
      const content = [
        createHeaderArquivo(),
        createHeaderLote(),
        "linha curta",
        createTrailerLote(),
        createTrailerArquivo(),
      ].join("\n");

      const result = parseRetornoCnab240(content);
      expect(result.success).toBe(true);
    });

    it("deve extrair código do banco", () => {
      const content = [
        createHeaderArquivo("237"),
        createHeaderLote("237"),
        createTrailerLote("237"),
        createTrailerArquivo("237"),
      ].join("\n");

      const result = parseRetornoCnab240(content);
      expect(result.success).toBe(true);
      expect(result.banco).toBe("237");
    });

    it("deve parsear header de arquivo", () => {
      const content = [
        createHeaderArquivo(),
        createHeaderLote(),
        createTrailerLote(),
        createTrailerArquivo(),
      ].join("\n");

      const result = parseRetornoCnab240(content);
      expect(result.success).toBe(true);

      const headerArquivo = result.registros.find(r => r.tipo === "HEADER_ARQUIVO");
      expect(headerArquivo).toBeDefined();
      expect(headerArquivo?.dados?.banco).toBe("001");
    });

    it("deve parsear header de lote", () => {
      const content = [
        createHeaderArquivo(),
        createHeaderLote(),
        createTrailerLote(),
        createTrailerArquivo(),
      ].join("\n");

      const result = parseRetornoCnab240(content);
      const headerLote = result.registros.find(r => r.tipo === "HEADER_LOTE");
      expect(headerLote).toBeDefined();
    });

    it("deve parsear segmento T", () => {
      const content = [
        createHeaderArquivo(),
        createHeaderLote(),
        createSegmentoT({ nossoNumero: "NOSSO12345", codigoOcorrencia: "06" }),
        createSegmentoU({}),
        createTrailerLote(),
        createTrailerArquivo(),
      ].join("\n");

      const result = parseRetornoCnab240(content);
      const segT = result.registros.find(r => r.tipo === "DETALHE" && r.segmento === "T");
      
      expect(segT).toBeDefined();
      expect(segT?.nossoNumero).toContain("NOSSO12345");
      expect(segT?.codigoOcorrencia).toBe("06");
    });

    it("deve parsear segmento U", () => {
      const content = [
        createHeaderArquivo(),
        createHeaderLote(),
        createSegmentoT({}),
        createSegmentoU({ valorPago: 15000 }), // R$ 150,00
        createTrailerLote(),
        createTrailerArquivo(),
      ].join("\n");

      const result = parseRetornoCnab240(content);
      const segU = result.registros.find(r => r.tipo === "DETALHE" && r.segmento === "U");
      
      expect(segU).toBeDefined();
      expect(segU?.valorPago).toBe(150.00);
    });

    it("deve contar títulos pagos (ocorrência 06)", () => {
      const content = [
        createHeaderArquivo(),
        createHeaderLote(),
        createSegmentoT({ codigoOcorrencia: "06" }),
        createSegmentoU({}),
        createTrailerLote(),
        createTrailerArquivo(),
      ].join("\n");

      const result = parseRetornoCnab240(content);
      expect(result.totalPagos).toBe(1);
    });

    it("deve contar títulos pagos (ocorrência 10)", () => {
      const content = [
        createHeaderArquivo(),
        createHeaderLote(),
        createSegmentoT({ codigoOcorrencia: "10" }),
        createSegmentoU({}),
        createTrailerLote(),
        createTrailerArquivo(),
      ].join("\n");

      const result = parseRetornoCnab240(content);
      expect(result.totalPagos).toBe(1);
    });

    it("deve contar títulos pagos (ocorrência 17)", () => {
      const content = [
        createHeaderArquivo(),
        createHeaderLote(),
        createSegmentoT({ codigoOcorrencia: "17" }),
        createSegmentoU({}),
        createTrailerLote(),
        createTrailerArquivo(),
      ].join("\n");

      const result = parseRetornoCnab240(content);
      expect(result.totalPagos).toBe(1);
    });

    it("deve contar títulos rejeitados (ocorrência 03)", () => {
      const content = [
        createHeaderArquivo(),
        createHeaderLote(),
        createSegmentoT({ codigoOcorrencia: "03" }),
        createSegmentoU({}),
        createTrailerLote(),
        createTrailerArquivo(),
      ].join("\n");

      const result = parseRetornoCnab240(content);
      expect(result.totalRejeitados).toBe(1);
    });

    it("deve contar títulos rejeitados (ocorrência 26)", () => {
      const content = [
        createHeaderArquivo(),
        createHeaderLote(),
        createSegmentoT({ codigoOcorrencia: "26" }),
        createSegmentoU({}),
        createTrailerLote(),
        createTrailerArquivo(),
      ].join("\n");

      const result = parseRetornoCnab240(content);
      expect(result.totalRejeitados).toBe(1);
    });

    it("deve somar valor total pago", () => {
      const content = [
        createHeaderArquivo(),
        createHeaderLote(),
        createSegmentoT({ codigoOcorrencia: "06" }),
        createSegmentoU({ valorPago: 10000 }), // R$ 100,00
        createSegmentoT({ codigoOcorrencia: "06" }),
        createSegmentoU({ valorPago: 20000 }), // R$ 200,00
        createTrailerLote(),
        createTrailerArquivo(),
      ].join("\n");

      const result = parseRetornoCnab240(content);
      expect(result.valorTotal).toBe(300.00);
    });

    it("deve parsear trailer de lote", () => {
      const content = [
        createHeaderArquivo(),
        createHeaderLote(),
        createTrailerLote(),
        createTrailerArquivo(),
      ].join("\n");

      const result = parseRetornoCnab240(content);
      const trailerLote = result.registros.find(r => r.tipo === "TRAILER_LOTE");
      expect(trailerLote).toBeDefined();
    });

    it("deve parsear trailer de arquivo", () => {
      const content = [
        createHeaderArquivo(),
        createHeaderLote(),
        createTrailerLote(),
        createTrailerArquivo(),
      ].join("\n");

      const result = parseRetornoCnab240(content);
      const trailerArquivo = result.registros.find(r => r.tipo === "TRAILER_ARQUIVO");
      expect(trailerArquivo).toBeDefined();
    });
  });

  describe("extractTitulosPagos", () => {
    it("deve retornar array vazio para retorno sem títulos", () => {
      const retorno = {
        success: true,
        registros: [],
      };

      const titulos = extractTitulosPagos(retorno);
      expect(titulos).toEqual([]);
    });

    it("deve extrair títulos com ocorrência 06 (liquidação)", () => {
      const content = [
        createHeaderArquivo(),
        createHeaderLote(),
        createSegmentoT({ nossoNumero: "NOSSO123", seuNumero: "SEU456", codigoOcorrencia: "06" }),
        createSegmentoU({ valorPago: 10000, valorTarifa: 250 }),
        createTrailerLote(),
        createTrailerArquivo(),
      ].join("\n");

      const retorno = parseRetornoCnab240(content);
      const titulos = extractTitulosPagos(retorno);

      expect(titulos).toHaveLength(1);
      expect(titulos[0].nossoNumero).toContain("NOSSO123");
      expect(titulos[0].valorPago).toBe(100.00);
      expect(titulos[0].valorTarifa).toBe(2.50);
    });

    it("deve extrair títulos com ocorrência 10 (baixa por pagamento)", () => {
      const content = [
        createHeaderArquivo(),
        createHeaderLote(),
        createSegmentoT({ codigoOcorrencia: "10" }),
        createSegmentoU({ valorPago: 15000 }),
        createTrailerLote(),
        createTrailerArquivo(),
      ].join("\n");

      const retorno = parseRetornoCnab240(content);
      const titulos = extractTitulosPagos(retorno);

      expect(titulos).toHaveLength(1);
      expect(titulos[0].valorPago).toBe(150.00);
    });

    it("deve extrair títulos com ocorrência 17 (liquidação após baixa)", () => {
      const content = [
        createHeaderArquivo(),
        createHeaderLote(),
        createSegmentoT({ codigoOcorrencia: "17" }),
        createSegmentoU({ valorPago: 20000 }),
        createTrailerLote(),
        createTrailerArquivo(),
      ].join("\n");

      const retorno = parseRetornoCnab240(content);
      const titulos = extractTitulosPagos(retorno);

      expect(titulos).toHaveLength(1);
      expect(titulos[0].valorPago).toBe(200.00);
    });

    it("não deve extrair títulos com outras ocorrências", () => {
      const content = [
        createHeaderArquivo(),
        createHeaderLote(),
        createSegmentoT({ codigoOcorrencia: "02" }), // Entrada confirmada
        createSegmentoU({ valorPago: 10000 }),
        createTrailerLote(),
        createTrailerArquivo(),
      ].join("\n");

      const retorno = parseRetornoCnab240(content);
      const titulos = extractTitulosPagos(retorno);

      expect(titulos).toHaveLength(0);
    });

    it("deve extrair múltiplos títulos pagos", () => {
      const content = [
        createHeaderArquivo(),
        createHeaderLote(),
        createSegmentoT({ nossoNumero: "TITULO1", codigoOcorrencia: "06" }),
        createSegmentoU({ valorPago: 10000 }),
        createSegmentoT({ nossoNumero: "TITULO2", codigoOcorrencia: "06" }),
        createSegmentoU({ valorPago: 20000 }),
        createSegmentoT({ nossoNumero: "TITULO3", codigoOcorrencia: "06" }),
        createSegmentoU({ valorPago: 30000 }),
        createTrailerLote(),
        createTrailerArquivo(),
      ].join("\n");

      const retorno = parseRetornoCnab240(content);
      const titulos = extractTitulosPagos(retorno);

      expect(titulos).toHaveLength(3);
      expect(titulos[0].valorPago).toBe(100.00);
      expect(titulos[1].valorPago).toBe(200.00);
      expect(titulos[2].valorPago).toBe(300.00);
    });
  });
});
