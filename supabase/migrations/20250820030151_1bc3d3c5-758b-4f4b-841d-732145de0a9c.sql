-- Add analysis flags to linkedin_profiles and linkedin_posts
ALTER TABLE public.linkedin_profiles
  ADD COLUMN IF NOT EXISTS analyzed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reanalyze_requested boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_analyzed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_analysis
  ON public.linkedin_profiles (reanalyze_requested, analyzed, updated_at);

ALTER TABLE public.linkedin_posts
  ADD COLUMN IF NOT EXISTS analyzed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reanalyze_requested boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_analyzed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_linkedin_posts_analysis
  ON public.linkedin_posts (reanalyze_requested, analyzed, posted_at_iso);
