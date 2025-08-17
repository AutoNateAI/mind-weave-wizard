import { useParams, Link, useNavigate } from "react-router-dom";
import { LessonStructure } from "@/components/Lessons/LessonStructure";
import { FlowCanvas } from "@/components/GraphEditor/FlowCanvas";
import { useProgress } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageMeta } from "@/components/UI/PageMeta";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, LogOut, BarChart3, User } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import flowData from "@/flows/session1Flow.json";
import { useEffect, useState } from "react";

export default function SessionPage() {
  const { sessionNumber } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const n = Number(sessionNumber || 1);
  const { markLecture, markGame, markReflection, isCompleted } = useProgress();
  
  const [sessionData, setSessionData] = useState<any>(null);
  const [lectures, setLectures] = useState<any[]>([]);
  const [reflectionQuestions, setReflectionQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Get current tab from URL or default to lecture1
  const [currentLecture, setCurrentLecture] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('lecture') || 'lecture1';
  });

  const handleTabChange = (value: string) => {
    setCurrentLecture(value);
    const url = new URL(window.location.href);
    url.searchParams.set('lecture', value);
    window.history.replaceState({}, '', url.toString());
  };

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        // Fetch session data
        const { data: session } = await supabase
          .from('sessions_dynamic')
          .select('*')
          .eq('session_number', n)
          .single();

        // Fetch lectures for this session
        const { data: lecturesData } = await supabase
          .from('lectures_dynamic')
          .select('*')
          .eq('session_id', session?.id)
          .order('lecture_number');

        // Fetch reflection questions for this session
        const { data: reflectionsData } = await supabase
          .from('reflection_questions')
          .select('*')
          .eq('session_number', n)
          .order('lecture_number', { ascending: true });

        setSessionData(session);
        setLectures(lecturesData || []);
        setReflectionQuestions(reflectionsData || []);
      } catch (error) {
        console.error('Error fetching session data:', error);
        toast({
          title: "Error loading session",
          description: "Failed to load session data from database",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [n, toast]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Error signing out", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Signed out successfully" });
      navigate("/");
    }
  };

  const initial = n === 1 ? flowData : { nodes: [], edges: [] };
  const completed = isCompleted(n);

  if (loading) {
    return (
      <main className="container py-10 space-y-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading session...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!sessionData) {
    return (
      <main className="container py-10 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Session not found</h1>
          <Button asChild>
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-10 space-y-8">
      <PageMeta title={`Session ${n} — ${sessionData.theme || sessionData.title}`} description={`Thinking Wizard Session ${n}: ${sessionData.theme || sessionData.title}`} />
      
      {/* Navigation Header */}
      <div className="flex justify-between items-center">
        <Button variant="outline" asChild className="hover-scale">
          <Link to="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard", { state: { showAnalytics: true } })}
            className="hover-scale flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Button>
          <Button variant="outline" asChild className="hover-scale">
            <Link to="/profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </Link>
          </Button>
          <ThemeToggle />
          <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2 hover-scale">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Session {n} Theme</p>
        <h1 className="text-3xl font-bold gradient-text">{sessionData.theme || sessionData.title}</h1>
      </header>

      {/* New 3-Lecture Structure */}
      <Tabs value={currentLecture} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 gap-1">
          <TabsTrigger value="lecture1" className="text-xs sm:text-sm px-2 py-2 min-w-0">
            <span className="truncate block w-full">{lectures.find(l => l.lecture_number === 1)?.title || "Lecture 1"}</span>
          </TabsTrigger>
          <TabsTrigger value="lecture2" className="text-xs sm:text-sm px-2 py-2 min-w-0">
            <span className="truncate block w-full">{lectures.find(l => l.lecture_number === 2)?.title || "Lecture 2"}</span>
          </TabsTrigger>
          <TabsTrigger value="lecture3" className="text-xs sm:text-sm px-2 py-2 min-w-0">
            <span className="truncate block w-full">{lectures.find(l => l.lecture_number === 3)?.title || "Lecture 3"}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lecture1" className="space-y-4">
          <LessonStructure
            sessionNumber={n}
            lectureNumber={1}
            lectureTitle={lectures.find(l => l.lecture_number === 1)?.title || "Lecture 1"}
            gameComponent={
              <FlowCanvas
                storageKey={`session-${n}-game-1`}
                initialNodes={initial.nodes}
                initialEdges={initial.edges}
                onSave={() => markGame(n)}
              />
            }
            reflectionPrompt={reflectionQuestions.find(q => q.lecture_number === 1)?.question_text || "Reflect on this lesson..."}
            onComplete={() => markLecture(n)}
          />
        </TabsContent>

        <TabsContent value="lecture2" className="space-y-4">
          <LessonStructure
            sessionNumber={n}
            lectureNumber={2}
            lectureTitle={lectures.find(l => l.lecture_number === 2)?.title || "Lecture 2"}
            gameComponent={
              <FlowCanvas storageKey={`session-${n}-game-2`} onSave={() => markGame(n)} />
            }
            reflectionPrompt={reflectionQuestions.find(q => q.lecture_number === 2)?.question_text || "Reflect on this lesson..."}
            onComplete={() => markReflection(n)}
          />
        </TabsContent>

        <TabsContent value="lecture3" className="space-y-4">
          <LessonStructure
            sessionNumber={n}
            lectureNumber={3}
            lectureTitle={lectures.find(l => l.lecture_number === 3)?.title || "Lecture 3"}
            gameComponent={
              <FlowCanvas storageKey={`session-${n}-game-3`} onSave={() => markGame(n)} />
            }
            reflectionPrompt={reflectionQuestions.find(q => q.lecture_number === 3)?.question_text || "Reflect on this lesson..."}
            onComplete={() => markReflection(n)}
          />
        </TabsContent>
      </Tabs>

      {completed && (
        <div className="glass rounded-md p-4 flex items-center justify-between">
          <p className="text-sm">Session complete! {n < 10 ? `Session ${n + 1} unlocked.` : "You finished the journey!"}</p>
          <div className="flex gap-2">
            <Button asChild><Link to="/dashboard">Back to Dashboard</Link></Button>
            {n < 10 && (
              <Button variant="secondary" asChild><Link to={`/session/${n + 1}`}>Next Session</Link></Button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
