-- First create a basic game template for our mock games
INSERT INTO game_templates (id, name, description, category, template_data, mechanics, content_slots)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Graph Connection Game',
  'Basic graph connection template for critical thinking exercises',
  'critical-thinking',
  '{"nodes": [], "edges": [], "targetConnections": 5}',
  '{"connectionTypes": ["conceptual", "causal", "hierarchical"], "hintSystem": true, "timeLimit": false}',
  '[{"id": "concepts", "type": "array", "description": "Main concepts to connect"}]'
)
ON CONFLICT (id) DO NOTHING;

-- Create lecture games for sessions 1-6 using the template
INSERT INTO lecture_games (session_number, lecture_number, order_index, title, description, game_template_id, game_data, is_published)
SELECT 
  s.session_num,
  l.lecture_num,
  ((s.session_num - 1) * 9) + ((l.lecture_num - 1) * 3) + g.game_num,
  CASE g.game_num
    WHEN 1 THEN 'Link the Concepts - Session ' || s.session_num || ' Lecture ' || l.lecture_num
    WHEN 2 THEN 'Pattern Hunter - Session ' || s.session_num || ' Lecture ' || l.lecture_num
    WHEN 3 THEN 'Mental Model Builder - Session ' || s.session_num || ' Lecture ' || l.lecture_num
  END,
  CASE g.game_num
    WHEN 1 THEN 'Connect related concepts to build understanding'
    WHEN 2 THEN 'Identify patterns in complex information'
    WHEN 3 THEN 'Construct mental models for problem solving'
  END,
  '550e8400-e29b-41d4-a716-446655440001',
  jsonb_build_object(
    'nodes', jsonb_build_array(
      jsonb_build_object('id', 'concept1', 'label', 'Core Concept'),
      jsonb_build_object('id', 'concept2', 'label', 'Related Idea'),
      jsonb_build_object('id', 'concept3', 'label', 'Pattern Element')
    ),
    'targetConnections', 3 + g.game_num
  ),
  true
FROM 
  (SELECT generate_series(1, 6) as session_num) s,
  (SELECT generate_series(1, 3) as lecture_num) l,
  (SELECT generate_series(1, 3) as game_num) g
ON CONFLICT DO NOTHING;