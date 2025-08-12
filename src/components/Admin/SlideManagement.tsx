import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageDimensions, setImageDimensions] = useState('1024x1024');
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

  const generateImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error('Please enter an image prompt');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const response = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: imagePrompt,
          size: imageDimensions,
          quality: 'hd'
        }
      });

      if (response.error) throw response.error;
      
      // For now, just show success - in real implementation, this would save the image
      toast.success('Image generated successfully! (Integration pending)');
      setImagePrompt('');
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Wand2 className="w-4 h-4" />
                    Generate Image
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Image with AI</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Image Prompt</label>
                      <Textarea
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder="Describe the image you want to generate..."
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
                      onClick={generateImage} 
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
                      <label className="text-sm font-medium">Slide Number</label>
                      <Input
                        type="number"
                        value={editingSlide.slide_number}
                        onChange={(e) => setEditingSlide({
                          ...editingSlide,
                          slide_number: parseInt(e.target.value) || 1
                        })}
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
        </>
      )}
    </div>
  );
}