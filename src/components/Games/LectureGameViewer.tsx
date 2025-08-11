import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameFlowCanvas } from "@/components/GraphEditor/GameFlowCanvas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Play, RotateCcw, Clock, Target } from "lucide-react";

interface LectureGame {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  game_data: any;
  hints: any;
  estimated_duration_minutes: number | null;
  game_template_id: string;
  mechanics: any;
}

interface LectureGameViewerProps {
  sessionNumber: number;
  lectureNumber: number;
}

export function LectureGameViewer({ sessionNumber, lectureNumber }: LectureGameViewerProps) {
  const [games, setGames] = useState<LectureGame[]>([]);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, [sessionNumber, lectureNumber]);

  const loadGames = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lecture_games')
        .select(`
          *,
          game_templates (
            mechanics
          )
        `)
        .eq('session_number', sessionNumber)
        .eq('lecture_number', lectureNumber)
        .eq('is_published', true)
        .order('order_index');

      if (error) throw error;

      const gamesWithMechanics = data?.map(game => ({
        ...game,
        mechanics: game.game_templates?.mechanics || {}
      })) || [];

      setGames(gamesWithMechanics);
    } catch (error) {
      console.error('Error loading games:', error);
      toast.error('Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const handleGameComplete = (score: number, analytics: any) => {
    setIsPlaying(false);
    toast.success(`Game completed with ${score}% score!`);
    
    // Move to next game if available
    if (currentGameIndex < games.length - 1) {
      setTimeout(() => {
        setCurrentGameIndex(prev => prev + 1);
      }, 2000);
    }
  };

  const startGame = () => {
    setIsPlaying(true);
  };

  const resetGame = () => {
    setIsPlaying(false);
  };

  const switchGame = (index: number) => {
    setCurrentGameIndex(index);
    setIsPlaying(false);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading games...</p>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="text-6xl">🎮</div>
          <h3 className="text-lg font-semibold">No Games Available</h3>
          <p className="text-muted-foreground max-w-md">
            Games for this lecture haven't been created yet. Check back soon for interactive learning activities!
          </p>
        </div>
      </div>
    );
  }

  const currentGame = games[currentGameIndex];

  return (
    <div className="h-full flex flex-col">
      {!isPlaying ? (
        /* Game Selection & Info */
        <div className="h-full flex flex-col">
          {/* Game Navigation */}
          {games.length > 1 && (
            <div className="flex gap-2 p-4 border-b bg-muted/30">
              {games.map((game, index) => (
                <Button
                  key={game.id}
                  size="sm"
                  variant={index === currentGameIndex ? "default" : "outline"}
                  onClick={() => switchGame(index)}
                  className="flex-1"
                >
                  Game {index + 1}
                </Button>
              ))}
            </div>
          )}

          {/* Game Info */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold">{currentGame.title}</h2>
                <p className="text-muted-foreground">{currentGame.description}</p>
              </div>

              <Card className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Instructions
                </h3>
                <div className="prose prose-sm dark:prose-invert">
                  <p>{currentGame.instructions}</p>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Duration</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Estimated: {currentGame.estimated_duration_minutes} minutes
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Hints Available</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {Array.isArray(currentGame.hints) ? currentGame.hints.length : 0} hints to help you
                  </p>
                </Card>
              </div>

              <div className="text-center pt-4">
                <Button 
                  onClick={startGame}
                  size="lg"
                  className="gap-2 cyber-glow"
                >
                  <Play className="w-4 h-4" />
                  Start Game
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Active Game */
        <div className="h-full flex flex-col">
          {/* Game Header */}
          <div className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm">
            <div>
              <h3 className="font-semibold">{currentGame.title}</h3>
              <p className="text-sm text-muted-foreground">
                Game {currentGameIndex + 1} of {games.length}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={resetGame} className="gap-1">
              <RotateCcw className="w-3 h-3" />
              Back to Info
            </Button>
          </div>

          {/* Game Canvas */}
          <div className="flex-1 min-h-0">
            <GameFlowCanvas
              gameId={currentGame.id}
              gameData={currentGame.game_data}
              mechanics={currentGame.mechanics}
              hints={currentGame.hints}
              onComplete={handleGameComplete}
            />
          </div>
        </div>
      )}
    </div>
  );
}