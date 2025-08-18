-- Update slide_generation_prompt to enforce standalone teaching bullets (2–4 bullets, 2–4 sentences each)
DO $do$
DECLARE
  new_template TEXT := $tmpl$
Create 6-8 instructional slides for a lecture titled "{{lecture_title}}" with the session theme "{{session_theme}}".

If available, incorporate this CONTEXTUAL INFORMATION to tailor content:
{{contextual_info}}

If provided, follow these STYLE INSTRUCTIONS:
{{style_instructions}}

Each slide must return JSON with fields: slide_number, title, content, slide_type, svg_animation, speaker_notes.

CONTENT RULES (CRITICAL):
- For content, write 2-4 NEWLINE-SEPARATED bullets, each starting with "• ".
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
      "content": "• You clarify why this concept matters in practice. You connect it to decisions you make today.\n• Example: You apply the rule to a small scenario, then extend it to a larger system. Both cases expose the same pattern.\n• Question: What changes if one key assumption flips? Explain the consequences in your own words.\n• Try this: Write two sentences describing how you will spot this pattern in your next task.",
      "slide_type": "content",
      "svg_animation": "Simple motion idea that supports the teaching point",
      "speaker_notes": "Instructor guidance with rationale, transitions, and a debrief question."
    }
  ]
}
$tmpl$;
BEGIN
  IF EXISTS (SELECT 1 FROM public.ai_prompts WHERE prompt_name = 'slide_generation_prompt') THEN
    -- Save history snapshot
    INSERT INTO public.prompt_history (prompt_id, old_template, old_variables, change_reason, created_at)
    SELECT id, prompt_template, variables, 'Update: standalone teaching bullets (2–4 bullets, 2–4 sentences each).', now()
    FROM public.ai_prompts
    WHERE prompt_name = 'slide_generation_prompt';

    -- Update template
    UPDATE public.ai_prompts
    SET prompt_template = new_template,
        prompt_description = COALESCE(prompt_description, 'Slide generation prompt'),
        is_active = true,
        version = COALESCE(version, 1) + 1,
        updated_at = now()
    WHERE prompt_name = 'slide_generation_prompt';
  ELSE
    -- Insert if not present
    INSERT INTO public.ai_prompts (
      prompt_category,
      prompt_name,
      prompt_template,
      prompt_description,
      is_active,
      variables,
      feature_page,
      version,
      usage_count,
      created_at,
      updated_at
    ) VALUES (
      'generation',
      'slide_generation_prompt',
      new_template,
      'Slide generation prompt with standalone teaching bullets (2–4 bullets, 2–4 sentences each).',
      true,
      '[]'::jsonb,
      'admin',
      1,
      0,
      now(),
      now()
    );
  END IF;
END
$do$;