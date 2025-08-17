import { useCallback, useEffect, useState } from "react";
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Edge, Node } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GameCompletionReport } from '@/components/Analytics/GameCompletionReport';
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

  // Update edges when gameData changes (e.g., when Show Solution is toggled)
  useEffect(() => {
    if (gameData?.edges) {
      console.log("🐛 DEBUG - Updating edges from gameData:", gameData.edges);
      setEdges(gameData.edges);
    }
  }, [gameData?.edges, setEdges]);
  const [gameState, setGameState] = useState({
    interactions: 0,
    hintsUsed: 0,
    startTime: Date.now(),
    isCompleted: false,
    revealedNodes: new Set<string>(),
    score: 0,
    connections: [] as Array<{source: string, target: string}>,
    correctConnections: [] as Array<{source: string, target: string}>,
    incorrectConnections: [] as Array<{source: string, target: string}>,
    connectionHistory: [] as Array<{
      source: string,
      target: string,
      isCorrect: boolean,
      timestamp: number,
      action: 'connected' | 'disconnected'
    }>
  });
  const [showInstructions, setShowInstructions] = useState(true);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<{ node: GameNode; position: { x: number; y: number } } | null>(null);
  const [showConnectionHistory, setShowConnectionHistory] = useState(false);
  const [showAnalyticsReport, setShowAnalyticsReport] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);

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
        correctConnections: [...prev.correctConnections, { source, target }],
        connectionHistory: [...prev.connectionHistory, {
          source,
          target,
          isCorrect: true,
          timestamp: Date.now(),
          action: 'connected'
        }]
      }));
      
      // Update edge style to green for correct connection
      setEdges(edges => edges.map(edge => {
        if (edge.source === source && edge.target === target) {
          return { ...edge, style: { ...edge.style, stroke: '#22c55e', strokeWidth: 3 } };
        }
        return edge;
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
        // Update edge style to red for incorrect connection
        setEdges(edges => edges.map(edge => {
          if (edge.source === source && edge.target === target) {
            return { ...edge, style: { ...edge.style, stroke: '#ef4444', strokeWidth: 3 } };
          }
          return edge;
        }));
        
        toast.error("Incorrect connection", {
          description: wrongConnection.why_wrong || "This connection doesn't follow the logical pattern",
          icon: <XCircle className="w-4 h-4" />
        });
        
        setGameState(prev => ({
          ...prev,
          score: Math.max(0, prev.score - 5),
          incorrectConnections: [...prev.incorrectConnections, { source, target }],
          connectionHistory: [...prev.connectionHistory, {
            source,
            target,
            isCorrect: false,
            timestamp: Date.now(),
            action: 'connected'
          }]
        }));
      } else {
        // Neutral connection - not explicitly wrong but not in solution
        toast.info("Connection noted", {
          description: "Consider if this relationship is essential to the solution"
        });
      }
    }
  }, [instructorSolution, wrongConnections, setEdges]);

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
    
    // Position popup at right middle of viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupPosition = {
      x: viewportWidth - 350, // 350px from right edge
      y: viewportHeight / 2 - 150 // Center vertically, adjusted for popup height
    };
    
    setSelectedNodeDetails({
      node: gameNode,
      position: popupPosition
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
      
      // Get all correct connections from instructor solution
      const allCorrectConnections = instructorSolution || [];
      
      // Get connections user has already made
      const existingConnections = edges.filter(edge => 
        edge.source && edge.target && edge.id?.includes('-')
      ).map(edge => ({
        source: edge.source,
        target: edge.target
      }));
      
      // Filter out connections that already exist
      const availableHintConnections = allCorrectConnections.filter((correct: any) => 
        !existingConnections.some(existing => 
          existing.source === correct.source && existing.target === correct.target
        )
      );
      
      if (availableHintConnections.length > 0) {
        // Randomly select up to 2 connections to hint
        const numHints = Math.min(2, availableHintConnections.length);
        const shuffled = [...availableHintConnections].sort(() => Math.random() - 0.5);
        const selectedHints = shuffled.slice(0, numHints);
        
        // Create temporary hint edges
        const hintEdges = selectedHints.map((hint: any) => ({
          id: `hint-${hint.source}-${hint.target}`,
          source: hint.source,
          target: hint.target,
          type: 'smoothstep' as const,
          style: { 
            stroke: '#fbbf24', 
            strokeWidth: 4, 
            strokeDasharray: '8,4',
            animation: 'pulse 1.5s infinite'
          },
          animated: true,
          className: 'hint-edge'
        }));
        
        // Add hint edges temporarily
        setEdges(edges => [...edges, ...hintEdges]);
        
        // Random duration between 10-15 seconds
        const hintDuration = Math.floor(Math.random() * 6000) + 10000; // 10000-15000ms
        
        // Remove hint edges after duration
        setTimeout(() => {
          setEdges(edges => edges.filter(edge => !edge.id?.startsWith('hint-')));
        }, hintDuration);
        
        trackInteraction('hint_used', {
          hintIndex: gameState.hintsUsed,
          hintText: hintsArray[gameState.hintsUsed],
          connectionsShown: selectedHints,
          duration: hintDuration,
          timestamp: Date.now()
        });

        toast.info(hintsArray[gameState.hintsUsed], {
          icon: <Lightbulb className="w-4 h-4" />,
          duration: Math.floor(hintDuration / 1000) * 1000,
          description: `Showing ${numHints} helpful connection${numHints > 1 ? 's' : ''} for ${Math.floor(hintDuration / 1000)} seconds`
        });
      } else {
        // No more connections to hint at
        toast.info("Great progress! You've already made most of the correct connections.", {
          icon: <Lightbulb className="w-4 h-4" />,
          duration: 4000
        });
      }
    }
  };

  const calculateScore = () => {
    const timeSpent = (Date.now() - gameState.startTime) / 1000;
    let score = gameState.score || 0; // Ensure score is not undefined
    
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
    const totalRequired = instructorSolution?.length || 0;
    const correctMade = gameState.correctConnections?.length || 0;
    
    if (totalRequired > 0) {
      const accuracyBonus = Math.floor((correctMade / totalRequired) * 30);
      score += accuracyBonus;
    }
    
    return Math.min(100, Math.max(0, Math.round(score)));
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
      timeSpent: Math.floor(timeSpent),
      correctConnections: gameState.correctConnections.length,
      incorrectConnections: gameState.incorrectConnections.length,
      hintsUsed: gameState.hintsUsed,
      totalInteractions: gameState.interactions,
      completionScore: score,
      decisionPath: gameState.connectionHistory
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
        correct_connections: gameState.correctConnections.length,
        incorrect_connections: gameState.incorrectConnections.length,
        decision_path: JSON.stringify(gameState.connectionHistory),
        final_solution: JSON.stringify({ nodes, edges })
      });

      trackInteraction('completed', analytics);
      
      setGameState(prev => ({ ...prev, isCompleted: true }));
      setAnalyticsData(analytics);
      setShowAnalyticsReport(true);
      
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
      incorrectConnections: [],
      connectionHistory: []
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 px-4 bg-background/80 backdrop-blur-sm border-b shrink-0 gap-3 sm:gap-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setShowInstructions(true)}
            className="gap-1 text-xs shrink-0"
          >
            📖 Instructions
          </Button>
          <div className="flex items-center gap-1 shrink-0">
            <Target className="w-4 h-4" />
            <span className="whitespace-nowrap">Connections: {gameState.connections.length}</span>
          </div>
          <div className="flex items-center gap-1 text-green-600 shrink-0">
            <CheckCircle className="w-4 h-4" />
            <span className="whitespace-nowrap">Correct: {gameState.correctConnections.length}/{instructorSolution.length}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Trophy className="w-4 h-4" />
            <span className="whitespace-nowrap">Score: {gameState.score}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Lightbulb className="w-4 h-4" />
            <span className="whitespace-nowrap">Hints: {gameState.hintsUsed}/{Array.isArray(hints) ? hints.length : 0}</span>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setShowConnectionHistory(!showConnectionHistory)}
            className="gap-1 text-xs shrink-0"
          >
            📋 History ({gameState.connectionHistory.length})
          </Button>
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

      {/* Connection History Panel */}
      {showConnectionHistory && (
        <div className="absolute top-16 left-4 z-30 bg-card border rounded-lg shadow-xl w-80 max-h-96 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Connection History</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowConnectionHistory(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {gameState.connectionHistory.slice().reverse().map((connection, index) => {
                const sourceNode = nodes.find(n => n.id === connection.source);
                const targetNode = nodes.find(n => n.id === connection.target);
                const time = new Date(connection.timestamp).toLocaleTimeString();
                
                return (
                  <div 
                    key={index} 
                    className={`p-2 rounded text-xs border-l-2 ${
                      connection.isCorrect 
                        ? 'border-l-green-500 bg-green-50 dark:bg-green-950/20' 
                        : 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium">
                          {String(sourceNode?.data.label || connection.source)} → {String(targetNode?.data.label || connection.target)}
                        </div>
                        <div className="text-muted-foreground mt-1">
                          {connection.isCorrect ? '✅ Correct' : '❌ Incorrect'} • {time}
                        </div>
                      </div>
                      {connection.isCorrect ? (
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
              {gameState.connectionHistory.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No connections made yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Game Canvas */}
      <div className="flex-1 min-h-0 overflow-hidden react-flow-container relative">
        <ReactFlow
          nodes={nodes.filter(node => node && node.data).map(node => ({
            ...node,
            data: {
              ...node.data,
              'data-node-type': node.data?.nodeType || 'information'
            }
          }))}
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

        {/* Analytics Report Modal */}
        {showAnalyticsReport && analyticsData && (
          <GameCompletionReport
            analytics={analyticsData}
            gameTitle={gameData?.title || 'Mind Puzzle'}
            onClose={() => {
              setShowAnalyticsReport(false);
              onComplete?.(analyticsData.completionScore, analyticsData);
            }}
            onViewFullAnalytics={() => {
              setShowAnalyticsReport(false);
              onComplete?.(analyticsData.completionScore, analyticsData);
            }}
          />
        )}
      </div>
    </div>
  );
}