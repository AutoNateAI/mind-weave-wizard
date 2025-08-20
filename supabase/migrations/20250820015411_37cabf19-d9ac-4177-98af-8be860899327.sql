-- Create keywords analytics table
CREATE TABLE public.keywords_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  source_type TEXT NOT NULL CHECK (source_type IN ('profile', 'post', 'comment')),
  source_id UUID NOT NULL,
  location_latitude NUMERIC,
  location_longitude NUMERIC,
  location_name TEXT,
  sentiment_score NUMERIC CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  industry_tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attention heatmap data table
CREATE TABLE public.attention_heatmap_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_latitude NUMERIC NOT NULL,
  location_longitude NUMERIC NOT NULL,
  keyword TEXT NOT NULL,
  density_score NUMERIC NOT NULL DEFAULT 0,
  engagement_score NUMERIC DEFAULT 0,
  sentiment_avg NUMERIC DEFAULT 0,
  profile_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  date_snapshot DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.keywords_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attention_heatmap_data ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin can manage keywords analytics" 
ON public.keywords_analytics 
FOR ALL 
USING (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text);

CREATE POLICY "Admin can manage heatmap data" 
ON public.attention_heatmap_data 
FOR ALL 
USING (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text);

-- Create indexes for performance
CREATE INDEX idx_keywords_analytics_location ON public.keywords_analytics(location_latitude, location_longitude);
CREATE INDEX idx_keywords_analytics_keyword ON public.keywords_analytics(keyword);
CREATE INDEX idx_keywords_analytics_source ON public.keywords_analytics(source_type, source_id);

CREATE INDEX idx_heatmap_location ON public.attention_heatmap_data(location_latitude, location_longitude);
CREATE INDEX idx_heatmap_keyword ON public.attention_heatmap_data(keyword);
CREATE INDEX idx_heatmap_date ON public.attention_heatmap_data(date_snapshot);

-- Create trigger for updated_at
CREATE TRIGGER update_keywords_analytics_updated_at
BEFORE UPDATE ON public.keywords_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_heatmap_data_updated_at
BEFORE UPDATE ON public.attention_heatmap_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();