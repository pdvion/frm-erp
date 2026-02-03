import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SEFAZ_URLS = {
  homologacao: {
    nfeDistribuicaoDFe: "https://hom1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx",
    nfeRecepcaoEvento: "https://hom1.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx",
  },
  producao: {
    nfeDistribuicaoDFe: "https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx",
    nfeRecepcaoEvento: "https://www1.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx",
  },
} as const;

interface SefazRequest {
  action: "consultarNFeDestinadas" | "consultarPorChave" | "manifestar";
  ambiente: "homologacao" | "producao";
  cnpj: string;
  uf: string;
  nsu?: string;
  chave?: string;
  tipoEvento?: string;
  justificativa?: string;
  certPem?: string;
  keyPem?: string;
}

interface SefazResponse {
  success: boolean;
  data?: {
    cStat?: string;
    xMotivo?: string;
    ultNSU?: string;
    maxNSU?: string;
    totalRegistros?: number;
    documentos?: Array<{
      nsu: string;
      schema: string;
      conteudo: string;
    }>;
  };
  error?: string;
  xml?: string;
}

function parseDistDFeResponse(xml: string): SefazResponse["data"] {
  console.log(`[SEFAZ Parser] Parsing XML of length: ${xml.length}`);
  
  // Extrair cStat (pode ter namespace)
  const cStatMatch = xml.match(/<(?:\w+:)?cStat>(\d+)<\/(?:\w+:)?cStat>/);
  const cStat = cStatMatch ? cStatMatch[1] : undefined;
  console.log(`[SEFAZ Parser] cStat: ${cStat}`);

  // Extrair xMotivo (pode ter namespace)
  const xMotivoMatch = xml.match(/<(?:\w+:)?xMotivo>([^<]+)<\/(?:\w+:)?xMotivo>/);
  const xMotivo = xMotivoMatch ? xMotivoMatch[1] : undefined;
  console.log(`[SEFAZ Parser] xMotivo: ${xMotivo}`);

  // Extrair ultNSU (pode ter namespace)
  const ultNSUMatch = xml.match(/<(?:\w+:)?ultNSU>(\d+)<\/(?:\w+:)?ultNSU>/);
  const ultNSU = ultNSUMatch ? ultNSUMatch[1] : "0";
  console.log(`[SEFAZ Parser] ultNSU: ${ultNSU}`);

  // Extrair maxNSU (pode ter namespace)
  const maxNSUMatch = xml.match(/<(?:\w+:)?maxNSU>(\d+)<\/(?:\w+:)?maxNSU>/);
  const maxNSU = maxNSUMatch ? maxNSUMatch[1] : "0";
  console.log(`[SEFAZ Parser] maxNSU: ${maxNSU}`);

  // Extrair documentos (docZip) - formato pode variar
  const documentos: Array<{ nsu: string; schema: string; conteudo: string }> = [];
  
  // Tentar múltiplos padrões de regex para docZip
  const patterns = [
    /<(?:\w+:)?docZip\s+NSU="(\d+)"\s+schema="([^"]+)"[^>]*>([^<]+)<\/(?:\w+:)?docZip>/g,
    /<docZip\s+NSU="(\d+)"\s+schema="([^"]+)"[^>]*>([^<]+)<\/docZip>/gi,
    /<loteDistDFeInt>[\s\S]*?<docZip\s+NSU="(\d+)"\s+schema="([^"]+)"[^>]*>([\s\S]*?)<\/docZip>/g,
  ];
  
  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(xml)) !== null) {
      const doc = { nsu: match[1], schema: match[2], conteudo: match[3] };
      // Evitar duplicatas
      if (!documentos.find(d => d.nsu === doc.nsu)) {
        documentos.push(doc);
      }
    }
  }
  
  console.log(`[SEFAZ Parser] Documentos encontrados: ${documentos.length}`);

  return {
    cStat,
    xMotivo,
    ultNSU,
    maxNSU,
    totalRegistros: documentos.length,
    documentos,
  };
}

