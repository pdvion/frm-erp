"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Play } from "lucide-react";

export const StartNode = memo(function StartNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-lg bg-green-500 text-white shadow-lg border-2 border-green-600 min-w-[120px]">
      <div className="flex items-center gap-2">
        <Play className="w-4 h-4" />
        <span className="font-medium text-sm">{String(data.label) || "Início"}</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-green-700 border-2 border-white"
      />
    </div>
  );
});
