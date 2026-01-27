"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { UserCheck } from "lucide-react";

export const ApprovalNode = memo(function ApprovalNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-lg bg-violet-500 text-white shadow-lg border-2 border-violet-600 min-w-[140px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-violet-700 border-2 border-white"
      />
      <div className="flex items-center gap-2">
        <UserCheck className="w-4 h-4" />
        <span className="font-medium text-sm">{String(data.label) || "Aprovação"}</span>
      </div>
      {data.code ? (
        <p className="text-xs text-violet-200 mt-1">{String(data.code)}</p>
      ) : null}
      <Handle
        type="source"
        position={Position.Bottom}
        id="approved"
        className="w-3 h-3 !bg-green-500 border-2 border-white"
        style={{ left: "30%" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="rejected"
        className="w-3 h-3 !bg-red-500 border-2 border-white"
        style={{ left: "70%" }}
      />
    </div>
  );
});
