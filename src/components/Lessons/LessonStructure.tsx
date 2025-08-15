import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlashcardViewer } from "@/components/Flashcards/FlashcardViewer";
import { DatabaseReflectionEditor } from "@/components/Reflections/DatabaseReflectionEditor";
import { LectureGameViewer } from "@/components/Games/LectureGameViewer";
import { SlideViewer } from "@/components/Slides/SlideViewer";
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

      <Tabs defaultValue="slides" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="slides" className="text-xs sm:text-sm">🎯 <span className="hidden sm:inline">Slides</span></TabsTrigger>
          <TabsTrigger value="concepts" className="text-xs sm:text-sm">📚 <span className="hidden sm:inline">Concepts</span></TabsTrigger>
          <TabsTrigger value="game" className="text-xs sm:text-sm">🎮 <span className="hidden sm:inline">Interactive</span></TabsTrigger>
          <TabsTrigger value="reflection" className="text-xs sm:text-sm">💭 <span className="hidden sm:inline">Reflection</span></TabsTrigger>
        </TabsList>

        <TabsContent value="slides" className="space-y-4">
          <div className="glass rounded-lg p-3 sm:p-6">
            <SlideViewer
              sessionNumber={sessionNumber}
              lectureNumber={lectureNumber}
            />
          </div>
        </TabsContent>

        <TabsContent value="concepts" className="space-y-4">
          <div className="glass rounded-lg p-3 sm:p-6 h-[calc(100vh-20rem)] sm:h-[calc(100vh-18rem)] lg:h-[calc(100vh-14rem)] flex flex-col">
            <FlashcardViewer 
              sessionNumber={sessionNumber} 
              lectureNumber={lectureNumber} 
            />
          </div>
        </TabsContent>

        <TabsContent value="game" className="space-y-4">
          <div className="glass rounded-lg p-3 sm:p-6 h-screen">
            <LectureGameViewer 
              sessionNumber={sessionNumber}
              lectureNumber={lectureNumber}
            />
          </div>
        </TabsContent>

        <TabsContent value="reflection" className="space-y-4">
          <div className="glass rounded-lg p-3 sm:p-6 h-[calc(100vh-20rem)] sm:h-[calc(100vh-18rem)] lg:h-[calc(100vh-14rem)] overflow-y-auto">
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