function buildSoapEnvelope(action: string, body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap12:Body>
    ${body}
  </soap12:Body>
</soap12:Envelope>`;
}

function buildDistDFeBody(cnpj: string, uf: string, nsu: string, ambiente: "homologacao" | "producao"): string {
  const cUFAutor = getCodigoUF(uf);
  const tpAmb = ambiente === "producao" ? "1" : "2";
  return `<nfeDistDFeInteresse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
    <nfeDadosMsg>
      <distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
        <tpAmb>${tpAmb}</tpAmb>
        <cUFAutor>${cUFAutor}</cUFAutor>
        <CNPJ>${cnpj}</CNPJ>
        <distNSU>
          <ultNSU>${nsu.padStart(15, "0")}</ultNSU>
        </distNSU>
      </distDFeInt>
    </nfeDadosMsg>
  </nfeDistDFeInteresse>`;
}

function buildConsChNFeBody(cnpj: string, uf: string, chave: string, ambiente: "homologacao" | "producao"): string {
  const cUFAutor = getCodigoUF(uf);
  const tpAmb = ambiente === "producao" ? "1" : "2";
  return `<nfeDistDFeInteresse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
    <nfeDadosMsg>
      <distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
        <tpAmb>${tpAmb}</tpAmb>
        <cUFAutor>${cUFAutor}</cUFAutor>
        <CNPJ>${cnpj}</CNPJ>
        <consChNFe>
          <chNFe>${chave}</chNFe>
        </consChNFe>
      </distDFeInt>
    </nfeDadosMsg>
  </nfeDistDFeInteresse>`;
}

function getCodigoUF(uf: string): string {
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

async function sendSoapRequest(
  url: string,
  soapAction: string,
  envelope: string,
  certPem: string,
  keyPem: string
): Promise<string> {
  const urlObj = new URL(url);
  
  console.log(`[SEFAZ] Connecting to ${urlObj.hostname}:443`);
  
  const conn = await Deno.connectTls({
    hostname: urlObj.hostname,
    port: 443,
    certChain: certPem,
    privateKey: keyPem,
  });

  console.log(`[SEFAZ] TLS connection established`);

  try {
    const request = [
      `POST ${urlObj.pathname} HTTP/1.1`,
      `Host: ${urlObj.hostname}`,
      `Content-Type: application/soap+xml; charset=utf-8; action="${soapAction}"`,
      `Content-Length: ${new TextEncoder().encode(envelope).length}`,
      `Connection: close`,
      ``,
      envelope,
    ].join("\r\n");

    const encoder = new TextEncoder();
    await conn.write(encoder.encode(request));
    console.log(`[SEFAZ] Request sent, waiting for response...`);

    const decoder = new TextDecoder();
    const chunks: Uint8Array[] = [];
    const buffer = new Uint8Array(131072); // 128KB buffer
    
    while (true) {
      const bytesRead = await conn.read(buffer);
      if (bytesRead === null) break;
      chunks.push(buffer.slice(0, bytesRead));
    }

    // Concatenar todos os chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const fullResponse = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      fullResponse.set(chunk, offset);
      offset += chunk.length;
    }

    const response = decoder.decode(fullResponse);
    console.log(`[SEFAZ] Response received, total bytes: ${totalLength}`);

    const bodyStart = response.indexOf("\r\n\r\n");
    if (bodyStart === -1) {
      console.error(`[SEFAZ] Invalid HTTP response - no body separator found`);
      console.error(`[SEFAZ] Response preview: ${response.substring(0, 200)}`);
      throw new Error("Invalid HTTP response");
    }
    
    let body = response.substring(bodyStart + 4);
    
    // Handle chunked transfer encoding
    if (response.toLowerCase().includes("transfer-encoding: chunked")) {
      console.log(`[SEFAZ] Decoding chunked response`);
      body = decodeChunked(body);
    }
    
    return body;
  } finally {
    conn.close();
  }
}

function decodeChunked(body: string): string {
  let result = "";
  let remaining = body;
  
  while (remaining.length > 0) {
    const lineEnd = remaining.indexOf("\r\n");
    if (lineEnd === -1) break;
    
    const chunkSizeHex = remaining.substring(0, lineEnd).trim();
    const chunkSize = parseInt(chunkSizeHex, 16);
    
    if (isNaN(chunkSize) || chunkSize === 0) break;
    
    const chunkStart = lineEnd + 2;
    const chunkEnd = chunkStart + chunkSize;
    
    if (chunkEnd > remaining.length) break;
    
    result += remaining.substring(chunkStart, chunkEnd);
    remaining = remaining.substring(chunkEnd + 2); // Skip \r\n after chunk
  }
  
  return result || body; // Fallback to original if decoding fails
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body: SefazRequest = await req.json();
    const { action, ambiente, cnpj, uf, nsu, chave } = body;

    const certPem = body.certPem || Deno.env.get("SEFAZ_CERT_PEM");
    const keyPem = body.keyPem || Deno.env.get("SEFAZ_KEY_PEM");

    if (!certPem || !keyPem) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Certificado digital não fornecido. Envie certPem e keyPem no request ou configure no Supabase Vault." 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const urls = SEFAZ_URLS[ambiente];
    let soapEnvelope: string;
    let url: string;
    let soapAction: string;

    switch (action) {
      case "consultarNFeDestinadas":
        url = urls.nfeDistribuicaoDFe;
        soapAction = "http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe/nfeDistDFeInteresse";
        soapEnvelope = buildSoapEnvelope(action, buildDistDFeBody(cnpj, uf, nsu || "0", ambiente));
        break;

      case "consultarPorChave":
        if (!chave) {
          return new Response(
            JSON.stringify({ success: false, error: "Chave NFe é obrigatória" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        url = urls.nfeDistribuicaoDFe;
        soapAction = "http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe/nfeDistDFeInteresse";
        soapEnvelope = buildSoapEnvelope(action, buildConsChNFeBody(cnpj, uf, chave, ambiente));
        break;

      case "manifestar":
        return new Response(
          JSON.stringify({ success: false, error: "Manifestação ainda não implementada" }),
          { status: 501, headers: { "Content-Type": "application/json" } }
        );

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    console.log(`[SEFAZ Proxy] ${action} - CNPJ: ${cnpj}, UF: ${uf}, Ambiente: ${ambiente}, NSU: ${nsu || "0"}`);
    console.log(`[SEFAZ Proxy] URL: ${url}`);
    console.log(`[SEFAZ Proxy] Cert length: ${certPem?.length || 0}, Key length: ${keyPem?.length || 0}`);

    const xmlResponse = await sendSoapRequest(url, soapAction, soapEnvelope, certPem, keyPem);

    // Log primeiros 500 chars da resposta para debug
    console.log(`[SEFAZ Proxy] XML Response (first 500 chars): ${xmlResponse.substring(0, 500)}`);

    // Parsear resposta XML
    const parsedData = parseDistDFeResponse(xmlResponse);
    
    console.log(`[SEFAZ Proxy] Parsed - cStat: ${parsedData?.cStat}, xMotivo: ${parsedData?.xMotivo}, ultNSU: ${parsedData?.ultNSU}, maxNSU: ${parsedData?.maxNSU}, totalRegistros: ${parsedData?.totalRegistros}`);

    const response: SefazResponse = {
      success: true,
      data: parsedData,
      xml: xmlResponse,
    };

    return new Response(JSON.stringify(response), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (error) {
    console.error("[SEFAZ Proxy] Error:", error);
    
    const response: SefazResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
