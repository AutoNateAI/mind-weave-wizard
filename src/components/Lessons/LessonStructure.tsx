import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlashcardViewer } from "@/components/Flashcards/FlashcardViewer";
import { DatabaseReflectionEditor } from "@/components/Reflections/DatabaseReflectionEditor";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

type LessonStructureProps = {
  sessionNumber: number;
  lectureNumber: number;
  lectureTitle: string;
  gameComponent?: ReactNode;
  reflectionPrompt: string;
  onComplete?: () => void;
};

export function LessonStructure({
  sessionNumber,
  lectureNumber,
  lectureTitle,
  gameComponent,
  reflectionPrompt,
  onComplete
}: LessonStructureProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold gradient-text">{lectureTitle}</h2>
        <p className="text-muted-foreground">Explore concepts, play, and reflect</p>
      </div>

      <Tabs defaultValue="concepts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="concepts" className="text-xs sm:text-sm">📚 <span className="hidden sm:inline">Concepts</span></TabsTrigger>
          <TabsTrigger value="game" className="text-xs sm:text-sm">🎮 <span className="hidden sm:inline">Interactive</span></TabsTrigger>
          <TabsTrigger value="reflection" className="text-xs sm:text-sm">💭 <span className="hidden sm:inline">Reflection</span></TabsTrigger>
        </TabsList>

        <TabsContent value="concepts" className="space-y-4">
          <div className="glass rounded-lg p-3 sm:p-6 h-[calc(100vh-20rem)] sm:h-[calc(100vh-24rem)] flex flex-col">
            <FlashcardViewer 
              sessionNumber={sessionNumber} 
              lectureNumber={lectureNumber} 
            />
          </div>
        </TabsContent>

        <TabsContent value="game" className="space-y-4">
          <div className="glass rounded-lg p-3 sm:p-6 h-[calc(100vh-20rem)] sm:h-[calc(100vh-24rem)]">
            {gameComponent || (
              <div className="text-center py-12 space-y-4">
                <Play className="w-16 h-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Interactive Experience</h3>
                  <p className="text-muted-foreground mb-4">
                    This section will contain an interactive game or exercise to practice the concepts.
                  </p>
                  <Button variant="outline" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reflection" className="space-y-4">
          <div className="glass rounded-lg p-3 sm:p-6 h-[calc(100vh-20rem)] sm:h-[calc(100vh-24rem)]">
            <DatabaseReflectionEditor
              prompt={reflectionPrompt}
              sessionNumber={sessionNumber}
              lectureNumber={lectureNumber}
              onWritten={onComplete}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}