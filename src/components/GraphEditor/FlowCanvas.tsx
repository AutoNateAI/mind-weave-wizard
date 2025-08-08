import { useCallback, useEffect } from "react";
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Edge } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import "@xyflow/react/dist/style.css";

export type RFNode = Parameters<typeof useNodesState>[0][number];
export type RFEdge = Parameters<typeof useEdgesState>[0][number];

export function FlowCanvas({ storageKey, initialNodes = [], initialEdges = [], onSave }: {
  storageKey: string;
  initialNodes?: RFNode[];
  initialEdges?: RFEdge[];
  onSave?: (data: { nodes: RFNode[]; edges: RFEdge[] }) => void;
}) {
  const saved = localStorage.getItem(storageKey);
  const parsed = saved ? JSON.parse(saved) : null;

  const [nodes, setNodes, onNodesChange] = useNodesState(parsed?.nodes ?? initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(parsed?.edges ?? initialEdges);

  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), []);

  const save = useCallback(() => {
    const data = { nodes, edges };
    localStorage.setItem(storageKey, JSON.stringify(data));
    onSave?.(data);
  }, [nodes, edges, storageKey, onSave]);

  useEffect(() => {
    // simple autosave every 3s
    const t = setInterval(save, 3000);
    return () => clearInterval(t);
  }, [save]);

  const reset = () => {
    localStorage.removeItem(storageKey);
    window.location.reload();
  };

  return (
    <div className="h-full min-h-[400px] flex flex-col rounded-md overflow-hidden border neon-border react-flow-container">
      <div className="flex items-center justify-between p-3 bg-background/50 backdrop-blur-sm border-b">
        <div className="text-sm text-muted-foreground">Build, connect, explore.</div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save} className="cyber-glow">Save</Button>
          <Button size="sm" variant="secondary" onClick={reset} className="hover-scale">Reset</Button>
        </div>
      </div>
      <div className="flex-1 react-flow-container" style={{ minHeight: "350px" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          className="cyber-flow"
        >
          <MiniMap zoomable pannable />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}
