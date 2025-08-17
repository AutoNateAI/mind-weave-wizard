-- Idempotent upsert of reflection questions (sessions 1-10, lecture 1-3, question #1)
WITH v(session_number, lecture_number, question_number, question_text) AS (
  VALUES
    -- Session 1
    (1, 1, 1, 'Where in my life have I been focusing on dots, not the connections?'),
    (1, 2, 1, 'What invisible links shape my daily decisions?'),
    (1, 3, 1, 'How can I map my inner mental web to better understand myself?'),

    -- Session 2
    (2, 1, 1, 'What model have I unknowingly been using... and is it outdated?'),
    (2, 2, 1, 'What flaws or blindspots exist in my current approach to handling stress?'),
    (2, 3, 1, 'How has my mental map evolved since starting this course?'),

    -- Session 3
    (3, 1, 1, 'What tension exists in the space between my goals and my habits?'),
    (3, 2, 1, 'What surprising bridges can I build between seemingly unrelated ideas?'),
    (3, 3, 1, 'What unresolved contradiction can I now structure to resolve?'),

    -- Session 4
    (4, 1, 1, 'What if every big problem I feared was just poorly decomposed?'),
    (4, 2, 1, 'What insights are buried because I have been thinking too linearly?'),
    (4, 3, 1, 'How can I better break down complex research questions?'),

    -- Session 5
    (5, 1, 1, 'Where do I jump too quickly instead of exploring deeply?'),
    (5, 2, 1, 'What is my default mode of exploration? Rushed? Circular?'),
    (5, 3, 1, 'What alternate paths could I have taken in past decisions?'),

    -- Session 6
    (6, 1, 1, 'What perspective have I never let myself entertain?'),
    (6, 2, 1, 'Where do I polarize instead of integrate different viewpoints?'),
    (6, 3, 1, 'How deeply have I actually tried to understand others?'),

    -- Session 7
    (7, 1, 1, 'Where in my life do feedback loops live?'),
    (7, 2, 1, 'How can I become a better signal seeker?'),
    (7, 3, 1, 'What is my first personal Thinking Pattern?'),

    -- Session 8
    (8, 1, 1, 'What new possibility just became visible?'),
    (8, 2, 1, 'What is misaligned—and fixable—in my life?'),
    (8, 3, 1, 'What did I learn about my own clarity under pressure?'),

    -- Session 9
    (9, 1, 1, 'Where can I outperform the average using these models?'),
    (9, 2, 1, 'What is my unique edge?'),
    (9, 3, 1, 'How clearly can I teach what I now know?'),

    -- Session 10
    (10, 1, 1, 'What is my core cognitive identity?'),
    (10, 2, 1, 'What can I not solve... now that I know how to think?'),
    (10, 3, 1, 'What mindset am I taking into the rest of my life?')
)
INSERT INTO reflection_questions AS rq (session_number, lecture_number, question_number, question_text)
SELECT session_number, lecture_number, question_number, question_text FROM v
ON CONFLICT (session_number, lecture_number, question_number)
DO UPDATE SET question_text = EXCLUDED.question_text, updated_at = now();

-- Insert missing user_reflections for admin@gmail.com for question_number = 1 only
WITH admin_user AS (
  SELECT id AS user_id FROM auth.users WHERE email = 'admin@gmail.com'
)
INSERT INTO user_reflections (user_id, reflection_question_id, session_number, lecture_number, reflection_content)
SELECT 
  au.user_id,
  rq.id,
  rq.session_number,
  rq.lecture_number,
  CASE 
    WHEN rq.session_number = 1 AND rq.lecture_number = 1 THEN 'I realize I often focus on individual tasks without seeing how they connect to my larger goals. This fragmented approach has been limiting my effectiveness.'
    WHEN rq.session_number = 1 AND rq.lecture_number = 2 THEN 'My past experiences and emotional reactions create invisible patterns that influence my decision-making more than I previously understood.'
    WHEN rq.session_number = 1 AND rq.lecture_number = 3 THEN 'Creating a visual map of my interests, values, and actions reveals surprising connections and gaps I had not noticed before.'
    WHEN rq.session_number = 2 AND rq.lecture_number = 1 THEN 'I have been using a scarcity mindset that may have served me in the past but now limits my ability to see opportunities and take calculated risks.'
    WHEN rq.session_number = 2 AND rq.lecture_number = 2 THEN 'I tend to catastrophize and jump to worst-case scenarios too quickly, which creates unnecessary stress and clouds my judgment.'
    WHEN rq.session_number = 3 AND rq.lecture_number = 1 THEN 'There is a significant gap between my stated goal of better health and my actual daily habits around sleep and exercise.'
    WHEN rq.session_number = 4 AND rq.lecture_number = 1 THEN 'Breaking down my career transition into smaller, actionable steps makes it feel much more manageable and less overwhelming.'
    WHEN rq.session_number = 5 AND rq.lecture_number = 1 THEN 'I often rush to solutions without fully exploring the problem space, missing important nuances and alternative approaches.'
    WHEN rq.session_number = 6 AND rq.lecture_number = 1 THEN 'I rarely consider how my decisions might look from my family members perspectives, which could improve our communication.'
    WHEN rq.session_number = 7 AND rq.lecture_number = 1 THEN 'My perfectionism creates a negative feedback loop where fear of failure prevents me from starting new projects.'
    WHEN rq.session_number = 8 AND rq.lecture_number = 1 THEN 'I can see new possibilities for combining my technical skills with my interest in education to create something meaningful.'
    WHEN rq.session_number = 9 AND rq.lecture_number = 1 THEN 'These thinking models give me a systematic approach that most people lack, allowing me to analyze problems more thoroughly.'
    WHEN rq.session_number = 10 AND rq.lecture_number = 1 THEN 'I am becoming someone who thinks systematically, considers multiple perspectives, and breaks down complex problems methodically.'
    ELSE 'This reflection has helped me think more deeply about the connections and patterns in my life.'
  END
FROM reflection_questions rq
CROSS JOIN admin_user au
LEFT JOIN user_reflections ur 
  ON ur.user_id = au.user_id AND ur.reflection_question_id = rq.id
WHERE rq.question_number = 1
  AND au.user_id IS NOT NULL
  AND ur.id IS NULL;