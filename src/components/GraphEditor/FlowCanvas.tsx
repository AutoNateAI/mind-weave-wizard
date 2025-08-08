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
    <div className="glass rounded-md p-2">
      <div className="flex items-center justify-between pb-2">
        <div className="text-sm text-muted-foreground">Build, connect, explore.</div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save}>Save</Button>
          <Button size="sm" variant="secondary" onClick={reset}>Reset</Button>
        </div>
      </div>
      <div style={{ height: 420 }} className="rounded-md overflow-hidden border">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <MiniMap zoomable pannable />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}
