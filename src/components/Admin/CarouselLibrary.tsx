import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Eye,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  Loader,
  Instagram
} from 'lucide-react';

interface InstagramCarousel {
  id: string;
  carousel_name: string;
  research_content: string;
  critical_thinking_concepts: string[];
  additional_instructions: string | null;
  status: string;
  image_prompts: string[];
  generated_images: string[];
  caption_text: string | null;
  hashtags: string[];
  target_audiences: string[];
  progress: number;
  error_message: string | null;
  created_at: string;
  updated_at?: string;
  created_by?: string | null;
}

interface CarouselLibraryProps {
  carousels: InstagramCarousel[];
  onSelectCarousel: (carousel: InstagramCarousel) => void;
  getStatusColor: (status: string) => string;
}

export function CarouselLibrary({ carousels, onSelectCarousel, getStatusColor }: CarouselLibraryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'generating_images':
        return <Loader className="h-4 w-4 animate-spin text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Target className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'generating_prompts':
        return 'Generating Prompts';
      case 'ready_to_generate':
        return 'Ready to Generate';
      case 'generating_images':
        return 'Generating Images';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  if (carousels.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Instagram className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No carousels yet</h3>
          <p className="text-muted-foreground text-center">
            Create your first Instagram carousel to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {carousels.map((carousel) => (
        <Card key={carousel.id} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base line-clamp-2">
                {carousel.carousel_name}
              </CardTitle>
              <Badge variant={getStatusColor(carousel.status) as any} className="ml-2 shrink-0">
                {getStatusIcon(carousel.status)}
                <span className="ml-1 text-xs">{getStatusText(carousel.status)}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress bar for generating carousels */}
            {(carousel.status === 'generating_images' || carousel.status === 'generating_prompts') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{carousel.progress}%</span>
                </div>
                <Progress value={carousel.progress} className="h-2" />
              </div>
            )}

            {/* Preview images - show first 3 if available */}
            {carousel.generated_images && carousel.generated_images.length > 0 && (
              <div className="grid grid-cols-3 gap-1">
                {carousel.generated_images.slice(0, 3).map((imageUrl, index) => (
                  imageUrl ? (
                    <div key={index} className="aspect-square rounded overflow-hidden bg-muted">
                      <img
                        src={imageUrl}
                        alt={`Carousel image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div key={index} className="aspect-square rounded bg-muted flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )
                ))}
                {carousel.generated_images.length > 3 && (
                  <div className="col-span-3 text-center text-xs text-muted-foreground">
                    +{carousel.generated_images.length - 3} more images
                  </div>
                )}
              </div>
            )}

            {/* Caption preview */}
            {carousel.caption_text && (
              <div className="text-sm text-muted-foreground line-clamp-3">
                {carousel.caption_text}
              </div>
            )}

            {/* Critical thinking concepts */}
            {carousel.critical_thinking_concepts && carousel.critical_thinking_concepts.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {carousel.critical_thinking_concepts.slice(0, 2).map((concept, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {concept}
                  </Badge>
                ))}
                {carousel.critical_thinking_concepts.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{carousel.critical_thinking_concepts.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {/* Error message */}
            {carousel.error_message && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {carousel.error_message}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(carousel.created_at)}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onSelectCarousel(carousel)}
                className="h-8 px-2"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}