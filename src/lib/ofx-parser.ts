/**
 * Parser de arquivos OFX (Open Financial Exchange)
 * Formato padrão para extratos bancários
 */

export interface OFXTransaction {
  fitId: string; // ID único da transação no banco
  type: "CREDIT" | "DEBIT" | "INT" | "DIV" | "FEE" | "SRVCHG" | "DEP" | "ATM" | "POS" | "XFER" | "CHECK" | "PAYMENT" | "CASH" | "DIRECTDEP" | "DIRECTDEBIT" | "REPEATPMT" | "OTHER";
  datePosted: Date;
  amount: number;
  name: string;
  memo?: string;
  checkNum?: string;
  refNum?: string;
}

export interface OFXStatement {
  bankId: string;
  accountId: string;
  accountType: string;
  currency: string;
  startDate: Date;
  endDate: Date;
  balanceAmount: number;
  balanceDate: Date;
  transactions: OFXTransaction[];
}

export interface OFXParseResult {
  success: boolean;
  statement?: OFXStatement;
  error?: string;
}

/**
 * Extrai valor de uma tag OFX
 */
function extractTag(content: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([^<]+)`, "i");
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Converte data OFX (YYYYMMDDHHMMSS) para Date
 */
function parseOFXDate(dateStr: string | null): Date {
  if (!dateStr) return new Date();
  
  // Remove timezone info se presente
  const cleanDate = dateStr.replace(/\[.*\]/, "").trim();
  
  const year = parseInt(cleanDate.substring(0, 4));
  const month = parseInt(cleanDate.substring(4, 6)) - 1;
  const day = parseInt(cleanDate.substring(6, 8));
  const hour = cleanDate.length >= 10 ? parseInt(cleanDate.substring(8, 10)) : 0;
  const minute = cleanDate.length >= 12 ? parseInt(cleanDate.substring(10, 12)) : 0;
  const second = cleanDate.length >= 14 ? parseInt(cleanDate.substring(12, 14)) : 0;
  
  return new Date(year, month, day, hour, minute, second);
}

/**
 * Mapeia tipo de transação OFX para nosso tipo interno
 */
function mapTransactionType(ofxType: string): OFXTransaction["type"] {
  const typeMap: Record<string, OFXTransaction["type"]> = {
    "CREDIT": "CREDIT",
    "DEBIT": "DEBIT",
    "INT": "INT",
    "DIV": "DIV",
    "FEE": "FEE",
    "SRVCHG": "SRVCHG",
    "DEP": "DEP",
    "ATM": "ATM",
    "POS": "POS",
    "XFER": "XFER",
    "CHECK": "CHECK",
    "PAYMENT": "PAYMENT",
    "CASH": "CASH",
    "DIRECTDEP": "DIRECTDEP",
    "DIRECTDEBIT": "DIRECTDEBIT",
    "REPEATPMT": "REPEATPMT",
  };
  
  return typeMap[ofxType.toUpperCase()] || "OTHER";
}

/**
 * Extrai transações do conteúdo OFX
 */
function extractTransactions(content: string): OFXTransaction[] {
  const transactions: OFXTransaction[] = [];
  
  // Encontra todas as transações
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;
  
  while ((match = stmtTrnRegex.exec(content)) !== null) {
    const trnContent = match[1];
    
    const fitId = extractTag(trnContent, "FITID");
    const trnType = extractTag(trnContent, "TRNTYPE");
    const dtPosted = extractTag(trnContent, "DTPOSTED");
    const trnAmt = extractTag(trnContent, "TRNAMT");
    const name = extractTag(trnContent, "NAME");
    const memo = extractTag(trnContent, "MEMO");
    const checkNum = extractTag(trnContent, "CHECKNUM");
    const refNum = extractTag(trnContent, "REFNUM");
    
    if (fitId && trnType && dtPosted && trnAmt) {
      transactions.push({
        fitId,
        type: mapTransactionType(trnType),
        datePosted: parseOFXDate(dtPosted),
        amount: parseFloat(trnAmt.replace(",", ".")),
        name: name || memo || "Transação",
        memo: memo || undefined,
        checkNum: checkNum || undefined,
        refNum: refNum || undefined,
      });
    }
  }
  
  return transactions;
}

/**
 * Parser principal de arquivo OFX
 */
export function parseOFX(content: string): OFXParseResult {
  try {
    // Remove headers SGML se presentes
    const ofxStart = content.indexOf("<OFX>");
    const cleanContent = ofxStart >= 0 ? content.substring(ofxStart) : content;
    
    // Extrai informações da conta
    const bankId = extractTag(cleanContent, "BANKID") || "";
    const accountId = extractTag(cleanContent, "ACCTID") || "";
    const accountType = extractTag(cleanContent, "ACCTTYPE") || "CHECKING";
    const currency = extractTag(cleanContent, "CURDEF") || "BRL";
    
    // Extrai período do extrato
    const dtStart = extractTag(cleanContent, "DTSTART");
    const dtEnd = extractTag(cleanContent, "DTEND");
    
    // Extrai saldo
    const balAmt = extractTag(cleanContent, "BALAMT");
    const dtAsOf = extractTag(cleanContent, "DTASOF");
    
    // Extrai transações
    const transactions = extractTransactions(cleanContent);
    
    if (!accountId) {
      return {
        success: false,
        error: "Arquivo OFX inválido: conta não identificada",
      };
    }
    
    return {
      success: true,
      statement: {
        bankId,
        accountId,
        accountType,
        currency,
        startDate: parseOFXDate(dtStart),
        endDate: parseOFXDate(dtEnd),
        balanceAmount: balAmt ? parseFloat(balAmt.replace(",", ".")) : 0,
        balanceDate: parseOFXDate(dtAsOf),
        transactions,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Erro ao processar arquivo OFX: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    };
  }
}

/**
 * Converte tipo OFX para tipo de transação bancária do sistema
 */
export function ofxTypeToSystemType(ofxType: OFXTransaction["type"], amount: number): "CREDIT" | "DEBIT" | "TRANSFER_IN" | "TRANSFER_OUT" | "FEE" | "INTEREST" | "ADJUSTMENT" {
  // Se o valor é positivo, é entrada
  if (amount > 0) {
    if (ofxType === "XFER") return "TRANSFER_IN";
    if (ofxType === "INT" || ofxType === "DIV") return "INTEREST";
    return "CREDIT";
  }
  
  // Se o valor é negativo, é saída
  if (ofxType === "XFER") return "TRANSFER_OUT";
  if (ofxType === "FEE" || ofxType === "SRVCHG") return "FEE";
  return "DEBIT";
}
