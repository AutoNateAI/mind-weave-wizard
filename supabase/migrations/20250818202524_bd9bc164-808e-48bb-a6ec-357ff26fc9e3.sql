-- Update the orchestrated prompt to target junior software engineers with real-world scenarios and include scenario descriptions

UPDATE ai_prompts 
SET prompt_template = 'You are an expert game designer creating learning experiences for software engineers in their first 0-7 years of professional experience. Generate a coordinated suite of three CONNECTION-BASED puzzle games that help junior developers practice critical thinking through REAL-WORLD SOFTWARE ENGINEERING scenarios.

**TARGET AUDIENCE:** Junior software engineers (0-7 years experience) working in tech companies, startups, or product teams.

**CONTEXT:** Create scenarios that junior developers actually face - debugging production issues, planning feature releases, managing technical debt, code reviews, team collaboration, sprint planning, incident response, architecture decisions, etc.

Lecture Content: {{lectureContent}}

**CRITICAL: Include scenario_description field for each game that provides a clear, context-rich overview of the real-world software engineering situation.**

Focus on real scenarios junior developers encounter: production incidents, feature planning, code reviews, technical debt decisions, system design, debugging complex issues, sprint planning, team collaboration challenges, etc.'
WHERE prompt_name = 'orchestrated-game-suite-prompt';

-- Insert the prompt if it doesn't exist
INSERT INTO ai_prompts (prompt_name, prompt_template, is_active, variables, usage_count, prompt_category) 
SELECT 'orchestrated-game-suite-prompt', 
'You are an expert game designer creating learning experiences for software engineers in their first 0-7 years of professional experience. Generate a coordinated suite of three CONNECTION-BASED puzzle games that help junior developers practice critical thinking through REAL-WORLD SOFTWARE ENGINEERING scenarios.

**TARGET AUDIENCE:** Junior software engineers (0-7 years experience) working in tech companies, startups, or product teams.

**CONTEXT:** Create scenarios that junior developers actually face - debugging production issues, planning feature releases, managing technical debt, code reviews, team collaboration, sprint planning, incident response, architecture decisions, etc.

Lecture Content: {{lectureContent}}

**CRITICAL: Include scenario_description field for each game that provides a clear, context-rich overview of the real-world software engineering situation.**

Focus on real scenarios junior developers encounter: production incidents, feature planning, code reviews, technical debt decisions, system design, debugging complex issues, sprint planning, team collaboration challenges, etc.',
true, 
'{"lectureContent": "string"}', 
0,
'game_generation'
WHERE NOT EXISTS (
  SELECT 1 FROM ai_prompts WHERE prompt_name = 'orchestrated-game-suite-prompt'
);