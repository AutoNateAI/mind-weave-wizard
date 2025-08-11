-- Create game templates table for reusable game frameworks
CREATE TABLE public.game_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'critical-thinking',
  template_data JSONB NOT NULL, -- stores the React Flow template structure
  mechanics JSONB NOT NULL DEFAULT '{}', -- stores game mechanics (validation rules, interactions)
  content_slots JSONB NOT NULL DEFAULT '[]', -- defines what content can be customized
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create lecture games table for configured games per lecture
CREATE TABLE public.lecture_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_number INTEGER NOT NULL,
  lecture_number INTEGER NOT NULL,
  game_template_id UUID NOT NULL REFERENCES public.game_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  game_data JSONB NOT NULL, -- stores the configured game with content filled in
  hints JSONB DEFAULT '[]',
  estimated_duration_minutes INTEGER DEFAULT 10,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create student game interactions table for detailed tracking
CREATE TABLE public.student_game_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lecture_game_id UUID NOT NULL REFERENCES public.lecture_games(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'node_click', 'edge_create', 'hint_used', 'completed'
  interaction_data JSONB NOT NULL, -- stores specific interaction details
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id UUID -- to group interactions by game session
);

-- Create game analytics table for aggregated insights
CREATE TABLE public.game_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lecture_game_id UUID NOT NULL REFERENCES public.lecture_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_interactions INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  correct_connections INTEGER DEFAULT 0,
  incorrect_connections INTEGER DEFAULT 0,
  completion_score DECIMAL(5,2), -- percentage score
  time_spent_seconds INTEGER,
  decision_path JSONB DEFAULT '[]', -- tracks the path student took
  final_solution JSONB, -- stores student's final solution
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.game_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_game_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for game_templates
CREATE POLICY "Admin can manage game templates" 
ON public.game_templates 
FOR ALL 
USING (COALESCE((auth.jwt() ->> 'email'), '') = 'admin@gmail.com');

CREATE POLICY "Game templates are viewable by authenticated users" 
ON public.game_templates 
FOR SELECT 
USING (true);

-- Create RLS policies for lecture_games
CREATE POLICY "Admin can manage lecture games" 
ON public.lecture_games 
FOR ALL 
USING (COALESCE((auth.jwt() ->> 'email'), '') = 'admin@gmail.com');

CREATE POLICY "Published games are viewable by authenticated users" 
ON public.lecture_games 
FOR SELECT 
USING (is_published = true);

-- Create RLS policies for student_game_interactions
CREATE POLICY "Users can create their own game interactions" 
ON public.student_game_interactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own game interactions" 
ON public.student_game_interactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all game interactions" 
ON public.student_game_interactions 
FOR SELECT 
USING (COALESCE((auth.jwt() ->> 'email'), '') = 'admin@gmail.com');

-- Create RLS policies for game_analytics
CREATE POLICY "Users can manage their own game analytics" 
ON public.game_analytics 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all game analytics" 
ON public.game_analytics 
FOR SELECT 
USING (COALESCE((auth.jwt() ->> 'email'), '') = 'admin@gmail.com');

-- Create triggers for updated_at columns
CREATE TRIGGER update_game_templates_updated_at
  BEFORE UPDATE ON public.game_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lecture_games_updated_at
  BEFORE UPDATE ON public.lecture_games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_lecture_games_session_lecture ON public.lecture_games(session_number, lecture_number);
CREATE INDEX idx_student_interactions_user_game ON public.student_game_interactions(user_id, lecture_game_id);
CREATE INDEX idx_game_analytics_user_game ON public.game_analytics(user_id, lecture_game_id);
CREATE INDEX idx_game_templates_category ON public.game_templates(category);

