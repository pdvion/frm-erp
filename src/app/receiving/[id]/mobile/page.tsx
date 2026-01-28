"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import {
  ChevronLeft,
  Package,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Save,
  Plus,
  Minus,
  Camera,
  Barcode,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: "Pendente", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  IN_PROGRESS: { label: "Em Conferência", color: "text-blue-700", bgColor: "bg-blue-100" },
  COMPLETED: { label: "Concluído", color: "text-green-700", bgColor: "bg-green-100" },
  PARTIAL: { label: "Parcial", color: "text-orange-700", bgColor: "bg-orange-100" },
  REJECTED: { label: "Rejeitado", color: "text-red-700", bgColor: "bg-red-100" },
};

interface ItemConference {
  itemId: string;
  receivedQuantity: number;
  notes: string;
  hasIssue: boolean;
}

export default function MobileReceivingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [itemConferences, setItemConferences] = useState<Record<string, ItemConference>>({});
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const { data: receiving, isLoading, refetch } = trpc.receiving.getById.useQuery({ id });

  const startConferenceMutation = trpc.receiving.startConference.useMutation({
    onSuccess: () => {
      refetch();
      // Inicializar conferência com quantidades da NFe
      if (receiving?.items) {
        const initial: Record<string, ItemConference> = {};
        receiving.items.forEach((item) => {
          initial[item.id] = {
            itemId: item.id,
            receivedQuantity: item.nfeQuantity,
            notes: "",
            hasIssue: false,
          };
        });
        setItemConferences(initial);
      }
    },
  });

  const conferItemMutation = trpc.receiving.conferItem.useMutation({
    onSuccess: () => refetch(),
  });

  const completeReceivingMutation = trpc.receiving.complete.useMutation({
    onSuccess: () => {
      router.push("/receiving");
    },
  });

  const handleStartConference = () => {
    startConferenceMutation.mutate({ id });
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    setItemConferences((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        receivedQuantity: Math.max(0, (prev[itemId]?.receivedQuantity || 0) + delta),
        hasIssue: Math.max(0, (prev[itemId]?.receivedQuantity || 0) + delta) !== 
          (receiving?.items.find(i => i.id === itemId)?.nfeQuantity || 0),
      },
    }));
  };

  const handleSetQuantity = (itemId: string, quantity: number) => {
    const nfeQty = receiving?.items.find(i => i.id === itemId)?.nfeQuantity || 0;
    setItemConferences((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        receivedQuantity: Math.max(0, quantity),
        hasIssue: quantity !== nfeQty,
      },
    }));
  };

  const handleConfirmItem = (itemId: string) => {
    const conf = itemConferences[itemId];
    if (conf) {
      conferItemMutation.mutate({
        receivingId: id,
        itemId: conf.itemId,
        receivedQuantity: conf.receivedQuantity,
        notes: conf.notes,
      });
    }
    setExpandedItem(null);
  };

  const handleCompleteConference = () => {
    // Conferir todos os itens pendentes
    Object.values(itemConferences).forEach((conf) => {
      conferItemMutation.mutate({
        receivingId: id,
        itemId: conf.itemId,
        receivedQuantity: conf.receivedQuantity,
        notes: conf.notes,
      });
    });

    completeReceivingMutation.mutate({ id });
  };

  const handleBarcodeScanned = (barcode: string) => {
    // Encontrar item pelo código de barras
    const item = receiving?.items.find(
      (i) => String(i.material?.code) === barcode
    );
    if (item) {
      setExpandedItem(item.id);
      // Vibrar para feedback tátil
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    }
  };

  const handleTakePhoto = () => {
    setShowCamera(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-theme-secondary">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!receiving) {
    return (
      <div className="space-y-6 flex items-center justify-center p-4">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-theme-muted mb-4" />
          <p className="text-theme-muted text-lg">Recebimento não encontrado</p>
          <Link 
            href="/receiving" 
            className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-xl"
          >
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  const config = statusConfig[receiving.status] || statusConfig.PENDING;
  const isConferencing = receiving.status === "IN_PROGRESS";
  const allItemsConferred = receiving.items.every(
    (item) => itemConferences[item.id]?.receivedQuantity !== undefined
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Header Mobile */}
      <header className="bg-theme-card sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/receiving" className="p-2 -ml-2 text-theme-secondary">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="text-center flex-1">
            <h1 className="text-lg font-bold text-theme">
              Entrada #{receiving.code}
            </h1>
            <span className={`text-sm ${config.color}`}>
              {config.label}
            </span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Info resumida */}
        <div className="px-4 pb-3 border-b border-theme">
          <div className="flex items-center justify-between text-sm">
            <span className="text-theme-muted">Fornecedor</span>
            <span className="font-medium text-theme truncate max-w-[200px]">
              {receiving.supplier?.companyName || receiving.supplier?.tradeName || "-"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-theme-muted">NFe</span>
            <span className="font-medium text-theme">
              {receiving.nfeNumber || "-"} / {receiving.nfeSeries || "-"}
            </span>
          </div>
        </div>

        {/* Barra de busca por código de barras */}
        {isConferencing && (
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <Barcode className="w-5 h-5 text-blue-600" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Escanear código de barras..."
                className="flex-1 px-3 py-2 bg-theme-card border border-blue-200 rounded-lg text-lg focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleBarcodeScanned((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Lista de Itens */}
      <main className="px-4 py-4 space-y-3">
        {receiving.items.map((item) => {
          const conf = itemConferences[item.id];
          const isExpanded = expandedItem === item.id;
          const hasIssue = conf?.hasIssue || false;
          const isItemConferred = item.receivedQuantity !== null;

          return (
            <div
              key={item.id}
              className={`bg-theme-card rounded-xl shadow-sm overflow-hidden transition-all ${
                isExpanded ? "ring-2 ring-blue-500" : ""
              } ${hasIssue ? "border-l-4 border-orange-500" : ""}`}
            >
              {/* Header do Item */}
              <button
                onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isItemConferred && (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      )}
                      {hasIssue && !isItemConferred && (
                        <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      )}
                      <span className="font-medium text-theme truncate">
                        {item.material?.description || "Material não identificado"}
                      </span>
                    </div>
                    <p className="text-sm text-theme-muted mt-1">
                      Código: {item.material?.code || "-"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-2">
                    <div className="text-right">
                      <p className="text-lg font-bold text-theme">
                        {conf?.receivedQuantity ?? item.nfeQuantity}
                      </p>
                      <p className="text-xs text-theme-muted">
                        de {item.nfeQuantity} {item.material?.unit || "UN"}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-theme-muted" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-theme-muted" />
                    )}
                  </div>
                </div>
              </button>

              {/* Área Expandida - Conferência */}
              {isExpanded && isConferencing && (
                <div className="px-4 pb-4 border-t border-theme">
                  {/* Controle de Quantidade */}
                  <div className="flex items-center justify-center gap-4 py-4">
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      className="w-14 h-14 flex items-center justify-center bg-red-100 text-red-600 rounded-full active:bg-red-200"
                    >
                      <Minus className="w-6 h-6" />
                    </button>
                    <input
                      type="number"
                      value={conf?.receivedQuantity ?? item.nfeQuantity}
                      onChange={(e) => handleSetQuantity(item.id, parseInt(e.target.value) || 0)}
                      className="w-24 h-14 text-center text-2xl font-bold border-2 border-theme rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="w-14 h-14 flex items-center justify-center bg-green-100 text-green-600 rounded-full active:bg-green-200"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Valor unitário e total */}
                  <div className="flex justify-between text-sm text-theme-secondary mb-4">
                    <span>Valor unitário: {formatCurrency(item.unitPrice)}</span>
                    <span className="font-medium">
                      Total: {formatCurrency((conf?.receivedQuantity ?? item.nfeQuantity) * item.unitPrice)}
                    </span>
                  </div>

                  {/* Observações */}
                  <textarea
                    placeholder="Observações (divergências, avarias...)"
                    value={conf?.notes || ""}
                    onChange={(e) =>
                      setItemConferences((prev) => ({
                        ...prev,
                        [item.id]: { ...prev[item.id], notes: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 border border-theme-input rounded-xl text-base resize-none"
                    rows={2}
                  />

                  {/* Botões de ação */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleTakePhoto()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-theme-tertiary text-theme-secondary rounded-xl active:bg-theme-tertiary"
                    >
                      <Camera className="w-5 h-5" />
                      Foto
                    </button>
                    <button
                      onClick={() => handleConfirmItem(item.id)}
                      disabled={conferItemMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl active:bg-blue-700 disabled:opacity-50"
                    >
                      {conferItemMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                      Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* Footer Fixo - Ações */}
      <footer className="fixed bottom-0 left-0 right-0 bg-theme-card border-t border-theme p-4 safe-area-inset-bottom">
        {receiving.status === "PENDING" && (
          <button
            onClick={handleStartConference}
            disabled={startConferenceMutation.isPending}
            className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl active:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {startConferenceMutation.isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Package className="w-6 h-6" />
            )}
            Iniciar Conferência
          </button>
        )}

        {isConferencing && (
          <div className="flex gap-3">
            <Link
              href={`/receiving/${id}`}
              className="flex-1 py-4 bg-theme-tertiary text-theme-secondary text-lg font-semibold rounded-xl text-center active:bg-theme-tertiary"
            >
              Versão Desktop
            </Link>
            <button
              onClick={handleCompleteConference}
              disabled={!allItemsConferred || completeReceivingMutation.isPending}
              className="flex-1 py-4 bg-green-600 text-white text-lg font-semibold rounded-xl active:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {completeReceivingMutation.isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Save className="w-6 h-6" />
              )}
              Finalizar
            </button>
          </div>
        )}

        {receiving.status === "COMPLETED" && (
          <div className="flex items-center justify-center gap-2 py-4 bg-green-100 text-green-700 rounded-xl">
            <CheckCircle className="w-6 h-6" />
            <span className="text-lg font-semibold">Conferência Concluída</span>
          </div>
        )}
      </footer>

      {/* Modal de Câmera (placeholder) */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-theme-card rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tirar Foto</h3>
              <button
                onClick={() => setShowCamera(false)}
                className="p-2 text-theme-muted"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="aspect-square bg-theme-tertiary rounded-xl flex items-center justify-center mb-4">
              <Camera className="w-16 h-16 text-theme-muted" />
            </div>
            <p className="text-sm text-theme-muted text-center mb-4">
              Funcionalidade de câmera será implementada com integração nativa.
            </p>
            <button
              onClick={() => setShowCamera(false)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
