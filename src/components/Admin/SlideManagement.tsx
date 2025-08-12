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
  Upload
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
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<string | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [previewingSlide, setPreviewingSlide] = useState<Slide | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageDimensions, setImageDimensions] = useState('1024x1024');
  const [targetSlideForImage, setTargetSlideForImage] = useState<Slide | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedCourseId) {
      loadLectures();
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedLecture) {
      loadSlides();
    }
  }, [selectedLecture]);

  const loadLectures = async () => {
    try {
      const { data: sessions } = await supabase
        .from('sessions_dynamic')
        .select('id, session_number')
        .eq('course_id', selectedCourseId)
        .order('session_number');

      if (sessions) {
        const allLectures: Lecture[] = [];
        for (const session of sessions) {
          const { data: sessionLectures } = await supabase
            .from('lectures_dynamic')
            .select('*')
            .eq('session_id', session.id)
            .order('lecture_number');

          if (sessionLectures) {
            allLectures.push(...sessionLectures.map(lecture => ({
              ...lecture,
              session_number: session.session_number
            })));
          }
        }
        setLectures(allLectures);
      }
    } catch (error) {
      console.error('Error loading lectures:', error);
      toast.error('Failed to load lectures');
    } finally {
      setLoading(false);
    }
  };

  const loadSlides = async () => {
    try {
      const { data: slidesData } = await supabase
        .from('lecture_slides')
        .select('*')
        .eq('lecture_id', selectedLecture)
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
        lecture_id: selectedLecture,
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
    if (!imagePrompt.trim() || !targetSlideForImage) {
      toast.error('Please enter an image prompt');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const response = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: imagePrompt,
          size: imageDimensions,
          quality: 'high'
        }
      });

      if (response.error) throw response.error;
      
      if (response.data?.imageUrl) {
        // Update the slide content with the generated image URL
        const updatedContent = targetSlideForImage.content + 
          (targetSlideForImage.content ? '\n\n' : '') + 
          `![Generated Image](${response.data.imageUrl})`;
        
        await supabase
          .from('lecture_slides')
          .update({ content: updatedContent })
          .eq('id', targetSlideForImage.id);
        
        toast.success('Image generated and added to slide!');
        loadSlides();
      } else {
        toast.success('Image generated successfully!');
      }
      
      setImagePrompt('');
      setTargetSlideForImage(null);
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image');
    } finally {
      setIsGeneratingImage(false);
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
      {/* Lecture Selection */}
      <Card className="p-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Select Lecture</h3>
          <Select value={selectedLecture || ''} onValueChange={setSelectedLecture}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a lecture to manage slides" />
            </SelectTrigger>
            <SelectContent>
              {lectures.map((lecture) => (
                <SelectItem key={lecture.id} value={lecture.id}>
                  Session {lecture.session_number}, Lecture {lecture.lecture_number}: {lecture.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {selectedLecture && (
        <>
          {/* Slide Management Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Slide Management</h3>
            <div className="flex gap-2">
              <Button onClick={createNewSlide} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Slide
              </Button>
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
                      >
                        <Image className="w-3 h-3" />
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

                  <div>
                    <label className="text-sm font-medium">Content</label>
                    <Textarea
                      value={editingSlide.content}
                      onChange={(e) => setEditingSlide({
                        ...editingSlide,
                        content: e.target.value
                      })}
                      className="mt-1 min-h-[120px]"
                      placeholder="Enter slide content (use bullet points with • or -)..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Speaker Notes</label>
                    <Textarea
                      value={editingSlide.speaker_notes || ''}
                      onChange={(e) => setEditingSlide({
                        ...editingSlide,
                        speaker_notes: e.target.value
                      })}
                      className="mt-1"
                      placeholder="Enter speaker notes (optional)..."
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
                  <label className="text-sm font-medium">Image Prompt</label>
                  <Textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe the image you want to generate for this slide..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Dimensions</label>
                  <Select value={imageDimensions} onValueChange={setImageDimensions}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024x1024">1024x1024 (Square)</SelectItem>
                      <SelectItem value="1792x1024">1792x1024 (Landscape)</SelectItem>
                      <SelectItem value="1024x1792">1024x1792 (Portrait)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={generateImageForSlide} 
                  disabled={isGeneratingImage}
                  className="w-full gap-2"
                >
                  {isGeneratingImage ? (
                    <>Generating...</>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generate Image
                    </>
                  )}
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