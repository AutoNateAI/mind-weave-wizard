import { useParams, Link } from "react-router-dom";
import { sessions } from "@/content/sessions";
import { LectureList } from "@/components/Lectures/LectureCard";
import { ReflectionEditor } from "@/components/Reflections/ReflectionEditor";
import { FlowCanvas } from "@/components/GraphEditor/FlowCanvas";
import { useProgress } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageMeta } from "@/components/UI/PageMeta";
import flowData from "@/flows/session1Flow.json";

export default function SessionPage() {
  const { sessionNumber } = useParams();
  const n = Number(sessionNumber || 1);
  const session = sessions.find((s) => s.number === n)!;
  const { markLecture, markGame, markReflection, isCompleted } = useProgress();

  const initial = n === 1 ? flowData : { nodes: [], edges: [] };

  const completed = isCompleted(n);

  return (
    <main className="container py-10 space-y-8">
      <PageMeta title={`Session ${n} — ${session.theme}`} description={`Thinking Wizard Session ${n}: ${session.theme}`} />
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Theme</p>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>{session.theme}</h1>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-3">Lectures</h2>
        <LectureList
          lectures={session.lectures}
          onComplete={() => markLecture(n)}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Games</h2>
        <Tabs defaultValue="g1" className="w-full">
          <TabsList>
            <TabsTrigger value="g1">Game 1</TabsTrigger>
            <TabsTrigger value="g2">Game 2</TabsTrigger>
            <TabsTrigger value="g3">Game 3</TabsTrigger>
          </TabsList>
          <TabsContent value="g1">
            <FlowCanvas
              storageKey={`session-${n}-game-1`}
              initialNodes={initial.nodes}
              initialEdges={initial.edges}
              onSave={() => markGame(n)}
            />
          </TabsContent>
          <TabsContent value="g2">
            <FlowCanvas storageKey={`session-${n}-game-2`} onSave={() => markGame(n)} />
          </TabsContent>
          <TabsContent value="g3">
            <FlowCanvas storageKey={`session-${n}-game-3`} onSave={() => markGame(n)} />
          </TabsContent>
        </Tabs>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Reflections</h2>
        {session.reflections.map((prompt, i) => (
          <ReflectionEditor
            key={i}
            prompt={prompt}
            storageKey={`session-${n}-reflection-${i + 1}`}
            onWritten={() => markReflection(n)}
          />
        ))}
      </section>

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
