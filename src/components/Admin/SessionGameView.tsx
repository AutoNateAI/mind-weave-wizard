import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Gamepad2, Zap, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Course {
  id: string;
  title: string;
  description: string;
}

interface Session {
  id: string;
  session_number: number;
  title: string;
  theme: string;
  course_id: string;
}

interface Lecture {
  id: string;
  lecture_number: number;
  title: string;
  session_id: string;
  content?: string;
}

interface LectureGameSuite {
  lectureNumber: number;
  lectureTitle: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  error?: string;
  gamesCreated?: number;
}

export function SessionGameView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [lectureGameSuites, setLectureGameSuites] = useState<LectureGameSuite[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentGeneratingLecture, setCurrentGeneratingLecture] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchSessions(selectedCourse.id);
      setSelectedSession(null);
      setLectureGameSuites([]);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedSession) {
      fetchLectures(selectedSession.id);
    }
  }, [selectedSession]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description')
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive"
      });
    }
  };

  const fetchSessions = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('sessions_dynamic')
        .select('id, session_number, title, theme, course_id')
        .eq('course_id', courseId)
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
        .select('id, lecture_number, title, session_id, content')
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

  const generateAllGameSuites = async () => {
    if (!selectedSession || lectures.length === 0) {
      toast({
        title: "Error",
        description: "Please select a session with lectures",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    // Initialize the status tracking for each lecture
    const initialSuites: LectureGameSuite[] = lectures.map((lecture) => ({
      lectureNumber: lecture.lecture_number,
      lectureTitle: lecture.title,
      status: 'generating'
    }));

    setLectureGameSuites(initialSuites);
    setCurrentGeneratingLecture('Generating complete game suites for all lectures...');

    const totalLectures = lectures.length;
    let completedCount = 0;
    let successCount = 0;

    // Generate game suites for all lectures in parallel using the existing GameSuiteBuilder logic
    const tasks = lectures.map(async (lecture, lectureIndex) => {
      try {
        setCurrentGeneratingLecture(`Generating suite for Lecture ${lecture.lecture_number}: ${lecture.title}`);

        // Call the same edge function that GameSuiteBuilder uses
        const { data: gameData, error: gameError } = await supabase.functions.invoke('ai-game-generator', {
          body: {
            sessionNumber: selectedSession.session_number,
            lectureNumber: lecture.lecture_number,
            lectureContent: lecture.content || '',
            mode: 'batch', // This tells the edge function to generate a complete suite
            gameContexts: {} // Using default contexts like GameSuiteBuilder does
          }
        });

        if (gameError) throw gameError;

        if (!gameData || !gameData.games) {
          throw new Error('No game suite data returned from AI generator');
        }

        // Save all games from the suite to the database
        const gameInserts = gameData.games.map((game: any, index: number) => ({
          session_number: selectedSession.session_number,
          lecture_number: lecture.lecture_number,
          title: `${game.templateName}: Session ${selectedSession.session_number}, Lecture ${lecture.lecture_number}`,
          description: `Enhanced ${game.templateName.toLowerCase()} game targeting ${game.heuristicTargets.join(', ')}`,
          instructions: game.instructions,
          game_data: game.gameData,
          hints: game.hints,
          game_template_id: game.templateId,
          order_index: index,
          is_published: true,
          heuristic_targets: game.heuristicTargets,
          validation_rules: game.validationRules,
          win_conditions: game.winConditions
        }));

        const { error: saveError } = await supabase
          .from('lecture_games')
          .insert(gameInserts);

        if (saveError) throw saveError;

        // Update UI immediately for this lecture
        setLectureGameSuites((prev) => {
          const updated = [...prev];
          updated[lectureIndex] = {
            ...updated[lectureIndex],
            status: 'completed',
            gamesCreated: gameData.games.length
          };
          return updated;
        });

        successCount++;
        setCurrentGeneratingLecture(`Completed: Lecture ${lecture.lecture_number} - ${gameData.games.length} games created`);
      } catch (err: any) {
        console.error(`Error generating game suite for lecture ${lecture.lecture_number}:`, err);
        const message = err?.message || 'Failed to generate game suite';

        setLectureGameSuites((prev) => {
          const updated = [...prev];
          updated[lectureIndex] = {
            ...updated[lectureIndex],
            status: 'error',
            error: message
          };
          return updated;
        });

        setCurrentGeneratingLecture(`Error: Lecture ${lecture.lecture_number} - ${message}`);
      } finally {
        completedCount++;
        setGenerationProgress((completedCount / totalLectures) * 100);
      }
    });

    try {
      await Promise.allSettled(tasks);
      toast({
        title: "Generation Complete",
        description: `Generated complete game suites for ${successCount} out of ${totalLectures} lectures in ${selectedSession.title}`,
      });
    } catch (error) {
      console.error('Error in batch generation:', error);
      toast({
        title: "Generation Error",
        description: "Failed to complete game suite generation",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setCurrentGeneratingLecture('');
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
        <Zap className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Session Game Suite Generator</h1>
      </div>

      {/* Course and Session Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Course and Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Course</label>
            <Select onValueChange={(value) => {
              const course = courses.find(c => c.id === value);
              setSelectedCourse(course || null);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a course..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCourse && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Session</label>
              <Select onValueChange={(value) => {
                const session = sessions.find(s => s.id === value);
                setSelectedSession(session || null);
                setLectureGameSuites([]);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a session to generate complete game suites for..." />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      Session {session.session_number}: {session.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedSession && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">{selectedSession.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{selectedSession.theme}</p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  {lectures.length} lectures • Complete game suite for each (3 games per lecture)
                </div>
                <Button 
                  onClick={generateAllGameSuites}
                  disabled={isGenerating || lectures.length === 0}
                  className="flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  {isGenerating ? 'Generating...' : 'Generate Complete Game Suites'}
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
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Generation Progress</span>
                <span>{Math.round(generationProgress)}%</span>
              </div>
              <Progress value={generationProgress} />
              {currentGeneratingLecture && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  {currentGeneratingLecture}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Game Suites Display */}
      {lectureGameSuites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Game Suites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lectureGameSuites.map((lectureSuite, index) => (
                <Card key={index} className="border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Lecture {lectureSuite.lectureNumber}: {lectureSuite.lectureTitle}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(lectureSuite.status)}
                        <Badge className={getStatusColor(lectureSuite.status)}>
                          {lectureSuite.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {lectureSuite.status === 'completed' && (
                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          ✅ Complete game suite generated: {lectureSuite.gamesCreated} games created
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Games include: Critical Decision Path, Problem Analysis Web, and System Mapping
                        </div>
                        <Button size="sm" asChild>
                          <a href={`/admin?view=games&session=${selectedSession?.session_number}&lecture=${lectureSuite.lectureNumber}`} target="_blank" rel="noopener noreferrer">
                            View Games for This Lecture
                          </a>
                        </Button>
                      </div>
                    )}
                    {lectureSuite.status === 'error' && (
                      <div className="text-red-600 text-sm">
                        Error: {lectureSuite.error}
                      </div>
                    )}
                    {lectureSuite.status === 'generating' && (
                      <div className="text-blue-600 text-sm">
                        Generating complete game suite...
                      </div>
                    )}
                    {lectureSuite.status === 'pending' && (
                      <div className="text-gray-500 text-sm">
                        Waiting to generate...
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}