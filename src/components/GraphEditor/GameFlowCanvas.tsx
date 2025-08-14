import { useCallback, useEffect, useState } from "react";
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Edge, Node } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lightbulb, Trophy, Target, X, Info, CheckCircle, XCircle } from "lucide-react";
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
    interactions: 0,
    hintsUsed: 0,
    startTime: Date.now(),
    isCompleted: false,
    revealedNodes: new Set<string>(),
    score: 0,
    connections: [] as Array<{source: string, target: string}>,
    correctConnections: [] as Array<{source: string, target: string}>,
    incorrectConnections: [] as Array<{source: string, target: string}>
  });
  const [showInstructions, setShowInstructions] = useState(true);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<{ node: GameNode; position: { x: number; y: number } } | null>(null);

  // Get instructor solution and rules from gameData
  const instructorSolution = gameData?.instructorSolution || [];
  const connectionRules = gameData?.connectionRules || [];
  const wrongConnections = gameData?.wrongConnections || [];

  const evaluateConnection = useCallback((source: string, target: string) => {
    // Check if this connection is in the instructor solution
    const isCorrect = instructorSolution.some((solution: any) => 
      solution.source === source && solution.target === target
    );

    if (isCorrect) {
      setGameState(prev => ({
        ...prev,
        score: prev.score + 20,
        correctConnections: [...prev.correctConnections, { source, target }]
      }));
      
      toast.success("Excellent connection!", {
        description: "This relationship demonstrates good systems thinking",
        icon: <CheckCircle className="w-4 h-4" />
      });
    } else {
      // Check if it's a known wrong connection
      const wrongConnection = wrongConnections.find((wrong: any) => 
        wrong.source === source && wrong.target === target
      );
      
      if (wrongConnection) {
        toast.error("Incorrect connection", {
          description: wrongConnection.why_wrong || "This connection doesn't follow the logical pattern",
          icon: <XCircle className="w-4 h-4" />
        });
        
        setGameState(prev => ({
          ...prev,
          score: Math.max(0, prev.score - 5),
          incorrectConnections: [...prev.incorrectConnections, { source, target }]
        }));
      } else {
        // Neutral connection - not explicitly wrong but not in solution
        toast.info("Connection noted", {
          description: "Consider if this relationship is essential to the solution"
        });
      }
    }
  }, [instructorSolution, wrongConnections]);

  const onConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target) return;
    
    const newEdge = { 
      ...params, 
      type: 'smoothstep' as const, 
      id: `${params.source}-${params.target}`,
      style: { stroke: '#8b5cf6', strokeWidth: 2 }
    } as Edge;
    setEdges((eds) => addEdge(newEdge, eds));
    
    // Track the connection
    trackInteraction('connection_made', { 
      source: params.source, 
      target: params.target 
    });

    // Update game state with new connection
    setGameState(prev => ({
      ...prev,
      connections: [...prev.connections, { source: params.source!, target: params.target! }],
      interactions: prev.interactions + 1
    }));

    // Evaluate connection correctness
    evaluateConnection(params.source!, params.target!);
  }, [evaluateConnection]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const gameNode = node as GameNode;
    
    // In connection-based gameplay, clicking just reveals node info
    setSelectedNodeDetails({
      node: gameNode,
      position: { x: event.clientX, y: event.clientY }
    });
    
    // Track the interaction
    trackInteraction('node_inspected', { nodeId: node.id, nodeType: gameNode.data.nodeType });

    // Reveal node information
    setNodes(nds => nds.map(n => {
      if (n.id === node.id) {
        return { ...n, data: { ...n.data, revealed: true } };
      }
      return n;
    }));

    setGameState(prev => ({
      ...prev,
      revealedNodes: new Set([...prev.revealedNodes, node.id])
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
        duration: 8000
      });
    }
  };

  const calculateScore = () => {
    const timeSpent = (Date.now() - gameState.startTime) / 1000;
    let score = gameState.score;
    
    // Time bonus (under 5 minutes)
    if (timeSpent < 300) {
      score += 25;
    }
    
    // Efficiency bonus (fewer hints used)
    if (gameState.hintsUsed === 0) {
      score += 20;
    } else if (gameState.hintsUsed <= 1) {
      score += 10;
    }
    
    // Connection accuracy bonus
    const totalRequired = instructorSolution.length;
    const correctMade = gameState.correctConnections.length;
    const accuracyBonus = Math.floor((correctMade / totalRequired) * 30);
    score += accuracyBonus;
    
    return Math.min(100, Math.max(0, score));
  };

  const checkGameCompletion = () => {
    // Game is complete when all required connections are made
    const requiredConnections = instructorSolution?.length || 0;
    const correctConnections = gameState.correctConnections.length;
    
    // Don't complete if there are no required connections or if no connections have been made
    if (requiredConnections === 0 || correctConnections === 0) {
      return false;
    }
    
    return correctConnections >= requiredConnections;
  };

  const completeGame = async () => {
    const timeSpent = (Date.now() - gameState.startTime) / 1000;
    const score = calculateScore();
    
    const analytics = {
      timeSpent,
      interactions: gameState.interactions,
      hintsUsed: gameState.hintsUsed,
      connectionsAttempted: gameState.connections.length,
      correctConnections: gameState.correctConnections.length,
      incorrectConnections: gameState.incorrectConnections.length,
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
        decision_path: JSON.stringify(gameState.connections),
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

  const resetGame = () => {
    setNodes(gameData?.nodes || []);
    setEdges(gameData?.edges || []);
    setGameState({
      interactions: 0,
      hintsUsed: 0,
      startTime: Date.now(),
      isCompleted: false,
      revealedNodes: new Set<string>(),
      score: 0,
      connections: [],
      correctConnections: [],
      incorrectConnections: []
    });
    setShowInstructions(true);
    setSelectedNodeDetails(null);
  };

  // Check for game completion
  useEffect(() => {
    if (checkGameCompletion() && !gameState.isCompleted) {
      completeGame();
    }
  }, [gameState.correctConnections, gameState.isCompleted]);

  const getGameInstructions = () => {
    const templateName = gameData?.templateName || "Interactive Game";
    
    if (templateName.includes("Critical Decision")) {
      return {
        title: "Critical Decision Path Game",
        objective: "Wire the correct decision sequence to reach the optimal outcome",
        instructions: [
          "Click nodes to inspect their content",
          "Drag from one node to another to create connections",
          "Connect decisions to their logical consequences",
          "Build the optimal decision path by wiring cause and effect",
          "You win when all correct connections are made"
        ]
      };
    } else if (templateName.includes("Problem Analysis")) {
      return {
        title: "Problem Analysis Web Game",
        objective: "Wire the correct relationships between causes, effects, and solutions",
        instructions: [
          "Identify the central problem by inspecting nodes",
          "Connect root causes to their effects",
          "Wire problems to their potential solutions",
          "Look for systematic relationships in the network",
          "Complete all essential connections to solve the web"
        ]
      };
    } else if (templateName.includes("System Mapping")) {
      return {
        title: "System Mapping Game",
        objective: "Map the correct influence patterns within the system",
        instructions: [
          "Examine each system component by clicking nodes",
          "Wire components based on their actual influence relationships",
          "Create feedback loops where appropriate",
          "Connect inputs to outputs through the system",
          "Map the complete system dynamics to win"
        ]
      };
    }
    
    return {
      title: "Connection Puzzle Game",
      objective: "Build understanding by wiring the correct relationships",
      instructions: [
        "Click on nodes to explore concepts",
        "Drag between nodes to create logical connections",
        "Look for cause-and-effect relationships",
        "Build your understanding through systematic wiring",
        "Use hints when you need guidance on connections"
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
                Start Wiring
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
            <span>Connections: {gameState.connections.length}</span>
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>Correct: {gameState.correctConnections.length}/{instructorSolution.length}</span>
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
              Finish
            </Button>
          )}
          
          {gameState.isCompleted && (
            <Button size="sm" variant="secondary" onClick={resetGame}>
              Wire Again
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
                
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  <p>💡 Tip: Drag from this node to create connections with related concepts</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Completed Overlay */}
        {gameState.isCompleted && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center p-8 rounded-lg bg-card border shadow-lg">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              <h3 className="text-2xl font-bold mb-2">Network Complete!</h3>
              <p className="text-lg mb-4">Final Score: {calculateScore()}%</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Time: {Math.floor((Date.now() - gameState.startTime) / 1000 / 60)} minutes</p>
                <p>Correct connections: {gameState.correctConnections.length}/{instructorSolution.length}</p>
                <p>Total attempts: {gameState.connections.length}</p>
                <p>Hints used: {gameState.hintsUsed}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}