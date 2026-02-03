import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase URL and Anon Key are required for Edge Function calls");
    }
    
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

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
  private functionName = "sefaz-proxy";

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
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke(this.functionName, {
        body: request,
      });

      if (error) {
        console.error("[SefazEdgeClient] Supabase function error:", error);
        return {
          success: false,
          error: error.message || "Erro ao chamar Edge Function",
        };
      }

      return data as SefazProxyResponse;
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
