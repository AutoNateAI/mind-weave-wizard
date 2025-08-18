import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Clock, Gamepad2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { LectureGameViewer } from "@/components/Games/LectureGameViewer";

interface Session {
  id: string;
  session_number: number;
  title: string;
  theme: string;
}

interface Lecture {
  id: string;
  lecture_number: number;
  title: string;
  session_id: string;
}

interface GameTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface GeneratedGame {
  lectureNumber: number;
  lectureTitle: string;
  games: {
    templateId: string;
    templateName: string;
    gameData: any;
    status: 'pending' | 'generating' | 'completed' | 'error';
    error?: string;
    gameId?: string;
  }[];
}

export function SessionGameView() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [gameTemplates, setGameTemplates] = useState<GameTemplate[]>([]);
  const [generatedGames, setGeneratedGames] = useState<GeneratedGame[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
    fetchGameTemplates();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchLectures(selectedSession.id);
    }
  }, [selectedSession]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions_dynamic')
        .select('id, session_number, title, theme')
        .order('session_number');

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sessions",
        variant: "destructive"
      });
    }
  };

  const fetchLectures = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('lectures_dynamic')
        .select('id, lecture_number, title, session_id')
        .eq('session_id', sessionId)
        .order('lecture_number');

      if (error) throw error;
      setLectures(data || []);
    } catch (error) {
      console.error('Error fetching lectures:', error);
      toast({
        title: "Error",
        description: "Failed to fetch lectures",
        variant: "destructive"
      });
    }
  };

  const fetchGameTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('game_templates')
        .select('id, name, category, description')
        .limit(3);

      if (error) throw error;
      setGameTemplates(data || []);
    } catch (error) {
      console.error('Error fetching game templates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch game templates",
        variant: "destructive"
      });
    }
  };

  const generateAllGames = async () => {
    if (!selectedSession || lectures.length === 0 || gameTemplates.length === 0) {
      toast({
        title: "Error",
        description: "Please select a session with lectures",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    // Initialize generated games structure
    const initialGames: GeneratedGame[] = lectures.map(lecture => ({
      lectureNumber: lecture.lecture_number,
      lectureTitle: lecture.title,
      games: gameTemplates.map(template => ({
        templateId: template.id,
        templateName: template.name,
        gameData: null,
        status: 'pending'
      }))
    }));

    setGeneratedGames(initialGames);

    const totalGames = lectures.length * gameTemplates.length;
    let completedGames = 0;

    try {
      for (let lectureIndex = 0; lectureIndex < lectures.length; lectureIndex++) {
        const lecture = lectures[lectureIndex];
        
        for (let templateIndex = 0; templateIndex < gameTemplates.length; templateIndex++) {
          const template = gameTemplates[templateIndex];
          
          // Update status to generating
          setGeneratedGames(prev => {
            const updated = [...prev];
            updated[lectureIndex].games[templateIndex].status = 'generating';
            return updated;
          });

          try {
            // Generate game using the existing edge function
            const { data: gameData, error: gameError } = await supabase.functions.invoke('ai-game-generator', {
              body: {
                sessionNumber: selectedSession.session_number,
                lectureNumber: lecture.lecture_number,
                lectureTitle: lecture.title,
                sessionTheme: selectedSession.theme,
                templateId: template.id
              }
            });

            if (gameError) throw gameError;

            // Save game to database
            const { data: savedGame, error: saveError } = await supabase
              .from('lecture_games')
              .insert({
                session_number: selectedSession.session_number,
                lecture_number: lecture.lecture_number,
                game_template_id: template.id,
                title: gameData.title,
                description: gameData.description,
                instructions: gameData.instructions,
                game_data: gameData.gameData,
                hints: gameData.hints || [],
                win_conditions: gameData.winConditions || {},
                validation_rules: gameData.validationRules || {},
                heuristic_targets: gameData.heuristicTargets || [],
                order_index: templateIndex,
                is_published: true
              })
              .select()
              .single();

            if (saveError) throw saveError;

            // Update status to completed
            setGeneratedGames(prev => {
              const updated = [...prev];
              updated[lectureIndex].games[templateIndex] = {
                ...updated[lectureIndex].games[templateIndex],
                status: 'completed',
                gameData: gameData,
                gameId: savedGame.id
              };
              return updated;
            });

          } catch (error) {
            console.error(`Error generating game for lecture ${lecture.lecture_number}, template ${template.name}:`, error);
            
            // Update status to error
            setGeneratedGames(prev => {
              const updated = [...prev];
              updated[lectureIndex].games[templateIndex] = {
                ...updated[lectureIndex].games[templateIndex],
                status: 'error',
                error: error.message || 'Failed to generate game'
              };
              return updated;
            });
          }

          completedGames++;
          setGenerationProgress((completedGames / totalGames) * 100);
        }
      }

      toast({
        title: "Generation Complete",
        description: `Generated ${completedGames} games for ${selectedSession.title}`,
      });

    } catch (error) {
      console.error('Error in batch generation:', error);
      toast({
        title: "Generation Error",
        description: "Failed to complete game generation",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'generating':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'generating':
        return 'bg-blue-100 text-blue-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Gamepad2 className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Session Game Generator</h1>
      </div>

      {/* Session Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select onValueChange={(value) => {
            const session = sessions.find(s => s.id === value);
            setSelectedSession(session || null);
            setGeneratedGames([]);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a session to generate games for..." />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  Session {session.session_number}: {session.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedSession && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">{selectedSession.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{selectedSession.theme}</p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  {lectures.length} lectures × {gameTemplates.length} game types = {lectures.length * gameTemplates.length} total games
                </div>
                <Button 
                  onClick={generateAllGames}
                  disabled={isGenerating || lectures.length === 0}
                  className="flex items-center gap-2"
                >
                  <Gamepad2 className="w-4 h-4" />
                  {isGenerating ? 'Generating...' : 'Generate All Games'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generation Progress */}
      {isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generation Progress</span>
                <span>{Math.round(generationProgress)}%</span>
              </div>
              <Progress value={generationProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Games Display */}
      {generatedGames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Games</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="0" className="w-full">
              <TabsList className="grid w-full grid-cols-3 gap-1">
                {generatedGames.map((lectureGame, index) => (
                  <TabsTrigger key={index} value={index.toString()} className="text-xs">
                    Lecture {lectureGame.lectureNumber}
                  </TabsTrigger>
                ))}
              </TabsList>

              {generatedGames.map((lectureGame, lectureIndex) => (
                <TabsContent key={lectureIndex} value={lectureIndex.toString()} className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Lecture {lectureGame.lectureNumber}: {lectureGame.lectureTitle}
                    </h3>
                    
                    <div className="grid gap-4">
                      {lectureGame.games.map((game, gameIndex) => (
                        <Card key={gameIndex}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{game.templateName}</CardTitle>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(game.status)}
                                <Badge className={getStatusColor(game.status)}>
                                  {game.status}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {game.status === 'completed' && game.gameData && game.gameId && (
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2">{game.gameData.title}</h4>
                                  <p className="text-sm text-muted-foreground mb-4">{game.gameData.description}</p>
                                </div>
                                <div className="border rounded-lg p-4 bg-muted/30">
                                  <h5 className="font-medium mb-2">Game Preview</h5>
                                  <div className="text-sm space-y-2">
                                    <div><strong>Instructions:</strong> {game.gameData.instructions}</div>
                                    {game.gameData.hints && game.gameData.hints.length > 0 && (
                                      <div><strong>Hints Available:</strong> {game.gameData.hints.length}</div>
                                    )}
                                    <div className="pt-2">
                                      <Button size="sm" asChild>
                                        <a href={`/admin?view=games&gameId=${game.gameId}`} target="_blank" rel="noopener noreferrer">
                                          View Full Game
                                        </a>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            {game.status === 'error' && (
                              <div className="text-red-600 text-sm">
                                Error: {game.error}
                              </div>
                            )}
                            {game.status === 'generating' && (
                              <div className="text-blue-600 text-sm">
                                Generating game...
                              </div>
                            )}
                            {game.status === 'pending' && (
                              <div className="text-gray-500 text-sm">
                                Waiting to generate...
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}