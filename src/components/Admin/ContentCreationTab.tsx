import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Instagram, 
  Brain,
  Send,
  Eye,
  Sparkles,
  Image as ImageIcon,
  Library,
  Edit,
  Check,
  Loader
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CarouselLibrary } from './CarouselLibrary';
import { CarouselDetailView } from './CarouselDetailView';

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

const CRITICAL_THINKING_CONCEPTS = [
  'Systems Thinking',
  'Pattern Recognition',
  'Mental Models',
  'First Principles',
  'Perspective Taking',
  'Logical Reasoning',
  'Evidence Evaluation',
  'Bias Recognition',
  'Decision Trees',
  'Cause and Effect Analysis'
];

export function ContentCreationTab() {
  const [activeTab, setActiveTab] = useState('create');
  const [carousels, setCarousels] = useState<InstagramCarousel[]>([]);
  const [selectedCarousel, setSelectedCarousel] = useState<InstagramCarousel | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStage, setCurrentStage] = useState<'form' | 'prompts' | 'images'>('form');
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
  const [editablePrompts, setEditablePrompts] = useState<string[]>([]);
  const [captionText, setCaptionText] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [targetAudiences, setTargetAudiences] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    carousel_name: '',
    research_content: '',
    selected_concepts: [] as string[],
    additional_instructions: ''
  });

  useEffect(() => {
    loadCarousels();
    // Set up real-time updates for carousel progress
    const channel = supabase
      .channel('carousel-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'instagram_carousels'
        },
        () => {
          loadCarousels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadCarousels = async () => {
    try {
      const { data, error } = await supabase
        .from('instagram_carousels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to ensure proper types
      const mappedData = (data || []).map(carousel => ({
        ...carousel,
        critical_thinking_concepts: Array.isArray(carousel.critical_thinking_concepts) 
          ? carousel.critical_thinking_concepts as string[]
          : [],
        image_prompts: Array.isArray(carousel.image_prompts) 
          ? carousel.image_prompts as string[]
          : [],
        generated_images: Array.isArray(carousel.generated_images) 
          ? carousel.generated_images as string[]
          : [],
        hashtags: Array.isArray(carousel.hashtags) 
          ? carousel.hashtags as string[]
          : [],
        target_audiences: Array.isArray(carousel.target_audiences) 
          ? carousel.target_audiences as string[]
          : []
      }));
      
      setCarousels(mappedData);
    } catch (error) {
      console.error('Error loading carousels:', error);
      toast.error('Failed to load carousels');
    }
  };

  const generatePrompts = async () => {
    if (!formData.carousel_name || !formData.research_content) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-carousel', {
        body: {
          action: 'generate_prompts',
          carouselName: formData.carousel_name,
          researchContent: formData.research_content,
          criticalThinkingConcepts: formData.selected_concepts,
          additionalInstructions: formData.additional_instructions
        }
      });

      if (error) throw error;

      setGeneratedPrompts(data.imagePrompts);
      setEditablePrompts([...data.imagePrompts]);
      setCaptionText(data.captionText);
      setHashtags(data.hashtags);
      setTargetAudiences(data.targetAudiences);
      setCurrentStage('prompts');
      
      toast.success('Prompts generated successfully! Review and edit them before generating images.');
      loadCarousels();
    } catch (error) {
      console.error('Error generating prompts:', error);
      toast.error('Failed to generate prompts');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateImages = async () => {
    setIsGenerating(true);
    try {
      // Find the carousel that was just created
      const carousel = carousels.find(c => c.status === 'ready_to_generate');
      if (!carousel) {
        throw new Error('Carousel not found');
      }

      const { error } = await supabase.functions.invoke('generate-carousel', {
        body: {
          action: 'generate_images',
          carouselId: carousel.id,
          imagePrompts: editablePrompts
        }
      });

      if (error) throw error;

      setCurrentStage('images');
      toast.success('Images are being generated! This may take a few moments.');
      setActiveTab('library'); // Switch to library to see progress
    } catch (error) {
      console.error('Error generating images:', error);
      toast.error('Failed to start image generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      carousel_name: '',
      research_content: '',
      selected_concepts: [],
      additional_instructions: ''
    });
    setCurrentStage('form');
    setGeneratedPrompts([]);
    setEditablePrompts([]);
    setCaptionText('');
    setHashtags([]);
    setTargetAudiences([]);
  };

  const toggleConcept = (concept: string) => {
    setFormData(prev => ({
      ...prev,
      selected_concepts: prev.selected_concepts.includes(concept)
        ? prev.selected_concepts.filter(c => c !== concept)
        : [...prev.selected_concepts, concept]
    }));
  };

  const updatePrompt = (index: number, newPrompt: string) => {
    const updated = [...editablePrompts];
    updated[index] = newPrompt;
    setEditablePrompts(updated);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'generating_images': return 'secondary';
      case 'ready_to_generate': return 'outline';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  if (selectedCarousel) {
    return (
      <CarouselDetailView 
        carousel={selectedCarousel} 
        onBack={() => setSelectedCarousel(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Instagram className="h-6 w-6" />
          Instagram Carousel Generator
        </h2>
        <p className="text-muted-foreground">
          Generate Instagram carousels for software engineers based on research and critical thinking concepts.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Carousel</TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            Library ({carousels.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          {currentStage === 'form' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generate Instagram Carousel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="carousel_name">Carousel Name *</Label>
                  <Input
                    id="carousel_name"
                    value={formData.carousel_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, carousel_name: e.target.value }))}
                    placeholder="e.g., AI Code Review Tools - Critical Analysis"
                  />
                </div>

                <div>
                  <Label htmlFor="research_content">Research Content *</Label>
                  <Textarea
                    id="research_content"
                    value={formData.research_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, research_content: e.target.value }))}
                    placeholder="Paste your research content, article, or findings here..."
                    rows={6}
                  />
                </div>

                <div>
                  <Label>Critical Thinking Concepts</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {CRITICAL_THINKING_CONCEPTS.map(concept => (
                      <Button
                        key={concept}
                        variant={formData.selected_concepts.includes(concept) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleConcept(concept)}
                        className="justify-start text-xs"
                      >
                        <Brain className="h-3 w-3 mr-1" />
                        {concept}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="additional_instructions">Additional Instructions</Label>
                  <Textarea
                    id="additional_instructions"
                    value={formData.additional_instructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, additional_instructions: e.target.value }))}
                    placeholder="Any specific requirements, tone, or focus areas..."
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={generatePrompts}
                  disabled={isGenerating || !formData.carousel_name || !formData.research_content}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Generating Prompts...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Image Prompts
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {currentStage === 'prompts' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Review & Edit Image Prompts
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Review the generated prompts below. You can edit them before generating the images.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editablePrompts.map((prompt, index) => (
                    <div key={index} className="space-y-2">
                      <Label>Image {index + 1} {index === 0 ? '(Scroll Stopper)' : index === 8 ? '(Call to Action)' : ''}</Label>
                      <Textarea
                        value={prompt}
                        onChange={(e) => updatePrompt(index, e.target.value)}
                        rows={3}
                        className="text-sm"
                      />
                    </div>
                  ))}
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={generateImages}
                      disabled={isGenerating}
                      className="flex-1"
                    >
                      {isGenerating ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Starting Generation...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Generate 9 Images
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
                      Start Over
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Caption & Hashtags Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Caption Text</Label>
                    <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                      {captionText}
                    </div>
                  </div>
                  <div>
                    <Label>Hashtags</Label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {hashtags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Target Audiences</Label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {targetAudiences.map((audience, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {audience}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="library">
          <CarouselLibrary 
            carousels={carousels} 
            onSelectCarousel={(carousel) => setSelectedCarousel(carousel)}
            getStatusColor={getStatusColor}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}