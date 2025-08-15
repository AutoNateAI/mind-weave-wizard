-- Add missing prompts with correct JSON casting
INSERT INTO ai_prompts (prompt_name, prompt_category, prompt_template, prompt_description, variables, feature_page) VALUES
('course_planning_chat_system', 'course generation', 'You are an expert course planning assistant for the "AutoNateAI: Thinking Wizard Course" - a 10-session mental mastery journey focused on graph theory and thinking models.

FRAMEWORK CONSTRAINTS: You can ONLY help create variations of this specific course:
- Title: "AutoNateAI: Thinking Wizard Course" (variations allowed)
- Structure: Exactly 10 sessions about graph theory and mental models
- Session progression: Graph Theory → Mental Models → Space Between → Research Decomposition → Traversal Techniques → Multiple Perspectives → Pattern Recognition → Advanced Applications → Professional Integration → Mastery & Beyond
- Each session: 3 lectures (5-7 min each) with games and reflections

Your role: Help customize the themes, examples, and applications based on the user''s interests while maintaining this exact structure. Ask clarifying questions about their background, goals, and learning preferences to tailor the content.

Keep replies concise and conversational. Focus on how to adapt the course themes to their specific needs.', 'System prompt for course planning chat assistant', '[]'::jsonb, 'course_planning_tab')
ON CONFLICT (prompt_name) DO NOTHING;

INSERT INTO ai_prompts (prompt_name, prompt_category, prompt_template, prompt_description, variables, feature_page) VALUES
('slide_generation_prompt', 'content creation', 'Create detailed slide content for a lecture titled "{{lecture_title}}" with the session theme "{{session_theme}}".

This is part of the AutoNateAI: Thinking Wizard Course - a journey through graph theory and mental models.

Generate 4-6 slides with the following structure for each slide:
- Title: Clear, engaging slide title
- Content: MUST be formatted as bullet points separated by newlines. Each bullet point should start with "• " and be on its own line. This will be parsed on the frontend to display individual slide points.
- Slide Type: MUST be one of: "intro", "content", "example", "summary" (these are the only valid values)
- SVG Animation: Describe a simple SVG animation concept that would enhance this slide
- Speaker Notes: Detailed notes for the instructor

IMPORTANT: For the "content" field, format it as bullet points separated by newlines. Example format:
"• First key concept or point\n• Second important detail\n• Third supporting idea\n• Fourth practical application"

Return the response in this exact JSON format:
{
  "slides": [
    {
      "slide_number": 1,
      "title": "Slide Title",
      "content": "• First bullet point\n• Second bullet point\n• Third bullet point",
      "slide_type": "content",
      "svg_animation": "Description of animation concept",
      "speaker_notes": "Detailed instructor notes"
    }
  ]
}', 'Prompt for generating lecture slides with proper formatting', '[{"name": "lecture_title", "type": "text", "description": "Title of the lecture"}, {"name": "session_theme", "type": "text", "description": "Theme of the session"}]'::jsonb, 'content_creation_tab')
ON CONFLICT (prompt_name) DO NOTHING;

INSERT INTO ai_prompts (prompt_name, prompt_category, prompt_template, prompt_description, variables, feature_page) VALUES  
('assessment_generation_prompt', 'content creation', 'Based on the lecture "{{lecture_title}}" (Session {{session_number}}, Lecture {{lecture_number}}) with theme "{{session_theme}}" from the AutoNateAI: Thinking Wizard Course, generate comprehensive educational assessments.

This course teaches structured thinking using graphs, mental models, and cognitive frameworks. Create assessments that:
1. Test understanding of key concepts
2. Encourage practical application
3. Connect to the broader course themes
4. Build cognitive skills progressively

Create:
1. 3-5 multiple choice questions with 4 options each (test conceptual understanding)
2. 2-3 reflection questions that encourage deep thinking and personal application (question_number must be 1, 2, or 3)
3. 5-8 flashcards with key concepts (mix of definitions, examples, and applications)

CRITICAL CONSTRAINTS:
- correct_option MUST be one of: "A", "B", "C", or "D" (uppercase letters only)
- question_number for reflections MUST be 1, 2, or 3 (no duplicates within same session/lecture)

Return JSON format:
{
  "multiple_choice": [
    {
      "question_text": "Question focusing on practical application",
      "option_a": "Option A",
      "option_b": "Option B", 
      "option_c": "Option C",
      "option_d": "Option D",
      "correct_option": "A"
    }
  ],
  "reflection_questions": [
    {
      "question_number": 1,
      "question_text": "Thought-provoking question that connects to personal experience"
    }
  ],
  "flashcards": [
    {
      "title": "Key Concept",
      "content": "Clear definition with practical example",
      "concept_type": "definition",
      "order_index": 1
    }
  ]
}', 'Prompt for generating educational assessments (quizzes, reflections, flashcards)', '[{"name": "lecture_title", "type": "text", "description": "Title of the lecture"}, {"name": "session_number", "type": "number", "description": "Session number"}, {"name": "lecture_number", "type": "number", "description": "Lecture number"}, {"name": "session_theme", "type": "text", "description": "Theme of the session"}]'::jsonb, 'content_creation_tab')
ON CONFLICT (prompt_name) DO NOTHING;