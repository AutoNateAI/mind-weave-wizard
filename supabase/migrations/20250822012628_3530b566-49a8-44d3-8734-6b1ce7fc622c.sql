-- Create Reddit subreddits table
CREATE TABLE public.reddit_subreddits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subreddit_name TEXT NOT NULL UNIQUE,
  display_name TEXT,
  description TEXT,
  subscribers INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  tracking_keywords JSONB DEFAULT '[]'::jsonb,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create Reddit posts table
CREATE TABLE public.reddit_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reddit_post_id TEXT NOT NULL UNIQUE,
  subreddit_id UUID REFERENCES public.reddit_subreddits(id),
  subreddit_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  author TEXT,
  score INTEGER DEFAULT 0,
  upvote_ratio NUMERIC DEFAULT 0,
  num_comments INTEGER DEFAULT 0,
  created_utc TIMESTAMP WITH TIME ZONE,
  url TEXT,
  permalink TEXT,
  post_type TEXT DEFAULT 'text',
  is_self BOOLEAN DEFAULT true,
  ai_summary TEXT,
  keywords JSONB DEFAULT '[]'::jsonb,
  topics JSONB DEFAULT '[]'::jsonb,
  sentiment_score NUMERIC,
  sentiment_label TEXT,
  entry_points JSONB DEFAULT '[]'::jsonb,
  analyzed_at TIMESTAMP WITH TIME ZONE,
  is_monitored BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Reddit comments table
CREATE TABLE public.reddit_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reddit_comment_id TEXT NOT NULL UNIQUE,
  post_id UUID REFERENCES public.reddit_posts(id),
  parent_comment_id UUID REFERENCES public.reddit_comments(id),
  reddit_post_id TEXT NOT NULL,
  author TEXT,
  content TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  created_utc TIMESTAMP WITH TIME ZONE,
  permalink TEXT,
  depth INTEGER DEFAULT 0,
  is_submitter BOOLEAN DEFAULT false,
  ai_summary TEXT,
  keywords JSONB DEFAULT '[]'::jsonb,
  topics JSONB DEFAULT '[]'::jsonb,
  sentiment_score NUMERIC,
  sentiment_label TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create our Reddit comments/responses table
CREATE TABLE public.reddit_my_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.reddit_posts(id),
  parent_comment_id UUID REFERENCES public.reddit_comments(id),
  reddit_post_id TEXT NOT NULL,
  reddit_parent_id TEXT, -- Reddit's parent ID format
  generated_response TEXT NOT NULL,
  final_response TEXT,
  entry_point_used TEXT,
  status TEXT DEFAULT 'draft', -- draft, edited, submitted
  reddit_comment_id TEXT, -- After submission
  submission_response TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Reddit analytics table
CREATE TABLE public.reddit_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subreddit_id UUID REFERENCES public.reddit_subreddits(id),
  subreddit_name TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'keyword', 'topic', 'sentiment', 'engagement'
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  content_type TEXT NOT NULL, -- 'post', 'comment'
  time_period DATE NOT NULL,
  additional_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_reddit_posts_subreddit ON public.reddit_posts(subreddit_id);
CREATE INDEX idx_reddit_posts_created_utc ON public.reddit_posts(created_utc);
CREATE INDEX idx_reddit_posts_monitored ON public.reddit_posts(is_monitored);
CREATE INDEX idx_reddit_comments_post ON public.reddit_comments(post_id);
CREATE INDEX idx_reddit_comments_parent ON public.reddit_comments(parent_comment_id);
CREATE INDEX idx_reddit_my_comments_post ON public.reddit_my_comments(post_id);
CREATE INDEX idx_reddit_my_comments_status ON public.reddit_my_comments(status);
CREATE INDEX idx_reddit_analytics_subreddit_time ON public.reddit_analytics(subreddit_id, time_period);
CREATE INDEX idx_reddit_analytics_metric ON public.reddit_analytics(metric_type, metric_name);

-- Enable RLS on all tables
ALTER TABLE public.reddit_subreddits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reddit_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reddit_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reddit_my_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reddit_analytics ENABLE ROW LEVEL SECURITY;

-- Create admin policies
CREATE POLICY "Admin can manage reddit subreddits" ON public.reddit_subreddits FOR ALL USING (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text);
CREATE POLICY "Admin can manage reddit posts" ON public.reddit_posts FOR ALL USING (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text);
CREATE POLICY "Admin can manage reddit comments" ON public.reddit_comments FOR ALL USING (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text);
CREATE POLICY "Admin can manage reddit my comments" ON public.reddit_my_comments FOR ALL USING (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text);
CREATE POLICY "Admin can manage reddit analytics" ON public.reddit_analytics FOR ALL USING (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text);

-- Create update triggers
CREATE TRIGGER update_reddit_subreddits_updated_at BEFORE UPDATE ON public.reddit_subreddits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reddit_posts_updated_at BEFORE UPDATE ON public.reddit_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reddit_comments_updated_at BEFORE UPDATE ON public.reddit_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reddit_my_comments_updated_at BEFORE UPDATE ON public.reddit_my_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();