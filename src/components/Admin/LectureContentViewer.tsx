import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  FileText, 
  MessageSquare, 
  HelpCircle, 
  Zap, 
  Edit3, 
  Save, 
  Loader2,
  Presentation,
  StickyNote
} from "lucide-react";

interface LectureContent {
  slides: any[];
  flashcards: any[];
  reflections: any[];
  mcq: any[];
}

interface LectureContentViewerProps {
  lectureId: string;
  lectureTitle: string;
  sessionNumber: number;
  lectureNumber: number;
  onContentUpdate?: () => void;
}

export function LectureContentViewer({ 
  lectureId, 
  lectureTitle, 
  sessionNumber, 
  lectureNumber,
  onContentUpdate 
}: LectureContentViewerProps) {
  const [content, setContent] = useState<LectureContent>({
    slides: [],
    flashcards: [],
    reflections: [],
    mcq: []
  });
  const [loading, setLoading] = useState(true);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [editText, setEditText] = useState('');
  const [aiEditPrompt, setAiEditPrompt] = useState('');
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [showAiEditModal, setShowAiEditModal] = useState(false);

  useEffect(() => {
    loadContent();
  }, [lectureId]);

  const loadContent = async () => {
    try {
      setLoading(true);

      // Load slides
      const { data: slides } = await supabase
        .from('lecture_slides')
        .select('*')
        .eq('lecture_id', lectureId)
        .order('slide_number');

      // Load flashcards
      const { data: flashcards } = await supabase
        .from('flashcards')
        .select('*')
        .eq('session_number', sessionNumber)
        .eq('lecture_number', lectureNumber)
        .order('order_index');

      // Load reflections
      const { data: reflections } = await supabase
        .from('reflection_questions')
        .select('*')
        .eq('session_number', sessionNumber)
        .eq('lecture_number', lectureNumber)
        .order('question_number');

      // Load MCQ
      const { data: mcq } = await supabase
        .from('multiple_choice_questions')
        .select('*')
        .eq('session_number', sessionNumber)
        .eq('lecture_number', lectureNumber);

      setContent({
        slides: slides || [],
        flashcards: flashcards || [],
        reflections: reflections || [],
        mcq: mcq || []
      });
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectEdit = (item: any, field: string) => {
    setEditingContent({ ...item, field });
    setEditText(item[field] || '');
  };

  const handleSaveDirectEdit = async () => {
    if (!editingContent) return;

    try {
      const { field, ...item } = editingContent;
      let tableName = '';
      
      if ('slide_number' in item) tableName = 'lecture_slides';
      else if ('concept_type' in item) tableName = 'flashcards';
      else if ('question_number' in item) tableName = 'reflection_questions';
      else if ('correct_option' in item) tableName = 'multiple_choice_questions';

      const { error } = await supabase
        .from(tableName as any)
        .update({ [field]: editText })
        .eq('id', item.id);

      if (error) throw error;

      toast.success('Content updated successfully');
      setEditingContent(null);
      setEditText('');
      loadContent();
      onContentUpdate?.();
    } catch (error) {
      console.error('Error updating content:', error);
      toast.error('Failed to update content');
    }
  };

  const handleAiEdit = (item: any) => {
    setEditingContent(item);
    setShowAiEditModal(true);
  };

  const handleAiEditSubmit = async () => {
    if (!editingContent || !aiEditPrompt.trim()) return;

    try {
      setIsAiEditing(true);
      
      const { data, error } = await supabase.functions.invoke('ai-course-generator', {
        body: {
          action: 'edit_content',
          content: editingContent,
          prompt: aiEditPrompt,
          sessionNumber,
          lectureNumber,
          lectureTitle
        }
      });

      if (error) throw error;

      toast.success('Content updated with AI');
      setShowAiEditModal(false);
      setAiEditPrompt('');
      setEditingContent(null);
      loadContent();
      onContentUpdate?.();
    } catch (error) {
      console.error('Error with AI edit:', error);
      toast.error('Failed to update content with AI');
    } finally {
      setIsAiEditing(false);
    }
  };

  const renderSlideContent = (slide: any) => (
    <Card key={slide.id} className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Presentation className="w-4 h-4" />
          <Badge variant="outline">Slide {slide.slide_number}</Badge>
          <span className="font-medium">
            {editingContent?.id === slide.id && editingContent?.field === 'title' ? (
              <div className="flex items-center gap-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[40px]"
                />
                <Button size="sm" onClick={handleSaveDirectEdit}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <span 
                className="cursor-pointer hover:bg-accent rounded px-2 py-1"
                onClick={() => handleDirectEdit(slide, 'title')}
              >
                {slide.title}
              </span>
            )}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAiEdit(slide)}
          className="gap-2"
        >
          <Zap className="w-4 h-4" />
          AI Edit
        </Button>
      </div>
      
      <div className="space-y-2">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Content:</label>
          {editingContent?.id === slide.id && editingContent?.field === 'content' ? (
            <div className="space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[100px]"
              />
              <Button size="sm" onClick={handleSaveDirectEdit}>
                <Save className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div 
              className="p-2 rounded border cursor-pointer hover:bg-accent whitespace-pre-wrap"
              onClick={() => handleDirectEdit(slide, 'content')}
            >
              {slide.content}
            </div>
          )}
        </div>
        
        {slide.speaker_notes && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Speaker Notes:</label>
            {editingContent?.id === slide.id && editingContent?.field === 'speaker_notes' ? (
              <div className="space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button size="sm" onClick={handleSaveDirectEdit}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div 
                className="p-2 rounded border cursor-pointer hover:bg-accent text-sm text-muted-foreground"
                onClick={() => handleDirectEdit(slide, 'speaker_notes')}
              >
                {slide.speaker_notes}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );

  const renderFlashcardContent = (flashcard: any) => (
    <Card key={flashcard.id} className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4" />
          <Badge variant="outline">{flashcard.concept_type}</Badge>
          <span className="font-medium">
            {editingContent?.id === flashcard.id && editingContent?.field === 'title' ? (
              <div className="flex items-center gap-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[40px]"
                />
                <Button size="sm" onClick={handleSaveDirectEdit}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <span 
                className="cursor-pointer hover:bg-accent rounded px-2 py-1"
                onClick={() => handleDirectEdit(flashcard, 'title')}
              >
                {flashcard.title}
              </span>
            )}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAiEdit(flashcard)}
          className="gap-2"
        >
          <Zap className="w-4 h-4" />
          AI Edit
        </Button>
      </div>
      
      <div>
        <label className="text-sm font-medium text-muted-foreground">Content:</label>
        {editingContent?.id === flashcard.id && editingContent?.field === 'content' ? (
          <div className="space-y-2">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="min-h-[80px]"
            />
            <Button size="sm" onClick={handleSaveDirectEdit}>
              <Save className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div 
            className="p-2 rounded border cursor-pointer hover:bg-accent"
            onClick={() => handleDirectEdit(flashcard, 'content')}
          >
            {flashcard.content}
          </div>
        )}
      </div>
    </Card>
  );

  const renderReflectionContent = (reflection: any) => (
    <Card key={reflection.id} className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          <Badge variant="outline">Question {reflection.question_number}</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAiEdit(reflection)}
          className="gap-2"
        >
          <Zap className="w-4 h-4" />
          AI Edit
        </Button>
      </div>
      
      <div>
        <label className="text-sm font-medium text-muted-foreground">Question:</label>
        {editingContent?.id === reflection.id && editingContent?.field === 'question_text' ? (
          <div className="space-y-2">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="min-h-[80px]"
            />
            <Button size="sm" onClick={handleSaveDirectEdit}>
              <Save className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div 
            className="p-2 rounded border cursor-pointer hover:bg-accent"
            onClick={() => handleDirectEdit(reflection, 'question_text')}
          >
            {reflection.question_text}
          </div>
        )}
      </div>
    </Card>
  );

  const renderMCQContent = (mcq: any) => (
    <Card key={mcq.id} className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4" />
          <Badge variant="outline">Multiple Choice</Badge>
          <Badge variant="secondary">Answer: {mcq.correct_option}</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAiEdit(mcq)}
          className="gap-2"
        >
          <Zap className="w-4 h-4" />
          AI Edit
        </Button>
      </div>
      
      <div className="space-y-2">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Question:</label>
          {editingContent?.id === mcq.id && editingContent?.field === 'question_text' ? (
            <div className="space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[60px]"
              />
              <Button size="sm" onClick={handleSaveDirectEdit}>
                <Save className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div 
              className="p-2 rounded border cursor-pointer hover:bg-accent"
              onClick={() => handleDirectEdit(mcq, 'question_text')}
            >
              {mcq.question_text}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {['option_a', 'option_b', 'option_c', 'option_d'].map((option, index) => (
            <div key={option}>
              <label className="text-xs font-medium text-muted-foreground">
                Option {String.fromCharCode(65 + index)}:
              </label>
              {editingContent?.id === mcq.id && editingContent?.field === option ? (
                <div className="space-y-1">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="min-h-[40px] text-sm"
                  />
                  <Button size="sm" onClick={handleSaveDirectEdit}>
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className={`p-2 rounded border cursor-pointer hover:bg-accent text-sm ${
                    mcq.correct_option === String.fromCharCode(65 + index) ? 'bg-green-50 border-green-200' : ''
                  }`}
                  onClick={() => handleDirectEdit(mcq, option)}
                >
                  {mcq[option]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const hasContent = content.slides.length > 0 || content.flashcards.length > 0 || 
                   content.reflections.length > 0 || content.mcq.length > 0;

  if (!hasContent) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No content generated yet for this lecture.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="slides" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="slides" className="gap-2">
            <FileText className="w-4 h-4" />
            Slides ({content.slides.length})
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="gap-2">
            <Zap className="w-4 h-4" />
            Flashcards ({content.flashcards.length})
          </TabsTrigger>
          <TabsTrigger value="reflections" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Reflections ({content.reflections.length})
          </TabsTrigger>
          <TabsTrigger value="mcq" className="gap-2">
            <HelpCircle className="w-4 h-4" />
            Quiz ({content.mcq.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="slides">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {content.slides.map(renderSlideContent)}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="flashcards">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {content.flashcards.map(renderFlashcardContent)}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="reflections">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {content.reflections.map(renderReflectionContent)}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="mcq">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {content.mcq.map(renderMCQContent)}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* AI Edit Modal */}
      <Dialog open={showAiEditModal} onOpenChange={setShowAiEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              AI Content Editor
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">What would you like to change?</label>
              <Textarea
                value={aiEditPrompt}
                onChange={(e) => setAiEditPrompt(e.target.value)}
                placeholder="Describe the changes you want to make to this content..."
                className="mt-2 min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAiEditModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAiEditSubmit}
              disabled={!aiEditPrompt.trim() || isAiEditing}
              className="gap-2"
            >
              {isAiEditing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Update with AI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}