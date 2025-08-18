-- Add/Update prompt for context enhancement to ensure visibility in Prompt Library
CREATE UNIQUE INDEX IF NOT EXISTS ai_prompts_prompt_name_unique ON public.ai_prompts (prompt_name);

INSERT INTO public.ai_prompts (
  prompt_name,
  prompt_category,
  prompt_template,
  prompt_description,
  feature_page,
  variables,
  is_active
) VALUES (
  'context_enhancement_prompt',
  'content_creation',
  $text$You are an AI course content strategist. Enhance the user's base context with specific, actionable guidance for the requested scope.

LEVEL: {{level}}
COURSE: {{course_title}}
SESSION: {{session_title}}
LECTURE: {{lecture_title}}

BASE CONTEXT:
"""
{{user_context}}
"""

Enhance by providing:
- Audience profile (background, motivations, prior knowledge, common misconceptions)
- Pedagogical strategies and delivery style aligned to the audience
- Concrete learning objectives and outcomes
- Recommended tone/voice and engagement strategies
- Domain-relevant examples/case studies and suggested visuals
- Constraints/inclusions to keep generation consistent across the course

Return a single cohesive paragraph block suitable as a context seed for downstream generation.$text$,
  'Enhance Context action used from the context input modal across course/session/lecture generation flows',
  'context_input_modal',
  '[{"name":"user_context","type":"text","required":true},{"name":"level","type":"select","values":["course","session","lecture"],"required":true},{"name":"course_title","type":"text"},{"name":"session_title","type":"text"},{"name":"lecture_title","type":"text"}]'::jsonb,
  true
)
ON CONFLICT (prompt_name) DO UPDATE SET
  prompt_category = EXCLUDED.prompt_category,
  prompt_template = EXCLUDED.prompt_template,
  prompt_description = EXCLUDED.prompt_description,
  feature_page = EXCLUDED.feature_page,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active,
  updated_at = now(),
  version = COALESCE(public.ai_prompts.version, 0) + 1;