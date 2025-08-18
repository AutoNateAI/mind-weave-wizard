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
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ContentProtectionModal, ExistingContent } from "./ContentProtectionModal";
import { LectureContentViewer } from "./LectureContentViewer";
import { ContextInputModal } from "./ContextInputModal";

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
  const [expandedLectures, setExpandedLectures] = useState<Set<string>>(new Set());
  const [showProtectionModal, setShowProtectionModal] = useState(false);
  const [protectionData, setProtectionData] = useState<{
    existingContent: ExistingContent[];
    operationType: 'all' | 'session' | 'single';
    title: string;
    onConfirm: (selectedLectures: string[]) => void;
  } | null>(null);
  const [showContextModal, setShowContextModal] = useState(false);
  const [contextModalData, setContextModalData] = useState<{
    type: 'single' | 'session' | 'all';
    title: string;
    data: any;
  } | null>(null);

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

  const checkExistingContent = async (lectures: Array<{id: string, title: string, sessionNumber: number, lectureNumber: number}>) => {
    const existingContent: ExistingContent[] = [];

    for (const lecture of lectures) {
      // Check for slides
      const { data: slides } = await supabase
        .from('lecture_slides')
        .select('id')
        .eq('lecture_id', lecture.id)
        .limit(1);

      // Check for flashcards
      const { data: flashcards } = await supabase
        .from('flashcards')
        .select('id')
        .eq('session_number', lecture.sessionNumber)
        .eq('lecture_number', lecture.lectureNumber)
        .limit(1);

      // Check for reflections
      const { data: reflections } = await supabase
        .from('reflection_questions')
        .select('id')
        .eq('session_number', lecture.sessionNumber)
        .eq('lecture_number', lecture.lectureNumber)
        .limit(1);

      // Check for MCQ
      const { data: mcq } = await supabase
        .from('multiple_choice_questions')
        .select('id')
        .eq('session_number', lecture.sessionNumber)
        .eq('lecture_number', lecture.lectureNumber)
        .limit(1);

      const hasContent = (slides?.length || 0) > 0 || (flashcards?.length || 0) > 0 || 
                        (reflections?.length || 0) > 0 || (mcq?.length || 0) > 0;

      if (hasContent) {
        existingContent.push({
          lectureId: lecture.id,
          lectureTitle: lecture.title,
          sessionNumber: lecture.sessionNumber,
          lectureNumber: lecture.lectureNumber,
          hasSlides: (slides?.length || 0) > 0,
          hasFlashcards: (flashcards?.length || 0) > 0,
          hasReflections: (reflections?.length || 0) > 0,
          hasMCQ: (mcq?.length || 0) > 0
        });
      }
    }

    return existingContent;
  };

  const generateContent = async (lectureId: string, lectureTitle: string, sessionTheme: string, sessionNumber?: number, lectureNumber?: number, contextualInfo?: string) => {
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
            lectureNumber,
            contextualInfo,
            styleInstructions: "Create lecture slides that read like engaging, standalone blog posts. Each slide should contain rich, substantial content that flows naturally when read. The content should be conversational yet informative, allowing students to both follow along during lectures and return later to read and reflect. Include compelling narratives, real-world examples, and thought-provoking insights that make complex concepts accessible and memorable."
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

  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const toggleLecture = (lectureId: string) => {
    setExpandedLectures(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lectureId)) {
        newSet.delete(lectureId);
      } else {
        newSet.add(lectureId);
      }
      return newSet;
    });
  };

  const generateSessionContent = async (session: any) => {
    if (!session?.lectures_dynamic || session.lectures_dynamic.length === 0) {
      toast.error('No lectures found in this session');
      return;
    }

    // Show context input modal first
    setContextModalData({
      type: 'session',
      title: `Generate Session "${session.title}" Content`,
      data: session
    });
    setShowContextModal(true);
  };

  const executeSessionGeneration = async (session: any, allowedLectureIds: string[], contextualInfo?: string) => {
    const sessionId = session.id;
    const sessionTitle = session.title;
    const lectures = session.lectures_dynamic.filter((lecture: any) => 
      allowedLectureIds.includes(lecture.id)
    );
    
    if (!lectures || lectures.length === 0) {
      toast.error('No lectures selected for generation');
      return;
    }
    
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
            session.session_number, 
            lecture.lecture_number,
            contextualInfo
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

    // Show context input modal first
    setContextModalData({
      type: 'all',
      title: 'Generate All Course Content',
      data: courseData
    });
    setShowContextModal(true);
  };

  const executeAllGeneration = async (allLectures: Array<{id: string, title: string, theme: string, sessionNumber: number, lectureNumber: number}>, contextualInfo?: string) => {
    setIsLoading(true);
    setIsGenerating(true);
    const total = allLectures.length;
    
    setTotalLectures(total);
    setCompletedLectures(0);
    setProgress(0);

    try {
      console.log(`🚀 Starting parallel generation for ${total} lectures`);

      // Generate all content in parallel
      const promises = allLectures.map(async (lecture, index) => {
        setGeneratingLectures(prev => new Set([...prev, lecture.id]));
        
        try {
          console.log(`🎯 Starting generation for lecture ${index + 1}/${total}: ${lecture.title}`);
          await generateContent(lecture.id, lecture.title, lecture.theme, lecture.sessionNumber, lecture.lectureNumber, contextualInfo);
          
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
                            <div key={lecture.id}>
                              <Card className="p-3 bg-accent/30">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleLecture(lecture.id)}
                                      className="p-1"
                                    >
                                      {expandedLectures.has(lecture.id) ? (
                                        <EyeOff className="w-4 h-4" />
                                      ) : (
                                        <Eye className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <PlayCircle className="w-4 h-4 text-primary" />
                                    <span className="font-medium">Lecture {lecture.lecture_number}</span>
                                    <span className="text-sm text-muted-foreground">{lecture.title}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                           onClick={() => {
                                             setContextModalData({
                                               type: 'single',
                                               title: `Generate "${lecture.title}" Content`,
                                               data: { lecture, session }
                                             });
                                             setShowContextModal(true);
                                           }}
                                          disabled={generatingLectures.has(lecture.id) || isLoading}
                                          className="gap-2"
                                        >
                                          {generatingLectures.has(lecture.id) ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Wand2 className="w-4 h-4" />
                                          )}
                                          Generate
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Generate content for this lecture</TooltipContent>
                                    </Tooltip>
                                    <Badge variant="outline" className="text-xs">
                                      {lecture.estimated_duration_minutes}min
                                    </Badge>
                                  </div>
                                </div>
                              </Card>
                              
                              {expandedLectures.has(lecture.id) && (
                                <div className="mt-4 border rounded-lg bg-background/50">
                                  <LectureContentViewer
                                    lectureId={lecture.id}
                                    lectureTitle={lecture.title}
                                    sessionNumber={session.session_number}
                                    lectureNumber={lecture.lecture_number}
                                    onContentUpdate={loadCourseData}
                                  />
                                </div>
                              )}
                            </div>
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

        {/* Context Input Modal */}
        <ContextInputModal
          isOpen={showContextModal}
          onClose={() => {
            setShowContextModal(false);
            setContextModalData(null);
          }}
          onConfirm={async (contextualInfo) => {
            if (!contextModalData) return;
            
            const { type, data } = contextModalData;
            
            if (type === 'single') {
              const { lecture, session } = data;
              const lectureData = [{
                id: lecture.id,
                title: lecture.title,
                sessionNumber: session.session_number,
                lectureNumber: lecture.lecture_number
              }];
              
              const existingContent = await checkExistingContent(lectureData);
              
              if (existingContent.length > 0) {
                setProtectionData({
                  existingContent,
                  operationType: 'single',
                  title: `Generate "${lecture.title}" Content`,
                  onConfirm: (selectedLectures) => {
                    setShowProtectionModal(false);
                    if (selectedLectures.includes(lecture.id)) {
                      generateContent(lecture.id, lecture.title, session.theme, session.session_number, lecture.lecture_number, contextualInfo);
                    }
                  }
                });
                setShowProtectionModal(true);
              } else {
                generateContent(lecture.id, lecture.title, session.theme, session.session_number, lecture.lecture_number, contextualInfo);
              }
            } else if (type === 'session') {
              const session = data;
              const lectures = session.lectures_dynamic.map((lecture: any) => ({
                id: lecture.id,
                title: lecture.title,
                sessionNumber: session.session_number,
                lectureNumber: lecture.lecture_number
              }));

              const existingContent = await checkExistingContent(lectures);
              
              if (existingContent.length > 0) {
                setProtectionData({
                  existingContent,
                  operationType: 'session',
                  title: `Generate Session "${session.title}" Content`,
                  onConfirm: (selectedLectures) => {
                    setShowProtectionModal(false);
                    executeSessionGeneration(session, selectedLectures, contextualInfo);
                  }
                });
                setShowProtectionModal(true);
              } else {
                executeSessionGeneration(session, lectures.map(l => l.id), contextualInfo);
              }
            } else if (type === 'all') {
              const courseData = data;
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

              const existingContent = await checkExistingContent(allLectures);
              
              if (existingContent.length > 0) {
                setProtectionData({
                  existingContent,
                  operationType: 'all',
                  title: 'Generate All Course Content',
                  onConfirm: (selectedLectures) => {
                    setShowProtectionModal(false);
                    executeAllGeneration(allLectures.filter(l => selectedLectures.includes(l.id)), contextualInfo);
                  }
                });
                setShowProtectionModal(true);
              } else {
                executeAllGeneration(allLectures, contextualInfo);
              }
            }
          }}
          title={contextModalData?.title || 'Generate Content'}
          courseId={courseId}
        />

        {/* Content Protection Modal */}
        {protectionData && (
          <ContentProtectionModal
            isOpen={showProtectionModal}
            onClose={() => {
              setShowProtectionModal(false);
              setProtectionData(null);
            }}
            onConfirm={protectionData.onConfirm}
            existingContent={protectionData.existingContent}
            operationType={protectionData.operationType}
            title={protectionData.title}
          />
        )}
      </TooltipProvider>
    </div>
  );
}