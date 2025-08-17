-- First create a default game template if none exists
INSERT INTO game_templates (id, name, description, category, template_data, content_slots, mechanics)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Connection Game',
  'Basic node connection game template',
  'critical-thinking',
  '{"type": "connection", "difficulty": "medium"}',
  '[]',
  '{"connection_based": true, "hint_system": true}'
)
ON CONFLICT (id) DO NOTHING;

-- Create lecture games for sessions 1-6 if they don't exist
INSERT INTO lecture_games (session_number, lecture_number, order_index, title, description, game_template_id, game_data, is_published)
SELECT 
  s.session_num,
  l.lecture_num,
  ((s.session_num - 1) * 9) + ((l.lecture_num - 1) * 3) + g.game_num,
  CASE g.game_num
    WHEN 1 THEN 'Link the Concepts - Lecture ' || l.lecture_num
    WHEN 2 THEN 'Pattern Hunter - Lecture ' || l.lecture_num  
    WHEN 3 THEN 'Mental Model Builder - Lecture ' || l.lecture_num
  END,
  CASE g.game_num
    WHEN 1 THEN 'Connect related concepts to build understanding'
    WHEN 2 THEN 'Identify patterns in complex information'
    WHEN 3 THEN 'Construct mental models for problem solving'
  END,
  '00000000-0000-0000-0000-000000000001', -- use our default template
  '{"nodes": [], "edges": []}',
  true
FROM 
  (SELECT generate_series(1, 6) as session_num) s,
  (SELECT generate_series(1, 3) as lecture_num) l,
  (SELECT generate_series(1, 3) as game_num) g
WHERE NOT EXISTS (
  SELECT 1 FROM lecture_games lg2 
  WHERE lg2.session_number = s.session_num 
  AND lg2.lecture_number = l.lecture_num 
  AND lg2.order_index = ((s.session_num - 1) * 9) + ((l.lecture_num - 1) * 3) + g.game_num
);

-- Now create realistic game analytics for admin@gmail.com
-- We'll simulate a software engineer's learning journey with realistic progression
INSERT INTO game_analytics (
  id,
  lecture_game_id,
  user_id,
  started_at,
  completed_at,
  time_spent_seconds,
  correct_connections,
  incorrect_connections,
  hints_used,
  total_interactions,
  completion_score,
  final_solution,
  decision_path
)
SELECT 
  gen_random_uuid(),
  lg.id,
  (SELECT id FROM auth.users WHERE email = 'admin@gmail.com' LIMIT 1),
  -- Create realistic timestamps over the past 2 months
  NOW() - INTERVAL '60 days' + (lg.order_index * INTERVAL '2.5 days') + 
  (RANDOM() * INTERVAL '4 hours'),
  -- Completed timestamp
  NOW() - INTERVAL '60 days' + (lg.order_index * INTERVAL '2.5 days') + 
  (RANDOM() * INTERVAL '4 hours') + 
  CASE 
    WHEN lg.order_index <= 9 THEN (420 + RANDOM() * 480) * INTERVAL '1 second'
    WHEN lg.order_index <= 27 THEN (360 + RANDOM() * 360) * INTERVAL '1 second'
    ELSE (240 + RANDOM() * 240) * INTERVAL '1 second'
  END,
  -- Time in seconds (improving over time)
  CASE 
    WHEN lg.order_index <= 9 THEN 420 + (RANDOM() * 480)::integer
    WHEN lg.order_index <= 27 THEN 360 + (RANDOM() * 360)::integer
    ELSE 240 + (RANDOM() * 240)::integer
  END,
  -- Correct connections (improving over time)
  CASE 
    WHEN lg.order_index <= 9 THEN 8 + (RANDOM() * 7)::integer
    WHEN lg.order_index <= 27 THEN 12 + (RANDOM() * 8)::integer
    ELSE 15 + (RANDOM() * 10)::integer
  END,
  -- Incorrect connections (decreasing over time)
  CASE 
    WHEN lg.order_index <= 9 THEN 3 + (RANDOM() * 4)::integer
    WHEN lg.order_index <= 27 THEN 2 + (RANDOM() * 3)::integer
    ELSE 1 + (RANDOM() * 2)::integer
  END,
  -- Hints used (software engineers are stubborn, use fewer hints over time)
  CASE 
    WHEN lg.order_index <= 9 THEN (RANDOM() * 3)::integer
    WHEN lg.order_index <= 27 THEN (RANDOM() * 2)::integer
    ELSE (RANDOM() * 1)::integer
  END,
  -- Total interactions
  CASE 
    WHEN lg.order_index <= 9 THEN 15 + (RANDOM() * 15)::integer
    WHEN lg.order_index <= 27 THEN 20 + (RANDOM() * 15)::integer
    ELSE 25 + (RANDOM() * 15)::integer
  END,
  -- Completion score (improving from 65-85% to 85-98%)
  CASE 
    WHEN lg.order_index <= 9 THEN 65 + (RANDOM() * 20)
    WHEN lg.order_index <= 27 THEN 75 + (RANDOM() * 15)
    ELSE 85 + (RANDOM() * 13)
  END,
  -- Final solution (mock JSON)
  '{"connections": ["pattern1", "pattern2"], "strategy": "systematic"}',
  -- Decision path showing software engineer thinking patterns
  jsonb_build_array(
    jsonb_build_object('step', 1, 'action', 'analyze_structure'),
    jsonb_build_object('step', 2, 'action', 'identify_patterns'),
    jsonb_build_object('step', 3, 'action', 'test_hypothesis'),
    jsonb_build_object('step', 4, 'action', 'validate_solution')
  )
FROM lecture_games lg
WHERE lg.session_number BETWEEN 1 AND 6
AND NOT EXISTS (
  SELECT 1 FROM game_analytics ga 
  WHERE ga.lecture_game_id = lg.id 
  AND ga.user_id = (SELECT id FROM auth.users WHERE email = 'admin@gmail.com' LIMIT 1)
);