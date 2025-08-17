-- Update the prompt categories to match the existing 'game_creation' category
UPDATE public.ai_prompts 
SET prompt_category = 'game_creation'
WHERE prompt_name IN ('pass1-generate-game-graph', 'pass2-generate-instructor-solution');