-- Create multiple choice questions table
CREATE TABLE public.multiple_choice_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_number integer NOT NULL,
  lecture_number integer NOT NULL,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option text NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.multiple_choice_questions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Multiple choice questions are viewable by authenticated users" 
ON public.multiple_choice_questions 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins can manage multiple choice questions" 
ON public.multiple_choice_questions 
FOR ALL 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE users.id = auth.uid() 
  AND users.email = 'admin@gmail.com'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_multiple_choice_questions_updated_at
BEFORE UPDATE ON public.multiple_choice_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default questions for Session 1
INSERT INTO public.multiple_choice_questions (session_number, lecture_number, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES
-- Lecture 1 Questions
(1, 1, 'What are the basic building blocks of a graph?', 'Vertices and lines', 'Nodes and edges', 'Points and connections', 'Elements and links', 'B'),
(1, 1, 'In graph theory, what represents relationships between entities?', 'Nodes', 'Vertices', 'Edges', 'Elements', 'C'),

-- Lecture 2 Questions  
(1, 2, 'What is the main difference between directed and undirected graphs?', 'Color coding', 'Edge direction matters in directed graphs', 'Size differences', 'Node shapes', 'B'),
(1, 2, 'What does a weighted edge in a graph represent?', 'The color of the connection', 'The strength or cost of the relationship', 'The direction of flow', 'The visual thickness', 'B'),

-- Lecture 3 Questions
(1, 3, 'Why do graphs mirror how intelligence operates?', 'They look similar to brain scans', 'They represent interconnected thinking patterns', 'They use the same colors', 'They are both complex', 'B'),
(1, 3, 'What is the primary benefit of visualizing your personal mental web?', 'It looks impressive', 'It helps identify thought patterns and connections', 'It uses fancy technology', 'It saves time', 'B');

-- Create table for user answers
CREATE TABLE public.user_quiz_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.multiple_choice_questions(id) ON DELETE CASCADE,
  selected_option text NOT NULL CHECK (selected_option IN ('A', 'B', 'C', 'D')),
  is_correct boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Enable RLS for user answers
ALTER TABLE public.user_quiz_answers ENABLE ROW LEVEL SECURITY;

-- Create policies for user answers
CREATE POLICY "Users can view their own quiz answers" 
ON public.user_quiz_answers 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz answers" 
ON public.user_quiz_answers 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz answers" 
ON public.user_quiz_answers 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);