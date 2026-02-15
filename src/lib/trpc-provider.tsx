"use client";

import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { toast } from "sonner";
import { trpc } from "./trpc";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:3000`;
}

function getActiveCompanyId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("frm-active-company");
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            // Only show toast if the mutation doesn't have its own onError handler
            if (!mutation.options.onError) {
              const message = error instanceof Error ? error.message : "Erro inesperado";
              toast.error(message);
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60, // 1 minuto - dados considerados frescos
            gcTime: 1000 * 60 * 5, // 5 minutos - tempo de cache
            refetchOnWindowFocus: false, // Não refetch ao focar janela
            retry: (failureCount, error) => {
              // Retry transient errors (network, 503) up to 2 times
              if (failureCount >= 2) return false;
              const message = error instanceof Error ? error.message : String(error);
              return message.includes("fetch") || message.includes("network") || message.includes("503");
            },
          },
        },
      })
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          headers() {
            const companyId = getActiveCompanyId();
            return companyId ? { "x-company-id": companyId } : {};
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
