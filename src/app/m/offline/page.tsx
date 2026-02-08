"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-theme-secondary mb-4">
        <WifiOff className="w-8 h-8 text-theme-muted" />
      </div>
      <h1 className="text-xl font-bold text-theme mb-2">
        Sem conexão
      </h1>
      <p className="text-sm text-theme-muted mb-6 max-w-xs">
        Verifique sua conexão com a internet e tente novamente.
      </p>
      <Button
        onClick={() => window.location.reload()}
        leftIcon={<RefreshCw className="w-4 h-4" />}
      >
        Tentar novamente
      </Button>
    </div>
  );
}
