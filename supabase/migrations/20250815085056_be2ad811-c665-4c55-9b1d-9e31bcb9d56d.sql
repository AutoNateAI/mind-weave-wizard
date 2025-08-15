-- Create targeted_locations table
CREATE TABLE public.targeted_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  office_address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  custom_boundaries JSONB DEFAULT '[]'::jsonb,
  predefined_zone TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'US',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Create social_accounts table for Phyllo integration
CREATE TABLE public.social_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL, -- 'linkedin', 'instagram'
  phyllo_account_id TEXT,
  phyllo_user_id TEXT,
  account_username TEXT,
  account_display_name TEXT,
  account_profile_url TEXT,
  access_token_encrypted TEXT,
  is_connected BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'completed', 'error'
  account_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Create linkedin_profiles table for Apify data
CREATE TABLE public.linkedin_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  linkedin_profile_id TEXT UNIQUE,
  public_id TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  headline TEXT,
  occupation TEXT,
  location TEXT,
  profile_url TEXT,
  picture_url TEXT,
  cover_image_url TEXT,
  country_code TEXT,
  geo_location_name TEXT,
  company_name TEXT,
  company_linkedin_url TEXT,
  industry_name TEXT,
  summary TEXT,
  positions JSONB DEFAULT '[]'::jsonb,
  educations JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  languages JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  raw_data JSONB,
  upload_batch_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create linkedin_posts table for Apify data
CREATE TABLE public.linkedin_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  linkedin_post_urn TEXT UNIQUE,
  text_content TEXT,
  post_url TEXT,
  posted_at_timestamp BIGINT,
  posted_at_iso TIMESTAMP WITH TIME ZONE,
  time_since_posted TEXT,
  is_repost BOOLEAN DEFAULT false,
  author_type TEXT,
  author_profile_url TEXT,
  author_profile_id TEXT,
  author_full_name TEXT,
  author_headline TEXT,
  post_type TEXT, -- 'text', 'image', 'video', etc.
  images JSONB DEFAULT '[]'::jsonb,
  num_likes INTEGER DEFAULT 0,
  num_comments INTEGER DEFAULT 0,
  num_shares INTEGER DEFAULT 0,
  reactions JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  raw_data JSONB,
  upload_batch_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create location_social_mapping table
CREATE TABLE public.location_social_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.targeted_locations(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE SET NULL,
  linkedin_profile_id UUID REFERENCES public.linkedin_profiles(id) ON DELETE SET NULL,
  mapping_type TEXT NOT NULL, -- 'account', 'profile', 'post_analysis'
  confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
  distance_km DECIMAL(8, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create content_campaigns table
CREATE TABLE public.content_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  target_location_id UUID REFERENCES public.targeted_locations(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'linkedin_post', 'instagram_post', 'story'
  generated_content TEXT,
  content_prompt TEXT,
  critical_thinking_concepts JSONB DEFAULT '[]'::jsonb,
  target_audience_analysis JSONB,
  content_status TEXT DEFAULT 'draft', -- 'draft', 'reviewed', 'published', 'scheduled'
  scheduled_publish_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Create social_analytics table
CREATE TABLE public.social_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.content_campaigns(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.targeted_locations(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'engagement', 'reach', 'clicks', 'conversions'
  metric_value DECIMAL(12, 2),
  metric_date DATE,
  additional_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create upload_batches table to track JSON uploads
CREATE TABLE public.upload_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_name TEXT NOT NULL,
  data_source TEXT NOT NULL, -- 'apify_people_search', 'apify_post_scraper', 'apify_profile_scraper'
  file_name TEXT,
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  error_log JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Enable RLS on all tables
ALTER TABLE public.targeted_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_social_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_batches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (Admin can manage all, authenticated users can view)
CREATE POLICY "Admin can manage targeted locations" ON public.targeted_locations
  FOR ALL USING (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text);

CREATE POLICY "Admin can manage social accounts" ON public.social_accounts
  FOR ALL USING (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text);

CREATE POLICY "Admin can manage linkedin profiles" ON public.linkedin_profiles
  FOR ALL USING (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text);

CREATE POLICY "Admin can manage linkedin posts" ON public.linkedin_posts
  FOR ALL USING (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text);

CREATE POLICY "Admin can manage location social mapping" ON public.location_social_mapping
  FOR ALL USING (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text);

CREATE POLICY "Admin can manage content campaigns" ON public.content_campaigns
  FOR ALL USING (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text);

CREATE POLICY "Admin can manage social analytics" ON public.social_analytics
  FOR ALL USING (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text);

CREATE POLICY "Admin can manage upload batches" ON public.upload_batches
  FOR ALL USING (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text);

-- Create update triggers
CREATE TRIGGER update_targeted_locations_updated_at
  BEFORE UPDATE ON public.targeted_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_linkedin_profiles_updated_at
  BEFORE UPDATE ON public.linkedin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_linkedin_posts_updated_at
  BEFORE UPDATE ON public.linkedin_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_location_social_mapping_updated_at
  BEFORE UPDATE ON public.location_social_mapping
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_campaigns_updated_at
  BEFORE UPDATE ON public.content_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_upload_batches_updated_at
  BEFORE UPDATE ON public.upload_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_targeted_locations_coordinates ON public.targeted_locations(latitude, longitude);
CREATE INDEX idx_linkedin_profiles_location ON public.linkedin_profiles(location);
CREATE INDEX idx_linkedin_profiles_company ON public.linkedin_profiles(company_name);
CREATE INDEX idx_linkedin_posts_author ON public.linkedin_posts(author_profile_id);
CREATE INDEX idx_linkedin_posts_posted_at ON public.linkedin_posts(posted_at_iso);
CREATE INDEX idx_location_social_mapping_location ON public.location_social_mapping(location_id);
CREATE INDEX idx_social_analytics_date ON public.social_analytics(metric_date);
CREATE INDEX idx_upload_batches_source ON public.upload_batches(data_source);