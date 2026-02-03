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
}

interface SefazResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  xml?: string;
}

function buildSoapEnvelope(action: string, body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap12:Body>
    ${body}
  </soap12:Body>
</soap12:Envelope>`;
}

function buildDistDFeBody(cnpj: string, uf: string, nsu: string): string {
  const cUFAutor = getCodigoUF(uf);
  return `<nfeDistDFeInteresse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
    <nfeDadosMsg>
      <distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
        <tpAmb>2</tpAmb>
        <cUFAutor>${cUFAutor}</cUFAutor>
        <CNPJ>${cnpj}</CNPJ>
        <distNSU>
          <ultNSU>${nsu.padStart(15, "0")}</ultNSU>
        </distNSU>
      </distDFeInt>
    </nfeDadosMsg>
  </nfeDistDFeInteresse>`;
}

function buildConsChNFeBody(cnpj: string, uf: string, chave: string): string {
  const cUFAutor = getCodigoUF(uf);
  return `<nfeDistDFeInteresse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
    <nfeDadosMsg>
      <distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
        <tpAmb>2</tpAmb>
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
  
  const conn = await Deno.connectTls({
    hostname: urlObj.hostname,
    port: 443,
    certChain: certPem,
    privateKey: keyPem,
  });

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

    const decoder = new TextDecoder();
    const buffer = new Uint8Array(65536);
    let response = "";
    
    while (true) {
      const bytesRead = await conn.read(buffer);
      if (bytesRead === null) break;
      response += decoder.decode(buffer.subarray(0, bytesRead));
    }

    const bodyStart = response.indexOf("\r\n\r\n");
    if (bodyStart === -1) {
      throw new Error("Invalid HTTP response");
    }
    
    return response.substring(bodyStart + 4);
  } finally {
    conn.close();
  }
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
    const certPem = Deno.env.get("SEFAZ_CERT_PEM");
    const keyPem = Deno.env.get("SEFAZ_KEY_PEM");

    if (!certPem || !keyPem) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Certificado digital não configurado. Configure SEFAZ_CERT_PEM e SEFAZ_KEY_PEM no Supabase Vault." 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body: SefazRequest = await req.json();
    const { action, ambiente, cnpj, uf, nsu, chave } = body;

    const urls = SEFAZ_URLS[ambiente];
    let soapEnvelope: string;
    let url: string;
    let soapAction: string;

    switch (action) {
      case "consultarNFeDestinadas":
        url = urls.nfeDistribuicaoDFe;
        soapAction = "http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe/nfeDistDFeInteresse";
        soapEnvelope = buildSoapEnvelope(action, buildDistDFeBody(cnpj, uf, nsu || "0"));
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
        soapEnvelope = buildSoapEnvelope(action, buildConsChNFeBody(cnpj, uf, chave));
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

    console.log(`[SEFAZ Proxy] ${action} - CNPJ: ${cnpj}, UF: ${uf}, Ambiente: ${ambiente}`);

    const xmlResponse = await sendSoapRequest(url, soapAction, soapEnvelope, certPem, keyPem);

    const response: SefazResponse = {
      success: true,
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
