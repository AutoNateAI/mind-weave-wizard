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
  'You are an AI course content strategist. Enhance the user\'s base context with specific, actionable guidance for the requested scope.\n\nLEVEL: {{level}}\nCOURSE: {{course_title}}\nSESSION: {{session_title}}\nLECTURE: {{lecture_title}}\n\nBASE CONTEXT:\n"""\n{{user_context}}\n"""\n\nEnhance by providing:\n- Audience profile (background, motivations, prior knowledge, common misconceptions)\n- Pedagogical strategies and delivery style aligned to the audience\n- Concrete learning objectives and outcomes\n- Recommended tone/voice and engagement strategies\n- Domain-relevant examples/case studies and suggested visuals\n- Constraints/inclusions to keep generation consistent across the course\n\nReturn a single cohesive paragraph block suitable as a context seed for downstream generation.',
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