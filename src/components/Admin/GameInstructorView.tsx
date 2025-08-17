import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GameFlowCanvas } from "@/components/GraphEditor/GameFlowCanvas";
import { Eye, EyeOff, Users, GraduationCap, Target, CheckCircle } from "lucide-react";

interface LectureGame {
  id: string;
  title: string;
  description: string;
  instructions: string;
  game_data: any;
  hints: any;
  estimated_duration_minutes: number;
  is_published: boolean;
  created_at: string;
  game_template_id: string;
  mechanics?: any;
}

interface GameInstructorViewProps {
  game: LectureGame;
  onClose: () => void;
}

export function GameInstructorView({ game, onClose }: GameInstructorViewProps) {
  const [showSolution, setShowSolution] = useState(true);
  const [showConnected, setShowConnected] = useState(false);

  // Extract instructor solution from game data
  const instructorSolution = game.game_data?.instructorSolution || [];
  const wrongConnections = game.game_data?.wrongConnections || [];
  const nodes = game.game_data?.nodes || [];
  const totalNodes = nodes.length;
  const totalConnections = instructorSolution.length;

  // Helper function to get node label by ID
  const getNodeLabel = (nodeId: string) => {
    const node = nodes.find((n: any) => n.id === nodeId);
    return node?.data?.label || nodeId;
  };

  const getSolutionSummary = () => {
    const concepts = game.game_data?.nodes?.map((node: any) => node.data.label).join(', ') || '';
    return {
      totalNodes,
      totalConnections,
      concepts: concepts.length > 100 ? concepts.substring(0, 100) + '...' : concepts
    };
  };

  const summary = getSolutionSummary();

  // Create modified game data for connected view
  const getConnectedGameData = () => {
    if (!showConnected) return game.game_data;
    
    const connectedEdges = instructorSolution.map((conn: any, index: number) => ({
      id: `instructor-${index}`,
      source: conn.source,
      target: conn.target,
      type: 'default',
      style: { stroke: '#22c55e', strokeWidth: 2 }
    }));

    return {
      ...game.game_data,
      edges: [...(game.game_data?.edges || []), ...connectedEdges]
    };
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-background/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">{game.title}</h2>
              <p className="text-sm text-muted-foreground">Instructor View</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={game.is_published ? "default" : "secondary"}>
              {game.is_published ? "Published" : "Draft"}
            </Badge>
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        
        {/* Solution Toggle */}
        <div className="flex items-center gap-4 flex-wrap">
          <Button
            size="sm"
            variant={showSolution ? "default" : "outline"}
            onClick={() => setShowSolution(!showSolution)}
            className="gap-2"
          >
            {showSolution ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showSolution ? "Hide Solution" : "Show Solution"}
          </Button>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              <span>{summary.totalNodes} concepts</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              <span>{summary.totalConnections} connections</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Side - Instructor Solution */}
        {showSolution && (
          <div className="w-1/2 border-r flex flex-col h-full">
            <div className="p-3 border-b bg-muted/30 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                <h3 className="font-medium">Instructor Solution</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                This shows the correct connections and relationships students need to discover
              </p>
            </div>
            
            <div className="flex-1 min-h-0 p-4 overflow-hidden">
              {/* Solution Summary */}
              <div className="h-full overflow-y-auto scrollbar-hide">
                <Card className="p-4 mb-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Solution Overview
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Correct Connections ({instructorSolution.length})</p>
                    <div className="space-y-1">
                      {instructorSolution.map((connection: any, index: number) => (
                        <div key={index} className="text-xs bg-green-50 dark:bg-green-950/30 p-2 rounded border-l-2 border-green-500">
                          <span className="font-medium">{getNodeLabel(connection.source)}</span>
                          <span className="mx-2 text-muted-foreground">→</span>
                          <span className="font-medium">{getNodeLabel(connection.target)}</span>
                          {connection.reasoning && (
                            <p className="text-muted-foreground mt-1">{connection.reasoning}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {wrongConnections.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Common Mistakes ({wrongConnections.length})</p>
                      <div className="space-y-1">
                        {wrongConnections.slice(0, 3).map((connection: any, index: number) => (
                          <div key={index} className="text-xs bg-red-50 dark:bg-red-950/30 p-2 rounded border-l-2 border-red-500">
                            <span className="font-medium">{getNodeLabel(connection.source)}</span>
                            <span className="mx-2 text-muted-foreground">→</span>
                            <span className="font-medium">{getNodeLabel(connection.target)}</span>
                            {connection.why_wrong && (
                              <p className="text-muted-foreground mt-1">{connection.why_wrong}</p>
                            )}
                          </div>
                        ))}
                        {wrongConnections.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{wrongConnections.length - 3} more potential mistakes...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium mb-1">Key Concepts</p>
                    <p className="text-xs text-muted-foreground">{summary.concepts}</p>
                  </div>
                </div>
              </Card>

                {/* Hints Available */}
                {Array.isArray(game.hints) && game.hints.length > 0 && (
                  <Card className="p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Available Hints ({game.hints.length})
                    </h4>
                    <div className="space-y-2">
                      {game.hints.map((hint: string, index: number) => (
                        <div key={index} className="text-xs bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
                          <span className="font-medium">Hint {index + 1}:</span> {hint}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right Side - Student View */}
        <div className={`${showSolution ? 'w-1/2' : 'w-full'} flex flex-col h-full`}>
          <div className="p-3 border-b bg-muted/30 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="font-medium">Student Experience</h3>
              </div>
              <Button
                size="sm"
                variant={showConnected ? "default" : "outline"}
                onClick={() => setShowConnected(!showConnected)}
                className="gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {showConnected ? "Hide Solution" : "Show Solution"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {showConnected 
                ? "Showing the completed graph with all correct connections"
                : "This is exactly what students see when playing the game"
              }
            </p>
          </div>
          
          <div className="flex-1 min-h-0">
            <GameFlowCanvas
              gameId={game.id}
              gameData={getConnectedGameData()}
              mechanics={game.mechanics || {}}
              hints={game.hints}
              onComplete={(score) => {
                console.log(`Preview completed with ${score}% score!`);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}