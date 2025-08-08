import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type ReflectionQuestion = {
  id: string;
  question_number: number;
  question_text: string;
};

type UserReflection = {
  reflection_question_id: string;
  reflection_content: string;
};

type ReflectionQuestionsProps = {
  sessionNumber: number;
  lectureNumber: number;
  onWritten?: () => void;
};

export function ReflectionQuestions({ sessionNumber, lectureNumber, onWritten }: ReflectionQuestionsProps) {
  const [questions, setQuestions] = useState<ReflectionQuestion[]>([]);
  const [userReflections, setUserReflections] = useState<UserReflection[]>([]);
  const [reflectionTexts, setReflectionTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [sessionNumber, lectureNumber]);

  const fetchData = async () => {
    try {
      // Fetch reflection questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('reflection_questions')
        .select('*')
        .eq('session_number', sessionNumber)
        .eq('lecture_number', lectureNumber)
        .order('question_number');

      if (questionsError) throw questionsError;

      // Fetch user's existing reflections
      const { data: session } = await supabase.auth.getSession();
      if (session.session?.user) {
        const questionIds = questionsData?.map(q => q.id) || [];
        const { data: reflectionsData, error: reflectionsError } = await supabase
          .from('user_reflections')
          .select('*')
          .eq('user_id', session.session.user.id)
          .in('reflection_question_id', questionIds);

        if (reflectionsError) throw reflectionsError;

        setUserReflections(reflectionsData || []);
        
        // Set initial text values
        const textsMap: Record<string, string> = {};
        reflectionsData?.forEach(reflection => {
          textsMap[reflection.reflection_question_id] = reflection.reflection_content || '';
        });
        setReflectionTexts(textsMap);
      }

      setQuestions(questionsData || []);
    } catch (error) {
      console.error('Error fetching reflection data:', error);
      toast({
        title: "Error loading reflections",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (questionId: string, text: string) => {
    setReflectionTexts(prev => ({
      ...prev,
      [questionId]: text
    }));
  };

  const handleSave = async (questionId: string) => {
    const text = reflectionTexts[questionId]?.trim();
    if (!text) return;

    setSavingStates(prev => ({ ...prev, [questionId]: true }));

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        toast({
          title: "Please sign in",
          description: "You need to be signed in to save reflections.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('user_reflections')
        .upsert({
          user_id: session.session.user.id,
          reflection_question_id: questionId,
          reflection_content: text,
          // Keep the session/lecture numbers for backwards compatibility
          session_number: sessionNumber,
          lecture_number: lectureNumber
        });

      if (error) throw error;

      // Update local state
      setUserReflections(prev => {
        const filtered = prev.filter(r => r.reflection_question_id !== questionId);
        return [...filtered, {
          reflection_question_id: questionId,
          reflection_content: text
        }];
      });

      toast({
        title: "Reflection saved",
        description: "Your reflection has been saved successfully."
      });

      onWritten?.();
    } catch (error) {
      console.error('Error saving reflection:', error);
      toast({
        title: "Error saving reflection",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSavingStates(prev => ({ ...prev, [questionId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="glass animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-24 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No reflection questions available for this lecture yet.</p>
        <p className="text-sm mt-2">Check back later!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Personal Reflection</h3>
        <p className="text-sm text-muted-foreground">
          Take time to deeply reflect on these questions about the concepts you've learned
        </p>
      </div>

      {questions.map((question) => {
        const currentText = reflectionTexts[question.id] || '';
        const isSaving = savingStates[question.id] || false;
        const hasContent = currentText.trim().length > 0;

        return (
          <Card key={question.id} className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                  {question.question_number}
                </span>
                <span className="flex-1">{question.question_text}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={currentText}
                onChange={(e) => handleTextChange(question.id, e.target.value)}
                placeholder="Write your reflection..."
                className="min-h-[100px] resize-none"
              />
              
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Your reflection will be saved with a timestamp
                </p>
                <Button 
                  onClick={() => handleSave(question.id)}
                  disabled={isSaving || !hasContent}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
