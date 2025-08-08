import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Save } from "lucide-react";

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
  const [saving, setSaving] = useState(false);
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

  const handleSave = useCallback(async () => {
    setSaving(true);
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
          reflection_content: text
        }, {
          onConflict: 'user_id,session_number,lecture_number'
        });

      if (error) {
        console.error('Error saving reflection:', error);
        toast({ title: "Error", description: "Failed to save reflection", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Reflection saved successfully!" });
        if (text.trim().length > 10) {
          onWritten?.();
        }
      }
    } catch (error) {
      console.error('Error saving reflection:', error);
      toast({ title: "Error", description: "Failed to save reflection", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [text, sessionNumber, lectureNumber, onWritten, toast]);

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
    <div className="h-full flex flex-col space-y-4">
      <Label className="text-sm text-muted-foreground">{prompt}</Label>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your reflection…"
        className="flex-1 min-h-[200px] md:min-h-[300px] glass resize-none"
      />
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">Click Save to store your reflection</p>
        <Button 
          onClick={handleSave} 
          disabled={saving || text.trim().length === 0}
          size="sm"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}