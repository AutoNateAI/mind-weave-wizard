-- Insert lecture games to generate analytics against
INSERT INTO lecture_games (session_number, lecture_number, game_template_id, title, description, instructions, game_data, is_published)
VALUES
  (1, 1, (SELECT id FROM game_templates LIMIT 1), 'Link the World - Graph Connections', 'Match concepts to build visual graphs and see how everything connects', 'Click and drag to connect related concepts. Start with basic connections and work your way to complex relationships.', '{"nodes": [{"id": "dog", "label": "Dog"}, {"id": "mammal", "label": "Mammal"}, {"id": "animal", "label": "Animal"}], "edges": [{"source": "dog", "target": "mammal"}, {"source": "mammal", "target": "animal"}]}', true),
  (1, 2, (SELECT id FROM game_templates LIMIT 1), 'Hidden Network Discovery', 'Reveal hidden structures by guessing connections with limited information', 'Use logical deduction to uncover the hidden network structure. You have limited guesses, so think carefully!', '{"hiddenConnections": ["A-B", "B-C", "C-D"], "revealedNodes": ["A", "D"], "maxGuesses": 5}', true),
  (2, 1, (SELECT id FROM game_templates LIMIT 1), 'Model Match Challenge', 'Pair real-world scenarios with appropriate mental models', 'Read each scenario and select the mental model that best applies. Think about cause and effect relationships.', '{"scenarios": [{"text": "Traffic jam causes delays", "correctModel": "feedback loop"}], "models": ["feedback loop", "inversion", "first principles"]}', true),
  (3, 1, (SELECT id FROM game_templates LIMIT 1), 'Edge Weight Mapper', 'Understand relationship importance through edge weights', 'Assign weights to connections based on their importance or strength. Thicker lines = stronger relationships.', '{"connections": [{"from": "stress", "to": "health", "weight": 0.8}, {"from": "exercise", "to": "health", "weight": 0.9}]}', true),
  (4, 1, (SELECT id FROM game_templates LIMIT 1), 'Problem Decomposition Tree', 'Break complex problems into manageable components', 'Take the complex problem and break it down into smaller, solvable pieces. Think hierarchically.', '{"problem": "Learn a new skill", "subproblems": ["identify skill", "find resources", "practice daily", "track progress"]}', true),
  (5, 1, (SELECT id FROM game_templates LIMIT 1), 'Pathfinder Logic Game', 'Explore conceptual graphs through strategic traversal', 'Navigate through the concept network to reach your goal. Choose your path wisely - some routes are more efficient.', '{"startNode": "problem", "goalNode": "solution", "pathOptions": ["direct", "exploratory", "systematic"]}', true);

-- Generate realistic game analytics for admin@gmail.com
WITH admin_user AS (
  SELECT id AS user_id FROM auth.users WHERE email = 'admin@gmail.com'
), game_sessions AS (
  -- Create 25 game sessions across different lecture games
  SELECT 
    lg.id as lecture_game_id,
    au.user_id,
    generate_series(1, 4) as session_num,
    lg.session_number,
    lg.lecture_number
  FROM lecture_games lg
  CROSS JOIN admin_user au
  WHERE lg.is_published = true
)
INSERT INTO game_analytics (
  user_id, 
  lecture_game_id, 
  started_at, 
  completed_at,
  time_spent_seconds,
  correct_connections,
  incorrect_connections,
  total_interactions,
  hints_used,
  completion_score,
  decision_path,
  final_solution
)
SELECT 
  gs.user_id,
  gs.lecture_game_id,
  now() - interval '1 day' * (random() * 30) as started_at,
  now() - interval '1 day' * (random() * 30) + interval '1 minute' * (5 + random() * 15) as completed_at,
  (60 + random() * 300)::int as time_spent_seconds, -- 1-6 minutes
  (3 + random() * 8)::int as correct_connections, -- 3-11 correct
  (0 + random() * 3)::int as incorrect_connections, -- 0-3 incorrect  
  (5 + random() * 15)::int as total_interactions, -- 5-20 interactions
  (0 + random() * 2)::int as hints_used, -- 0-2 hints
  (70 + random() * 30)::numeric as completion_score, -- 70-100% score
  jsonb_build_array(
    jsonb_build_object('step', 1, 'action', 'started', 'timestamp', extract(epoch from now())),
    jsonb_build_object('step', 2, 'action', 'connection_made', 'timestamp', extract(epoch from now()) + 30),
    jsonb_build_object('step', 3, 'action', 'completed', 'timestamp', extract(epoch from now()) + 180)
  ) as decision_path,
  jsonb_build_object(
    'finalConnections', array['A-B', 'B-C', 'C-D'],
    'accuracy', 85 + random() * 15,
    'efficiency', 75 + random() * 25
  ) as final_solution
FROM game_sessions gs;