import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { 
  Image, 
  FileText,
  BarChart3,
  Users,
  Eye,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { SlidePreview } from "./SlidePreview";

interface Slide {
  id: string;
  slide_number: number;
  title: string | null;
  content: string;
  slide_type: string | null;
  speaker_notes: string | null;
  svg_animation: string | null;
  lecture_id: string;
  lecture_number: number;
  lecture_title: string;
}

interface Session {
  session_number: number;
  title: string;
  theme: string;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
}

interface SessionSlideViewProps {
  selectedCourseId?: string;
}

export function SessionSlideView({ selectedCourseId }: SessionSlideViewProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [allSlides, setAllSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingSlides, setGeneratingSlides] = useState<Set<string>>(new Set());
  const [generationProgress, setGenerationProgress] = useState({ completed: 0, total: 0 });
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [previewingSlide, setPreviewingSlide] = useState<Slide | null>(null);
  
  // Modal states
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showIndividualGenerateModal, setShowIndividualGenerateModal] = useState(false);
  const [selectedSlideForGeneration, setSelectedSlideForGeneration] = useState<Slide | null>(null);
  const [imageStyle, setImageStyle] = useState('animated_charts');
  const [imageDimensions, setImageDimensions] = useState('1536x1024');
  const [customPrompt, setCustomPrompt] = useState('');
  const [individualCustomPrompt, setIndividualCustomPrompt] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      const course = courses.find(c => c.id === selectedCourseId);
      if (course) {
        setSelectedCourse(course);
        loadSessionsForCourse(selectedCourseId);
      }
    }
  }, [selectedCourseId, courses]);

  useEffect(() => {
    if (selectedCourse && !selectedCourseId) {
      loadSessionsForCourse(selectedCourse.id);
    }
  }, [selectedCourse, selectedCourseId]);

  useEffect(() => {
    if (selectedSession) {
      loadAllSlidesForSession();
    }
  }, [selectedSession]);

  const loadCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, description, status')
      .order('title');

    if (error) {
      toast.error('Failed to load courses');
      return;
    }

    setCourses(data || []);
    setLoading(false);
  };

  const loadSessionsForCourse = async (courseId: string) => {
    const { data, error } = await supabase
      .from('sessions_dynamic')
      .select('session_number, title, theme')
      .eq('course_id', courseId)
      .order('session_number');

    if (error) {
      toast.error('Failed to load sessions');
      return;
    }

    setSessions(data || []);
  };

  const loadAllSlidesForSession = async () => {
    if (!selectedSession) return;

    try {
      // Get all lectures for this session
      const { data: sessionData } = await supabase
        .from('sessions_dynamic')
        .select('id')
        .eq('session_number', selectedSession.session_number)
        .single();

      if (!sessionData) return;

      const { data: lectures } = await supabase
        .from('lectures_dynamic')
        .select('id, title, lecture_number')
        .eq('session_id', sessionData.id)
        .order('order_index');

      if (!lectures || lectures.length === 0) {
        setAllSlides([]);
        return;
      }

      // Get all slides for these lectures
      const lectureIds = lectures.map(l => l.id);
      const { data: slidesData } = await supabase
        .from('lecture_slides')
        .select('*')
        .in('lecture_id', lectureIds)
        .order('slide_number');

      // Combine slides with lecture info
      const slidesWithLectureInfo: Slide[] = (slidesData || []).map(slide => {
        const lecture = lectures.find(l => l.id === slide.lecture_id);
        return {
          ...slide,
          lecture_number: lecture?.lecture_number || 0,
          lecture_title: lecture?.title || 'Unknown Lecture'
        };
      });

      // Sort by lecture number, then slide number
      slidesWithLectureInfo.sort((a, b) => {
        if (a.lecture_number !== b.lecture_number) {
          return a.lecture_number - b.lecture_number;
        }
        return a.slide_number - b.slide_number;
      });

      setAllSlides(slidesWithLectureInfo);
    } catch (error) {
      console.error('Error loading slides:', error);
      toast.error('Failed to load slides');
    }
  };

  const generateImageForSlide = async (slide: Slide, useCustomPrompt: boolean = false, customPromptText: string = '') => {
    const slideId = slide.id;
    
    // Add to generating set
    setGeneratingSlides(prev => new Set([...prev, slideId]));

    try {
      // Build context-aware prompt
      let contextPrompt = "";
      
      if (useCustomPrompt && customPromptText.trim()) {
        contextPrompt = customPromptText;
      } else {
        // Extract text content and create enhanced prompt
        const textContent = slide.content
          .replace(/!\[.*?\]\(.*?\)/g, '') // Remove existing image markdown
          .replace(/[•\-\*]/g, '') // Remove bullet points
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('. ');

        contextPrompt = `Educational slide visualization: ${slide.title}. ${textContent}. Focus on creating engaging animated cartoon-style educational content with visual metaphors, charts, or conceptual diagrams that enhance understanding.`;
      }

      const response = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: contextPrompt,
          size: imageDimensions,
          quality: 'high'
        }
      });

      if (response?.data?.imageUrl) {
        // Extract existing content without image markdown
        const existingContent = slide.content
          .replace(/!\[Generated Image\]\([^)]+\)\n\n?/g, '') // Remove existing generated image
          .trim();

        // Add new image at the top
        const updatedContent = `![Generated Image](${response.data.imageUrl})\n\n${existingContent}`;
        
        await supabase
          .from('lecture_slides')
          .update({ content: updatedContent })
          .eq('id', slideId);

        // Update local state immediately
        setAllSlides(prev => prev.map(s => 
          s.id === slideId ? { ...s, content: updatedContent } : s
        ));

        toast.success(`Image generated for Lecture ${slide.lecture_number}, Slide ${slide.slide_number}`);
        return true;
      } else {
        toast.error(`Failed to generate image for Lecture ${slide.lecture_number}, Slide ${slide.slide_number}`);
        return false;
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error(`Error generating image for Lecture ${slide.lecture_number}, Slide ${slide.slide_number}`);
      return false;
    } finally {
      // Remove from generating set
      setGeneratingSlides(prev => {
        const newSet = new Set(prev);
        newSet.delete(slideId);
        return newSet;
      });
    }
  };

  const generateAllImagesForSession = async () => {
    if (!allSlides || allSlides.length === 0) {
      toast.error('No slides found to generate images for');
      return;
    }

    setIsGeneratingAll(true);
    setGenerationProgress({ completed: 0, total: allSlides.length });
    setShowGenerateModal(false);
    
    toast.success(`Starting image generation for ${allSlides.length} slides across all lectures...`);

    // Process slides in parallel with a maximum concurrency of 3
    const batchSize = 3;
    const batches = [];
    for (let i = 0; i < allSlides.length; i += batchSize) {
      batches.push(allSlides.slice(i, i + batchSize));
    }

    let completedCount = 0;
    const totalSlides = allSlides.length;

    try {
      for (const batch of batches) {
        const promises = batch.map(async (slide) => {
          const success = await generateImageForSlide(slide, true, customPrompt);
          if (success) {
            completedCount++;
            setGenerationProgress({ completed: completedCount, total: totalSlides });
          }
        });

        // Wait for current batch to complete before starting next batch
        await Promise.all(promises);
      }

      toast.success(`Completed! Generated images for ${completedCount} out of ${totalSlides} slides.`);
    } catch (error) {
      console.error('Error in batch image generation:', error);
      toast.error('Error during batch image generation');
    } finally {
      setIsGeneratingAll(false);
      setGenerationProgress({ completed: 0, total: 0 });
    }
  };

  const handleIndividualImageGeneration = async () => {
    if (!selectedSlideForGeneration) return;
    
    setShowIndividualGenerateModal(false);
    await generateImageForSlide(selectedSlideForGeneration, true, individualCustomPrompt);
    setSelectedSlideForGeneration(null);
    setIndividualCustomPrompt('');
  };

  const getSlideIcon = (slideType: string | null) => {
    switch (slideType) {
      case 'title': return <FileText className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'chart': return <BarChart3 className="w-4 h-4" />;
      case 'team': return <Users className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Group slides by lecture
  const slidesByLecture = allSlides.reduce((acc, slide) => {
    const lectureKey = `${slide.lecture_number}-${slide.lecture_title}`;
    if (!acc[lectureKey]) {
      acc[lectureKey] = [];
    }
    acc[lectureKey].push(slide);
    return acc;
  }, {} as Record<string, Slide[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

    return (
      <div className="space-y-6">
        {/* Course and Session Selection */}
        <Card className="p-6">
          <div className="space-y-4">
            {!selectedCourseId && (
              <div>
                <label className="text-sm font-medium mb-2 block">Course</label>
                <Select value={selectedCourse?.id} onValueChange={(value) => {
                  const course = courses.find(c => c.id === value);
                  setSelectedCourse(course || null);
                  setSelectedSession(null);
                  setAllSlides([]);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course first" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCourse?.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCourse.description}
                  </p>
                )}
              </div>
            )}
            
            {(selectedCourse || selectedCourseId) && (
              <div>
                <label className="text-sm font-medium mb-2 block">Session</label>
                <Select value={selectedSession?.session_number.toString()} onValueChange={(value) => {
                  const session = sessions.find(s => s.session_number === parseInt(value));
                  setSelectedSession(session || null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select session to view all slides" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.session_number} value={session.session_number.toString()}>
                        Session {session.session_number}: {session.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSession && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedSession.theme}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>

      {selectedSession && allSlides.length > 0 && (
        <>
          {/* Header with Generate All Button */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">All Slides for Session {selectedSession.session_number}</h3>
              <p className="text-sm text-muted-foreground">
                {Object.keys(slidesByLecture).length} lectures, {allSlides.length} total slides
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isGeneratingAll && (
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {generationProgress.completed}/{generationProgress.total} completed
                  </span>
                </div>
              )}
              <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
                <DialogTrigger asChild>
                  <Button 
                    disabled={isGeneratingAll || allSlides.length === 0}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Image className="w-4 h-4" />
                    Generate All Images
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Images for All Slides in Session</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      This will generate images for all {allSlides.length} slides across {Object.keys(slidesByLecture).length} lectures in this session.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Image Style</label>
                        <Select value={imageStyle} onValueChange={setImageStyle}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="animated_charts">Animated Charts & Graphs</SelectItem>
                            <SelectItem value="animated_concept">Animated Conceptual Illustration</SelectItem>
                            <SelectItem value="complex_overlay">Complex Scenario Overlay</SelectItem>
                            <SelectItem value="minimalist_diagram">Minimalist Diagram</SelectItem>
                            <SelectItem value="artistic_abstract">Artistic Abstract</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Dimensions</label>
                        <Select value={imageDimensions} onValueChange={setImageDimensions}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1024x1024">Square (1024x1024)</SelectItem>
                            <SelectItem value="1024x1536">Portrait (1024x1536)</SelectItem>
                            <SelectItem value="1536x1024">Landscape (1536x1024)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Custom Context (Optional)</label>
                        <Textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="Leave empty to auto-generate from slide content, or add custom context for all images..."
                          className="min-h-20"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          AI will use slide content and selected style if no custom context provided
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
                        Cancel
                      </Button>
                      <Button onClick={generateAllImagesForSession} className="flex-1">
                        <Image className="w-4 h-4 mr-2" />
                        Generate All Images
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Slides Organized by Lecture */}
          <div className="space-y-8">
            {Object.entries(slidesByLecture).map(([lectureKey, slides]) => {
              const [lectureNumber, lectureTitle] = lectureKey.split('-');
              return (
                <div key={lectureKey} className="space-y-4">
                  <div className="border-b border-border pb-2">
                    <h4 className="text-md font-semibold">
                      Lecture {lectureNumber}: {lectureTitle}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {slides.length} slides
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {slides.map((slide) => (
                      <Card key={slide.id} className="p-4 hover:shadow-md transition-shadow relative">
                        {generatingSlides.has(slide.id) && (
                          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                              <span className="text-sm text-muted-foreground">Generating...</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="gap-1">
                                {getSlideIcon(slide.slide_type)}
                                {slide.slide_type || 'content'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">#{slide.slide_number}</span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreviewingSlide(slide)}
                                title="Preview Slide"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedSlideForGeneration(slide);
                                  setShowIndividualGenerateModal(true);
                                }}
                                title="Generate Image for this slide"
                                disabled={generatingSlides.has(slide.id)}
                              >
                                {generatingSlides.has(slide.id) ? (
                                  <div className="w-3 h-3 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                                ) : (
                                  <Image className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-sm line-clamp-1">{slide.title || 'Untitled Slide'}</h5>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {slide.content?.replace(/!\[.*?\]\(.*?\)/g, '').trim() || 'No content'}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Individual Slide Image Generation Modal */}
          <Dialog open={showIndividualGenerateModal} onOpenChange={setShowIndividualGenerateModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Image for Slide</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Generate an image for: <strong>{selectedSlideForGeneration?.title || 'Untitled Slide'}</strong>
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Image Style</label>
                    <Select value={imageStyle} onValueChange={setImageStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="animated_charts">Animated Charts & Graphs</SelectItem>
                        <SelectItem value="animated_concept">Animated Conceptual Illustration</SelectItem>
                        <SelectItem value="complex_overlay">Complex Scenario Overlay</SelectItem>
                        <SelectItem value="minimalist_diagram">Minimalist Diagram</SelectItem>
                        <SelectItem value="artistic_abstract">Artistic Abstract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Dimensions</label>
                    <Select value={imageDimensions} onValueChange={setImageDimensions}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1024x1024">Square (1024x1024)</SelectItem>
                        <SelectItem value="1024x1536">Portrait (1024x1536)</SelectItem>
                        <SelectItem value="1536x1024">Landscape (1536x1024)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Custom Context (Optional)</label>
                    <Textarea
                      value={individualCustomPrompt}
                      onChange={(e) => setIndividualCustomPrompt(e.target.value)}
                      placeholder="Leave empty to auto-generate from slide content, or add custom context for this image..."
                      className="min-h-20"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      AI will use slide content and selected style if no custom context provided
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => {
                    setShowIndividualGenerateModal(false);
                    setSelectedSlideForGeneration(null);
                    setIndividualCustomPrompt('');
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleIndividualImageGeneration} className="flex-1">
                    <Image className="w-4 h-4 mr-2" />
                    Generate Image
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Slide Preview Dialog */}
          <Dialog open={!!previewingSlide} onOpenChange={() => setPreviewingSlide(null)}>
            <DialogContent className="max-w-6xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>
                  Preview: Lecture {previewingSlide?.lecture_number}, Slide {previewingSlide?.slide_number}: {previewingSlide?.title}
                </DialogTitle>
              </DialogHeader>
              {previewingSlide && (
                <div className="overflow-y-auto max-h-[70vh]">
                  <SlidePreview slide={previewingSlide} />
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}

      {selectedSession && allSlides.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No slides found for this session.</p>
        </Card>
      )}
    </div>
  );
}