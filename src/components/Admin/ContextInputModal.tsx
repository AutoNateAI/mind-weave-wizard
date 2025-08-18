import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

interface ContextInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (contextualInfo: string) => void;
  title: string;
  courseId?: string;
}

export function ContextInputModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title,
  courseId 
}: ContextInputModalProps) {
  const [contextualInfo, setContextualInfo] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [courseContextSeed, setCourseContextSeed] = useState("");

  const enhanceWithAI = async () => {
    if (!contextualInfo.trim()) {
      toast.error("Please enter some contextual information first");
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await supabase.functions.invoke('ai-course-generator', {
        body: {
          action: 'enhance_context',
          payload: {
            contextualInfo,
            courseId
          }
        }
      });

      if (response.error) {
        throw response.error;
      }

      const enhancedContext = response.data?.enhancedContext;
      if (enhancedContext) {
        setContextualInfo(enhancedContext);
        toast.success("Context enhanced with AI insights!");
      }
    } catch (error) {
      console.error('Error enhancing context:', error);
      toast.error('Failed to enhance context with AI');
    } finally {
      setIsEnhancing(false);
    }
  };

  const saveCourseContextSeed = async () => {
    if (!courseId || !contextualInfo.trim()) return;

    try {
      const { error } = await supabase
        .from('courses')
        .update({ 
          context_seed: contextualInfo,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId);

      if (error) throw error;

      setCourseContextSeed(contextualInfo);
      toast.success("Course context seed saved!");
    } catch (error) {
      console.error('Error saving context seed:', error);
      toast.error('Failed to save context seed');
    }
  };

  const handleConfirm = () => {
    if (!contextualInfo.trim()) {
      toast.error("Please provide contextual information");
      return;
    }

    // Save context seed before proceeding
    if (courseId) {
      saveCourseContextSeed();
    }

    onConfirm(contextualInfo);
    onClose();
  };

  const handleClose = () => {
    setContextualInfo("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="contextual-info" className="text-sm font-medium">
              Contextual Information
            </Label>
            <Textarea
              id="contextual-info"
              placeholder="Describe the target audience, learning objectives, specific context, tone, or any other details that should guide the content generation..."
              value={contextualInfo}
              onChange={(e) => setContextualInfo(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={enhanceWithAI}
                disabled={isEnhancing || !contextualInfo.trim()}
                className="flex items-center gap-2"
              >
                {isEnhancing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isEnhancing ? "Enhancing..." : "Enhance with AI"}
              </Button>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">💡 Tips for Better Context:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Describe your target audience (e.g., "business professionals", "students new to critical thinking")</li>
              <li>• Specify the desired tone (e.g., "conversational and engaging", "academic but accessible")</li>
              <li>• Mention real-world applications or examples to include</li>
              <li>• Note any specific learning objectives or outcomes</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!contextualInfo.trim()}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            >
              Generate Content
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}