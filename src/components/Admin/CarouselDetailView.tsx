import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Copy,
  Grid3X3,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Target,
  Hash,
  Instagram,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

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

interface CarouselDetailViewProps {
  carousel: InstagramCarousel;
  onBack: () => void;
}

export function CarouselDetailView({ carousel, onBack }: CarouselDetailViewProps) {
  const [viewMode, setViewMode] = useState<'gallery' | 'single'>('gallery');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const copyHashtags = () => {
    const hashtagText = carousel.hashtags.join(' ');
    copyToClipboard(hashtagText, 'Hashtags');
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev < carousel.generated_images.length - 1 ? prev + 1 : 0
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev > 0 ? prev - 1 : carousel.generated_images.length - 1
    );
  };

  const validImages = carousel.generated_images.filter(img => img);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Library
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{carousel.carousel_name}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {formatDate(carousel.created_at)}
            <Badge variant="secondary" className="ml-2">
              {carousel.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Caption, Hashtags, Audiences */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="h-5 w-5" />
                Instagram Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {carousel.caption_text && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Caption Text</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(carousel.caption_text!, 'Caption')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                    {carousel.caption_text}
                  </div>
                </div>
              )}

              {carousel.hashtags && carousel.hashtags.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium flex items-center gap-1">
                      <Hash className="h-4 w-4" />
                      Hashtags ({carousel.hashtags.length})
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyHashtags}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {carousel.hashtags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {carousel.target_audiences && carousel.target_audiences.length > 0 && (
                <div>
                  <h4 className="font-medium flex items-center gap-1 mb-2">
                    <Target className="h-4 w-4" />
                    Target Audiences
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {carousel.target_audiences.map((audience, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {audience}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Critical Thinking Concepts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {carousel.critical_thinking_concepts.map((concept, index) => (
                  <Badge key={index} variant="default" className="text-xs">
                    {concept}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {carousel.research_content && (
            <Card>
              <CardHeader>
                <CardTitle>Research Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground max-h-40 overflow-y-auto">
                  {carousel.research_content.split('\n').map((line, index) => (
                    <p key={index} className="mb-2">{line}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {carousel.error_message && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Error Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-red-600">
                  {carousel.error_message}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Images */}
        <div className="space-y-4">
          {validImages.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Images ({validImages.length}/9)</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={viewMode === 'gallery' ? 'default' : 'outline'}
                      onClick={() => setViewMode('gallery')}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'single' ? 'default' : 'outline'}
                      onClick={() => setViewMode('single')}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === 'gallery' ? (
                  <div className="grid grid-cols-3 gap-2">
                    {validImages.map((imageUrl, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          setCurrentImageIndex(index);
                          setViewMode('single');
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt={`Carousel image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Image {currentImageIndex + 1} of {validImages.length}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={prevImage}
                          disabled={validImages.length <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={nextImage}
                          disabled={validImages.length <= 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="aspect-square rounded overflow-hidden bg-muted">
                      <img
                        src={validImages[currentImageIndex]}
                        alt={`Carousel image ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    {carousel.image_prompts && carousel.image_prompts[currentImageIndex] && (
                      <div className="p-3 bg-muted rounded-md">
                        <h5 className="font-medium text-sm mb-1">Image Prompt:</h5>
                        <p className="text-xs text-muted-foreground">
                          {carousel.image_prompts[currentImageIndex]}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Images Generated</h3>
                <p className="text-muted-foreground text-center">
                  {carousel.status === 'generating_images' 
                    ? 'Images are still being generated...' 
                    : 'No images have been generated for this carousel yet.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}