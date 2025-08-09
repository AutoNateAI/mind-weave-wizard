-- Create dynamic course structure tables
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  overview TEXT,
  total_sessions INTEGER DEFAULT 10,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE TABLE public.sessions_dynamic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(course_id, session_number)
);

CREATE TABLE public.lectures_dynamic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions_dynamic(id) ON DELETE CASCADE,
  lecture_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  estimated_duration_minutes INTEGER DEFAULT 5,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(session_id, lecture_number)
);

CREATE TABLE public.lecture_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID REFERENCES public.lectures_dynamic(id) ON DELETE CASCADE,
  slide_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  slide_type TEXT DEFAULT 'content' CHECK (slide_type IN ('intro', 'content', 'example', 'summary')),
  svg_animation TEXT,
  speaker_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(lecture_id, slide_number)
);

CREATE TABLE public.generation_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('course_planning', 'content_generation', 'assessment_generation')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  input_data JSONB,
  output_data JSONB,
  progress_percentage INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.admin_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES auth.users(id),
  chat_history JSONB DEFAULT '[]',
  context_type TEXT CHECK (context_type IN ('course_planning', 'content_editing', 'structure_editing')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions_dynamic ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures_dynamic ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create admin-only policies
CREATE POLICY "Admin can manage courses" ON public.courses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.email = 'admin@gmail.com'
  )
);

CREATE POLICY "Admin can manage sessions" ON public.sessions_dynamic
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.email = 'admin@gmail.com'
  )
);

CREATE POLICY "Admin can manage lectures" ON public.lectures_dynamic
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.email = 'admin@gmail.com'
  )
);

CREATE POLICY "Admin can manage slides" ON public.lecture_slides
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.email = 'admin@gmail.com'
  )
);

CREATE POLICY "Admin can manage workflows" ON public.generation_workflows
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.email = 'admin@gmail.com'
  )
);

CREATE POLICY "Admin can manage chat sessions" ON public.admin_chat_sessions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.email = 'admin@gmail.com'
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_dynamic_updated_at
  BEFORE UPDATE ON public.sessions_dynamic
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lectures_dynamic_updated_at
  BEFORE UPDATE ON public.lectures_dynamic
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lecture_slides_updated_at
  BEFORE UPDATE ON public.lecture_slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_generation_workflows_updated_at
  BEFORE UPDATE ON public.generation_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_chat_sessions_updated_at
  BEFORE UPDATE ON public.admin_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();