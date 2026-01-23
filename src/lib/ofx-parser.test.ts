import { describe, it, expect } from "vitest";
import { parseOFX, ofxTypeToSystemType } from "./ofx-parser";

// OFX de exemplo para testes
const SAMPLE_OFX = `
OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>20260115120000[-03:BRT]
<LANGUAGE>POR
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1001
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>001
<ACCTID>12345-6
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20260101
<DTEND>20260115
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260105120000
<TRNAMT>1500.00
<FITID>2026010500001
<NAME>DEPOSITO EM DINHEIRO
<MEMO>DEPOSITO CAIXA
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260107093000
<TRNAMT>-250.50
<FITID>2026010700001
<NAME>PAGAMENTO BOLETO
<MEMO>CONTA DE LUZ
</STMTTRN>
<STMTTRN>
<TRNTYPE>XFER
<DTPOSTED>20260110140000
<TRNAMT>-1000.00
<FITID>2026011000001
<NAME>TRANSFERENCIA PIX
<REFNUM>E00000000202601101400001
</STMTTRN>
<STMTTRN>
<TRNTYPE>INT
<DTPOSTED>20260115000000
<TRNAMT>5.25
<FITID>2026011500001
<NAME>RENDIMENTO POUPANCA
</STMTTRN>
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>2500.75
<DTASOF>20260115120000
</LEDGERBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`;

const INVALID_OFX = `
<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<BANKTRANLIST>
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`;

const MINIMAL_OFX = `
<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>341
<ACCTID>98765-4
<ACCTTYPE>SAVINGS
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20260101
<DTEND>20260131
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>100.00
<DTASOF>20260131
</LEDGERBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`;

