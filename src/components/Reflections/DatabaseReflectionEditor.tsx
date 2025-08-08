import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { MultipleChoiceQuiz } from "@/components/Quiz/MultipleChoiceQuiz";
import { ReflectionQuestions } from "@/components/Reflections/ReflectionQuestions";
import { Separator } from "@/components/ui/separator";

type DatabaseReflectionEditorProps = {
  prompt: string;
  sessionNumber: number;
  lectureNumber: number;
  onWritten?: () => void;
};

export function DatabaseReflectionEditor({ 
  prompt, 
  sessionNumber, 
  lectureNumber, 
  onWritten 
}: DatabaseReflectionEditorProps) {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Simple loading state
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-md"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quiz Section - No height constraints, shows all questions */}
      <div>
        <MultipleChoiceQuiz 
          sessionNumber={sessionNumber} 
          lectureNumber={lectureNumber} 
        />
      </div>

      <Separator />

      {/* Reflection Questions Section - Now in its own container */}
      <div>
        <ReflectionQuestions 
          sessionNumber={sessionNumber} 
          lectureNumber={lectureNumber} 
          onWritten={onWritten}
        />
      </div>
    </div>
  );
}