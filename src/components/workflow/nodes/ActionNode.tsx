"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Zap } from "lucide-react";

export const ActionNode = memo(function ActionNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-lg bg-blue-500 text-white shadow-lg border-2 border-blue-600 min-w-[140px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-700 border-2 border-white"
      />
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4" />
        <span className="font-medium text-sm">{String(data.label) || "Ação"}</span>
      </div>
      {data.code ? (
        <p className="text-xs text-blue-200 mt-1">{String(data.code)}</p>
      ) : null}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-700 border-2 border-white"
      />
    </div>
  );
});
