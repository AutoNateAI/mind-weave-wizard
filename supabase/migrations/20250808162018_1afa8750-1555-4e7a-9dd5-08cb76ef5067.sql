-- Create table for logging all multiple choice interactions (every click)
CREATE TABLE public.multiple_choice_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.multiple_choice_questions(id) ON DELETE CASCADE,
  selected_option text NOT NULL CHECK (selected_option IN ('A', 'B', 'C', 'D')),
  is_correct boolean NOT NULL,
  interaction_timestamp timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for interactions
ALTER TABLE public.multiple_choice_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for interactions
CREATE POLICY "Users can view their own interactions" 
ON public.multiple_choice_interactions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interactions" 
ON public.multiple_choice_interactions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create reflection questions table
CREATE TABLE public.reflection_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_number integer NOT NULL,
  lecture_number integer NOT NULL,
  question_number integer NOT NULL CHECK (question_number >= 1 AND question_number <= 3),
  question_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(session_number, lecture_number, question_number)
);

-- Enable RLS for reflection questions
ALTER TABLE public.reflection_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for reflection questions
CREATE POLICY "Reflection questions are viewable by authenticated users" 
ON public.reflection_questions 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins can manage reflection questions" 
ON public.reflection_questions 
FOR ALL 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE users.id = auth.uid() 
  AND users.email = 'admin@gmail.com'
));

-- Add trigger for reflection questions
CREATE TRIGGER update_reflection_questions_updated_at
BEFORE UPDATE ON public.reflection_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update user_reflections table to handle multiple reflections per lesson
ALTER TABLE public.user_reflections 
ADD COLUMN reflection_question_id uuid REFERENCES public.reflection_questions(id) ON DELETE CASCADE;

-- Remove the old unique constraint and add new one
ALTER TABLE public.user_reflections 
DROP CONSTRAINT IF EXISTS user_reflections_user_id_session_number_lecture_number_key;

-- Add new unique constraint for the new structure
ALTER TABLE public.user_reflections 
ADD CONSTRAINT user_reflections_unique_per_question 
UNIQUE (user_id, reflection_question_id);

-- Insert default reflection questions for Session 1
INSERT INTO public.reflection_questions (session_number, lecture_number, question_number, question_text) VALUES
-- Lecture 1 Questions
(1, 1, 1, 'Where in my life have I been focusing on dots, not the connections?'),
(1, 1, 2, 'What relationships or patterns have I overlooked in my daily experiences?'),
(1, 1, 3, 'How might viewing things as interconnected graphs change my decision-making?'),

-- Lecture 2 Questions  
(1, 2, 1, 'What invisible links shape my daily decisions?'),
(1, 2, 2, 'How do I determine the "weight" or importance of different relationships in my life?'),
(1, 2, 3, 'What would happen if I consciously strengthened or weakened certain connections?'),

-- Lecture 3 Questions
(1, 3, 1, 'What is my current mental model for understanding intelligence and thinking?'),
(1, 3, 2, 'How does the graph perspective challenge or enhance my existing beliefs?'),
(1, 3, 3, 'What specific change will I make based on this new understanding?');