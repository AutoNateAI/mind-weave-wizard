-- Add status column to courses table for publishing
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;

-- Add published_at timestamp
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS published_at timestamp with time zone;

-- Create a trigger to update published_at when is_published is set to true
CREATE OR REPLACE FUNCTION public.update_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = true AND OLD.is_published = false THEN
    NEW.published_at = now();
  ELSIF NEW.is_published = false THEN
    NEW.published_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_courses_published_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_published_at();