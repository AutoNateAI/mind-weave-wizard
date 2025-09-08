import { useCallback, useEffect, useState } from "react";
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Edge, Node } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { PublicGameReport } from '@/components/Analytics/PublicGameReport';
import { Lightbulb, Trophy, Target, X, Info, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import "@xyflow/react/dist/style.css";

interface PublicGameFlowCanvasProps {
  gameTemplate: any;
  onComplete?: (analytics: any, leadData?: any) => void;
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

export function PublicGameFlowCanvas({ gameTemplate, onComplete }: PublicGameFlowCanvasProps) {
  const { theme } = useTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState(gameTemplate?.template_data?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [gameState, setGameState] = useState({
    interactions: 0,
    hintsUsed: 0,
    startTime: Date.now(),
    isCompleted: false,
    revealedNodes: new Set<string>(),
    score: 0,
    connections: [] as Array<{source: string, target: string, correct: boolean}>,
    correctConnections: 0,
    incorrectConnections: 0,
    connectionHistory: [] as Array<{
      source: string,
      target: string, 
      correct: boolean,
      timestamp: number
    }>,
    showInstructions: true,
    showReport: false
  });

  // Track time spent
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    if (gameState.isCompleted) return; // Stop timer when game is completed

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
      setTimeSpent(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.startTime, gameState.isCompleted]);

  const instructorSolution = gameTemplate?.template_data?.instructorSolution || [];

  const onConnect = useCallback((params: Connection | Edge) => {
    const newEdge = { ...params, id: `${params.source}-${params.target}` };
    setEdges((eds) => addEdge(newEdge, eds));
    
    // Evaluate connection
    const isCorrect = evaluateConnection(params.source!, params.target!);
    
    // Track interaction
    setGameState(prev => ({
      ...prev,
      interactions: prev.interactions + 1,
      connections: [...prev.connections, {
        source: params.source!,
        target: params.target!,
        correct: isCorrect
      }],
      connectionHistory: [{
        source: params.source!,
        target: params.target!,
        correct: isCorrect,
        timestamp: Date.now()
      }, ...prev.connectionHistory.slice(0, 9)], // Keep last 10
      correctConnections: isCorrect ? prev.correctConnections + 1 : prev.correctConnections,
      incorrectConnections: !isCorrect ? prev.incorrectConnections + 1 : prev.incorrectConnections
    }));

    // Visual feedback
    if (isCorrect) {
      toast.success("Correct connection! +10 points", {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />
      });
    } else {
      toast.error("Connection needs review", {
        icon: <XCircle className="w-4 h-4 text-red-500" />
      });
    }

    // Check completion after a short delay
    setTimeout(() => {
      checkGameCompletion();
    }, 1000);
  }, []);

  const evaluateConnection = (sourceId: string, targetId: string): boolean => {
    return instructorSolution.some((solution: any) => 
      solution.source === sourceId && solution.target === targetId
    );
  };

  const onNodeClick = useCallback((event: React.MouseEvent, node: GameNode) => {
    // Track node inspection
    setGameState(prev => ({
      ...prev,
      interactions: prev.interactions + 1,
      revealedNodes: new Set([...prev.revealedNodes, node.id])
    }));

    // Show node info as toast
    toast.info(`Node: ${node.data.label}`, {
      icon: <Info className="w-4 h-4 text-blue-500" />,
      duration: 3000
    });
  }, []);

  const useHint = () => {
    if (gameState.hintsUsed >= 3) {
      toast.error("No more hints available!");
      return;
    }

    // Show a random correct connection as hint
    const remainingCorrect = instructorSolution.filter((solution: any) => 
      !edges.some(edge => edge.source === solution.source && edge.target === solution.target)
    );

    if (remainingCorrect.length > 0) {
      const hint = remainingCorrect[Math.floor(Math.random() * remainingCorrect.length)];
      
      // Temporarily highlight the hint connection
      const hintEdge = {
        id: `hint-${Date.now()}`,
        source: hint.source,
        target: hint.target,
        style: { stroke: '#10B981', strokeWidth: 3, strokeDasharray: '5,5' },
        animated: true
      };
      
      setEdges(prev => [...prev, hintEdge]);
      
      // Remove hint after 3 seconds
      setTimeout(() => {
        setEdges(prev => prev.filter(edge => edge.id !== hintEdge.id));
      }, 3000);

      setGameState(prev => ({
        ...prev,
        hintsUsed: prev.hintsUsed + 1
      }));

      toast.info(`Hint ${gameState.hintsUsed + 1}/3: Connection highlighted temporarily`, {
        icon: <Lightbulb className="w-4 h-4 text-yellow-500" />
      });
    }
  };

  const calculateScore = (): number => {
    const correctWeight = 10;
    const incorrectPenalty = 2;
    const hintPenalty = 5;
    const timeBonusThreshold = 600; // 10 minutes
    
    let score = gameState.correctConnections * correctWeight;
    score -= gameState.incorrectConnections * incorrectPenalty;
    score -= gameState.hintsUsed * hintPenalty;
    
    // Time bonus
    if (timeSpent < timeBonusThreshold) {
      score += Math.max(0, timeBonusThreshold - timeSpent) * 0.1;
    }
    
    return Math.max(0, Math.min(100, score));
  };

  const checkGameCompletion = () => {
    const requiredConnections = instructorSolution.length;
    const completionThreshold = Math.ceil(requiredConnections * 0.7); // 70% threshold
    
    if (gameState.correctConnections >= completionThreshold && !gameState.isCompleted) {
      completeGame();
    }
  };

  const completeGame = () => {
    const finalScore = calculateScore();
    
    const analytics = {
      timeSpent,
      correctConnections: gameState.correctConnections,
      incorrectConnections: gameState.incorrectConnections,
      hintsUsed: gameState.hintsUsed,
      totalInteractions: gameState.interactions,
      completionScore: finalScore,
      decisionPath: gameState.connectionHistory,
      gameTitle: gameTemplate.name,
      templateId: gameTemplate.id
    };

    setGameState(prev => ({
      ...prev,
      isCompleted: true,
      showReport: true,
      score: finalScore
    }));

    onComplete?.(analytics);
  };

  const resetGame = () => {
    setEdges([]);
    setGameState({
      interactions: 0,
      hintsUsed: 0,
      startTime: Date.now(),
      isCompleted: false,
      revealedNodes: new Set<string>(),
      score: 0,
      connections: [],
      correctConnections: 0,
      incorrectConnections: 0,
      connectionHistory: [],
      showInstructions: true,
      showReport: false
    });
  };

  const getGameInstructions = () => {
    const gameName = gameTemplate.name;
    if (gameName.includes('Agent')) {
      return "Build an AI agent system by connecting requirements → architecture → tools → implementation. Consider scalability, performance, and integration challenges.";
    } else if (gameName.includes('Prompt')) {
      return "Debug the failing prompt by connecting symptoms → analysis → fixes → testing → deployment. Think systematically about prompt optimization.";
    } else if (gameName.includes('Cloud')) {
      return "Scale your infrastructure under pressure by connecting bottlenecks → scaling decisions → implementations → monitoring. Balance speed with cost.";
    }
    return "Connect the nodes to reveal the optimal decision path through this AI engineering challenge.";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Instructions Overlay */}
      {gameState.showInstructions && (
        <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
          <div className="max-w-2xl mx-auto p-8 bg-card rounded-2xl shadow-2xl border">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4">{gameTemplate.name}</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {getGameInstructions()}
              </p>
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Correct connections: +10 points</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    <span>3 hints available</span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => setGameState(prev => ({ ...prev, showInstructions: false }))}
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              >
                Start Challenge
                <Trophy className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Game Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-card/50">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGameState(prev => ({ ...prev, showInstructions: true }))}
            className="hover:bg-muted/50"
          >
            <Info className="w-4 h-4 mr-2" />
            Instructions
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {formatTime(timeSpent)}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm flex items-center gap-4">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {gameState.correctConnections}
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="w-4 h-4 text-red-500" />
              {gameState.incorrectConnections}
            </span>
            <span className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-primary" />
              Score: {calculateScore()}
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={useHint} 
              disabled={gameState.hintsUsed >= 3}
              variant="outline" 
              size="sm"
              className="hover:bg-yellow-50 hover:border-yellow-200"
            >
              <Lightbulb className="w-4 h-4 mr-1" />
              Hint ({3 - gameState.hintsUsed})
            </Button>
            <Button 
              onClick={completeGame} 
              variant="outline" 
              size="sm"
              className="hover:bg-green-50 hover:border-green-200"
            >
              Finish
            </Button>
            <Button 
              onClick={resetGame} 
              variant="outline" 
              size="sm"
              className="hover:bg-red-50 hover:border-red-200"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
          minZoom={0.1}
          maxZoom={2}
          className={`w-full h-full ${theme === 'dark' ? 'dark' : ''}`}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
        >
          <MiniMap 
            zoomable 
            pannable 
            className={`${theme === 'dark' ? 'dark' : ''} border rounded-lg`}
            style={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb' }}
          />
          <Controls className={theme === 'dark' ? 'dark' : ''} />
          <Background 
            variant={"dots" as any}
            gap={20}
            size={1}
            className={theme === 'dark' ? 'dark' : ''}
          />
        </ReactFlow>
      </div>

      {/* Game Completion Report */}
      {gameState.showReport && (
        <PublicGameReport
          analytics={{
            timeSpent,
            correctConnections: gameState.correctConnections,
            incorrectConnections: gameState.incorrectConnections,
            hintsUsed: gameState.hintsUsed,
            totalInteractions: gameState.interactions,
            completionScore: calculateScore(),
            decisionPath: gameState.connectionHistory
          }}
          gameTitle={gameTemplate.name}
          gameTemplateId={gameTemplate.id}
          onClose={() => setGameState(prev => ({ ...prev, showReport: false }))}
          onLeadCaptured={(leadData) => {
            console.log('Lead captured:', leadData);
            // Lead capture handled in PublicGameReport
          }}
        />
      )}
    </div>
  );
}