import { useState, useCallback, useEffect } from "react";
import { useAutosave } from "@/hooks/useAutosave";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

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
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load existing reflection on mount
  useEffect(() => {
    const loadReflection = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('user_reflections')
          .select('reflection_content')
          .eq('user_id', user.id)
          .eq('session_number', sessionNumber)
          .eq('lecture_number', lectureNumber)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading reflection:', error);
        } else if (data) {
          setText(data.reflection_content || "");
        }
      } catch (error) {
        console.error('Error loading reflection:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReflection();
  }, [sessionNumber, lectureNumber]);

  const save = useCallback(async (val: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "You must be logged in to save reflections", variant: "destructive" });
        return;
      }

      const { error } = await supabase
        .from('user_reflections')
        .upsert({
          user_id: user.id,
          session_number: sessionNumber,
          lecture_number: lectureNumber,
          reflection_content: val
        }, {
          onConflict: 'user_id,session_number,lecture_number'
        });

      if (error) {
        console.error('Error saving reflection:', error);
        toast({ title: "Error", description: "Failed to save reflection", variant: "destructive" });
      } else if (val.trim().length > 10) {
        onWritten?.();
      }
    } catch (error) {
      console.error('Error saving reflection:', error);
      toast({ title: "Error", description: "Failed to save reflection", variant: "destructive" });
    }
  }, [sessionNumber, lectureNumber, onWritten, toast]);

  useAutosave(text, save, 700);

  if (loading) {
    return (
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">{prompt}</Label>
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-md"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">{prompt}</Label>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your reflection…"
        className="min-h-[120px] glass"
      />
      <p className="text-xs text-muted-foreground">Automatically saved to database…</p>
    </div>
  );
}