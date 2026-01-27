"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Square } from "lucide-react";

export const EndNode = memo(function EndNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-lg bg-red-500 text-white shadow-lg border-2 border-red-600 min-w-[120px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-red-700 border-2 border-white"
      />
      <div className="flex items-center gap-2">
        <Square className="w-4 h-4" />
        <span className="font-medium text-sm">{String(data.label) || "Fim"}</span>
      </div>
    </div>
  );
});
