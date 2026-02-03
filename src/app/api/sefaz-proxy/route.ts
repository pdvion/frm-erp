import { NextRequest, NextResponse } from "next/server";
import https from "https";

const SEFAZ_URLS = {
  homologacao: {
    nfeDistribuicaoDFe: "https://hom1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx",
  },
  producao: {
    nfeDistribuicaoDFe: "https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx",
  },
} as const;

interface SefazRequest {
  action: "consultarNFeDestinadas" | "consultarPorChave" | "manifestar";
  ambiente: "homologacao" | "producao";
  cnpj: string;
  uf: string;
  nsu?: string;
  chave?: string;
  certPem: string;
  keyPem: string;
}

interface SefazResponse {
  success: boolean;
  data?: {
    cStat?: string;
    xMotivo?: string;
    ultNSU?: string;
    maxNSU?: string;
    totalRegistros?: number;
    documentos?: Array<{ nsu: string; schema: string; conteudo: string }>;
  };
  error?: string;
  rawXml?: string;
}

function getUFCode(uf: string): string {
  const codigos: Record<string, string> = {
    AC: "12", AL: "27", AP: "16", AM: "13", BA: "29",
    CE: "23", DF: "53", ES: "32", GO: "52", MA: "21",
    MT: "51", MS: "50", MG: "31", PA: "15", PB: "25",
    PR: "41", PE: "26", PI: "22", RJ: "33", RN: "24",
    RS: "43", RO: "11", RR: "14", SC: "42", SP: "35",
    SE: "28", TO: "17",
  };
  return codigos[uf] || "35";
}

function buildDistDFeBody(cnpj: string, uf: string, ultNSU: string, tpAmb: string): string {
  const cUFAutor = getUFCode(uf);
  return `<distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe">
    <tpAmb>${tpAmb}</tpAmb>
    <cUFAutor>${cUFAutor}</cUFAutor>
    <CNPJ>${cnpj.replace(/\D/g, "")}</CNPJ>
    <distNSU>
      <ultNSU>${ultNSU.padStart(15, "0")}</ultNSU>
    </distNSU>
  </distDFeInt>`;
}

function buildConsChNFeBody(cnpj: string, uf: string, chave: string, tpAmb: string): string {
  const cUFAutor = getUFCode(uf);
  return `<distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe">
    <tpAmb>${tpAmb}</tpAmb>
    <cUFAutor>${cUFAutor}</cUFAutor>
    <CNPJ>${cnpj.replace(/\D/g, "")}</CNPJ>
    <consChNFe>
      <chNFe>${chave}</chNFe>
    </consChNFe>
  </distDFeInt>`;
}

function buildSoapEnvelope(action: string, body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap12:Body>
    <nfeDistDFeInteresse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
      <nfeDadosMsg>${body}</nfeDadosMsg>
    </nfeDistDFeInteresse>
  </soap12:Body>
</soap12:Envelope>`;
}

function parseDistDFeResponse(xml: string): SefazResponse["data"] {
  const cStatMatch = xml.match(/<(?:\w+:)?cStat>(\d+)<\/(?:\w+:)?cStat>/);
  const cStat = cStatMatch ? cStatMatch[1] : undefined;

  const xMotivoMatch = xml.match(/<(?:\w+:)?xMotivo>([^<]+)<\/(?:\w+:)?xMotivo>/);
  const xMotivo = xMotivoMatch ? xMotivoMatch[1] : undefined;

  const ultNSUMatch = xml.match(/<(?:\w+:)?ultNSU>(\d+)<\/(?:\w+:)?ultNSU>/);
  const ultNSU = ultNSUMatch ? ultNSUMatch[1] : "0";

  const maxNSUMatch = xml.match(/<(?:\w+:)?maxNSU>(\d+)<\/(?:\w+:)?maxNSU>/);
  const maxNSU = maxNSUMatch ? maxNSUMatch[1] : "0";

  const documentos: Array<{ nsu: string; schema: string; conteudo: string }> = [];
  const docZipRegex = /<(?:\w+:)?docZip\s+NSU="(\d+)"\s+schema="([^"]+)"[^>]*>([^<]+)<\/(?:\w+:)?docZip>/g;
  let match;
  while ((match = docZipRegex.exec(xml)) !== null) {
    documentos.push({ nsu: match[1], schema: match[2], conteudo: match[3] });
  }

  return {
    cStat,
    xMotivo,
    ultNSU,
    maxNSU,
    totalRegistros: documentos.length,
    documentos,
  };
}

async function sendSoapRequest(
  url: string,
  soapAction: string,
  envelope: string,
  certPem: string,
  keyPem: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options: https.RequestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/soap+xml; charset=utf-8",
        "SOAPAction": soapAction,
        "Content-Length": Buffer.byteLength(envelope),
      },
      cert: certPem,
      key: keyPem,
      rejectUnauthorized: true,
    };

    console.log(`[SEFAZ] Sending mTLS request to ${url}`);

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        console.log(`[SEFAZ] Response status: ${res.statusCode}`);
        console.log(`[SEFAZ] Response length: ${data.length}`);
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on("error", (error) => {
      console.error(`[SEFAZ] Request error: ${error.message}`);
      reject(error);
    });

    req.write(envelope);
    req.end();
  });
}

export async function POST(request: NextRequest) {
  console.log("[SEFAZ Proxy] Received request");
  
  try {
    const body: SefazRequest = await request.json();
    const { action, ambiente, cnpj, uf, nsu, chave, certPem, keyPem } = body;

    console.log(`[SEFAZ Proxy] Action: ${action}, Ambiente: ${ambiente}, CNPJ: ${cnpj}, UF: ${uf}`);
    console.log(`[SEFAZ Proxy] certPem length: ${certPem?.length || 0}, keyPem length: ${keyPem?.length || 0}`);

    if (!certPem || !keyPem) {
      console.error("[SEFAZ Proxy] Missing certificate");
      return NextResponse.json(
        { success: false, error: "Certificado digital não fornecido" },
        { status: 400 }
      );
    }

    const urls = SEFAZ_URLS[ambiente];
    const tpAmb = ambiente === "producao" ? "1" : "2";

    let soapEnvelope: string;
    let url: string;
    const soapAction = "http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe/nfeDistDFeInteresse";

    switch (action) {
      case "consultarNFeDestinadas":
        url = urls.nfeDistribuicaoDFe;
        soapEnvelope = buildSoapEnvelope(action, buildDistDFeBody(cnpj, uf, nsu || "0", tpAmb));
        break;

      case "consultarPorChave":
        if (!chave) {
          return NextResponse.json(
            { success: false, error: "Chave NFe é obrigatória" },
            { status: 400 }
          );
        }
        url = urls.nfeDistribuicaoDFe;
        soapEnvelope = buildSoapEnvelope(action, buildConsChNFeBody(cnpj, uf, chave, tpAmb));
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Ação desconhecida: ${action}` },
          { status: 400 }
        );
    }

    console.log(`[SEFAZ Proxy] ${action} - CNPJ: ${cnpj}, UF: ${uf}, Ambiente: ${ambiente}`);

    const xmlResponse = await sendSoapRequest(url, soapAction, soapEnvelope, certPem, keyPem);
    const parsedData = parseDistDFeResponse(xmlResponse);

    const response: SefazResponse = {
      success: true,
      data: parsedData,
      rawXml: xmlResponse.substring(0, 1000),
    };

    return NextResponse.json(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[SEFAZ Proxy] Error:", errorMessage);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
