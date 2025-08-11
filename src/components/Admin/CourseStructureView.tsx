import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  HelpCircle,
  Zap,
  Loader2
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalLectures, setTotalLectures] = useState(0);
  const [completedLectures, setCompletedLectures] = useState(0);
  const [generatingLectures, setGeneratingLectures] = useState<Set<string>>(new Set());
  const [generatingSessions, setGeneratingSessions] = useState<Set<string>>(new Set());
  const [sessionProgress, setSessionProgress] = useState<Record<string, number>>({});

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

      setCourseData({ ...course, sessions_dynamic: sessions });
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

  const generateContent = async (lectureId: string, lectureTitle: string, sessionTheme: string, sessionNumber?: number, lectureNumber?: number) => {
    setGeneratingLectures(prev => new Set([...prev, lectureId]));
    
    try {
      console.log('🎯 Generating content for lecture:', lectureId, lectureTitle);
      const response = await supabase.functions.invoke('ai-course-generator', {
        body: {
          action: 'generate_content',
          payload: {
            lectureId,
            lectureTitle,
            sessionTheme,
            sessionNumber,
            lectureNumber
          }
        }
      });

      console.log('📡 Generate content response:', response);

      if (response.error) {
        console.error('❌ Error generating content:', response.error);
        toast.error('Failed to generate content');
      } else {
        toast.success(`Content generated for "${lectureTitle}"`);
        loadCourseData();
      }
    } catch (error) {
      console.error('❌ Error generating content:', error);
      toast.error('Failed to generate content');
    } finally {
      setGeneratingLectures(prev => {
        const newSet = new Set(prev);
        newSet.delete(lectureId);
        return newSet;
      });
    }
  };

  const generateSessionContent = async (sessionData: any) => {
    const sessionId = sessionData.id;
    const sessionTitle = sessionData.title;
    const lectures = sessionData.lectures_dynamic || [];
    
    setGeneratingSessions(prev => new Set([...prev, sessionId]));
    setSessionProgress(prev => ({ ...prev, [sessionId]: 0 }));
    
    try {
      const totalSessionLectures = lectures.length;
      let completedSessionLectures = 0;

      console.log(`🚀 Starting PARALLEL generation for ${totalSessionLectures} lectures in "${sessionTitle}"`);
      console.log(`📋 Lectures to generate in parallel:`, lectures.map(l => l.title));

      // Mark all lectures as generating immediately to show parallel execution
      lectures.forEach((lecture: any) => {
        setGeneratingLectures(prev => new Set([...prev, lecture.id]));
      });

      // Create all promises simultaneously (this is what makes it parallel)
      const promises = lectures.map(async (lecture: any, index: number) => {
        const startTime = Date.now();
        console.log(`🎯 [${new Date().toISOString()}] STARTING parallel generation for lecture ${index + 1}/${totalSessionLectures}: ${lecture.title}`);
        
        try {
          await generateContent(
            lecture.id, 
            lecture.title, 
            sessionTitle, 
            sessionData.session_number, 
            lecture.lecture_number
          );
          
          const duration = Date.now() - startTime;
          completedSessionLectures++;
          const newProgress = (completedSessionLectures / totalSessionLectures) * 100;
          setSessionProgress(prev => ({ ...prev, [sessionId]: newProgress }));
          
          console.log(`✅ [${new Date().toISOString()}] COMPLETED lecture ${index + 1}/${totalSessionLectures}: ${lecture.title} (took ${duration}ms)`);
          console.log(`📊 Session progress: ${completedSessionLectures}/${totalSessionLectures} (${Math.round(newProgress)}%)`);
        } catch (error) {
          console.error(`❌ [${new Date().toISOString()}] FAILED lecture ${index + 1}/${totalSessionLectures}: ${lecture.title}`, error);
          throw error;
        }
      });

      console.log(`⚡ All ${totalSessionLectures} lecture generation promises created simultaneously - executing in PARALLEL`);
      
      // Wait for ALL promises to complete (this runs them in parallel)
      await Promise.all(promises);
      
      console.log(`🎉 All ${totalSessionLectures} lectures completed in PARALLEL for session: ${sessionTitle}`);
      toast.success(`🎉 All content generated for session: ${sessionTitle}`);
      setSessionProgress(prev => ({ ...prev, [sessionId]: 100 }));
      
    } catch (error) {
      console.error('Error generating session content:', error);
      toast.error(`Failed to generate session content: ${error.message}`);
    } finally {
      setGeneratingSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
      
      // Clear all lecture generating states
      lectures.forEach((lecture: any) => {
        setGeneratingLectures(prev => {
          const newSet = new Set(prev);
          newSet.delete(lecture.id);
          return newSet;
        });
      });
      
      // Reset progress after delay
      setTimeout(() => {
        setSessionProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[sessionId];
          return newProgress;
        });
      }, 2000);
    }
  };

  const generateAllContent = async () => {
    if (!courseData?.sessions_dynamic) {
      toast.error('No sessions found');
      return;
    }

    setIsLoading(true);
    setIsGenerating(true);
    const total = courseData.sessions_dynamic.reduce((acc: number, session: any) => 
      acc + (session.lectures_dynamic?.length || 0), 0);
    
    setTotalLectures(total);
    setCompletedLectures(0);
    setProgress(0);

    try {
      // Collect all lectures first for parallel processing
      const allLectures: Array<{id: string, title: string, theme: string, sessionNumber: number, lectureNumber: number}> = [];
      
      for (const session of courseData.sessions_dynamic) {
        if (session.lectures_dynamic) {
          for (const lecture of session.lectures_dynamic) {
            allLectures.push({
              id: lecture.id,
              title: lecture.title,
              theme: session.theme,
              sessionNumber: session.session_number,
              lectureNumber: lecture.lecture_number
            });
          }
        }
      }

      console.log(`🚀 Starting parallel generation for ${total} lectures`);

      // Generate all content in parallel
      const promises = allLectures.map(async (lecture, index) => {
        setGeneratingLectures(prev => new Set([...prev, lecture.id]));
        
        try {
          console.log(`🎯 Starting generation for lecture ${index + 1}/${total}: ${lecture.title}`);
          await generateContent(lecture.id, lecture.title, lecture.theme, lecture.sessionNumber, lecture.lectureNumber);
          
          setCompletedLectures(prev => {
            const newCompleted = prev + 1;
            const newProgress = (newCompleted / total) * 100;
            setProgress(newProgress);
            return newCompleted;
          });
          
          console.log(`✅ Completed ${index + 1}/${total}: ${lecture.title}`);
        } catch (error) {
          console.error(`❌ Failed to generate content for ${lecture.title}:`, error);
          throw new Error(`Failed to generate ${lecture.title}: ${error.message}`);
        } finally {
          setGeneratingLectures(prev => {
            const newSet = new Set(prev);
            newSet.delete(lecture.id);
            return newSet;
          });
        }
      });

      await Promise.all(promises);
      toast.success('🎉 All content generated successfully!');
      setProgress(100);
    } catch (error) {
      console.error('Error generating all content:', error);
      toast.error(`Failed to generate all content: ${error.message}`);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      // Reset progress after a delay
      setTimeout(() => {
        setProgress(0);
        setCompletedLectures(0);
        setTotalLectures(0);
      }, 2000);
    }
  };

  const viewContent = (lectureId: string) => {
    // Navigate to lecture content view or open modal
    toast.info('Content viewer coming soon');
  };

  const editContent = (lectureId: string) => {
    // Open content editor
    toast.info('Content editor coming soon');
  };

  const viewAssessments = (lectureId: string) => {
    // View quiz/reflection questions
    toast.info('Assessment viewer coming soon');
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
      {/* Progress Bar */}
      {isGenerating && (
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border-b">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Generating Course Content</span>
              <span className="text-muted-foreground">
                {completedLectures}/{totalLectures} lectures completed
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      )}
      
      <TooltipProvider>
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
                  <Button onClick={() => handleSave('course', courseData.id)} size="sm">
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

        <div className="mb-4 flex justify-end">
          <Button
            onClick={generateAllContent}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Generate All Content
          </Button>
        </div>

        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {courseData.sessions_dynamic?.map((session: any) => (
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generateSessionContent(session);
                                }}
                                disabled={generatingSessions.has(session.id) || isLoading}
                                className="gap-2"
                              >
                                {generatingSessions.has(session.id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Wand2 className="w-4 h-4" />
                                )}
                                Generate Session
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Generate content for all lectures in this session</TooltipContent>
                          </Tooltip>
                          <Badge variant="secondary">{session.lectures_dynamic?.length || 0} lectures</Badge>
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <Separator />
                    <div className="p-4 space-y-3">
                      {/* Session Progress Bar */}
                      {generatingSessions.has(session.id) && (
                        <div className="mb-4 p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="font-medium">Generating Session Content</span>
                            <span className="text-muted-foreground">
                              {Math.round(sessionProgress[session.id] || 0)}% complete
                            </span>
                          </div>
                          <Progress value={sessionProgress[session.id] || 0} className="h-2" />
                        </div>
                      )}
                      
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
                                {generatingLectures.has(lecture.id) && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Generating...</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={() => generateContent(lecture.id, lecture.title, session.theme, session.session_number, lecture.lecture_number)}
                                       disabled={generatingLectures.has(lecture.id) || generatingSessions.has(session.id) || isLoading}
                                     >
                                      {generatingLectures.has(lecture.id) ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Wand2 className="w-4 h-4" />
                                      )}
                                      Generate Content
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Generate AI slides and content for this lecture</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => viewContent(lecture.id)}
                                    >
                                      <FileText className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View lecture content and slides</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => editContent(lecture.id)}
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit lecture content</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => viewAssessments(lecture.id)}
                                    >
                                      <HelpCircle className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View quiz questions and assessments</TooltipContent>
                                </Tooltip>
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
      </TooltipProvider>
    </div>
  );
}