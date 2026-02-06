"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        <WifiOff className="w-8 h-8 text-gray-400" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Sem conexão
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
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
