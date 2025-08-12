import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Play, Pause, FileText, Image, BarChart3, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Slide {
  id: string;
  slide_number: number;
  title: string | null;
  content: string;
  slide_type: string | null;
  speaker_notes: string | null;
  svg_animation: string | null;
}

interface SlideViewerProps {
  sessionNumber: number;
  lectureNumber: number;
}

export function SlideViewer({ sessionNumber, lectureNumber }: SlideViewerProps) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPresenting, setIsPresenting] = useState(false);

  useEffect(() => {
    loadSlides();
  }, [sessionNumber, lectureNumber]);

  const loadSlides = async () => {
    try {
      setLoading(true);
      
      // First get the session, then the lecture ID
      const { data: sessions } = await supabase
        .from('sessions_dynamic')
        .select('id')
        .eq('session_number', sessionNumber);

      if (sessions && sessions.length > 0) {
        const { data: lectures } = await supabase
          .from('lectures_dynamic')
          .select('id')
          .eq('session_id', sessions[0].id)
          .eq('lecture_number', lectureNumber);

        if (lectures && lectures.length > 0) {
          const { data: slidesData } = await supabase
            .from('lecture_slides')
            .select('*')
            .eq('lecture_id', lectures[0].id)
            .order('slide_number');

          setSlides(slidesData || []);
        }
      }
    } catch (error) {
      console.error('Error loading slides:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const parseSlideContent = (content: string) => {
    const lines = content.split('\n');
    let imageUrl = null;
    const textLines = [];

    for (const line of lines) {
      const imageMatch = line.match(/!\[.*?\]\((.*?)\)/);
      if (imageMatch && !imageUrl) {
        imageUrl = imageMatch[1];
      } else if (line.trim()) {
        textLines.push(line);
      }
    }

    return { imageUrl, textLines };
  };

  const formatTextContent = (lines: string[]) => {
    return lines.map((line, index) => {
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <li key={index} className="ml-4 text-foreground/90">
            {line.replace(/^[•-]\s*/, '')}
          </li>
        );
      }
      if (line.trim()) {
        return (
          <p key={index} className="text-foreground/90 leading-relaxed">
            {line}
          </p>
        );
      }
      return <br key={index} />;
    });
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

  const getSlideStyle = (slideType: string | null) => {
    switch (slideType) {
      case 'title':
        return 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20';
      case 'image':
        return 'bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/20';
      case 'chart':
        return 'bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/20';
      case 'team':
        return 'bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/20';
      default:
        return 'bg-gradient-to-br from-muted/50 to-muted/20 border-muted';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">No slides available for this lecture yet.</p>
      </div>
    );
  }

  const slide = slides[currentSlide];

  return (
    <div className="space-y-4">
      {/* Slide Navigation */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            {getSlideIcon(slide?.slide_type)}
            {slide?.slide_type || 'content'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Slide {currentSlide + 1} of {slides.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPresenting(!isPresenting)}
            className="gap-2"
          >
            {isPresenting ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPresenting ? 'Exit' : 'Present'}
          </Button>
        </div>
      </div>

      {/* Main Slide Display */}
      <Card className={cn(
        "p-8 transition-all duration-300",
        getSlideStyle(slide?.slide_type),
        isPresenting && "min-h-[85vh] md:min-h-[90vh]"
      )}>
        <div className="space-y-6">
          {/* Slide Title */}
          {slide?.title && (
            <h2 className={cn(
              "font-bold text-center",
              slide?.slide_type === 'title' ? "text-4xl" : "text-2xl"
            )}>
              {slide.title}
            </h2>
          )}

          {/* Slide Content */}
          <div className={cn(
            slide?.slide_type === 'title' ? "text-center text-xl" : "text-lg"
          )}>
            {slide?.slide_type === 'image' && (
              <div className="flex justify-center mb-6">
                <div className="w-full max-w-md h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                  <div className="text-center text-muted-foreground">
                    <Image className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Image Placeholder</p>
                    <p className="text-xs">Configure in Admin Panel</p>
                  </div>
                </div>
              </div>
            )}
            
            {(() => {
              const { imageUrl, textLines } = parseSlideContent(slide?.content || '');
              
              if (imageUrl && textLines.length > 0) {
                // Side-by-side layout for image and text
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="space-y-3">
                      {formatTextContent(textLines)}
                    </div>
                    <div className="flex justify-center">
                      <div className="responsive-image-container max-w-full w-full">
                        <img
                          src={imageUrl}
                          alt="Generated slide image"
                          className="w-full h-auto rounded-lg shadow-lg border"
                          style={{ maxHeight: '500px', objectFit: 'contain' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = document.createElement('div');
                            fallback.className = 'text-center text-muted-foreground p-4 border rounded-lg';
                            fallback.innerHTML = `<p>Image failed to load</p><p class="text-xs mt-1">${imageUrl}</p>`;
                            e.currentTarget.parentNode?.appendChild(fallback);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              } else if (imageUrl) {
                // Only image
                return (
                  <div className="flex justify-center">
                    <div className="responsive-image-container max-w-3xl w-full">
                      <img
                        src={imageUrl}
                        alt="Generated slide image"
                        className="w-full h-auto rounded-lg shadow-lg border"
                        style={{ maxHeight: '600px', objectFit: 'contain' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = document.createElement('div');
                          fallback.className = 'text-center text-muted-foreground p-4 border rounded-lg';
                          fallback.innerHTML = `<p>Image failed to load</p><p class="text-xs mt-1">${imageUrl}</p>`;
                          e.currentTarget.parentNode?.appendChild(fallback);
                        }}
                      />
                    </div>
                  </div>
                );
              } else {
                // Only text
                return (
                  <div className="space-y-3">
                    {formatTextContent(textLines)}
                  </div>
                );
              }
            })()}
          </div>

          {/* Speaker Notes (only in presentation mode) */}
          {isPresenting && slide?.speaker_notes && (
            <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Speaker Notes:</h4>
              <p className="text-sm text-muted-foreground">{slide.speaker_notes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        {/* Slide Thumbnails */}
        <div className="flex gap-2 max-w-md overflow-x-auto">
          {slides.map((s, index) => (
            <Button
              key={s.id}
              variant={index === currentSlide ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentSlide(index)}
              className="flex-shrink-0 w-8 h-8 p-0"
            >
              {index + 1}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}