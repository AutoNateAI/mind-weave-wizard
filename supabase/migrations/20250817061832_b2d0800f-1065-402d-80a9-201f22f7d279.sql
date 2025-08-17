-- Ensure unique name constraints for safe upserts
CREATE UNIQUE INDEX IF NOT EXISTS ai_prompts_prompt_name_unique ON public.ai_prompts (prompt_name);
CREATE UNIQUE INDEX IF NOT EXISTS prompt_variables_variable_name_unique ON public.prompt_variables (variable_name);

-- Upsert Pass 1 prompt: Generate Game Graph
INSERT INTO public.ai_prompts (
  prompt_name,
  prompt_category,
  prompt_template,
  prompt_description,
  variables,
  is_active
) VALUES (
  'pass1-generate-game-graph',
  'ai-game-generator',
  $$You are an educational game content generator. Using the lecture content and a game template, produce a VALID game_data JSON object that strictly uses the provided exact node IDs.

Requirements:
- Use ONLY the IDs provided in exactNodeIds; never invent new IDs.
- Populate each node with type, label, and any template-required fields (e.g., options, weights, interactive flags).
- Build edges using ONLY valid source/target IDs from exactNodeIds.
- Respect template mechanics, validation_rules, and win_conditions.
- Keep content concise, age-appropriate, and tied to the lecture.

Inputs:
- sessionNumber: {sessionNumber}
- lectureNumber: {lectureNumber}
- lectureContent: {lectureContent}
- templateMechanics: {templateMechanics}
- templateSlots: {templateSlots}
- templateValidationRules: {templateValidationRules}
- templateWinConditions: {templateWinConditions}
- exactNodeIds: {exactNodeIds}

Output JSON shape (no extra commentary):
{
  "nodes": [
    { "id": "id-from-exactNodeIds", "type": "...", "data": { "label": "..." }, "position": {"x": 0, "y": 0} }
  ],
  "edges": [
    { "id": "e-source-target", "source": "id-from-exactNodeIds", "target": "id-from-exactNodeIds", "data": {"label": "..."} }
  ],
  "instructions": "...",
  "hints": ["..."],
  "win_conditions": { ... },
  "validation_rules": { ... }
}
$$,
  'Pass 1: Generate playable game_data with exact node IDs.',
  '[
    {"name":"sessionNumber","type":"number","description":"Target session number"},
    {"name":"lectureNumber","type":"number","description":"Target lecture number"},
    {"name":"lectureContent","type":"text","description":"Source lecture content"},
    {"name":"templateMechanics","type":"json","description":"Template mechanics JSON"},
    {"name":"templateSlots","type":"json","description":"Template content slots JSON"},
    {"name":"templateValidationRules","type":"json","description":"Template validation rules JSON"},
    {"name":"templateWinConditions","type":"json","description":"Template win conditions JSON"},
    {"name":"exactNodeIds","type":"json","description":"Array of exact node IDs to use"}
  ]'::jsonb,
  true
)
ON CONFLICT (prompt_name) DO UPDATE
SET
  prompt_category = EXCLUDED.prompt_category,
  prompt_template = EXCLUDED.prompt_template,
  prompt_description = EXCLUDED.prompt_description,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active,
  updated_at = now(),
  version = COALESCE(public.ai_prompts.version, 0) + 1;

-- Upsert Pass 2 prompt: Generate Instructor Solution
INSERT INTO public.ai_prompts (
  prompt_name,
  prompt_category,
  prompt_template,
  prompt_description,
  variables,
  is_active
) VALUES (
  'pass2-generate-instructor-solution',
  'ai-game-generator',
  $$You are an expert instructor. Given an existing game_data JSON, produce the instructor solution, grading rubric, and common wrong connections.

Rules:
- Use ONLY node IDs that exist in the provided game_data.
- Provide an array of correct edges (by source/target IDs) that represent the solution.
- Provide a concise rubric explaining evaluation criteria.
- Provide a list of typical wrong connections with brief explanations.
- Do not modify game_data.

Inputs:
- gameData: {gameData}
- exactNodeIds: {exactNodeIds}

Output JSON shape (no extra commentary):
{
  "instructor_solution": {
    "correct_connections": [ {"source": "id", "target": "id", "reason": "..."} ],
    "key_concepts": ["..."],
    "grading_rubric": "..."
  },
  "wrong_connections": [ {"source": "id", "target": "id", "explanation": "..."} ]
}
$$,
  'Pass 2: Instructor solution and rubric using existing node IDs only.',
  '[
    {"name":"gameData","type":"json","description":"The generated game_data from pass 1"},
    {"name":"exactNodeIds","type":"json","description":"Array of exact node IDs present in gameData"}
  ]'::jsonb,
  true
)
ON CONFLICT (prompt_name) DO UPDATE
SET
  prompt_category = EXCLUDED.prompt_category,
  prompt_template = EXCLUDED.prompt_template,
  prompt_description = EXCLUDED.prompt_description,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active,
  updated_at = now(),
  version = COALESCE(public.ai_prompts.version, 0) + 1;

-- Register or update variables in prompt_variables for discoverability in Prompt Manager
INSERT INTO public.prompt_variables (variable_name, variable_type, description, is_global, default_value, possible_values)
VALUES
  ('sessionNumber','number','Target session number', false, NULL, '[]'::jsonb),
  ('lectureNumber','number','Target lecture number', false, NULL, '[]'::jsonb),
  ('lectureContent','text','Raw lecture content text/markdown', false, NULL, '[]'::jsonb),
  ('templateMechanics','json','Template mechanics JSON (from game template)', false, NULL, '[]'::jsonb),
  ('templateSlots','json','Template content slots JSON (from game template)', false, NULL, '[]'::jsonb),
  ('templateValidationRules','json','Template validation rules JSON (from game template)', false, NULL, '[]'::jsonb),
  ('templateWinConditions','json','Template win conditions JSON (from game template)', false, NULL, '[]'::jsonb),
  ('exactNodeIds','json','Array of exact node IDs that MUST be used', false, '[]', '[]'::jsonb),
  ('gameData','json','The generated game_data from pass 1', false, NULL, '[]'::jsonb)
ON CONFLICT (variable_name) DO UPDATE
SET
  variable_type = EXCLUDED.variable_type,
  description = EXCLUDED.description,
  is_global = EXCLUDED.is_global,
  default_value = EXCLUDED.default_value,
  possible_values = EXCLUDED.possible_values,
  updated_at = now();