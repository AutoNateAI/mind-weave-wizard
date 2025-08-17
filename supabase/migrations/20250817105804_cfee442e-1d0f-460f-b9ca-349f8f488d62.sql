-- Add some mock multiple choice interactions for admin@gmail.com
INSERT INTO multiple_choice_interactions (user_id, question_id, selected_option, is_correct, interaction_timestamp)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'admin@gmail.com'),
  gen_random_uuid(), -- We'll use random UUIDs for question_id since we don't have real questions
  CASE (random() * 4)::int 
    WHEN 0 THEN 'A'
    WHEN 1 THEN 'B' 
    WHEN 2 THEN 'C'
    ELSE 'D'
  END,
  random() > 0.25, -- 75% correct rate
  now() - interval '1 day' * (random() * 30) -- Random timestamps within last 30 days
FROM generate_series(1, 150); -- 150 interactions

-- Add some mock questions for display purposes
INSERT INTO multiple_choice_questions (session_number, lecture_number, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES
  (1, 1, 'What is the primary benefit of graph-based thinking?', 'Faster calculations', 'Better pattern recognition', 'More memory usage', 'Simpler algorithms', 'B'),
  (1, 2, 'Which type of graph represents hierarchical relationships?', 'Undirected graph', 'Directed acyclic graph', 'Complete graph', 'Bipartite graph', 'B'),
  (2, 1, 'What is a mental model?', 'A physical representation', 'A cognitive framework for understanding', 'A computer simulation', 'A mathematical equation', 'B'),
  (3, 1, 'What does edge weight typically represent?', 'Node size', 'Connection strength or importance', 'Graph complexity', 'Processing time', 'B'),
  (4, 1, 'What is the main goal of research decomposition?', 'Making problems harder', 'Breaking complex problems into manageable parts', 'Increasing complexity', 'Avoiding solutions', 'B'),
  (5, 1, 'What is depth-first search best for?', 'Finding shortest paths', 'Exploring deep relationships', 'Sorting data', 'Network routing', 'B'),
  (6, 1, 'Why are multiple perspectives important?', 'They confuse the issue', 'They provide comprehensive understanding', 'They slow down decisions', 'They are unnecessary', 'B')