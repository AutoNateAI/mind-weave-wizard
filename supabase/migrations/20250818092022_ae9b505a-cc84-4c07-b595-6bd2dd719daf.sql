-- Update slide generation prompt to add professor-researcher yet fun style
WITH existing AS (
  SELECT id, prompt_template, variables FROM public.ai_prompts
  WHERE prompt_name = 'slide_generation_prompt'
  LIMIT 1
),
insert_history AS (
  INSERT INTO public.prompt_history (prompt_id, old_template, old_variables, change_reason)
  SELECT e.id, e.prompt_template, e.variables,
         'Added Professor–Researcher structured yet fun voice: rigorous but lively, relevant/cross-domain examples, untraditional analogies, and explicit transfer (Why it matters / Where else it applies).'
  FROM existing e
  RETURNING 1
),
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
- Depth & Nuance: prioritize nuanced knowledge—include trade-offs, edge cases, counterexamples, constraints, failure modes, and common misconceptions when relevant. Avoid generic platitudes; use precise domain terms and briefly define them in plain language.
- Across the entire deck, include at least one of each: "Question:" (Socratic prompt), "Try this:" (micro-activity), and "Example:" (concrete illustration). Distribute naturally.

VOICE & STYLE:
- Professor–Researcher structure: rigorous and precise (hypothesis → evidence → implication) while remaining accessible.
- Keep it fun and entertaining: lively tone, relevant modern examples from tech, design, science, and everyday life.
- Use untraditional analogies to make abstract ideas click.
- Show transfer: when natural, include brief "Why it matters" or "Where else it applies" ideas within bullets to highlight multiple utilizations.

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
      updated_at = now(),
      version = COALESCE(p.version, 1) + 1
  FROM existing e
  WHERE p.id = e.id
  RETURNING p.id
)
SELECT 'ok' AS status;