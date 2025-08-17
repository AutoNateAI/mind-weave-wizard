-- Create dynamic sessions for all 10 sessions from the course structure
INSERT INTO sessions_dynamic (session_number, title, theme, description, order_index, course_id)
VALUES
  (1, 'Introduction to Graph Theory', 'Everything is connected.', 'Learn about nodes, edges, and relationships as the foundation of structured thinking.', 1, NULL),
  (2, 'Mental Models & Mapping', 'You don''t see with your eyes—you see with your models.', 'Discover how mental models work as cognitive frameworks for understanding the world.', 2, NULL),
  (3, 'The Space Between', 'The meaning isn''t in the nodes—it''s in the edges.', 'Explore implicit vs explicit relationships and the gaps in understanding.', 3, NULL),
  (4, 'Research Decomposition', 'Even the impossible becomes possible when you break it down right.', 'Learn to chunk big questions into manageable sub-problems using graph-based thinking.', 4, NULL),
  (5, 'Traversal Techniques', 'Insight is a path you learn to walk.', 'Master DFS, BFS and strategic approaches to exploring ideas and solving problems.', 5, NULL),
  (6, 'Multiple Perspectives', 'Truth is multi-dimensional. So should your thinking be.', 'Learn to rotate your mental objects and see from different viewpoints.', 6, NULL),
  (7, 'Pattern Recognition', 'Wisdom is pattern fluency.', 'Identify graph motifs, feedback loops, and cognitive patterns in complex systems.', 7, NULL),
  (8, 'Advanced Applications', 'Now use it to solve something real.', 'Apply graph thinking to life decisions, career choices, and personal challenges.', 8, NULL),
  (9, 'Professional Integration', 'Make your thinking your superpower in any room.', 'Learn how professionals use models and design your own productivity systems.', 9, NULL),
  (10, 'Mastery & Beyond', 'You are now the architect of your thinking.', 'Reflect on your journey and plan how to continue developing your thinking skills.', 10, NULL)
ON CONFLICT (session_number) 
DO UPDATE SET 
  title = EXCLUDED.title,
  theme = EXCLUDED.theme,
  description = EXCLUDED.description,
  updated_at = now();

-- Create lectures for each session (3 lectures per session)
WITH session_lectures AS (
  SELECT 
    s.id as session_id,
    s.session_number,
    lecture_info.lecture_number,
    lecture_info.title,
    lecture_info.order_index
  FROM sessions_dynamic s
  CROSS JOIN (
    VALUES 
      (1, 'Introduction & Core Concepts', 1),
      (2, 'Hands-On Exploration', 2), 
      (3, 'Integration & Reflection', 3)
  ) AS lecture_info(lecture_number, title, order_index)
)
INSERT INTO lectures_dynamic (session_id, lecture_number, title, order_index, estimated_duration_minutes)
SELECT 
  sl.session_id,
  sl.lecture_number,
  CASE 
    WHEN sl.session_number = 1 AND sl.lecture_number = 1 THEN 'What is a graph? Nodes, edges, and relationships'
    WHEN sl.session_number = 1 AND sl.lecture_number = 2 THEN 'Directed vs undirected graphs, weighted relationships'
    WHEN sl.session_number = 1 AND sl.lecture_number = 3 THEN 'Why this matters: Graphs mirror intelligence'
    WHEN sl.session_number = 2 AND sl.lecture_number = 1 THEN 'What is a mental model? Mental models as lenses'
    WHEN sl.session_number = 2 AND sl.lecture_number = 2 THEN 'Building relational mental models using graphs'
    WHEN sl.session_number = 2 AND sl.lecture_number = 3 THEN 'Systems thinking, first-principles, second-order consequences'
    ELSE sl.title || ' - Session ' || sl.session_number
  END as title,
  sl.order_index,
  CASE sl.lecture_number
    WHEN 1 THEN 7  -- 7 minutes for first lecture
    WHEN 2 THEN 5  -- 5 minutes for second lecture  
    WHEN 3 THEN 6  -- 6 minutes for third lecture
  END as estimated_duration_minutes
FROM session_lectures sl
ON CONFLICT (session_id, lecture_number)
DO UPDATE SET 
  title = EXCLUDED.title,
  updated_at = now();