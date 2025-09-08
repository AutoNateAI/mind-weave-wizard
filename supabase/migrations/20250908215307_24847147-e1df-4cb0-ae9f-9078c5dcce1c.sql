-- Create Instagram carousels table
CREATE TABLE public.instagram_carousels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  carousel_name TEXT NOT NULL,
  research_content TEXT NOT NULL,
  critical_thinking_concepts JSONB DEFAULT '[]'::jsonb,
  additional_instructions TEXT,
  status TEXT DEFAULT 'generating_prompts'::text, -- generating_prompts, ready_to_generate, generating_images, completed, failed
  image_prompts JSONB DEFAULT '[]'::jsonb, -- Array of 9 image prompts
  generated_images JSONB DEFAULT '[]'::jsonb, -- Array of 9 image URLs
  caption_text TEXT,
  hashtags JSONB DEFAULT '[]'::jsonb,
  target_audiences JSONB DEFAULT '[]'::jsonb,
  progress INTEGER DEFAULT 0, -- 0-100 for generation progress
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.instagram_carousels ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage instagram carousels" 
ON public.instagram_carousels 
FOR ALL 
USING (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text);

-- Add trigger for timestamps
CREATE TRIGGER update_instagram_carousels_updated_at
BEFORE UPDATE ON public.instagram_carousels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();