-- First, let's get the admin user ID (we'll use a known email)
-- Create some lecture games for sessions 1-6 if they don't exist
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
  gen_random_uuid(), -- placeholder template_id
  '{"nodes": [], "edges": []}',
  true
FROM 
  (SELECT generate_series(1, 6) as session_num) s,
  (SELECT generate_series(1, 3) as lecture_num) l,
  (SELECT generate_series(1, 3) as game_num) g
ON CONFLICT DO NOTHING;

-- Now create realistic game analytics for admin@gmail.com
-- We'll simulate a software engineer's learning journey with realistic progression
WITH admin_user AS (
  SELECT id FROM auth.users WHERE email = 'admin@gmail.com' LIMIT 1
),
game_sessions AS (
  SELECT 
    lg.id as lecture_game_id,
    lg.session_number,
    lg.lecture_number,
    lg.order_index,
    -- Create realistic timestamps over the past 2 months
    NOW() - INTERVAL '60 days' + (lg.order_index * INTERVAL '2.5 days') + 
    (RANDOM() * INTERVAL '4 hours') as base_time
  FROM lecture_games lg
  WHERE lg.session_number BETWEEN 1 AND 6
  AND lg.is_published = true
  ORDER BY lg.session_number, lg.lecture_number, lg.order_index
)
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
  gs.lecture_game_id,
  au.id,
  gs.base_time,
  gs.base_time + (
    -- Software engineers start efficient, get better over time
    CASE 
      WHEN gs.order_index <= 9 THEN INTERVAL '8-15 minutes' * (0.7 + RANDOM() * 0.6)
      WHEN gs.order_index <= 27 THEN INTERVAL '6-12 minutes' * (0.8 + RANDOM() * 0.4)
      ELSE INTERVAL '4-8 minutes' * (0.9 + RANDOM() * 0.2)
    END
  ),
  -- Time in seconds (calculated from above intervals)
  CASE 
    WHEN gs.order_index <= 9 THEN 420 + (RANDOM() * 480)::integer
    WHEN gs.order_index <= 27 THEN 360 + (RANDOM() * 360)::integer
    ELSE 240 + (RANDOM() * 240)::integer
  END,
  -- Correct connections (improving over time)
  CASE 
    WHEN gs.order_index <= 9 THEN 8 + (RANDOM() * 7)::integer
    WHEN gs.order_index <= 27 THEN 12 + (RANDOM() * 8)::integer
    ELSE 15 + (RANDOM() * 10)::integer
  END,
  -- Incorrect connections (decreasing over time)
  CASE 
    WHEN gs.order_index <= 9 THEN 3 + (RANDOM() * 4)::integer
    WHEN gs.order_index <= 27 THEN 2 + (RANDOM() * 3)::integer
    ELSE 1 + (RANDOM() * 2)::integer
  END,
  -- Hints used (software engineers are stubborn, use fewer hints over time)
  CASE 
    WHEN gs.order_index <= 9 THEN (RANDOM() * 3)::integer
    WHEN gs.order_index <= 27 THEN (RANDOM() * 2)::integer
    ELSE (RANDOM() * 1)::integer
  END,
  -- Total interactions
  CASE 
    WHEN gs.order_index <= 9 THEN 15 + (RANDOM() * 15)::integer
    WHEN gs.order_index <= 27 THEN 20 + (RANDOM() * 15)::integer
    ELSE 25 + (RANDOM() * 15)::integer
  END,
  -- Completion score (improving from 65-85% to 85-98%)
  CASE 
    WHEN gs.order_index <= 9 THEN 65 + (RANDOM() * 20)
    WHEN gs.order_index <= 27 THEN 75 + (RANDOM() * 15)
    ELSE 85 + (RANDOM() * 13)
  END,
  -- Final solution (mock JSON)
  '{"connections": ["pattern1", "pattern2"], "strategy": "systematic"}',
  -- Decision path showing software engineer thinking patterns
  jsonb_build_array(
    jsonb_build_object('step', 1, 'action', 'analyze_structure', 'timestamp', extract(epoch from gs.base_time)),
    jsonb_build_object('step', 2, 'action', 'identify_patterns', 'timestamp', extract(epoch from gs.base_time + interval '2 minutes')),
    jsonb_build_object('step', 3, 'action', 'test_hypothesis', 'timestamp', extract(epoch from gs.base_time + interval '4 minutes')),
    jsonb_build_object('step', 4, 'action', 'validate_solution', 'timestamp', extract(epoch from gs.base_time + interval '6 minutes'))
  )
FROM game_sessions gs
CROSS JOIN admin_user au
WHERE NOT EXISTS (
  SELECT 1 FROM game_analytics ga 
  WHERE ga.lecture_game_id = gs.lecture_game_id 
  AND ga.user_id = au.id
);