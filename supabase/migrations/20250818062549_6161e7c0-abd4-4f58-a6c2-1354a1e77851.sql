-- Upsert prompt for slide generation with teaching-focused bullets
INSERT INTO public.ai_prompts (
  prompt_name,
  prompt_category,
  prompt_template,
  prompt_description,
  feature_page,
  variables,
  is_active
) VALUES (
  'slide_generation_prompt',
  'content_creation',
  $text$Create 6-8 slides for the lecture titled "{{lecture_title}}" under the session theme "{{session_theme}}".

If provided, USE this contextual information to tailor examples and tone:
{{contextual_info}}

If provided, ALSO apply these style instructions:
{{style_instructions}}

Return ONLY valid JSON with this exact schema:
{
  "slides": [
    {
      "slide_number": 1,
      "title": "Slide Title",
      "content": "Newline-separated bullets starting with • that directly teach and guide the learner",
      "slide_type": "content",
      "svg_animation": "Short idea for a simple SVG motion graphic",
      "speaker_notes": "3-5 sentences with transitions, analogies, and timing cues"
    }
  ]
}

TEACHING BULLET RULES (CRITICAL):
- Write 4-6 bullets per slide, each starts with "• " and is 12-22 words.
- Each bullet MUST teach in imperative voice (guide the student through an action or insight).
- Avoid vague meta bullets like "Introduction to…", "Overview of…", "Set expectations…".
- Include at least: one Ask: Socratic question, one Try: micro-activity, one Example: concrete illustration.
- Prefer verbs like Examine, Compare, Map, Simulate, Connect, Predict, Challenge, Reframe.
- Tie bullets to the session theme and lecture focus; avoid redundancy across bullets.

SPEAKER NOTES:
- 3-5 sentences giving rationale, transition cues, and a quick debrief question.

SLIDE TYPES:
- Choose appropriate type from: "intro", "content", "example", "summary", "concept", "application".

Produce concise, high-utility instructional bullets that feel like mini-instructor guidance, not headings.$text$,
  'Slide generation prompt that produces guided, instructional bullets for each slide',
  'slides_generator',
  '[{"name":"lecture_title","type":"text","required":true},{"name":"session_theme","type":"text","required":true},{"name":"contextual_info","type":"text"},{"name":"style_instructions","type":"text"}]'::jsonb,
  true
)
ON CONFLICT (prompt_name) DO UPDATE SET
  prompt_category = EXCLUDED.prompt_category,
  prompt_template = EXCLUDED.prompt_template,
  prompt_description = EXCLUDED.prompt_description,
  feature_page = EXCLUDED.feature_page,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active,
  updated_at = now();