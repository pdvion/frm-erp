import { describe, it, expect, beforeAll } from "vitest";
import { DOMParser } from "linkedom";
import { formatCnpj, formatChaveAcesso } from "./nfe-parser";

// Mock DOMParser para ambiente Node
global.DOMParser = DOMParser as unknown as typeof globalThis.DOMParser;

// Importar após configurar DOMParser usando beforeAll
let parseNFeXml: typeof import("./nfe-parser").parseNFeXml;
let validateNFeXml: typeof import("./nfe-parser").validateNFeXml;

beforeAll(async () => {
  const nfeModule = await import("./nfe-parser");
  parseNFeXml = nfeModule.parseNFeXml;
  validateNFeXml = nfeModule.validateNFeXml;
});

// XML de NFe mínimo válido para testes
const validNFeXml = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe35260112345678000190550010000000011123456789">
      <ide>
        <nNF>1</nNF>
        <serie>1</serie>
        <dhEmi>2026-01-19T10:30:00-03:00</dhEmi>
        <natOp>VENDA</natOp>
      </ide>
      <emit>
        <CNPJ>12345678000190</CNPJ>
        <xNome>EMPRESA TESTE LTDA</xNome>
        <xFant>EMPRESA TESTE</xFant>
        <IE>123456789</IE>
        <enderEmit>
          <xLgr>RUA TESTE</xLgr>
          <nro>100</nro>
          <xBairro>CENTRO</xBairro>
          <xMun>SAO PAULO</xMun>
          <UF>SP</UF>
          <CEP>01234567</CEP>
        </enderEmit>
      </emit>
      <dest>
        <CNPJ>98765432000199</CNPJ>
        <xNome>CLIENTE TESTE LTDA</xNome>
        <IE>987654321</IE>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>PROD001</cProd>
          <xProd>PRODUTO TESTE</xProd>
          <NCM>12345678</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>10.0000</qCom>
          <vUnCom>100.0000</vUnCom>
          <vProd>1000.00</vProd>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <CST>00</CST>
              <vBC>1000.00</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>180.00</vICMS>
            </ICMS00>
          </ICMS>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>1000.00</vBC>
              <pPIS>1.65</pPIS>
              <vPIS>16.50</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>1000.00</vBC>
              <pCOFINS>7.60</pCOFINS>
              <vCOFINS>76.00</vCOFINS>
            </COFINSAliq>
          </COFINS>
          <IPI>
            <IPITrib>
              <CST>50</CST>
              <vBC>1000.00</vBC>
              <pIPI>5.00</pIPI>
              <vIPI>50.00</vIPI>
            </IPITrib>
          </IPI>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>1000.00</vBC>
          <vICMS>180.00</vICMS>
          <vIPI>50.00</vIPI>
          <vPIS>16.50</vPIS>
          <vCOFINS>76.00</vCOFINS>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vOutro>0.00</vOutro>
          <vProd>1000.00</vProd>
          <vNF>1050.00</vNF>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>0</modFrete>
      </transp>
      <cobr>
        <dup>
          <nDup>001</nDup>
          <dVenc>2026-02-19</dVenc>
          <vDup>1050.00</vDup>
        </dup>
      </cobr>
      <infAdic>
        <infCpl>Informações adicionais de teste</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
