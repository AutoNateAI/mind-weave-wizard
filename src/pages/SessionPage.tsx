import { useParams, Link, useNavigate } from "react-router-dom";
import { sessions } from "@/content/sessions";
import { LectureList } from "@/components/Lectures/LectureCard";
import { ReflectionEditor } from "@/components/Reflections/ReflectionEditor";
import { FlowCanvas } from "@/components/GraphEditor/FlowCanvas";
import { useProgress } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageMeta } from "@/components/UI/PageMeta";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, LogOut } from "lucide-react";
import flowData from "@/flows/session1Flow.json";

export default function SessionPage() {
  const { sessionNumber } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const n = Number(sessionNumber || 1);
  const session = sessions.find((s) => s.number === n)!;
  const { markLecture, markGame, markReflection, isCompleted } = useProgress();

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

  return (
    <main className="container py-10 space-y-8">
      <PageMeta title={`Session ${n} — ${session.theme}`} description={`Thinking Wizard Session ${n}: ${session.theme}`} />
      
      {/* Navigation Header */}
      <div className="flex justify-between items-center">
        <Button variant="outline" asChild>
          <Link to="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/profile">Profile</Link>
          </Button>
          <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Session {n} Theme</p>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>{session.theme}</h1>
      </header>

      {/* Main Content organized in Tabs as per knowledge base */}
      <Tabs defaultValue="lectures" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lectures">Lectures</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="reflections">Reflections</TabsTrigger>
        </TabsList>

        <TabsContent value="lectures" className="space-y-4">
          <LectureList
            lectures={session.lectures}
            onComplete={() => markLecture(n)}
          />
        </TabsContent>

        <TabsContent value="games" className="space-y-4">
          <Tabs defaultValue="g1" className="w-full">
            <TabsList>
              <TabsTrigger value="g1">Game 1: Link the World</TabsTrigger>
              <TabsTrigger value="g2">Game 2: Hidden Network</TabsTrigger>
              <TabsTrigger value="g3">Game 3: Wizard's Web</TabsTrigger>
            </TabsList>
            <TabsContent value="g1" className="space-y-2">
              <p className="text-sm text-muted-foreground">Build, connect, explore.</p>
              <FlowCanvas
                storageKey={`session-${n}-game-1`}
                initialNodes={initial.nodes}
                initialEdges={initial.edges}
                onSave={() => markGame(n)}
              />
            </TabsContent>
            <TabsContent value="g2" className="space-y-2">
              <p className="text-sm text-muted-foreground">Reveal hidden structures through exploration.</p>
              <FlowCanvas storageKey={`session-${n}-game-2`} onSave={() => markGame(n)} />
            </TabsContent>
            <TabsContent value="g3" className="space-y-2">
              <p className="text-sm text-muted-foreground">Map your personal mental web.</p>
              <FlowCanvas storageKey={`session-${n}-game-3`} onSave={() => markGame(n)} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="reflections" className="space-y-4">
          {session.reflections.map((prompt, i) => (
            <ReflectionEditor
              key={i}
              prompt={prompt}
              storageKey={`session-${n}-reflection-${i + 1}`}
              onWritten={() => markReflection(n)}
            />
          ))}
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
