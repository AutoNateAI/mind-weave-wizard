-- Create realistic game analytics for admin@gmail.com
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
  NOW() - INTERVAL '60 days' + (lg.order_index * INTERVAL '2.5 days') + (RANDOM() * INTERVAL '4 hours'),
  -- Completion time based on start time plus realistic duration
  NOW() - INTERVAL '60 days' + (lg.order_index * INTERVAL '2.5 days') + (RANDOM() * INTERVAL '4 hours') + 
  (CASE 
    WHEN lg.order_index <= 9 THEN INTERVAL '420 seconds' + (RANDOM() * INTERVAL '480 seconds')
    WHEN lg.order_index <= 27 THEN INTERVAL '360 seconds' + (RANDOM() * INTERVAL '360 seconds')
    ELSE INTERVAL '240 seconds' + (RANDOM() * INTERVAL '240 seconds')
  END),
  -- Time in seconds (improving over time - software engineers start decent, get better)
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
  -- Hints used (software engineers are stubborn initially, learn to use hints strategically)
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
  -- Final solution (mock JSON showing systematic approach)
  jsonb_build_object(
    'connections', jsonb_build_array('pattern_analysis', 'logical_structure', 'system_design'),
    'strategy', 'systematic_decomposition',
    'confidence', 0.8 + (RANDOM() * 0.2)
  ),
  -- Decision path showing software engineer thinking patterns
  jsonb_build_array(
    jsonb_build_object('step', 1, 'action', 'analyze_problem_structure', 'timestamp', extract(epoch from NOW()), 'confidence', 0.7),
    jsonb_build_object('step', 2, 'action', 'identify_key_patterns', 'timestamp', extract(epoch from NOW()) + 120, 'confidence', 0.8),
    jsonb_build_object('step', 3, 'action', 'test_hypotheses', 'timestamp', extract(epoch from NOW()) + 240, 'confidence', 0.85),
    jsonb_build_object('step', 4, 'action', 'validate_and_optimize', 'timestamp', extract(epoch from NOW()) + 360, 'confidence', 0.9)
  )
FROM lecture_games lg
WHERE lg.session_number BETWEEN 1 AND 6
  AND lg.is_published = true
  AND EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@gmail.com')
  AND NOT EXISTS (
    SELECT 1 FROM game_analytics ga 
    WHERE ga.lecture_game_id = lg.id 
    AND ga.user_id = (SELECT id FROM auth.users WHERE email = 'admin@gmail.com' LIMIT 1)
  )
ORDER BY lg.session_number, lg.lecture_number, lg.order_index;