import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Image, BarChart3, Users } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Slide {
  id: string;
  slide_number: number;
  title: string | null;
  content: string;
  slide_type: string | null;
  speaker_notes: string | null;
  svg_animation: string | null;
}

interface SlidePreviewProps {
  slide: Slide;
}

export function SlidePreview({ slide }: SlidePreviewProps) {
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
        return 'glass border-border/20';
    }
  };

  const formatContent = (content: string) => {
    // Convert bullet points to proper markdown
    return content
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
          return `- ${trimmed.substring(1).trim()}`;
        }
        return trimmed;
      })
      .join('\n');
  };

  return (
    <Card className={`p-8 min-h-[500px] transition-all duration-300 ${getSlideStyle(slide.slide_type)}`}>
      <div className="space-y-6">
        {/* Slide Header */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="gap-2">
            {getSlideIcon(slide.slide_type)}
            {slide.slide_type || 'content'} slide
          </Badge>
          <span className="text-sm text-muted-foreground">
            Slide {slide.slide_number}
          </span>
        </div>

        {/* Title */}
        {slide.title && (
          <div className="text-center">
            <h1 className={`font-bold leading-tight ${
              slide.slide_type === 'title' 
                ? 'text-4xl md:text-5xl' 
                : 'text-2xl md:text-3xl'
            }`}>
              {slide.title}
            </h1>
          </div>
        )}

        {/* Content */}
        {slide.content && (
          <div className="flex-1">
            {slide.slide_type === 'image' ? (
              <div className="space-y-4">
                {slide.content.includes('![') ? (
                  <ReactMarkdown
                    components={{
                      img: ({ src, alt }) => (
                        <div className="flex justify-center">
                          <img 
                            src={src} 
                            alt={alt || 'Slide image'} 
                            className="max-w-full max-h-96 object-contain rounded-lg shadow-md"
                          />
                        </div>
                      ),
                      p: ({ children }) => <p className="text-center text-lg">{children}</p>
                    }}
                  >
                    {slide.content}
                  </ReactMarkdown>
                ) : (
                  <div className="flex items-center justify-center h-48 bg-muted/50 rounded-lg border-2 border-dashed">
                    <div className="text-center text-muted-foreground">
                      <Image className="w-12 h-12 mx-auto mb-2" />
                      <p>Image placeholder</p>
                      <p className="text-sm mt-2">{slide.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    ul: ({ children }) => (
                      <ul className="space-y-2 text-lg list-disc pl-6">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className="leading-relaxed">{children}</li>
                    ),
                    p: ({ children }) => (
                      <p className="text-lg leading-relaxed mb-4">{children}</p>
                    )
                  }}
                >
                  {formatContent(slide.content)}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Speaker Notes Preview */}
        {slide.speaker_notes && (
          <div className="border-t pt-4 mt-auto">
            <div className="text-sm text-muted-foreground">
              <strong>Speaker Notes:</strong>
              <p className="mt-1 italic line-clamp-2">{slide.speaker_notes}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}