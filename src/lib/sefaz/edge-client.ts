// Cliente para chamar a API Route de proxy SEFAZ (Vercel Serverless)
// Usa Node.js https.request com mTLS para comunicação com a SEFAZ

export interface SefazProxyRequest {
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

export interface CertificateData {
  certPem: string;
  keyPem: string;
}

export interface SefazProxyResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  xml?: string;
}

export class SefazEdgeClient {

  async consultarNFeDestinadas(
    cnpj: string,
    uf: string,
    ambiente: "homologacao" | "producao" = "homologacao",
    nsu?: string,
    certificate?: CertificateData
  ): Promise<SefazProxyResponse> {
    return this.invoke({
      action: "consultarNFeDestinadas",
      ambiente,
      cnpj,
      uf,
      nsu,
      ...certificate,
    });
  }

  async consultarPorChave(
    cnpj: string,
    uf: string,
    chave: string,
    ambiente: "homologacao" | "producao" = "homologacao",
    certificate?: CertificateData
  ): Promise<SefazProxyResponse> {
    return this.invoke({
      action: "consultarPorChave",
      ambiente,
      cnpj,
      uf,
      chave,
      ...certificate,
    });
  }

  async manifestar(
    cnpj: string,
    uf: string,
    chave: string,
    tipoEvento: string,
    ambiente: "homologacao" | "producao" = "homologacao",
    justificativa?: string,
    certificate?: CertificateData
  ): Promise<SefazProxyResponse> {
    return this.invoke({
      action: "manifestar",
      ambiente,
      cnpj,
      uf,
      chave,
      tipoEvento,
      justificativa,
      ...certificate,
    });
  }

  private async invoke(request: SefazProxyRequest): Promise<SefazProxyResponse> {
    try {
      // Usar API Route do Vercel (Node.js com mTLS nativo)
      // No servidor, usar VERCEL_URL ou fallback para localhost
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
        || "https://frm-erp.vercel.app";
      
      // Calling SEFAZ proxy API
      
      const response = await fetch(`${baseUrl}/api/sefaz-proxy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[SefazEdgeClient] API error:", errorData);
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`,
        };
      }

      return await response.json() as SefazProxyResponse;
    } catch (err) {
      console.error("[SefazEdgeClient] Error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      };
    }
  }
}

export const sefazEdgeClient = new SefazEdgeClient();
