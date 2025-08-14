-- Add heuristic targeting to game templates
ALTER TABLE game_templates ADD COLUMN IF NOT EXISTS heuristic_targets jsonb DEFAULT '[]'::jsonb;

-- Add validation rules and win conditions to game templates
ALTER TABLE game_templates ADD COLUMN IF NOT EXISTS validation_rules jsonb DEFAULT '{}'::jsonb;
ALTER TABLE game_templates ADD COLUMN IF NOT EXISTS win_conditions jsonb DEFAULT '{}'::jsonb;

-- Add heuristic tracking to lecture games
ALTER TABLE lecture_games ADD COLUMN IF NOT EXISTS heuristic_targets jsonb DEFAULT '[]'::jsonb;
ALTER TABLE lecture_games ADD COLUMN IF NOT EXISTS validation_rules jsonb DEFAULT '{}'::jsonb;
ALTER TABLE lecture_games ADD COLUMN IF NOT EXISTS win_conditions jsonb DEFAULT '{}'::jsonb;

-- Update game templates with heuristic mappings
UPDATE game_templates 
SET heuristic_targets = '["Sequential Reasoning", "Consequence Evaluation"]'::jsonb,
    validation_rules = '{"decision_quality": true, "reasoning_depth": true, "consequence_analysis": true}'::jsonb,
    win_conditions = '{"complete_optimal_path": true, "explain_reasoning": true, "score_threshold": 70}'::jsonb
WHERE name = 'Critical Decision Path';

UPDATE game_templates 
SET heuristic_targets = '["Systematic Decomposition", "Root Cause Analysis"]'::jsonb,
    validation_rules = '{"logical_connections": true, "root_cause_identification": true, "analysis_completeness": true}'::jsonb,
    win_conditions = '{"accurate_connections": true, "identify_root_causes": true, "score_threshold": 75}'::jsonb
WHERE name = 'Problem Analysis Web';

UPDATE game_templates 
SET heuristic_targets = '["Holistic Thinking", "Relationship Recognition"]'::jsonb,
    validation_rules = '{"relationship_accuracy": true, "system_understanding": true, "feedback_loop_identification": true}'::jsonb,
    win_conditions = '{"complete_relationship_map": true, "identify_feedback_loops": true, "score_threshold": 80}'::jsonb
WHERE name = 'System Mapping';