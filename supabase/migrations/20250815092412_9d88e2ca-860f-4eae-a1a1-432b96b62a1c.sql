-- Create ai_prompts table for centralized prompt management
CREATE TABLE public.ai_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_name TEXT NOT NULL UNIQUE,
  prompt_category TEXT NOT NULL, -- 'course_generation', 'content_creation', 'social_media', etc.
  prompt_template TEXT NOT NULL,
  prompt_description TEXT,
  feature_page TEXT, -- which page/feature this prompt is used for
  variables JSONB DEFAULT '[]'::jsonb, -- array of variable definitions
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0
);

-- Create prompt_variables table for reusable variable definitions
CREATE TABLE public.prompt_variables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variable_name TEXT NOT NULL UNIQUE,
  variable_type TEXT NOT NULL, -- 'text', 'number', 'select', 'location', 'user_input'
  default_value TEXT,
  possible_values JSONB DEFAULT '[]'::jsonb, -- for select types
  description TEXT,
  is_global BOOLEAN DEFAULT false, -- can be used across all prompts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create prompt_history table for versioning
CREATE TABLE public.prompt_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID NOT NULL REFERENCES public.ai_prompts(id) ON DELETE CASCADE,
  old_template TEXT NOT NULL,
  old_variables JSONB,
  changed_by UUID,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin can manage ai prompts" ON public.ai_prompts
  FOR ALL USING (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text);

CREATE POLICY "Admin can manage prompt variables" ON public.prompt_variables
  FOR ALL USING (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text);

CREATE POLICY "Admin can manage prompt history" ON public.prompt_history
  FOR ALL USING (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text);

-- Create update triggers
CREATE TRIGGER update_ai_prompts_updated_at
  BEFORE UPDATE ON public.ai_prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prompt_variables_updated_at
  BEFORE UPDATE ON public.prompt_variables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_ai_prompts_category ON public.ai_prompts(prompt_category);
CREATE INDEX idx_ai_prompts_feature_page ON public.ai_prompts(feature_page);
CREATE INDEX idx_ai_prompts_active ON public.ai_prompts(is_active);
CREATE INDEX idx_prompt_history_prompt_id ON public.prompt_history(prompt_id);

-- Insert initial prompt templates from existing code
INSERT INTO public.ai_prompts (prompt_name, prompt_category, prompt_template, prompt_description, feature_page, variables) VALUES 
(
  'social_content_generation', 
  'content_creation',
  'Create engaging {{content_type}} content for professionals in {{location_context}}.

Target Location: {{company_name}} in {{city}}, {{state}}

Critical Thinking Focus: {{critical_thinking_concepts}}

The content should:
- Connect with local professionals and businesses
- Incorporate the specified critical thinking concepts naturally
- Be engaging and thought-provoking
- Encourage interaction and discussion
- Relate to our thinking skills course offerings

{{custom_instructions}}

{{user_prompt}}',
  'Generate location-targeted social media content incorporating critical thinking concepts',
  'content_creation_tab',
  '[
    {"name": "content_type", "type": "select", "values": ["LinkedIn post", "LinkedIn article", "Instagram post", "Instagram story"], "required": true},
    {"name": "location_context", "type": "location", "required": false},
    {"name": "company_name", "type": "text", "required": false},
    {"name": "city", "type": "text", "required": false},
    {"name": "state", "type": "text", "required": false},
    {"name": "critical_thinking_concepts", "type": "array", "required": true},
    {"name": "custom_instructions", "type": "text", "required": false},
    {"name": "user_prompt", "type": "text", "required": true}
  ]'
),
(
  'course_planning_system',
  'course_generation', 
  'You are an expert educational consultant specializing in critical thinking and graph theory curricula. Your role is to help design comprehensive learning experiences that blend theoretical understanding with practical application.

CONTEXT:
You are helping to create "AutoNateAI: The Thinking Wizard Course" - a 10-session journey that teaches critical thinking through graph theory, mental models, and structured reasoning.

CAPABILITIES:
- Design session structures with lectures, games, and reflections
- Create learning objectives and outcomes
- Suggest interactive elements and practical applications
- Recommend assessment strategies
- Help sequence content for optimal learning progression

CONVERSATION STYLE:
- Ask clarifying questions to understand specific needs
- Provide detailed explanations with examples
- Suggest creative and engaging learning activities
- Reference educational best practices
- Be collaborative and encouraging

CURRENT FOCUS:
Help plan and structure educational content that makes complex thinking concepts accessible and engaging for learners.',
  'AI assistant for course planning and educational design',
  'course_planning_tab',
  '[]'
),
(
  'game_generation_prompt',
  'game_creation',
  'Create an interactive learning game for Session {{session_number}}, Lecture {{lecture_number}} focused on "{{lecture_topic}}".

GAME REQUIREMENTS:
- Type: {{game_type}}
- Duration: {{duration}} minutes
- Learning Objective: {{learning_objective}}
- Critical Thinking Skills: {{target_skills}}

GAME STRUCTURE:
The game should include:
1. Clear instructions and objectives
2. Interactive elements that engage students
3. Meaningful choices that demonstrate {{critical_thinking_concept}}
4. Immediate feedback mechanisms
5. A scoring or progress system

EDUCATIONAL CONTEXT:
This is part of our critical thinking curriculum where students learn to:
{{educational_context}}

Please provide:
1. Game mechanics and rules
2. Sample scenarios or challenges
3. Success criteria and scoring
4. Reflection questions for debriefing

Make it engaging, educational, and aligned with our thinking skills objectives.',
  'Generate interactive learning games for course sessions',
  'game_builder_tab',
  '[
    {"name": "session_number", "type": "number", "required": true},
    {"name": "lecture_number", "type": "number", "required": true},
    {"name": "lecture_topic", "type": "text", "required": true},
    {"name": "game_type", "type": "select", "values": ["puzzle", "simulation", "scenario", "decision_tree", "pattern_recognition"], "required": true},
    {"name": "duration", "type": "number", "default": "10", "required": true},
    {"name": "learning_objective", "type": "text", "required": true},
    {"name": "target_skills", "type": "array", "required": true},
    {"name": "critical_thinking_concept", "type": "text", "required": true},
    {"name": "educational_context", "type": "text", "required": true}
  ]'
);

-- Insert common reusable variables
INSERT INTO public.prompt_variables (variable_name, variable_type, default_value, possible_values, description, is_global) VALUES
('content_type', 'select', 'LinkedIn post', '["LinkedIn post", "LinkedIn article", "Instagram post", "Instagram story"]', 'Type of social media content to generate', true),
('critical_thinking_concepts', 'array', '', '["Systems Thinking", "Pattern Recognition", "Mental Models", "First Principles", "Perspective Taking", "Logical Reasoning", "Evidence Evaluation", "Bias Recognition", "Decision Trees", "Cause and Effect Analysis"]', 'Critical thinking concepts to incorporate', true),
('session_number', 'number', '1', '[]', 'Session number in the course', true),
('lecture_number', 'number', '1', '[]', 'Lecture number within the session', true),
('duration', 'number', '10', '[]', 'Duration in minutes', true),
('difficulty_level', 'select', 'intermediate', '["beginner", "intermediate", "advanced"]', 'Learning difficulty level', true);