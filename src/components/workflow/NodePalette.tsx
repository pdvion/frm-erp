"use client";

import { Play, Square, Zap, GitBranch, UserCheck, Bell } from "lucide-react";

interface NodePaletteProps {
  onAddNode: (type: string) => void;
}

const nodeTypes = [
  { type: "START", label: "Início", icon: Play, color: "bg-green-500", description: "Ponto de entrada do workflow" },
  { type: "ACTION", label: "Ação", icon: Zap, color: "bg-blue-500", description: "Executa uma tarefa" },
  { type: "CONDITION", label: "Condição", icon: GitBranch, color: "bg-amber-500", description: "Bifurcação baseada em regras" },
  { type: "APPROVAL", label: "Aprovação", icon: UserCheck, color: "bg-violet-500", description: "Requer aprovação de usuário" },
  { type: "NOTIFICATION", label: "Notificação", icon: Bell, color: "bg-cyan-500", description: "Envia alerta/notificação" },
  { type: "END", label: "Fim", icon: Square, color: "bg-red-500", description: "Ponto de saída do workflow" },
];

export function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <div className="bg-theme-card border border-theme rounded-lg p-4">
      <h3 className="text-sm font-semibold text-theme mb-3">Componentes</h3>
      <div className="space-y-2">
        {nodeTypes.map((node) => {
          const Icon = node.icon;
          return (
            <button
              key={node.type}
              onClick={() => onAddNode(node.type)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-theme-secondary transition-colors text-left"
            >
              <div className={`p-2 rounded-lg ${node.color} text-white`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-theme">{node.label}</p>
                <p className="text-xs text-theme-muted">{node.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
