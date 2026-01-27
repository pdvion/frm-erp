"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { StartNode } from "./nodes/StartNode";
import { EndNode } from "./nodes/EndNode";
import { ActionNode } from "./nodes/ActionNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { ApprovalNode } from "./nodes/ApprovalNode";
import { NotificationNode } from "./nodes/NotificationNode";

export interface WorkflowStep {
  id: string;
  code: string;
  name: string;
  type: "START" | "END" | "ACTION" | "CONDITION" | "APPROVAL" | "NOTIFICATION";
  config?: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface WorkflowTransition {
  id: string;
  fromStepId: string;
  toStepId: string;
  condition?: string;
  label?: string;
}

interface WorkflowEditorProps {
  steps: WorkflowStep[];
  transitions: WorkflowTransition[];
  onStepsChange: (steps: WorkflowStep[]) => void;
  onTransitionsChange: (transitions: WorkflowTransition[]) => void;
  onNodeSelect?: (node: WorkflowStep | null) => void;
  readOnly?: boolean;
}

const nodeTypes: NodeTypes = {
  start: StartNode,
  end: EndNode,
  action: ActionNode,
  condition: ConditionNode,
  approval: ApprovalNode,
  notification: NotificationNode,
};

function stepToNode(step: WorkflowStep): Node {
  return {
    id: step.id,
    type: step.type.toLowerCase(),
    position: step.position,
    data: {
      label: step.name,
      code: step.code,
      config: step.config,
    },
  };
}

function transitionToEdge(transition: WorkflowTransition): Edge {
  return {
    id: transition.id,
    source: transition.fromStepId,
    target: transition.toStepId,
    label: transition.label,
    animated: true,
    style: { stroke: "#6366f1" },
  };
}

export function WorkflowEditor({
  steps,
  transitions,
  onStepsChange,
  onTransitionsChange,
  onNodeSelect,
  readOnly = false,
}: WorkflowEditorProps) {
  const initialNodes = useMemo(() => steps.map(stepToNode), [steps]);
  const initialEdges = useMemo(() => transitions.map(transitionToEdge), [transitions]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (readOnly) return;
      
      const newEdge: Edge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}`,
        source: connection.source!,
        target: connection.target!,
        animated: true,
        style: { stroke: "#6366f1" },
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
      
      const newTransition: WorkflowTransition = {
        id: newEdge.id,
        fromStepId: connection.source!,
        toStepId: connection.target!,
      };
      
      onTransitionsChange([...transitions, newTransition]);
    },
    [readOnly, setEdges, transitions, onTransitionsChange]
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (readOnly) return;
      
      const updatedSteps = steps.map((step) =>
        step.id === node.id
          ? { ...step, position: node.position }
          : step
      );
      onStepsChange(updatedSteps);
    },
    [readOnly, steps, onStepsChange]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const step = steps.find((s) => s.id === node.id);
      onNodeSelect?.(step || null);
    },
    [steps, onNodeSelect]
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  return (
    <div className="w-full h-[600px] bg-theme-secondary rounded-lg border border-theme overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
      >
        <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.type) {
              case "start": return "#22c55e";
              case "end": return "#ef4444";
              case "action": return "#3b82f6";
              case "condition": return "#f59e0b";
              case "approval": return "#8b5cf6";
              case "notification": return "#06b6d4";
              default: return "#6b7280";
            }
          }}
        />
        {!readOnly && (
          <Panel position="top-left" className="bg-theme-card p-2 rounded-lg border border-theme shadow-lg">
            <p className="text-xs text-theme-muted">
              Arraste os nós para posicionar • Conecte arrastando entre os pontos
            </p>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
