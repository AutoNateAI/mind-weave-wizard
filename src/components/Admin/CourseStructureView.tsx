import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  PlayCircle, 
  Edit3, 
  Save, 
  ChevronRight, 
  ChevronDown,
  Wand2,
  FileText,
  MessageSquare,
  HelpCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CourseStructureViewProps {
  courseId?: string;
}

export function CourseStructureView({ courseId }: CourseStructureViewProps) {
  const [courseData, setCourseData] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      console.log('🔍 Loading course data for courseId:', courseId);
      
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();

      if (courseError) {
        console.error('❌ Course error:', courseError);
        throw courseError;
      }
      
      if (!course) {
        console.log('⚠️ No course found for ID:', courseId);
        setCourseData(null);
        return;
      }
      
      console.log('✅ Course loaded:', course);

      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions_dynamic')
        .select(`
          *,
          lectures_dynamic (*)
        `)
        .eq('course_id', courseId)
        .order('order_index');

      if (sessionsError) throw sessionsError;

      setCourseData({ ...course, sessions });
    } catch (error) {
      console.error('Error loading course data:', error);
      toast.error('Failed to load course data');
    }
  };

  const handleEdit = (itemId: string, currentText: string) => {
    setEditingItem(itemId);
    setEditText(currentText);
  };

  const handleSave = async (itemType: string, itemId: string) => {
    try {
      let tableName: string;
      if (itemType === 'course') tableName = 'courses';
      else if (itemType === 'session') tableName = 'sessions_dynamic';
      else if (itemType === 'lecture') tableName = 'lectures_dynamic';
      else throw new Error('Invalid item type');

      const { error } = await supabase
        .from(tableName as any)
        .update({ title: editText })
        .eq('id', itemId);

      if (error) throw error;

      toast.success('Updated successfully');
      setEditingItem(null);
      loadCourseData();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save changes');
    }
  };

  const generateContent = async (lectureId: string, lectureTitle: string, sessionTheme: string) => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('ai-course-generator', {
        body: {
          action: 'generate_content',
          payload: {
            lectureId,
            lectureTitle,
            sessionTheme
          }
        }
      });

      if (response.error) throw response.error;

      toast.success('Content generated successfully!');
      loadCourseData();
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSession = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  if (!courseData) {
    return (
      <Card className="p-8 text-center">
        <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Course Selected</h3>
        <p className="text-muted-foreground">
          Create a new course or select an existing one to view its structure.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-card to-card/80 border-primary/20">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            {editingItem === `course-${courseData.id}` ? (
              <div className="flex items-center gap-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="text-2xl font-bold bg-transparent border-primary/50"
                />
                <Button onClick={() => handleSave('courses', courseData.id)} size="sm">
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{courseData.title}</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(`course-${courseData.id}`, courseData.title)}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
            )}
            <p className="text-muted-foreground">{courseData.description}</p>
          </div>
          <Badge variant="secondary">{courseData.status}</Badge>
        </div>
      </Card>

      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {courseData.sessions?.map((session: any) => (
            <Card key={session.id} className="overflow-hidden">
              <Collapsible
                open={expandedSessions.has(session.id)}
                onOpenChange={() => toggleSession(session.id)}
              >
                <CollapsibleTrigger asChild>
                  <div className="p-4 hover:bg-accent/50 cursor-pointer transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedSessions.has(session.id) ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                        <Badge variant="outline">Session {session.session_number}</Badge>
                        <h3 className="font-semibold">{session.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{session.lectures_dynamic?.length || 0} lectures</Badge>
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <Separator />
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">{session.description}</p>
                    
                    <div className="space-y-2">
                      {session.lectures_dynamic?.map((lecture: any) => (
                        <Card key={lecture.id} className="p-3 bg-accent/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <PlayCircle className="w-4 h-4 text-primary" />
                              <span className="font-medium">Lecture {lecture.lecture_number}</span>
                              <span>{lecture.title}</span>
                              <Badge variant="outline" className="text-xs">
                                {lecture.estimated_duration_minutes}min
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => generateContent(lecture.id, lecture.title, session.theme)}
                                disabled={isLoading}
                              >
                                <Wand2 className="w-4 h-4" />
                                Generate Content
                              </Button>
                              <Button variant="ghost" size="sm">
                                <FileText className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <HelpCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}