import { useCallback, useEffect, useState } from "react";
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Edge, Node } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lightbulb, Trophy, Target } from "lucide-react";
import "@xyflow/react/dist/style.css";

interface GameFlowCanvasProps {
  gameId: string;
  gameData: any;
  mechanics: any;
  hints: any;
  onComplete?: (score: number, analytics: any) => void;
}

export function GameFlowCanvas({ gameId, gameData, mechanics, hints, onComplete }: GameFlowCanvasProps) {
  const { theme } = useTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState(gameData?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(gameData?.edges || []);
  const [gameState, setGameState] = useState({
    currentStep: 0,
    interactions: 0,
    hintsUsed: 0,
    startTime: Date.now(),
    decisionPath: [],
    isCompleted: false
  });
  const [showHint, setShowHint] = useState(false);

  const onConnect = useCallback((params: Connection | Edge) => {
    const newEdge = { ...params, id: `edge-${Date.now()}` };
    setEdges((eds) => addEdge(newEdge, eds));
    
    // Track interaction
    trackInteraction('edge_create', {
      source: params.source,
      target: params.target,
      timestamp: Date.now()
    });
  }, [setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    trackInteraction('node_click', {
      nodeId: node.id,
      nodeType: node.type,
      position: node.position,
      timestamp: Date.now()
    });

    setGameState(prev => ({
      ...prev,
      interactions: prev.interactions + 1,
      decisionPath: [...prev.decisionPath, node.id]
    }));
  }, []);

  const trackInteraction = async (type: string, data: any) => {
    try {
      await supabase.from('student_game_interactions').insert({
        lecture_game_id: gameId,
        interaction_type: type,
        interaction_data: data,
        user_id: (await supabase.auth.getUser()).data.user?.id
      });
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  };

  const useHint = () => {
    const hintsArray = Array.isArray(hints) ? hints : [];
    if (gameState.hintsUsed < hintsArray.length) {
      setShowHint(true);
      setGameState(prev => ({
        ...prev,
        hintsUsed: prev.hintsUsed + 1
      }));
      
      trackInteraction('hint_used', {
        hintIndex: gameState.hintsUsed,
        hintText: hintsArray[gameState.hintsUsed],
        timestamp: Date.now()
      });

      toast.info(hintsArray[gameState.hintsUsed], {
        icon: <Lightbulb className="w-4 h-4" />,
        duration: 5000
      });
    }
  };

  const completeGame = async () => {
    const timeSpent = (Date.now() - gameState.startTime) / 1000;
    const score = calculateScore();
    
    const analytics = {
      timeSpent,
      interactions: gameState.interactions,
      hintsUsed: gameState.hintsUsed,
      decisionPath: gameState.decisionPath,
      completionScore: score,
      finalSolution: { nodes, edges }
    };

    try {
      await supabase.from('game_analytics').insert({
        lecture_game_id: gameId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        completed_at: new Date().toISOString(),
        total_interactions: gameState.interactions,
        hints_used: gameState.hintsUsed,
        completion_score: score,
        time_spent_seconds: Math.floor(timeSpent),
        decision_path: JSON.stringify(gameState.decisionPath),
        final_solution: JSON.stringify({ nodes, edges })
      });

      trackInteraction('completed', analytics);
      
      setGameState(prev => ({ ...prev, isCompleted: true }));
      onComplete?.(score, analytics);
      
      toast.success(`Game completed! Score: ${score}%`, {
        icon: <Trophy className="w-4 h-4" />
      });
    } catch (error) {
      console.error('Failed to save completion:', error);
    }
  };

  const calculateScore = () => {
    // Basic scoring algorithm - can be enhanced based on game mechanics
    let score = 100;
    
    // Deduct points for excessive hints
    if (gameState.hintsUsed > 1) {
      score -= (gameState.hintsUsed - 1) * 10;
    }
    
    // Bonus for efficient completion
    const timeSpent = (Date.now() - gameState.startTime) / 1000 / 60; // minutes
    if (timeSpent < 5) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  };

  const resetGame = () => {
    setNodes(gameData?.nodes || []);
    setEdges(gameData?.edges || []);
    setGameState({
      currentStep: 0,
      interactions: 0,
      hintsUsed: 0,
      startTime: Date.now(),
      decisionPath: [],
      isCompleted: false
    });
    setShowHint(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Game Controls */}
      <div className="flex items-center justify-between py-1 px-2 bg-background/80 backdrop-blur-sm border-b shrink-0">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            <span>Interactions: {gameState.interactions}</span>
          </div>
          <div className="flex items-center gap-1">
            <Lightbulb className="w-4 h-4" />
            <span>Hints: {gameState.hintsUsed}/{Array.isArray(hints) ? hints.length : 0}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!gameState.isCompleted && Array.isArray(hints) && hints.length > 0 && gameState.hintsUsed < hints.length && (
            <Button size="sm" variant="outline" onClick={useHint} className="gap-1">
              <Lightbulb className="w-3 h-3" />
              Hint
            </Button>
          )}
          
          {!gameState.isCompleted && (
            <Button size="sm" onClick={completeGame} className="cyber-glow gap-1">
              <Trophy className="w-3 h-3" />
              Complete
            </Button>
          )}
          
          {gameState.isCompleted && (
            <Button size="sm" variant="secondary" onClick={resetGame}>
              Play Again
            </Button>
          )}
        </div>
      </div>

      {/* Game Canvas */}
      <div className="flex-1 min-h-0 rounded-md overflow-hidden border neon-border react-flow-container relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
          minZoom={0.01}
          maxZoom={50}
          className={`cyber-flow w-full h-full ${theme === 'dark' ? 'dark' : ''} ${
            gameState.isCompleted ? 'pointer-events-none opacity-75' : ''
          }`}
        >
          <MiniMap 
            zoomable 
            pannable 
            className={theme === 'dark' ? 'dark' : ''}
          />
          <Controls className={theme === 'dark' ? 'dark' : ''} />
          <Background 
            variant={"dots" as any}
            gap={20}
            size={1}
            className={theme === 'dark' ? 'dark' : ''}
          />
        </ReactFlow>
        {/* Game Completed Overlay */}
        {gameState.isCompleted && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center p-8 rounded-lg bg-card border shadow-lg">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              <h3 className="text-2xl font-bold mb-2">Game Completed!</h3>
              <p className="text-lg mb-4">Score: {calculateScore()}%</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Time: {Math.floor((Date.now() - gameState.startTime) / 1000 / 60)} minutes</p>
                <p>Interactions: {gameState.interactions}</p>
                <p>Hints used: {gameState.hintsUsed}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}