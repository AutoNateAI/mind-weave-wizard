import { useCallback, useEffect, useState } from "react";
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Edge, Node } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lightbulb, Trophy, Target, X, Info } from "lucide-react";
import { handleDecisionNode, handleScenarioNode, handleOutcomeNode, checkGameCompletion, calculateDynamicScore } from "./GameLogic";
import "@xyflow/react/dist/style.css";

interface GameFlowCanvasProps {
  gameId: string;
  gameData: any;
  mechanics: any;
  hints: any;
  onComplete?: (score: number, analytics: any) => void;
}

interface GameNode extends Node {
  data: {
    label: string;
    nodeType?: 'scenario' | 'decision' | 'outcome' | 'information';
    revealed?: boolean;
    unlocked?: boolean;
    consequences?: string[];
    requiredNodes?: string[];
    points?: number;
  };
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
    isCompleted: false,
    revealedNodes: new Set<string>(),
    selectedPath: [],
    currentScenario: null as string | null,
    score: 0
  });
  const [showHint, setShowHint] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<{ node: GameNode; position: { x: number; y: number } } | null>(null);

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
    const gameNode = node as GameNode;
    
    // Check if node is unlocked
    const isUnlocked = gameNode.data.unlocked !== false && 
      (!gameNode.data.requiredNodes || 
       gameNode.data.requiredNodes.every(reqId => gameState.revealedNodes.has(reqId)));
    
    if (!isUnlocked) {
      toast.error("This option is not yet available. Complete previous steps first.");
      return;
    }

    trackInteraction('node_click', {
      nodeId: node.id,
      nodeType: gameNode.data.nodeType,
      position: node.position,
      timestamp: Date.now()
    });

    // Show detailed information for the node
    setSelectedNodeDetails({
      node: gameNode,
      position: { x: event.clientX, y: event.clientY }
    });

    // Handle different node types
    const nodeType = gameNode.data.nodeType || 'information';
    
    if (nodeType === 'decision') {
      handleDecisionNodeClick(gameNode);
    } else if (nodeType === 'scenario') {
      handleScenarioNodeClick(gameNode);
    } else if (nodeType === 'outcome') {
      handleOutcomeNodeClick(gameNode);
    }

    setGameState(prev => ({
      ...prev,
      interactions: prev.interactions + 1,
      decisionPath: [...prev.decisionPath, node.id],
      revealedNodes: new Set([...prev.revealedNodes, node.id])
    }));

    // Update node visual state
    setNodes(nds => nds.map(n => 
      n.id === node.id 
        ? { ...n, data: { ...n.data, revealed: true } }
        : n
    ));
  }, [gameState.revealedNodes]);

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

  // Add the handler functions
  const handleDecisionNodeClick = useCallback((node: GameNode) => {
    handleDecisionNode(node, gameState, setGameState, setNodes, toast);
  }, [gameState, setGameState, setNodes]);

  const handleScenarioNodeClick = useCallback((node: GameNode) => {
    handleScenarioNode(node, gameState, setGameState, toast);
  }, [gameState, setGameState]);

  const handleOutcomeNodeClick = useCallback((node: GameNode) => {
    handleOutcomeNode(node, gameState, setGameState, toast);
  }, [gameState, setGameState]);

  const calculateScore = () => {
    const timeSpent = (Date.now() - gameState.startTime) / 1000;
    return calculateDynamicScore(gameState, timeSpent);
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
      isCompleted: false,
      revealedNodes: new Set<string>(),
      selectedPath: [],
      currentScenario: null,
      score: 0
    });
    setShowHint(false);
    setShowInstructions(true);
    setSelectedNodeDetails(null);
  };

  // Check for game completion
  useEffect(() => {
    if (checkGameCompletion(gameState, nodes.length) && !gameState.isCompleted) {
      completeGame();
    }
  }, [gameState.revealedNodes, gameState.isCompleted, nodes.length]);

  const getGameInstructions = () => {
    const templateName = gameData?.templateName || "Interactive Game";
    
    if (templateName.includes("Critical Decision")) {
      return {
        title: "Critical Decision Path Game",
        objective: "Navigate through the decision tree to reach the optimal outcome",
        instructions: [
          "Read each scenario node carefully",
          "Click on decision nodes to explore different paths",
          "Connect related concepts by dragging between nodes",
          "Try to identify the most effective decision sequence",
          "Use hints if you get stuck on the optimal path"
        ]
      };
    } else if (templateName.includes("Problem Analysis")) {
      return {
        title: "Problem Analysis Web Game",
        objective: "Map the relationships between causes, effects, and solutions",
        instructions: [
          "Identify the central problem in the main node",
          "Connect causes to their effects by dragging between nodes",
          "Look for patterns and feedback loops in the system",
          "Build a complete web showing all relationships",
          "Find the most effective intervention points"
        ]
      };
    } else if (templateName.includes("System Mapping")) {
      return {
        title: "System Mapping Game",
        objective: "Understand how different factors interact within the system",
        instructions: [
          "Examine each system component in the nodes",
          "Create connections between related factors",
          "Look for reinforcing and balancing loops",
          "Identify leverage points for system change",
          "Map the complete system dynamics"
        ]
      };
    }
    
    return {
      title: "Graph Thinking Game",
      objective: "Explore connections and build understanding through interaction",
      instructions: [
        "Click on nodes to explore concepts",
        "Drag between nodes to create connections",
        "Look for patterns and relationships",
        "Build your understanding through exploration",
        "Use hints when you need guidance"
      ]
    };
  };

  const instructions = getGameInstructions();

  return (
    <div className="h-full flex flex-col">
      {/* Instructions Overlay */}
      {showInstructions && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-20 flex items-center justify-center p-4">
          <div className="bg-card border rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="text-center mb-6">
              <Target className="w-12 h-12 mx-auto mb-3 text-primary" />
              <h2 className="text-2xl font-bold mb-2">{instructions.title}</h2>
              <p className="text-muted-foreground">{instructions.objective}</p>
            </div>
            
            <div className="space-y-3 mb-6">
              <h3 className="font-semibold text-lg mb-3">How to Play:</h3>
              {instructions.instructions.map((instruction, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-sm">{instruction}</p>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center">
              <Button onClick={() => setShowInstructions(false)} className="cyber-glow">
                Start Playing
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Game Controls */}
      <div className="flex items-center justify-between py-3 px-4 bg-background/80 backdrop-blur-sm border-b shrink-0">
        <div className="flex items-center gap-4 text-sm">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setShowInstructions(true)}
            className="gap-1 text-xs"
          >
            📖 Instructions
          </Button>
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            <span>Interactions: {gameState.interactions}</span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            <span>Score: {gameState.score}</span>
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
      <div className="flex-1 min-h-0 overflow-hidden react-flow-container relative">
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
        {/* Node Details Modal */}
        {selectedNodeDetails && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center p-4">
            <div className="bg-card border rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Node Details</h3>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setSelectedNodeDetails(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Type:</span>
                  <p className="capitalize">{selectedNodeDetails.node.data.nodeType || 'Information'}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Content:</span>
                  <p className="text-sm">{selectedNodeDetails.node.data.label}</p>
                </div>
                
                {selectedNodeDetails.node.data.consequences && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Consequences:</span>
                    <ul className="text-sm space-y-1">
                      {selectedNodeDetails.node.data.consequences.map((consequence, idx) => (
                        <li key={idx} className="text-muted-foreground">• {consequence}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedNodeDetails.node.data.points && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Points:</span>
                    <p className="text-sm">+{selectedNodeDetails.node.data.points}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Game Completed Overlay */}
        {gameState.isCompleted && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center p-8 rounded-lg bg-card border shadow-lg">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              <h3 className="text-2xl font-bold mb-2">Game Completed!</h3>
              <p className="text-lg mb-4">Final Score: {calculateScore()}</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Time: {Math.floor((Date.now() - gameState.startTime) / 1000 / 60)} minutes</p>
                <p>Nodes explored: {gameState.revealedNodes.size}/{nodes.length}</p>
                <p>Hints used: {gameState.hintsUsed}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}