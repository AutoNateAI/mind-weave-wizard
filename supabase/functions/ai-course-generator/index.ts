import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();
    console.log('AI Course Generator called with action:', action);

    switch (action) {
      case 'plan_course':
        return await planCourse(payload);
      case 'planning_chat':
        return await planningChat(payload);
      case 'generate_content':
        return await generateContent(payload);
      case 'edit_content':
        return await editContent(payload);
      case 'generate_assessments':
        return await generateAssessments(payload);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error in ai-course-generator:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function planCourse(payload: any) {
  const { courseDescription, chatHistory, userId } = payload;
  
  const prompt = `You are an expert course designer creating the "AutoNateAI: Thinking Wizard Course" - a 10-session mental mastery journey focused on graph theory and thinking models.

FRAMEWORK CONSTRAINTS: You MUST create courses that follow this exact structure:
- Exactly 10 sessions
- Each session has exactly 3 lectures (5-7 minutes each)  
- Each session follows: Lecture → Game → Reflection pattern repeated 3 times
- Sessions progress: Graph Theory → Mental Models → Space Between → Research Decomposition → Traversal Techniques → Multiple Perspectives → Pattern Recognition → Advanced Applications → Professional Integration → Mastery & Beyond

Base the session titles, themes, and lecture content on the conversation, but ALWAYS maintain the core framework above.

Course Description: ${courseDescription}
Chat History: ${JSON.stringify(chatHistory)}

Generate ONLY valid JSON (no markdown formatting) with this exact structure:
{
  "course": {
    "title": "Course Title",
    "description": "Brief description",
    "overview": "Detailed overview"
  },
  "sessions": [
    {
      "session_number": 1,
      "title": "Session Title",
      "description": "Session description", 
      "theme": "Theme or focus",
      "lectures": [
        {
          "lecture_number": 1,
          "title": "Lecture Title",
          "estimated_duration_minutes": 5
        },
        {
          "lecture_number": 2,
          "title": "Lecture Title",
          "estimated_duration_minutes": 6
        },
        {
          "lecture_number": 3,
          "title": "Lecture Title", 
          "estimated_duration_minutes": 7
        }
      ]
    }
  ]
}

Make sure each session has exactly 3 lectures, each 5-7 minutes long. Focus on engaging, practical content that builds progressively.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert educational content designer.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  let rawContent = data.choices[0].message.content;
  
  // Clean up markdown formatting if present
  if (rawContent.includes('```json')) {
    rawContent = rawContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
  }
  
  const generatedPlan = JSON.parse(rawContent);

  // Save to database
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert({
      title: generatedPlan.course.title,
      description: generatedPlan.course.description,
      overview: generatedPlan.course.overview,
      created_by: userId,
      status: 'draft'
    })
    .select()
    .single();

  if (courseError) throw courseError;

  // Save sessions and lectures
  for (const sessionData of generatedPlan.sessions) {
    const { data: session, error: sessionError } = await supabase
      .from('sessions_dynamic')
      .insert({
        course_id: course.id,
        session_number: sessionData.session_number,
        title: sessionData.title,
        description: sessionData.description,
        theme: sessionData.theme,
        order_index: sessionData.session_number
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    for (const lectureData of sessionData.lectures) {
      await supabase
        .from('lectures_dynamic')
        .insert({
          session_id: session.id,
          lecture_number: lectureData.lecture_number,
          title: lectureData.title,
          estimated_duration_minutes: lectureData.estimated_duration_minutes,
          order_index: lectureData.lecture_number
        });
    }
  }

  return new Response(JSON.stringify({ course, plan: generatedPlan }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function planningChat(payload: any) {
  const { chatHistory } = payload;

  const messages = [
    { role: 'system', content: `You are an expert course planning assistant for the "AutoNateAI: Thinking Wizard Course" - a 10-session mental mastery journey focused on graph theory and thinking models.

FRAMEWORK CONSTRAINTS: You can ONLY help create variations of this specific course:
- Title: "AutoNateAI: Thinking Wizard Course" (variations allowed)
- Structure: Exactly 10 sessions about graph theory and mental models
- Session progression: Graph Theory → Mental Models → Space Between → Research Decomposition → Traversal Techniques → Multiple Perspectives → Pattern Recognition → Advanced Applications → Professional Integration → Mastery & Beyond
- Each session: 3 lectures (5-7 min each) with games and reflections

Your role: Help customize the themes, examples, and applications based on the user's interests while maintaining this exact structure. Ask clarifying questions about their background, goals, and learning preferences to tailor the content.

Keep replies concise and conversational. Focus on how to adapt the course themes to their specific needs.` },
    ...chatHistory.map((m: any) => ({ role: m.role, content: m.content }))
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response right now.';

  return new Response(JSON.stringify({ reply }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}


async function generateContent(payload: any) {
  const { lectureId, lectureTitle, sessionTheme } = payload;

  const prompt = `Generate educational slide content for a lecture titled "${lectureTitle}" in a session about "${sessionTheme}".

Create 4-6 slides with engaging content. Each slide should have:
1. A clear title
2. Main content (2-3 key points)
3. An SVG animation concept description
4. Speaker notes for delivery

Make content visual, interactive, and memorable. Focus on practical application.

Return JSON in this format:
{
  "slides": [
    {
      "slide_number": 1,
      "title": "Slide Title",
      "content": "Main content points",
      "slide_type": "intro",
      "svg_animation": "Description of visual/animation concept",
      "speaker_notes": "Notes for presenter"
    }
  ]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert educational content creator specializing in visual presentations.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
    }),
  });

  const data = await response.json();
  const slideData = JSON.parse(data.choices[0].message.content);

  // Save slides to database
  for (const slide of slideData.slides) {
    await supabase
      .from('lecture_slides')
      .insert({
        lecture_id: lectureId,
        slide_number: slide.slide_number,
        title: slide.title,
        content: slide.content,
        slide_type: slide.slide_type,
        svg_animation: slide.svg_animation,
        speaker_notes: slide.speaker_notes
      });
  }

  return new Response(JSON.stringify({ slides: slideData.slides }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function editContent(payload: any) {
  const { contentId, contentType, editRequest, currentContent } = payload;

  const prompt = `Edit the following ${contentType} content based on this request: "${editRequest}"

Current content: ${JSON.stringify(currentContent)}

Return the updated content in the same JSON format as the input.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert content editor. Make precise, thoughtful edits based on user requests.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
    }),
  });

  const data = await response.json();
  const editedContent = JSON.parse(data.choices[0].message.content);

  return new Response(JSON.stringify({ editedContent }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generateAssessments(payload: any) {
  const { lectureId, lectureTitle, slideContent } = payload;

  const prompt = `Based on the lecture "${lectureTitle}" and slide content, generate educational assessments:

Slide Content: ${JSON.stringify(slideContent)}

Create:
1. 3-5 multiple choice questions with 4 options each
2. 2-3 reflection questions that encourage deep thinking
3. 5-8 flashcards with key concepts

Return JSON format:
{
  "multiple_choice": [
    {
      "question_text": "Question",
      "option_a": "Option A",
      "option_b": "Option B", 
      "option_c": "Option C",
      "option_d": "Option D",
      "correct_option": "a"
    }
  ],
  "reflection_questions": [
    {
      "question_number": 1,
      "question_text": "Reflection prompt"
    }
  ],
  "flashcards": [
    {
      "title": "Concept",
      "content": "Definition/explanation",
      "concept_type": "definition"
    }
  ]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert assessment designer creating engaging educational evaluations.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  const assessments = JSON.parse(data.choices[0].message.content);

  // Save to respective tables
  for (const mcq of assessments.multiple_choice) {
    await supabase
      .from('multiple_choice_questions')
      .insert({
        session_number: 1, // Will need to derive this properly
        lecture_number: 1, // Will need to derive this properly
        question_text: mcq.question_text,
        option_a: mcq.option_a,
        option_b: mcq.option_b,
        option_c: mcq.option_c,
        option_d: mcq.option_d,
        correct_option: mcq.correct_option
      });
  }

  return new Response(JSON.stringify({ assessments }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}