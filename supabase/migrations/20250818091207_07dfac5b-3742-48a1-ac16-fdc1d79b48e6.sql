-- Update slide generation prompt to require 5-7 bullets and log history
-- Create or update the prompt in ai_prompts with name 'slide_generation_prompt'

-- 1) Capture existing prompt (if any)
WITH existing AS (
  SELECT id, prompt_template, variables, version
  FROM public.ai_prompts
  WHERE prompt_name = 'slide_generation_prompt'
  LIMIT 1
),
-- 2) Insert history only when an existing row is present
insert_history AS (
  INSERT INTO public.prompt_history (prompt_id, old_template, old_variables, change_reason)
  SELECT e.id, e.prompt_template, e.variables,
         'Updated bullets to 5-7 (each 2-4 sentences), enforced standalone teaching; retained Question/Try this/Example distribution.'
  FROM existing e
  RETURNING 1
),
-- 3) Update existing row, if present
update_existing AS (
  UPDATE public.ai_prompts p
  SET prompt_template = $template$
Create 6-8 instructional slides for a lecture titled "{{lectureTitle}}" with the session theme "{{sessionTheme}}".{{contextualPrompt}}{{stylePrompt}}

Each slide must return JSON with fields: slide_number, title, content, slide_type, svg_animation, speaker_notes.

CONTENT RULES (CRITICAL):
- For content, write 5-7 NEWLINE-SEPARATED bullets, each starting with "• ".
- Each bullet must be 2-4 full sentences that TEACH a specific sub-concept (not fragments).
- Address the learner directly in second person ("you"), present tense.
- Never instruct the teacher or describe teaching actions. Avoid verbs like "Frame", "Map out", "Compare", "Introduce".
- Ensure the slide stands alone: a learner reading only the content should understand the concept without narration.
- Across the entire deck, include at least one of each: "Question:" (Socratic prompt), "Try this:" (micro-activity), and "Example:" (concrete illustration). Distribute naturally.

SPEAKER NOTES:
- Provide 3-5 sentences with rationale, transitions, and a quick debrief question.

SLIDE TYPES:
- Choose from: "intro", "content", "example", "summary".

Return ONLY this JSON structure:
{
  "slides": [
    {
      "slide_number": 1,
      "title": "Slide Title",
      "content": "• Focused attention directs your engineering effort toward impact.\n• Question: What makes someone stand out in a Fortune 500 tech team?\n• Try this: Reflect on last week and spot a moment questioning could change the outcome.\n• Example: A developer questions requirements and uncovers a simpler solution.",
      "slide_type": "content",
      "svg_animation": "Simple motion idea that supports the teaching point",
      "speaker_notes": "Instructor guidance with transitions and debrief"
    }
  ]
}$template$,
      version = COALESCE(p.version, 1) + 1,
      updated_at = now()
  FROM existing e
  WHERE p.id = e.id
  RETURNING p.id
),
-- 4) If no existing row, insert a new one
insert_new AS (
  INSERT INTO public.ai_prompts (
    prompt_category,
    prompt_name,
    is_active,
    prompt_description,
    feature_page,
    variables,
    prompt_template,
    usage_count,
    version
  )
  SELECT
    'slides',
    'slide_generation_prompt',
    true,
    'Generates lecture slides with 5-7 standalone teaching bullets (2-4 sentences each).',
    'admin',
    '[]'::jsonb,
    $template$
Create 6-8 instructional slides for a lecture titled "{{lectureTitle}}" with the session theme "{{sessionTheme}}".{{contextualPrompt}}{{stylePrompt}}

Each slide must return JSON with fields: slide_number, title, content, slide_type, svg_animation, speaker_notes.

CONTENT RULES (CRITICAL):
- For content, write 5-7 NEWLINE-SEPARATED bullets, each starting with "• ".
- Each bullet must be 2-4 full sentences that TEACH a specific sub-concept (not fragments).
- Address the learner directly in second person ("you"), present tense.
- Never instruct the teacher or describe teaching actions. Avoid verbs like "Frame", "Map out", "Compare", "Introduce".
- Ensure the slide stands alone: a learner reading only the content should understand the concept without narration.
- Across the entire deck, include at least one of each: "Question:" (Socratic prompt), "Try this:" (micro-activity), and "Example:" (concrete illustration). Distribute naturally.

SPEAKER NOTES:
- Provide 3-5 sentences with rationale, transitions, and a quick debrief question.

SLIDE TYPES:
- Choose from: "intro", "content", "example", "summary".

Return ONLY this JSON structure:
{
  "slides": [
    {
      "slide_number": 1,
      "title": "Slide Title",
      "content": "• Focused attention directs your engineering effort toward impact.\n• Question: What makes someone stand out in a Fortune 500 tech team?\n• Try this: Reflect on last week and spot a moment questioning could change the outcome.\n• Example: A developer questions requirements and uncovers a simpler solution.",
      "slide_type": "content",
      "svg_animation": "Simple motion idea that supports the teaching point",
      "speaker_notes": "Instructor guidance with transitions and debrief"
    }
  ]
}$template$,
    0,
    1
  WHERE NOT EXISTS (SELECT 1 FROM existing)
  RETURNING id
)
SELECT 'ok' AS status;