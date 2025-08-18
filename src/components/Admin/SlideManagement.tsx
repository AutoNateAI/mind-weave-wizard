import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { SlidePreview } from "./SlidePreview";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Image, 
  Wand2,
  Save,
  Eye,
  FileText,
  BarChart3,
  Users,
  Upload,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface Slide {
  id: string;
  slide_number: number;
  title: string | null;
  content: string;
  slide_type: string | null;
  speaker_notes: string | null;
  svg_animation: string | null;
}

interface Session {
  session_number: number;
  title: string;
  theme: string;
}

interface Lecture {
  id: string;
  title: string;
  session_number: number;
  lecture_number: number;
}

interface SlideManagementProps {
  selectedCourseId?: string;
}

export function SlideManagement({ selectedCourseId }: SlideManagementProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [previewingSlide, setPreviewingSlide] = useState<Slide | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageDimensions, setImageDimensions] = useState('1536x1024');
  const [imageStyle, setImageStyle] = useState('animated_charts');
  const [targetSlideForImage, setTargetSlideForImage] = useState<Slide | null>(null);
  const [generatingImageSlides, setGeneratingImageSlides] = useState<Set<string>>(new Set());
  const [aiPrompt, setAiPrompt] = useState('');
  
  // New state for image regeneration in edit modal
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [imageRegenerationPrompt, setImageRegenerationPrompt] = useState('');
  const [imageSize, setImageSize] = useState('1536x1024');
  const [imageQuality, setImageQuality] = useState('high');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGeneratingAllImages, setIsGeneratingAllImages] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ completed: 0, total: 0 });
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadLectures(selectedSession.session_number);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (selectedLecture) {
      loadSlides();
    }
  }, [selectedLecture]);

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from('sessions_dynamic')
      .select('session_number, title, theme')
      .order('session_number');

    if (error) {
      toast.error('Failed to load sessions');
      return;
    }

    setSessions(data || []);
    setLoading(false);
  };

  const loadLectures = async (sessionNumber: number) => {
    const { data, error } = await supabase
      .from('lectures_dynamic')
      .select('*')
      .eq('session_id', (await supabase
        .from('sessions_dynamic')
        .select('id')
        .eq('session_number', sessionNumber)
        .single()).data?.id)
      .order('order_index');

    if (error) {
      toast.error('Failed to load lectures');
      return;
    }

    // Map to include session_number for consistency
    const lecturesWithSession = data?.map(lecture => ({
      ...lecture,
      session_number: sessionNumber
    })) || [];

    setLectures(lecturesWithSession);
  };

  const loadLecturesOld = async () => {
    try {
      console.log('Loading lectures for course:', selectedCourseId);
      
      // First get sessions for this course
      const { data: sessions } = await supabase
        .from('sessions_dynamic')
        .select('id, session_number')
        .eq('course_id', selectedCourseId);

      if (!sessions || sessions.length === 0) {
        console.log('No sessions found for course:', selectedCourseId);
        setLectures([]);
        return;
      }

      console.log('Found sessions:', sessions);

      // Then get lectures for these sessions
      const sessionIds = sessions.map(s => s.id);
      const { data: lecturesData, error } = await supabase
        .from('lectures_dynamic')
        .select('*')
        .in('session_id', sessionIds)
        .order('session_number, lecture_number');

      if (error) {
        console.error('Error fetching lectures:', error);
        throw error;
      }

      console.log('Found lectures:', lecturesData);

      if (lecturesData) {
        // Map session numbers to lectures
        const allLectures: Lecture[] = lecturesData.map(lecture => {
          const session = sessions.find(s => s.id === lecture.session_id);
          return {
            ...lecture,
            session_number: session?.session_number || 0
          };
        });
        
        console.log('Processed lectures:', allLectures);
        setLectures(allLectures);
      }
    } catch (error) {
      console.error('Error loading lectures:', error);
      toast.error('Failed to load lectures');
    }
  };

  const loadSlides = async () => {
    try {
      const { data: slidesData } = await supabase
        .from('lecture_slides')
        .select('*')
        .eq('lecture_id', selectedLecture?.id)
        .order('slide_number');

      setSlides(slidesData || []);
    } catch (error) {
      console.error('Error loading slides:', error);
      toast.error('Failed to load slides');
    }
  };

  const createNewSlide = () => {
    const newSlide: Slide = {
      id: 'new',
      slide_number: slides.length + 1,
      title: '',
      content: '',
      slide_type: 'content',
      speaker_notes: '',
      svg_animation: null
    };
    setEditingSlide(newSlide);
  };

  const generateContentWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a content prompt');
      return;
    }

    setIsGeneratingContent(true);
    try {
      const response = await supabase.functions.invoke('ai-course-generator', {
        body: {
          prompt: `Create slide content for: ${aiPrompt}. 
          Respond with a JSON object containing:
          {
            "title": "slide title",
            "content": "bullet points separated by newlines using • format",
            "speaker_notes": "detailed speaker notes"
          }`,
          type: 'slide-content'
        }
      });

      if (response.error) throw response.error;
      
      const generatedContent = response.data;
      if (editingSlide && generatedContent) {
        setEditingSlide({
          ...editingSlide,
          title: generatedContent.title || editingSlide.title,
          content: generatedContent.content || editingSlide.content,
          speaker_notes: generatedContent.speaker_notes || editingSlide.speaker_notes
        });
        toast.success('Content generated successfully!');
      }
      setAiPrompt('');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const reorderSlides = async (newSlideNumber: number, currentSlide: Slide) => {
    const updatedSlides = [...slides];
    const oldNumber = currentSlide.slide_number;
    
    // Reorder slides
    updatedSlides.forEach(slide => {
      if (slide.id === currentSlide.id) {
        slide.slide_number = newSlideNumber;
      } else if (newSlideNumber < oldNumber && slide.slide_number >= newSlideNumber && slide.slide_number < oldNumber) {
        slide.slide_number += 1;
      } else if (newSlideNumber > oldNumber && slide.slide_number <= newSlideNumber && slide.slide_number > oldNumber) {
        slide.slide_number -= 1;
      }
    });

    // Update all slides in database
    try {
      for (const slide of updatedSlides) {
        await supabase
          .from('lecture_slides')
          .update({ slide_number: slide.slide_number })
          .eq('id', slide.id);
      }
      loadSlides();
      toast.success('Slide order updated');
    } catch (error) {
      console.error('Error reordering slides:', error);
      toast.error('Failed to reorder slides');
    }
  };

  const saveSlide = async () => {
    if (!editingSlide || !selectedLecture) return;

    try {
      const slideData = {
        lecture_id: selectedLecture.id,
        slide_number: editingSlide.slide_number,
        title: editingSlide.title,
        content: editingSlide.content,
        slide_type: editingSlide.slide_type,
        speaker_notes: editingSlide.speaker_notes,
        svg_animation: editingSlide.svg_animation
      };

      if (editingSlide.id === 'new') {
        const { error } = await supabase
          .from('lecture_slides')
          .insert(slideData);
        if (error) throw error;
        toast.success('Slide created successfully');
      } else {
        const { error } = await supabase
          .from('lecture_slides')
          .update(slideData)
          .eq('id', editingSlide.id);
        if (error) throw error;
        toast.success('Slide updated successfully');
      }

      setEditingSlide(null);
      loadSlides();
    } catch (error) {
      console.error('Error saving slide:', error);
      toast.error('Failed to save slide');
    }
  };

  const deleteSlide = async (slideId: string) => {
    try {
      const { error } = await supabase
        .from('lecture_slides')
        .delete()
        .eq('id', slideId);

      if (error) throw error;
      toast.success('Slide deleted successfully');
      loadSlides();
    } catch (error) {
      console.error('Error deleting slide:', error);
      toast.error('Failed to delete slide');
    }
  };

  const generateImageForSlide = async () => {
    if (!targetSlideForImage) {
      toast.error('No slide selected for image generation');
      return;
    }

    const slideId = targetSlideForImage.id;
    const slideTitle = targetSlideForImage.title;
    const slideContent = targetSlideForImage.content;

    // Build context-aware prompt using enhanced approach
    let contextPrompt = "";
    
    if (imagePrompt.trim()) {
      contextPrompt = imagePrompt;
    } else {
      // Extract text content and create enhanced prompt
      const textContent = slideContent
        .replace(/!\[.*?\]\(.*?\)/g, '') // Remove existing image markdown
        .replace(/[•\-\*]/g, '') // Remove bullet points
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('. ');

      contextPrompt = `Educational slide visualization: ${slideTitle}. ${textContent}. Focus on creating engaging animated cartoon-style educational content with visual metaphors, charts, or conceptual diagrams that enhance understanding.`;
    }

    // Add to generating set and close modal immediately
    setGeneratingImageSlides(prev => new Set([...prev, slideId]));
    setTargetSlideForImage(null);
    setImagePrompt('');
    toast.success('Image generation started...');

    try {
      const response = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: contextPrompt,
          size: imageDimensions,
          quality: 'high'
        }
      });

      if (response?.error) throw response.error;
      
      if (response?.data?.imageUrl) {
        // Extract existing content without image markdown
        const existingContent = slideContent
          .replace(/!\[Generated Image\]\([^)]+\)\n\n?/g, '') // Remove existing generated image
          .trim();

        // Add new image at the top
        const updatedContent = `![Generated Image](${response.data.imageUrl})\n\n${existingContent}`;
        
        await supabase
          .from('lecture_slides')
          .update({ content: updatedContent })
          .eq('id', slideId);

        // Update local state immediately
        setSlides(prev => prev.map(s => 
          s.id === slideId ? { ...s, content: updatedContent } : s
        ));
        
        toast.success(`Image generated and added to slide: ${slideTitle}`);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error(`Failed to generate image for slide: ${slideTitle}`);
    } finally {
      // Remove from generating set
      setGeneratingImageSlides(prev => {
        const newSet = new Set(prev);
        newSet.delete(slideId);
        return newSet;
      });
    }
  };

  const generateAllImages = async () => {
    if (!slides || slides.length === 0) {
      toast.error('No slides found to generate images for');
      return;
    }

    setIsGeneratingAllImages(true);
    setGenerationProgress({ completed: 0, total: slides.length });
    setShowGenerateModal(false);
    toast.success(`Starting image generation for ${slides.length} slides...`);

    // Add all slides to generating set
    const slideIds = slides.map(s => s.id);
    setGeneratingImageSlides(new Set(slideIds));

    // Process slides in parallel with a maximum concurrency of 3
    const batchSize = 3;
    const batches = [];
    for (let i = 0; i < slides.length; i += batchSize) {
      batches.push(slides.slice(i, i + batchSize));
    }

    let completedCount = 0;
    const totalSlides = slides.length;

    try {
      for (const batch of batches) {
        const promises = batch.map(async (slide) => {
          try {
            // Extract text content and create enhanced prompt
            const textContent = slide.content
              .replace(/!\[.*?\]\(.*?\)/g, '') // Remove existing image markdown
              .replace(/[•\-\*]/g, '') // Remove bullet points
              .split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0)
              .join('. ');

            const enhancedPrompt = `Educational slide visualization: ${slide.title}. ${textContent}. Focus on creating engaging animated cartoon-style educational content with visual metaphors, charts, or conceptual diagrams that enhance understanding.`;

            const response = await supabase.functions.invoke('generate-image', {
              body: {
                prompt: enhancedPrompt,
                size: '1536x1024',
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
                .eq('id', slide.id);

              // Update local state immediately
              setSlides(prev => prev.map(s => 
                s.id === slide.id ? { ...s, content: updatedContent } : s
              ));

              // Remove from generating set
              setGeneratingImageSlides(prev => {
                const newSet = new Set(prev);
                newSet.delete(slide.id);
                return newSet;
              });

              completedCount++;
              setGenerationProgress({ completed: completedCount, total: totalSlides });
              toast.success(`Image generated for slide ${slide.slide_number}: ${slide.title} (${completedCount}/${totalSlides})`);
            } else {
              setGeneratingImageSlides(prev => {
                const newSet = new Set(prev);
                newSet.delete(slide.id);
                return newSet;
              });
              toast.error(`Failed to generate image for slide ${slide.slide_number}: ${slide.title}`);
            }
          } catch (error) {
            console.error(`Error generating image for slide ${slide.slide_number}:`, error);
            setGeneratingImageSlides(prev => {
              const newSet = new Set(prev);
              newSet.delete(slide.id);
              return newSet;
            });
            toast.error(`Error generating image for slide ${slide.slide_number}: ${slide.title}`);
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
      setIsGeneratingAllImages(false);
      setGenerationProgress({ completed: 0, total: 0 });
      setGeneratingImageSlides(new Set());
    }
  };

  const regenerateImageForEditingSlide = async () => {
    if (!editingSlide) {
      toast.error('No slide selected for image regeneration');
      return;
    }

    // Start loading immediately and clear prompt
    setIsRegeneratingImage(true);
    const currentPrompt = imageRegenerationPrompt.trim();
    setImageRegenerationPrompt(''); // Clear the prompt immediately
    toast.success('Image generation started...');

    try {
      // Auto-generate enhanced prompt from slide content if none provided
      let finalPrompt = currentPrompt;
      if (!finalPrompt && editingSlide.content) {
        // Extract text content and create enhanced prompt
        const textContent = editingSlide.content
          .replace(/!\[.*?\]\(.*?\)/g, '') // Remove existing image markdown
          .replace(/[•\-\*]/g, '') // Remove bullet points
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('. ');
        
        finalPrompt = `Educational slide visualization: ${editingSlide.title}. ${textContent}. Create engaging animated cartoon-style educational content with visual metaphors, charts, or conceptual diagrams.`;
      }

      console.log('Regenerating image with enhanced prompt:', finalPrompt);

      const response = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: finalPrompt,
          size: imageSize,
          quality: imageQuality
        }
      });

      if (response?.data?.imageUrl) {
        // Extract existing content without image markdown
        const existingContent = editingSlide.content
          .replace(/!\[Generated Image\]\([^)]+\)\n\n?/g, '') // Remove existing generated image
          .trim();

        // Add new image at the top
        const updatedContent = `![Generated Image](${response.data.imageUrl})\n\n${existingContent}`;
        
        setEditingSlide({
          ...editingSlide,
          content: updatedContent
        });
        
        // Also save to database if this is an existing slide
        if (editingSlide.id !== 'new') {
          await supabase
            .from('lecture_slides')
            .update({ content: updatedContent })
            .eq('id', editingSlide.id);
          
          // Reload slides to reflect changes
          loadSlides();
        }
        
        toast.success('Image regenerated successfully!');
      } else {
        toast.error('Failed to generate image. Please try again.');
      }
    } catch (error) {
      console.error('Error regenerating image:', error);
      toast.error('Failed to regenerate image. Please try again.');
    } finally {
      setIsRegeneratingImage(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Session</label>
            <Select value={selectedSession?.session_number.toString()} onValueChange={(value) => {
              const session = sessions.find(s => s.session_number === parseInt(value));
              setSelectedSession(session || null);
              setSelectedLecture(null);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.session_number} value={session.session_number.toString()}>
                    Session {session.session_number}
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

          <div>
            <label className="text-sm font-medium mb-2 block">Lecture</label>
            <Select 
              value={selectedLecture?.id} 
              onValueChange={(value) => {
                const lecture = lectures.find(l => l.id === value);
                setSelectedLecture(lecture || null);
              }}
              disabled={!selectedSession}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select lecture" />
              </SelectTrigger>
              <SelectContent>
                {lectures.map((lecture) => (
                  <SelectItem key={lecture.id} value={lecture.id}>
                    Lecture {lecture.lecture_number}: {lecture.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {selectedLecture && (
        <>
          {/* Slide Management Header */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Slide Management</h3>
              {isGeneratingAllImages && (
                <p className="text-sm text-muted-foreground">
                  Generating images: {generationProgress.completed}/{generationProgress.total} completed
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {isGeneratingAllImages && (
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {generationProgress.completed}/{generationProgress.total}
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={createNewSlide} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Slide
                </Button>
                <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
                  <DialogTrigger asChild>
                    <Button 
                      disabled={isGeneratingAllImages || slides.length === 0}
                      className="gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <Image className="w-4 h-4" />
                      Generate All Images
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Generate Images for All Slides</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        This will generate images for all {slides.length} slides in this lecture using the enhanced animated cartoon-style prompt.
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
                            value={imagePrompt}
                            onChange={(e) => setImagePrompt(e.target.value)}
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
                        <Button onClick={generateAllImages} className="flex-1">
                          <Image className="w-4 h-4 mr-2" />
                          Generate All Images
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Slides Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slides.map((slide) => (
              <Card key={slide.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        {getSlideIcon(slide.slide_type)}
                        {slide.slide_type || 'content'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">#{slide.slide_number}</span>
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
                           setTargetSlideForImage(slide);
                           setImagePrompt('');
                         }}
                         title="Generate Image for this slide"
                         disabled={generatingImageSlides.has(slide.id)}
                       >
                         {generatingImageSlides.has(slide.id) ? (
                           <div className="w-3 h-3 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                         ) : (
                           <Image className="w-3 h-3" />
                         )}
                       </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSlide(slide)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSlide(slide.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium line-clamp-1">{slide.title || 'Untitled Slide'}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {slide.content || 'No content'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Slide Editor Dialog */}
          <Dialog open={!!editingSlide} onOpenChange={() => setEditingSlide(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSlide?.id === 'new' ? 'Create New Slide' : 'Edit Slide'}
                </DialogTitle>
              </DialogHeader>
              
              {editingSlide && (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Slide Position</label>
                      <Input
                        type="number"
                        min="1"
                        max={slides.length + 1}
                        value={editingSlide.slide_number}
                        onChange={(e) => {
                          const newNumber = parseInt(e.target.value) || 1;
                          setEditingSlide({
                            ...editingSlide,
                            slide_number: newNumber
                          });
                          if (editingSlide.id !== 'new') {
                            reorderSlides(newNumber, editingSlide);
                          }
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Slide Type</label>
                      <Select 
                        value={editingSlide.slide_type || 'content'} 
                        onValueChange={(value) => setEditingSlide({
                          ...editingSlide,
                          slide_type: value
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="title">Title Slide</SelectItem>
                          <SelectItem value="content">Content Slide</SelectItem>
                          <SelectItem value="image">Image Slide</SelectItem>
                          <SelectItem value="chart">Chart Slide</SelectItem>
                          <SelectItem value="team">Team Slide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* AI Content Generation */}
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Wand2 className="w-4 h-4" />
                      <span className="font-medium">AI Content Generation</span>
                    </div>
                    <div className="space-y-3">
                      <Textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Describe what this slide should be about and AI will generate the content..."
                        className="min-h-[60px]"
                      />
                      <Button 
                        onClick={generateContentWithAI} 
                        disabled={isGeneratingContent || !aiPrompt.trim()}
                        size="sm"
                        className="gap-2"
                      >
                        {isGeneratingContent ? (
                          <>Generating...</>
                        ) : (
                          <>
                            <Wand2 className="w-3 h-3" />
                            Generate Content
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={editingSlide.title || ''}
                      onChange={(e) => setEditingSlide({
                        ...editingSlide,
                        title: e.target.value
                      })}
                      className="mt-1"
                      placeholder="Enter slide title..."
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Content</label>
                    <Textarea
                      value={editingSlide.content}
                      onChange={(e) => setEditingSlide({
                        ...editingSlide,
                        content: e.target.value
                      })}
                      className="min-h-32"
                      placeholder="Slide content..."
                    />
                  </div>

                  {/* Image Regeneration Section */}
                  <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      <span className="font-semibold">Image Regeneration</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Image Size</label>
                        <Select value={imageSize} onValueChange={setImageSize}>
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
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Quality</label>
                        <Select value={imageQuality} onValueChange={setImageQuality}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Custom Image Prompt (Optional)</label>
                      <Textarea
                        value={imageRegenerationPrompt}
                        onChange={(e) => setImageRegenerationPrompt(e.target.value)}
                        placeholder="Leave empty to auto-generate from slide content, or describe a custom image..."
                        className="min-h-20"
                      />
                    </div>

                    <Button 
                      onClick={regenerateImageForEditingSlide}
                      disabled={isRegeneratingImage}
                      className="w-full"
                      variant="outline"
                    >
                      {isRegeneratingImage ? (
                        <>
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-r-transparent mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Regenerate Image
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Speaker Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Speaker Notes</label>
                    <Textarea
                      value={editingSlide.speaker_notes || ''}
                      onChange={(e) => setEditingSlide({
                        ...editingSlide,
                        speaker_notes: e.target.value
                      })}
                      placeholder="Speaker notes..."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setEditingSlide(null)}>
                      Cancel
                    </Button>
                    <Button onClick={saveSlide} className="gap-2">
                      <Save className="w-4 h-4" />
                      Save Slide
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Image Generation Dialog */}
          <Dialog open={!!targetSlideForImage} onOpenChange={() => setTargetSlideForImage(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Generate Image for Slide: {targetSlideForImage?.title || 'Untitled'}
                </DialogTitle>
              </DialogHeader>
               <div className="space-y-4">
                 <div>
                   <label className="text-sm font-medium">Image Style</label>
                   <Select value={imageStyle} onValueChange={setImageStyle}>
                     <SelectTrigger className="mt-1">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="animated_charts">Animated Charts & Graphs</SelectItem>
                       <SelectItem value="animated_concept">Animated Conceptual</SelectItem>
                       <SelectItem value="complex_overlay">Complex Overlay Scene</SelectItem>
                       <SelectItem value="minimalist_diagram">Minimalist Diagram</SelectItem>
                       <SelectItem value="artistic_abstract">Artistic Abstract</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>

                 <div>
                   <label className="text-sm font-medium">Custom Prompt (Optional)</label>
                   <Textarea
                     value={imagePrompt}
                     onChange={(e) => setImagePrompt(e.target.value)}
                     placeholder="Leave empty to auto-generate from slide content, or describe custom image..."
                     className="mt-1 min-h-20"
                   />
                   <p className="text-xs text-muted-foreground mt-1">
                     AI will use slide content and selected style if no custom prompt provided
                   </p>
                 </div>
                 
                 <div>
                   <label className="text-sm font-medium">Dimensions</label>
                   <Select value={imageDimensions} onValueChange={setImageDimensions}>
                     <SelectTrigger className="mt-1">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="1024x1024">1024x1024 (Square)</SelectItem>
                       <SelectItem value="1536x1024">1536x1024 (Landscape)</SelectItem>
                       <SelectItem value="1024x1536">1024x1536 (Portrait)</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <Button 
                   onClick={generateImageForSlide} 
                   disabled={false}
                   className="w-full gap-2"
                 >
                   <Wand2 className="w-4 h-4" />
                   Generate Image
                 </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Slide Preview Dialog */}
          <Dialog open={!!previewingSlide} onOpenChange={() => setPreviewingSlide(null)}>
            <DialogContent className="max-w-6xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>
                  Preview: {previewingSlide?.title || 'Untitled Slide'}
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
    </div>
  );
}