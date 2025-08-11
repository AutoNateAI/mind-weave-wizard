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
    console.log('🚀 AI Course Generator called with action:', action);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

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
    console.error('❌ Error in ai-course-generator:', error);
    console.error('❌ Error stack:', error.stack);
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
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
  const { lectureId, lectureTitle, sessionTheme, sessionNumber, lectureNumber } = payload;

  // Get lecture info to understand context
  console.log('🔍 Getting lecture data for ID:', lectureId);
  const { data: lectureData, error: lectureError } = await supabase
    .from('lectures_dynamic')
    .select('*, sessions_dynamic(*)')
    .eq('id', lectureId)
    .single();

  console.log('📊 Lecture data query result:', { data: lectureData, error: lectureError });

  if (lectureError) {
    console.error('❌ Failed to fetch lecture data:', lectureError);
    throw new Error(`Failed to fetch lecture data: ${lectureError.message}`);
  }

  const actualSessionNumber = sessionNumber || lectureData.sessions_dynamic?.session_number || 1;
  const actualLectureNumber = lectureNumber || lectureData.lecture_number || 1;

  console.log(`🎯 Generating content for lecture: ${lectureTitle} (Session ${actualSessionNumber}, Lecture ${actualLectureNumber})`);

  try {
    // Generate all content types in parallel
    const [slidesResult, assessmentsResult] = await Promise.allSettled([
      generateSlides(lectureId, lectureTitle, sessionTheme),
      generateAssessmentsContent(actualSessionNumber, actualLectureNumber, lectureTitle, sessionTheme)
    ]);

    console.log('📊 Generation results:', {
      slides: slidesResult.status,
      assessments: assessmentsResult.status
    });

    let slides = null;
    let assessments = null;

    if (slidesResult.status === 'fulfilled') {
      slides = slidesResult.value.slides;
      console.log('✅ Slides generated successfully');
    } else {
      console.error('❌ Slides generation failed:', slidesResult.reason);
    }

    if (assessmentsResult.status === 'fulfilled') {
      assessments = assessmentsResult.value;
      console.log('✅ Assessments generated successfully');
    } else {
      console.error('❌ Assessments generation failed:', assessmentsResult.reason);
    }

    return new Response(JSON.stringify({ 
      slides: slides,
      assessments: assessments,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in generateContent:', error);
    throw error;
  }
}

async function generateSlides(lectureId: string, lectureTitle: string, sessionTheme: string) {
  const prompt = `Create detailed slide content for a lecture titled "${lectureTitle}" with the session theme "${sessionTheme}".

This is part of the AutoNateAI: Thinking Wizard Course - a journey through graph theory and mental models.

Generate 4-6 slides with the following structure for each slide:
- Title: Clear, engaging slide title
- Content: Detailed bullet points or explanatory text (focus on practical applications and connections)
- Slide Type: One of: title, content, example, exercise, summary
- SVG Animation: Describe a simple SVG animation concept that would enhance this slide
- Speaker Notes: Detailed notes for the instructor

Return the response in this exact JSON format:
{
  "slides": [
    {
      "slide_number": 1,
      "title": "Slide Title",
      "content": "Detailed content with bullet points or paragraphs",
      "slide_type": "content",
      "svg_animation": "Description of animation concept",
      "speaker_notes": "Detailed instructor notes"
    }
  ]
}`;

  console.log('🤖 Making OpenAI request for slides...');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert educational content creator specializing in visual presentations for cognitive and mental model training. Always return valid JSON without any markdown formatting.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('📝 Raw OpenAI response for slides:', data.choices[0].message.content.substring(0, 200) + '...');

  let slideData;
  try {
    // Clean up any markdown formatting that might be in the response
    let content = data.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('🧹 Cleaned content for slides:', content.substring(0, 200) + '...');
    slideData = JSON.parse(content);
    console.log('✅ Successfully parsed slide data, slides count:', slideData.slides?.length);
    
    // Validate slide data structure
    if (!slideData.slides || !Array.isArray(slideData.slides)) {
      throw new Error('Invalid slide data structure: slides array is missing or not an array');
    }
    
    if (slideData.slides.length === 0) {
      throw new Error('No slides generated in response');
    }
    
    console.log('🔍 First slide structure:', JSON.stringify(slideData.slides[0], null, 2));
  } catch (e) {
    console.error('❌ Failed to parse slide data:', e);
    console.error('📄 Raw content that failed to parse:', data.choices[0].message.content);
    throw new Error(`Failed to parse slide generation response: ${e.message}`);
  }

  // Save slides to database with error handling
  console.log('💾 Saving slides to database...');
  const slideInserts = slideData.slides.map((slide, index) => {
    console.log(`📄 Processing slide ${index + 1}:`, {
      slide_number: slide.slide_number,
      title: slide.title,
      has_content: !!slide.content,
      content_length: slide.content?.length || 0
    });
    
    return {
      lecture_id: lectureId,
      slide_number: slide.slide_number,
      title: slide.title || `Slide ${slide.slide_number}`,
      content: slide.content || '',
      slide_type: slide.slide_type || 'content',
      svg_animation: slide.svg_animation || '',
      speaker_notes: slide.speaker_notes || ''
    };
  });

  console.log('📊 About to insert slides:', slideInserts.length, 'records');
  console.log('🔍 Sample insert data:', JSON.stringify(slideInserts[0], null, 2));

  const { data: insertedSlides, error: slideError } = await supabase
    .from('lecture_slides')
    .insert(slideInserts)
    .select();

  if (slideError) {
    console.error('❌ Failed to insert slides:', slideError);
    console.error('❌ Slide insert data that failed:', JSON.stringify(slideInserts, null, 2));
    throw new Error(`Failed to save slides: ${slideError.message}`);
  } else {
    console.log('✅ Successfully inserted slides:', insertedSlides?.length);
    console.log('🎯 Inserted slide IDs:', insertedSlides?.map(s => s.id));
  }

  return slideData;
}

async function generateAssessmentsContent(sessionNumber: number, lectureNumber: number, lectureTitle: string, sessionTheme: string) {
  const prompt = `Based on the lecture "${lectureTitle}" (Session ${sessionNumber}, Lecture ${lectureNumber}) with theme "${sessionTheme}" from the AutoNateAI: Thinking Wizard Course, generate comprehensive educational assessments.

This course teaches structured thinking using graphs, mental models, and cognitive frameworks. Create assessments that:
1. Test understanding of key concepts
2. Encourage practical application
3. Connect to the broader course themes
4. Build cognitive skills progressively

Create:
1. 3-5 multiple choice questions with 4 options each (test conceptual understanding)
2. 2-3 reflection questions that encourage deep thinking and personal application
3. 5-8 flashcards with key concepts (mix of definitions, examples, and applications)

Return JSON format:
{
  "multiple_choice": [
    {
      "question_text": "Question focusing on practical application",
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
}`;

  console.log('🤖 Making OpenAI request for assessments...');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert assessment designer creating engaging educational evaluations for cognitive skill development. Always return valid JSON without any markdown formatting.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('📝 Raw OpenAI response for assessments:', data.choices[0].message.content.substring(0, 200) + '...');

  let assessments;
  try {
    let content = data.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('🧹 Cleaned content for assessments:', content.substring(0, 200) + '...');
    assessments = JSON.parse(content);
    console.log('✅ Successfully parsed assessment data:', {
      mcq_count: assessments.multiple_choice?.length,
      reflection_count: assessments.reflection_questions?.length,
      flashcard_count: assessments.flashcards?.length
    });
  } catch (e) {
    console.error('❌ Failed to parse assessment data:', e);
    console.error('📄 Raw content that failed to parse:', data.choices[0].message.content);
    throw new Error(`Failed to parse assessment generation response: ${e.message}`);
  }

  // Prepare bulk inserts with validation
  console.log('💾 Preparing database inserts...');
  
  const mcqInserts = (assessments.multiple_choice || []).map(mcq => ({
    session_number: sessionNumber,
    lecture_number: lectureNumber,
    question_text: mcq.question_text,
    option_a: mcq.option_a,
    option_b: mcq.option_b,
    option_c: mcq.option_c,
    option_d: mcq.option_d,
    correct_option: mcq.correct_option
  }));

  const reflectionInserts = (assessments.reflection_questions || []).map(rq => ({
    session_number: sessionNumber,
    lecture_number: lectureNumber,
    question_number: rq.question_number,
    question_text: rq.question_text
  }));

  const flashcardInserts = (assessments.flashcards || []).map((fc, index) => ({
    session_number: sessionNumber,
    lecture_number: lectureNumber,
    title: fc.title,
    content: fc.content,
    concept_type: fc.concept_type || 'definition',
    order_index: fc.order_index || index + 1
  }));

  console.log('📊 Insert counts:', {
    mcq: mcqInserts.length,
    reflections: reflectionInserts.length,
    flashcards: flashcardInserts.length
  });

  // Execute all inserts in parallel with detailed error logging
  const insertPromises = [];
  
  if (mcqInserts.length > 0) {
    insertPromises.push(
      supabase.from('multiple_choice_questions').insert(mcqInserts).select()
        .then(result => ({ type: 'mcq', result }))
    );
  }
  
  if (reflectionInserts.length > 0) {
    insertPromises.push(
      supabase.from('reflection_questions').insert(reflectionInserts).select()
        .then(result => ({ type: 'reflections', result }))
    );
  }
  
  if (flashcardInserts.length > 0) {
    insertPromises.push(
      supabase.from('flashcards').insert(flashcardInserts).select()
        .then(result => ({ type: 'flashcards', result }))
    );
  }

  const insertResults = await Promise.allSettled(insertPromises);

  // Log detailed results
  insertResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const { type, result: dbResult } = result.value;
      if (dbResult.error) {
        console.error(`❌ Error inserting ${type}:`, dbResult.error);
      } else {
        console.log(`✅ Successfully inserted ${type}:`, dbResult.data?.length, 'records');
      }
    } else {
      console.error(`❌ Promise rejected for insert ${index}:`, result.reason);
    }
  });

  return assessments;
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
  const { lectureId, lectureTitle, slideContent, sessionNumber, lectureNumber } = payload;

  const result = await generateAssessmentsContent(
    sessionNumber || 1, 
    lectureNumber || 1, 
    lectureTitle, 
    'Assessment Generation'
  );

  return new Response(JSON.stringify({ assessments: result }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}