describe("OFX Parser", () => {
  describe("parseOFX", () => {
    it("deve parsear OFX válido com sucesso", () => {
      const result = parseOFX(SAMPLE_OFX);
      
      expect(result.success).toBe(true);
      expect(result.statement).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it("deve extrair informações da conta corretamente", () => {
      const result = parseOFX(SAMPLE_OFX);
      
      expect(result.statement?.bankId).toBe("001");
      expect(result.statement?.accountId).toBe("12345-6");
      expect(result.statement?.accountType).toBe("CHECKING");
      expect(result.statement?.currency).toBe("BRL");
    });

    it("deve extrair datas do período corretamente", () => {
      const result = parseOFX(SAMPLE_OFX);
      
      expect(result.statement?.startDate.getFullYear()).toBe(2026);
      expect(result.statement?.startDate.getMonth()).toBe(0); // Janeiro
      expect(result.statement?.startDate.getDate()).toBe(1);
      
      expect(result.statement?.endDate.getFullYear()).toBe(2026);
      expect(result.statement?.endDate.getMonth()).toBe(0);
      expect(result.statement?.endDate.getDate()).toBe(15);
    });

    it("deve extrair saldo corretamente", () => {
      const result = parseOFX(SAMPLE_OFX);
      
      expect(result.statement?.balanceAmount).toBe(2500.75);
    });

    it("deve extrair todas as transações", () => {
      const result = parseOFX(SAMPLE_OFX);
      
      expect(result.statement?.transactions).toHaveLength(4);
    });

    it("deve extrair detalhes da transação de crédito", () => {
      const result = parseOFX(SAMPLE_OFX);
      const creditTrn = result.statement?.transactions.find(t => t.fitId === "2026010500001");
      
      expect(creditTrn).toBeDefined();
      expect(creditTrn?.type).toBe("CREDIT");
      expect(creditTrn?.amount).toBe(1500.00);
      expect(creditTrn?.name).toBe("DEPOSITO EM DINHEIRO");
      expect(creditTrn?.memo).toBe("DEPOSITO CAIXA");
    });

    it("deve extrair detalhes da transação de débito", () => {
      const result = parseOFX(SAMPLE_OFX);
      const debitTrn = result.statement?.transactions.find(t => t.fitId === "2026010700001");
      
      expect(debitTrn).toBeDefined();
      expect(debitTrn?.type).toBe("DEBIT");
      expect(debitTrn?.amount).toBe(-250.50);
      expect(debitTrn?.name).toBe("PAGAMENTO BOLETO");
    });

    it("deve extrair detalhes da transferência", () => {
      const result = parseOFX(SAMPLE_OFX);
      const xferTrn = result.statement?.transactions.find(t => t.fitId === "2026011000001");
      
      expect(xferTrn).toBeDefined();
      expect(xferTrn?.type).toBe("XFER");
      expect(xferTrn?.amount).toBe(-1000.00);
      expect(xferTrn?.refNum).toBe("E00000000202601101400001");
    });

    it("deve extrair detalhes de rendimento", () => {
      const result = parseOFX(SAMPLE_OFX);
      const intTrn = result.statement?.transactions.find(t => t.fitId === "2026011500001");
      
      expect(intTrn).toBeDefined();
      expect(intTrn?.type).toBe("INT");
      expect(intTrn?.amount).toBe(5.25);
    });

    it("deve retornar erro para OFX sem conta", () => {
      const result = parseOFX(INVALID_OFX);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain("conta não identificada");
    });

    it("deve parsear OFX mínimo válido", () => {
      const result = parseOFX(MINIMAL_OFX);
      
      expect(result.success).toBe(true);
      expect(result.statement?.bankId).toBe("341");
      expect(result.statement?.accountId).toBe("98765-4");
      expect(result.statement?.accountType).toBe("SAVINGS");
      expect(result.statement?.transactions).toHaveLength(0);
    });

    it("deve usar valores padrão quando tags estão ausentes", () => {
      const result = parseOFX(MINIMAL_OFX);
      
      expect(result.statement?.currency).toBe("BRL");
    });

    it("deve lidar com OFX sem header SGML", () => {
      const ofxWithoutHeader = `<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<BANKACCTFROM>
<ACCTID>11111-1
</BANKACCTFROM>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;
      
      const result = parseOFX(ofxWithoutHeader);
      expect(result.success).toBe(true);
      expect(result.statement?.accountId).toBe("11111-1");
    });

    it("deve retornar erro para conteúdo inválido", () => {
      const result = parseOFX("");
      
      expect(result.success).toBe(false);
    });
  });

  describe("ofxTypeToSystemType", () => {
    describe("Valores positivos (entradas)", () => {
      it("deve mapear CREDIT para CREDIT", () => {
        expect(ofxTypeToSystemType("CREDIT", 100)).toBe("CREDIT");
      });

      it("deve mapear XFER positivo para TRANSFER_IN", () => {
        expect(ofxTypeToSystemType("XFER", 500)).toBe("TRANSFER_IN");
      });

      it("deve mapear INT para INTEREST", () => {
        expect(ofxTypeToSystemType("INT", 10)).toBe("INTEREST");
      });

      it("deve mapear DIV para INTEREST", () => {
        expect(ofxTypeToSystemType("DIV", 25)).toBe("INTEREST");
      });

      it("deve mapear DEP para CREDIT", () => {
        expect(ofxTypeToSystemType("DEP", 1000)).toBe("CREDIT");
      });

      it("deve mapear DIRECTDEP para CREDIT", () => {
        expect(ofxTypeToSystemType("DIRECTDEP", 3000)).toBe("CREDIT");
      });
    });

    describe("Valores negativos (saídas)", () => {
      it("deve mapear DEBIT para DEBIT", () => {
        expect(ofxTypeToSystemType("DEBIT", -100)).toBe("DEBIT");
      });

      it("deve mapear XFER negativo para TRANSFER_OUT", () => {
        expect(ofxTypeToSystemType("XFER", -500)).toBe("TRANSFER_OUT");
      });

      it("deve mapear FEE para FEE", () => {
        expect(ofxTypeToSystemType("FEE", -15)).toBe("FEE");
      });

      it("deve mapear SRVCHG para FEE", () => {
        expect(ofxTypeToSystemType("SRVCHG", -10)).toBe("FEE");
      });

      it("deve mapear CHECK para DEBIT", () => {
        expect(ofxTypeToSystemType("CHECK", -200)).toBe("DEBIT");
      });

      it("deve mapear PAYMENT para DEBIT", () => {
        expect(ofxTypeToSystemType("PAYMENT", -150)).toBe("DEBIT");
      });

      it("deve mapear ATM para DEBIT", () => {
        expect(ofxTypeToSystemType("ATM", -300)).toBe("DEBIT");
      });

      it("deve mapear POS para DEBIT", () => {
        expect(ofxTypeToSystemType("POS", -50)).toBe("DEBIT");
      });
    });

    describe("Tipos especiais", () => {
      it("deve mapear OTHER positivo para CREDIT", () => {
        expect(ofxTypeToSystemType("OTHER", 100)).toBe("CREDIT");
      });

      it("deve mapear OTHER negativo para DEBIT", () => {
        expect(ofxTypeToSystemType("OTHER", -100)).toBe("DEBIT");
      });
    });
  });
});
