-- Add context_seed field to courses table for storing course-specific contextual information
ALTER TABLE courses ADD COLUMN context_seed TEXT;

-- Add a comment to explain the purpose of this field
COMMENT ON COLUMN courses.context_seed IS 'Stores contextual information used as seed for AI content generation across the course';