-- Insert default game templates
INSERT INTO public.game_templates (name, description, category, template_data, mechanics, content_slots) VALUES
(
  'Critical Decision Path',
  'A branching decision tree where students navigate through critical thinking scenarios',
  'critical-thinking',
  '{
    "nodes": [
      {"id": "start", "type": "scenario", "position": {"x": 250, "y": 50}, "data": {"label": "{{scenario_description}}", "type": "start"}},
      {"id": "decision1", "type": "decision", "position": {"x": 250, "y": 200}, "data": {"label": "{{decision_point_1}}", "type": "decision"}},
      {"id": "option1a", "type": "outcome", "position": {"x": 100, "y": 350}, "data": {"label": "{{option_1a}}", "type": "option"}},
      {"id": "option1b", "type": "outcome", "position": {"x": 400, "y": 350}, "data": {"label": "{{option_1b}}", "type": "option"}},
      {"id": "result", "type": "result", "position": {"x": 250, "y": 500}, "data": {"label": "{{final_outcome}}", "type": "result"}}
    ],
    "edges": [
      {"id": "e1", "source": "start", "target": "decision1", "type": "default"},
      {"id": "e2", "source": "decision1", "target": "option1a", "type": "decision", "label": "Path A"},
      {"id": "e3", "source": "decision1", "target": "option1b", "type": "decision", "label": "Path B"},
      {"id": "e4", "source": "option1a", "target": "result", "type": "default"},
      {"id": "e5", "source": "option1b", "target": "result", "type": "default"}
    ]
  }',
  '{
    "interaction_type": "guided_path",
    "validation": "path_completion",
    "scoring": "decision_quality",
    "hints": ["Consider the long-term consequences", "Think about stakeholder impact"]
  }',
  '[
    {"slot": "scenario_description", "type": "text", "description": "Main scenario description"},
    {"slot": "decision_point_1", "type": "text", "description": "Critical decision point"},
    {"slot": "option_1a", "type": "text", "description": "First option description"},
    {"slot": "option_1b", "type": "text", "description": "Second option description"},
    {"slot": "final_outcome", "type": "text", "description": "Final outcome description"}
  ]'
),
(
  'System Mapping',
  'Students build connections between concepts to understand system relationships',
  'systems-thinking',
  '{
    "nodes": [
      {"id": "central", "type": "concept", "position": {"x": 300, "y": 250}, "data": {"label": "{{central_concept}}", "type": "central"}},
      {"id": "factor1", "type": "factor", "position": {"x": 100, "y": 100}, "data": {"label": "{{factor_1}}", "type": "factor"}},
      {"id": "factor2", "type": "factor", "position": {"x": 500, "y": 100}, "data": {"label": "{{factor_2}}", "type": "factor"}},
      {"id": "factor3", "type": "factor", "position": {"x": 100, "y": 400}, "data": {"label": "{{factor_3}}", "type": "factor"}},
      {"id": "factor4", "type": "factor", "position": {"x": 500, "y": 400}, "data": {"label": "{{factor_4}}", "type": "factor"}}
    ],
    "edges": []
  }',
  '{
    "interaction_type": "connection_building",
    "validation": "relationship_accuracy",
    "scoring": "connection_quality",
    "hints": ["Think about cause and effect", "Consider feedback loops"]
  }',
  '[
    {"slot": "central_concept", "type": "text", "description": "Main concept at the center"},
    {"slot": "factor_1", "type": "text", "description": "First related factor"},
    {"slot": "factor_2", "type": "text", "description": "Second related factor"},
    {"slot": "factor_3", "type": "text", "description": "Third related factor"},
    {"slot": "factor_4", "type": "text", "description": "Fourth related factor"}
  ]'
),
(
  'Problem Analysis Web',
  'Break down complex problems into interconnected components',
  'problem-solving',
  '{
    "nodes": [
      {"id": "problem", "type": "problem", "position": {"x": 300, "y": 50}, "data": {"label": "{{main_problem}}", "type": "problem"}},
      {"id": "cause1", "type": "cause", "position": {"x": 150, "y": 200}, "data": {"label": "{{cause_1}}", "type": "cause"}},
      {"id": "cause2", "type": "cause", "position": {"x": 450, "y": 200}, "data": {"label": "{{cause_2}}", "type": "cause"}},
      {"id": "effect1", "type": "effect", "position": {"x": 150, "y": 350}, "data": {"label": "{{effect_1}}", "type": "effect"}},
      {"id": "effect2", "type": "effect", "position": {"x": 450, "y": 350}, "data": {"label": "{{effect_2}}", "type": "effect"}},
      {"id": "solution", "type": "solution", "position": {"x": 300, "y": 500}, "data": {"label": "{{solution}}", "type": "solution"}}
    ],
    "edges": []
  }',
  '{
    "interaction_type": "analysis_building",
    "validation": "logical_connections",
    "scoring": "analysis_depth",
    "hints": ["Look for root causes", "Consider secondary effects"]
  }',
  '[
    {"slot": "main_problem", "type": "text", "description": "The main problem to analyze"},
    {"slot": "cause_1", "type": "text", "description": "First potential cause"},
    {"slot": "cause_2", "type": "text", "description": "Second potential cause"},
    {"slot": "effect_1", "type": "text", "description": "First potential effect"},
    {"slot": "effect_2", "type": "text", "description": "Second potential effect"},
    {"slot": "solution", "type": "text", "description": "Proposed solution"}
  ]'
);