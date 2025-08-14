import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GameBuilder } from "./GameBuilder";
import { GameSuiteBuilder } from "./GameSuiteBuilder";
import { GameFlowCanvas } from "@/components/GraphEditor/GameFlowCanvas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Play, Settings, BarChart3, Zap } from "lucide-react";

interface Session {
  session_number: number;
  title: string;
  theme: string;
}

interface Lecture {
  id: string;
  title: string;
  content: string;
  session_number: number;
  lecture_number: number;
}

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

interface GameBuilderViewProps {
  selectedCourseId?: string;
}

export function GameBuilderView({ selectedCourseId }: GameBuilderViewProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [games, setGames] = useState<LectureGame[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showSuiteBuilder, setShowSuiteBuilder] = useState(false);
  const [previewGame, setPreviewGame] = useState<LectureGame | null>(null);

  useEffect(() => {
    if (selectedCourseId) {
      loadSessions();
      // Reset selected session and lecture when course changes
      setSelectedSession(null);
      setSelectedLecture(null);
      setGames([]);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedSession) {
      loadLectures(selectedSession.session_number);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (selectedLecture) {
      loadGames(selectedLecture.session_number, selectedLecture.lecture_number);
    }
  }, [selectedLecture]);

  const loadSessions = async () => {
    if (!selectedCourseId) {
      setSessions([]);
      return;
    }

    const { data, error } = await supabase
      .from('sessions_dynamic')
      .select('session_number, title, theme')
      .eq('course_id', selectedCourseId)
      .order('session_number');

    if (error) {
      toast.error('Failed to load sessions');
      return;
    }

    setSessions(data || []);
  };

  const loadLectures = async (sessionNumber: number) => {
    const { data, error } = await supabase
      .from('lectures_dynamic')
      .select('*')
      .eq('session_id', (await supabase
        .from('sessions_dynamic')
        .select('id')
        .eq('session_number', sessionNumber)
        .single()).data?.id)
      .order('order_index');

    if (error) {
      toast.error('Failed to load lectures');
      return;
    }

    // Map to include session_number for consistency
    const lecturesWithSession = data?.map(lecture => ({
      ...lecture,
      session_number: sessionNumber
    })) || [];

    setLectures(lecturesWithSession);
  };

  const loadGames = async (sessionNumber: number, lectureNumber: number) => {
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
      .order('order_index');

    if (error) {
      toast.error('Failed to load games');
      return;
    }

    const gamesWithMechanics = data?.map(game => ({
      ...game,
      mechanics: game.game_templates?.mechanics || {}
    })) || [];

    setGames(gamesWithMechanics);
  };

  const handleGameSaved = () => {
    setShowBuilder(false);
    setShowSuiteBuilder(false);
    if (selectedLecture) {
      loadGames(selectedLecture.session_number, selectedLecture.lecture_number);
    }
  };

  const toggleGameStatus = async (gameId: string, isPublished: boolean) => {
    const { error } = await supabase
      .from('lecture_games')
      .update({ is_published: !isPublished })
      .eq('id', gameId);

    if (error) {
      toast.error('Failed to update game status');
      return;
    }

    toast.success(`Game ${!isPublished ? 'published' : 'unpublished'}`);
    if (selectedLecture) {
      loadGames(selectedLecture.session_number, selectedLecture.lecture_number);
    }
  };

  const deleteGame = async (gameId: string, gameTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${gameTitle}"? This action cannot be undone.`)) {
      return;
    }

    const { error } = await supabase
      .from('lecture_games')
      .delete()
      .eq('id', gameId);

    if (error) {
      toast.error('Failed to delete game');
      return;
    }

    toast.success('Game deleted successfully');
    if (selectedLecture) {
      loadGames(selectedLecture.session_number, selectedLecture.lecture_number);
    }
  };

  return (
    <div className="space-y-6">
      {!showBuilder && !showSuiteBuilder ? (
        <>
          {/* Selection Controls */}
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Session</label>
                <Select value={selectedSession?.session_number.toString()} onValueChange={(value) => {
                  const session = sessions.find(s => s.session_number === parseInt(value));
                  setSelectedSession(session || null);
                  setSelectedLecture(null);
                  setGames([]);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.session_number} value={session.session_number.toString()}>
                        Session {session.session_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSession && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedSession.theme}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Lecture</label>
                <Select 
                  value={selectedLecture?.id} 
                  onValueChange={(value) => {
                    const lecture = lectures.find(l => l.id === value);
                    setSelectedLecture(lecture || null);
                  }}
                  disabled={!selectedSession}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lecture" />
                  </SelectTrigger>
                  <SelectContent>
                    {lectures.map((lecture) => (
                      <SelectItem key={lecture.id} value={lecture.id}>
                        Lecture {lecture.lecture_number}: {lecture.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button 
                  onClick={() => setShowSuiteBuilder(true)}
                  disabled={!selectedLecture}
                  className="flex-1 gap-2"
                  variant="default"
                >
                  <Zap className="w-4 h-4" />
                  Generate Complete Game Suite
                </Button>
                <Button 
                  onClick={() => setShowBuilder(true)}
                  disabled={!selectedLecture}
                  className="flex-1 gap-2"
                  variant="outline"
                >
                  <Settings className="w-4 h-4" />
                  Create Single Game
                </Button>
              </div>
            </div>
          </Card>

          {/* Current Games */}
          {selectedLecture && (
            <Card className="p-6">
              <h4 className="font-semibold mb-4">
                Games for {selectedLecture.title}
              </h4>
              {games.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No games created yet</p>
                  <p className="text-sm">Create your first interactive game for this lecture</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {games.map((game) => (
                    <Card key={game.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium">{game.title}</h5>
                            <Badge variant={game.is_published ? "default" : "secondary"}>
                              {game.is_published ? "Published" : "Draft"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{game.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>⏱️ {game.estimated_duration_minutes} min</span>
                            <span>📅 {new Date(game.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="gap-1">
                            <BarChart3 className="w-3 h-3" />
                            Analytics
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="gap-1"
                            onClick={() => setPreviewGame(game)}
                          >
                            <Play className="w-3 h-3" />
                            Preview
                          </Button>
                          <Button 
                            size="sm" 
                            variant={game.is_published ? "secondary" : "default"}
                            onClick={() => toggleGameStatus(game.id, game.is_published)}
                          >
                            {game.is_published ? "Unpublish" : "Publish"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteGame(game.id, game.title)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      ) : showSuiteBuilder ? (
        <GameSuiteBuilder
          sessionNumber={selectedLecture!.session_number}
          lectureNumber={selectedLecture!.lecture_number}
          lectureContent={selectedLecture!.content}
          onGamesSaved={handleGameSaved}
        />
      ) : (
        <GameBuilder
          sessionNumber={selectedLecture!.session_number}
          lectureNumber={selectedLecture!.lecture_number}
          lectureContent={selectedLecture!.content}
          onGameSaved={handleGameSaved}
        />
      )}

      {/* Game Preview Modal */}
      <Dialog open={!!previewGame} onOpenChange={() => setPreviewGame(null)}>
        <DialogContent className="max-w-7xl h-[95vh] w-[95vw] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-4 py-2 border-b shrink-0 min-h-0">
            <DialogTitle className="text-lg">Game Preview: {previewGame?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 flex flex-col">
            {previewGame && (
              <GameFlowCanvas
                gameId={previewGame.id}
                gameData={previewGame.game_data}
                mechanics={previewGame.mechanics || {}}
                hints={previewGame.hints}
                onComplete={(score) => {
                  toast.success(`Preview completed with ${score}% score!`);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}