</nfeProc>`;

describe("parseNFeXml", () => {
  it("should parse valid NFe XML", () => {
    const result = parseNFeXml(validNFeXml);

    expect(result.chaveAcesso).toBe("35260112345678000190550010000000011123456789");
    expect(result.numero).toBe(1);
    expect(result.serie).toBe(1);
    expect(result.naturezaOperacao).toBe("VENDA");
  });

  it("should parse emitente data", () => {
    const result = parseNFeXml(validNFeXml);

    expect(result.emitente.cnpj).toBe("12345678000190");
    expect(result.emitente.razaoSocial).toBe("EMPRESA TESTE LTDA");
    expect(result.emitente.nomeFantasia).toBe("EMPRESA TESTE");
    expect(result.emitente.ie).toBe("123456789");
    expect(result.emitente.endereco?.cidade).toBe("SAO PAULO");
    expect(result.emitente.endereco?.uf).toBe("SP");
  });

  it("should parse destinatario data", () => {
    const result = parseNFeXml(validNFeXml);

    expect(result.destinatario.cnpj).toBe("98765432000199");
    expect(result.destinatario.razaoSocial).toBe("CLIENTE TESTE LTDA");
  });

  it("should parse itens", () => {
    const result = parseNFeXml(validNFeXml);

    expect(result.itens).toHaveLength(1);
    expect(result.itens[0].codigo).toBe("PROD001");
    expect(result.itens[0].descricao).toBe("PRODUTO TESTE");
    expect(result.itens[0].quantidade).toBe(10);
    expect(result.itens[0].valorUnitario).toBe(100);
    expect(result.itens[0].valorTotal).toBe(1000);
  });

  it("should parse impostos", () => {
    const result = parseNFeXml(validNFeXml);
    const item = result.itens[0];

    expect(item.icms.cst).toBe("00");
    expect(item.icms.baseCalculo).toBe(1000);
    expect(item.icms.aliquota).toBe(18);
    expect(item.icms.valor).toBe(180);

    expect(item.pis.valor).toBe(16.5);
    expect(item.cofins.valor).toBe(76);
    expect(item.ipi.valor).toBe(50);
  });

  it("should parse totais", () => {
    const result = parseNFeXml(validNFeXml);

    expect(result.totais.valorProdutos).toBe(1000);
    expect(result.totais.valorIcms).toBe(180);
    expect(result.totais.valorNota).toBe(1050);
  });

  it("should parse duplicatas", () => {
    const result = parseNFeXml(validNFeXml);

    expect(result.duplicatas).toHaveLength(1);
    expect(result.duplicatas[0].numero).toBe("001");
    expect(result.duplicatas[0].valor).toBe(1050);
  });

  it("should parse transporte", () => {
    const result = parseNFeXml(validNFeXml);

    expect(result.transporte?.modalidade).toBe(0);
  });

  it("should parse informações adicionais", () => {
    const result = parseNFeXml(validNFeXml);

    expect(result.informacoesAdicionais).toBe("Informações adicionais de teste");
  });

  it("should throw error for invalid XML", () => {
    expect(() => parseNFeXml("<invalid>")).toThrow();
  });

  it("should throw error for XML without NFe element", () => {
    const xmlWithoutNFe = `<?xml version="1.0"?><root><data>test</data></root>`;
    expect(() => parseNFeXml(xmlWithoutNFe)).toThrow("Elemento NFe não encontrado");
  });
});

describe("validateNFeXml", () => {
  it("should return valid for correct NFe", () => {
    const result = validateNFeXml(validNFeXml);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should return invalid for XML without NFe", () => {
    const result = validateNFeXml("<root></root>");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should return invalid for malformed XML", () => {
    const result = validateNFeXml("not xml at all");
    expect(result.valid).toBe(false);
  });
});

describe("formatCnpj", () => {
  it("should format valid CNPJ", () => {
    expect(formatCnpj("12345678000190")).toBe("12.345.678/0001-90");
  });

  it("should return original if invalid length", () => {
    expect(formatCnpj("123456")).toBe("123456");
  });

  it("should handle already formatted CNPJ", () => {
    const result = formatCnpj("12.345.678/0001-90");
    expect(result).toContain("12");
  });
});

describe("formatChaveAcesso", () => {
  it("should format valid chave de acesso", () => {
    const chave = "35260112345678000190550010000000011123456789";
    const formatted = formatChaveAcesso(chave);
    expect(formatted).toContain(" ");
    expect(formatted.replace(/ /g, "")).toBe(chave);
  });

  it("should return original if invalid length", () => {
    expect(formatChaveAcesso("123456")).toBe("123456");
  });
});
